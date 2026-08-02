import type { Appearance } from "@clerk/types";

// Shared Clerk styling: the widget blends into our own container (no card
// chrome), and the Clerk branding + development badge footer is hidden.
export const authAppearance: Appearance = {
  variables: {
    colorPrimary: "#2563eb",
    borderRadius: "13px",
  },
  elements: {
    rootBox: "w-full",
    // Flatten both card wrappers so the form blends into our own container
    // (no box-in-a-box) — the outer white card comes from AuthLayout instead.
    cardBox: "bg-transparent shadow-none border-0 w-full",
    card: "bg-transparent shadow-none border-0 p-0 w-full",
    header: "gap-1.5",
    footer: "hidden",
    logoBox: "hidden",
    // Clerk's "Last used" pill on the social button (only shows once this
    // browser has signed in with that provider before) — always hidden.
    // "!hidden" forces !important since Clerk's own badge CSS otherwise wins.
    badge: "!hidden",
    // pill-shaped inputs and social button, matching the homepage's rounded
    // prompt/composer inputs instead of the previous soft-rectangle style
    formFieldInput: "!rounded-full border-[#e3e3e1] bg-white px-4",
    socialButtonsBlockButton: "!rounded-full border-[#e3e3e1] bg-white",
    formFieldLabel: "text-content-strong font-medium",
    // keep every field (and the first-name/last-name row halves) filling
    // its column evenly, instead of drifting with content width
    formFieldRow: "w-full gap-3",
    formField: "w-full",
    // formButtonPrimary — a soft pastel blue, matching the reference's
    // "Continue" button instead of the site's vivid brand-600 blue.
    formButtonPrimary:
      "btn-gradient !rounded-[13px] !border-0 !shadow-[0_3px_6px_-2px_rgba(58,137,253,0.55),inset_0_1px_3px_rgba(255,255,255,0.5)] py-3.5 text-sm font-medium normal-case focus:!ring-0",
    headerTitle: "text-3xl font-bold tracking-tight text-content-strong",
    headerSubtitle: "text-content-muted",
    dividerText: "text-content-faint",
  },
};

// Applied app-wide via ClerkProvider, so every Clerk-rendered surface (the
// UserProfile "Manage account" modal, etc.) picks up the same colors/radius
// as the rest of the site. Deliberately narrower than `authAppearance` above
// — this must never touch card/cardBox, since modals like UserProfile need
// their own visible floating card rather than blending into a container.
export const globalClerkAppearance: Appearance = {
  variables: { colorPrimary: "#2563eb", borderRadius: "13px" },
  elements: {
    badge: "!hidden",
    // Same "Clerk branding + development badge" footer authAppearance hides
    // for sign-in/up — UserProfile shares the same footer descriptor. Needs
    // "!hidden" (not "hidden") to out-specificity Clerk's own footer CSS.
    footer: "!hidden",
    navbarButton: "text-stone-600",
    formButtonPrimary: "btn-gradient !rounded-[11px] !border-0 !shadow-none normal-case",
    profileSectionPrimaryButton: "text-brand-600",
  },
};

// Overrides Clerk's default copy so the sign-in/sign-up screens read like
// the rest of the site instead of the generic "Sign in to My Application".
export const authLocalization = {
  signIn: {
    start: {
      title: "Welcome back",
      subtitle: "Sign in to your account to continue",
    },
  },
  signUp: {
    start: {
      title: "Create your account",
      subtitle: "Get started for free, no credit card required",
    },
  },
  formFieldLabel__emailAddress: "Email",
  formFieldInputPlaceholder__emailAddress: "you@example.com",
};
