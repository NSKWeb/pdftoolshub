import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import { PDFProcessingError } from "./errors";
import { toPdfBytes } from "./pdf-bytes";

/**
 * Adds lightweight PDF annotations (text notes / highlights) to pages.
 *
 * Instructions syntax:
 *   - `text:Note text` → add a sticky-note-style annotation to every page
 *   - `page:N` optional → only annotate page N
 *   - `highlight:yes` optional → draw a yellow highlight bar as well
 *
 * Falls back to drawing visible note text when annotation dict creation fails
 * (e.g. on exotic document structures).
 */
export async function annotatePdf(
  buffer: Buffer,
  instructions?: string | null
): Promise<Buffer> {
  const doc = await PDFDocument.load(toPdfBytes(buffer), { ignoreEncryption: true });
  const text = parseAnnotationText(instructions);
  const pageNumber = parsePageNumber(instructions);
  const highlight = instructions?.toLowerCase().includes("highlight") ?? false;

  const targets = pageNumber
    ? [doc.getPage(pageNumber - 1)]
    : doc.getPages();

  for (const page of targets) {
    const { width, height } = page.getSize();
    const annotPos = { x: Math.min(80, width * 0.1), y: height - 80 };

    if (highlight) {
      page.drawRectangle({
        x: annotPos.x - 4,
        y: annotPos.y - 14,
        width: Math.min(width * 0.4, 300),
        height: 22,
        color: { r: 1, g: 0.95, b: 0.3, a: 0.6 } as never,
      });
    }

    try {
      await addTextAnnotation(doc, page, annotPos, text);
    } catch {
      // Visually fallback: draw text directly on the page.
      page.drawText(`Note: ${text}`, {
        x: annotPos.x,
        y: annotPos.y,
        size: 11,
      });
    }
  }

  return Buffer.from(await doc.save());
}

function parseAnnotationText(instructions?: string | null): string {
  if (!instructions) return "Reviewed";
  const match = instructions.match(/(?:text|note)(?:[:=])\s*([^\n;]+)/i);
  return (match ? match[1] : instructions).trim().slice(0, 280);
}

function parsePageNumber(instructions?: string | null): number | null {
  const match = instructions?.match(/(?:page|p)(?:[:=])\s*(\d+)/i);
  if (!match) return null;
  return Math.max(1, parseInt(match[1], 10));
}

/**
 * Builds a /Annot dict and points page.Node.Annots at it.
 */
async function addTextAnnotation(
  doc: PDFDocument,
  page: { node: any },
  pos: { x: number; y: number },
  text: string
) {
  const context = doc.context;

  const annotDict = context.obj({
    Type: "Annot",
    Subtype: "Text",
    Rect: [pos.x, pos.y - 20, pos.x + 20, pos.y + 20],
    Contents: text,
    T: "PDF Tools Hub",
    F: 4, // print
  });

  const annotRef = context.register(annotDict);

  const existing = page.node.lookup(PDFName.of("Annots"));
  if (existing) {
    const array = existing.asArray ? existing.asArray() : [];
    array.push(annotRef);
    // If the existing entry is a dict/list we need a fresh ref.
    page.node.set(PDFName.of("Annots"), context.obj(array.length ? [...array] : [annotRef]));
  } else {
    page.node.set(PDFName.of("Annots"), context.obj([annotRef]));
  }
}