"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import TagsInput from "@/components/TagsInput";
import { UNIVERSAL_QUESTIONS, Question } from "@/lib/roles";
import { renderResumeHtml } from "@/lib/resumeHtml";
import { computeAtsScore } from "@/lib/ats";
import { buildDraftContent, profileCompleteness, toEntries, Entry } from "@/lib/draftPreview";
import { EMPTY_CONTENT, ResumeContent } from "@/lib/types";
import { TemplateId, DEFAULT_TEMPLATE, isTemplateId, TemplateOptions, FontId } from "@/lib/templates";
import EntryList, { EntryField } from "@/components/EntryList";
import TemplateGallery from "@/components/TemplateGallery";

const EXPERIENCE_FIELDS: EntryField[] = [
  { id: "jobTitle", label: "Job title", placeholder: "Data Analyst Intern", half: true },
  { id: "company", label: "Company", placeholder: "ABC Analytics", half: true },
  { id: "startDate", label: "Start date", placeholder: "Jun 2024", half: true },
  { id: "endDate", label: "End date", placeholder: "Present", half: true },
  { id: "location", label: "Location", placeholder: "Bengaluru, India", half: true },
  {
    id: "description",
    label: "What you did (plain words, the AI turns this into bullets)",
    placeholder: "Worked on their sales data, cleaned it, made dashboards...",
    type: "textarea",
  },
];

const PROJECT_FIELDS: EntryField[] = [
  { id: "name", label: "Project name", placeholder: "College Result Portal", half: true },
  { id: "techStack", label: "Tech / tools (comma separated)", placeholder: "React, Firebase", half: true },
  {
    id: "description",
    label: "What you built (plain words, the AI turns this into bullets)",
    placeholder: "A website where students check results. Used by my class...",
    type: "textarea",
  },
];

const EDUCATION_FIELDS: EntryField[] = [
  { id: "degree", label: "Degree", placeholder: "B.Tech in Computer Science", half: true },
  { id: "institution", label: "Institution", placeholder: "XYZ Institute of Technology", half: true },
  { id: "startDate", label: "Start year", placeholder: "2022", half: true },
  { id: "endDate", label: "End year", placeholder: "2026", half: true },
  { id: "details", label: "CGPA / percentage / details", placeholder: "CGPA 8.4", half: true },
];

type Answers = Record<string, string | string[] | Entry[]>;
type Contact = Record<string, string>;

interface CustomField {
  id: string;
  label: string;
}

const CONTACT_FIELDS = [
  { id: "email", label: "Email", placeholder: "aarav@email.com" },
  { id: "phone", label: "Phone", placeholder: "+91 98765 43210" },
  { id: "location", label: "Location", placeholder: "Bengaluru, India" },
  { id: "linkedin", label: "LinkedIn (optional)", placeholder: "linkedin.com/in/aarav" },
  { id: "github", label: "GitHub (optional)", placeholder: "github.com/aarav" },
  { id: "portfolio", label: "Portfolio (optional)", placeholder: "aarav.dev" },
];

const KNOWN_CONTACT_IDS = new Set(["fullName", ...CONTACT_FIELDS.map((f) => f.id)]);

const STEPS = [
  { key: "personal", label: "Personal details" },
  { key: "contact", label: "Contact info" },
  { key: "experience", label: "Work experience" },
  { key: "projects", label: "Projects" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "extras", label: "Certifications & achievements" },
  { key: "finish", label: "Review & generate" },
] as const;

const Q: Record<string, Question> = Object.fromEntries(
  UNIVERSAL_QUESTIONS.map((q) => [q.id, q]),
);

let customFieldCounter = 0;

// A4 page width in px at 96dpi. We scale the page to fill the pane WIDTH and
// let it scroll vertically, so the sheet sits at the top and reads at a
// comfortable size, like a real A4 document in a frame.
const PAGE_WIDTH = 794;

