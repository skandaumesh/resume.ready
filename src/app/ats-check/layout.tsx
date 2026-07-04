import type { Metadata } from "next";

// The page itself is a client component, so its SEO metadata lives here.
export const metadata: Metadata = {
  title: "Free ATS Resume Checker: instant score, no sign-up | ResumeReady",
  description:
    "Upload your resume and get an instant ATS compatibility score with a check-by-check report. See what applicant tracking systems flag, free and without signing up.",
};

export default function AtsCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
