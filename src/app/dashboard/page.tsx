"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import DeleteResumeButton from "@/components/DeleteResumeButton";

import { renderResumeHtml } from "@/lib/resumeHtml";
import { TEMPLATES } from "@/lib/templates";
import { EMPTY_CONTENT } from "@/lib/types";

const INK = "#1b1710";
const LIME = "#d9f24e";

interface ResumeRow {
  id: string;
  title: string;
  role: string;
  status: string;
  updatedAt: string;
  contact: any;
  content: any;
  template: string | null;
}

// Soft sage / cream tints, assigned stably per resume id.
const TINTS = ["#f5f2e6", "#e2e9d5", "#eef0e2", "#f0ead7", "#e6ecda", "#f3eee0"];

function tintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return TINTS[Math.abs(hash) % TINTS.length];
}

export default function DashboardPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes ?? []);
      }
      setLoading(false);
    })();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a PDF or Word document (.pdf, .doc, .docx).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5 MB.");
      return;
    }

    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resumes/import", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { id } = await res.json();
        router.push(`/resume/${id}/edit`);
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError(data?.error || "Could not import resume. Please try again.");
        setUploading(false);
      }
    } catch {
      setUploadError("Upload failed. Please check your connection and try again.");
      setUploading(false);
    }

    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        {/* heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                Your resumes
              </h1>
              {!loading && (
                <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-stone-600 shadow-sm">
                  {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-stone-500">
              Create, polish, and download. Everything lives here.
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-block rounded-full px-7 py-3.5 text-center text-sm font-bold text-[#faf6ee] shadow-[3px_3px_0_0_#d9f24e] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#d9f24e]"
            style={{ backgroundColor: INK }}
          >
            + New resume
          </Link>
        </div>

        {/* start cards */}
        {!loading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="group relative overflow-hidden rounded-[28px] p-7 text-left transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-60"
              style={{ backgroundColor: "#f4f1e4" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    Import
                  </span>
                  <p className="mt-4 text-xl font-extrabold text-stone-900">
                    {uploading ? "Importing…" : "I already have a resume"}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {uploading
                      ? "Reading your document and filling in the fields…"
                      : "Upload a .pdf or .docx and we'll parse and rebuild it."}
                  </p>
                </div>
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#faf6ee] transition group-hover:scale-110"
                  style={{ backgroundColor: INK }}
                >
                  {uploading ? (
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M12 3v12" />
                      <path d="m7 10 5 5 5-5" />
                      <path d="M5 21h14" />
                    </svg>
                  )}
                </span>
              </div>
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Link
              href="/dashboard/new"
              className="group relative overflow-hidden rounded-[28px] p-7 transition hover:-translate-y-1 hover:shadow-xl"
              style={{ backgroundColor: "#e5edcb" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    Create
                  </span>
                  <p className="mt-4 text-xl font-extrabold text-stone-900">
                    Start from scratch
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Pick a role, answer a few questions, let the AI write it.
                  </p>
                </div>
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-stone-900 transition group-hover:rotate-90"
                  style={{ backgroundColor: LIME }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-5 w-5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        )}

        {uploadError && (
          <p className="mt-4 rounded-2xl bg-red-100 p-3.5 text-sm font-medium text-red-800">
            {uploadError}
          </p>
        )}

        {/* list */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[380px] animate-pulse rounded-[28px]"
                style={{ backgroundColor: TINTS[i % TINTS.length] }}
              />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="mt-8 rounded-[28px] border-2 border-dashed border-stone-300 p-12 text-center">
            <p className="font-semibold text-stone-600">No resumes yet.</p>
            <p className="mt-1 text-sm text-stone-400">
              Use one of the cards above to get started.
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resumes.map((r) => {
              const contact = r.contact || {};
              const content = r.content || EMPTY_CONTENT;
              const templateId = r.template || "classic";
              const template =
                TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
              const html = renderResumeHtml(contact, content, template.id);
              const generated = r.status === "generated";

              const formattedDate = new Date(r.updatedAt).toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "short", year: "numeric" },
              );

              return (
                <li
                  key={r.id}
                  className="group flex flex-col overflow-hidden rounded-[28px] transition hover:-translate-y-1.5 hover:shadow-xl"
                  style={{ backgroundColor: tintFor(r.id) }}
                >
                  {/* thumbnail */}
                  <div className="relative mx-4 mt-4 h-60 overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div
                      className="pointer-events-none absolute left-1/2 top-2"
                      style={{
                        width: "794px",
                        height: "1123px",
                        transform: "translateX(-50%) scale(0.28)",
                        transformOrigin: "top center",
                      }}
                    >
                      <iframe
                        srcDoc={html}
                        className="pointer-events-none h-full w-full border-none"
                        tabIndex={-1}
                        aria-hidden
                      />
                    </div>
                    {/* fade + actions */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent" />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <Link
                        href={`/resume/${r.id}/edit`}
                        title="Edit"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[#faf6ee] shadow-md transition hover:scale-110"
                        style={{ backgroundColor: INK }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                        </svg>
                      </Link>
                      {generated && (
                        <Link
                          href={`/resume/${r.id}/preview`}
                          title="Preview & download"
                          className="flex h-10 w-10 items-center justify-center rounded-full text-stone-900 shadow-md transition hover:scale-110"
                          style={{ backgroundColor: LIME }}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3v12" />
                            <path d="m7 10 5 5 5-5" />
                            <path d="M5 21h14" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* details */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="truncate text-base font-extrabold text-stone-900" title={r.title}>
                      {r.title}
                    </h3>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="max-w-full truncate rounded-full bg-white px-3 py-1 text-[11px] font-bold text-stone-600">
                        {r.role}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          generated ? "text-stone-900" : "bg-stone-200 text-stone-500"
                        }`}
                        style={generated ? { backgroundColor: LIME } : undefined}
                      >
                        {generated ? "Ready" : "Draft"}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <p className="text-xs font-medium text-stone-400">
                        Updated {formattedDate}
                      </p>
                      <DeleteResumeButton
                        id={r.id}
                        onDeleted={() =>
                          setResumes((rs) => rs.filter((x) => x.id !== r.id))
                        }
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
