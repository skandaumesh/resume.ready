import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { parseResumeText } from "@/lib/ai/parseResume";
import { enhanceForJob } from "@/lib/ai/generateResume";
import {
  extractDocumentText,
  truncateForModel,
  FileExtractError,
} from "@/lib/extractText";
import { detectResumeText, notAResumeMessage } from "@/lib/resumeDetect";
import { consumeRateLimit, LIMITS, AI_LIMIT_MESSAGE } from "@/lib/rateLimit";
import { track } from "@/lib/track";

export const runtime = "nodejs";
export const maxDuration = 90;

// POST /api/enhance — upload a resume file plus a job description (as text or a
// file). We parse the resume, then rewrite it to align with the JD using the
// same anti-hallucination prompt as the saved-resume tailor flow (it will NOT
// invent employers, degrees, or experiences). Optionally saves the result as a
// new resume so the user can download it.
//
// Returns: { roleTitle, contact, original, tailored, jobDescription, savedId? }
// The client computes the before/after match score deterministically from
// `original` and `tailored`, so the reported improvement is real.
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

  const resumeFile = formData.get("resumeFile");
  if (!resumeFile || !(resumeFile instanceof File)) {
    return NextResponse.json(
      { error: "Please upload your resume (.pdf or .docx)." },
      { status: 400 },
    );
  }

  const jobFile = formData.get("jobFile");
  const jobText = String(formData.get("jobText") ?? "").trim();
  const save = String(formData.get("save") ?? "") === "1";

  const rl = await consumeRateLimit(`u:${userId}:ai`, LIMITS.userAi);
  if (!rl.ok) {
    return NextResponse.json({ error: AI_LIMIT_MESSAGE }, { status: 429 });
  }

  try {
    // 1. Resume file -> raw text -> structured content.
    const resumeRaw = await extractDocumentText(resumeFile);

    // Reject files that clearly aren't resumes (bank statements, invoices…)
    // before spending AI calls parsing and tailoring them.
    const detection = detectResumeText(resumeRaw);
    if (!detection.isResume) {
      return NextResponse.json(
        { error: notAResumeMessage(detection.label) },
        { status: 422 },
      );
    }

    const parsed = await parseResumeText(truncateForModel(resumeRaw));

    // 2. Job description: pasted text takes priority, else read the JD file.
    let jobDescription = jobText;
    if (jobDescription.length < 20 && jobFile instanceof File) {
      jobDescription = truncateForModel(
        await extractDocumentText(jobFile),
      ).trim();
    }
    if (jobDescription.length < 20) {
      return NextResponse.json(
        { error: "Please paste or upload the job description." },
        { status: 400 },
      );
    }

    // 3. Tailor the resume to the JD (truthful — no fabricated experiences).
    const tailored = await enhanceForJob({
      roleTitle: parsed.roleTitle || "General",
      content: parsed.content,
      jobDescription,
    });

    // 4. Optionally persist so the user can preview / download the result.
    let savedId: string | undefined;
    if (save) {
      const resume = await prisma.resume.create({
        data: {
          userId,
          role: parsed.roleTitle || "General",
          title: `${parsed.roleTitle || "Tailored"} Resume (JD-enhanced)`,
          contact: parsed.contact as object,
          content: tailored as object,
          status: "generated",
        },
        select: { id: true },
      });
      savedId = resume.id;
    }

    await track("jd_enhanced", userId, { role: parsed.roleTitle || "General" });

    return NextResponse.json({
      roleTitle: parsed.roleTitle || "General",
      contact: parsed.contact,
      original: parsed.content,
      tailored,
      jobDescription,
      savedId,
    });
  } catch (err) {
    if (err instanceof FileExtractError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Could not enhance the resume.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
