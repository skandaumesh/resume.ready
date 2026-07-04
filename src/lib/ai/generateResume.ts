// ─────────────────────────────────────────────────────────────────────────
// The ONLY place that talks to an AI provider.
// Providers are tried in order, all via the OpenAI-compatible chat API:
//   1. Gemini (Google AI Studio free tier — 1,500 requests/day, strong JSON)
//   2. OpenRouter free-tier models (50/day, or 1,000/day after a $10 top-up)
// Each provider is skipped when its key isn't set. To add or swap providers,
// change only this file — the rest of the app calls the exported functions.
// ─────────────────────────────────────────────────────────────────────────

import { ResumeContent, EMPTY_CONTENT, SECTION_KEYS, SectionKey } from "@/lib/types";
import { serializeAnswersForPrompt } from "@/lib/draftPreview";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Google's OpenAI-compatible endpoint for the Gemini API.
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Max time to wait on any single model before falling through to the next.
// Generous enough for large outputs (full-resume rewrites) on slow free models.
const PER_MODEL_TIMEOUT_MS = 35000;

export interface GenerateInput {
  roleTitle: string; // free text — whatever role the student typed
  contact: { fullName?: string };
  answers: Record<string, unknown>;
}

// A compact description of the JSON we want back. Free open models don't
// reliably honor strict JSON-schema enforcement, so we describe the shape in
// the prompt AND validate/repair on our side.
const SCHEMA_HINT = `Return ONLY a valid JSON object (no markdown, no code fences, no commentary) with EXACTLY this shape:
{
  "summary": "string — 2 to 3 line professional summary tailored to the target role",
  "skills": ["string", ...],
  "experience": [{ "title": "string", "organization": "string", "duration": "string", "bullets": ["string", ...] }],
  "projects": [{ "name": "string", "techStack": ["string", ...], "bullets": ["string", ...] }],
  "education": [{ "degree": "string", "institution": "string", "duration": "string", "details": "string" }],
  "certifications": ["string", ...],
  "achievements": ["string", ...],
  "sectionOrder": ["summary","skills","experience","projects","education","certifications","achievements"]
}
For "sectionOrder": order the sections in the way that is MOST effective for the target role. Only use these exact keys. Put the sections that best sell the candidate for THIS role first (e.g. a designer or developer usually leads with projects/skills; a fresher with little else leads with education; a sales/marketing role leads with achievements/experience). Include every key once.`;

function buildPrompt(input: GenerateInput): string {
  const { roleTitle, answers, contact } = input;
  const serialized = serializeAnswersForPrompt(answers);

  return `You are an expert resume writer helping an Indian college student apply for a "${roleTitle}" internship/entry-level role.

First, interpret the target role "${roleTitle}" — even if it is informal or non-standard, infer what kind of job it is and what recruiters for it care about. Then rewrite the student's inputs into a polished, ATS-friendly resume tailored to that role.

RULES:
- PRESERVE the structured facts the student gave: keep their job titles, company names, project names, tech stacks, degrees, institutions, and dates. Do not invent or change them.
- Turn each description into strong, quantified, action-verb bullets. Example: "made a website for college" -> "Built a web platform used by 500+ students to check results, using React and Firebase, reducing manual queries by ~40%".
- If a number is genuinely unknown, use a reasonable, modest, clearly-plausible estimate (e.g. "500+ students", "~30%") rather than inventing extreme claims. Never fabricate employers, degrees, or awards that were not mentioned.
- Every bullet starts with a strong past-tense action verb (Built, Led, Designed, Analyzed, Automated, Improved...).
- Keep it truthful to what the student actually did; enhance phrasing and framing, do not invent whole experiences.
- Tailor the summary, the skills ordering, AND the section order to what matters most for the "${roleTitle}" role.
- Keep bullets concise (one line each, ideally under 25 words).
- Write in plain, natural human English. Do NOT use em dashes or double hyphens ("--"). Use commas, periods, or "to" instead. Avoid robotic or obviously AI-sounding phrasing.

STUDENT NAME: ${contact.fullName || "(not provided)"}
TARGET ROLE: ${roleTitle}

STUDENT INPUTS:
${serialized || "(minimal input provided — do your best with what is given)"}

${SCHEMA_HINT}`;
}

interface Provider {
  name: string;
  url: string;
  apiKey: string;
  models: string[]; // tried in order within the provider
}

