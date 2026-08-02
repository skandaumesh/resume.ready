import Link from "next/link";
import HideLastUsedBadge from "@/components/HideLastUsedBadge";

// Two-column auth shell: the Clerk form on the left, a hero panel with a
// floating prompt on the right (hidden on small screens). Used by both the
// sign-in and sign-up pages.
export default function AuthLayout({
  children,
  switcher,
}: {
  children: React.ReactNode;
  switcher?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <HideLastUsedBadge />
      {/* ── left: form ──────────────────────────────────────────────── */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="p-6 sm:p-8">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/logo-clean.png"
              alt="ResumeReady"
              className="h-7 w-auto"
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-20">
          {/* outer container holding the form — flat light-grey fill, no
              border/heavy shadow, matching the reference */}
          <div className="w-full max-w-md rounded-[28px] bg-[#f5f5f4] p-6 sm:p-8">
            {children}
            {switcher && (
              <p className="mt-3 text-center text-sm text-content-muted">
                {switcher}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── right: hero panel ───────────────────────────────────────── */}
      <div className="relative m-3 hidden w-1/2 overflow-hidden rounded-3xl lg:block">
        <img
          src="/hero.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <div className="soft-surface w-full max-w-md rounded-[13px] p-3">
            <div className="flex items-center gap-2">
              <span className="flex-1 px-3 py-3 text-base font-medium text-black">
                Turn your experience into a resume
                <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-black/60" />
              </span>
              <span className="composer-send flex h-9 w-9 shrink-0 items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
