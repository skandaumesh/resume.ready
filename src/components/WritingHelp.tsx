"use client";

import { useMemo, useState } from "react";
import { getExampleLines, getWritingTips, NUMBER_BLANK, TipKind } from "@/lib/bulletTips";

// Instant tips under an experience/project description, plus example lines
// for the student's role they can tap to add. No AI, so it's unlimited and
// works on every phone; "Improve with AI" sits right below it.
export default function WritingHelp({
  text,
  kind,
  roleTitle,
  onUseExample,
}: {
  text: string;
  kind: TipKind;
  roleTitle: string;
  onUseExample: (line: string) => void;
}) {
  const [showExamples, setShowExamples] = useState(false);
  const tips = useMemo(() => getWritingTips(text, kind), [text, kind]);
  const examples = useMemo(() => getExampleLines(roleTitle, kind), [roleTitle, kind]);

  return (
    <div className="mt-2 space-y-2">
      <ul className="space-y-1" aria-live="polite">
        {tips.map((tip) => (
          <li key={tip.text} className="flex items-start gap-1.5 text-xs leading-snug">
            <span
              aria-hidden
              className={tip.tone === "good" ? "font-bold text-emerald-600" : "font-bold text-amber-500"}
            >
              {tip.tone === "good" ? "✓" : "•"}
            </span>
            <span className={tip.tone === "good" ? "text-emerald-800" : "text-stone-600"}>
              {tip.text}
            </span>
          </li>
        ))}
      </ul>

      {examples.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowExamples((v) => !v)}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            aria-expanded={showExamples}
          >
            {showExamples ? "Hide example lines" : "See example lines"}
          </button>
          {showExamples && (
            <div className="mt-1.5 rounded-lg border border-stone-200 bg-stone-50 p-2.5">
              <ul className="space-y-2">
                {examples.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-xs text-stone-700">
                    <span className="min-w-0 flex-1 leading-snug">{line}</span>
                    <button
                      type="button"
                      onClick={() => onUseExample(line)}
                      className="shrink-0 rounded-md border border-brand-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-50"
                    >
                      Use
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-stone-500">
                Swap each {NUMBER_BLANK} for your real number, and change the details to match what
                you actually did.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