function splitModels(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Providers in priority order; each is included only when its key is set.
// Model lists are comma-separated env overrides — free models get rate-limited
// upstream constantly, so we try them in order and fall through on a
// 429 / 5xx / empty response. First success wins.
function getProviders(): Provider[] {
  const providers: Provider[] = [];
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    providers.push({
      name: "gemini",
      url: GEMINI_URL,
      apiKey: geminiKey,
      models: splitModels(
        process.env.GEMINI_MODEL || "gemini-2.5-flash,gemini-2.5-flash-lite",
      ),
    });
  }
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    providers.push({
      name: "openrouter",
      url: OPENROUTER_URL,
      apiKey: openrouterKey,
      // Fastest-first: smaller models return quicker; the large 120b model is
      // kept last as a higher-quality fallback if the faster ones are busy.
      models: splitModels(
        process.env.OPENROUTER_MODEL ||
          "openai/gpt-oss-20b:free,google/gemma-4-31b-it:free,meta-llama/llama-3.3-70b-instruct:free,qwen/qwen3-next-80b-a3b-instruct:free,openai/gpt-oss-120b:free,meta-llama/llama-3.2-3b-instruct:free",
      ),
    });
  }
  return providers;
}

type ModelResult =
  | { ok: true; content: string }
  | { ok: false; retryable: boolean; fatal?: boolean; detail: string; retryAfterMs?: number };

// Overall wall-clock budget for a whole call (all models, all passes). Kept
// under the API routes' maxDuration (60s) so we return a friendly error rather
// than being hard-killed mid-request.
const TOTAL_BUDGET_MS = 52000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Pull a retry delay (ms) out of a rate-limited response, if the provider gave
// one — via the Retry-After header or the error metadata OpenRouter forwards.
function parseRetryAfterMs(res: Response, errorBody?: unknown): number | undefined {
  const header = res.headers.get("retry-after");
  if (header && !Number.isNaN(Number(header))) return Number(header) * 1000;
  const meta = (errorBody as { metadata?: { retry_after_seconds?: number } })?.metadata;
  if (typeof meta?.retry_after_seconds === "number") return meta.retry_after_seconds * 1000;
  return undefined;
}

async function tryModel(
  provider: Provider,
  model: string,
  messages: { role: string; content: string }[],
  timeoutMs: number,
): Promise<ModelResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
    "Content-Type": "application/json",
  };
  if (provider.name === "openrouter") {
    // Optional attribution headers OpenRouter recommends:
    headers["HTTP-Referer"] =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    headers["X-Title"] = "Resume Builder";
  }

  // Everything (request AND body read) is inside one try so an abort/timeout
  // fired mid-download is caught and we fall through to the next model instead
  // of crashing the whole request.
  try {
    const res = await fetch(provider.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        // Ask for JSON output where the model supports it (best-effort).
        response_format: { type: "json_object" },
      }),
      // Don't let one slow free model block the whole request — bail and fall
      // through to the next model.
      signal: AbortSignal.timeout(timeoutMs),
    });

    // Auth errors won't fix themselves by switching models — skip the rest of
    // this provider's models and move on to the next provider.
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        retryable: false,
        fatal: true,
        detail: `${provider.name} auth failed. Check its API key in .env.`,
      };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const retryable = res.status === 429 || res.status >= 500;
      return {
        ok: false,
        retryable,
        detail: `${provider.name}/${model}: ${res.status} ${text.slice(0, 100)}`,
        retryAfterMs: parseRetryAfterMs(res),
      };
    }

    const data = await res.json();
    // Some providers return a 200 whose body carries an error object.
    if (data?.error) {
      const code = data.error.code;
      const retryable = code === 429 || (typeof code === "number" && code >= 500);
      return {
        ok: false,
        retryable,
        detail: `${provider.name}/${model}: ${String(data.error.message).slice(0, 100)}`,
        retryAfterMs: parseRetryAfterMs(res, data.error),
      };
    }
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content)
      return {
        ok: false,
        retryable: true,
        detail: `${provider.name}/${model}: empty response`,
      };
    return { ok: true, content };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const timedOut = name === "TimeoutError" || name === "AbortError";
    return {
      ok: false,
      retryable: true,
      detail: `${provider.name}/${model}: ${timedOut ? "timed out" : "network error"}`,
    };
  }
}

/**
 * Run a chat completion against the configured providers: every model of the
 * first provider, then the next provider's, until one answers. Exported for
 * the other ai/ modules — this file stays the only one talking to a provider.
 */
