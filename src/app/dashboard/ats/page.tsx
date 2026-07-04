"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AtsAnalysis from "@/components/AtsAnalysis";
import { computeAtsScore } from "@/lib/ats";
import { EMPTY_CONTENT, ResumeContent, ContactInfo } from "@/lib/types";

interface ResumeRow {
  id: string;
  title: string;
  role: string;
  status: string;
  contact: any;
  content: any;
}

type Mode = "saved" | "upload";

// ATS Checker tool. Score a saved resume, OR upload a PDF/Word file and score
// that. Either way the score comes from the same deterministic computeAtsScore,
// so an uploaded file scores exactly like a saved resume would.
export default function AtsCheckerPage() {
  const [mode, setMode] = useState<Mode>("saved");

  // Saved-resume state.
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  // Uploaded-file state.
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<{
    fileName: string;
    contact: Partial<ContactInfo>;
    content: ResumeContent;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = await res.json();
        const rows: ResumeRow[] = data.resumes ?? [];
        setResumes(rows);
        const wantedId = new URLSearchParams(window.location.search).get("id");
        const wanted = wantedId && rows.find((r) => r.id === wantedId);
        const firstReady = wanted || rows.find((r) => r.content) || rows[0];
        if (firstReady) setSelectedId(firstReady.id);
      }
      setLoading(false);
    })();
  }, []);

  const selected = resumes.find((r) => r.id === selectedId) || null;

  // ATS result for whichever source is active.
  const ats = useMemo(() => {
    if (mode === "upload") {
      if (!uploaded) return null;
      return computeAtsScore(uploaded.contact, uploaded.content);
    }
    if (!selected || !selected.content) return null;
    const contact = (selected.contact as Partial<ContactInfo>) ?? {};
    const content: ResumeContent = {
      ...EMPTY_CONTENT,
      ...(selected.content as ResumeContent),
    };
    return computeAtsScore(contact, content);
  }, [mode, uploaded, selected]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = ""; // allow re-selecting same file
    if (!file) return;

    setUploadError(null);
    setUploaded(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/ats/parse", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data?.error || "Could not read this file. Try another.");
      } else {
        setUploaded({
          fileName: file.name,
          contact: data.contact ?? {},
          content: { ...EMPTY_CONTENT, ...(data.content ?? {}) },
        });
      }
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">ATS Checker</h1>
          <p className="text-sm text-stone-500">
            See how ready a resume is to pass automated recruiter screening.
          </p>
        </div>

        {/* Source toggle */}
        <div className="mt-6 inline-flex rounded-xl border border-stone-200 bg-white/70 p-1">
          <button
            onClick={() => setMode("saved")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              mode === "saved"
                ? "bg-brand-600 text-white"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Saved resume
          </button>
          <button
            onClick={() => setMode("upload")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              mode === "upload"
                ? "bg-brand-600 text-white"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Upload a file
          </button>
        </div>

        {/* Source input */}
        <div className="mt-4 glass-card p-5 sm:p-6">
          {mode === "saved" ? (
            <>
              <label className="block text-sm font-semibold text-stone-700">
                Choose a resume
              </label>
              {loading ? (
                <div className="mt-2 h-11 w-full max-w-md animate-pulse rounded-lg bg-stone-200/60" />
              ) : resumes.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500">
                  You don&apos;t have any resumes yet.{" "}
                  <Link href="/dashboard" className="font-semibold text-brand-600 underline">
                    Create one
                  </Link>{" "}
                  or switch to &ldquo;Upload a file&rdquo;.
                </p>
              ) : (
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="mt-2 w-full max-w-md rounded-lg border border-stone-300 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                      {r.content ? "" : " (draft, not generated yet)"}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <>
              <label className="block text-sm font-semibold text-stone-700">
                Upload a resume to check (.pdf, .docx)
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {uploading ? "Reading file…" : "Choose file"}
                </button>
                {uploaded && !uploading && (
                  <span className="text-sm text-stone-600">
                    Scored: <span className="font-medium">{uploaded.fileName}</span>
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-xs text-stone-400">
                Your file is read to score it and is not saved.
              </p>
              {uploadError && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {uploadError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Score */}
        {ats ? (
          <div className="mt-6">
            <AtsAnalysis
              key={mode === "upload" ? uploaded?.fileName : selectedId}
              result={ats}
            />
          </div>
        ) : mode === "saved" && !loading && selected && !selected.content ? (
          <div className="mt-6 glass-card p-6 text-center text-sm text-stone-500">
            This resume hasn&apos;t been generated yet.{" "}
            <Link
              href={`/resume/${selected.id}/edit`}
              className="font-semibold text-brand-600 underline"
            >
              Fill it in and generate
            </Link>{" "}
            to get an ATS score.
          </div>
        ) : mode === "upload" && uploading ? (
          <div className="mt-6 glass-card p-6 text-center text-sm text-stone-500">
            Reading and scoring your file…
          </div>
        ) : null}
      </main>
    </div>
  );
}
