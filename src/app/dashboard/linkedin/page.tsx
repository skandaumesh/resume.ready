"use client";

import AppHeader from "@/components/AppHeader";
import LinkedInReview from "@/components/LinkedInReview";

// Signed-in LinkedIn review — same flow as the public /linkedin-check page,
// but on the user's much higher daily AI budget.
export default function LinkedInReviewPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            LinkedIn Profile Review
          </h1>
          <p className="text-sm text-stone-500">
            Rate your LinkedIn profile the way a recruiter (and LinkedIn&apos;s
            own search) sees it.
          </p>
        </div>
        <LinkedInReview
          analyzeEndpoint="/api/linkedin/analyze"
          suggestEndpoint="/api/linkedin/suggest"
        />
      </main>
    </div>
  );
}
