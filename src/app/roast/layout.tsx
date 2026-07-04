import type { Metadata } from "next";

// The page itself is a client component, so its SEO metadata lives here.
export const metadata: Metadata = {
  title: "Resume Roast: brutally honest AI feedback, free | ResumeReady",
  description:
    "Get your resume roasted by AI: funny, honest feedback on cliches, vague bullets, and missing numbers, plus three concrete fixes. Free, no sign-up.",
};

export default function RoastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
