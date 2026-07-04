// Pure function that renders a complete, standalone HTML document for a resume.
// Used as the SINGLE SOURCE OF TRUTH by:
//   - the template gallery thumbnails and the live preview (<iframe srcDoc>), and
//   - the PDF route (rendered to PDF by Puppeteer),
// so what the user sees is exactly what they download.
//
// The look is driven by a template PRESET (layout + typography + accent) plus
// optional per-render overrides (accent color, font, photo). Simple templates
// stay single-column and ATS-safe; "photo" templates use a two-column sidebar.

import { ResumeContent, ContactInfo, SECTION_KEYS, SectionKey } from "@/lib/types";
import {
  TemplateId,
  TemplateOptions,
  DEFAULT_TEMPLATE,
  FONTS,
  getTemplate,
} from "@/lib/templates";

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const KNOWN_CONTACT_KEYS = new Set([
  "fullName", "email", "phone", "location", "linkedin", "github", "portfolio", "photo",
]);

// Contact values as a clean array (standard fields first, then custom ones).
// Reserved `_`-prefixed keys (design options) and internal keys are skipped.
function contactParts(c: Partial<ContactInfo> & Record<string, string | undefined>): string[] {
  const parts = [c.email, c.phone, c.location, c.linkedin, c.github, c.portfolio]
    .filter((x) => x && String(x).trim())
    .map((x) => esc(String(x)));

  for (const [key, val] of Object.entries(c)) {
    if (KNOWN_CONTACT_KEYS.has(key)) continue;
    if (key.startsWith("_")) continue;
    if (val && String(val).trim()) parts.push(esc(String(val)));
  }
  return parts;
}

function bulletList(items: string[]): string {
  const clean = items.filter((b) => b && b.trim());
  if (!clean.length) return "";
  return `<ul>${clean.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`;
}

function section(title: string, inner: string): string {
  if (!inner.trim()) return "";
  return `<section><h2>${esc(title)}</h2>${inner}</section>`;
}

