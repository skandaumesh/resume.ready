import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isTemplateId } from "@/lib/templates";

// Confirm the resume exists AND belongs to the caller. Returns the userId or a
// NextResponse error to short-circuit with.
async function requireOwnership(id: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== userId) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { userId, resume };
}

// GET /api/resumes/:id — full resume record.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await requireOwnership(id);
  if ("error" in res) return res.error;
  return NextResponse.json({ resume: res.resume });
}

// PATCH /api/resumes/:id — save edits (title, contact, answers, content).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await requireOwnership(id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title;
  if (body.contact && typeof body.contact === "object") data.contact = body.contact;
  if (body.answers && typeof body.answers === "object") data.answers = body.answers;
  if (body.content && typeof body.content === "object") data.content = body.content;
  if (isTemplateId(body.template)) data.template = body.template;

  const updated = await prisma.resume.update({
    where: { id },
    data,
    select: { id: true, updatedAt: true },
  });
  return NextResponse.json({ resume: updated });
}

// DELETE /api/resumes/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await requireOwnership(id);
  if ("error" in res) return res.error;

  await prisma.resume.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
