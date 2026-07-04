import { NextRequest, NextResponse } from "next/server";
import { roastResume } from "@/lib/ai/generateResume";
import { extractDocumentText, truncateForModel, FileExtractError } from "@/lib/extractText";
import { detectResumeText, notAResumeMessage } from "@/lib/resumeDetect";
import {
  consumeRateLimit,
  getClientIp,
  LIMITS,
  PUBLIC_LIMIT_MESSAGE,
} from "@/lib/rateLimit";
import { track } from "@/lib/track";

export const runtime = "nodejs";
export const maxDuration = 90;

// POST /api/public/roast — the AI Resume Roast (acquisition tool, no login).
// Upload a resume, get 2-3 brutally honest lines plus 3 quick fixes. Heavily
// IP rate-limited: it's designed to be shared, which means bots find it too.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await consumeRateLimit(`ip:${ip}:roast`, LIMITS.publicRoast);
  if (!rl.ok) {
    return NextResponse.json({ error: PUBLIC_LIMIT_MESSAGE }, { status: 429 });
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

  try {
    const raw = await extractDocumentText(file);

    const detection = detectResumeText(raw);
    if (!detection.isResume) {
      return NextResponse.json(
        { error: notAResumeMessage(detection.label) },
        { status: 422 },
      );
    }

    const result = await roastResume(truncateForModel(raw, 6000));
    await track("resume_roasted", null, {});

    return NextResponse.json({ ...result, remaining: rl.remaining });
  } catch (err) {
    if (err instanceof FileExtractError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Could not roast the resume.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