// Scaled A4 preview pane — used in the desktop side panel and the mobile
// full-screen overlay, each with its own container width to scale against.
function ScaledPreview({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [docHeight, setDocHeight] = useState(1123);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width > 0) setScale(width / PAGE_WIDTH);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Measure the rendered resume's real height so the scaled page scrolls
  // naturally instead of being clipped to a fixed A4 box.
  function handleLoad(e: { currentTarget: HTMLIFrameElement }) {
    const doc = e.currentTarget.contentDocument;
    if (doc) {
      const h = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || 1123;
      setDocHeight(Math.max(h, 200));
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl"
    >
      {/* Spacer holds the scaled page's real height so the pane scrolls. */}
      <div
        className="relative mx-auto"
        style={{ width: PAGE_WIDTH * scale, height: docHeight * scale }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left bg-white shadow-2xl"
          style={{ width: PAGE_WIDTH, transform: `scale(${scale})` }}
        >
          <iframe
            title="Live resume preview"
            srcDoc={html}
            onLoad={handleLoad}
            scrolling="no"
            style={{ width: PAGE_WIDTH, height: docHeight, border: 0, display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function EditResumePage() {
  const { id } = useParams() as { id: string };

  const [roleTitle, setRoleTitle] = useState("");
  const [title, setTitle] = useState("");
  const [contact, setContact] = useState<Contact>({});
  const [answers, setAnswers] = useState<Answers>({});
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const activeChipRef = useRef<HTMLButtonElement>(null);
  const [generated, setGenerated] = useState<ResumeContent | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [improving, setImproving] = useState<string | null>(null);
  const [improved, setImproved] = useState<Record<string, string[]>>({});
  const [previewHtml, setPreviewHtml] = useState("");

  // Dynamic custom fields for contact info
  const [customContactFields, setCustomContactFields] = useState<CustomField[]>([]);
  // Dynamic custom fields for personal details
  const [customPersonalFields, setCustomPersonalFields] = useState<CustomField[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/resumes/${id}`);
      if (!res.ok) {
        setError("Could not load this resume.");
        setLoading(false);
        return;
      }
      const { resume } = await res.json();
      setRoleTitle(resume.role ?? "");
      setTitle(resume.title ?? "");
      const loadedContact = (resume.contact as Contact) ?? {};
      setContact(loadedContact);
      // Normalize the structured sections to arrays (converts any legacy
      // freeform strings to a single entry so old resumes keep working).
      const rawAnswers = (resume.answers as Answers) ?? {};
      setAnswers({
        ...rawAnswers,
        experience: toEntries(rawAnswers.experience, "description"),
        projects: toEntries(rawAnswers.projects, "description"),
        education: toEntries(rawAnswers.education, "degree"),
      });
      if (isTemplateId(resume.template)) setTemplate(resume.template);
      if (resume.content)
        setGenerated({ ...EMPTY_CONTENT, ...(resume.content as ResumeContent) });

      // Restore custom contact fields from saved contact data
      const restoredCustomContact: CustomField[] = [];
      for (const key of Object.keys(loadedContact)) {
        if (!KNOWN_CONTACT_IDS.has(key) && !key.startsWith("_personal_")) {
          restoredCustomContact.push({ id: key, label: key });
        }
      }
      if (restoredCustomContact.length) setCustomContactFields(restoredCustomContact);

      // Restore custom personal fields
      const restoredCustomPersonal: CustomField[] = [];
      for (const key of Object.keys(loadedContact)) {
        if (key.startsWith("_personal_")) {
          restoredCustomPersonal.push({
            id: key,
            label: key.replace("_personal_", "").replace(/_/g, " "),
          });
        }
      }
      if (restoredCustomPersonal.length) setCustomPersonalFields(restoredCustomPersonal);

      setLoading(false);
    })();
  }, [id]);

  // Live preview (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const content = generated ?? buildDraftContent(answers);
      setPreviewHtml(
        renderResumeHtml(contact, content, template, {
          accent: contact._accent || undefined,
          font: (contact._font as FontId) || undefined,
          photo: contact.photo || undefined,
        }),
      );
    }, 300);
    return () => clearTimeout(t);
  }, [contact, answers, template, generated]);

  // Keep the active step chip visible in the mobile stepper.
  useEffect(() => {
    activeChipRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [step]);

  const meter = useMemo(() => {
    if (generated)
      return { value: computeAtsScore(contact, generated).score, label: "ATS score" };
    return { value: profileCompleteness(contact, answers), label: "Profile completeness" };
  }, [generated, contact, answers]);

  function updateAnswer(qid: string, val: string | string[] | Entry[]) {
    setAnswers((a) => ({ ...a, [qid]: val }));
  }

  // Called by EntryList's per-entry "Improve with AI" — polishes one entry's
  // description into bullet points via the same endpoint.
  async function improveText(fieldLabel: string, text: string): Promise<string[]> {
    const res = await fetch(`/api/resumes/${id}/improve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldLabel, text }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d?.error || "Could not improve this. Please try again.");
    }
    const { bullets } = await res.json();
    return bullets as string[];
  }

  const saveSilently = useCallback(async () => {
    const res = await fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, contact, answers }),
    });
    if (res.ok) {
      setSavedNote("Saved");
      setTimeout(() => setSavedNote(null), 1800);
    }
  }, [id, title, contact, answers]);

  async function goTo(i: number) {
    const next = Math.max(0, Math.min(STEPS.length - 1, i));
    await saveSilently();
    setStep(next);
  }

  async function improve(qid: string, label: string) {
    const text = String(answers[qid] ?? "").trim();
    if (text.length < 5) {
      setError("Write a little more in this field first, then improve it.");
      return;
    }
    setError(null);
    setImproving(qid);
    const res = await fetch(`/api/resumes/${id}/improve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldLabel: label, text }),
    });
    setImproving(null);
    if (res.ok) {
      const { bullets } = await res.json();
      setImproved((p) => ({ ...p, [qid]: bullets }));
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d?.error || "Could not improve this field. Please try again.");
    }
  }

  function applyImproved(qid: string) {
    const bullets = improved[qid];
    if (!bullets?.length) return;
    updateAnswer(qid, bullets.map((b) => `- ${b}`).join("\n"));
    setImproved((p) => {
      const n = { ...p };
      delete n[qid];
      return n;
    });
  }

  async function changeTemplate(next: TemplateId) {
    setTemplate(next);
    await fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: next }),
    });
  }

  // Design overrides (accent color, font, photo) picked in the gallery. Accent
  // and font live on the contact object under reserved `_`-prefixed keys so they
  // persist through the existing contact auto-save; photo uses contact.photo.
  const templateOptions: TemplateOptions = {
    accent: contact._accent || undefined,
    font: (contact._font as FontId) || undefined,
    photo: contact.photo || undefined,
  };

  function applyDesign(nextTemplate: TemplateId, opts: TemplateOptions) {
    if (nextTemplate !== template) changeTemplate(nextTemplate);
    setContact((c) => {
      const next = { ...c };
      if (opts.accent) next._accent = opts.accent;
      else delete next._accent;
      if (opts.font) next._font = opts.font;
      else delete next._font;
      if (opts.photo) next.photo = opts.photo;
      else delete next.photo;
      return next;
    });
  }

  async function generate() {
    setError(null);
    setGenerating(true);
    const res = await fetch(`/api/resumes/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, contact, answers }),
    });
    setGenerating(false);
    if (res.ok) {
      const data = await res.json();
      const content = data?.resume?.content as ResumeContent | undefined;
      if (content) setGenerated({ ...EMPTY_CONTENT, ...content });
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Generation failed. Please try again.");
    }
  }

  // Add a custom contact field
  function addCustomContactField() {
    const fieldId = `custom_${++customFieldCounter}_${Date.now()}`;
    setCustomContactFields((prev) => [...prev, { id: fieldId, label: "" }]);
  }

  function removeCustomContactField(fieldId: string) {
    setCustomContactFields((prev) => prev.filter((f) => f.id !== fieldId));
    setContact((c) => {
      const next = { ...c };
      delete next[fieldId];
      return next;
    });
  }

  function updateCustomContactLabel(fieldId: string, label: string) {
    setCustomContactFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, label } : f)),
    );
  }

  // Add a custom personal field
  function addCustomPersonalField() {
    const fieldId = `_personal_${++customFieldCounter}_${Date.now()}`;
    setCustomPersonalFields((prev) => [...prev, { id: fieldId, label: "" }]);
  }

  function removeCustomPersonalField(fieldId: string) {
    setCustomPersonalFields((prev) => prev.filter((f) => f.id !== fieldId));
    setContact((c) => {
      const next = { ...c };
      delete next[fieldId];
      return next;
    });
  }

  function updateCustomPersonalLabel(fieldId: string, label: string) {
    setCustomPersonalFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, label } : f)),
    );
  }

  // Render one intake question
  function renderQuestion(q: Question) {
    return (
      <div>
        <label className="text-sm font-medium text-stone-700">{q.label}</label>
        {q.helper && <p className="mb-1 text-xs text-stone-400">{q.helper}</p>}
        {q.type === "tags" ? (
          <TagsInput
            value={(answers[q.id] as string[]) ?? []}
            onChange={(next) => updateAnswer(q.id, next)}
            placeholder={q.placeholder}
          />
        ) : q.type === "textarea" ? (
          <textarea
            value={(answers[q.id] as string) ?? ""}
            onChange={(e) => updateAnswer(q.id, e.target.value)}
            placeholder={q.placeholder}
            rows={6}
            className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
          />
        ) : (
          <input
            value={(answers[q.id] as string) ?? ""}
            onChange={(e) => updateAnswer(q.id, e.target.value)}
            placeholder={q.placeholder}
            className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
          />
        )}

        {(q.id === "projects" || q.id === "experience") && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => improve(q.id, q.label)}
              disabled={improving !== null}
              className="rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              {improving === q.id ? "Improving…" : "Improve with AI"}
            </button>
            {improved[q.id] && (
              <div className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-3">
                <p className="text-xs font-semibold text-brand-800">
                  Suggested bullet points
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-stone-700">
                  {improved[q.id].map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => applyImproved(q.id)}
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
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <AppHeader />
        <p className="flex flex-1 items-center justify-center text-stone-500">Loading…</p>
      </div>
    );
  }
  if (error && !roleTitle) {
    return (
      <div className="flex h-screen flex-col">
        <AppHeader />
        <p className="flex flex-1 items-center justify-center text-red-600">{error}</p>
      </div>
    );
  }

  const current = STEPS[step];
  const isFinish = current.key === "finish";
  const meterColor =
    meter.value >= 70 ? "text-green-600" : meter.value >= 40 ? "text-amber-600" : "text-stone-500";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Sub-header with resume title & role */}
      <div className="shrink-0 border-b border-white/40 bg-white/30 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white/70 text-stone-600 hover:bg-white"
            aria-label="Back to dashboard"
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-stone-900">Your resume</h1>
            <p className="truncate text-xs text-stone-500">Target role: {roleTitle}</p>
          </div>
          <button
            onClick={() => setMobilePreviewOpen(true)}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white shadow lg:hidden"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preview
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ───────────────────────────────────── */}
      <main className="flex min-h-0 flex-1 overflow-hidden p-3 sm:p-5">
        <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col gap-3 lg:flex-row lg:gap-6">
          {/* ── LEFT: steps nav ─────────────────────────────── */}
          <nav className="hidden w-64 shrink-0 flex-col overflow-y-auto lg:flex glass-card p-4">
          <div className="h-full overflow-y-auto pr-2">
            <ol className="flex flex-col gap-1">
              {STEPS.map((s, i) => {
                const active = i === step;
                return (
                  <li key={s.key}>
                    <button
                      onClick={() => goTo(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "bg-brand-600 text-white shadow"
                          : "text-stone-600 hover:bg-white/70"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          active ? "bg-white text-brand-700" : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="whitespace-nowrap font-medium">{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        {/* Mobile stepper — compact chips (label only on active) + progress bar */}
        <div className="shrink-0 lg:hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <button
                  key={s.key}
                  ref={active ? activeChipRef : undefined}
                  onClick={() => goTo(i)}
                  aria-label={`Step ${i + 1}: ${s.label}`}
                  className={
                    active
                      ? "flex shrink-0 items-center gap-2 rounded-full bg-brand-600 py-2 pl-2 pr-4 text-white shadow transition"
                      : `flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                          done
                            ? "bg-brand-200 text-brand-700"
                            : "border border-stone-200 bg-white/70 text-stone-500"
                        }`
                  }
                >
                  {active ? (
                    <>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-brand-700">
                        {i + 1}
                      </span>
                      <span className="whitespace-nowrap text-xs font-semibold">{s.label}</span>
                    </>
                  ) : done ? (
                    "✓"
                  ) : (
                    i + 1
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* ── CENTER: current step form ─────────────────────── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="glass-card flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
            {current.key === "personal" && (
              <>
                <h2 className="text-xl font-bold text-stone-900">Personal details</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Your name and resume title. The role you are targeting is{" "}
                  <span className="font-medium text-stone-700">{roleTitle}</span>.
                </p>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-stone-700">Full name</span>
                    <input
                      value={contact.fullName ?? ""}
                      onChange={(e) =>
                        setContact((c) => ({ ...c, fullName: e.target.value }))
                      }
                      placeholder="Aarav Sharma"
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-stone-700">Resume title</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </label>

                  {/* Profile Photo Upload */}
                  <div className="block pt-2">
                    <span className="mb-2 block text-sm font-medium text-stone-700">Profile Photo</span>
                    <div className="flex items-center gap-4">
                      {contact.photo ? (
                        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-stone-200">
                          <img src={contact.photo} alt="Profile" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-400 border border-stone-200">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 w-fit">
                          Upload photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setContact((c) => ({ ...c, photo: ev.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        {contact.photo && (
                          <button
                            type="button"
                            onClick={() => setContact((c) => ({ ...c, photo: "" }))}
                            className="text-left text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove photo
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-stone-500">Note: Photos are only visible when using compatible templates (like "Profile").</p>
                  </div>

                  {/* Custom personal fields */}
                  {customPersonalFields.map((field) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <input
                          value={field.label}
                          onChange={(e) =>
                            updateCustomPersonalLabel(field.id, e.target.value)
                          }
                          placeholder="Field name (e.g. Date of Birth)"
                          className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs font-medium text-stone-600 outline-none focus:border-brand-500"
                        />
                        <input
                          value={contact[field.id] ?? ""}
                          onChange={(e) =>
                            setContact((c) => ({ ...c, [field.id]: e.target.value }))
                          }
                          placeholder="Value"
                          className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomPersonalField(field.id)}
                        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove field"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCustomPersonalField}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs font-semibold text-stone-500 hover:border-brand-400 hover:text-brand-600"
                  >
                    <span className="text-base leading-none">+</span> Add another field
                  </button>
                </div>
              </>
            )}

            {current.key === "contact" && (
              <>
                <h2 className="text-xl font-bold text-stone-900">Contact info</h2>
                <p className="mt-1 text-sm text-stone-500">
                  How recruiters reach you. Keep it to what you actually use.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {CONTACT_FIELDS.map((f) => (
                    <label key={f.id} className="block">
                      <span className="text-sm font-medium text-stone-700">{f.label}</span>
                      <input
                        value={contact[f.id] ?? ""}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, [f.id]: e.target.value }))
                        }
                        placeholder={f.placeholder}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
                      />
                    </label>
                  ))}
                </div>

                {/* Custom contact fields */}
                {customContactFields.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                      Additional links
                    </p>
                    {customContactFields.map((field) => (
                      <div key={field.id} className="flex items-start gap-2">
                        <div className="grid flex-1 gap-2 sm:grid-cols-2">
                          <input
                            value={field.label}
                            onChange={(e) =>
                              updateCustomContactLabel(field.id, e.target.value)
                            }
                            placeholder="Label (e.g. Twitter, Behance)"
                            className="rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-sm font-medium text-stone-600 outline-none focus:border-brand-500"
                          />
                          <input
                            value={contact[field.id] ?? ""}
                            onChange={(e) =>
                              setContact((c) => ({ ...c, [field.id]: e.target.value }))
                            }
                            placeholder="URL or handle"
                            className="rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none focus:border-brand-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomContactField(field.id)}
                          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove field"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addCustomContactField}
                  className="mt-4 flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs font-semibold text-stone-500 hover:border-brand-400 hover:text-brand-600"
                >
                  <span className="text-base leading-none">+</span> Add another item
                </button>
              </>
            )}

            {current.key === "experience" && (
              <>
                <h2 className="text-xl font-bold text-stone-900">Work experience</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Add each role. Recruiters notice results more than duties.
                  Internships, freelance, part-time, and volunteer work all count.
                </p>
                <div className="mt-4">
                  <EntryList
                    entries={(answers.experience as Entry[]) ?? []}
                    onChange={(next) => updateAnswer("experience", next)}
                    fields={EXPERIENCE_FIELDS}
                    titleField="jobTitle"
                    descriptionField="description"
                    addLabel="Add work experience"
                    singular="Experience"
                    onImprove={(text) => improveText("work experience", text)}
                  />
                </div>
              </>
            )}

            {current.key === "projects" && (
              <>
                <h2 className="text-xl font-bold text-stone-900">Projects</h2>
                <p className="mt-1 text-sm text-stone-500">
                  College projects, hackathons, or anything you built. Add each
                  one; the AI turns your notes into strong bullets.
                </p>
                <div className="mt-4">
                  <EntryList
                    entries={(answers.projects as Entry[]) ?? []}
                    onChange={(next) => updateAnswer("projects", next)}
                    fields={PROJECT_FIELDS}
                    titleField="name"
                    descriptionField="description"
                    addLabel="Add project"
                    singular="Project"
                    onImprove={(text) => improveText("project", text)}
                  />
                </div>
              </>
            )}

            {current.key === "skills" && (
              <>
                <h2 className="text-xl font-bold text-stone-900">Skills</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Tools, languages, and anything relevant to the role.
                </p>
                <div className="mt-4">{renderQuestion(Q.skills)}</div>
              </>
            )}

            {current.key === "education" && (
              <>
                <h2 className="text-xl font-bold text-stone-900">Education</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Add each qualification: degree, institution, years, and CGPA or
                  percentage.
                </p>
                <div className="mt-4">
                  <EntryList
                    entries={(answers.education as Entry[]) ?? []}
                    onChange={(next) => updateAnswer("education", next)}
                    fields={EDUCATION_FIELDS}
                    titleField="degree"
                    addLabel="Add education"
                    singular="Education"
                  />
                </div>
              </>
            )}

            {current.key === "extras" && (
              <>
                <h2 className="text-xl font-bold text-stone-900">
                  Certifications & achievements
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Optional, but they help you stand out. Leave blank if none.
                </p>
                <div className="mt-4 space-y-5">
                  {renderQuestion(Q.certifications)}
                  {renderQuestion(Q.achievements)}
                </div>
              </>
            )}

            {isFinish && (
              <>
                <h2 className="text-xl font-bold text-stone-900">Review & generate</h2>
                <p className="mt-1 text-sm text-stone-500">
                  When you generate, the AI rewrites everything into a polished, ATS-friendly
                  resume. You can regenerate any time.
                </p>
                <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
                  Profile completeness:{" "}
                  <span className="font-semibold text-stone-900">
                    {profileCompleteness(contact, answers)}%
                  </span>
                </div>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="mt-4 w-full rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50 sm:w-auto"
                >
                  {generating
                    ? "Generating… (up to a minute)"
                    : generated
                      ? "Regenerate with AI"
                      : "Generate resume"}
                </button>
                {generating && (
                  <p className="mt-2 text-xs text-stone-500">
                    Writing your bullets on the free AI plan. Keep this tab open.
                  </p>
                )}
                {generated && !generating && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`/api/resumes/${id}/pdf`}
                      className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                    >
                      Download PDF
                    </a>
                    <Link
                      href={`/resume/${id}/preview`}
                      className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Full ATS score and job match
                    </Link>
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
            )}

            {/* Back / Next — pinned at bottom of the scroll area */}
            <div className="mt-auto border-t border-stone-200 pt-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => goTo(step - 1)}
                  disabled={step === 0}
                  className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 sm:py-2.5"
                >
                  Back
                </button>
                {!isFinish && (
                  <button
                    onClick={() => goTo(step + 1)}
                    className="flex-1 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 sm:flex-none sm:py-2.5"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: live preview ───────────────────────────── */}
        <div className="hidden min-h-0 w-[42%] max-w-[720px] min-w-[440px] shrink-0 flex-col lg:flex">
          <div className="glass-card flex min-h-0 flex-1 flex-col p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => setGalleryOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4l2 2h4a2 2 0 012 2v3M3 15l3.5-3.5a2 2 0 012.8 0L14 16m-2-2l1.5-1.5a2 2 0 012.8 0L21 16M15 8h.01" />
                  </svg>
                  Change template
                </button>
              </div>
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <ScaledPreview html={previewHtml} />
            </div>

            {!generated && (
              <p className="mt-4 text-center text-xs text-stone-400">
                Live draft. Finish steps to generate AI bullet points.
              </p>
            )}
          </div>
        </div>
      </div>
      </main>

      {/* Auto-save toast — fixed so it shows on every screen size */}
      {savedNote && (
        <span className="pointer-events-none fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-lg">
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {savedNote}
        </span>
      )}

      {/* Mobile full-screen live preview */}
      {mobilePreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#e9ece1] lg:hidden">
          <div className="flex shrink-0 items-center gap-3 border-b border-white/40 bg-white/40 px-4 py-3 backdrop-blur-sm">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-stone-900">Live preview</h2>
              <p className="text-xs text-stone-500">
                {meter.label}:{" "}
                <span className={`font-semibold ${meterColor}`}>{meter.value}%</span>
              </p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                onClick={() => setGalleryOpen(true)}
                className="rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
              >
                Change template
              </button>
              <button
                onClick={() => setMobilePreviewOpen(false)}
                aria-label="Close preview"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-600"
              >
                ×
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-3">
            <ScaledPreview html={previewHtml} />
          </div>
          {!generated && (
            <p className="shrink-0 pb-3 text-center text-xs text-stone-400">
              Live draft. Finish steps to generate AI bullet points.
            </p>
          )}
        </div>
      )}

      <TemplateGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        contact={contact}
        content={generated ?? buildDraftContent(answers)}
        template={template}
        options={templateOptions}
        onChange={applyDesign}
      />
    </div>
  );
}
