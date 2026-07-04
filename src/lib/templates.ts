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

export type LayoutKind = "single" | "band" | "sidebar-left" | "sidebar-right";

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
