"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ResumeCardMenu({
  id,
  editHref,
  previewHref,
  onDeleted,
}: {
  id: string;
  editHref: string;
  previewHref?: string;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleDelete() {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      setBusy(false);
      if (res.ok) {
        setOpen(false);
        onDeleted?.();
      } else {
        setError("Could not delete. Please try again.");
      }
    } catch {
      setBusy(false);
      setError("Request failed. Check your connection.");
    }
  }

  return (
    <div ref={ref} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Resume actions"
        aria-expanded={open}
        className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-20 mb-1 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5">
          <Link
            href={editHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
            </svg>
            Edit
          </Link>
          {previewHref && (
            <Link
              href={previewHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview
            </Link>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            {busy ? "Deleting…" : "Delete"}
          </button>
          {error && (
            <p className="border-t border-stone-100 px-3.5 py-2 text-xs text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
