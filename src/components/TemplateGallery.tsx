"use client";

import { useMemo, useRef, useState } from "react";
import {
  TEMPLATES,
  FONTS,
  ACCENTS,
  TemplateId,
  TemplateOptions,
  FontId,
  getTemplate,
} from "@/lib/templates";
import { renderResumeHtml } from "@/lib/resumeHtml";
import { ContactInfo, ResumeContent } from "@/lib/types";

type Tab = "styles" | "fonts" | "colors";

// Fixed A4-width render scaled down into a card. 794px ≈ A4 at 96dpi.
const RENDER_W = 794;

function Thumb({
  contact,
  content,
  templateId,
  options,
  selected,
  onClick,
}: {
  contact: Partial<ContactInfo>;
  content: ResumeContent;
  templateId: TemplateId;
  options: TemplateOptions;
  selected: boolean;
  onClick: () => void;
}) {
  const srcDoc = useMemo(
    () => renderResumeHtml(contact, content, templateId, options),
    [contact, content, templateId, options],
  );
  const meta = getTemplate(templateId);

  // The card is ~230px wide; scale the 794px page down to fit.
  const CARD_W = 230;
  const scale = CARD_W / RENDER_W;
  const CARD_H = 300;

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition ${
        selected
          ? "border-brand-600 ring-2 ring-brand-300"
          : "border-stone-200 hover:border-brand-400"
      }`}
    >
      <div
        className="relative overflow-hidden bg-white"
        style={{ width: CARD_W, height: CARD_H }}
      >
        <iframe
          title={meta.name}
          srcDoc={srcDoc}
          scrolling="no"
          tabIndex={-1}
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{ width: RENDER_W, height: CARD_H / scale, transform: `scale(${scale})` }}
        />
        {selected && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
        {meta.photo && (
          <span className="absolute left-2 top-2 rounded-full bg-stone-900/70 px-2 py-0.5 text-[10px] font-medium text-white">
            Photo
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-stone-100 px-3 py-2">
        <span className="text-sm font-semibold text-stone-800">{meta.name}</span>
        <span className="text-[10px] uppercase tracking-wide text-stone-400">{meta.category}</span>
      </div>
    </button>
  );
}

export default function TemplateGallery({
  open,
  onClose,
  contact,
  content,
  template,
  options,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  contact: Partial<ContactInfo>;
  content: ResumeContent;
  template: TemplateId;
  options: TemplateOptions;
  onChange: (template: TemplateId, options: TemplateOptions) => void;
}) {
  const [tab, setTab] = useState<Tab>("styles");
  const [withPhoto, setWithPhoto] = useState<boolean>(
    !!options.photo || getTemplate(template).photo,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  // Options used to render the thumbnails: include the uploaded photo only when
  // the "With photo" toggle is on.
  const thumbOptions: TemplateOptions = {
    accent: options.accent,
    font: options.font,
    photo: withPhoto ? options.photo : undefined,
  };

  function pickTemplate(id: TemplateId) {
    const meta = getTemplate(id);
    // Selecting a photo template implies photo mode; a non-photo template keeps
    // the user's toggle but won't display a photo.
    if (meta.photo) setWithPhoto(true);
    onChange(id, { ...options, photo: withPhoto || meta.photo ? options.photo : undefined });
  }

  function pickAccent(value?: string) {
    onChange(template, { ...options, accent: value });
  }

  function pickFont(font?: FontId) {
    onChange(template, { ...options, font });
  }

  function togglePhoto(next: boolean) {
    setWithPhoto(next);
    onChange(template, { ...options, photo: next ? options.photo : undefined });
    if (next && !options.photo) fileRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Please choose an image under 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setWithPhoto(true);
      onChange(template, { ...options, photo: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "styles", label: "Styles", icon: "🎨" },
    { id: "fonts", label: "Fonts", icon: "T" },
    { id: "colors", label: "Colors", icon: "●" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="text-2xl font-extrabold text-stone-900">Templates</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
              With photo
              <button
                type="button"
                onClick={() => togglePhoto(!withPhoto)}
                className={`relative h-6 w-11 rounded-full transition ${
                  withPhoto ? "bg-brand-600" : "bg-stone-300"
                }`}
                aria-pressed={withPhoto}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    withPhoto ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <span className="text-xs">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {tab === "styles" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {TEMPLATES.map((t) => (
                <Thumb
                  key={t.id}
                  contact={contact}
                  content={content}
                  templateId={t.id}
                  options={thumbOptions}
                  selected={template === t.id}
                  onClick={() => pickTemplate(t.id)}
                />
              ))}
            </div>
          )}

          {tab === "fonts" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(Object.keys(FONTS) as FontId[]).map((f) => {
                const active = (options.font ?? getTemplate(template).fontId) === f;
                return (
                  <button
                    key={f}
                    onClick={() => pickFont(f)}
                    className={`rounded-xl border p-5 text-center transition ${
                      active ? "border-brand-600 ring-2 ring-brand-300" : "border-stone-200 hover:border-brand-400"
                    }`}
                  >
                    <div className="text-2xl text-stone-900" style={{ fontFamily: FONTS[f].stack }}>
                      Ag
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-600">{FONTS[f].name}</div>
                  </button>
                );
              })}
            </div>
          )}

          {tab === "colors" && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => pickAccent(undefined)}
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-xs font-medium text-stone-500 ${
                  !options.accent ? "border-brand-600 ring-2 ring-brand-300" : "border-stone-200"
                }`}
                title="Template default"
              >
                Auto
              </button>
              {ACCENTS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => pickAccent(c.value)}
                  className={`h-14 w-14 rounded-full border-2 transition ${
                    options.accent === c.value ? "border-stone-900 ring-2 ring-brand-300" : "border-white shadow"
                  }`}
                  style={{ background: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-6 py-4">
          <div className="flex items-center gap-3">
            {withPhoto && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  {options.photo ? "Change photo" : "Upload photo"}
                </button>
                {options.photo && (
                  <button
                    onClick={() => onChange(template, { ...options, photo: undefined })}
                    className="text-sm font-medium text-stone-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Back to editor
          </button>
        </div>
      </div>
    </div>
  );
}
