"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import ResumeCardMenu from "@/components/ResumeCardMenu";

import { renderResumeHtml } from "@/lib/resumeHtml";
import { TEMPLATES } from "@/lib/templates";
import { EMPTY_CONTENT } from "@/lib/types";

const INK = "#2563eb";
const LIME = "#dbeafe";

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

export default function DashboardPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredResumes = search.trim()
    ? resumes.filter((r) => {
        const q = search.trim().toLowerCase();
        return r.title.toLowerCase().includes(q) || r.role.toLowerCase().includes(q);
      })
    : resumes;

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
    <AppShell>
      <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        {/* heading */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
              Your resumes
            </h1>
            {!loading && (
              <span className="soft-surface rounded-full px-3.5 py-1.5 text-xs font-bold text-stone-600">
                {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-stone-500">
            Create, polish, and download. Everything lives here.
          </p>

          <div className="relative mx-auto mt-6 max-w-lg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your resumes…"
              className="soft-surface w-full rounded-full py-3 pl-11 pr-4 text-sm text-stone-900 transition placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* start cards */}
        {!loading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="neu-card glow-trace group relative overflow-hidden rounded-[28px] p-7 text-left transition hover:-translate-y-1 disabled:opacity-60"
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
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] text-white transition group-hover:scale-110"
                  style={{ backgroundColor: INK }}
                >
                  {uploading ? (
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
                      />
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
              className="neu-card glow-trace group relative overflow-hidden rounded-[28px] p-7 transition hover:-translate-y-1"
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
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] text-stone-900 transition group-hover:rotate-90"
                  style={{ backgroundColor: LIME }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.71 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z"
                    />
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
              <div key={i} className="neu-card glow-trace flex h-[380px] flex-col gap-4 p-5">
                <div className="neu-block h-52 w-full animate-pulse" />
                <div className="neu-block h-4 w-3/4 animate-pulse" />
                <div className="flex gap-2">
                  <div className="neu-block h-6 w-16 animate-pulse rounded-full" />
                  <div className="neu-block h-6 w-14 animate-pulse rounded-full" />
                </div>
                <div className="neu-block mt-auto h-3 w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="mt-8 rounded-[28px] border-2 border-dashed border-stone-300 p-12 text-center">
            <p className="font-semibold text-stone-600">No resumes yet.</p>
            <p className="mt-1 text-sm text-stone-400">
              Use one of the cards above to get started.
            </p>
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="mt-8 rounded-[28px] border-2 border-dashed border-stone-300 p-12 text-center">
            <p className="font-semibold text-stone-600">No resumes match &quot;{search}&quot;.</p>
            <p className="mt-1 text-sm text-stone-400">Try a different title or role.</p>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredResumes.map((r) => {
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
                  className="soft-surface glow-trace group relative flex flex-col rounded-[13px] transition hover:-translate-y-1.5"
                >
                  {/* thumbnail */}
                  <Link
                    href={`/resume/${r.id}/edit`}
                    className="relative mx-4 mt-4 block h-60 overflow-hidden rounded-2xl bg-white shadow-sm"
                  >
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
                  </Link>

                  {/* details */}
                  <div className="flex flex-1 items-start justify-between gap-2 p-5">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-extrabold text-stone-900" title={r.title}>
                        {r.title}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-stone-400">
                        Updated {formattedDate}
                      </p>
                    </div>
                    <ResumeCardMenu
                      id={r.id}
                      editHref={`/resume/${r.id}/edit`}
                      previewHref={generated ? `/resume/${r.id}/preview` : undefined}
                      onDeleted={() =>
                        setResumes((rs) => rs.filter((x) => x.id !== r.id))
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
