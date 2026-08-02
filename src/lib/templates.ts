// Resume templates. Each template is a design PRESET: a layout + typography +
// accent color. Most are single-column and fully ATS-safe; a few "photo"
// templates use a two-column sidebar for a more designed look (great for
// portfolios / creative roles, less ideal for strict ATS pipelines).
//
// The design is data-driven: renderResumeHtml (src/lib/resumeHtml.ts) turns a
// preset + optional overrides (accent color, font, photo) into HTML/CSS, so
// adding a template here is enough to make it appear everywhere (gallery,
// live preview, PDF).

import { ROLES } from "@/lib/roles";

export type TemplateId = string;

export type LayoutKind = "single" | "band" | "sidebar-left" | "sidebar-right" | "highlight-grid" | "timeline";

// Role categories used to group templates in the homepage/gallery tabs.
// A template can suit more than one field, so this is an array.
export type RoleCategory = "tech" | "finance" | "accounting" | "data" | "marketing" | "general";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  category: "Simple" | "Modern" | "Professional" | "Creative";
  layout: LayoutKind;
  align: "left" | "center";
  fontId: FontId;
  accent: string; // default accent hex
  photo: boolean; // true → has a photo slot
  roles: RoleCategory[];
}

// ── Fonts (all web-safe so they render identically in preview and PDF) ───────
export type FontId = "serif" | "sans" | "modern" | "classic";

export const FONTS: Record<FontId, { name: string; stack: string }> = {
  sans: { name: "Sans", stack: '"Segoe UI", Arial, Helvetica, sans-serif' },
  serif: { name: "Serif", stack: 'Georgia, "Times New Roman", serif' },
  modern: { name: "Modern", stack: '"Trebuchet MS", "Segoe UI", sans-serif' },
  classic: { name: "Classic", stack: '"Times New Roman", Georgia, serif' },
};

