"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const INK = "#1b1710";
const LIME = "#d9f24e";

const LINKS = [
  {
    href: "/dashboard",
    label: "Resumes",
    // active for the dashboard itself and anything resume-related
    isActive: (p: string) =>
      p === "/dashboard" || p.startsWith("/dashboard/new") || p.startsWith("/resume"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/ats",
    label: "ATS Score",
    isActive: (p: string) => p.startsWith("/dashboard/ats"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 8v4l3 2" />
        <path d="M19 3l2 2-4 4-2-2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/enhance",
    label: "JD Enhancer",
    isActive: (p: string) => p.startsWith("/dashboard/enhance"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/linkedin",
    label: "LinkedIn",
    isActive: (p: string) => p.startsWith("/dashboard/linkedin"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="2" y="2" width="20" height="20" rx="4" />
        <path d="M7 10v7" />
        <circle cx="7" cy="7" r="0.5" />
        <path d="M11 17v-4a3 3 0 0 1 6 0v4" />
        <path d="M11 10v1" />
      </svg>
    ),
  },
];

// Floating frosted-glass nav: transparent over the sage background, with an
// ink capsule marking the active tool. Icon-only on phones, icon + label
// from sm: up.
export default function AppHeader() {
  const pathname = usePathname() || "";

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-2 rounded-2xl bg-white/45 px-3 py-2 shadow-[0_12px_32px_-18px_rgba(27,23,16,0.3)] ring-1 ring-white/60 backdrop-blur-xl sm:px-4">
        {/* wordmark */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-1.5 pl-1">
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
          <span className="hidden text-base font-extrabold tracking-tight text-stone-900 md:block">
            ResumeReady
          </span>
        </Link>

        {/* tools */}
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = l.isActive(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                title={l.label}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 sm:px-4 ${
                  active
                    ? "text-[#faf6ee] shadow-md"
                    : "text-stone-500 hover:bg-white/70 hover:text-stone-900"
                }`}
                style={active ? { backgroundColor: INK } : undefined}
              >
                {l.icon}
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/new"
            className="hidden items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-bold text-stone-900 shadow-sm transition hover:-translate-y-0.5 sm:flex"
            style={{ backgroundColor: LIME }}
          >
            <span className="text-base leading-none">+</span> New
          </Link>
          <span className="rounded-full ring-2 ring-stone-900/10">
            <UserButton />
          </span>
        </div>
      </div>
    </header>
  );
}
