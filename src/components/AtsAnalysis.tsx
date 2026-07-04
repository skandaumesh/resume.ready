"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AtsCategory, AtsCheck, AtsResult } from "@/lib/ats";

// Icons per known category; anything unknown gets a sensible default, so any
// tool that produces AtsResult-shaped checks can render this report.
const CATEGORY_ICONS: Record<string, string> = {
  Content: "📝",
  Sections: "🧩",
  "ATS Essentials": "🤖",
  "Profile Basics": "👤",
  Credibility: "🏆",
};

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-500";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function ringHex(score: number): string {
  if (score >= 85) return "#10b981";
  if (score >= 70) return "#f59e0b";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function pctChipClass(pct: number): string {
  if (pct >= 85) return "bg-emerald-100 text-emerald-700";
  if (pct >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

/* Eases 0→1 over `ms`, driving both the count-up number and the ring sweep. */
function useCountUp(ms = 1400): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setT(1 - Math.pow(1 - p, 3)); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms]);
  return t;
}

function CheckCard({ check, delay }: { check: AtsCheck; delay: number }) {
  const [open, setOpen] = useState(!check.passed); // failed checks start expanded
  const pct = Math.round((check.earned / check.points) * 100);

  return (
    <div
      className="animate-fade-up overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-stone-50"
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
            check.passed ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {check.passed ? "✓" : "✕"}
        </span>
        <span className="flex-1 font-semibold text-stone-800">
          {check.label}
        </span>
        <span
          className={`hidden rounded-full px-3 py-1 text-xs font-bold sm:block ${
            check.passed
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {check.passed ? "No issues" : "1 issue"}
        </span>
        <span
          className={`text-stone-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-stone-100 px-5 py-5">
            <p className="text-sm leading-relaxed text-stone-600">
              {check.why}
            </p>

            {/* points bar with pin marker */}
            <div className="mt-6">
              <div className="relative">
                <div
                  className="animate-pop-in absolute -top-7 -translate-x-1/2"
                  style={{ left: `${Math.max(pct, 4)}%` }}
                >
                  <span
                    className={`text-lg ${
                      check.passed ? "text-emerald-500" : "text-red-400"
                    }`}
                  >
                    📍
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200">
                  <div
                    className={`animate-bar-grow h-full rounded-full ${
                      check.passed
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : "bg-gradient-to-r from-red-300 to-red-400"
                    }`}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-stone-400">
                {check.earned} of {check.points} points earned
              </p>
            </div>

            {check.passed ? (
              <p className="mt-4 rounded-xl bg-emerald-50 p-3.5 text-sm font-medium text-emerald-700">
                Great! This check passed. No action needed.
              </p>
            ) : (
              <div className="mt-4 rounded-xl bg-amber-50 p-3.5">
                <p className="text-xs font-extrabold uppercase tracking-widest text-amber-600">
                  How to fix it
                </p>
                <p className="mt-1 text-sm text-amber-900">{check.tip}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AtsAnalysis({ result }: { result: AtsResult }) {
  const { score, rating, checks } = result;
  const t = useCountUp();
  const shownScore = Math.round(score * t);
  const issues = checks.filter((c) => !c.passed).length;

  const groups = useMemo(() => {
    // Categories in order of first appearance in the checks.
    const keys: AtsCategory[] = [];
    for (const c of checks) {
      if (!keys.includes(c.category)) keys.push(c.category);
    }
    return keys.map((key) => {
      const items = checks.filter((c) => c.category === key);
      const max = items.reduce((s, c) => s + c.points, 0);
      const earned = items.reduce((s, c) => s + c.earned, 0);
      return {
        key,
        icon: CATEGORY_ICONS[key] ?? "📋",
        items,
        pct: max ? Math.round((earned / max) * 100) : 0,
        issues: items.filter((c) => !c.passed).length,
      };
    });
  }, [checks]);

  // Sidebar accordion — the first group with an issue starts expanded.
  const firstIssueGroup =
    groups.find((g) => g.issues > 0)?.key ?? groups[0].key;
  const [openGroup, setOpenGroup] = useState<AtsCategory>(firstIssueGroup);
  const sectionRefs = useRef<Partial<Record<AtsCategory, HTMLElement | null>>>(
    {},
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
      {/* ───────────────── Score sidebar ───────────────── */}
      <aside className="animate-fade-up top-24 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 lg:sticky">
        <h2 className="text-center text-2xl font-extrabold text-stone-900">
          Your Score
        </h2>

        {/* animated ring */}
        <div
          className="relative mx-auto mt-5 h-36 w-36 rounded-full transition-colors"
          style={{
            background: `conic-gradient(${ringHex(score)} ${
              score * t * 3.6
            }deg, #e2e8f0 0deg)`,
          }}
        >
          <div className="absolute inset-2.5 flex flex-col items-center justify-center rounded-full bg-white">
            <span
              className={`text-4xl font-extrabold tabular-nums ${scoreColor(score)}`}
            >
              {shownScore}
            </span>
            <span className="text-xs font-semibold text-stone-400">
              / 100 · {rating}
            </span>
          </div>
        </div>

        <p className="mt-3 text-center text-sm font-semibold text-stone-500">
          {issues === 0 ? "No issues 🎉" : `${issues} issue${issues > 1 ? "s" : ""} to fix`}
        </p>

        {/* category accordion */}
        <div className="mt-6 space-y-1 border-t border-stone-100 pt-4">
          {groups.map((g) => (
            <div key={g.key}>
              <button
                onClick={() => {
                  setOpenGroup(g.key);
                  sectionRefs.current[g.key]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left hover:bg-stone-50"
              >
                <span className="text-xs font-extrabold uppercase tracking-widest text-stone-500">
                  {g.key}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${pctChipClass(g.pct)}`}
                  >
                    {g.pct}%
                  </span>
                  <span
                    className={`text-stone-400 transition-transform duration-300 ${
                      openGroup === g.key ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </span>
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  openGroup === g.key ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <ul className="space-y-1 px-2 pb-2 pt-1">
                    {g.items.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 py-1"
                      >
                        <span className="flex items-center gap-2 text-sm text-stone-700">
                          <span
                            className={
                              c.passed ? "text-emerald-500" : "text-red-500"
                            }
                          >
                            {c.passed ? "✓" : "✕"}
                          </span>
                          {c.label.replace(/\s*\(.*\)$/, "")}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            c.passed
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {c.passed ? "No issues" : "1 issue"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ───────────────── Report panels ───────────────── */}
      <div className="space-y-6">
        {groups.map((g, gi) => (
          <section
            key={g.key}
            ref={(el) => {
              sectionRefs.current[g.key] = el;
            }}
            className="animate-fade-up scroll-mt-24 rounded-3xl bg-stone-50 p-5 ring-1 ring-stone-200 sm:p-7"
            style={{ animationDelay: `${gi * 120}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-3 text-xl font-extrabold uppercase tracking-wide text-stone-800">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-stone-200">
                  {g.icon}
                </span>
                {g.key}
              </h3>
              <span
                className={`rounded-full px-4 py-1.5 text-xs font-bold shadow-sm ${
                  g.issues === 0
                    ? "bg-white text-emerald-600 ring-1 ring-emerald-200"
                    : "bg-white text-stone-700 ring-1 ring-stone-200"
                }`}
              >
                {g.issues === 0
                  ? "All clear"
                  : `${g.issues} issue${g.issues > 1 ? "s" : ""} found`}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {g.items.map((c, i) => (
                <CheckCard key={c.id} check={c} delay={gi * 120 + i * 90} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
