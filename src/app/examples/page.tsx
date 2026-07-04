import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import { ROLES } from "@/lib/roles";

const LIME = "#d9f24e";

export const metadata: Metadata = {
  title: "Fresher Resume Examples by Role (2026) | ResumeReady",
  description:
    "Free, ATS-friendly resume examples for Indian students and freshers: software, data, design, marketing, core engineering and more. Copy the structure or build yours with AI in 10 minutes.",
};

export default function ExamplesIndexPage() {
  const categories = [...new Set(ROLES.map((r) => r.category))];

  return (
    <PublicShell>
      <div className="pt-6 sm:pt-10">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Fresher resume examples,{" "}
          <span className="relative inline-block px-1">
            <span
              className="absolute inset-x-0 bottom-1 top-2 -rotate-1 rounded"
              style={{ backgroundColor: LIME }}
            />
            <span className="relative">role by role</span>
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-600">
          Every example is a complete, ATS-friendly resume with quantified
          bullets, written for Indian students. Pick your role.
        </p>

        {categories.map((cat) => (
          <section key={cat} className="mt-10">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
              {cat}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ROLES.filter((r) => r.category === cat).map((r) => (
                <Link
                  key={r.slug}
                  href={`/examples/${r.slug}`}
                  className="group rounded-2xl bg-white p-5 ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="font-extrabold text-stone-900">
                    {r.title}{" "}
                    <span className="inline-block transition group-hover:translate-x-1">
                      →
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-stone-500">{r.blurb}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PublicShell>
  );
}