// ── Accent color swatches (Colors tab) ───────────────────────────────────────
export const ACCENTS: { name: string; value: string }[] = [
  { name: "Indigo", value: "#4f46e5" },
  { name: "Blue", value: "#2563eb" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Teal", value: "#0d9488" },
  { name: "Green", value: "#059669" },
  { name: "Rose", value: "#db2777" },
  { name: "Amber", value: "#d97706" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Slate", value: "#0f172a" },
];

// Per-render overrides the user can pick in the gallery (persisted in contact
// JSON under reserved `_`-prefixed keys, so no DB migration is needed).
export interface TemplateOptions {
  accent?: string;
  font?: FontId;
  photo?: string; // data URL of the uploaded headshot
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Centered serif header. Safe, formal choice for corporate, finance and HR.",
    category: "Simple",
    layout: "single",
    align: "center",
    fontId: "serif",
    accent: "#111111",
    photo: false,
    roles: ["general", "finance", "accounting"],
  },
  {
    id: "modern",
    name: "Modern",
    description: "Left-aligned with a colored accent rule. Clean and contemporary for tech and data.",
    category: "Modern",
    layout: "single",
    align: "left",
    fontId: "sans",
    accent: "#4f46e5",
    photo: false,
    roles: ["general", "tech", "data"],
  },
  {
    id: "compact",
    name: "Compact",
    description: "Tighter spacing and smaller type. Fits more on one page.",
    category: "Simple",
    layout: "single",
    align: "center",
    fontId: "sans",
    accent: "#111111",
    photo: false,
    roles: ["general", "accounting"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Understated, generous whitespace, thin dividers. Lets the content speak.",
    category: "Simple",
    layout: "single",
    align: "left",
    fontId: "sans",
    accent: "#334155",
    photo: false,
    roles: ["general", "marketing"],
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Refined serif with a purple accent. Polished and editorial.",
    category: "Professional",
    layout: "single",
    align: "center",
    fontId: "classic",
    accent: "#7c3aed",
    photo: false,
    roles: ["general", "marketing"],
  },
  {
    id: "executive",
    name: "Executive",
    description: "Bold full-width name band. Commanding, senior-level presence.",
    category: "Professional",
    layout: "band",
    align: "left",
    fontId: "serif",
    accent: "#0f172a",
    photo: false,
    roles: ["general", "finance"],
  },
  {
    id: "tech",
    name: "Tech",
    description: "Crisp sans with a sky accent and mono-style dates. Built for engineers.",
    category: "Modern",
    layout: "single",
    align: "left",
    fontId: "modern",
    accent: "#0ea5e9",
    photo: false,
    roles: ["tech", "data"],
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Traditional two-tone header, blue accent. Reliable business standard.",
    category: "Professional",
    layout: "band",
    align: "left",
    fontId: "classic",
    accent: "#1d4ed8",
    photo: false,
    roles: ["finance", "accounting"],
  },
  {
    id: "fresh",
    name: "Fresh",
    description: "Airy green accent, friendly sans. Great for early-career profiles.",
    category: "Modern",
    layout: "single",
    align: "center",
    fontId: "sans",
    accent: "#059669",
    photo: false,
    roles: ["marketing", "tech"],
  },
  {
    id: "portrait",
    name: "Portrait",
    description: "Left sidebar with a photo, skills and contact. A designed, personal look.",
    category: "Creative",
    layout: "sidebar-left",
    align: "left",
    fontId: "sans",
    accent: "#1e293b",
    photo: true,
    roles: ["marketing", "general"],
  },
  {
    id: "profile",
    name: "Profile",
    description: "Right sidebar with a photo and highlights. Modern and balanced.",
    category: "Creative",
    layout: "sidebar-right",
    align: "left",
    fontId: "modern",
    accent: "#2563eb",
    photo: true,
    roles: ["marketing", "tech"],
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "Colored header band with a circular photo. Bold and creative.",
    category: "Creative",
    layout: "band",
    align: "left",
    fontId: "modern",
    accent: "#db2777",
    photo: true,
    roles: ["marketing"],
  },

  // ── Tech ────────────────────────────────────────────────────────────────
  {
    id: "terminal",
    name: "Terminal",
    description: "Dark slate accent, structured spacing. Reads like a well-commented codebase.",
    category: "Modern",
    layout: "single",
    align: "left",
    fontId: "modern",
    accent: "#0f172a",
    photo: false,
    roles: ["tech"],
  },
  {
    id: "stack",
    name: "Stack",
    description: "Sky-blue name band up top, single column below. Built for full-stack profiles.",
    category: "Modern",
    layout: "band",
    align: "left",
    fontId: "sans",
    accent: "#0ea5e9",
    photo: false,
    roles: ["tech"],
  },
  {
    id: "cloud",
    name: "Cloud",
    description: "Clean left-aligned sans with a cool blue accent. Suits infra and DevOps roles.",
    category: "Modern",
    layout: "single",
    align: "left",
    fontId: "sans",
    accent: "#0284c7",
    photo: false,
    roles: ["tech", "data"],
  },
  {
    id: "byte",
    name: "Byte",
    description: "Dark left sidebar with photo and skills, main column for experience. Portfolio-ready.",
    category: "Creative",
    layout: "sidebar-left",
    align: "left",
    fontId: "modern",
    accent: "#111827",
    photo: true,
    roles: ["tech"],
  },
  {
    id: "syntax",
    name: "Syntax",
    description: "Left-aligned with a violet accent rule. A distinct alternative to the standard Modern look.",
    category: "Modern",
    layout: "single",
    align: "left",
    fontId: "modern",
    accent: "#7c3aed",
    photo: false,
    roles: ["tech"],
  },
  {
    id: "pixel",
    name: "Pixel",
    description: "Blue header band with a sans body. Good middle ground for product-minded engineers.",
    category: "Modern",
    layout: "band",
    align: "left",
    fontId: "sans",
    accent: "#2563eb",
    photo: false,
    roles: ["tech"],
  },

  // ── Finance ─────────────────────────────────────────────────────────────
  {
    id: "ledger",
    name: "Ledger",
    description: "Centered navy serif header. Conservative and bank-appropriate.",
    category: "Professional",
    layout: "single",
    align: "center",
    fontId: "classic",
    accent: "#0f172a",
    photo: false,
    roles: ["finance"],
  },
  {
    id: "capital",
    name: "Capital",
    description: "Deep-blue name band, serif body. A senior, investment-banking presence.",
    category: "Professional",
    layout: "band",
    align: "left",
    fontId: "serif",
    accent: "#1e3a5f",
    photo: false,
    roles: ["finance"],
  },
  {
    id: "reserve",
    name: "Reserve",
    description: "Centered serif with a deep green accent. Steady and understated.",
    category: "Professional",
    layout: "single",
    align: "center",
    fontId: "serif",
    accent: "#14532d",
    photo: false,
    roles: ["finance"],
  },
  {
    id: "audit",
    name: "Audit",
    description: "Left-aligned classic type in slate grey. Precise, no-frills, ATS-first.",
    category: "Simple",
    layout: "single",
    align: "left",
    fontId: "classic",
    accent: "#334155",
    photo: false,
    roles: ["finance", "accounting"],
  },
  {
    id: "vault",
    name: "Vault",
    description: "Navy name band with a classic body. For senior finance and treasury roles.",
    category: "Professional",
    layout: "band",
    align: "left",
    fontId: "classic",
    accent: "#0f172a",
    photo: false,
    roles: ["finance"],
  },
  {
    id: "prime",
    name: "Prime",
    description: "Centered serif with a blue accent. A dependable analyst-desk standard.",
    category: "Professional",
    layout: "single",
    align: "center",
    fontId: "serif",
    accent: "#1d4ed8",
    photo: false,
    roles: ["finance"],
  },
  {
    id: "equity",
    name: "Equity",
    description: "Left-aligned serif in deep teal-green. Calm and credible.",
    category: "Professional",
    layout: "single",
    align: "left",
    fontId: "serif",
    accent: "#065f46",
    photo: false,
    roles: ["finance"],
  },

  // ── Accounting ──────────────────────────────────────────────────────────
  {
    id: "balance",
    name: "Balance",
    description: "Centered sans with a teal accent. Clean alignment for figure-heavy resumes.",
    category: "Simple",
    layout: "single",
    align: "center",
    fontId: "sans",
    accent: "#0f766e",
    photo: false,
    roles: ["accounting"],
  },
  {
    id: "reconcile",
    name: "Reconcile",
    description: "Left-aligned classic serif in slate. Formal and easy to scan line by line.",
    category: "Simple",
    layout: "single",
    align: "left",
    fontId: "classic",
    accent: "#334155",
    photo: false,
    roles: ["accounting"],
  },
  {
    id: "figures",
    name: "Figures",
    description: "Centered sans with a cool blue accent. Straightforward and tidy.",
    category: "Simple",
    layout: "single",
    align: "center",
    fontId: "sans",
    accent: "#0369a1",
    photo: false,
    roles: ["accounting"],
  },
  {
    id: "precise",
    name: "Precise",
    description: "Left-aligned sans in near-black. Minimal color, maximum legibility.",
    category: "Simple",
    layout: "single",
    align: "left",
    fontId: "sans",
    accent: "#111827",
    photo: false,
    roles: ["accounting"],
  },
  {
    id: "statement",
    name: "Statement",
    description: "Dark grey name band, classic serif body. A firm, professional-services look.",
    category: "Professional",
    layout: "band",
    align: "left",
    fontId: "classic",
    accent: "#1f2937",
    photo: false,
    roles: ["accounting"],
  },
  {
    id: "trial",
    name: "Trial",
    description: "Centered serif in navy. A safe, traditional choice for audit and controllership roles.",
    category: "Professional",
    layout: "single",
    align: "center",
    fontId: "serif",
    accent: "#0f172a",
    photo: false,
    roles: ["accounting"],
  },
  {
    id: "accord",
    name: "Accord",
    description: "Left-aligned sans with a deep green accent. Clean and dependable.",
    category: "Simple",
    layout: "single",
    align: "left",
    fontId: "sans",
    accent: "#065f46",
    photo: false,
    roles: ["accounting"],
  },

  // ── Data & Analytics ────────────────────────────────────────────────────
  {
    id: "insight",
    name: "Insight",
    description: "Sky-blue left sidebar with photo and skills, main column for projects and impact.",
    category: "Creative",
    layout: "sidebar-left",
    align: "left",
    fontId: "sans",
    accent: "#0ea5e9",
    photo: true,
    roles: ["data"],
  },
  {
    id: "metric",
    name: "Metric",
    description: "Teal name band, sans body. Built to lead with quantified impact.",
    category: "Modern",
    layout: "band",
    align: "left",
    fontId: "modern",
    accent: "#0d9488",
    photo: false,
    roles: ["data"],
  },
  {
    id: "dataset",
    name: "Dataset",
    description: "Left-aligned sans with a violet accent. Clear hierarchy for dense project lists.",
    category: "Modern",
    layout: "single",
    align: "left",
    fontId: "sans",
    accent: "#7c3aed",
    photo: false,
    roles: ["data"],
  },
  {
    id: "query",
    name: "Query",
    description: "Left-aligned modern sans in blue. Sharp and analytical.",
    category: "Modern",
    layout: "single",
    align: "left",
    fontId: "modern",
    accent: "#2563eb",
    photo: false,
    roles: ["data"],
  },
  {
    id: "pipeline",
    name: "Pipeline",
    description: "Cyan name band, sans body. Suits data engineering and ETL-heavy roles.",
    category: "Modern",
    layout: "band",
    align: "left",
    fontId: "sans",
    accent: "#0891b2",
    photo: false,
    roles: ["data"],
  },
  {
    id: "signal",
    name: "Signal",
    description: "Left-aligned modern sans in green. Calm, confident, metrics-forward.",
    category: "Modern",
    layout: "single",
    align: "left",
    fontId: "modern",
    accent: "#059669",
    photo: false,
    roles: ["data"],
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Right sidebar with photo, dark slate accent. A structured, analytical layout.",
    category: "Creative",
    layout: "sidebar-right",
    align: "left",
    fontId: "sans",
    accent: "#1e293b",
    photo: true,
    roles: ["data"],
  },
  {
    id: "trend",
    name: "Trend",
    description: "Left-aligned sans with a sky accent. A lighter-touch alternative to Insight.",
    category: "Modern",
    layout: "single",
    align: "left",
    fontId: "sans",
    accent: "#0ea5e9",
    photo: false,
    roles: ["data"],
  },

  // ── Marketing ───────────────────────────────────────────────────────────
  {
    id: "campaign",
    name: "Campaign",
    description: "Bold pink name band, modern sans body. Made to stand out in a stack of resumes.",
    category: "Creative",
    layout: "band",
    align: "left",
    fontId: "modern",
    accent: "#db2777",
    photo: false,
    roles: ["marketing"],
  },
  {
    id: "story",
    name: "Story",
    description: "Centered modern sans with a warm orange accent. Friendly and narrative-driven.",
    category: "Creative",
    layout: "single",
    align: "center",
    fontId: "modern",
    accent: "#f97316",
    photo: false,
    roles: ["marketing"],
  },
  {
    id: "buzz",
    name: "Buzz",
    description: "Amber name band, sans body. Energetic without losing readability.",
    category: "Creative",
    layout: "band",
    align: "left",
    fontId: "sans",
    accent: "#d97706",
    photo: false,
    roles: ["marketing"],
  },
  {
    id: "reach",
    name: "Reach",
    description: "Centered modern sans with a rose accent. Confident and campaign-ready.",
    category: "Creative",
    layout: "single",
    align: "center",
    fontId: "modern",
    accent: "#db2777",
    photo: false,
    roles: ["marketing"],
  },
  {
    id: "highlight",
    name: "Highlight",
    description: "Bold uppercase name header, two columns, and an icon-accented achievements panel.",
    category: "Modern",
    layout: "highlight-grid",
    align: "left",
    fontId: "sans",
    accent: "#2563eb",
    photo: false,
    roles: ["general", "marketing", "data"],
  },
  {
    id: "timeline",
    name: "Timeline",
    description: "Experience laid out on a connected vertical rail. Great for showing career progression.",
    category: "Modern",
    layout: "timeline",
    align: "left",
    fontId: "sans",
    accent: "#0ea5e9",
    photo: false,
    roles: ["general", "tech", "data"],
  },
];

export const DEFAULT_TEMPLATE: TemplateId = "classic";

export function getTemplate(id: TemplateId): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function isTemplateId(v: unknown): v is TemplateId {
  return typeof v === "string" && TEMPLATES.some((t) => t.id === v);
}

// Categories that read better with a modern layout.
const MODERN_CATEGORIES = new Set(["Software & IT", "Data & AI", "Design & Content"]);
const MODERN_KEYWORDS = [
  "develop", "engineer", "software", "data", "design", "ux", "ui", "frontend",
  "front-end", "backend", "back-end", "full", "web", "app", "ml", "ai",
  "analyst", "scientist", "devops", "cloud", "product", "graphic", "content",
  "writer", "marketing", "digital",
];

export function suggestTemplate(roleTitle: string): {
  id: TemplateId;
  reason: string;
} {
  const title = (roleTitle || "").toLowerCase();

  // If the typed role matches a known role, TRUST its category (don't let broad
  // keywords like "engineer" override it — a Civil Engineer should stay classic
  // while a Software Developer goes modern). Fall back to keywords only for
  // free-text roles we don't recognize.
  const known = ROLES.find((r) => r.title.toLowerCase() === title);
  const looksModern = known
    ? MODERN_CATEGORIES.has(known.category)
    : MODERN_KEYWORDS.some((k) => title.includes(k));

  if (looksModern) {
    return {
      id: "modern",
      reason: "Tech, data, and design roles read well with a clean, modern layout.",
    };
  }
  return {
    id: "classic",
    reason:
      "Formal roles (finance, HR, operations, core engineering) suit a classic, conservative layout.",
  };
}
