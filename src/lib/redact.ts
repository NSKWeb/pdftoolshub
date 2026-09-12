import {
  PDFDocument,
  PDFName,
  PDFArray,
  PDFRawStream,
  rgb,
} from "pdf-lib";
import * as pako from "pako";
import { PDFProcessingError } from "./errors";
import { toPdfBytes } from "./pdf-bytes";

export type RedactArea = {
  page: number;
  x: number; // 0..1 fraction
  y: number; // 0..1 fraction (from top)
  width: number; // 0..1 fraction
  height: number; // 0..1 fraction
};

export type RedactOptions = {
  areas?: RedactArea[];
  terms?: string[];
  color?: [number, number, number];
};

const COLOR_BLACK: [number, number, number] = [0, 0, 0];

/**
 * Securely redacts a PDF:
 * 1. Covers the given areas (and any text matching `terms`) with solid rectangles.
 * 2. Blank-fills the underlying text in the page content stream so that
 *    copy/paste or text extraction cannot retrieve the redacted content.
 */
export async function redactPdf(
  buffer: Buffer,
  options: RedactOptions
): Promise<Buffer> {
  const { areas = [], terms = [], color = COLOR_BLACK } = options;

  if (areas.length === 0 && terms.length === 0) {
    throw new PDFProcessingError(
      "Please provide redaction areas (page:x,y,w,h) or text terms to redact.",
      "NO_REDACT_TERMS"
    );
  }

  const doc = await PDFDocument.load(toPdfBytes(buffer), { ignoreEncryption: true });
  const count = doc.getPageCount();

  const validAreas = areas.filter((a) => a.page >= 1 && a.page <= count);

  // Normalize terms for escaping.
  const escapedTerms = terms
    .map((t) => t.trim())
    .filter(Boolean)
    .map(escapeRegex);

  // Build per-page match regions from text extraction (term mode).
  const termRegions = await findTermRegions(buffer, escapedTerms, count);

  const [r, g, b] = color;

  doc.getPages().forEach((page, index) => {
    const pageNumber = index + 1;
    const { width, height } = page.getSize();

    const regions: Array<{ x: number; y: number; w: number; h: number }> = [];

    for (const area of validAreas) {
      if (area.page !== pageNumber) continue;
      regions.push({
        x: area.x * width,
        y: height - area.y * height - area.height * height,
        w: area.width * width,
        h: area.height * height,
      });
    }

    for (const reg of termRegions) {
      if (reg.page !== pageNumber) continue;
      regions.push({
        x: reg.x,
        y: height - reg.y - reg.h,
        w: reg.w,
        h: reg.h,
      });
    }

    for (const region of regions) {
      page.drawRectangle({
        x: region.x,
        y: region.y,
        width: Math.max(region.w, 1),
        height: Math.max(region.h, 1),
        color: rgb(r, g, b),
      });
    }
  });

  // Remove matching text from content streams as a second layer of safety.
  await blankMatchingText(doc, escapedTerms);

  return Buffer.from(await doc.save());
}

/**
 * Finds bounding boxes of redaction terms using pdfjs text item positions.
 */
async function findTermRegions(
  buffer: Buffer,
  terms: string[],
  pageCount: number
): Promise<Array<{ page: number; x: number; y: number; w: number; h: number }>> {
  if (terms.length === 0) return [];

  const { getTextItemsWithPosition } = await import("./pdf-render");
  const itemsByPage = await getTextItemsWithPosition(buffer, pageCount);

  const regions: Array<{ page: number; x: number; y: number; w: number; h: number }> = [];

  // Use word-sequence matching (approximate; pdfjs gives item positions).
  itemsByPage.forEach((items, idx) => {
    const page = idx + 1;
    const bigLine = items.map((it) => it.str).join(" ");

    for (const term of terms) {
      const pattern = new RegExp(`(${term})`, "gi");
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(bigLine)) !== null) {
        const startIdx = match.index;
        const endIdx = startIdx + match[0].length;
        const charStart = bigLine.slice(0, startIdx).split(" ").length - 1;
        const charEnd = bigLine.slice(0, endIdx).split(" ").length - 1;

        const involved = items.slice(Math.max(0, charStart), charEnd + 1);
        if (involved.length === 0) continue;

        const x = Math.min(...involved.map((i) => i.x));
        const y = Math.min(...involved.map((i) => i.y));
        const xMax = Math.max(...involved.map((i) => i.x + i.width));
        const yMax = Math.max(...involved.map((i) => i.y + i.height));

        regions.push({
          page,
          x,
          y,
          w: xMax - x,
          h: yMax - y,
        });

        // Avoid infinite loops on overlapping matches.
        if (match[0].length === 0) break;
      }
    }
  });

  return regions;
}

