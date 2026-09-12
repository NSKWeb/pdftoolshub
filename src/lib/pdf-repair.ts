import { PDFDocument } from "pdf-lib";
import { PDFProcessingError } from "./errors";
import { toPdfBytes } from "./pdf-bytes";

export type RepairResult = {
  buffer: Buffer;
  report: {
    recovered: boolean;
    notes: string[];
    objectCount: number;
    pageCount: number;
  };
};

/**
 * Best-effort PDF repair.
 * 1. Try a normal load (rescues files with mild corruption).
 * 2. Try a loose parse (ignore invalid cross-reference entries).
 * 3. If parsing fails entirely, report that the file is beyond recovery.
 */
export async function repairPdf(buffer: Buffer): Promise<RepairResult> {
  const notes: string[] = [];

  // Strategy 1: normal load
  try {
    const doc = await PDFDocument.load(toPdfBytes(buffer), {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    const pageCount = doc.getPageCount();
    notes.push(`Parsed successfully — ${pageCount} page(s).`);
    const saved = Buffer.from(await doc.save({ useObjectStreams: true }));
    return {
      buffer: saved,
      report: {
        recovered: true,
        notes,
        objectCount: doc.context.enumerateIndirectObjects().length,
        pageCount,
      },
    };
  } catch (error) {
    notes.push(
      `Standard parse failed (${error instanceof Error ? error.message : "unknown error"}).`
    );
  }

  // Strategy 2: throwAwayMalformedObjects
  try {
    const doc = await PDFDocument.load(toPdfBytes(buffer), {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
    });
    const pageCount = doc.getPageCount();
    notes.push("Recovered using lenient parse (skipped malformed objects).");
    const saved = Buffer.from(await doc.save({ useObjectStreams: true }));
    return {
      buffer: saved,
      report: {
        recovered: true,
        notes,
        objectCount: doc.context.enumerateIndirectObjects().length,
        pageCount,
      },
    };
  } catch (error) {
    notes.push(
      `Lenient parse failed too (${error instanceof Error ? error.message : "unknown error"}).`
    );
  }

  // Strategy 3: skip encryption entirely
  try {
    const doc = await PDFDocument.load(toPdfBytes(buffer), {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
      capNumbers: true,
    });
    const pageCount = doc.getPageCount();
    notes.push("Recovered with encryption bypass + lenient parsing.");
    const saved = Buffer.from(await doc.save({ useObjectStreams: true }));
    return {
      buffer: saved,
      report: {
        recovered: true,
        notes,
        objectCount: doc.context.enumerateIndirectObjects().length,
        pageCount,
      },
    };
  } catch (error) {
    notes.push(
      `Final recovery attempt failed (${error instanceof Error ? error.message : "unknown error"}).`
    );
  }

  throw new PDFProcessingError(
    "This PDF is too corrupted to repair automatically. It may be encrypted or severely truncated.",
    "REPAIR_FAILED",
    { notes }
  );
}