import { NextRequest, NextResponse } from "next/server";
import {
  extractDocumentText,
  truncateForModel,
  FileExtractError,
} from "@/lib/extractText";
import { isLinkedInExport } from "@/lib/linkedin";
import { coachLinkedInProfile } from "@/lib/ai/generateResume";
import {
  consumeRateLimit,
  getClientIp,
  LIMITS,
} from "@/lib/rateLimit";
import { track } from "@/lib/track";

export const runtime = "nodejs";
export const maxDuration = 90;

// POST /api/public/linkedin/coach — the AI half of the no-login LinkedIn
// review. Each call costs a real AI request, so the anonymous IP budget is
// small; signing up (free) gets the much higher per-user daily limit.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await consumeRateLimit(`ip:${ip}:plic`, LIMITS.publicLinkedinAi);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error:
          "You've used today's free AI rewrites from this network. Sign up (it's free) for a much higher daily limit.",
      },
      { status: 429 },
    );
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

    const advice = await coachLinkedInProfile(truncateForModel(raw));
    await track("public_linkedin_coached", null, {
      suggestions: advice.suggestions.length,
    });
    return NextResponse.json({ advice });
  } catch (err) {
    if (err instanceof FileExtractError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Could not review the profile.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
