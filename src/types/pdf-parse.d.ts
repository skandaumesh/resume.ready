// Type declarations for pdf-parse (no bundled types).
declare module "pdf-parse" {
  interface PdfData {
    /** Number of pages */
    numpages: number;
    /** Number of rendered pages */
    numrender: number;
    /** PDF info object */
    info: Record<string, unknown>;
    /** PDF metadata */
    metadata: unknown;
    /** PDF version */
    version: string;
    /** Extracted plain text */
    text: string;
  }

  interface PdfParseOptions {
    pagerender?: (pageData: unknown) => string;
    max?: number;
    version?: string;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: PdfParseOptions,
  ): Promise<PdfData>;

  export default pdfParse;
}
