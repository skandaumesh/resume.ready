// ─────────────────────────────────────────────────────────────────────────
// LinkedIn profile rating. Works on the PDF a user exports from their own
// profile (More → Save to PDF) — LinkedIn blocks fetching profiles by URL, so
// this is the only approach that's real. Deterministic, no AI: same profile
// always gets the same score. Produces the same AtsResult shape as the ATS
// checker so the report UI is shared.
// ─────────────────────────────────────────────────────────────────────────

import { AtsCheck, AtsResult } from "@/lib/ats";

// Section headers as they appear in LinkedIn's PDF export.
const SECTION_HEADERS = [
  "Contact",
  "Top Skills",
  "Languages",
  "Certifications",
  "Honors-Awards",
  "Publications",
  "Patents",
  "Summary",
  "Experience",
  "Education",
] as const;

type SectionName = (typeof SECTION_HEADERS)[number];

export function isLinkedInExport(raw: string): boolean {
  const text = raw || "";
  const hasProfileUrl = /linkedin\.com\/in\//i.test(text);
  const headerHits = SECTION_HEADERS.filter((h) =>
    new RegExp(`^\\s*${h}\\s*$`, "m").test(text),
  ).length;
  return hasProfileUrl && headerHits >= 2;
}

// Split the export into named sections. Header lines are exact single-line
// matches in LinkedIn's PDF, so a simple line scan is reliable.
function splitSections(raw: string): Partial<Record<SectionName, string>> {
  const headerSet = new Set<string>(SECTION_HEADERS);
  const sections: Partial<Record<SectionName, string>> = {};
  let current: SectionName | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (current) {
      sections[current] = ((sections[current] ?? "") + "\n" + buf.join("\n")).trim();
    }
    buf = [];
  };

  for (const rawLine of (raw || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (/^Page \d+ of \d+$/i.test(line)) continue; // strip page markers
    if (headerSet.has(line)) {
      flush();
      current = line as SectionName;
      continue;
    }
    buf.push(rawLine);
  }
  flush();
  return sections;
}

