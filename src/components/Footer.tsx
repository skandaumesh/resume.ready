import Link from "next/link";
import { GradientBlur } from "@/components/ui/gradient-blur";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/#tools", label: "Free Tools" },
      { href: "/#faq", label: "FAQ" },
      { href: "/dashboard/templates", label: "Templates" },
    ],
  },
  {
    heading: "Tools",
    links: [
      { href: "/ats-check", label: "ATS Score Checker" },
      { href: "/roast", label: "Resume Roast" },
      { href: "/linkedin-check", label: "LinkedIn Review" },
    ],
  },
  {
    heading: "Get Started",
    links: [
      { href: "/sign-up", label: "Sign Up" },
      { href: "/sign-in", label: "Log In" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "mailto:skandaumesh82@gmail.com", label: "Contact" },
    ],
  },
];

// Brand footer: the real product logo sized to the content column, with a
// mouse-follow colour glow layered behind it (GradientBlur), light-grey
// surface, link columns below.
export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-hairline bg-canvas-deep">
      <GradientBlur
        className="z-0"
        color={[37, 99, 235]}
        radius={90}
        opacityDecay={0.06}
      />

      <div className="relative z-10 pt-14">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          {/* wordmark — the real product logo, sized to the same container
              as the columns below instead of bleeding full-width */}
          <img
            src="/logo-clean.png"
            alt="ResumeReady"
            className="pointer-events-none mx-auto block w-full max-w-xl select-none sm:max-w-3xl"
          />
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 pb-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.heading} className="flex flex-col items-center">
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="flex items-center justify-center gap-1.5 text-sm font-medium text-content-primary transition hover:text-brand-600"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3 shrink-0 text-content-faint"
                        >
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="relative border-t border-hairline py-6 text-center text-sm text-content-faint">
            © {new Date().getFullYear()} ResumeReady. Made for students, by
            students.
          </div>
        </div>
      </div>
    </footer>
  );
}
