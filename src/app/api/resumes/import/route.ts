import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
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
import { consumeRateLimit, LIMITS, AI_LIMIT_MESSAGE } from "@/lib/rateLimit";
import { track } from "@/lib/track";

// pdf-parse and mammoth need the full Node.js runtime, not edge.
export const runtime = "nodejs";
// AI parsing + file processing can take a while.
export const maxDuration = 90;

// POST /api/resumes/import — upload a PDF or Word file, parse it, create a resume.
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

  let truncated: string;
  try {
    const rawText = await extractDocumentText(file);

    // Reject documents that clearly aren't resumes (bank statements,
    // invoices, marksheets…) before creating anything.
    const detection = detectResumeText(rawText);
    if (!detection.isResume) {
      return NextResponse.json(
        { error: notAResumeMessage(detection.label) },
        { status: 422 },
      );
    }

    truncated = truncateForModel(rawText);
  } catch (err) {
    if (err instanceof FileExtractError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  try {
    const parsed = await parseResumeText(truncated);

    // Keyword check passed but the parse found no resume substance.
    if (parsedLooksEmpty(parsed)) {
      return NextResponse.json(
        { error: notAResumeMessage("not a resume") },
        { status: 422 },
      );
    }

    const resume = await prisma.resume.create({
      data: {
        userId,
        role: parsed.roleTitle || "General",
        title: `${parsed.roleTitle || "Imported"} Resume`,
        contact: parsed.contact as object,
        answers: parsed.answers as object,
        content: parsed.content as object,
        status: "generated",
      },
      select: { id: true },
    });

    await track("resume_imported", userId, { role: parsed.roleTitle || "General" });
    return NextResponse.json({ id: resume.id }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to parse the resume. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
