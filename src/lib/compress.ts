import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
} from "pdf-lib";
import { PDFProcessingError } from "./errors";
import { toPdfBytes } from "./pdf-bytes";

const MAX_IMAGE_DIMENSION = 4000;

/**
 * Compresses a PDF by:
 * 1. Re-encoding photo (DCTDecode) images with a JPEG quality knob via sharp.
 * 2. Stripping metadata.
 * 3. Saving with object streams (smaller xref).
 *
 * If the result would be larger than the input, the original bytes are returned
 * unchanged (best-effort, never "compress" into a bigger file).
 */
export async function compressPdf(
  buffer: Buffer,
  instructions?: string | null
): Promise<{ buffer: Buffer; stats: { original: number; final: number; imagesReencoded: number } }> {
  const quality = parseQuality(instructions);

  const doc = await PDFDocument.load(toPdfBytes(buffer), {
    updateMetadata: false,
    ignoreEncryption: true,
  });

  let imagesReencoded = 0;

  const objects = doc.context.enumerateIndirectObjects();
  for (const [, obj] of objects) {
    if (!(obj instanceof PDFRawStream)) continue;

    const subtype = obj.dict.lookup(PDFName.of("Subtype"));
    if (subtype !== PDFName.of("Image")) continue;

    const width = obj.dict.lookup(PDFName.of("Width"), PDFNumber)?.asNumber() ?? 0;
    const height = obj.dict.lookup(PDFName.of("Height"), PDFNumber)?.asNumber() ?? 0;
    if (width === 0 || height === 0) continue;

    const filter = obj.dict.lookup(PDFName.of("Filter"));
    if (filter !== PDFName.of("DCTDecode")) continue;

    try {
      const reencoded = await reencodeJpeg(Buffer.from(obj.contents), quality);
      if (reencoded && reencoded.length < obj.contents.length) {
        // `contents` is exposed as readonly in the public types, but the
        // underlying array is mutable — replace it in place.
        (obj as unknown as { contents: Uint8Array }).contents = reencoded;
        obj.dict.set(
          PDFName.of("Length"),
          obj.dict.context.obj(reencoded.byteLength)
        );
        obj.dict.delete(PDFName.of("DecodeParms"));
        imagesReencoded++;
      }
    } catch {
      // Skip unreadable image data — keep compression best-effort.
    }
  }

  // Strip metadata (do not erase if none present).
  try {
    doc.setTitle("Compressed with PDF Tools Hub");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setCreator("PDF Tools Hub");
    doc.setProducer("");
  } catch {
    // Metadata optional
  }

  const finalBytes = Buffer.from(await doc.save({ useObjectStreams: true }));

  if (finalBytes.length >= buffer.length) {
    // Return original if compression didn't help.
    return { buffer, stats: { original: buffer.length, final: buffer.length, imagesReencoded } };
  }

  return { buffer: finalBytes, stats: { original: buffer.length, final: finalBytes.length, imagesReencoded } };
}

function parseQuality(instructions?: string | null): number {
  const match = instructions?.match(/(\d{1,3})\s*(?:%|quality)?/i);
  if (!match) return 72;
  const q = Number(match[1]);
  return Math.min(90, Math.max(30, q));
}

async function reencodeJpeg(input: Buffer, quality: number): Promise<Buffer | null> {
  // Lazy import keeps sharp out of the critical path for non-compress tools.
  const sharp = (await import("sharp")).default;

  const result = await sharp(input)
    .rotate()
    .jpeg({ quality, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  if (result?.info?.width && result.info.width > MAX_IMAGE_DIMENSION) {
    return null; // too big to safely re-encode
  }
  return result.data;
}