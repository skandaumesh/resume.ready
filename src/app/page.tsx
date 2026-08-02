"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ROLES } from "@/lib/roles";
import { TEMPLATES, getTemplate, RoleCategory } from "@/lib/templates";
import { renderResumeHtml } from "@/lib/resumeHtml";
import { getRoleExample } from "@/lib/roleExamples";
import Footer from "@/components/Footer";
import TemplatePreviewCard from "@/components/TemplatePreviewCard";

// One sample resume, rendered through every template so the gallery shows
// real output — the same document in each style, like a template preview.
const SAMPLE = getRoleExample("software-developer");

/* Roles that cycle through the prompt placeholder, teaching the input's
   syntax the way an example prompt does in an AI product. */
const PLACEHOLDER_ROLES = [
  "Data Analyst",
  "Frontend Developer",
  "Marketing Intern",
  "Mechanical Engineer",
  "UI/UX Designer",
];

/* ── Prompt-as-hero ───────────────────────────────────────────────────
   The input *is* the call to action. One field, dead center, pre-filled
   with a rotating example. No competing buttons. */
function RolePrompt() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_ROLES.length),
      2600,
    );
    return () => clearInterval(t);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = role.trim();
    if (value.length < 2) return;
    router.push(`/dashboard/new?role=${encodeURIComponent(value)}`);
  }

  return (
    <div className="w-full">
      <form onSubmit={submit}>
        {/* white composer zone inside the frosted panel */}
        <div className="rounded-[18px] border border-white/70 bg-white/90 px-4 pb-3 pt-4 text-left shadow-subtle transition focus-within:border-brand-400">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={`I'm applying for ${PLACEHOLDER_ROLES[placeholderIdx]}...`}
            aria-label="The role you are applying for"
            className="w-full bg-transparent pb-6 text-base font-medium text-black outline-none placeholder:font-normal placeholder:text-black/45"
          />

          {/* control row — circular icon buttons like the reference */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                aria-label="Import an existing resume"
                title="Import an existing resume"
                className="composer-btn flex h-9 w-9 items-center justify-center text-content-strong"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Link>
              <Link
                href="/dashboard"
                className="composer-btn px-3.5 py-2 text-sm"
              >
                Import a resume
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                aria-label="Start my resume"
                className="composer-send flex h-9 w-9 items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* quick-pick roles, so the field is never a blank wall */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-black/50">Popular:</span>
        {ROLES.slice(0, 5).map((r) => (
          <button
            key={r.slug}
            type="button"
            onClick={() =>
              router.push(`/dashboard/new?role=${encodeURIComponent(r.title)}`)
            }
            className="rounded-full border border-white/60 bg-white/60 px-3 py-1.5 text-xs font-medium text-black/70 backdrop-blur-sm transition hover:bg-white/80"
          >
            {r.title}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Template carousel — transparent cards inside the hero panel ─────── */
function TemplateCarousel() {
  const rowRef = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    rowRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  }

  return (
    <div>
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TEMPLATES.slice(0, 8).map((t) => {
          const html = SAMPLE
            ? renderResumeHtml(SAMPLE.contact, SAMPLE.content, t.id, {
                accent: t.accent,
              })
            : "";
          return (
            <Link
              key={t.id}
              href="/examples"
              className="group flex w-72 shrink-0 flex-col gap-2.5 rounded-[13px] bg-[#fbfbfb] p-2.5 outline outline-1 outline-[#f3f3f3] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_22px_-10px_rgba(0,0,0,0.16)]"
              style={{ boxShadow: "0 6px 10px -6px rgba(0,0,0,0.086)" }}
            >
              {/* preview — real resume screenshot inside a rounded frame */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-white">
                <div
                  className="pointer-events-none absolute left-1/2 top-0"
                  style={{
                    width: "794px",
                    height: "1123px",
                    transform: "translateX(-50%) scale(0.3375)",
                    transformOrigin: "top center",
                  }}
                >
                  <iframe
                    srcDoc={html}
                    title={`${t.name} template preview`}
                    tabIndex={-1}
                    aria-hidden
                    className="pointer-events-none h-full w-full border-none"
                  />
                </div>

                {/* hover overlay — frosted blur fading in, like the reference */}
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 opacity-0 backdrop-blur-sm transition-opacity duration-500 ease-in-out group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-content-strong shadow-subtle">
                    Use this template
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* label below the preview */}
              <div className="flex items-center justify-between px-1 pb-0.5">
                <span className="text-sm font-semibold text-content-strong">
                  {t.name}
                </span>
                <span className="text-xs text-content-faint">{t.category}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* footer: view all + arrows, like the reference */}
      <div className="mt-5 flex items-center justify-between">
        <Link
          href="/examples"
          className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm font-medium text-black/80 backdrop-blur transition hover:bg-white/90"
        >
          View all templates
        </Link>
        <div className="flex gap-2">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => scroll(d)}
              aria-label={d === -1 ? "Previous templates" : "Next templates"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 text-black/70 backdrop-blur transition hover:bg-white/90"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d={d === -1 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// A4-ish page dimensions used by renderResumeHtml's layout CSS.
/* ── Template grid — every layout the builder supports ────────────────── */
const ROLE_TABS: { id: RoleCategory; label: string }[] = [
  { id: "tech", label: "Tech" },
  { id: "finance", label: "Finance" },
  { id: "accounting", label: "Accounting" },
  { id: "data", label: "Data Analytics" },
  { id: "marketing", label: "Marketing" },
];

function TemplateGrid() {
  const previewContact = SAMPLE ? { ...SAMPLE.contact, fullName: "Skanda" } : undefined;
  const [tab, setTab] = useState<RoleCategory>("tech");
  const visible = TEMPLATES.filter((t) => t.roles.includes(tab));

  return (
    <div>
      {/* role tabs */}
      <div className="flex flex-wrap gap-2">
        {ROLE_TABS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setTab(r.id)}
            className={`flex h-10 items-center rounded-[13px] border px-4 text-sm font-medium transition ${
              tab === r.id
                ? "btn-gradient border-[#2f6fe0] shadow-[0_6px_12px_-5px_rgba(58,137,253,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]"
                : "border-[#e3e3e1] bg-white text-content-strong shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-canvas-deep"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((t) => {
          const html = previewContact
            ? renderResumeHtml(previewContact, SAMPLE!.content, t.id, {
                accent: t.accent,
              })
            : "";
          return (
            <Link
              key={t.id}
              href="/examples"
              className="glow-trace group flex flex-col gap-2.5 rounded-[13px] bg-[#fbfbfb] p-2.5 outline outline-1 outline-[#f3f3f3] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_22px_-10px_rgba(0,0,0,0.16)]"
              style={{ boxShadow: "0 6px 10px -6px rgba(0,0,0,0.086)" }}
            >
              {/* preview — real resume screenshot inside a rounded frame */}
              <TemplatePreviewCard templateName={t.name} html={html} />

              {/* label below the preview */}
              <div className="flex items-center justify-between px-1 pb-0.5">
                <span className="text-sm font-semibold text-content-strong">
                  {t.name}
                </span>
                <span className="text-xs text-content-faint">{t.category}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/examples"
          className="rounded-full border border-hairline-strong bg-white px-6 py-3 text-sm font-medium text-content-strong shadow-subtle transition hover:bg-canvas-deep"
        >
          View more templates
        </Link>
      </div>
    </div>
  );
}

/* ── How it works — two columns: accordion steps + a card layer ─────── */
const HIW_STEPS = [
  {
    t: "Say it plainly",
    d: "“made a website for fest registrations” is a perfectly good answer here. Type it like you'd text a friend.",
  },
  {
    t: "AI does the hard part",
    d: "Every plain sentence becomes a quantified, recruiter-grade bullet, ordered the right way for your role.",
  },
  {
    t: "Download & apply",
    d: "One-click ATS-friendly PDF. Run the score checker, fix what's flagged, and send it out.",
  },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  const html = SAMPLE
    ? renderResumeHtml(SAMPLE.contact, SAMPLE.content, "modern", {
        accent: "#2563eb",
      })
    : "";

  return (
    <section id="how-it-works" className="border-t border-hairline py-fluid-2xl">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* left: eyebrow + heading + accordion */}
        <div>
          <p className="text-sm font-semibold text-brand-600">How it works</p>
          <h2 className="mt-3 max-w-md text-fluid-5xl font-bold leading-[1.08] tracking-[-0.03em]">
            Build your resume in minutes
          </h2>

          <div className="mt-8 border-t border-hairline">
            {HIW_STEPS.map((s, i) => {
              const on = active === i;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="block w-full border-b border-hairline py-5 text-left"
                >
                  <h3
                    className={`text-xl font-semibold tracking-tight transition-colors sm:text-2xl ${
                      on ? "text-content-primary" : "text-content-faint"
                    }`}
                  >
                    {s.t}
                  </h3>
                  <div
                    className={`grid transition-all duration-300 ${
                      on ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <p className="overflow-hidden text-[15px] leading-relaxed text-content-muted">
                      {s.d}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* right: card layer with a live resume preview */}
        <div className="card-soft aspect-square overflow-hidden p-3">
          <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-white">
            <div
              className="pointer-events-none absolute left-1/2 top-0"
              style={{
                width: "794px",
                height: "1123px",
                transform: "translateX(-50%) scale(0.685)",
                transformOrigin: "top center",
              }}
            >
              <iframe
                srcDoc={html}
                title="Resume preview"
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none h-full w-full border-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const NAV_LINKS = [
  { href: "/ats-check", label: "ATS Check" },
  { href: "/roast", label: "Roast" },
  { href: "/linkedin-check", label: "LinkedIn" },
  { href: "/examples", label: "Examples" },
];

/* ── FAQ — accordion, like the reference ────────────────────────────── */
const FAQS: { q: string; a: string }[] = [
  {
    q: "What is ResumeReady?",
    a: "An AI resume builder for students. You describe your projects and experience in plain words, and it writes a polished, ATS-friendly resume with quantified bullet points, ready to download as a PDF.",
  },
  {
    q: "Is it really free?",
    a: "Yes. Building, editing, and downloading your resume is free, and the ATS checker, roast, and LinkedIn review need no sign-up. No credit card, ever.",
  },
  {
    q: "Do I need to know how to write a resume?",
    a: "No. That's the whole point. Type things the way you'd text a friend — “made a website for fest registrations” — and the AI turns each line into a recruiter-grade bullet, ordered the right way for your role.",
  },
  {
    q: "Will my resume pass ATS screening?",
    a: "That's what it's built for. Every resume runs through 12 applicant-tracking-system checks — single-column layout, standard section names, the keywords recruiters' software looks for — and shows you exactly what to fix.",
  },
  {
    q: "Can I edit the resume after the AI generates it?",
    a: "Fully. Every section, bullet, and detail is editable, and you can regenerate any part with AI or switch templates without losing your content.",
  },
  {
    q: "Can I download it as a PDF?",
    a: "Yes — one click gives you a clean, ATS-friendly PDF that reads correctly both to recruiters and to the software that screens them.",
  },
  {
    q: "What if I already have a resume?",
    a: "Import it. Upload a .pdf or .docx and ResumeReady parses it, fills in the fields, and rebuilds it in a stronger, ATS-friendly format you can keep editing.",
  },
  {
    q: "Which roles does it support?",
    a: "29+ roles across software, data, design, marketing, core engineering, and more — and you can type any custom role, so it tailors the format and content even for titles not in the list.",
  },
  {
    q: "Is my data private?",
    a: "Your resume data is tied to your account and only visible to you. Files you upload to the free tools are read to score them and then discarded — never stored, never shared.",
  },
  {
    q: "Do recruiters accept AI-made resumes?",
    a: "They accept good resumes. ResumeReady doesn't invent experience — it phrases your real work clearly and quantifiably, which is exactly what recruiters and their ATS software reward.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? FAQS : FAQS.slice(0, 5);

  return (
    <section id="faq" className="px-5 py-fluid-2xl sm:px-8">
      <h2 className="text-center text-fluid-5xl font-bold tracking-[-0.03em]">
        Still have questions?
      </h2>

      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {visible.map((f, i) => {
          const on = open === i;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-[13px] bg-canvas-deep transition-colors hover:bg-[#f0f0ee]"
            >
              <button
                type="button"
                onClick={() => setOpen(on ? null : i)}
                aria-expanded={on}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-base font-medium text-content-strong sm:text-lg">
                  {f.q}
                </span>
                <span className="btn-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className={`h-4 w-4 transition-transform duration-300 ${on ? "rotate-45" : ""}`}
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-content-muted">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {FAQS.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-[13px] bg-canvas-deep px-5 py-4 text-sm font-medium text-content-strong transition-colors hover:bg-[#f0f0ee]"
          >
            {showAll ? "Show fewer" : `Show all ${FAQS.length} questions`}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M7 17 17 7" />
              <path d="M8 7h9v9" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  // Nav stays fixed and gains a frosted background once you scroll past the top.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── nav ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled
            ? "border-b border-hairline bg-white/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="relative mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-5 py-4 sm:px-8">
          {/* logo left */}
          <Link href="/" className="flex shrink-0 items-center">
            <img
              src="/logo-clean.png"
              alt="ResumeReady"
              className="h-6 w-auto sm:h-7"
            />
          </Link>

          {/* centered nav links */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 text-sm lg:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-2 font-semibold text-black transition hover:bg-black/5"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* right actions */}
          <div className="flex shrink-0 items-center gap-2">
            <SignedOut>
              <Link
                href="/sign-in"
                className="flex h-10 items-center rounded-[13px] border border-[#e3e3e1] bg-white px-4 text-sm font-medium text-content-strong shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:bg-canvas-deep"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="btn-gradient flex h-10 items-center rounded-[13px] border border-[#2f6fe0] px-4 text-sm font-medium shadow-[0_6px_12px_-5px_rgba(58,137,253,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]"
              >
                Get started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="btn-gradient flex h-10 items-center rounded-[13px] border border-[#2f6fe0] px-4 text-sm font-medium"
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* ── hero funnel ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* sky/field photo behind the whole funnel, fading into flat canvas */}
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-[1140px]">
          <img
            src="/hero.png"
            alt=""
            className="h-full w-full object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-72% to-canvas" />
        </div>

        <div className="relative mx-auto max-w-[1080px] px-5 pb-24 pt-24 text-center sm:px-8 sm:pt-28">
          <h1 className="mx-auto max-w-4xl text-[44px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-[76px]">
            You did the work.
            <br />
            We make it sound like it.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-content-muted sm:text-[17px]">
            Describe your projects the way you&apos;d text a friend. Our AI
            turns them into a polished, ATS-friendly resume in about 10 minutes.
          </p>

          {/* one frosted panel holding the prompt and the templates */}
          <div className="mx-auto mt-10 max-w-4xl rounded-[28px] border border-white/50 bg-white/25 p-3 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-4">
            <RolePrompt />
            <div className="my-4 h-px bg-white/40" />
            <TemplateCarousel />
          </div>

          <p className="mt-5 text-xs text-black/50">
            Free forever. No credit card. Built for Indian students.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* ── how it works ──────────────────────────────────────────── */}
        <HowItWorks />

        {/* ── templates ─────────────────────────────────────────────── */}
        <section id="templates" className="border-t border-hairline py-fluid-2xl">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-fluid-4xl font-semibold tracking-[-0.02em]">
              Start with a template
            </h2>
            <p className="text-[15px] text-content-muted">
              Real resumes, rendered live. Pick a look and go.
            </p>
          </div>
          <div className="mt-10">
            <TemplateGrid />
          </div>
        </section>

        {/* ── receipts ──────────────────────────────────────────────── */}
        <section className="border-t border-hairline py-fluid-2xl">
          <div className="grid gap-10 rounded-[28px] border border-white/50 bg-white/25 px-8 py-14 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:grid-cols-4">
            {[
              ["10 min", "to your first PDF"],
              ["12", "ATS checks on every resume"],
              ["29+", "roles supported"],
              ["₹0", "now and forever"],
            ].map(([big, small]) => (
              <div key={small} className="text-center">
                <p className="bg-gradient-to-b from-content-primary to-content-primary/60 bg-clip-text text-4xl font-semibold tracking-[-0.02em] text-transparent sm:text-5xl">
                  {big}
                </p>
                <p className="mt-2 text-sm text-content-muted">{small}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── final CTA — full-bleed portal gradient, dark band on white ── */}
      <section className="relative overflow-hidden bg-[#000812]">
        {/* top: white → blue → dark portal horizon (exact reference values),
            blending seamlessly out of the white page above */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 0%, #ffffff 35%, #ffffff 45%, #cedef5 58%, #6ba3ff 68%, #4d96ff 75%, #1e3a8a 85%, #0f1729 93%, #000812 100%)",
          }}
        />
        {/* bottom: dark → blue → white, mirroring the top so the section is a
            self-contained dark band and the FAQ below flows on white */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[28rem]"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 100%, #ffffff 30%, #ffffff 40%, #cedef5 53%, #6ba3ff 63%, #4d96ff 70%, #1e3a8a 80%, #0f1729 90%, rgba(0,8,18,0) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-[1200px] px-5 pb-[30rem] pt-[30rem] text-center sm:px-8">
          <p className="text-sm font-semibold text-[#4d96ff]">Ready when you are</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-fluid-5xl font-bold leading-tight tracking-[-0.03em] text-white">
            Stop fighting Word.
            <br />
            Start getting interviews.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Your projects deserve better than “worked on a website”.
          </p>

        </div>
      </section>

      {/* ── FAQ — after the blue portal section ─────────────────────── */}
      <Faq />

      {/* ── footer ──────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
