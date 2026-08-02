import Link from "next/link";
import Footer from "@/components/Footer";

const NAV_LINKS = [
  { href: "/ats-check", label: "ATS Check", className: "sm:block" },
  { href: "/roast", label: "Roast", className: "sm:block" },
  { href: "/linkedin-check", label: "LinkedIn", className: "md:block" },
];

// Chrome for the public (no-login) tool pages: /ats-check, /roast, /linkedin-check.
// Same system as the landing page: warm off-white canvas, hairline borders,
// greyscale type with a single blue action colour.
export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center">
            <img
              src="/logo-clean.png"
              alt="ResumeReady"
              className="h-6 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`hidden rounded-full px-3.5 py-2 text-[15px] font-semibold text-content-primary transition hover:bg-canvas-deep hover:text-content-strong ${l.className}`}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/sign-in" className="composer-btn px-3.5 py-2 text-sm">
              Log in
            </Link>
            <Link href="/sign-up" className="composer-btn px-3.5 py-2 text-sm">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-16 pt-10 sm:px-8">
        {children}
      </main>

      {/* conversion band */}
      <section className="mx-auto max-w-4xl px-5 pb-20 sm:px-8">
        <div className="glass-card px-8 py-14 text-center">
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] sm:text-[32px]">
            Fix everything this found, free.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-content-muted">
            ResumeReady rewrites your plain sentences into a polished,
            ATS-friendly resume in about 10 minutes. Built for Indian students.
          </p>
          <Link href="/sign-up" className="btn-primary mt-8">
            Build my resume for free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
