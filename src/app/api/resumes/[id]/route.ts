import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isTemplateId } from "@/lib/templates";

// Resolve the caller's userId, or a NextResponse error to short-circuit with.
// Ownership itself is enforced inside each query (`where: { id, userId }`) so
// every handler costs a single database round trip.
async function requireUser() {
  const { userId } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId };
}

// GET /api/resumes/:id — full resume record.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await requireUser();
  if ("error" in res) return res.error;

  const resume = await prisma.resume.findFirst({
    where: { id, userId: res.userId },
  });
  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ resume });
}

// PATCH /api/resumes/:id — save edits (title, contact, answers, content).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await requireUser();
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title;
  if (body.contact && typeof body.contact === "object") data.contact = body.contact;
  if (body.answers && typeof body.answers === "object") data.answers = body.answers;
  if (body.content && typeof body.content === "object") data.content = body.content;
  if (isTemplateId(body.template)) data.template = body.template;

  const { count } = await prisma.resume.updateMany({
    where: { id, userId: res.userId },
    data,
  });
  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ resume: { id } });
}

// DELETE /api/resumes/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await requireUser();
  if ("error" in res) return res.error;

  const { count } = await prisma.resume.deleteMany({
    where: { id, userId: res.userId },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
