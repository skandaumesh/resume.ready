"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import JobMatchPanel from "@/components/JobMatchPanel";
import { computeJobMatch } from "@/lib/jobMatch";
import { renderResumeHtml } from "@/lib/resumeHtml";
import { DEFAULT_TEMPLATE } from "@/lib/templates";
import { EMPTY_CONTENT, ResumeContent, ContactInfo } from "@/lib/types";

interface ResumeRow {
  id: string;
  title: string;
  role: string;
  status: string;
  content: any;
}

type Mode = "saved" | "upload";

interface EnhanceResult {
  contact: Partial<ContactInfo>;
  original: ResumeContent;
  tailored: ResumeContent;
  jobDescription: string;
  savedId?: string;
  before: number;
  after: number;
}

const color = (s: number) =>
  s >= 70 ? "text-green-600" : s >= 45 ? "text-amber-600" : "text-red-600";

// JD Enhancer. Two modes:
//  - Saved resume: pick one and use the live JobMatchPanel (paste JD, tailor).
//  - Upload: upload a resume file + a JD (text or file); the server parses,
//    tailors it to the JD truthfully (no fabricated experience), and returns the
//    before/after match plus the corrected resume.
export default function JdEnhancerPage() {
  const [mode, setMode] = useState<Mode>("saved");

  // Saved-resume state.
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  // Upload state.
  const resumeRef = useRef<HTMLInputElement>(null);
  const jobRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobText, setJobText] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnhanceResult | null>(null);

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
  const savedContent: ResumeContent | null =
    selected && selected.content
      ? { ...EMPTY_CONTENT, ...(selected.content as ResumeContent) }
      : null;

  async function runEnhance() {
    if (!resumeFile) {
      setError("Please choose your resume file first.");
      return;
    }
    if (jobText.trim().length < 20 && !jobFile) {
      setError("Paste the job description or upload it as a file.");
      return;
    }
    setError(null);
    setResult(null);
    setRunning(true);

    const fd = new FormData();
    fd.append("resumeFile", resumeFile);
    if (jobFile) fd.append("jobFile", jobFile);
    if (jobText.trim()) fd.append("jobText", jobText.trim());
    fd.append("save", "1"); // persist the tailored result so it can be downloaded

    try {
      const res = await fetch("/api/enhance", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not enhance the resume. Please try again.");
        return;
      }
      const original: ResumeContent = { ...EMPTY_CONTENT, ...(data.original ?? {}) };
      const tailored: ResumeContent = { ...EMPTY_CONTENT, ...(data.tailored ?? {}) };
      const jd: string = data.jobDescription ?? jobText;
      setResult({
        contact: data.contact ?? {},
        original,
        tailored,
        jobDescription: jd,
        savedId: data.savedId,
        before: computeJobMatch(original, jd).score,
        after: computeJobMatch(tailored, jd).score,
      });
    } catch {
      setError("Request failed. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  const tailoredMatch = result ? computeJobMatch(result.tailored, result.jobDescription) : null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-screen-lg px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">JD Enhancer</h1>
          <p className="text-sm text-stone-500">
            Match a resume against a job description and let the AI tailor it to
            fit, truthfully, without inventing experience you don&apos;t have.
          </p>
        </div>

        {/* Source toggle */}
        <div className="mt-6 inline-flex rounded-xl border border-stone-200 bg-white/70 p-1">
          <button
            onClick={() => setMode("saved")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              mode === "saved" ? "bg-brand-600 text-white" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Saved resume
          </button>
          <button
            onClick={() => setMode("upload")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              mode === "upload" ? "bg-brand-600 text-white" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Upload resume + JD
          </button>
        </div>

        {mode === "saved" ? (
          <>
            <div className="mt-4 glass-card p-5 sm:p-6">
              <label className="block text-sm font-semibold text-stone-700">
                Choose a resume to enhance
              </label>
              {loading ? (
                <div className="mt-2 h-11 w-full max-w-md animate-pulse rounded-lg bg-stone-200/60" />
              ) : resumes.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500">
                  You don&apos;t have any resumes yet.{" "}
                  <Link href="/dashboard" className="font-semibold text-brand-600 underline">
                    Create one
                  </Link>{" "}
                  or switch to &ldquo;Upload resume + JD&rdquo;.
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
            </div>

            {!loading && selected && (
              <div className="mt-6">
                {savedContent ? (
                  <JobMatchPanel key={selected.id} resumeId={selected.id} content={savedContent} />
                ) : (
                  <div className="glass-card p-6 text-center text-sm text-stone-500">
                    This resume hasn&apos;t been generated yet.{" "}
                    <Link
                      href={`/resume/${selected.id}/edit`}
                      className="font-semibold text-brand-600 underline"
                    >
                      Fill it in and generate
                    </Link>{" "}
                    before enhancing it.
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Upload inputs */}
            <div className="mt-4 glass-card p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Resume file */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700">
                    Your resume (.pdf, .docx)
                  </label>
                  <button
                    onClick={() => resumeRef.current?.click()}
                    className="mt-2 w-full rounded-xl border border-stone-300 bg-white/80 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-white"
                  >
                    {resumeFile ? resumeFile.name : "Choose resume file"}
                  </button>
                  <input
                    ref={resumeRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </div>

                {/* Optional JD file */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700">
                    Job description file (optional)
                  </label>
                  <button
                    onClick={() => jobRef.current?.click()}
                    className="mt-2 w-full rounded-xl border border-stone-300 bg-white/80 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-white"
                  >
                    {jobFile ? jobFile.name : "Choose JD file"}
                  </button>
                  <input
                    ref={jobRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setJobFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </div>
              </div>

              <label className="mt-5 block text-sm font-semibold text-stone-700">
                Or paste the job description
              </label>
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the full job description here…"
                rows={6}
                className="mt-2 w-full rounded-lg border border-stone-300 bg-white/80 p-3 text-sm outline-none focus:border-brand-500"
              />

              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={runEnhance}
                  disabled={running}
                  className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {running ? "Checking & enhancing… (up to a minute)" : "Check & enhance"}
                </button>
                <span className="text-xs text-stone-400">
                  The tailored resume is saved so you can download it.
                </span>
              </div>

              {error && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
              )}
            </div>

            {/* Result */}
            {result && (
              <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
                <div className="flex flex-col gap-4">
                  <div className="glass-card p-5">
                    <p className="text-sm text-stone-600">
                      Match improved from{" "}
                      <span className={`font-bold ${color(result.before)}`}>{result.before}%</span>{" "}
                      to{" "}
                      <span className={`text-2xl font-extrabold ${color(result.after)}`}>
                        {result.after}%
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      Scores are computed from your resume text against the JD
                      keywords, so the improvement is real, not estimated.
                    </p>
                    {result.savedId && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/resume/${result.savedId}/preview`}
                          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                        >
                          View & download
                        </Link>
                        <Link
                          href={`/resume/${result.savedId}/edit`}
                          className="rounded-xl border border-stone-300 bg-white/70 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white"
                        >
                          Edit
                        </Link>
                      </div>
                    )}
                  </div>

                  {tailoredMatch && tailoredMatch.missing.length > 0 && (
                    <div className="glass-card p-5">
                      <p className="text-sm font-semibold text-stone-800">
                        Still missing (only add if genuinely true for you)
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tailoredMatch.missing.map((k) => (
                          <span
                            key={k}
                            className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-stone-400">
                    The AI rephrased your resume to match the job&apos;s language and only added
                    skills you plausibly already have. Review every line to make sure it stays
                    true to you.
                  </p>
                </div>

                {/* Corrected resume as an A4 preview */}
                <div className="overflow-auto rounded-2xl bg-stone-200/60 p-4 shadow-inner sm:p-6 lg:max-h-[calc(100vh-9rem)]">
                  <div className="mx-auto aspect-[210/297] w-full max-w-[794px] overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-black/5">
                    <iframe
                      title="Enhanced resume preview"
                      srcDoc={renderResumeHtml(result.contact, result.tailored, DEFAULT_TEMPLATE)}
                      className="h-full w-full bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
