"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

const INK = "#2563eb";
const LIME = "#dbeafe";

// Restyles just the account popover (avatar menu) to match the app's own
// card/pill language instead of Clerk's default look, and hides the
// "Development mode" footer (test keys are still active; it's just noise
// here since Clerk already surfaces that during actual local dev).
const USER_BUTTON_APPEARANCE = {
  variables: { colorPrimary: "#2563eb", borderRadius: "13px" },
  elements: {
    userButtonPopoverCard: "rounded-2xl shadow-lg border border-stone-200 p-1",
    userButtonPopoverMain: "p-3",
    userPreviewAvatarBox: "h-10 w-10",
    userButtonPopoverActionButton: "rounded-[11px] mx-1 my-0.5 hover:bg-stone-100",
    userButtonPopoverActionButtonIcon: "text-stone-500",
    userButtonPopoverFooter: "hidden",
  },
} as const;

const LINKS = [
  {
    href: "/dashboard",
    label: "Resumes",
    // active for the dashboard itself and anything resume-related
    isActive: (p: string) =>
      p === "/dashboard" || p.startsWith("/dashboard/new") || p.startsWith("/resume"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/templates",
    label: "Templates",
    isActive: (p: string) => p.startsWith("/dashboard/templates"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/ats",
    label: "ATS Score",
    isActive: (p: string) => p.startsWith("/dashboard/ats"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
        <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/linkedin",
    label: "LinkedIn",
    isActive: (p: string) => p.startsWith("/dashboard/linkedin"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
        <rect x="2" y="2" width="20" height="20" rx="4" />
        <path d="M7 10v7" />
        <circle cx="7" cy="7" r="0.5" />
        <path d="M11 17v-4a3 3 0 0 1 6 0v4" />
        <path d="M11 10v1" />
      </svg>
    ),
  },
];

// lucide "panel-left-close" — mirrored via scaleX when the sidebar is
// collapsed, so the chevron always points the direction the click will open.
function PanelIcon({ flipped }: { flipped?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.125"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-auto ${flipped ? "-scale-x-100" : ""}`}
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </svg>
  );
}

const COLLAPSED_W = "62px";
const EXPANDED_W = "232px";
const STORAGE_KEY = "resumeready-sidebar-collapsed";
export const TOPBAR_H = "56px";

// The sidebar keeps a CSS variable in sync with its own collapse state, so
// sibling pages can offset their content with this one class without each
// page needing to know (or re-render on) whether the rail is expanded. The
// top bar's height is fixed (it doesn't collapse), so that offset is static.
export const APP_SIDEBAR_WIDTH_CLASS =
  "md:pt-14 md:pl-[var(--app-sidebar-w,62px)] transition-[padding-left] duration-300";

export default function AppHeader() {
  const pathname = usePathname() || "";
  const [collapsed, setCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initialCollapsed = stored !== "0";
    // Set the width variable synchronously, in the same effect that flips
    // `collapsed`, so the CSS var and the aside's own width change land in
    // the same paint — otherwise the aside jumps to its new width a render
    // before the var catches up, and page content sits behind it for a frame.
    document.documentElement.style.setProperty(
      "--app-sidebar-w",
      initialCollapsed ? COLLAPSED_W : EXPANDED_W,
    );
    setCollapsed(initialCollapsed);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty(
      "--app-sidebar-w",
      collapsed ? COLLAPSED_W : EXPANDED_W,
    );
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  return (
    <>
      {/* mobile: compact top bar — the icon rail below is desktop-only */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-hairline bg-white/90 px-3 py-2.5 backdrop-blur-xl md:hidden">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-1.5 pl-1">
          <img src="/logo-clean.png" alt="ResumeReady" className="h-6 w-auto" />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = l.isActive(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                title={l.label}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active ? "text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                }`}
                style={active ? { backgroundColor: INK } : undefined}
              >
                {l.icon}
              </Link>
            );
          })}
        </nav>
        <span className="rounded-full ring-2 ring-stone-900/10">
          <UserButton appearance={USER_BUTTON_APPEARANCE} />
        </span>
      </header>

      {/* desktop: full-width top bar — logo/toggle on the left, account
          avatar on the right. Sits above both the sidebar and the content
          card, which both start below it (see TOPBAR_H). */}
      <div className="fixed inset-x-0 top-0 z-50 hidden h-14 items-center justify-between bg-white/90 px-4 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-1.5 pr-1" title="ResumeReady">
            {collapsed ? (
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg">
                <img src="/favicon.png" alt="ResumeReady" className="h-9 w-9 scale-[1.8] object-contain" />
              </span>
            ) : (
              <img src="/logo-clean.png" alt="ResumeReady" className="h-6 w-auto" />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="soft-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition hover:brightness-95"
          >
            <PanelIcon flipped={collapsed} />
          </button>
        </div>
        <span className="soft-surface flex h-10 w-10 items-center justify-center rounded-full">
          <UserButton appearance={USER_BUTTON_APPEARANCE} />
        </span>
      </div>

      {/* desktop: collapsible icon rail, starting below the top bar */}
      <aside
        className="fixed bottom-0 left-0 top-14 z-40 hidden flex-col bg-white/90 py-4 backdrop-blur-xl transition-[width] duration-300 md:flex"
        style={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      >
        {/* nav */}
        <nav className={`flex flex-col gap-1.5 ${collapsed ? "items-center" : "px-2"}`}>
          {LINKS.map((l) => {
            const active = l.isActive(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                title={l.label}
                className={`flex items-center rounded-xl border text-sm font-semibold transition-colors duration-300 ease-in-out ${
                  collapsed ? "h-9 w-9 justify-center" : "gap-2.5 px-3 py-2.5"
                } ${
                  active
                    ? "border-blue-200 bg-blue-50 text-[#3385f9]"
                    : "border-transparent text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                {l.icon}
                {!collapsed && l.label}
              </Link>
            );
          })}
        </nav>

        <div className={`mt-3 border-t border-hairline ${collapsed ? "mx-auto w-8" : "mx-2"}`} />

        <Link
          href="/dashboard/new"
          title="New resume"
          className={`mt-3 flex items-center font-bold text-stone-900 shadow-sm transition hover:-translate-y-0.5 ${
            collapsed
              ? "mx-auto h-9 w-9 justify-center rounded-[11px] text-lg"
              : "mx-2 gap-1 rounded-xl px-3.5 py-2.5 text-sm"
          }`}
          style={{ backgroundColor: LIME }}
        >
          <span className={collapsed ? "leading-none" : "text-base leading-none"}>+</span>
          {!collapsed && "New resume"}
        </Link>
      </aside>
    </>
  );
}
