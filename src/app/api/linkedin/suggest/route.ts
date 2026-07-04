import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  extractDocumentText,
  truncateForModel,
  FileExtractError,
} from "@/lib/extractText";
import { isLinkedInExport } from "@/lib/linkedin";
import { coachLinkedInProfile } from "@/lib/ai/generateResume";
import { consumeRateLimit, LIMITS, AI_LIMIT_MESSAGE } from "@/lib/rateLimit";
import { track } from "@/lib/track";

export const runtime = "nodejs";
export const maxDuration = 90;

// POST /api/linkedin/suggest — the AI half of the LinkedIn review. The client
// calls /api/linkedin/analyze first for the instant deterministic score, then
// re-uploads the same PDF here for personalized, ready-to-paste rewrites.
// Kept as a separate route so the score never waits on (or fails with) a model.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const rl = await consumeRateLimit(`u:${userId}:ai`, LIMITS.userAi);
  if (!rl.ok) {
    return NextResponse.json({ error: AI_LIMIT_MESSAGE }, { status: 429 });
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
    await track("linkedin_coached", userId, {
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
