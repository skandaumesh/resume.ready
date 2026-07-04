"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TEMPLATES, TemplateId } from "@/lib/templates";

export default function TemplateSelector({
  resumeId,
  current,
  recommended,
  recommendReason,
}: {
  resumeId: string;
  current: TemplateId;
  recommended: TemplateId;
  recommendReason: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<TemplateId>(current);
  const [saving, setSaving] = useState<TemplateId | null>(null);

  async function choose(id: TemplateId) {
    if (id === selected) return;
    setSaving(id);
    const res = await fetch(`/api/resumes/${resumeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: id }),
    });
    setSaving(null);
    if (res.ok) {
      setSelected(id);
      router.refresh(); // re-render the preview iframe with the new template
    } else {
      alert("Could not change template. Please try again.");
    }
  }

  return (
    <div className="glass-card p-5 sm:p-6">
      <h2 className="text-lg font-bold text-stone-900">Template</h2>
      <p className="text-sm text-stone-500">
        Pick a look. All templates are ATS-safe (they parse cleanly in recruiter
        software).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {TEMPLATES.map((t) => {
          const isSelected = selected === t.id;
          const isRecommended = recommended === t.id;
          return (
            <button
              key={t.id}
              onClick={() => choose(t.id)}
              disabled={saving !== null}
              className={`rounded-xl border p-4 text-left transition disabled:opacity-60 ${
                isSelected
                  ? "border-brand-600 ring-2 ring-brand-200"
                  : "border-stone-200 hover:border-brand-400"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-stone-900">{t.name}</span>
                {isSelected && (
                  <span className="text-xs font-medium text-brand-600">
                    Selected
                  </span>
                )}
              </div>
              {isRecommended && (
                <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Recommended for your role
                </span>
              )}
              <p className="mt-2 text-xs text-stone-500">{t.description}</p>
              {saving === t.id && (
                <p className="mt-2 text-xs font-medium text-brand-600">
                  Applying…
                </p>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-stone-400">{recommendReason}</p>
    </div>
  );
}
