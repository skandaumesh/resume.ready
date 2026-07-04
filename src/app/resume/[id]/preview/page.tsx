import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { renderResumeHtml } from "@/lib/resumeHtml";
import { EMPTY_CONTENT, ResumeContent, ContactInfo } from "@/lib/types";
import { DEFAULT_TEMPLATE, isTemplateId } from "@/lib/templates";
import AppHeader from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  const resume = await prisma.resume.findUnique({ where: { id } });

  if (!resume || resume.userId !== userId) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <p className="mx-auto max-w-3xl px-4 py-16 text-center text-red-600">
          Resume not found.
        </p>
      </div>
    );
  }

  // No content yet → send them to fill it in and generate.
  if (!resume.content) redirect(`/resume/${id}/edit`);

  const contact = (resume.contact as Partial<ContactInfo>) ?? {};
  const content: ResumeContent = {
    ...EMPTY_CONTENT,
    ...(resume.content as unknown as ResumeContent),
  };
  const template = isTemplateId(resume.template) ? resume.template : DEFAULT_TEMPLATE;
  const html = renderResumeHtml(contact, content, template);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-1 text-xl font-bold text-stone-900">
            {resume.title}
          </h1>
        </div>

        {/* Two-column layout: tools on the left, full resume preview on the right. */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Left sidebar — ATS checker & JD enhancer entry points. */}
          <aside className="flex flex-col gap-4">
            <Link
              href={`/dashboard/ats?id=${id}`}
              className="group glass-card flex flex-col gap-1 p-5 transition hover:border-brand-400 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-stone-900">
                  ATS score
                </span>
                <span className="text-brand-600 transition group-hover:translate-x-0.5">
                  →
                </span>
              </div>
              <p className="text-sm text-stone-500">
                Check how ready this resume is to pass automated recruiter
                screening.
              </p>
            </Link>

            <Link
              href={`/dashboard/enhance?id=${id}`}
              className="group glass-card flex flex-col gap-1 p-5 transition hover:border-brand-400 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-stone-900">
                  JD enhancer
                </span>
                <span className="text-brand-600 transition group-hover:translate-x-0.5">
                  →
                </span>
              </div>
              <p className="text-sm text-stone-500">
                Match this resume against a job description and let the AI tailor
                it to fit.
              </p>
            </Link>

            {/* Primary actions, under the two tool cards. */}
            <Link
              href={`/resume/${id}/edit`}
              className="rounded-xl border border-stone-300 bg-white/70 px-4 py-2.5 text-center text-sm font-medium text-stone-700 hover:bg-white"
            >
              Edit answers
            </Link>
            {/* Native download via the PDF route. */}
            <a
              href={`/api/resumes/${id}/pdf`}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              Download PDF
            </a>

            <p className="text-xs text-stone-400">
              This preview is exactly how your downloaded PDF will look. Not happy
              with a line? Tap &ldquo;Edit answers&rdquo; and regenerate.
            </p>
          </aside>

          {/* Right — the resume as a real A4 sheet on a document canvas. The
              sheet keeps the exact 210:297 (A4) ratio at 794px wide, which is
              how the PDF route renders it, so this preview matches 1:1. */}
          <div className="overflow-auto rounded-2xl bg-stone-200/60 p-4 shadow-inner sm:p-6 lg:max-h-[calc(100vh-9rem)]">
            <div className="mx-auto aspect-[210/297] w-full max-w-[794px] overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-black/5">
              <iframe
                title="Resume preview"
                srcDoc={html}
                className="h-full w-full bg-white"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
