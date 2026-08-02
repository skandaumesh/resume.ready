"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TemplatePreviewCard from "@/components/TemplatePreviewCard";
import { TEMPLATES } from "@/lib/templates";
import { renderResumeHtml } from "@/lib/resumeHtml";
import { getRoleExample } from "@/lib/roleExamples";

// Same sample resume used for the homepage's template gallery, rendered
// through every template so this grid shows real output, not placeholders.
const SAMPLE = getRoleExample("software-developer");

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const previewContact = SAMPLE ? { ...SAMPLE.contact, fullName: "Skanda" } : undefined;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TEMPLATES;
    return TEMPLATES.filter(
      (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <AppShell>
      <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl font-extrabold tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
            Start with a
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md sm:h-14 sm:w-14 lg:h-16 lg:w-16"
              style={{ backgroundColor: "#3385f9" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z"
                />
                <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
              </svg>
            </span>
            template
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-500">
            Browse every layout the builder supports. Pick one and start filling it in.
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
              placeholder="Search templates…"
              className="soft-surface w-full rounded-full py-3 pl-11 pr-4 text-sm text-stone-900 transition placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="mt-10 rounded-[28px] border-2 border-dashed border-stone-300 p-12 text-center">
            <p className="font-semibold text-stone-600">
              No templates match &quot;{search}&quot;.
            </p>
            <p className="mt-1 text-sm text-stone-400">Try a different name or category.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((t) => {
              const html = previewContact
                ? renderResumeHtml(previewContact, SAMPLE!.content, t.id, { accent: t.accent })
                : "";
              return (
                <Link
                  key={t.id}
                  href="/dashboard/new"
                  className="glow-trace group flex flex-col gap-2.5 rounded-[13px] bg-[#fbfbfb] p-2.5 outline outline-1 outline-[#f3f3f3] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_22px_-10px_rgba(0,0,0,0.16)]"
                  style={{ boxShadow: "0 6px 10px -6px rgba(0,0,0,0.086)" }}
                >
                  <TemplatePreviewCard templateName={t.name} html={html} />
                  <div className="flex items-center justify-between px-1 pb-0.5">
                    <span className="text-sm font-semibold text-content-strong">{t.name}</span>
                    <span className="text-xs text-content-faint">{t.category}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
