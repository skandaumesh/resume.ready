import { NextRequest, NextResponse } from "next/server";
import { extractDocumentText, FileExtractError } from "@/lib/extractText";
import {
  isLinkedInExport,
  analyzeLinkedInProfile,
  extractLinkedInHeader,
} from "@/lib/linkedin";
import {
  consumeRateLimit,
  getClientIp,
  LIMITS,
  PUBLIC_LIMIT_MESSAGE,
} from "@/lib/rateLimit";
import { track } from "@/lib/track";

export const runtime = "nodejs";
export const maxDuration = 30;

// POST /api/public/linkedin — the no-login LinkedIn profile rating
// (acquisition funnel, like /api/public/ats). Deterministic and AI-free, so
// the IP limit is only there to stop scripted abuse.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await consumeRateLimit(`ip:${ip}:pli`, LIMITS.publicLinkedin);
  if (!rl.ok) {
    return NextResponse.json({ error: PUBLIC_LIMIT_MESSAGE }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Expected a file upload." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided. Please upload your LinkedIn profile PDF." },
      { status: 400 },
    );
  }

  try {
    const raw = await extractDocumentText(file);

    if (!isLinkedInExport(raw)) {
      return NextResponse.json(
        {
          error:
            "This doesn't look like a LinkedIn profile export. On LinkedIn, open your profile → More (⋯) → Save to PDF, then upload that file here.",
        },
        { status: 422 },
      );
    }

    const result = analyzeLinkedInProfile(raw);
    const profile = extractLinkedInHeader(raw);
    await track("public_linkedin_checked", null, { score: result.score });
    return NextResponse.json({ result, profile });
  } catch (err) {
    if (err instanceof FileExtractError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Could not analyze the profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
