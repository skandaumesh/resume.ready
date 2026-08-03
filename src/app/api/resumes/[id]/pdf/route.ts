import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { renderResumeHtml } from "@/lib/resumeHtml";
import { EMPTY_CONTENT, ResumeContent, ContactInfo } from "@/lib/types";
import { DEFAULT_TEMPLATE, isTemplateId } from "@/lib/templates";

export const runtime = "nodejs"; // Puppeteer needs the Node runtime, not edge.
export const maxDuration = 60;

// Pinned to match the installed @sparticuz/chromium-min version — the pack
// must be the same version or Chromium won't launch.
const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar";

// Launch a browser that works both locally (full `puppeteer`) and on serverless
// hosts like Vercel. `@sparticuz/chromium` (the full package) bundles a
// Chromium binary too large for Vercel's serverless function size limit, so
// it fails at deploy/runtime even though it works locally — `chromium-min`
// fetches the binary from the pack URL above at cold start instead.
async function launchBrowser() {
  const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === "production";
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    });
  }
  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({ headless: true });
}

// GET /api/resumes/:id/pdf — render the resume to a downloadable PDF.
export async function GET(
  _req: NextRequest,
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
      { error: "Generate the resume before downloading." },
      { status: 400 },
    );
  }

  const template = isTemplateId(resume.template) ? resume.template : DEFAULT_TEMPLATE;
  const html = renderResumeHtml(
    (resume.contact as Partial<ContactInfo>) ?? {},
    { ...EMPTY_CONTENT, ...(resume.content as unknown as ResumeContent) },
    template,
  );

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    const safeTitle = (resume.title || "resume")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "");

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle || "resume"}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
