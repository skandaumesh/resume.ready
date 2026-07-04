import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicShell from "@/components/PublicShell";
import { getRoleExample, allExampleSlugs } from "@/lib/roleExamples";
import { renderResumeHtml } from "@/lib/resumeHtml";
import { ROLES } from "@/lib/roles";

const LIME = "#d9f24e";
const INK = "#1b1710";

// Statically generate all 29 role pages at build time.
export function generateStaticParams() {
  return allExampleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const example = getRoleExample(slug);
  if (!example) return {};
  const { role } = example;
  return {
    title: `${role.title} Fresher Resume Example & Free Template (2026) | ResumeReady`,
    description: `A recruiter-ready ${role.title} resume example for Indian students and freshers: sample bullets with real numbers, the skills ATS filters look for, and a free AI builder to make yours in 10 minutes.`,
  };
}

export default async function RoleExamplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const example = getRoleExample(slug);
  if (!example) notFound();

  const { role, contact, content, tips, faq } = example;
  const html = renderResumeHtml(contact, content, "modern");
  const related = ROLES.filter(
    (r) => r.category === role.category && r.slug !== role.slug,
  ).slice(0, 6);

  return (
    <PublicShell>
      <article className="pt-6 sm:pt-10">
        <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
          <Link href="/examples" className="hover:text-stone-600">
            Resume examples
          </Link>{" "}
          / {role.category}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {role.title} fresher resume example{" "}
          <span className="relative inline-block px-1">
            <span
              className="absolute inset-x-0 bottom-1 top-2 -rotate-1 rounded"
              style={{ backgroundColor: LIME }}
            />
            <span className="relative">that gets shortlisted</span>
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-600">
          A complete, ATS-friendly {role.title} resume for Indian students:
          quantified bullets, the right section order, and the skills
          recruiters filter for. Copy the structure, or let the AI write yours
          from plain sentences in about 10 minutes.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/sign-up"
            className="rounded-full px-7 py-3.5 text-sm font-bold text-[#faf6ee] shadow-[3px_3px_0_0_#d9f24e] transition hover:-translate-y-0.5"
            style={{ backgroundColor: INK }}
          >
            Build my {role.title} resume free
          </Link>
          <Link
            href="/ats-check"
            className="rounded-full border-2 border-stone-900 px-7 py-3.5 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5"
          >
            Score my current resume
          </Link>
        </div>

        {/* the sample resume, rendered by the real template engine */}
        <div className="mt-10 overflow-hidden rounded-3xl bg-white p-3 shadow-xl ring-1 ring-stone-200 sm:p-6">
          <iframe
            srcDoc={html}
            title={`${role.title} resume example`}
            className="h-[900px] w-full rounded-xl border-none sm:h-[1100px]"
          />
        </div>

        {/* tips */}
        <section className="mt-14">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            How to write a {role.title} resume as a fresher
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {tips.map((tip, i) => (
              <li
                key={i}
                className="rounded-2xl bg-white p-5 text-stone-700 ring-1 ring-stone-200"
              >
                <span
                  className="mb-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-stone-900"
                  style={{ backgroundColor: LIME }}
                >
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* skills */}
        <section className="mt-14">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Skills recruiters expect on a {role.title} resume
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {content.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-200"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {role.title} resume FAQ
          </h2>
          <div className="mt-6 space-y-4">
            {faq.map((f) => (
              <details
                key={f.q}
                className="rounded-2xl bg-white p-5 ring-1 ring-stone-200"
              >
                <summary className="cursor-pointer font-bold text-stone-900">
                  {f.q}
                </summary>
                <p className="mt-3 text-stone-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* related roles for internal linking */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-extrabold tracking-tight">
              More {role.category} resume examples
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/examples/${r.slug}`}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:ring-stone-400"
                >
                  {r.title} →
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </PublicShell>
  );
}