function words(s: string | undefined): number {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

function nonEmptyLines(s: string | undefined): string[] {
  return (s || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

// Digits that aren't just years/dates — evidence of quantified impact.
function quantifiedHits(s: string | undefined): number {
  const text = (s || "")
    .replace(/\b(19|20)\d{2}\b/g, " ") // years
    .replace(/\b\d+\s+(years?|months?|yrs?|mos?)\b/gi, " "); // durations
  return (text.match(/\d+(\.\d+)?\s*%|\d+\s*\+|\b\d{2,}\b/g) || []).length;
}

// Who the report is about — shown above the score. All fields best-effort.
export interface LinkedInProfileHeader {
  name: string;
  headline: string;
  location: string;
  about: string; // first part of the Summary section
}

// "Skanda Umesh", "A. P. J. Abdul Kalam" — 2-5 capitalized words, letters only.
function looksLikeName(line: string): boolean {
  const w = line.trim().split(/\s+/);
  if (w.length < 2 || w.length > 5) return false;
  return w.every((x) => /^[A-Z][A-Za-z'.-]*$/.test(x));
}

/**
 * Pull the name / headline / location block out of a LinkedIn PDF export.
 * In the export's text, that block sits directly before the "Summary" (or
 * "Experience") header, after the Contact/Skills sidebar. Heuristic by
 * nature: a field we can't confidently identify is returned empty, and the
 * UI simply omits it.
 */
export function extractLinkedInHeader(raw: string): LinkedInProfileHeader {
  const s = splitSections(raw);
  const about = nonEmptyLines(s["Summary"]).join(" ").slice(0, 400);

  const allLines = (raw || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^Page \d+ of \d+$/i.test(l));

  const anchor = allLines.findIndex((l) => l === "Summary" || l === "Experience");
  const before = anchor > 0 ? allLines.slice(Math.max(0, anchor - 3), anchor) : [];

  // The block reads [name, headline?, location?]; find the name line first
  // and assign what follows it. No name-like line -> leave the block empty
  // rather than mislabeling sidebar content (a certification, a language).
  const nameIdx = before.findIndex(looksLikeName);
  const name = nameIdx >= 0 ? before[nameIdx] : "";
  const rest = nameIdx >= 0 ? before.slice(nameIdx + 1) : [];
  return {
    name,
    headline: rest[0] ?? "",
    location: rest[1] ?? "",
    about,
  };
}

export function analyzeLinkedInProfile(raw: string): AtsResult {
  const s = splitSections(raw);

  const urlMatch = raw.match(/linkedin\.com\/in\/([a-z0-9%_-]+)/i);
  const slug = urlMatch?.[1] ?? "";
  // Default LinkedIn slugs carry a numeric tail like "john-doe-1a2345678".
  const hasCustomUrl = !!slug && !/\d{3,}/.test(slug);

  const contact = s["Contact"] ?? "";
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(contact);

  const summaryWords = words(s["Summary"]);
  const experienceText = s["Experience"] ?? "";
  const experienceWords = words(experienceText);
  const quantified = quantifiedHits((s["Summary"] ?? "") + "\n" + experienceText);

  const checks: AtsCheck[] = [
    // ── Profile Basics ──────────────────────────────────────────────
    {
      id: "email",
      label: "Contact email visible",
      points: 6,
      passed: hasEmail,
      category: "Profile Basics",
      why: "Recruiters who find you through LinkedIn search need a way to reach you beyond InMail. Many won't pay for InMail credits at all.",
      tip: "On LinkedIn, go to Contact info → add your email and make it visible to connections.",
      earned: 0,
    },
    {
      id: "custom-url",
      label: "Custom profile URL",
      points: 6,
      passed: hasCustomUrl,
      category: "Profile Basics",
      why: "linkedin.com/in/your-name looks intentional on a resume header; the default number-tail URL reads as a profile nobody maintains.",
      tip: "On your profile, click 'Edit public profile & URL' (top right) and claim a clean linkedin.com/in/your-name URL.",
      earned: 0,
    },
    {
      id: "languages",
      label: "Languages listed",
      points: 4,
      passed: nonEmptyLines(s["Languages"]).length > 0,
      category: "Profile Basics",
      why: "Languages are a recruiter search filter, and for multilingual candidates in India they're free differentiation.",
      tip: "Add a Languages section with every language you can work in.",
      earned: 0,
    },
    // ── Content ─────────────────────────────────────────────────────
    {
      id: "about",
      label: "About / Summary section present",
      points: 8,
      passed: summaryWords > 0,
      category: "Content",
      why: "The About section is the highest-read block on your profile after the headline. An empty one hands recruiters nothing to remember you by.",
      tip: "Write an About section: who you are, what you build, and what role you're looking for.",
      earned: 0,
    },
    {
      id: "about-strong",
      label: "About section has real substance (40+ words)",
      points: 10,
      passed: summaryWords >= 40,
      category: "Content",
      why: "One-line summaries read as filler. A few tight paragraphs with your skills and proudest work give both recruiters and LinkedIn's search algorithm something to match on.",
      tip: "Grow your About to 3 short paragraphs: what you do, your best project with numbers, and what you're looking for.",
      earned: 0,
    },
    {
      id: "experience",
      label: "Experience section present",
      points: 14,
      passed: experienceWords > 0,
      category: "Content",
      why: "Profiles with work/internship/project experience get dramatically more recruiter views. It's the first thing checked after your headline.",
      tip: "Add internships, freelance work, or serious projects as Experience entries. Student work counts.",
      earned: 0,
    },
    {
      id: "experience-detail",
      label: "Experience entries are described, not just titled (80+ words)",
      points: 10,
      passed: experienceWords >= 80,
      category: "Content",
      why: "A title and dates with no description tells a recruiter nothing, and gives LinkedIn search no keywords to match you on for relevant roles.",
      tip: "Add 2-3 bullet-style lines to each experience entry: what you built, with which tools, and what changed because of it.",
      earned: 0,
    },
    {
      id: "quantified",
      label: "Quantified impact (numbers in your content)",
      points: 10,
      passed: quantified >= 2,
      category: "Content",
      why: "\"Built a portal used by 500+ students\" stops a scroller; \"built a portal\" doesn't. Numbers are what make claims believable at a glance.",
      tip: "Add users, %, downloads, team size, or hours saved to at least two places in your About or Experience.",
      earned: 0,
    },
    // ── Credibility ─────────────────────────────────────────────────
    {
      id: "skills",
      label: "Skills endorsed (Top Skills present)",
      points: 8,
      passed: nonEmptyLines(s["Top Skills"]).length >= 3,
      category: "Credibility",
      why: "Skills are the backbone of LinkedIn's recruiter search. Profiles without them simply don't appear in skill-filtered results.",
      tip: "Add at least 5 role-relevant skills on your profile and ask classmates/colleagues to endorse your top 3.",
      earned: 0,
    },
    {
      id: "education",
      label: "Education section present",
      points: 10,
      passed: nonEmptyLines(s["Education"]).length > 0,
      category: "Credibility",
      why: "Campus recruiters filter by college and graduation year; without Education you're invisible to every one of those searches.",
      tip: "Add your degree, institution, and years to the Education section.",
      earned: 0,
    },
    {
      id: "certifications",
      label: "Certifications listed",
      points: 8,
      passed: nonEmptyLines(s["Certifications"]).length > 0,
      category: "Credibility",
      why: "Certifications are third-party proof of skills. They carry more weight than self-declared skill tags, especially for freshers.",
      tip: "Add any course certificates (Google, AWS, Coursera, NPTEL…) under Licenses & Certifications.",
      earned: 0,
    },
    {
      id: "honors",
      label: "Honors, awards, or publications",
      points: 6,
      passed:
        nonEmptyLines(s["Honors-Awards"]).length > 0 ||
        nonEmptyLines(s["Publications"]).length > 0,
      category: "Credibility",
      why: "Hackathon wins, ranks, and publications are the tiebreakers when hundreds of profiles show the same degree and skills.",
      tip: "Add hackathon results, contest ranks, scholarships, or papers under Honors & Awards.",
      earned: 0,
    },
  ];

  let score = 0;
  for (const c of checks) {
    c.earned = c.passed ? c.points : 0;
    score += c.earned;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  const rating: AtsResult["rating"] =
    score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 50 ? "Needs work" : "Weak";

  const missingSections = SECTION_HEADERS.filter(
    (h) => nonEmptyLines(s[h]).length === 0,
  );

  const improvements = checks
    .filter((c) => !c.passed)
    .sort((a, b) => b.points - a.points)
    .map((c) => c.tip);

  const strengths = checks
    .filter((c) => c.passed && c.points >= 8)
    .map((c) => c.label);

  return { score, rating, checks, missingSections, improvements, strengths };
}
