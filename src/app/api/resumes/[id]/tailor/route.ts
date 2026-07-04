import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { enhanceForJob } from "@/lib/ai/generateResume";
import { EMPTY_CONTENT, ResumeContent } from "@/lib/types";
import { consumeRateLimit, LIMITS, AI_LIMIT_MESSAGE } from "@/lib/rateLimit";
import { track } from "@/lib/track";

export const maxDuration = 60;

// POST /api/resumes/:id/tailor
// body: { jobDescription } -> { content }  (resume rewritten to fit the JD)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!resume.content) {
    return NextResponse.json(
      { error: "Generate the resume before tailoring it." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const jobDescription = String(body?.jobDescription ?? "").trim();
  if (jobDescription.length < 20) {
    return NextResponse.json(
      { error: "Paste the full job description first." },
      { status: 400 },
    );
  }

  const current: ResumeContent = {
    ...EMPTY_CONTENT,
    ...(resume.content as unknown as ResumeContent),
  };

  const rl = await consumeRateLimit(`u:${userId}:ai`, LIMITS.userAi);
  if (!rl.ok) {
    return NextResponse.json({ error: AI_LIMIT_MESSAGE }, { status: 429 });
  }

  try {
    const content = await enhanceForJob({
      roleTitle: resume.role,
      content: current,
      jobDescription,
    });
    await prisma.resume.update({
      where: { id },
      data: { content: content as object },
    });
    await track("resume_tailored", userId, { role: resume.role });
    return NextResponse.json({ content });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not tailor the resume.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
