"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import AtsAnalysis from "@/components/AtsAnalysis";
import { AtsResult } from "@/lib/ats";
import type { LinkedInProfileHeader } from "@/lib/linkedin";
import type { LinkedInAiAdvice } from "@/lib/ai/generateResume";
import AiWaitNotice from "@/components/AiWaitNotice";
import SignInToContinue from "@/components/SignInToContinue";
import { fetchAi } from "@/lib/aiFetch";

// The LinkedIn review flow, shared by the signed-in page (/dashboard/linkedin)
// and the public no-login page (/linkedin-check) — only the endpoints differ.
// LinkedIn blocks reading profiles by URL (HTTP 999 authwall), so the real
// flow is: the user exports their own profile as a PDF from LinkedIn and
// uploads it here. Scoring is deterministic and instant; the AI coach then
// reads the actual content and writes ready-to-paste rewrites, and its
// failing quietly never blocks the report.
export default function LinkedInReview({
  analyzeEndpoint,
  suggestEndpoint,
}: {
  analyzeEndpoint: string;
  suggestEndpoint: string;
}) {
  const { user } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    fileName: string;
    ats: AtsResult;
    profile?: LinkedInProfileHeader;
  } | null>(null);
  const [advice, setAdvice] = useState<LinkedInAiAdvice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [aiWait, setAiWait] = useState<number | null>(null);
  // Set when a no-login limit is used up for the whole network (see API).
  const [signInNeeded, setSignInNeeded] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const coachRef = useRef<HTMLDivElement>(null);

  // The uploaded PDF is never stored anywhere (server or client) — only the
  // already-computed score/advice below, so a refresh restores the report
  // without re-reading the file, keeping the "we don't save it" promise.
  const storageKey = `linkedin-review:${analyzeEndpoint}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.result) setResult(saved.result);
      if (saved.advice) setAdvice(saved.advice);
    } catch {
      /* corrupt or unavailable storage — just start fresh */
    }
    // Only ever run once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (result) {
        sessionStorage.setItem(storageKey, JSON.stringify({ result, advice }));
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      /* storage full or unavailable — persistence is a nicety, not required */
    }
  }, [result, advice, storageKey]);

  async function fetchAdvice(file: File) {
    setAdvice(null);
    setAdviceError(null);
    setAdviceLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetchAi(
        suggestEndpoint,
        { method: "POST", body: formData },
        setAiWait,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.signIn) setSignInNeeded(true);
        setAdviceError(
          data?.error || "The AI coach is busy right now. Try again in a moment.",
        );
      } else {
        setAdvice(data.advice as LinkedInAiAdvice);
      }
    } catch {
      setAdviceError("The AI coach is busy right now. Try again in a moment.");
    } finally {
      setAdviceLoading(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    setError(null);
    setSignInNeeded(false);
    setResult(null);
    setAdvice(null);
    setAdviceError(null);
    setUploading(true);
    setLastFile(file);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(analyzeEndpoint, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.signIn) setSignInNeeded(true);
        setError(data?.error || "Could not analyze this file. Try again.");
      } else {
        setResult({
          fileName: file.name,
          ats: data.result as AtsResult,
          profile: data.profile as LinkedInProfileHeader | undefined,
        });
        // Score is on screen; now fetch the personalized rewrites.
        void fetchAdvice(file);
      }
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* How to export + upload */}
      <div className="mt-6 glass-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-stone-700">
          Get your profile PDF from LinkedIn (30 seconds)
        </h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Open your LinkedIn profile", "On the website (not the app), go to your own profile page."],
            ["2", "More → Save to PDF", "Click the ⋯ More button under your photo and choose “Save to PDF”."],
            ["3", "Upload it here", "Drop the downloaded PDF below. We read it, rate it, and don't save it."],
          ].map(([n, t, d]) => (
            <li
              key={n}
              className="rounded-xl border border-stone-200 bg-white/70 p-4"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {n}
              </span>
              <p className="mt-2 text-sm font-semibold text-stone-800">{t}</p>
              <p className="mt-1 text-xs text-stone-500">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-gradient rounded-[11px] px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {uploading ? "Analyzing…" : "Upload profile PDF"}
          </button>
          {result && !uploading && (
            <span className="text-sm text-stone-600">
              Rated: <span className="font-medium">{result.fileName}</span>
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFile}
            className="hidden"
          />
        </div>
        <p className="mt-2 text-xs text-stone-400">
          Why upload? LinkedIn blocks tools from reading profiles by URL, and
          your exported PDF holds more than any scraper can see: full About,
          experience details, skills, and email.
        </p>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {error && signInNeeded && <SignInToContinue />}
      </div>

      {/* Report */}
      {result && (
        <div className="mt-6">
          {result.profile?.name && (
            <ProfileCard
              profile={result.profile}
              photoUrl={
                user?.imageUrl &&
                sharesAName(result.profile.name, user.fullName ?? "")
                  ? user.imageUrl
                  : undefined
              }
            />
          )}

          {/* The AI Coach panel sits far below the ATS breakdown — bump it here
              so it isn't missed on a long scroll. */}
          {(advice || adviceLoading) && (
            <button
              type="button"
              onClick={() =>
                coachRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="soft-surface mt-4 flex w-full items-center justify-between gap-3 rounded-[13px] px-5 py-4 text-left transition hover:brightness-95"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-stone-500">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.71 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z"
                  />
                </svg>
                <span className="truncate text-sm font-semibold leading-none text-stone-800">
                  {adviceLoading
                    ? "AI Coach is writing your personalized rewrites…"
                    : `AI Coach: ${advice?.suggestions.length ?? 0} ready-to-paste rewrites below`}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold leading-none text-[#3385f9]">View ↓</span>
            </button>
          )}

          <AtsAnalysis key={result.fileName} result={result.ats} />
        </div>
      )}
      {uploading && (
        <div className="mt-6 glass-card p-6 text-center text-sm text-stone-500">
          Reading and rating your profile…
        </div>
      )}

      {/* AI coach: personalized, ready-to-paste rewrites */}
      {result && (
        <div ref={coachRef} className="glass-card mt-6 scroll-mt-24 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-xl font-extrabold uppercase tracking-wide text-stone-800">
              <span className="soft-surface flex h-10 w-10 items-center justify-center rounded-[11px] text-stone-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
                </svg>
              </span>
              AI Coach
            </h2>
            {advice && (
              <span className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-stone-700 shadow-sm ring-1 ring-stone-200">
                {advice.suggestions.length} rewrites
              </span>
            )}
          </div>

          {adviceLoading && (
            <p className="mt-4 animate-pulse text-sm text-stone-500">
              Reading your actual headline, About, and experience, and writing
              better versions… this takes a few seconds.
            </p>
          )}

          <AiWaitNotice seconds={aiWait} className="mt-4" />
          {adviceError && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-3.5">
              <p className="text-sm text-amber-900">{adviceError}</p>
              {lastFile && (
                <button
                  onClick={() => fetchAdvice(lastFile)}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  Retry
                </button>
              )}
              {signInNeeded && <SignInToContinue className="w-full" />}
            </div>
          )}

          {advice && (
            <>
              <p className="mt-3 text-sm font-medium text-stone-600">
                {advice.verdict}
              </p>
              <div className="mt-4 space-y-4">
                {advice.suggestions.map((s, i) => (
                  <SuggestionCard key={i} index={i} {...s} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// The LinkedIn PDF export is text-only (no photo), so the card uses the
// signed-in user's account photo — but only when the name in the PDF matches
// theirs, so an uploaded PDF of someone else never wears the user's face.
function sharesAName(a: string, b: string): boolean {
  const words = (s: string) =>
    new Set(s.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  const wa = words(a);
  return [...words(b)].some((w) => wa.has(w));
}

function ProfileCard({
  profile,
  photoUrl,
}: {
  profile: LinkedInProfileHeader;
  photoUrl?: string;
}) {
  return (
    <div className="mb-4 glass-card flex items-start gap-4 p-5">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Clerk avatar URL, not a configured image domain
        <img
          src={photoUrl}
          alt={profile.name}
          className="h-16 w-16 shrink-0 rounded-full object-cover shadow ring-2 ring-white"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
          {profile.name.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-lg font-bold text-stone-900">{profile.name}</p>
        {profile.headline && (
          <p className="text-sm text-stone-600">{profile.headline}</p>
        )}
        {profile.location && (
          <p className="mt-1 text-xs text-stone-400">{profile.location}</p>
        )}
        {profile.about && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">
            {profile.about}
          </p>
        )}
      </div>
    </div>
  );
}

function SuggestionCard({
  index,
  area,
  issue,
  suggestion,
}: {
  index: number;
  area: string;
  issue: string;
  suggestion: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(suggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (permissions/http) — the text is selectable anyway.
    }
  }

  return (
    <div
      className="animate-fade-up overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="px-5 py-4">
        <span className="rounded-full bg-brand-600/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700">
          {area}
        </span>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{issue}</p>
        <div className="mt-3 rounded-xl bg-emerald-50 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Paste this instead
            </p>
            <button
              onClick={copy}
              className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">
            {suggestion}
          </p>
        </div>
      </div>
    </div>
  );
}
