// Helpers for the structured editor: repeatable entries (experience, projects,
// education) plus the live-preview draft, completeness meter, and the prompt
// serializer. Pure + safe to import on both client and server.

import { ResumeContent, EMPTY_CONTENT } from "@/lib/types";

// Each structured entry is a flat map of fieldId -> value.
export type Entry = Record<string, string>;
type Answers = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// Split a multiline value into clean bullet lines, stripping bullet markers.
function lines(v: unknown): string[] {
  return str(v)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function splitComma(v: unknown): string[] {
  return str(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinDates(a: unknown, b: unknown): string {
  return [str(a).trim(), str(b).trim()].filter(Boolean).join(" - ");
}

// Accept both the new structured array and legacy freeform strings, so old
// resumes keep working. A legacy string becomes a single entry.
export function toEntries(val: unknown, legacyField: string): Entry[] {
  if (Array.isArray(val)) return val as Entry[];
  if (typeof val === "string" && val.trim()) return [{ [legacyField]: val }];
  return [];
}

function skillList(answers: Answers): string[] {
  if (Array.isArray(answers.skills)) return answers.skills.map(String).filter(Boolean);
  return splitComma(answers.skills);
}

// Build a rough ResumeContent live from the structured inputs (before AI polish)
// so the right-hand preview updates as the student types.
export function buildDraftContent(answers: Answers): ResumeContent {
  const experience = toEntries(answers.experience, "description")
    .map((e) => ({
      title: str(e.jobTitle),
      organization: str(e.company),
      duration: joinDates(e.startDate, e.endDate),
      bullets: lines(e.description),
    }))
    .filter((e) => e.title || e.organization || e.bullets.length);

  const projects = toEntries(answers.projects, "description")
    .map((p) => ({
      name: str(p.name),
      techStack: splitComma(p.techStack),
      bullets: lines(p.description),
    }))
    .filter((p) => p.name || p.bullets.length);

  const education = toEntries(answers.education, "degree")
    .map((ed) => ({
      degree: str(ed.degree),
      institution: str(ed.institution),
      duration: joinDates(ed.startDate, ed.endDate),
      details: str(ed.details) || undefined,
    }))
    .filter((ed) => ed.degree || ed.institution);

  return {
    ...EMPTY_CONTENT,
    summary: "",
    skills: skillList(answers),
    experience,
    projects,
    education,
    certifications: lines(answers.certifications),
    achievements: lines(answers.achievements),
    sectionOrder: [],
  };
}

// Live 0-100 completeness of the inputs (not an ATS score).
export function profileCompleteness(
  contact: Record<string, string>,
  answers: Answers,
): number {
  const checks = [
    !!contact.fullName?.trim(),
    !!contact.email?.trim(),
    !!contact.phone?.trim(),
    !!contact.location?.trim(),
    toEntries(answers.education, "degree").length > 0,
    skillList(answers).length >= 3,
    toEntries(answers.experience, "description").length > 0,
    toEntries(answers.projects, "description").length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

// Serialize the structured answers into readable text for the AI prompt, so the
// model preserves the provided titles/companies/dates and polishes the bullets.
export function serializeAnswersForPrompt(answers: Answers): string {
  const parts: string[] = [];

  const edu = toEntries(answers.education, "degree");
  if (edu.length) {
    parts.push(
      "EDUCATION:\n" +
        edu
          .map(
            (e) =>
              "- " +
              [str(e.degree), str(e.institution), joinDates(e.startDate, e.endDate), str(e.details)]
                .map((x) => x.trim())
                .filter(Boolean)
                .join(", "),
          )
          .join("\n"),
    );
  }

  const exp = toEntries(answers.experience, "description");
  if (exp.length) {
    parts.push(
      "WORK EXPERIENCE:\n" +
        exp
          .map((e) => {
            const head = [
              str(e.jobTitle).trim(),
              str(e.company).trim() && `at ${str(e.company).trim()}`,
              joinDates(e.startDate, e.endDate) && `(${joinDates(e.startDate, e.endDate)})`,
              str(e.location).trim(),
            ]
              .filter(Boolean)
              .join(" ");
            return `- ${head}\n${str(e.description).trim()}`;
          })
          .join("\n\n"),
    );
  }

  const proj = toEntries(answers.projects, "description");
  if (proj.length) {
    parts.push(
      "PROJECTS:\n" +
        proj
          .map((p) => {
            const head = [
              str(p.name).trim(),
              str(p.techStack).trim() && `[${str(p.techStack).trim()}]`,
            ]
              .filter(Boolean)
              .join(" ");
            return `- ${head}\n${str(p.description).trim()}`;
          })
          .join("\n\n"),
    );
  }

  const skills = skillList(answers);
  if (skills.length) parts.push("SKILLS: " + skills.join(", "));

  if (str(answers.certifications).trim())
    parts.push("CERTIFICATIONS:\n" + str(answers.certifications).trim());
  if (str(answers.achievements).trim())
    parts.push("ACHIEVEMENTS:\n" + str(answers.achievements).trim());

  return parts.join("\n\n");
}
