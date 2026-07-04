// ─────────────────────────────────────────────────────────────────────────
// "Is this even a resume?" gate for uploaded documents. Deterministic keyword
// scoring — runs BEFORE the AI parse, so a bank statement or invoice is
// rejected instantly instead of being scored like a (terrible) resume.
// ─────────────────────────────────────────────────────────────────────────

import { ParsedResume } from "@/lib/ai/parseResume";

export interface ResumeDetection {
  isResume: boolean;
  /** Human-readable guess at what the document actually is, e.g. "a bank statement". */
  label: string;
}

// Each pattern counts at most once, so a statement repeating "debit" 200
// times doesn't drown out anything — we score document *variety*, not volume.
const RESUME_SIGNALS: RegExp[] = [
  /\b(education|qualifications?)\b/i,
  /\b(work experience|professional experience|experience|internships?)\b/i,
  /\bskills?\b/i,
  /\bprojects?\b/i,
  /\b(objective|professional summary|career summary|about me)\b/i,
  /\b(certifications?|achievements?|awards?)\b/i,
  /\b(b\.?\s?tech|m\.?\s?tech|b\.?\s?e|b\.?\s?sc|m\.?\s?sc|mba|bca|mca|bachelor|master|degree|cgpa|gpa)\b/i,
  /\b(university|college|institute)\b/i,
  /\b(resume|curriculum vitae|cv)\b/i,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, // email
  /linkedin\.com|github\.com/i,
];

const OTHER_DOCS: { label: string; signals: RegExp[] }[] = [
  {
    label: "a bank statement",
    signals: [
      /\baccount\s*(no|number|#)\b/i,
      /\bifsc\b/i,
      /\bstatement of account|account statement|e-?statement\b/i,
      /\b(opening|closing|available)\s+balance\b/i,
      /\btransaction(s| id| date)?\b/i,
      /\bwithdraw(al)?s?\b/i,
      /\bdeposits?\b/i,
      /\b(neft|rtgs|imps|upi)\b/i,
      /\bdebit(ed)?\b/i,
      /\bcredit(ed)?\b/i,
      /\bnet\s?banking\b/i,
      /\bbranch\b/i,
    ],
  },
  {
    label: "an invoice or bill",
    signals: [
      /\binvoice\b/i,
      /\bgstin?\b/i,
      /\bamount\s+(due|payable)\b/i,
      /\bbill(ed)?\s+to\b/i,
      /\bsub\s?total\b/i,
      /\bpayment\s+(due|terms)\b/i,
      /\breceipt\b/i,
    ],
  },
  {
    label: "a marksheet or certificate",
    signals: [
      /\bmarks?\s+obtained\b/i,
      /\bgrade\s+sheet\b/i,
      /\bhall\s?ticket\b/i,
      /\broll\s*(no|number)\b/i,
      /\bexamination\s+(held|result)\b/i,
    ],
  },
  {
    label: "a legal or official document",
    signals: [
      /\bagreement\b/i,
      /\bwhereas\b/i,
      /\bhereinafter\b/i,
      /\bterms\s+and\s+conditions\b/i,
    ],
  },
];

function countHits(text: string, patterns: RegExp[]): number {
  return patterns.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
}

export function detectResumeText(raw: string): ResumeDetection {
  const text = (raw || "").slice(0, 20000);

  const resumeScore = countHits(text, RESUME_SIGNALS);

  let worstLabel = "";
  let worstScore = 0;
  for (const doc of OTHER_DOCS) {
    const s = countHits(text, doc.signals);
    if (s > worstScore) {
      worstScore = s;
      worstLabel = doc.label;
    }
  }

  // Clearly some other document type, and weak resume evidence.
  if (worstScore >= 4 && worstScore > resumeScore) {
    return { isResume: false, label: worstLabel };
  }
  // Not enough resume evidence at all (random PDFs, scanned images, etc.).
  if (resumeScore < 4) {
    return {
      isResume: false,
      label: worstScore >= 2 ? worstLabel : "not a resume",
    };
  }
  return { isResume: true, label: "a resume" };
}

/** Second gate, after the AI parse: a document that slipped through keywords
 *  but yielded no resume substance is not a resume either. */
export function parsedLooksEmpty(parsed: ParsedResume): boolean {
  const c = parsed.content;
  return (
    c.education.length === 0 &&
    c.experience.length === 0 &&
    c.projects.length === 0 &&
    c.skills.length < 2
  );
}

export function notAResumeMessage(label: string): string {
  const it = label === "not a resume" ? "a resume" : label;
  return label === "not a resume"
    ? "This file doesn't look like a resume. We couldn't find sections like education, skills, or experience in it. Please upload your resume as a PDF or Word file."
    : `This file looks like ${it}, not a resume. Please upload your resume as a PDF or Word file.`;
}
