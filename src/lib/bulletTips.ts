// ─────────────────────────────────────────────────────────────────────────
// Instant writing tips and example lines for the editor's experience and
// project descriptions. Pure rules, no AI: unlimited, instant, and works on
// every phone. "Improve with AI" is the next step up.
// ─────────────────────────────────────────────────────────────────────────

import { searchRoles } from "@/lib/roles";
import { getRoleExample } from "@/lib/roleExamples";

export type TipKind = "experience" | "project";

export interface WritingTip {
  /** "good" = the text already does this well; "fix" = worth changing. */
  tone: "good" | "fix";
  text: string;
}

/** What an inserted example line uses in place of its numbers. */
export const NUMBER_BLANK = "[X]";

// Duty-style phrases recruiters skim past — flagged anywhere in the text.
const WEAK_PHRASES = [
  "responsible for",
  "worked on",
  "working on",
  "involved in",
  "was part of",
  "tasks included",
  "duties included",
];
// Vague verbs — flagged only when a line starts with them.
const WEAK_OPENERS = ["helped", "helping", "assisted", "handled", "did"];

const BUZZWORDS = [
  "hardworking",
  "hard-working",
  "team player",
  "passionate",
  "go-getter",
  "self-motivated",
  "detail-oriented",
  "results-driven",
  "synergy",
  "quick learner",
];

const NUMBER_WORDS =
  /\b(two|three|four|five|six|seven|eight|nine|ten|dozen|hundred|thousand|lakh|crore|double|twice|half)\b/i;

// Split a description into its lines, dropping bullet markers.
function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*•·]\s*/, "").trim())
    .filter(Boolean);
}

/** Up to three tips for one description, most useful first. */
export function getWritingTips(text: string, kind: TipKind): WritingTip[] {
  const t = text.trim();
  const what = kind === "project" ? "you built" : "you did";
  if (t.length < 40) {
    return [
      {
        tone: "fix",
        text: `Write what ${what}, what you used, and the result. Rough notes are fine; "Improve with AI" polishes them.`,
      },
    ];
  }

  const tips: WritingTip[] = [];
  const all = lines(t);
  const lower = t.toLowerCase();

  if (t.includes(NUMBER_BLANK)) {
    tips.push({ tone: "fix", text: `Replace each ${NUMBER_BLANK} with your real number, or remove that part.` });
  }

  const weak =
    WEAK_PHRASES.find((w) => lower.includes(w)) ??
    WEAK_OPENERS.find((w) => all.some((l) => l.toLowerCase().startsWith(w + " ")));
  if (weak) {
    tips.push({
      tone: "fix",
      text: `Start with a strong verb like Built, Led, Designed or Improved instead of "${weak}".`,
    });
  }

  // The pronoun "I" is always capitalized, so "i.e." and roman numerals inside
  // words don't trigger it.
  if (/(^|[\s(])I(?=[\s,.']|$)/m.test(t) || /\bmy\b/i.test(t)) {
    tips.push({ tone: "fix", text: `Drop "I" and "my". Resume lines start straight with the verb.` });
  }

  // A blank counts — the tip above already asks for the real number.
  const hasNumber = /\d/.test(t) || NUMBER_WORDS.test(t) || t.includes(NUMBER_BLANK);
  if (!hasNumber) {
    tips.push({
      tone: "fix",
      text:
        kind === "project"
          ? "Add a number: users, downloads, accuracy, speed, team size or marks."
          : "Add a number: customers, % improved, time saved, money, team size.",
    });
  }

  const buzz = BUZZWORDS.find((b) => lower.includes(b));
  if (buzz) {
    tips.push({ tone: "fix", text: `Cut "${buzz}". Show it with a result instead of saying it.` });
  }

  if (all.some((l) => l.length > 200)) {
    tips.push({ tone: "fix", text: "Split long lines: one achievement per line, each under 2 lines." });
  }

  if (/\b(was|were|been)\s+\w+ed\b/i.test(t)) {
    tips.push({ tone: "fix", text: `Use active voice: "Built the app", not "the app was built".` });
  }

  if (!tips.length) {
    tips.push({ tone: "good", text: "Strong: action verbs and real numbers. Recruiters look for exactly this." });
  }
  return tips.slice(0, 3);
}

// For roles that match nothing in the catalogue — true of any field.
const GENERAL_EXAMPLES: Record<TipKind, string[]> = {
  experience: [
    "Organized a 300-person college fest, managing a ₹50,000 budget and 20 volunteers.",
    "Trained 5 new interns on internal tools, cutting their onboarding time from 2 weeks to 1.",
    "Built a shared tracker that saved the team about 4 hours of manual reporting each week.",
  ],
  project: [
    "Led a team of 4 to finish the semester project 2 weeks early, scoring 92/100.",
    "Surveyed 150 students and turned the results into 3 changes the department adopted.",
    "Presented the project to 60+ faculty and students at the annual tech fest.",
  ],
};

// Swap the numbers in a sample line for blanks, so a student fills in their
// own instead of copying made-up figures into a real resume.
function blankNumbers(line: string): string {
  return line.replace(/\d[\d,.]*\d|\d/g, NUMBER_BLANK);
}

// Example lines must pass the same tips they teach.
function startsWeak(line: string): boolean {
  const l = line.toLowerCase();
  return WEAK_PHRASES.some((w) => l.includes(w)) || WEAK_OPENERS.some((w) => l.startsWith(w + " "));
}

/** Example lines for the student's role, numbers blanked out. */
export function getExampleLines(roleTitle: string, kind: TipKind): string[] {
  const role = searchRoles(roleTitle, 1)[0];
  const content = role ? getRoleExample(role.slug)?.content : undefined;
  const roleLines = !content
    ? []
    : kind === "project"
      ? content.projects.flatMap((p) => p.bullets)
      : content.experience.flatMap((e) => e.bullets);
  // Role-specific lines first, topped up with general ones.
  return [...roleLines, ...GENERAL_EXAMPLES[kind]]
    .filter((l) => !startsWeak(l))
    .slice(0, 3)
    .map(blankNumbers);
}
