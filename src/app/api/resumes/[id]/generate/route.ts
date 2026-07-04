import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateResumeContent } from "@/lib/ai/generateResume";
import { consumeRateLimit, LIMITS, AI_LIMIT_MESSAGE } from "@/lib/rateLimit";
import { track } from "@/lib/track";

// AI generation can take a while on free models — allow a longer function budget.
export const maxDuration = 60;

// POST /api/resumes/:id/generate — run the AI to produce structured content.
// Accepts the latest answers/contact in the body, persists them, then generates.
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

  const rl = await consumeRateLimit(`u:${userId}:ai`, LIMITS.userAi);
  if (!rl.ok) {
    return NextResponse.json({ error: AI_LIMIT_MESSAGE }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const answers =
    body?.answers && typeof body.answers === "object"
      ? body.answers
      : (resume.answers as Record<string, unknown>);
  const contact =
    body?.contact && typeof body.contact === "object"
      ? body.contact
      : (resume.contact as Record<string, unknown>);

  try {
    const content = await generateResumeContent({
      roleTitle: resume.role,
      contact: contact as { fullName?: string },
      answers: answers as Record<string, unknown>,
    });

    const updated = await prisma.resume.update({
      where: { id },
      data: {
        answers: answers as object,
        contact: contact as object,
        content: content as object,
        status: "generated",
      },
      select: { id: true, content: true, status: true },
    });
    await track("resume_generated", userId, { role: resume.role });
    return NextResponse.json({ resume: updated });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate resume.";
    // Still persist the latest answers so the user doesn't lose their input.
    await prisma.resume.update({
      where: { id },
      data: { answers: answers as object, contact: contact as object },
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
