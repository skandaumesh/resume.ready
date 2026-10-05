"use client";

import Link from "next/link";

// Shown when a no-login tool's daily limit is used up for the whole network
// (the API answers 429 with `signIn: true`) — e.g. a class on one campus
// Wi-Fi. Signing in brings the student back to this page, and from then on
// their checks count per account instead of per network.
// `className` sets spacing and alignment, e.g. "mt-4 justify-center".
export default function SignInToContinue({ className = "mt-3" }: { className?: string }) {
  // Only ever rendered after a failed upload, so this runs in the browser.
  const back = encodeURIComponent(window.location.href);
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Link href={`/sign-in?redirect_url=${back}`} className="btn-primary px-5 py-2.5 text-sm">
        Sign in to keep checking
      </Link>
      <Link href={`/sign-up?redirect_url=${back}`} className="composer-btn px-4 py-2.5 text-sm">
        New here? Create a free account
      </Link>
    </div>
  );
}
