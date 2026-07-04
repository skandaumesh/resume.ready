import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import LinkedInReview from "@/components/LinkedInReview";

export const metadata: Metadata = {
  title: "Free LinkedIn Profile Review: rated like a recruiter sees it",
  description:
    "Upload your LinkedIn profile PDF and get an instant rating plus AI rewrites for your headline, About, and experience. Free, no sign-up.",
};

// Public no-login LinkedIn review (acquisition funnel, like /ats-check and
// /roast). IP rate-limited server-side; signing up unlocks a much higher
// daily AI budget.
export default function LinkedInCheckPage() {
  return (
    <PublicShell>
      <div className="pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          LinkedIn Profile Review
        </h1>
        <p className="mt-2 max-w-xl text-stone-500">
          Rate your LinkedIn profile the way a recruiter (and LinkedIn&apos;s
          own search) sees it — with AI rewrites for what&apos;s weak. Free, no
          sign-up.
        </p>
      </div>
      <LinkedInReview
        analyzeEndpoint="/api/public/linkedin"
        suggestEndpoint="/api/public/linkedin/coach"
      />
    </PublicShell>
  );
}
