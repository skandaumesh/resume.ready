import Link from "next/link";

const INK = "#1b1710";
const LIME = "#d9f24e";

// Chrome for the public (no-login) tool pages: /ats-check, /roast, /examples.
// Same design language as the dashboard: sage background (global), frosted
// glass header capsule, ink/lime accents.
export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-stone-900">
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
              href="/linkedin-check"
              className="hidden rounded-full px-3.5 py-2 text-stone-500 transition hover:bg-white/70 hover:text-stone-900 md:block"
            >
              LinkedIn
            </Link>
            <Link
              href="/examples"
              className="hidden rounded-full px-3.5 py-2 text-stone-500 transition hover:bg-white/70 hover:text-stone-900 lg:block"
            >
              Examples
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full px-5 py-2 font-bold text-[#faf6ee] transition hover:-translate-y-0.5"
              style={{ backgroundColor: INK }}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-screen-lg px-5 pb-16 pt-8 sm:px-8">
        {children}
      </main>

      {/* conversion band */}
      <section className="mx-auto max-w-screen-lg px-5 pb-16 sm:px-8">
        <div
          className="rounded-[28px] px-8 py-12 text-center"
          style={{ backgroundColor: INK }}
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-[#faf6ee] sm:text-4xl">
            Fix everything this found, free.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-stone-400">
            ResumeReady rewrites your plain sentences into a polished,
            ATS-friendly resume in about 10 minutes. Built for Indian students.
          </p>
          <Link
            href="/sign-up"
            className="mt-7 inline-block rounded-full px-9 py-4 text-base font-bold text-stone-900 transition hover:-translate-y-0.5"
            style={{ backgroundColor: LIME }}
          >
            Build my resume for free
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-900/10 py-8 text-center text-sm text-stone-400">
        © {new Date().getFullYear()} ResumeReady. Made for students, by
        students.
      </footer>
    </div>
  );
}
