# ResumeReady — AI resume builder for students

Get internship-ready in 10 minutes. Students pick a role, answer a few plain-language
questions, and the AI turns them into an ATS-friendly resume with strong, quantified
bullet points — downloadable as a PDF.

Works on phone and desktop (fully responsive).

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router) + TypeScript                          |
| Styling    | Tailwind CSS (responsive)                                     |
| Auth       | Clerk (email + Google)                                        |
| Database   | PostgreSQL (Supabase) via Prisma ORM                          |
| AI         | OpenRouter free-tier models (swappable — see `src/lib/ai/`)   |
| PDF export | Puppeteer (local) / `@sparticuz/chromium` (serverless/Vercel) |

## Prerequisites (free accounts)

1. **Supabase** — https://supabase.com → create a project → copy the Postgres
   connection strings.
2. **Clerk** — https://dashboard.clerk.com → create an app, enable Email + Google →
   copy the API keys.
3. **OpenRouter** — https://openrouter.ai/keys → create a key. Browse free models at
   https://openrouter.ai/models?max_price=0.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   then fill in DATABASE_URL, DIRECT_URL, Clerk keys, and OPENROUTER_API_KEY

# 3. Create the database tables
npm run db:push

# 4. Run it
npm run dev
```

Open http://localhost:3000

## How it works

1. `/` — landing page. Sign up / log in (Clerk).
2. `/dashboard` — your resumes. Create, edit, delete.
3. `/dashboard/new` — pick a role (Software Developer, Data Analyst, UI/UX,
   Marketing, HR).
4. `/resume/[id]/edit` — enter contact details and answer role-specific questions
   in plain words, then hit **Generate resume**.
5. `/resume/[id]/preview` — see the exact resume and **Download PDF**.

## Where things live

```
src/
  app/
    page.tsx                     Landing page
    dashboard/page.tsx           Resume list
    dashboard/new/page.tsx       Role selection
    resume/[id]/edit/page.tsx    Q&A intake + generate
    resume/[id]/preview/page.tsx Preview + download
    sign-in / sign-up            Clerk pages
    api/resumes/…                CRUD + generate + pdf routes
  lib/
    ai/generateResume.ts         ⭐ The ONLY AI call — swap providers here
    resumeHtml.ts                ATS-safe HTML template (preview + PDF share it)
    roles.ts                     Roles + Q&A questions (data-driven)
    types.ts                     ResumeContent shape
    prisma.ts                    DB client
  middleware.ts                  Clerk route protection
prisma/schema.prisma             DB schema
```

## Deploying to Vercel

- Add all `.env` values as Vercel environment variables.
- The PDF route auto-switches to `puppeteer-core` + `@sparticuz/chromium` in
  production (see `src/app/api/resumes/[id]/pdf/route.ts`).
- Use the **connection-pooling** Supabase URL as `DATABASE_URL`.

## Scaling notes (read before going big)

- **AI (OpenRouter free tier)** is rate-limited and can be inconsistent under
  load — fine for launch, but swap `src/lib/ai/generateResume.ts` to a paid model
  when volume grows (that's the only file that changes).
- **PDF (Puppeteer)** is heavy on serverless. If cold starts/timeouts bite, move
  PDF generation to a queue or a dedicated service.
- **Supabase free tier** (500 MB, pauses when idle) covers ~100k text-only
  resumes; upgrade when you have the users to justify it.

## Roadmap (not in this MVP)

Payments (Razorpay ₹99 one-time), ATS score, job-description matching, GitHub
project import, cover letters.
