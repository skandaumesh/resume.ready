"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ResumeContent } from "@/lib/types";
import { computeJobMatch, JobMatchResult } from "@/lib/jobMatch";

// Paste a job description, get an instant keyword-match score (runs in the
// browser, no API). Then optionally let the AI tailor the resume to the JD; the
// new score is recomputed with the SAME deterministic function, so the
// improvement is real, never hardcoded.
export default function JobMatchPanel({
  resumeId,
  content: initialContent,
}: {
  resumeId: string;
  content: ResumeContent;
}) {
  const router = useRouter();
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [improvement, setImprovement] = useState<{
    before: number;
    after: number;
  } | null>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setImprovement(null);
    setError(null);
    if (jd.trim().length < 20) {
      setResult(null);
      return;
    }
    setResult(computeJobMatch(content, jd));
  }

  async function enhance() {
    if (jd.trim().length < 20) return;
    // Establish the "before" score against the current content.
    const before = (result ?? computeJobMatch(content, jd)).score;
    setError(null);
    setEnhancing(true);
    const res = await fetch(`/api/resumes/${resumeId}/tailor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: jd }),
    });
    setEnhancing(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error || "Could not tailor the resume. Please try again.");
      return;
    }
    const { content: newContent } = await res.json();
    // Recompute the match on the NEW content with the same function — real.
    const after = computeJobMatch(newContent, jd);
    setContent(newContent);
    setResult(after);
    setImprovement({ before, after: after.score });
    setEnhanced(true);
  }

  const color = (s: number) =>
    s >= 70 ? "text-green-600" : s >= 45 ? "text-amber-600" : "text-red-600";

  return (
    <div className="glass-card p-5 sm:p-6">
      <h2 className="text-lg font-bold text-stone-900">Job match</h2>
      <p className="text-sm text-stone-500">
        Paste a specific job or internship description to see how well your
        resume matches it, and let the AI tailor your resume to fit it.
      </p>

      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the full job description here..."
        rows={6}
        className="mt-3 w-full rounded-lg border border-stone-300 bg-white/80 p-3 text-sm outline-none focus:border-brand-500"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={run}
          disabled={jd.trim().length < 20 || enhancing}
          className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Check match
        </button>
        {result && (
          <button
            onClick={enhance}
            disabled={enhancing}
            className="rounded-xl border border-brand-300 bg-white/70 px-5 py-2.5 font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
          >
            {enhancing
              ? "Tailoring… (up to a minute)"
              : "Enhance my resume for this job"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-5">
          {improvement ? (
            <p className="text-sm text-stone-600">
              Match improved from{" "}
              <span className={`font-bold ${color(improvement.before)}`}>
                {improvement.before}%
              </span>{" "}
              to{" "}
              <span className={`text-2xl font-extrabold ${color(improvement.after)}`}>
                {improvement.after}%
              </span>
            </p>
          ) : (
            <p className="text-sm text-stone-600">
              Your resume matches this role:{" "}
              <span className={`text-2xl font-extrabold ${color(result.score)}`}>
                {result.score}%
              </span>
            </p>
          )}
          <p className="mt-1 text-xs text-stone-400">
            Based on {result.totalKeywords} key terms from the job description.
          </p>

          {enhanced && (
            <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              Your resume was rewritten to fit this job and saved. The PDF
              download already reflects it.{" "}
              <button
                onClick={() => router.refresh()}
                className="font-semibold underline"
              >
                Refresh the preview and ATS score above
              </button>
              . Review every line to make sure it stays true to you.
            </div>
          )}

          {result.missing.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-800">
                {enhanced
                  ? "Still missing (only add if genuinely true for you)"
                  : "Missing keywords to consider adding"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.missing.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium text-green-700">
              Great, your resume covers all the key terms from this job.
            </p>
          )}

          {result.matched.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-800">
                Keywords you already cover
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.matched.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
