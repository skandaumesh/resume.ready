"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ROLES } from "@/lib/roles";

const INK = "#1b1710";
const LIME = "#d9f24e";

/* ────────────────────────────────────────────────────────────────────────
   The centerpiece: a rough student sentence gets typed out, then the AI
   "rewrites" it into a recruiter-grade bullet while the ATS score climbs.
   ──────────────────────────────────────────────────────────────────────── */
const EXAMPLES = [
  {
    rough: "made a website for college where students check results",
    polish:
      "Built a result-portal web app used by 500+ students, cutting manual queries by ~40%.",
  },
  {
    rough: "did an internship at a startup, worked on their app",
    polish:
      "Shipped 12+ features for an Android app with 10k downloads during a 3-month internship.",
  },
  {
    rough: "part of the coding club, helped with events",
    polish:
      "Led a 30-member coding club; organized 4 hackathons drawing 200+ participants.",
  },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function RewriteDemo() {
  const [rough, setRough] = useState("");
  const [polish, setPolish] = useState("");
  const [score, setScore] = useState(52);
  const [zap, setZap] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      while (alive) {
        for (const ex of EXAMPLES) {
          if (!alive) return;
          setRough("");
          setPolish("");
          setScore(52);
          setZap(false);
          await sleep(500);
          for (let i = 1; i <= ex.rough.length; i++) {
            if (!alive) return;
            setRough(ex.rough.slice(0, i));
            await sleep(26);
          }
          await sleep(500);
          setZap(true);
          await sleep(450);
          for (let i = 1; i <= ex.polish.length; i++) {
            if (!alive) return;
            setPolish(ex.polish.slice(0, i));
            await sleep(14);
          }
          for (let s = 52; s <= 94; s += 2) {
            if (!alive) return;
            setScore(s);
            await sleep(26);
          }
          await sleep(2600);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const scoreTone =
    score >= 85
      ? "bg-emerald-400 text-emerald-950"
      : "bg-amber-300 text-amber-950";

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* what you type */}
      <div className="glass-card p-5 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
          What you type
        </p>
        <p className="mt-2 min-h-[3.5rem] font-mono text-[15px] leading-relaxed text-stone-800">
          {rough}
          <span className="animate-caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-stone-800" />
        </p>
      </div>

      {/* the zap */}
      <div className="relative z-10 -my-3 flex justify-center">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full text-lg shadow-lg ring-4 ring-white/70 transition-all duration-300 ${
            zap ? "scale-110" : "scale-90 opacity-70"
          }`}
          style={{ backgroundColor: LIME }}
        >
          ⚡
        </span>
      </div>

      {/* what recruiters read */}
      <div
        className="rounded-3xl p-5 pt-6 text-stone-100 shadow-[0_18px_40px_-16px_rgba(27,23,16,0.5)]"
        style={{ backgroundColor: INK }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-lime-200/80">
            What recruiters read
          </p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-extrabold tabular-nums transition-colors duration-300 ${scoreTone}`}
          >
            ATS {score}/100
          </span>
        </div>
        <p className="mt-2 min-h-[5rem] text-[15px] font-medium leading-relaxed">
          <span className="mr-2 text-lime-300">▸</span>
          {polish}
          {polish && polish.length < 20 && (
            <span className="animate-caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-stone-100" />
          )}
        </p>
      </div>
    </div>
  );
}

function InkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-block rounded-full px-7 py-3.5 text-center text-sm font-bold text-[#faf6ee] shadow-[3px_3px_0_0_#d9f24e] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#d9f24e]"
      style={{ backgroundColor: INK }}
    >
      {children}
    </Link>
  );
}

