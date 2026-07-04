import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/resumes — list the current user's resumes.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      role: true,
      status: true,
      updatedAt: true,
      contact: true,
      content: true,
      template: true,
    },
  });
  return NextResponse.json({ resumes });
}

// POST /api/resumes — create a new draft resume for a chosen role.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  // Roles are free text now — accept whatever the student typed.
  const role = String(body?.role ?? "").trim();
  if (role.length < 2 || role.length > 80) {
    return NextResponse.json(
      { error: "Please enter a role (2-80 characters)." },
      { status: 400 },
    );
  }

  const resume = await prisma.resume.create({
    data: {
      userId,
      role,
      title: `${role} Resume`,
    },
    select: { id: true },
  });
  return NextResponse.json({ id: resume.id }, { status: 201 });
}