export async function callAi(
  messages: { role: string; content: string }[],
): Promise<string> {
  const providers = getProviders();
  if (!providers.length) {
    throw new Error(
      "No AI provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY in your .env file.",
    );
  }

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const failures: string[] = [];

  // Up to 2 passes over the provider/model list. Free tiers are frequently
  // ALL rate-limited for a few seconds at once; a short backoff before a
  // second pass usually lets one recover.
  for (let pass = 0; pass < 2; pass++) {
    let sawRetryable = false;
    let backoffMs = 3500; // default wait before a second pass

    providerLoop: for (const provider of providers) {
      for (const model of provider.models) {
        const remaining = deadline - Date.now();
        if (remaining < 3000) break providerLoop; // out of time budget
        const result = await tryModel(
          provider,
          model,
          messages,
          Math.min(PER_MODEL_TIMEOUT_MS, remaining),
        );
        if (result.ok) return result.content;
        failures.push(result.detail);
        if (result.fatal) continue providerLoop; // bad key — next provider
        if (result.retryable) {
          sawRetryable = true;
          if (result.retryAfterMs) backoffMs = Math.max(backoffMs, result.retryAfterMs);
        }
      }
    }

    // Only a second pass is worthwhile if something was transiently busy.
    if (!sawRetryable) break;
    const wait = Math.min(backoffMs, deadline - Date.now() - 3000);
    if (wait <= 0) break;
    await sleep(wait);
  }

  throw new Error(
    `All AI models are busy right now. Please try again in a moment. (${failures
      .slice(-6)
      .join(" | ")})`,
  );
}

// Strip code fences / stray prose and pull out the first {...} JSON object.
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

// Replace fancy dashes that read as "AI-written" with plain punctuation:
// em dash -> comma, en/figure/non-breaking hyphens -> plain hyphen.
function sanitizeText(s: string): string {
  return String(s)
    .replace(/—/g, ", ")
    .replace(/[‐‑‒–]/g, "-")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function coerceStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => sanitizeText(String(x))).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [sanitizeText(v)];
  return [];
}

// Normalize an arbitrary parsed object into a safe ResumeContent so the rest of
// the app never has to defend against missing/oddly-typed fields.
function normalize(parsed: any): ResumeContent {
  const s = (v: unknown) => sanitizeText(String(v ?? ""));
  return {
    summary: typeof parsed?.summary === "string" ? sanitizeText(parsed.summary) : "",
    skills: coerceStringArray(parsed?.skills),
    experience: Array.isArray(parsed?.experience)
      ? parsed.experience.map((e: any) => ({
          title: s(e?.title),
          organization: s(e?.organization),
          duration: s(e?.duration),
          bullets: coerceStringArray(e?.bullets),
        }))
      : [],
    projects: Array.isArray(parsed?.projects)
      ? parsed.projects.map((p: any) => ({
          name: s(p?.name),
          techStack: coerceStringArray(p?.techStack),
          bullets: coerceStringArray(p?.bullets),
        }))
      : [],
    education: Array.isArray(parsed?.education)
      ? parsed.education.map((ed: any) => ({
          degree: s(ed?.degree),
          institution: s(ed?.institution),
          duration: s(ed?.duration),
          details: ed?.details ? s(ed.details) : undefined,
        }))
      : [],
    certifications: coerceStringArray(parsed?.certifications),
    achievements: coerceStringArray(parsed?.achievements),
    sectionOrder: normalizeSectionOrder(parsed?.sectionOrder),
  };
}

// Keep only valid, de-duplicated section keys; append any the AI omitted so no
// section is ever dropped from rendering.
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

/**
 * Generate structured resume content from the student's Q&A answers.
 * Handles the unreliable-JSON reality of free open models with one repair retry.
 */
export async function generateResumeContent(
  input: GenerateInput,
): Promise<ResumeContent> {
  const prompt = buildPrompt(input);

  // First attempt.
  const first = await callAi([{ role: "user", content: prompt }]);
  try {
    return normalize(JSON.parse(extractJson(first)));
  } catch {
    // Repair attempt — hand the model back its own broken output and ask for
    // valid JSON only. Free models frequently need this second pass.
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
      // Give up gracefully rather than crash the request; caller can let the
      // user retry or edit manually.
      throw new Error(
        "The AI returned invalid data twice. Please try generating again.",
      );
    }
  }
}

/**
 * Improve a SINGLE field (e.g. the projects or experience text) into a few
 * strong, quantified bullet points the student can edit inline — the per-field
 * "one-click improve". Returns a list of bullet strings.
 */
