"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PublicShell from "@/components/PublicShell";
import { AtsResult } from "@/lib/ats";

const INK = "#1b1710";
const LIME = "#d9f24e";

function ringHex(score: number): string {
  if (score >= 85) return "#10b981";
  if (score >= 70) return "#f59e0b";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function useCountUp(ms = 1400): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms]);
  return t;
}

function Report({ result, locked }: { result: AtsResult; locked: number }) {
  const t = useCountUp();
  const shown = Math.round(result.score * t);
  const failed = result.checks.filter((c) => !c.passed);
  const passed = result.checks.filter((c) => c.passed);

  return (
    <div className="animate-fade-up mt-8">
      {/* score */}
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200 sm:flex-row sm:gap-10">
        <div
          className="relative h-36 w-36 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(${ringHex(result.score)} ${result.score * t * 3.6}deg, #e7e5e4 0deg)`,
          }}
        >
          <div className="absolute inset-2.5 flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-4xl font-extrabold tabular-nums text-stone-900">
              {shown}
            </span>
            <span className="text-xs font-semibold text-stone-400">/ 100</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-2xl font-extrabold text-stone-900">
            {result.rating}
          </p>
          <p className="mt-1 text-stone-600">
            {passed.length} of {result.checks.length} checks passed.{" "}
            {failed.length > 0
              ? `${failed.length} issue${failed.length > 1 ? "s" : ""} are costing you points.`
              : "Your resume is in great shape."}
          </p>
          {failed.length > 0 && (
            <Link
              href="/sign-up"
              className="mt-4 inline-block rounded-full px-6 py-3 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5"
              style={{ backgroundColor: LIME }}
            >
              Unlock all {locked} fixes, free
            </Link>
          )}
        </div>
      </div>

      {/* checks */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {result.checks.map((c, i) => (
          <div
            key={c.id}
            className="animate-fade-up rounded-2xl bg-white p-4 ring-1 ring-stone-200"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  c.passed ? "bg-emerald-500" : "bg-red-500"
                }`}
              >
                {c.passed ? "✓" : "✕"}
              </span>
              <p className="text-sm font-bold text-stone-800">{c.label}</p>
            </div>
            {!c.passed && (
              <div className="relative mt-3 overflow-hidden rounded-xl bg-amber-50 p-3">
                <p className="select-none text-sm text-amber-900 blur-sm">
                  Sign up to see exactly how to fix this and earn the missing
                  points back on your score.
                </p>
                <Link
                  href="/sign-up"
                  className="absolute inset-0 flex items-center justify-center gap-1.5 text-sm font-bold text-stone-900"
                >
                  🔒 Unlock the fix
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PublicAtsCheckPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{
    fileName: string;
    result: AtsResult;
    locked: number;
  } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    setError(null);
    setReport(null);
    setBusy(true);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/public/ats", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data?.error || "Could not check this file. Try again.");
      else setReport({ fileName: file.name, result: data.result, locked: data.locked });
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <div className="pt-6 text-center sm:pt-12">
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Will your resume survive the{" "}
          <span className="relative inline-block px-1">
            <span
              className="absolute inset-x-0 bottom-1 top-2 -rotate-1 rounded"
              style={{ backgroundColor: LIME }}
            />
            <span className="relative">robots?</span>
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
          Recruiters use ATS software to filter resumes before a human ever
          reads them. Check yours in 30 seconds. Free, no sign-up needed.
        </p>

        <div className="mt-8">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-full px-9 py-4 text-base font-bold text-[#faf6ee] shadow-[4px_4px_0_0_#d9f24e] transition hover:-translate-y-0.5 disabled:opacity-60"
            style={{ backgroundColor: INK }}
          >
            {busy ? "Reading your resume…" : "Upload my resume (.pdf, .docx)"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFile}
            className="hidden"
          />
          <p className="mt-3 text-xs text-stone-400">
            Your file is scored and immediately discarded. Never stored, never shared.
          </p>
        </div>

        {error && (
          <p className="mx-auto mt-6 max-w-md rounded-2xl bg-red-100 p-4 text-sm font-medium text-red-800">
            {error}
          </p>
        )}
      </div>

      {report && <Report result={report.result} locked={report.locked} />}
    </PublicShell>
  );
}
