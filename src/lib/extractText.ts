// ─────────────────────────────────────────────────────────────────────────
// Extract raw text from an uploaded PDF / Word document. Shared by the resume
// import flow and the ATS / JD tools so the parsing rules live in one place.
// Uses pdf-parse and mammoth, which need the full Node.js runtime (not edge) —
// every route that calls this must set `export const runtime = "nodejs"`.
// ─────────────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Thrown for any user-fixable problem (wrong type, too big, unreadable). Routes
// catch this and return a 400 with the message; anything else is a real 500.
export class FileExtractError extends Error {}

function detectKind(file: File): "pdf" | "docx" | "doc" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (name.endsWith(".doc") || file.type === "application/msword") return "doc";
  return null;
}

/**
 * Read a File (PDF or Word) and return its raw text. Throws FileExtractError
 * with a friendly message for any user-fixable problem.
 */
export async function extractDocumentText(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new FileExtractError("File is too large. Maximum size is 5 MB.");
  }

  const kind = detectKind(file);
  if (!kind) {
    throw new FileExtractError(
      "Unsupported file type. Please upload a .pdf or .docx file.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rawText = "";

  try {
    if (kind === "pdf") {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const pdfData = await pdfParse(buffer);
      rawText = pdfData.text;
    } else {
      // mammoth handles .docx (and best-effort .doc).
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    }
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Could not read the uploaded file.";
    throw new FileExtractError(
      `Failed to extract text from your document: ${msg}`,
    );
  }

  if (!rawText || rawText.trim().length < 20) {
    throw new FileExtractError(
      "Could not extract enough text from this document. It may be image-based or empty. Try a different file.",
    );
  }

  return rawText;
}

// Free models have token limits — keep the first ~8000 chars, which comfortably
// covers a normal resume or job description.
export function truncateForModel(text: string, max = 8000): string {
  return text.length > max ? text.slice(0, max) : text;
}