/**
 * Rewrites page content streams, replacing the literal string form of the
 * terms with white space. Works on hex-encoded strings too.
 */
async function blankMatchingText(doc: PDFDocument, terms: string[]) {
  if (terms.length === 0) return;

  const escapedJoin = terms.join("|");

  for (let i = 0; i < doc.getPageCount(); i++) {
    const pageNode = doc.getPage(i).node;
    const contentsContainer = pageNode.lookup(PDFName.of("Contents"));

    if (!contentsContainer) continue;

    // A page's Contents can be a single stream or an array of streams.
    const streams: PDFRawStream[] = [];
    if (contentsContainer instanceof PDFRawStream) {
      const resolved = doc.context.lookup(contentsContainer);
      if (resolved instanceof PDFRawStream) streams.push(resolved);
    } else if (contentsContainer instanceof PDFArray) {
      for (const ref of contentsContainer.asArray()) {
        const resolved = doc.context.lookup(ref);
        if (resolved instanceof PDFRawStream) streams.push(resolved);
      }
    }

    for (const stream of streams) {
      const decoded = decodeStream(stream, doc);
      if (!decoded) continue;
      const rewritten = blankTextInStream(decoded, escapedJoin);
      if (rewritten === decoded) continue;

      // Re-encode and slot back in.
      const encoded = pako.deflate(Buffer.from(rewritten, "utf8"));
      (stream as unknown as { contents: Uint8Array }).contents = encoded;
      const lengthObj = stream.dict.context.obj(encoded.byteLength);
      stream.dict.set(PDFName.of("Length"), lengthObj);
      if (!stream.dict.get(PDFName.of("Filter"))) {
        stream.dict.set(PDFName.of("Filter"), PDFName.of("FlateDecode"));
      }
    }
  }
}

function decodeStream(stream: PDFRawStream, doc: PDFDocument): string | null {
  const filter = stream.dict.lookup(PDFName.of("Filter"));
  const nameFilter = filter instanceof PDFName ? filter : null;

  if (!nameFilter || nameFilter === PDFName.of("FlateDecode")) {
    try {
      const data =
        nameFilter === PDFName.of("FlateDecode")
          ? pako.inflate(stream.contents)
          : stream.contents;
      return Buffer.from(data).toString("utf8");
    } catch {
      return null;
    }
  }
  return null;
}

function blankTextInStream(content: string, terms: string): string {
  // Match hex strings <...> and literal (...) that contain any term.
  const termRegex = new RegExp(`(${terms})`, "gi");

  let changed = false;
  let result = content.replace(
    /<([0-9A-Fa-f\s]+)>/g,
    (hexBlock, hexContent) => {
      const hexCleaned = hexContent.replace(/\s/g, "");
      let decoded = "";
      for (let i = 0; i + 1 < hexCleaned.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hexCleaned.slice(i, i + 2), 16));
      }
      if (!termRegex.test(decoded)) return hexBlock;
      termRegex.lastIndex = 0;
      const blanked = decoded.replace(termRegex, (term) => " ".repeat(term.length));
      changed = true;
      let hex = "";
      for (let i = 0; i < blanked.length; i++) {
        hex += blanked.charCodeAt(i).toString(16).padStart(2, "0");
      }
      return `<${hex}>`;
    }
  );

  result = result.replace(
    /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g,
    (literalBlock: string, litContent: string) => {
      const re = new RegExp(`(${terms})`, "gi");
      if (!re.test(litContent)) return literalBlock;
      re.lastIndex = 0;
      const blanked = litContent.replace(re, (term: string) => " ".repeat(term.length));
      changed = true;
      return `(${blanked})`;
    }
  );

  return changed ? result : content;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}