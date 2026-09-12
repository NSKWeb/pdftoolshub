import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import path from "path";
import { renderPdfToImages } from "./pdf-render";

type OcrWord = {
  text: string;
  bbox: { x: number; y: number; width: number; height: number };
};

type OcrPageResult = { page: number; text: string; words?: OcrWord[] };

const MAX_OCR_PAGES = 20;

/**
 * Runs Tesseract OCR lazily (loads only when OCR is used).
 * Returns plain text + word bounding boxes per page.
 */
export async function performOcr(
  pdfBuffer: Buffer,
  options?: { lang?: string; format?: "png" | "jpeg"; maxPages?: number }
): Promise<OcrPageResult[]> {
  const maxPages = options?.maxPages ?? MAX_OCR_PAGES;
  const lang = options?.lang ?? "eng";
  const format = options?.format ?? "png";

  const images = await renderPdfToImages(pdfBuffer, {
    scale: 2.5,
    format,
    maxPages
  });

  if (images.length === 0) {
    throw new Error("No pages rendered for OCR");
  }

  // Lazy import — tesseract.js is heavy (~2MB+), only load when needed
  const Tesseract = (await import("tesseract.js")).default;

  // Next.js server bundles remap `__dirname` into .next/, which breaks
  // tesseract.js's relative worker resolution. Point at the real file.
  // NOTE: never use require.resolve() here — in webpack server bundles it
  // returns a numeric module id, and `new Worker(moduleId)` throws.
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js"
  );
  const ocrOptions = {
    logger: () => {},
    workerPath,
  } as Record<string, unknown>;
  if (process.env.TESSERACT_DATA_DIR) {
    ocrOptions.langPath = process.env.TESSERACT_DATA_DIR;
  }

  const results: OcrPageResult[] = [];
  for (let i = 0; i < images.length; i++) {
    const pageImage = images[i];
    const mime = format === "png" ? "png" : "jpeg";
    const dataUrl = `data:image/${mime};base64,${pageImage.buffer.toString(
      "base64"
    )}`;

    const { data } = await Tesseract.recognize(dataUrl, lang, ocrOptions);

    const words: OcrWord[] = (data.words ?? []).map((w: any) => ({
      text: w.text,
      bbox: {
        x: w.bbox?.x0 ?? 0,
        y: w.bbox?.y0 ?? 0,
        width: (w.bbox?.x1 ?? w.bbox?.x0 ?? 0) - (w.bbox?.x0 ?? 0),
        height: (w.bbox?.y1 ?? w.bbox?.y0 ?? 0) - (w.bbox?.y0 ?? 0),
      },
    }));

    results.push({ page: i + 1, text: data.text, words });
  }

  return results;
}

/**
 * Builds a "searchable PDF" by overlaying invisible text on each page.
 * The recognized text is placed at its approximate position with 0 opacity,
 * so it becomes selectable/searchable without altering the visual appearance.
 */
export async function buildSearchablePdf(
  pdfBuffer: Buffer,
  ocrResults: OcrPageResult[]
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBuffer);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const pageResult of ocrResults) {
    const page = doc.getPage(pageResult.page - 1);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const pageWords =
      pageResult.words?.filter((w) => w.text.trim()) ?? [];

    for (const word of pageWords) {
      const fontSize = Math.max(8, Math.min(14, (word.bbox.height ?? 10) * 1.1));
      page.drawText(word.text, {
        x: word.bbox.x,
        y: pageHeight - word.bbox.y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        opacity: 0,
      });
    }
  }

  return Buffer.from(await doc.save());
}

/**
 * Converts full OCR results to a plain text blob.
 */
export function ocrResultsToText(results: OcrPageResult[]): string {
  return results
    .map((r) => `--- Page ${r.page} ---\n${r.text.trim()}`)
    .join("\n\n");
}