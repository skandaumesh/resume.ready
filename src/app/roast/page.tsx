"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import PublicShell from "@/components/PublicShell";

const INK = "#1b1710";
const LIME = "#d9f24e";

interface Roast {
  roast: string[];
  fixes: string[];
}

export default function RoastPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roast, setRoast] = useState<Roast | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    setError(null);
    setRoast(null);
    setBusy(true);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/public/roast", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data?.error || "The roaster is busy. Try again.");
      else setRoast({ roast: data.roast, fixes: data.fixes });
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const shareText = roast
    ? `An AI just roasted my resume 🔥\n\n"${roast.roast.join(" ")}"\n\nGet yours roasted free: ${
        typeof window !== "undefined" ? window.location.origin : ""
      }/roast`
    : "";

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <PublicShell>
      <div className="pt-6 text-center sm:pt-12">
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Get your resume{" "}
          <span className="relative inline-block px-1">
            <span
              className="absolute inset-x-0 bottom-1 top-2 -rotate-1 rounded"
              style={{ backgroundColor: LIME }}
            />
            <span className="relative">roasted</span>
          </span>{" "}
          🔥
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
          Brutally honest AI feedback in 20 seconds. It hurts a little, then it
          helps a lot. Free, no sign-up.
        </p>

        <div className="mt-8">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-full px-9 py-4 text-base font-bold text-[#faf6ee] shadow-[4px_4px_0_0_#d9f24e] transition hover:-translate-y-0.5 disabled:opacity-60"
            style={{ backgroundColor: INK }}
          >
            {busy ? "Roasting… 🔥" : "Roast my resume (.pdf, .docx)"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFile}
            className="hidden"
          />
          <p className="mt-3 text-xs text-stone-400">
            Roasts the resume, never the person. Your file is read and immediately discarded.
          </p>
        </div>

        {error && (
          <p className="mx-auto mt-6 max-w-md rounded-2xl bg-red-100 p-4 text-sm font-medium text-red-800">
            {error}
          </p>
        )}
      </div>

      {roast && (
        <div className="animate-fade-up mt-10">
          {/* the roast */}
          <div
            className="rounded-3xl p-8 text-left shadow-xl sm:p-10"
            style={{ backgroundColor: INK }}
          >
            <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: LIME }}>
              The verdict 🔥
            </p>
            <div className="mt-4 space-y-4">
              {roast.roast.map((line, i) => (
                <p
                  key={i}
                  className="animate-fade-up text-xl font-bold leading-snug text-stone-100 sm:text-2xl"
                  style={{ animationDelay: `${i * 350}ms` }}
                >
                  &ldquo;{line}&rdquo;
                </p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={copyShare}
                className="rounded-full px-5 py-2.5 text-sm font-bold text-stone-900"
                style={{ backgroundColor: LIME }}
              >
                {copied ? "Copied! 📋" : "Copy my roast"}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-stone-100 ring-1 ring-white/25 hover:bg-white/20"
              >
                Share on WhatsApp
              </a>
            </div>
          </div>

          {/* the redemption */}
          <div className="mt-6 rounded-3xl bg-white p-8 ring-1 ring-stone-200">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              The redemption arc
            </p>
            <ul className="mt-4 space-y-3">
              {roast.fixes.map((fix, i) => (
                <li key={i} className="flex items-start gap-3 text-stone-700">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-stone-900"
                    style={{ backgroundColor: LIME }}
                  >
                    {i + 1}
                  </span>
                  {fix}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className="mt-6 inline-block rounded-full px-7 py-3.5 text-sm font-bold text-[#faf6ee] transition hover:-translate-y-0.5"
              style={{ backgroundColor: INK }}
            >
              Fix all of this in 10 minutes, free
            </Link>
          </div>
        </div>
      )}
    </PublicShell>
  );
}
