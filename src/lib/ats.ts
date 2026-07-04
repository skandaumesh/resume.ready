// ─────────────────────────────────────────────────────────────────────────
// Deterministic ATS scorer. Pure function, no AI — so it's instant, free, and
// gives the SAME answer every time (which a "will this get shortlisted?" score
// must). Importable on both server and client.
// ─────────────────────────────────────────────────────────────────────────

import { ResumeContent, ContactInfo } from "@/lib/types";

// Report group a check belongs to. The ATS checker uses "Content" | "Sections"
// | "ATS Essentials"; other tools (e.g. the LinkedIn review) define their own.
export type AtsCategory = string;

export interface AtsCheck {
  id: string;
  label: string;
  passed: boolean;
  points: number; // max points this check is worth
  earned: number; // points actually earned
  tip: string; // shown when failed — how to fix it
  category: AtsCategory; // report group this check belongs to
  why: string; // why this matters — shown in the expanded report card
}

export interface AtsResult {
  score: number; // 0–100
  rating: "Excellent" | "Strong" | "Needs work" | "Weak";
  checks: AtsCheck[];
  missingSections: string[];
  improvements: string[]; // actionable, ordered by impact
  strengths: string[];
}

const ACTION_VERBS = new Set([
  "built", "created", "designed", "developed", "led", "managed", "analyzed",
  "improved", "increased", "reduced", "automated", "implemented", "launched",
  "organized", "coordinated", "delivered", "optimized", "achieved", "won",
  "engineered", "programmed", "researched", "tested", "deployed", "maintained",
  "collaborated", "presented", "trained", "mentored", "planned", "executed",
  "streamlined", "boosted", "generated", "handled", "resolved", "conducted",
  "drove", "spearheaded", "architected", "integrated", "migrated", "wrote",
]);

function words(s: string): string[] {
  return (s || "").trim().split(/\s+/).filter(Boolean);
}

function hasNumber(s: string): boolean {
  return /\d/.test(s || "");
}

function allBullets(c: ResumeContent): string[] {
  const b: string[] = [];
  c.experience.forEach((e) => b.push(...e.bullets));
  c.projects.forEach((p) => b.push(...p.bullets));
  return b.filter((x) => x && x.trim());
}

function startsWithActionVerb(bullet: string): boolean {
  const first = words(bullet)[0]?.toLowerCase().replace(/[^a-z]/g, "");
  return first ? ACTION_VERBS.has(first) : false;
}

