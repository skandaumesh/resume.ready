import { NextRequest, NextResponse } from "next/server";
import { parseResumeText } from "@/lib/ai/parseResume";
import { computeAtsScore } from "@/lib/ats";
import {
  extractDocumentText,
  truncateForModel,
  FileExtractError,
} from "@/lib/extractText";
import {
  detectResumeText,
  parsedLooksEmpty,
  notAResumeMessage,
} from "@/lib/resumeDetect";
import {
  aiBusyResponse,
  consumePublicRateLimit,
  LIMITS,
  publicLimitResponse,
} from "@/lib/rateLimit";
import { track } from "@/lib/track";

export const runtime = "nodejs";
export const maxDuration = 90;

// POST /api/public/ats — the no-login ATS checker (acquisition funnel).
// Anyone can upload a resume and see their real score; the "how to fix it"
// guidance is stripped SERVER-side (not just hidden in the UI) and unlocks
// after sign-up. IP rate-limited because each call costs an AI parse.
export async function POST(req: NextRequest) {
  const rl = await consumePublicRateLimit(req, "pats", LIMITS.publicAts, { usesAi: true });
  if (!rl.ok) return publicLimitResponse(rl);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Expected a file upload." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided. Please upload a PDF or Word document." },
      { status: 400 },
    );
  }

  try {
    const raw = await extractDocumentText(file);

    const detection = detectResumeText(raw);
    if (!detection.isResume) {
      return NextResponse.json(
        { error: notAResumeMessage(detection.label) },
        { status: 422 },
      );
    }

    const parsed = await parseResumeText(truncateForModel(raw));
    if (parsedLooksEmpty(parsed)) {
      return NextResponse.json(
        { error: notAResumeMessage("not a resume") },
        { status: 422 },
      );
    }

    const result = computeAtsScore(parsed.contact, parsed.content);
    await track("public_ats_checked", null, { score: result.score });

    // Free tier sees WHAT passed/failed and why it matters; the concrete
    // fix instructions are the sign-up incentive.
    return NextResponse.json({
      result: {
        ...result,
        checks: result.checks.map((c) => ({ ...c, tip: "" })),
        improvements: [],
      },
      locked: result.checks.filter((c) => !c.passed).length,
      remaining: rl.remaining,
    });
  } catch (err) {
    if (err instanceof FileExtractError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const busy = await aiBusyResponse(err, rl);
    if (busy) return busy;
    const message =
      err instanceof Error ? err.message : "Could not read the resume.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
