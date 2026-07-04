// ─────────────────────────────────────────────────────────────────────────
// Parse raw text extracted from an uploaded PDF/Word resume into structured
// contact + answers + content data that pre-fills the editor.
// AI calls go through callAi() in generateResume.ts (Gemini → OpenRouter).
// ─────────────────────────────────────────────────────────────────────────

import { ResumeContent, EMPTY_CONTENT, SECTION_KEYS, SectionKey } from "@/lib/types";
import { callAi } from "./generateResume";

export interface ParsedResume {
  roleTitle: string;
  contact: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  answers: {
    education?: string;
    skills?: string[];
    projects?: string;
    experience?: string;
    certifications?: string;
    achievements?: string;
  };
  content: ResumeContent;
}

const PARSE_SCHEMA = `Return ONLY a valid JSON object (no markdown, no code fences, no commentary) with EXACTLY this shape:
{
  "roleTitle": "string — the target job role inferred from the resume (e.g. 'Software Developer', 'Data Analyst')",
  "contact": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string or empty",
    "github": "string or empty",
    "portfolio": "string or empty"
  },
  "answers": {
    "education": "string — raw education text, one entry per line",
    "skills": ["string", ...],
    "projects": "string — raw project descriptions, one per line",
    "experience": "string — raw work experience, one entry per line",
    "certifications": "string — one per line, or empty",
    "achievements": "string — one per line, or empty"
  },
  "content": {
    "summary": "string — 2-3 line professional summary",
    "skills": ["string", ...],
    "experience": [{ "title": "string", "organization": "string", "duration": "string", "bullets": ["string", ...] }],
    "projects": [{ "name": "string", "techStack": ["string", ...], "bullets": ["string", ...] }],
    "education": [{ "degree": "string", "institution": "string", "duration": "string", "details": "string" }],
    "certifications": ["string", ...],
    "achievements": ["string", ...],
    "sectionOrder": ["summary","skills","experience","projects","education","certifications","achievements"]
  }
}`;

function buildParsePrompt(rawText: string): string {
  return `You are an expert resume parser. You are given the raw text extracted from a PDF or Word resume. Your job is to parse and structure ALL of its content faithfully.

RULES:
- Extract ALL information from the resume — do not omit anything.
- For the "contact" field, extract the person's name, email, phone, location, and any LinkedIn/GitHub/portfolio links.
- For the "answers" field, extract the raw text for each section as-is (education, skills, projects, experience, certifications, achievements). Skills should be an array of individual skill strings.
- For the "content" field, produce polished, ATS-friendly structured content:
  - Every bullet starts with a strong past-tense action verb.
  - Keep bullets concise (under 25 words each).
  - Preserve all numbers and quantified achievements from the original.
  - Do not fabricate information not present in the resume.
- For "roleTitle", infer the most likely target role from the resume content (e.g. "Software Developer", "Data Analyst").
- For "sectionOrder", order sections by what's most impressive/relevant for the inferred role.
- Write in plain, natural English. Do NOT use em dashes or double hyphens.

RAW RESUME TEXT:
${rawText}

${PARSE_SCHEMA}`;
}

// ── JSON extraction & normalization ────────────────────────────────────

function extractJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return s.slice(start, end + 1);
  }
  return s;
}

function coerceStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

function normalizeSectionOrder(v: unknown): SectionKey[] {
  const valid = new Set<string>(SECTION_KEYS);
  const seen = new Set<SectionKey>();
  const order: SectionKey[] = [];
  if (Array.isArray(v)) {
    for (const item of v) {
      const key = String(item) as SectionKey;
      if (valid.has(key) && !seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    }
  }
  for (const key of SECTION_KEYS) {
    if (!seen.has(key)) order.push(key);
  }
  return order;
}

function normalizeContent(parsed: any): ResumeContent {
  return {
    summary: typeof parsed?.summary === "string" ? parsed.summary : "",
    skills: coerceStringArray(parsed?.skills),
    experience: Array.isArray(parsed?.experience)
      ? parsed.experience.map((e: any) => ({
          title: String(e?.title ?? ""),
          organization: String(e?.organization ?? ""),
          duration: String(e?.duration ?? ""),
          bullets: coerceStringArray(e?.bullets),
        }))
      : [],
    projects: Array.isArray(parsed?.projects)
      ? parsed.projects.map((p: any) => ({
          name: String(p?.name ?? ""),
          techStack: coerceStringArray(p?.techStack),
          bullets: coerceStringArray(p?.bullets),
        }))
      : [],
    education: Array.isArray(parsed?.education)
      ? parsed.education.map((ed: any) => ({
          degree: String(ed?.degree ?? ""),
          institution: String(ed?.institution ?? ""),
          duration: String(ed?.duration ?? ""),
          details: ed?.details ? String(ed.details) : undefined,
        }))
      : [],
    certifications: coerceStringArray(parsed?.certifications),
    achievements: coerceStringArray(parsed?.achievements),
    sectionOrder: normalizeSectionOrder(parsed?.sectionOrder),
  };
}

function normalize(parsed: any): ParsedResume {
  const contact = parsed?.contact ?? {};
  const answers = parsed?.answers ?? {};

  return {
    roleTitle: typeof parsed?.roleTitle === "string" ? parsed.roleTitle : "General",
    contact: {
      fullName: String(contact.fullName ?? ""),
      email: String(contact.email ?? ""),
      phone: String(contact.phone ?? ""),
      location: String(contact.location ?? ""),
      linkedin: String(contact.linkedin ?? ""),
      github: String(contact.github ?? ""),
      portfolio: String(contact.portfolio ?? ""),
    },
    answers: {
      education: typeof answers.education === "string" ? answers.education : "",
      skills: coerceStringArray(answers.skills),
      projects: typeof answers.projects === "string" ? answers.projects : "",
      experience: typeof answers.experience === "string" ? answers.experience : "",
      certifications: typeof answers.certifications === "string" ? answers.certifications : "",
      achievements: typeof answers.achievements === "string" ? answers.achievements : "",
    },
    content: normalizeContent(parsed?.content ?? {}),
  };
}

/**
 * Parse raw text extracted from a resume document into structured data.
 * Handles the unreliable-JSON reality of free open models with one repair retry.
 */
export async function parseResumeText(rawText: string): Promise<ParsedResume> {
  const prompt = buildParsePrompt(rawText);

  // First attempt.
  const first = await callAi([{ role: "user", content: prompt }]);
  try {
    return normalize(JSON.parse(extractJson(first)));
  } catch {
    // Repair attempt
    const repaired = await callAi([
      { role: "user", content: prompt },
      { role: "assistant", content: first },
      {
        role: "user",
        content:
          "Your previous response was not valid JSON. Respond again with ONLY the JSON object described earlier — no markdown, no code fences, no explanation.",
      },
    ]);
    try {
      return normalize(JSON.parse(extractJson(repaired)));
    } catch {
      throw new Error(
        "The AI could not parse this resume. Please try uploading a cleaner document, or start from scratch.",
      );
    }
  }
}
