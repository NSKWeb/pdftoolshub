import { createCanvas } from "@napi-rs/canvas";
import path from "path";

// Loaded lazily so jest (CommonJS) never parses the ESM build.
let pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs") | null = null;

async function getPdfJs() {
  if (!pdfjs) {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjs;
}

let workerReady = false;

function ensureWorker(instance: typeof import("pdfjs-dist/legacy/build/pdf.mjs")) {
  if (workerReady) return;
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  );
  instance.GlobalWorkerOptions.workerSrc = workerPath;
  workerReady = true;
}

export interface RenderedPage {
  buffer: Buffer;
  width: number;
  height: number;
}

const MAX_PAGES = 50;
const MAX_SCALE = 3;

/**
 * Renders a PDF to bytes for each page using pdfjs-dist + @napi-rs/canvas.
 * No system binaries (Ghostscript/GraphicsMagick) required — works on VPS
 * and serverless runtimes.
 */
export async function renderPdfToImages(
  pdfBuffer: Buffer,
  options?: { format?: "png" | "jpeg"; scale?: number; maxPages?: number }
): Promise<RenderedPage[]> {
  const instance = await getPdfJs();
  ensureWorker(instance);

  const format = options?.format ?? "jpeg";
  const scale = Math.min(options?.scale ?? 2, MAX_SCALE);
  const maxPages = options?.maxPages ?? MAX_PAGES;

  const task = instance.getDocument({
    data: new Uint8Array(pdfBuffer),
    disableFontFace: true
  });

  const doc = await task.promise;

  try {
    if (doc.numPages > maxPages) {
      throw new Error(`PDF has too many pages for rendering (max ${maxPages})`);
    }

    const pages: RenderedPage[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const ctx = canvas.getContext("2d") as unknown as Parameters<
        typeof page.render
      >[0]["canvasContext"];

      if (!ctx) {
        throw new Error("Failed to acquire 2D canvas context for rendering");
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderParams = {
        canvasContext: ctx,
        viewport
      } as unknown as Parameters<typeof page.render>[0];

      await page.render(renderParams).promise;
      await page.cleanup();

      const buffer =
        format === "png"
          ? canvas.toBuffer("image/png")
          : canvas.toBuffer("image/jpeg", 85);

      pages.push({ buffer, width: viewport.width, height: viewport.height });
      canvas.width = 0;
      canvas.height = 0;
    }

    return pages;
  } finally {
    await doc.cleanup().catch(() => {});
  }
}

/**
 * Extracts text using pdfjs (better than pdf-parse for modern PDFs).
 */
export async function extractPdfText(
  pdfBuffer: Buffer,
  options?: { maxPages?: number }
): Promise<string> {
  const instance = await getPdfJs();
  ensureWorker(instance);

  const maxPages = options?.maxPages ?? 100;
  const task = instance.getDocument({
    data: new Uint8Array(pdfBuffer),
    disableFontFace: true
  });
  const doc = await task.promise;

  try {
    let result = "";
    const pagesToRead = Math.min(doc.numPages, maxPages);

    for (let i = 1; i <= pagesToRead; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const lineMap = new Map<number, string[]>();

      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = Math.round((item as { transform?: number[] }).transform?.[5] ?? 0);
        const arr = lineMap.get(y) ?? [];
        arr.push((item as { str: string }).str);
        lineMap.set(y, arr);
      }

      const lines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([, words]) => words.join(" "))
        .join("\n");

      result += `\n--- Page ${i} ---\n${lines}\n`;
      await page.cleanup();
    }

    return result.trim();
  } finally {
    await doc.cleanup().catch(() => {});
  }
}

export interface TextItemWithPosition {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extracts text items with bounding boxes (used by redact term mode).
 */
export async function getTextItemsWithPosition(
  pdfBuffer: Buffer,
  maxPages?: number
): Promise<TextItemWithPosition[][]> {
  const instance = await getPdfJs();
  ensureWorker(instance);

  const limit = maxPages ?? 100;
  const task = instance.getDocument({
    data: new Uint8Array(pdfBuffer),
    disableFontFace: true
  });
  const doc = await task.promise;

  try {
    const pages: TextItemWithPosition[][] = [];
    const pagesToRead = Math.min(doc.numPages, limit);

    for (let i = 1; i <= pagesToRead; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });

      const items: TextItemWithPosition[] = [];

      for (const item of content.items) {
        if (!("str" in item)) continue;
        const { str, transform, width } = item as {
          str: string;
          transform: number[];
          width: number;
        };

        // transform: [a,b,c,d,e,f] — e=x, f=y in PDF space (y up).
        const x = transform[4];
        const yPdf = transform[5];
        const y = viewport.height - yPdf;
        const h = Math.abs(transform[3]) || Math.abs(transform[5]) || 12;
        const w = width ?? 0;

        items.push({ str, x, y, width: w, height: h });
      }

      pages.push(items);
      await page.cleanup();
    }

    return pages;
  } finally {
    await doc.cleanup().catch(() => {});
  }
}