// First initials, used as a fallback "photo" when none is uploaded.
function initials(name: string): string {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function renderResumeHtml(
  contact: Partial<ContactInfo>,
  content: ResumeContent,
  template: TemplateId = DEFAULT_TEMPLATE,
  opts: TemplateOptions = {},
): string {
  const tpl = getTemplate(template);
  // Design overrides may come from the explicit `opts` (live gallery) or from
  // reserved `_`-prefixed keys persisted on the contact object (so the preview
  // page and PDF route reflect them without passing opts).
  const c = contact as Partial<ContactInfo> & Record<string, string | undefined>;
  const accent = opts.accent || c._accent || tpl.accent;
  const fontId = opts.font || (c._font as keyof typeof FONTS) || tpl.fontId;
  const fontStack = (FONTS[fontId] ?? FONTS[tpl.fontId]).stack;
  const photo = tpl.photo ? opts.photo || contact.photo : undefined;

  const name = esc(contact.fullName || "Your Name");

  const experienceHtml = content.experience
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${esc(e.title)}${
            e.organization ? `, ${esc(e.organization)}` : ""
          }</span>
          <span class="entry-date">${esc(e.duration)}</span>
        </div>
        ${bulletList(e.bullets)}
      </div>`,
    )
    .join("");

  const projectsHtml = content.projects
    .map(
      (p) => `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${esc(p.name)}</span>
          ${
            p.techStack.length
              ? `<span class="entry-date">${esc(p.techStack.join(", "))}</span>`
              : ""
          }
        </div>
        ${bulletList(p.bullets)}
      </div>`,
    )
    .join("");

  const educationHtml = content.education
    .map(
      (ed) => `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${esc(ed.degree)}${
            ed.institution ? `, ${esc(ed.institution)}` : ""
          }</span>
          <span class="entry-date">${esc(ed.duration)}</span>
        </div>
        ${ed.details ? `<p class="detail">${esc(ed.details)}</p>` : ""}
      </div>`,
    )
    .join("");

  const skillsHtml = content.skills.length
    ? `<p class="skills">${content.skills.map((s) => esc(s)).join("  •  ")}</p>`
    : "";
  // Skills stacked one-per-line for the narrow sidebar layouts.
  const skillsStackHtml = content.skills.length
    ? `<ul class="skills-stack">${content.skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`
    : "";

  const sectionHtmlByKey: Record<SectionKey, string> = {
    summary: section(
      "Summary",
      content.summary ? `<p class="summary">${esc(content.summary)}</p>` : "",
    ),
    skills: section("Skills", skillsHtml),
    experience: section("Experience", experienceHtml),
    projects: section("Projects", projectsHtml),
    education: section("Education", educationHtml),
    certifications: section("Certifications", bulletList(content.certifications)),
    achievements: section("Achievements", bulletList(content.achievements)),
  };

  // Section order: AI order first, then any missing keys.
  const order: SectionKey[] = [];
  const seen = new Set<SectionKey>();
  for (const k of content.sectionOrder ?? []) {
    if (k in sectionHtmlByKey && !seen.has(k)) {
      seen.add(k);
      order.push(k);
    }
  }
  for (const k of SECTION_KEYS) if (!seen.has(k)) order.push(k);

  const isSidebar = tpl.layout === "sidebar-left" || tpl.layout === "sidebar-right";

  const contact_ = contact as Partial<ContactInfo> & Record<string, string | undefined>;
  const parts = contactParts(contact_);

  const photoHtml = photo
    ? `<img class="photo" src="${esc(photo)}" alt="" />`
    : `<div class="photo photo-fallback">${esc(initials(name)) || "★"}</div>`;

  let bodyHtml: string;

  if (isSidebar) {
    // Sidebar holds identity + contact + skills + certifications; main holds
    // the rest in the chosen order.
    const sideKeys: SectionKey[] = ["skills", "certifications"];
    const contactStack = parts.length
      ? `<div class="side-contact">${parts.map((p) => `<div>${p}</div>`).join("")}</div>`
      : "";
    const sideSections = [
      content.skills.length ? `<div class="side-block"><h3>Skills</h3>${skillsStackHtml}</div>` : "",
      content.certifications.filter(Boolean).length
        ? `<div class="side-block"><h3>Certifications</h3>${bulletList(content.certifications)}</div>`
        : "",
    ].join("");

    const mainSections = order
      .filter((k) => !sideKeys.includes(k))
      .map((k) => sectionHtmlByKey[k])
      .join("\n    ");

    const aside = `
      <aside class="side">
        ${tpl.photo ? photoHtml : ""}
        <h1>${name}</h1>
        ${contactStack}
        ${sideSections}
      </aside>`;
    const main = `<main class="main">${mainSections}</main>`;

    bodyHtml =
      tpl.layout === "sidebar-right"
        ? `<div class="page sidebar right">${main}${aside}</div>`
        : `<div class="page sidebar left">${aside}${main}</div>`;
  } else {
    const sectionsHtml = order.map((k) => sectionHtmlByKey[k]).join("\n    ");
    const header =
      tpl.layout === "band"
        ? `<header class="band">
            ${tpl.photo ? photoHtml : ""}
            <div class="hdr-text">
              <h1>${name}</h1>
              <div class="contact">${parts.join("  •  ")}</div>
            </div>
          </header>`
        : `<header>
            <h1>${name}</h1>
            <div class="contact">${parts.join("  •  ")}</div>
          </header>`;
    bodyHtml = `<div class="page">${header}${sectionsHtml}</div>`;
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${styleFor(tpl.layout, tpl.align, accent, fontStack)}</style>
</head>
<body>
  ${bodyHtml}
  <script>
    if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
    window.onload = function() { window.scrollTo(0, 0); };
  </script>
</body>
</html>`;
}

// Shared structural CSS (identical across templates so the section markup is
// reused); the preset overrides typography, color, spacing, and layout.
const BASE_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  .entry { margin-bottom: 10px; }
  .entry-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
  .entry-title { font-weight: bold; }
  .entry-date { color: #555; font-size: 9.5pt; text-align: right; flex-shrink: 0; max-width: 45%; }
  .detail { margin: 2px 0 0; color: #333; font-size: 10pt; }
  ul { margin: 4px 0 0; padding-left: 18px; }
  li { margin-bottom: 3px; }
  .summary, .skills { margin: 0; }
  @page { margin: 0; size: A4; }
`;

function styleFor(
  layout: "single" | "band" | "sidebar-left" | "sidebar-right",
  align: "left" | "center",
  accent: string,
  fontStack: string,
): string {
  const common = `${BASE_CSS}
  body { font-family: ${fontStack}; color: #1a1a1a; background: #fff; font-size: 11pt; line-height: 1.42; }
  h1 { margin: 0; }
  section { margin-top: 15px; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.7px; color: ${accent}; margin: 0 0 7px; padding-bottom: 3px; border-bottom: 1px solid ${accent}33; }
  a { color: inherit; }`;

  if (layout === "sidebar-left" || layout === "sidebar-right") {
    return `${common}
  .page { display: flex; min-height: 1123px; max-width: 900px; margin: 0 auto; }
  .side { width: 34%; background: ${accent}; color: #fff; padding: 34px 24px; }
  .page.right .side { }
  .main { width: 66%; padding: 40px 36px; }
  .side h1 { font-size: 19pt; line-height: 1.15; margin-bottom: 14px; }
  .side h3 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.8px; margin: 20px 0 8px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.35); padding-bottom: 4px; }
  .side .side-contact { font-size: 9.5pt; line-height: 1.7; word-break: break-word; opacity: 0.95; }
  .side .side-contact div { margin-bottom: 2px; }
  .side ul { padding-left: 16px; }
  .side .skills-stack { list-style: none; padding: 0; margin: 0; }
  .side .skills-stack li { font-size: 9.5pt; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.18); }
  .side li { color: #fff; }
  .photo { display: block; width: 108px; height: 108px; border-radius: 50%; object-fit: cover; margin: 0 auto 18px; border: 3px solid rgba(255,255,255,0.6); }
  .photo-fallback { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.18); color: #fff; font-size: 34px; font-weight: 700; }
  .main section:first-child { margin-top: 0; }`;
  }

  if (layout === "band") {
    return `${common}
  .page { max-width: 820px; margin: 0 auto; padding: 0 0 40px; }
  header.band { display: flex; align-items: center; gap: 20px; background: ${accent}; color: #fff; padding: 26px 44px; margin-bottom: 8px; }
  header.band h1 { font-size: 24pt; letter-spacing: 0.4px; }
  header.band .contact { font-size: 9.5pt; margin-top: 5px; opacity: 0.92; }
  header.band + section, .page > section { padding-left: 44px; padding-right: 44px; }
  .photo { width: 74px; height: 74px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.7); flex-shrink: 0; }
  .photo-fallback { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); color: #fff; font-size: 26px; font-weight: 700; }
  h2 { color: ${accent}; }`;
  }

  // single column (classic / modern / minimal, etc.)
  const centered = align === "center";
  return `${common}
  .page { max-width: 820px; margin: 0 auto; padding: 40px 44px; }
  header { text-align: ${centered ? "center" : "left"}; border-bottom: 2px solid ${accent}; padding-bottom: 10px; }
  header h1 { font-size: 22pt; letter-spacing: 0.4px; color: ${accent === "#111111" ? "#111" : accent}; }
  header .contact { font-size: 9.5pt; color: #444; margin-top: 4px; }`;
}
