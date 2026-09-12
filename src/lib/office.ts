import { PDFProcessingError } from "./errors";
import { extractPdfText } from "./pdf-render";

/**
 * Converts a PDF into a DOCX with structured content:
 * - Detects likely headings (short lines, no trailing period)
 * - Groups the rest into paragraphs
 * 4MB cap on input; lazy-imports the `docx` package (heavy).
 */
export async function pdfToDocx(pdfBuffer: Buffer): Promise<Buffer> {
  if (pdfBuffer.length > 4 * 1024 * 1024) {
    throw new PDFProcessingError(
      "PDF is too large for DOCX conversion (max 4MB).",
      "FILE_TOO_LARGE"
    );
  }

  const text = await extractPdfText(pdfBuffer);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const cleaned = stripPageMarkers(lines);

  if (cleaned.length === 0) {
    throw new PDFProcessingError(
      "No text content found. The PDF may be scanned — try OCR first.",
      "NO_CONTENT"
    );
  }

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } =
    await import("docx");

  const children: any[] = [];

  for (const line of cleaned) {
    const isHeading = isLikelyHeading(line);
    if (isHeading) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: line, bold: true })],
        })
      );
    } else {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          children: [new TextRun({ text: line })],
        })
      );
    }
  }

  const doc = new Document({
    creator: "PDF Tools Hub",
    title: "Converted from PDF",
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

/**
 * Removes page markers (e.g. "--- Page 1 ---") used by the text extractor.
 */
function stripPageMarkers(lines: string[]): string[] {
  return lines.filter((l) => !/^--- Page \d+ ---$/.test(l));
}

function isLikelyHeading(line: string): boolean {
  // Short line (< 64 chars) without sentence-ending punctuation is likely a heading.
  if (line.length > 64) return false;
  if (/[.!?:;]$/.test(line)) return false;
  // Contains at least one word and isn't a list bullet.
  return /\b\w+\b/.test(line) && !/^[-•*]/.test(line);
}