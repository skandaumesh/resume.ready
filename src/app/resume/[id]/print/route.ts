import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { renderResumeHtml } from "@/lib/resumeHtml";
import { renderPrintPage } from "@/lib/resumePrint";
import { EMPTY_CONTENT, ResumeContent, ContactInfo } from "@/lib/types";
import { DEFAULT_TEMPLATE, isTemplateId } from "@/lib/templates";

export const dynamic = "force-dynamic";

// GET /resume/:id/print — the resume alone as a printable page. The student's
// browser saves it as the PDF (see resumePrint.ts); a route handler rather
// than a page so the app's layout and styles don't wrap the resume document.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await auth();

  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== userId) {
    return new NextResponse("Resume not found.", { status: 404 });
  }
  // No content yet → send them to fill it in and generate.
  if (!resume.content) {
    return NextResponse.redirect(new URL(`/resume/${id}/edit`, req.url));
  }

  const template = isTemplateId(resume.template) ? resume.template : DEFAULT_TEMPLATE;
  const html = renderResumeHtml(
    (resume.contact as Partial<ContactInfo>) ?? {},
    { ...EMPTY_CONTENT, ...(resume.content as unknown as ResumeContent) },
    template,
  );

  return new NextResponse(
    renderPrintPage(html, {
      title: resume.title || "Resume",
      backHref: `/resume/${id}/preview`,
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    },
  );
}
