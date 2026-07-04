"use client";

import { useState } from "react";
import { Entry } from "@/lib/draftPreview";

export interface EntryField {
  id: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea";
  half?: boolean; // render two-per-row on wider screens
}

export default function EntryList({
  entries,
  onChange,
  fields,
  titleField,
  descriptionField,
  addLabel,
  singular,
  onImprove,
}: {
  entries: Entry[];
  onChange: (next: Entry[]) => void;
  fields: EntryField[];
  titleField: string;
  descriptionField?: string;
  addLabel: string;
  singular: string;
  onImprove?: (text: string) => Promise<string[]>;
}) {
  const [openIdx, setOpenIdx] = useState<number>(entries.length ? 0 : -1);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [suggest, setSuggest] = useState<Record<number, string[]>>({});
  const [err, setErr] = useState<string | null>(null);

  function setField(i: number, key: string, val: string) {
    onChange(entries.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)));
  }
  function add() {
    onChange([...entries, {}]);
    setOpenIdx(entries.length);
  }
  function remove(i: number) {
    onChange(entries.filter((_, idx) => idx !== i));
    setSuggest((s) => {
      const n = { ...s };
      delete n[i];
      return n;
    });
  }
  async function runImprove(i: number) {
    if (!onImprove || !descriptionField) return;
    const text = (entries[i]?.[descriptionField] || "").trim();
    if (text.length < 5) {
      setErr("Write a little more first, then improve it.");
      return;
    }
    setErr(null);
    setBusyIdx(i);
    try {
      const bullets = await onImprove(text);
      setSuggest((s) => ({ ...s, [i]: bullets }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not improve. Try again.");
    } finally {
      setBusyIdx(null);
    }
  }
  function applySuggest(i: number) {
    const b = suggest[i];
    if (!b?.length || !descriptionField) return;
    setField(i, descriptionField, b.map((x) => `- ${x}`).join("\n"));
    setSuggest((s) => {
      const n = { ...s };
      delete n[i];
      return n;
    });
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const open = openIdx === i;
        return (
          <div key={i} className="rounded-xl border border-stone-200 bg-white">
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpenIdx(open ? -1 : i)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <svg
                  className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="truncate font-semibold text-stone-800">
                  {entry[titleField]?.trim() || `${singular} ${i + 1}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                Remove
              </button>
            </div>

            {open && (
              <div className="grid gap-3 border-t border-stone-100 p-4 sm:grid-cols-2">
                {fields.map((f) => {
                  const isFull = f.type === "textarea" || !f.half;
                  return (
                    <div key={f.id} className={isFull ? "sm:col-span-2" : ""}>
                      <label className="text-xs font-medium text-stone-600">
                        {f.label}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea
                          value={entry[f.id] ?? ""}
                          onChange={(e) => setField(i, f.id, e.target.value)}
                          placeholder={f.placeholder}
                          rows={5}
                          className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
                        />
                      ) : (
                        <input
                          value={entry[f.id] ?? ""}
                          onChange={(e) => setField(i, f.id, e.target.value)}
                          placeholder={f.placeholder}
                          className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
                        />
                      )}

                      {/* Per-entry Improve, under the description field. */}
                      {descriptionField === f.id && onImprove && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => runImprove(i)}
                            disabled={busyIdx !== null}
                            className="rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                          >
                            {busyIdx === i ? "Improving…" : "Improve with AI"}
                          </button>
                          {suggest[i] && (
                            <div className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-3">
                              <p className="text-xs font-semibold text-brand-800">
                                Suggested bullet points
                              </p>
                              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-stone-700">
                                {suggest[i].map((b, bi) => (
                                  <li key={bi}>{b}</li>
                                ))}
                              </ul>
                              <button
                                type="button"
                                onClick={() => applySuggest(i)}
                                className="mt-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                              >
                                Use these
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {err && <p className="text-xs text-red-600">{err}</p>}

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-500 hover:border-brand-400 hover:text-brand-600"
      >
        <span className="text-base leading-none">+</span> {addLabel}
      </button>
    </div>
  );
}