export async function improveField(input: {
  roleTitle: string;
  fieldLabel: string;
  text: string;
}): Promise<string[]> {
  const { roleTitle, fieldLabel, text } = input;
  const prompt = `You are an expert resume writer for a "${roleTitle}" role.
Rewrite the student's rough "${fieldLabel}" notes below into 3 to 5 strong resume bullet points.

RULES:
- Start each bullet with a strong past-tense action verb (Built, Led, Analyzed, Designed, Improved...).
- Add modest, plausible numbers where they fit (e.g. "500+ users", "~30%"); never invent extreme or false claims.
- Keep each bullet to one line, under 25 words.
- Write in plain, natural English. Do NOT use em dashes or double hyphens ("--"); use commas, periods, or "to" instead.
- Do not fabricate employers, tools, or facts the student did not mention.

STUDENT NOTES:
${text}

Return ONLY a JSON object: {"bullets": ["...", "..."]} — no markdown, no commentary.`;

  const parse = (raw: string): string[] => coerceStringArray(JSON.parse(extractJson(raw))?.bullets);

  const first = await callAi([{ role: "user", content: prompt }]);
  try {
    const bullets = parse(first);
    if (bullets.length) return bullets;
  } catch {
    /* fall through to repair */
  }
  const repaired = await callAi([
    { role: "user", content: prompt },
    { role: "assistant", content: first },
    {
      role: "user",
      content:
        'Respond again with ONLY the JSON object {"bullets": [...]} with no markdown and no commentary.',
    },
  ]);
  try {
    const bullets = parse(repaired);
    if (bullets.length) return bullets;
  } catch {
    /* handled below */
  }
  throw new Error("The AI could not improve this field right now. Please try again.");
}

/**
 * Rewrite an existing resume to align with a specific job description, weaving
 * in the job's terminology and plausibly-applicable keywords WITHOUT fabricating
 * experiences. Returns updated ResumeContent. The caller recomputes the match
 * score from this content (deterministically), so the improvement is real.
 */
export async function enhanceForJob(input: {
  roleTitle: string;
  content: ResumeContent;
  jobDescription: string;
}): Promise<ResumeContent> {
  const { roleTitle, content, jobDescription } = input;

  const prompt = `You are an expert resume writer tailoring a candidate's EXISTING resume to a specific job for a "${roleTitle}" role.

CURRENT RESUME (JSON):
${JSON.stringify(content)}

TARGET JOB DESCRIPTION:
${jobDescription}

Rewrite the resume so it aligns with this job:
- Naturally weave in the job's important skills, tools, and terminology WHERE they plausibly apply to the candidate's existing experience, projects, and skills.
- Rephrase the summary and existing bullets to use the job's language wherever it genuinely fits.
- You MAY add closely-related skills the candidate very likely already has given their background (e.g. add "dashboards" for someone who already did data analysis). Do NOT invent employers, job titles, degrees, certifications, or major experiences the candidate never mentioned.
- Keep every bullet truthful and concise (one line, under 25 words), starting with a strong action verb.
- Write natural human English. Do NOT use em dashes or double hyphens ("--").
- Keep the exact same JSON shape.

${SCHEMA_HINT}`;

  const first = await callAi([{ role: "user", content: prompt }]);
  try {
    return normalize(JSON.parse(extractJson(first)));
  } catch {
    const repaired = await callAi([
      { role: "user", content: prompt },
      { role: "assistant", content: first },
      {
        role: "user",
        content:
          "Respond again with ONLY the JSON object described earlier, with no markdown and no commentary.",
      },
    ]);
    try {
      return normalize(JSON.parse(extractJson(repaired)));
    } catch {
      throw new Error(
        "The AI could not tailor your resume right now. Please try again.",
      );
    }
  }
}

export interface RoastResult {
  roast: string[]; // 2-3 punchy lines about the resume
  fixes: string[]; // 3 concrete quick fixes
}

/**
 * The Resume Roast: brutally honest, funny, but ultimately useful feedback on
 * raw resume text. Public-facing acquisition tool, one AI call.
 */