// Free tools, styled like the dashboard's tinted start cards.
const TOOLS = [
  {
    href: "/ats-check",
    tag: "No sign-up",
    title: "ATS Score Checker",
    desc: "Upload any resume and see what applicant tracking systems flag, instantly.",
    tint: "#f4f1e4",
  },
  {
    href: "/roast",
    tag: "No sign-up",
    title: "Resume Roast",
    desc: "Brutally honest, slightly funny feedback on your resume, plus real fixes.",
    tint: "#e5edcb",
  },
  {
    href: "/linkedin-check",
    tag: "No sign-up",
    title: "LinkedIn Review",
    desc: "Rate your LinkedIn profile the way recruiters see it, with AI rewrites.",
    tint: "#eef0e2",
  },
  {
    href: "/examples",
    tag: "Browse",
    title: "Resume Examples",
    desc: "Role-by-role examples of strong student resumes to steal ideas from.",
    tint: "#f0ead7",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen text-stone-900">
      {/* nav — same frosted capsule as the dashboard header */}
      <header className="sticky top-0 z-40 px-3 pt-3">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-2 rounded-2xl bg-white/45 px-4 py-2.5 shadow-[0_12px_32px_-18px_rgba(27,23,16,0.3)] ring-1 ring-white/60 backdrop-blur-xl">
          <Link href="/" className="flex shrink-0 items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ backgroundColor: LIME }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: INK }}
              />
            </span>
            <span className="text-base font-extrabold tracking-tight">
              ResumeReady
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
            <Link
              href="/ats-check"
              className="hidden rounded-full px-3.5 py-2 text-stone-500 transition hover:bg-white/70 hover:text-stone-900 sm:block"
            >
              ATS Check
            </Link>
            <Link
              href="/roast"
              className="hidden rounded-full px-3.5 py-2 text-stone-500 transition hover:bg-white/70 hover:text-stone-900 sm:block"
            >
              Roast
            </Link>
            <Link
              href="/examples"
              className="hidden rounded-full px-3.5 py-2 text-stone-500 transition hover:bg-white/70 hover:text-stone-900 md:block"
            >
              Examples
            </Link>
            <SignedOut>
              <Link
                href="/sign-in"
                className="rounded-full px-3.5 py-2 text-stone-500 transition hover:bg-white/70 hover:text-stone-900"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full px-5 py-2 font-bold text-[#faf6ee] transition hover:-translate-y-0.5"
                style={{ backgroundColor: INK }}
              >
                Get started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="rounded-full px-5 py-2 font-bold text-[#faf6ee] transition hover:-translate-y-0.5"
                style={{ backgroundColor: INK }}
              >
                Dashboard
              </Link>
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 sm:px-6">
        {/* hero */}
        <section className="grid items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <span className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-500 shadow-sm">
              Free for students
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              You did the work.
              <br />
              We make it{" "}
              <span className="relative inline-block">
                <span
                  className="absolute inset-x-0 bottom-1 top-3 rounded-md"
                  style={{ backgroundColor: LIME }}
                />
                <span className="relative">sound like it.</span>
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-600">
              Describe your projects the way you&apos;d text a friend.
              ResumeReady&apos;s AI rewrites it into a polished, ATS-friendly
              resume with numbers recruiters actually notice, in about 10
              minutes.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <SignedOut>
                <InkButton href="/sign-up">Build my resume for free</InkButton>
              </SignedOut>
              <SignedIn>
                <InkButton href="/dashboard/new">Build my resume</InkButton>
              </SignedIn>
              <Link
                href="/ats-check"
                className="inline-block rounded-full bg-white/70 px-7 py-3.5 text-center text-sm font-bold text-stone-700 ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:bg-white"
              >
                Score my resume, no sign-up
              </Link>
            </div>
          </div>

          <RewriteDemo />
        </section>

        {/* roles */}
        <section className="pb-20">
          <div className="glass-card p-6 sm:p-8">
            <p className="text-center text-[11px] font-bold uppercase tracking-widest text-stone-400">
              Works for whatever you&apos;re applying to
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {ROLES.slice(0, 12).map((r) => (
                <span
                  key={r.slug}
                  className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-stone-600 shadow-sm"
                >
                  {r.title}
                </span>
              ))}
              <span
                className="rounded-full px-4 py-1.5 text-xs font-bold text-stone-900"
                style={{ backgroundColor: LIME }}
              >
                +{ROLES.length - 12} more roles
              </span>
            </div>
          </div>
        </section>

        {/* three steps */}
        <section className="pb-20">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Embarrassingly simple
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Say it plainly",
                d: "“made a website for fest registrations” is a perfectly good answer here. Type it like you'd text a friend.",
              },
              {
                n: "2",
                t: "AI does the hard part",
                d: "Every plain sentence becomes a quantified, recruiter-grade bullet, ordered the right way for your role.",
              },
              {
                n: "3",
                t: "Download & apply",
                d: "One-click ATS-friendly PDF. Run the score checker, fix what's flagged, send it out.",
              },
            ].map((s) => (
              <div key={s.n} className="glass-card p-7">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-[#faf6ee]"
                  style={{ backgroundColor: INK }}
                >
                  {s.n}
                </span>
                <h3 className="mt-4 text-xl font-extrabold tracking-tight">
                  {s.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* free tools */}
        <section className="pb-20">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Free tools
            </h2>
            <p className="text-sm text-stone-500">
              Useful on their own. No payment, ever.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-[28px] p-7 transition hover:-translate-y-1 hover:shadow-xl"
                style={{ backgroundColor: tool.tint }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      {tool.tag}
                    </span>
                    <p className="mt-4 text-xl font-extrabold">{tool.title}</p>
                    <p className="mt-1 text-sm text-stone-500">{tool.desc}</p>
                  </div>
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#faf6ee] transition group-hover:scale-110"
                    style={{ backgroundColor: INK }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M7 17 17 7" />
                      <path d="M8 7h9v9" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* receipts */}
        <section className="pb-20">
          <div
            className="grid gap-10 rounded-[28px] px-8 py-14 text-center sm:grid-cols-4"
            style={{ backgroundColor: INK }}
          >
            {[
              ["10 min", "to your first PDF"],
              ["12", "ATS checks on every resume"],
              ["29+", "roles supported"],
              ["₹0", "now and forever"],
            ].map(([big, small]) => (
              <div key={small}>
                <p
                  className="text-4xl font-extrabold tracking-tight sm:text-5xl"
                  style={{ color: LIME }}
                >
                  {big}
                </p>
                <p className="mt-2 text-sm font-medium text-stone-400">
                  {small}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* final CTA */}
        <section className="pb-24 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Stop fighting Word.
            <br />
            Start getting interviews.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-stone-500">
            Your projects deserve better than “worked on a website”.
          </p>
          <div className="mt-9">
            <SignedOut>
              <InkButton href="/sign-up">Build my resume for free</InkButton>
            </SignedOut>
            <SignedIn>
              <InkButton href="/dashboard">Go to my dashboard</InkButton>
            </SignedIn>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-900/10 py-10 text-center text-sm text-stone-400">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-semibold text-stone-500">
          <Link href="/ats-check" className="hover:text-stone-900">
            Free ATS Checker
          </Link>
          <Link href="/roast" className="hover:text-stone-900">
            Resume Roast
          </Link>
          <Link href="/linkedin-check" className="hover:text-stone-900">
            LinkedIn Review
          </Link>
          <Link href="/examples" className="hover:text-stone-900">
            Resume Examples
          </Link>
          <a href="mailto:skandaumesh82@gmail.com" className="hover:text-stone-900">
            Contact
          </a>
        </div>
        © {new Date().getFullYear()} ResumeReady. Made for students, by
        students.
      </footer>
    </div>
  );
}
