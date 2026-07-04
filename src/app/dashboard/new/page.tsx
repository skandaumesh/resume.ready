"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { searchRoles, ROLES } from "@/lib/roles";
import AppHeader from "@/components/AppHeader";

export default function NewResumePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const suggestions = useMemo(() => searchRoles(query, 8), [query]);
  const typed = query.trim();
  // Show the "use exactly what I typed" option unless it already matches a suggestion.
  const exactMatch = suggestions.some(
    (r) => r.title.toLowerCase() === typed.toLowerCase(),
  );

  async function pickRole(role: string) {
    const value = role.trim();
    if (value.length < 2) return;
    setCreating(true);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: value }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/resume/${id}/edit`);
    } else {
      setCreating(false);
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "Could not start a new resume. Please try again.");
    }
  }

  const popular = ROLES.slice(0, 10);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-800">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-stone-900">
          What role are you applying for?
        </h1>
        <p className="text-sm text-stone-500">
          Type any role and we&apos;ll tailor the resume format and content to it.
          Not sure of the exact title? Just type what you can.
        </p>

        {/* Search box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!creating) pickRole(typed);
          }}
          className="mt-5"
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={creating}
            placeholder="e.g. Frontend Developer, Data Analyst, UPSC aspirant, Chef..."
            className="w-full rounded-xl border border-stone-300 p-3.5 text-base outline-none focus:border-brand-500"
          />
        </form>

        {/* Suggestions */}
        {typed.length > 0 && (
          <div className="glass-card mt-3 overflow-hidden">
            {!exactMatch && (
              <button
                onClick={() => pickRole(typed)}
                disabled={creating}
                className="flex w-full items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 text-left hover:bg-brand-50 disabled:opacity-60"
              >
                <span className="text-sm text-stone-700">
                  Create resume for{" "}
                  <span className="font-semibold text-brand-700">
                    &ldquo;{typed}&rdquo;
                  </span>
                </span>
                <span className="text-xs text-stone-400">use what I typed</span>
              </button>
            )}
            {suggestions.map((r) => (
              <button
                key={r.slug}
                onClick={() => pickRole(r.title)}
                disabled={creating}
                className="flex w-full items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 text-left last:border-0 hover:bg-stone-50 disabled:opacity-60"
              >
                <span className="text-sm font-medium text-stone-800">
                  {r.title}
                </span>
                <span className="text-xs text-stone-400">{r.category}</span>
              </button>
            ))}
            {suggestions.length === 0 && exactMatch === false && (
              <p className="px-4 py-3 text-xs text-stone-400">
                No matches in our list, but that&apos;s fine. We&apos;ll build
                it from what you typed.
              </p>
            )}
          </div>
        )}

        {/* Popular, shown when the box is empty */}
        {typed.length === 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Popular roles
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {popular.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => pickRole(r.title)}
                  disabled={creating}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-brand-400 disabled:opacity-60"
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {creating && (
          <p className="mt-5 text-sm font-medium text-brand-600">
            Setting up your resume…
          </p>
        )}
      </main>
    </div>
  );
}