export async function roastResume(rawText: string): Promise<RoastResult> {
  const prompt = `You are a witty, brutally honest resume reviewer for Indian college students. Below is the raw text of a real resume. Roast it, then help it.

RULES:
- The roast must be about THE RESUME, never the person. Punch at cliches, vagueness, buzzwords, missing numbers, bloated skill lists, "Microsoft Office" as a skill, etc.
- Be specific to THIS resume: quote or reference its actual content.
- Funny and shareable, but never cruel, never about grades, colleges, gaps, or anything personal. No profanity.
- Then give 3 concrete, genuinely useful quick fixes for the biggest problems.
- Plain natural English. Do NOT use em dashes or double hyphens. Keep each line under 30 words.

RESUME TEXT:
${rawText}

Return ONLY a JSON object (no markdown, no commentary):
{"roast": ["line 1", "line 2", "line 3"], "fixes": ["fix 1", "fix 2", "fix 3"]}`;

  const parse = (raw: string): RoastResult => {
    const obj = JSON.parse(extractJson(raw));
    const roast = coerceStringArray(obj?.roast).slice(0, 3);
    const fixes = coerceStringArray(obj?.fixes).slice(0, 3);
    if (!roast.length || !fixes.length) throw new Error("empty roast");
    return { roast, fixes };
  };

  const first = await callAi([{ role: "user", content: prompt }]);
  try {
    return parse(first);
  } catch {
    const repaired = await callAi([
      { role: "user", content: prompt },
      { role: "assistant", content: first },
      {
        role: "user",
        content:
          'Respond again with ONLY the JSON object {"roast": [...], "fixes": [...]} with no markdown and no commentary.',
      },
    ]);
    try {
      return parse(repaired);
    } catch {
      throw new Error("The roaster is speechless right now. Please try again.");
    }
  }
}

export interface LinkedInAiSuggestion {
  area: string; // "Headline" | "About" | "Experience" | "Skills" | ...
  issue: string; // what's weak now, referencing the actual profile
  suggestion: string; // concrete replacement text, ready to paste into LinkedIn
}

export interface LinkedInAiAdvice {
  verdict: string; // one-line overall impression of the profile
  suggestions: LinkedInAiSuggestion[]; // 4-6, ordered by impact
}

/**
 * Personalized LinkedIn coaching on top of the deterministic rating: reads the
 * profile's actual content and writes ready-to-paste rewrites (headline, About,
 * experience bullets). One AI call; the caller treats failure as non-fatal so
 * the deterministic score still renders.
 */
export async function coachLinkedInProfile(
  rawText: string,
): Promise<LinkedInAiAdvice> {
  const prompt = `You are a LinkedIn profile coach for Indian college students and early-career professionals. Below is the text of a real LinkedIn profile, exported as PDF from LinkedIn itself. Give personalized, concrete suggestions that make THIS profile stronger.

RULES:
- Be specific to THIS profile: quote or reference its actual content in every issue.
- Every "suggestion" must be finished replacement text the person can paste into LinkedIn as-is: an actual rewritten headline, an actual rewritten About paragraph, actual rewritten experience bullets. Never advice like "add more detail".
- Use ONLY facts present in the profile. Never invent employers, projects, numbers, degrees, or skills. If a bullet would benefit from a number the profile doesn't give, write it with a placeholder like "[number] users".
- Order suggestions by impact: fix the headline and About before smaller sections.
- 4 to 6 suggestions. "area" is the profile section: Headline, About, Experience, Skills, Education, Certifications.
- Plain natural English. Do NOT use em dashes or double hyphens. No buzzword soup ("passionate", "results-driven", "synergy").

LINKEDIN PROFILE TEXT:
${rawText}

Return ONLY a JSON object (no markdown, no commentary):
{"verdict": "one honest line on the profile's overall state", "suggestions": [{"area": "Headline", "issue": "what is weak now", "suggestion": "ready-to-paste replacement text"}, ...]}`;

  const parse = (raw: string): LinkedInAiAdvice => {
    const obj = JSON.parse(extractJson(raw));
    const verdict = sanitizeText(String(obj?.verdict ?? ""));
    const suggestions = (Array.isArray(obj?.suggestions) ? obj.suggestions : [])
      .map((s: any) => ({
        area: sanitizeText(String(s?.area ?? "Profile")),
        issue: sanitizeText(String(s?.issue ?? "")),
        suggestion: sanitizeText(String(s?.suggestion ?? "")),
      }))
      .filter((s: LinkedInAiSuggestion) => s.issue && s.suggestion)
      .slice(0, 6);
    if (!verdict || !suggestions.length) throw new Error("empty advice");
    return { verdict, suggestions };
  };

  const first = await callAi([{ role: "user", content: prompt }]);
  try {
    return parse(first);
  } catch {
    const repaired = await callAi([
      { role: "user", content: prompt },
      { role: "assistant", content: first },
      {
        role: "user",
        content:
          'Respond again with ONLY the JSON object {"verdict": "...", "suggestions": [{"area": "...", "issue": "...", "suggestion": "..."}]} with no markdown and no commentary.',
      },
    ]);
    try {
      return parse(repaired);
    } catch {
      throw new Error(
        "The AI coach could not review your profile right now. Please try again.",
      );
    }
  }
}

export { EMPTY_CONTENT };
