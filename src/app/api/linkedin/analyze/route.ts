import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractDocumentText, FileExtractError } from "@/lib/extractText";
import {
  isLinkedInExport,
  analyzeLinkedInProfile,
  extractLinkedInHeader,
} from "@/lib/linkedin";
import { track } from "@/lib/track";

// pdf-parse needs the Node runtime.
export const runtime = "nodejs";
export const maxDuration = 30;

// POST /api/linkedin/analyze — upload the PDF exported from a LinkedIn profile
// (More → Save to PDF) and get a deterministic profile rating. Nothing is
// saved; the analysis is instant and AI-free so it never rate-limits.
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
    await track("linkedin_checked", userId, { score: result.score });
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
