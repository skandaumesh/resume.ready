// ─────────────────────────────────────────────────────────────────────────
// Deterministic job-description match. Pure function — extracts meaningful
// keywords from a pasted JD and checks which appear in the resume. Free and
// instant (no AI), so it never rate-limits. Importable on server and client.
// ─────────────────────────────────────────────────────────────────────────

import { ResumeContent } from "@/lib/types";

export interface JobMatchResult {
  score: number; // 0–100 (% of important JD keywords found in the resume)
  matched: string[];
  missing: string[];
  totalKeywords: number;
}

// Common English words + generic JD filler we don't want to treat as keywords.
const STOPWORDS = new Set([
  "the","and","for","are","with","you","your","our","that","this","have","has",
  "will","from","not","but","all","can","who","how","why","what","when","where",
  "a","an","to","of","in","on","at","as","is","be","by","or","we","it","if","so",
  "role","roles","job","jobs","work","working","working","team","teams","company",
  "candidate","candidates","looking","join","join","help","using","use","used",
  "experience","experienced","year","years","strong","good","great","excellent",
  "ability","able","skills","skill","knowledge","understanding","responsibilities",
  "responsibility","requirements","required","preferred","plus","must","should",
  "including","include","includes","etc","various","other","new","well","also",
  "across","within","into","out","up","more","most","such","like","related",
  "day","daily","time","full","part","intern","internship","fresher","freshers",
  "opportunity","environment","fast","paced","paced","excellent","communication",
  "written","verbal","stakeholders","business","end","ensure","support","build",
  "develop","developing","design","designing","manage","managing","deliver",
  "skilled","proficient","familiar","seeking","ideal","best","top","hands",
  "knowledge","expertise","passionate","motivated","detail","oriented","learn",
  "someone","basic","create","perform","various","month","per","stipend",
  "benefits","completion","mentorship","opportunity","based","performance",
]);

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    // keep letters, digits, +, #, . (for c++, c#, node.js) then split on the rest
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, "")) // trim stray punctuation
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function resumeText(content: ResumeContent): string {
  const parts: string[] = [content.summary, ...content.skills];
  content.experience.forEach((e) => {
    parts.push(e.title, e.organization, ...e.bullets);
  });
  content.projects.forEach((p) => {
    parts.push(p.name, ...p.techStack, ...p.bullets);
  });
  content.education.forEach((ed) => parts.push(ed.degree, ed.details || ""));
  parts.push(...content.certifications, ...content.achievements);
  return parts.join(" ").toLowerCase();
}

export function computeJobMatch(
  content: ResumeContent,
  jobDescription: string,
): JobMatchResult {
  // Rank JD keywords by frequency, keep the most important unique ones.
  const freq = new Map<string, number>();
  for (const tok of tokenize(jobDescription)) {
    freq.set(tok, (freq.get(tok) ?? 0) + 1);
  }
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 30);

  if (keywords.length === 0) {
    return { score: 0, matched: [], missing: [], totalKeywords: 0 };
  }

  const haystack = resumeText(content);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of keywords) {
    // word-boundary-ish match so "java" doesn't match "javascript"
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(kw)}([^a-z0-9]|$)`, "i");
    if (re.test(haystack)) matched.push(kw);
    else missing.push(kw);
  }

  const score = Math.round((matched.length / keywords.length) * 100);
  return {
    score,
    matched,
    missing: missing.slice(0, 15),
    totalKeywords: keywords.length,
  };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
