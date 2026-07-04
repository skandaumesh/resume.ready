import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { parseResumeText } from "@/lib/ai/parseResume";
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
import { computeAtsScore } from "@/lib/ats";
import { consumeRateLimit, LIMITS, AI_LIMIT_MESSAGE } from "@/lib/rateLimit";
import { track } from "@/lib/track";

// Text extraction + AI parsing need the Node runtime and some time.
export const runtime = "nodejs";
export const maxDuration = 90;

// POST /api/ats/parse — upload a PDF/Word resume and get back structured
// { contact, content } WITHOUT saving anything. The client computes the ATS
// score from this deterministically, so an uploaded file scores exactly the
// same as a saved resume would.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const rl = await consumeRateLimit(`u:${userId}:ai`, LIMITS.userAi);
  if (!rl.ok) {
    return NextResponse.json({ error: AI_LIMIT_MESSAGE }, { status: 429 });
  }

  try {
    const raw = await extractDocumentText(file);

    // Gate 1: reject documents that clearly aren't resumes (bank statements,
    // invoices, marksheets…) before spending an AI call scoring them.
    const detection = detectResumeText(raw);
    if (!detection.isResume) {
      return NextResponse.json(
        { error: notAResumeMessage(detection.label) },
        { status: 422 },
      );
    }

    const parsed = await parseResumeText(truncateForModel(raw));

    // Gate 2: keyword check passed but the parse found no resume substance.
    if (parsedLooksEmpty(parsed)) {
      return NextResponse.json(
        { error: notAResumeMessage("not a resume") },
        { status: 422 },
      );
    }

    // The client recomputes this deterministically; we log it for real stats.
    const { score } = computeAtsScore(parsed.contact, parsed.content);
    await track("ats_checked", userId, { score, source: "upload" });

    return NextResponse.json({
      roleTitle: parsed.roleTitle,
      contact: parsed.contact,
      content: parsed.content,
    });
  } catch (err) {
    if (err instanceof FileExtractError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Could not read the resume.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
