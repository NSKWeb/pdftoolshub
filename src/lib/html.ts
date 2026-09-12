import { PDFProcessingError } from "./errors";
import { extractPdfText } from "./pdf-render";

/**
 * Converts PDF text into a self-contained HTML file with one section per page.
 */
export async function pdfToHtml(pdfBuffer: Buffer): Promise<string> {
  const text = await extractPdfText(pdfBuffer, { maxPages: 200 });

  const rawPages = text.split("\n--- Page ").slice(1);
  const pages = rawPages.length
    ? rawPages.map((p) => p.replace(/\s*---$/, ""))
    : [text];

  if (!pages.some((p) => p.trim())) {
    throw new PDFProcessingError(
      "No text content found. The PDF may be scanned — try OCR first.",
      "NO_CONTENT"
    );
  }

  const pageMarkup = pages
    .map((page, idx) => {
      const paragraphs = page
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("\n      ");
      return `<section class="page">\n      ${paragraphs}\n      <footer>Page ${idx + 1}</footer>\n    </section>`;
    })
    .join("\n\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Converted from PDF</title>
<style>
  :root { --ink:#1a1a1a; --paper:#ffffff; --accent:#c6273c; --muted:#666; }
  * { box-sizing: border-box; }
  body { margin:0; font: 16px/1.7 Georgia, "Times New Roman", serif; color:var(--ink); background:#f4f2ee; }
  .header { max-width:860px; margin:0 auto; padding:24px 20px 8px; }
  .header h1 { font-size:1.5rem; margin:0 0 4px; letter-spacing:-0.02em; }
  .header p { margin:0; color:var(--muted); font-size:.9rem; }
  main { max-width:860px; margin:0 auto; padding:0 20px 40px; }
  .page { background:var(--paper); border:1px solid #e2ddd6; border-radius:4px; padding:28px 32px; margin:16px 0; box-shadow:0 1px 2px rgba(0,0,0,.05); }
  .page p { margin:0 0 .8em; }
  .page footer { margin-top:1.2em; padding-top:.6em; border-top:1px solid #e2ddd6; color:var(--muted); font-size:.8rem; text-align:center; }
</style>
</head>
<body>
<header class="header"><h1>PDF Content</h1><p>Converted with PDF Tools Hub</p></header>
<main>
    ${pageMarkup}
</main>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}