export function computeAtsScore(
  contact: Partial<ContactInfo>,
  content: ResumeContent,
): AtsResult {
  const bullets = allBullets(content);
  const quantified = bullets.filter(hasNumber).length;
  const actiony = bullets.filter(startsWithActionVerb).length;
  const summaryWords = words(content.summary).length;
  const hasWork = content.experience.length + content.projects.length > 0;

  const checks: AtsCheck[] = [
    {
      id: "contact",
      label: "Complete contact details",
      points: 10,
      passed: !!(contact.fullName && contact.email && contact.phone),
      tip: "Add your full name, email, and phone number. Recruiters and ATS look for all three.",
      earned: 0,
      category: "ATS Essentials",
      why: "An ATS extracts your name, email, and phone into the recruiter's database. If any of them is missing, your application can literally become unreachable, because the system has no one to contact.",
    },
    {
      id: "summary",
      label: "Professional summary present",
      points: 6,
      passed: summaryWords > 0,
      tip: "Add a short professional summary at the top tailored to the role.",
      earned: 0,
      category: "Sections",
      why: "Recruiters spend about 7 seconds on a first pass. A summary at the top tells them who you are and what role you're targeting before they scroll anywhere else.",
    },
    {
      id: "summary-strong",
      label: "Summary is a strong length (20 to 60 words)",
      points: 6,
      passed: summaryWords >= 20 && summaryWords <= 60,
      tip: "Aim for a 2 to 3 line summary (about 20 to 60 words), not one vague sentence and not a whole paragraph.",
      earned: 0,
      category: "Content",
      why: "One vague line reads as filler; a full paragraph doesn't get read at all. Two to three tight lines is the sweet spot recruiters actually finish.",
    },
    {
      id: "skills",
      label: "At least 6 relevant skills",
      points: 12,
      passed: content.skills.length >= 6,
      tip: "List at least 6 role-relevant skills so ATS keyword matching has something to catch.",
      earned: 0,
      category: "ATS Essentials",
      why: "ATS filters shortlist resumes by matching keywords from the job description against your skills section. More relevant skills means more keyword matches, and a higher ranking in the recruiter's queue.",
    },
    {
      id: "has-work",
      label: "Has projects or experience",
      points: 14,
      passed: hasWork,
      tip: "Add at least one project or internship. This is the single biggest thing recruiters look for.",
      earned: 0,
      category: "Sections",
      why: "Proof you've built or done something real is the single strongest signal on a student resume. Even one solid project outweighs a long list of skills with nothing behind them.",
    },
    {
      id: "bullets",
      label: "Enough detail (3+ bullet points)",
      points: 10,
      passed: bullets.length >= 3,
      tip: "Describe your projects/experience with at least 3 bullet points total.",
      earned: 0,
      category: "Content",
      why: "A project with no bullets is just a title. Recruiters can't tell what you actually did. Bullets carry the evidence: what you built, how, and what happened because of it.",
    },
    {
      id: "quantified",
      label: "Quantified achievements (2+ bullets with numbers)",
      points: 16,
      passed: quantified >= 2,
      tip: "Add numbers to your bullets (users, %, hours saved, team size). 'Used by 500+ students' beats 'made a website'.",
      earned: 0,
      category: "Content",
      why: "Numbers make impact verifiable and memorable. 'Used by 500+ students' sticks; 'made a website' disappears. This is the highest-weighted check in the whole score.",
    },
    {
      id: "action-verbs",
      label: "Bullets start with strong action verbs",
      points: 8,
      passed: bullets.length > 0 && actiony / bullets.length >= 0.6,
      tip: "Start each bullet with an action verb like Built, Led, Designed, Improved, or Automated.",
      earned: 0,
      category: "Content",
      why: "Bullets that open with Built, Led, or Automated read as ownership. Bullets that open with 'was responsible for' read as passive, and recruiters skim right past them.",
    },
    {
      id: "education",
      label: "Education section present",
      points: 10,
      passed: content.education.length > 0,
      tip: "Add your degree, institution, years, and CGPA/percentage.",
      earned: 0,
      category: "Sections",
      why: "For campus and fresher hiring, education is a hard filter. Many ATS setups reject applications where a degree can't be found at all.",
    },
    {
      id: "extras",
      label: "Certifications or achievements included",
      points: 8,
      passed:
        content.certifications.length > 0 || content.achievements.length > 0,
      tip: "Add any certifications or achievements. They help you stand out from other freshers.",
      earned: 0,
      category: "Sections",
      why: "When hundreds of resumes show the same degree and skills, a certification, hackathon win, or rank is what breaks the tie in your favour.",
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

  // Missing standard sections (independent of the scored checks).
  const missingSections: string[] = [];
  if (words(content.summary).length === 0) missingSections.push("Summary");
  if (content.skills.length === 0) missingSections.push("Skills");
  if (content.projects.length === 0) missingSections.push("Projects");
  if (content.experience.length === 0) missingSections.push("Experience");
  if (content.education.length === 0) missingSections.push("Education");
  if (content.certifications.length === 0) missingSections.push("Certifications");
  if (content.achievements.length === 0) missingSections.push("Achievements");

  // Improvements = fixes for failed checks, highest-impact first.
  const improvements = checks
    .filter((c) => !c.passed)
    .sort((a, b) => b.points - a.points)
    .map((c) => c.tip);

  const strengths = checks
    .filter((c) => c.passed && c.points >= 10)
    .map((c) => c.label);

  return { score, rating, checks, missingSections, improvements, strengths };
}
