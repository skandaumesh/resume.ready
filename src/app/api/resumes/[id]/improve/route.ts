import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { improveField } from "@/lib/ai/generateResume";
import { consumeRateLimit, LIMITS, AI_LIMIT_MESSAGE } from "@/lib/rateLimit";
import { track } from "@/lib/track";

export const maxDuration = 60;

// POST /api/resumes/:id/improve
// body: { fieldLabel: string, text: string } -> { bullets: string[] }
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

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").trim();
  const fieldLabel = String(body?.fieldLabel ?? "this section").trim();
  if (text.length < 5) {
    return NextResponse.json(
      { error: "Write a little more first, then improve it." },
      { status: 400 },
    );
  }

  const rl = await consumeRateLimit(`u:${userId}:ai`, LIMITS.userAi);
  if (!rl.ok) {
    return NextResponse.json({ error: AI_LIMIT_MESSAGE }, { status: 429 });
  }

  try {
    const bullets = await improveField({
      roleTitle: resume.role,
      fieldLabel,
      text,
    });
    await track("field_improved", userId, { field: fieldLabel });
    return NextResponse.json({ bullets });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not improve this field.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
