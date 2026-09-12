import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import type { PDFFont, PDFImage } from "pdf-lib";
import JSZip from "jszip";
import * as pako from "pako";
import { PDFProcessingError } from "./errors";
import { toPdfBytes } from "./pdf-bytes";
import {
  renderPdfToImages,
  extractPdfText,
} from "./pdf-render";
import { compressPdf } from "./compress";
import { redactPdf, type RedactArea } from "./redact";
import { repairPdf } from "./pdf-repair";
import { annotatePdf } from "./annotate";
import { pdfToDocx } from "./office";
import { pdfToHtml } from "./html";
import { performOcr, buildSearchablePdf, ocrResultsToText } from "./ocr";

export type ProcessedResult = {
  buffer: Buffer;
  contentType: string;
  filename: string;
};

export { PDFProcessingError };

export const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
  tabloid: [792, 1224],
  executive: [522, 756]
};

const NUP_LAYOUTS: Record<number, { cols: number; rows: number }> = {
  2: { cols: 2, rows: 1 },
  4: { cols: 2, rows: 2 },
  6: { cols: 3, rows: 2 },
  9: { cols: 3, rows: 3 }
};

async function readFile(file: File): Promise<Buffer> {
  if (typeof file.arrayBuffer === "function") {
    return Buffer.from(await file.arrayBuffer());
  }
  // jsdom File lacks arrayBuffer/Response — use FileReader as a polyfill
  // fallback so the processing core stays testable.
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
  return Buffer.from(buffer);
}

function isPdfBytes(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}

function loadDoc(buffer: Buffer) {
  if (!isPdfBytes(buffer)) {
    throw new PDFProcessingError(
      "The uploaded file is not a valid PDF (missing %PDF header).",
      "INVALID_PDF"
    );
  }
  return PDFDocument.load(toPdfBytes(buffer), { ignoreEncryption: true });
}

async function loadDocs(files: Buffer[]): Promise<PDFDocument[]> {
  const docs: PDFDocument[] = [];
  for (const buf of files) {
    docs.push(await loadDoc(buf));
  }
  if (docs.length === 0) {
    throw new PDFProcessingError("No PDF files uploaded", "NO_FILES");
  }
  return docs;
}

function checkPageLimit(doc: PDFDocument, max = 1000) {
  if (doc.getPageCount() > max) {
    throw new PDFProcessingError(
      `PDF has too many pages (max ${max}).`,
      "PAGE_LIMIT_EXCEEDED"
    );
  }
}

export async function processPdfTool({
  tool,
  files,
  instructions
}: {
  tool: string;
  files: File[];
  instructions?: string | null;
}): Promise<ProcessedResult> {
  const primaryFile = files[0];
  if (!primaryFile) {
    throw new PDFProcessingError("No files uploaded", "NO_FILES");
  }

  const fileBuffers = await Promise.all(files.map(readFile));
  const first = fileBuffers[0];

  switch (tool) {
    case "merge": {
      if (fileBuffers.length < 2) {
        throw new PDFProcessingError(
          "Upload at least two PDFs to merge.",
          "NEED_TWO_FILES"
        );
      }
      const docs = await loadDocs(fileBuffers);
      const merged = await PDFDocument.create();
      for (const doc of docs) {
        checkPageLimit(doc, 500);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      return {
        buffer: Buffer.from(await merged.save({ useObjectStreams: true })),
        contentType: "application/pdf",
        filename: "merged.pdf"
      };
    }

    case "split": {
      const doc = await loadDoc(first);
      const count = doc.getPageCount();
      if (count === 1) {
        throw new PDFProcessingError(
          "Cannot split a single-page PDF.",
          "NOT_SPLITTABLE"
        );
      }
      const range = parsePageRange(count, instructions);
      const extracted = await PDFDocument.create();
      const pages = await extracted.copyPages(doc, range);
      pages.forEach((page) => extracted.addPage(page));
      return {
        buffer: Buffer.from(await extracted.save({ useObjectStreams: true })),
        contentType: "application/pdf",
        filename: "split-part.pdf"
      };
    }

    case "compress": {
      const { buffer: compressed } = await compressPdf(first, instructions);
      return {
        buffer: compressed,
        contentType: "application/pdf",
        filename: "compressed.pdf"
      };
    }

    case "rotate": {
      const doc = await loadDoc(first);
      const angle = parseRotateAngle(instructions);
      doc.getPages().forEach((page) => {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
      });
      return {
        buffer: Buffer.from(await doc.save()),
        contentType: "application/pdf",
        filename: "rotated.pdf"
      };
    }

    case "pdf-to-office": {
      const docxBuffer = await pdfToDocx(first);
      return {
        buffer: docxBuffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "converted.docx"
      };
    }

    case "pdf-to-images": {
      const format = instructions?.toLowerCase().includes("png") ? "png" : "jpeg";
      const pages = await renderPdfToImages(first, {
        format,
        scale: parseScale(instructions),
        maxPages: 50
      });
      const zip = new JSZip();
      pages.forEach((page, idx) => {
        zip.file(
          `page-${idx + 1}.${format === "png" ? "png" : "jpg"}`,
          page.buffer
        );
      });
      return {
        buffer: Buffer.from(await zip.generateAsync({ type: "nodebuffer" })),
        contentType: "application/zip",
        filename: "pdf-pages.zip"
      };
    }

    case "images-to-pdf": {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        throw new PDFProcessingError(
          "Images to PDF requires at least one PNG or JPG image.",
          "INVALID_FILE_TYPE"
        );
      }
      const pdf = await PDFDocument.create();
      for (let i = 0; i < imageFiles.length; i++) {
        const buf = fileBuffers[i];
        const image =
          imageFiles[i].type === "image/png"
            ? await pdf.embedPng(buf)
            : await pdf.embedJpg(buf);
        const { width, height } = image.scale(1);
        const limit = Math.min(2000 / width, 2000 / height, 1);
        const page = pdf.addPage([width * limit, height * limit]);
        page.drawImage(image, { x: 0, y: 0, width: width * limit, height: height * limit });
      }
      return {
        buffer: Buffer.from(await pdf.save({ useObjectStreams: true })),
        contentType: "application/pdf",
        filename: "images.pdf"
      };
    }

    case "pdf-to-text": {
      const text = await extractPdfText(first, { maxPages: 500 });
      if (!text.trim()) {
        return {
          buffer: Buffer.from(
            "No text content found in the PDF. It may be a scanned document — try OCR.",
            "utf-8"
          ),
          contentType: "text/plain",
          filename: "extracted-text.txt"
        };
      }
      return {
        buffer: Buffer.from(text, "utf-8"),
        contentType: "text/plain",
        filename: "extracted-text.txt"
      };
    }

    case "watermark-text": {
      const doc = await loadDoc(first);
      const text = parseInstructionValue(instructions) ?? "CONFIDENTIAL";
      await applyTextWatermark(doc, text);
      return {
        buffer: Buffer.from(await doc.save()),
        contentType: "application/pdf",
        filename: "watermarked.pdf"
      };
    }

    case "watermark-image": {
      const doc = await loadDoc(first);
      const imageFile = files[1];
      if (!imageFile) {
        throw new PDFProcessingError(
          "Upload a second image file to use as a watermark.",
          "MISSING_WATERMARK_IMAGE"
        );
      }
      if (!imageFile.type.startsWith("image/")) {
        throw new PDFProcessingError(
          "Watermark image must be PNG or JPG.",
          "INVALID_WATERMARK_TYPE"
        );
      }
      const image =
        imageFile.type === "image/png"
          ? await doc.embedPng(fileBuffers[1])
          : await doc.embedJpg(fileBuffers[1]);
      applyImageWatermark(doc, image);
      return {
        buffer: Buffer.from(await doc.save()),
        contentType: "application/pdf",
        filename: "image-watermarked.pdf"
      };
    }

    case "annotate": {
      return {
        buffer: await annotatePdf(first, instructions),
        contentType: "application/pdf",
        filename: "annotated.pdf"
      };
    }

    case "extract-pages": {
      const doc = await loadDoc(first);
      const indices = parsePageRange(doc.getPageCount(), instructions);
      const extracted = await PDFDocument.create();
      const pages = await extracted.copyPages(doc, indices);
      pages.forEach((page) => extracted.addPage(page));
      return {
        buffer: Buffer.from(await extracted.save({ useObjectStreams: true })),
        contentType: "application/pdf",
        filename: "extracted-pages.pdf"
      };
    }

    case "extract-images": {
      return {
        buffer: await extractImagesFromPdf(first),
        contentType: "application/zip",
        filename: "extracted-images.zip"
      };
    }

    case "metadata": {
      const doc = await loadDoc(first);
      const metadata = parseMetadata(instructions);
      if (!metadata.title && !metadata.author && !metadata.subject) {
        throw new PDFProcessingError(
          "Provide metadata to set, e.g. title:My Title, author:Jane Doe",
          "NO_METADATA"
        );
      }
      if (metadata.title) doc.setTitle(metadata.title);
      if (metadata.author) doc.setAuthor(metadata.author);
      if (metadata.subject) doc.setSubject(metadata.subject);
      doc.setCreator("PDF Tools Hub");
      return {
        buffer: Buffer.from(await doc.save()),
        contentType: "application/pdf",
        filename: "metadata-updated.pdf"
      };
    }

    case "reorder": {
      const doc = await loadDoc(first);
      const indices = parsePageIndices(doc.getPageCount(), instructions);
      if (indices.length === 0) {
        throw new PDFProcessingError(
          "Provide at least one valid page number to reorder.",
          "INVALID_PAGE_SELECTION"
        );
      }
      const reordered = await PDFDocument.create();
      const pages = await reordered.copyPages(doc, indices);
      pages.forEach((page) => reordered.addPage(page));
      return {
        buffer: Buffer.from(await reordered.save({ useObjectStreams: true })),
        contentType: "application/pdf",
        filename: "reordered.pdf"
      };
    }

    case "delete-pages": {
      const doc = await loadDoc(first);
      const toDelete = new Set(parsePageRange(doc.getPageCount(), instructions));
      if (toDelete.size === 0) {
        throw new PDFProcessingError(
          "Provide the pages to delete, e.g. 2-4",
          "INVALID_PAGE_SELECTION"
        );
      }
      const remaining = [];
      for (let i = 0; i < doc.getPageCount(); i++) {
        if (!toDelete.has(i)) remaining.push(i);
      }
      if (remaining.length === 0) {
        throw new PDFProcessingError("Cannot delete all pages.", "INVALID_OPERATION");
      }
      const updated = await PDFDocument.create();
      const pages = await updated.copyPages(doc, remaining);
      pages.forEach((page) => updated.addPage(page));
      return {
        buffer: Buffer.from(await updated.save({ useObjectStreams: true })),
        contentType: "application/pdf",
        filename: "pages-deleted.pdf"
      };
    }

    case "page-numbers": {
      const doc = await loadDoc(first);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      addPageNumbers(doc, instructions, font);
      return {
        buffer: Buffer.from(await doc.save()),
        contentType: "application/pdf",
        filename: "with-page-numbers.pdf"
      };
    }

    case "ocr": {
      const wantsText = instructions?.toLowerCase().includes("text");
      const results = await performOcr(first, { maxPages: 20 });
      if (wantsText) {
        return {
          buffer: Buffer.from(ocrResultsToText(results), "utf-8"),
          contentType: "text/plain",
          filename: "ocr-result.txt"
        };
      }
      const searchable = await buildSearchablePdf(first, results);
      return {
        buffer: searchable,
        contentType: "application/pdf",
        filename: "ocr-searchable.pdf"
      };
    }

    case "compare": {
      if (fileBuffers.length < 2) {
        throw new PDFProcessingError(
          "Upload two PDFs to compare.",
          "MISSING_SECOND_FILE"
        );
      }
      const diffReport = await comparePdfs(fileBuffers[0], fileBuffers[1]);
      return {
        buffer: Buffer.from(diffReport, "utf-8"),
        contentType: "text/plain",
        filename: "comparison-report.txt"
      };
    }

    case "redact": {
      const { areas, terms } = parseRedactInstructions(instructions);
      const pdfBuffer = await redactPdf(first, { areas, terms });
      return {
        buffer: pdfBuffer,
        contentType: "application/pdf",
        filename: "redacted.pdf"
      };
    }

    case "flatten": {
      const doc = await loadDoc(first);
      doc.getPages().forEach((page) => {
        page.node.delete(PDFName.of("Annots"));
      });
      return {
        buffer: Buffer.from(await doc.save()),
        contentType: "application/pdf",
        filename: "flattened.pdf"
      };
    }

    case "n-up": {
      const doc = await loadDoc(first);
      const nValue = parseNUpValue(instructions);
      const nUpDoc = await createNUpPdf(doc, nValue);
      return {
        buffer: Buffer.from(await nUpDoc.save()),
        contentType: "application/pdf",
        filename: `${nValue}-up.pdf`
      };
    }

    case "resize": {
      const doc = await loadDoc(first);
      const sizeName = parseResizeSize(instructions);
      const newSize = PAGE_SIZES[sizeName] ?? PAGE_SIZES.a4;
      await resizePdfPages(doc, newSize);
      return {
        buffer: Buffer.from(await doc.save()),
        contentType: "application/pdf",
        filename: `resized-${sizeName}.pdf`
      };
    }

    case "booklet": {
      const doc = await loadDoc(first);
      const bookletDoc = await createBooklet(doc);
      return {
        buffer: Buffer.from(await bookletDoc.save()),
        contentType: "application/pdf",
        filename: "booklet.pdf"
      };
    }

    case "repair": {
      const { buffer } = await repairPdf(first);
      return {
        buffer,
        contentType: "application/pdf",
        filename: "repaired.pdf"
      };
    }

    case "pdf-to-html": {
      const html = await pdfToHtml(first);
      return {
        buffer: Buffer.from(html, "utf-8"),
        contentType: "text/html",
        filename: "output.html"
      };
    }

    default: {
      throw new PDFProcessingError(`Unknown tool: ${tool}`, "UNKNOWN_TOOL");
    }
  }
}

/* ------------------------------------------------------------------ */
/* Image extraction                                                    */
/* ------------------------------------------------------------------ */

async function extractImagesFromPdf(buffer: Buffer): Promise<Buffer> {
  const doc = await loadDoc(buffer);
  const zip = new JSZip();
  let imageCount = 0;

  const objects = doc.context.enumerateIndirectObjects();

  for (const [, obj] of objects) {
    if (!(obj instanceof PDFRawStream)) continue;
    if (obj.dict.lookup(PDFName.of("Subtype")) !== PDFName.of("Image")) continue;

    const width = obj.dict.lookup(PDFName.of("Width"), PDFNumber)?.asNumber() ?? 0;
    const height = obj.dict.lookup(PDFName.of("Height"), PDFNumber)?.asNumber() ?? 0;
    if (width <= 0 || height <= 0) continue;

    const filter = obj.dict.lookup(PDFName.of("Filter"));
    const raw = Buffer.from(obj.contents);

    try {
      if (filter === PDFName.of("DCTDecode")) {
        zip.file(`image-${++imageCount}.jpg`, raw);
      } else if (filter === PDFName.of("FlateDecode")) {
        const wrapped = await tryWrapFlateImage(raw, width, height);
        zip.file(`image-${++imageCount}.${wrapped ? "png" : "bin"}`, wrapped ?? raw);
      } else if (filter === PDFName.of("JPXDecode")) {
        const converted = await tryJpxConvert(raw);
        zip.file(`image-${++imageCount}.${converted ? "png" : "j2k"}`, converted ?? raw);
      }
    } catch {
      // skip unreadable image stream
    }
  }

  if (imageCount === 0) {
    zip.file("info.txt", "No embedded images found in this PDF.");
  }

  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

async function tryWrapFlateImage(
  raw: Buffer,
  width: number,
  height: number
): Promise<Buffer | null> {
  try {
    // FlateDecode image data is typically raw RGB pixels (or indexed).
    const { createCanvas } = await import("@napi-rs/canvas");
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const inflated = pako.inflate(raw);

    // Expect RGB (3 bytes/pixel). Grayscale/CMYK/indexed unlikely to round-trip cleanly.
    const channels = Math.floor(inflated.length / (width * height));
    if (channels !== 1 && channels !== 3 && channels !== 4) return null;

    const img = ctx.createImageData(width, height);
    if (channels === 4) {
      Buffer.from(inflated).copy(Buffer.from(img.data.buffer));
    } else if (channels === 3) {
      for (let i = 0, j = 0; i < inflated.length; i += 3, j += 4) {
        img.data[j] = inflated[i];
        img.data[j + 1] = inflated[i + 1];
        img.data[j + 2] = inflated[i + 2];
        img.data[j + 3] = 255;
      }
    } else {
      for (let i = 0, j = 0; i < inflated.length; i += 1, j += 4) {
        img.data[j] = inflated[i];
        img.data[j + 1] = inflated[i];
        img.data[j + 2] = inflated[i];
        img.data[j + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return Buffer.from(canvas.toBuffer("image/png"));
  } catch {
    return null;
  }
}

async function tryJpxConvert(raw: Buffer): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(raw, { failOn: "none" }).png().toBuffer();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Page manipulation                                                  */
/* ------------------------------------------------------------------ */

function addPageNumbers(
  doc: PDFDocument,
  instructions: string | null | undefined,
  font: PDFFont
) {
  const totalPages = doc.getPageCount();
  const position = instructions?.toLowerCase().includes("bottom") ? "bottom" : "top";
  const format = instructions?.toLowerCase().includes("roman") ? "roman" : "arabic";

  doc.getPages().forEach((page, index) => {
    const { width, height } = page.getSize();
    const pageNum = format === "roman" ? toRoman(index + 1) : String(index + 1);
    const text = `${pageNum} / ${format === "roman" ? toRoman(totalPages) : totalPages}`;
    const textWidth = font.widthOfTextAtSize(text, 10);
    const y = position === "bottom" ? 20 : height - 30;
    page.drawText(text, {
      x: width - textWidth - 20,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
  });
}

function toRoman(num: number): string {
  const table: Array<[string, number]> = [
    ["M", 1000], ["CM", 900], ["D", 500], ["CD", 400],
    ["C", 100], ["XC", 90], ["L", 50], ["XL", 40],
    ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]
  ];
  let result = "";
  for (const [letter, value] of table) {
    while (num >= value) {
      result += letter;
      num -= value;
    }
  }
  return result || "i";
}

async function comparePdfs(a: Buffer, b: Buffer): Promise<string> {
  const [text1, text2] = await Promise.all([
    extractPdfText(a, { maxPages: 500 }),
    extractPdfText(b, { maxPages: 500 })
  ]);
  const lines1 = stripPageMarkers(text1);
  const lines2 = stripPageMarkers(text2);

  const report: string[] = [];
  report.push("PDF Comparison Report", "======================", "");
  report.push(`PDF 1: ${lines1.length} lines of text`);
  report.push(`PDF 2: ${lines2.length} lines of text`);
  report.push("");

  const maxLen = Math.max(lines1.length, lines2.length);
  let differences = 0;
  const shown: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const l1 = lines1[i] ?? "";
    const l2 = lines2[i] ?? "";
    if (l1 !== l2) {
      differences++;
      if (shown.length < 10) {
        shown.push(
          `Line ${i + 1}:\n  PDF 1: ${(l1 || "(empty)").slice(0, 90)}\n  PDF 2: ${(l2 || "(empty)").slice(0, 90)}`
        );
      }
    }
  }

  report.push(
    differences === 0 && lines1.length === lines2.length
      ? "Result: PDFs are identical"
      : `Result: Found ${differences} difference(s)`
  );

  if (shown.length) {
    report.push("", "First 10 differences:");
    report.push(...shown);
  }

  return report.join("\n");
}

function stripPageMarkers(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => !/^--- Page \d+ ---$/.test(l));
}

/* ------------------------------------------------------------------ */
/* Layout tools                                                        */
/* ------------------------------------------------------------------ */

async function createNUpPdf(doc: PDFDocument, n: number): Promise<PDFDocument> {
  const layout = NUP_LAYOUTS[n] ?? NUP_LAYOUTS[2];
  const { cols, rows } = layout;
  const nUpDoc = await PDFDocument.create();
  const pageIndices = doc.getPageIndices();

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const cellWidth = (pageWidth - margin * 2) / cols;
  const cellHeight = (pageHeight - margin * 2) / rows;

  for (let start = 0; start < pageIndices.length; start += n) {
    const group = pageIndices.slice(start, start + n);
    const nUpPage = nUpDoc.addPage([pageWidth, pageHeight]);
    const srcPages = group.map((i) => doc.getPage(i));
    const embedded = await nUpDoc.embedPages(srcPages);

    for (let i = 0; i < group.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sourcePage = embedded[i];
      if (!sourcePage) continue;

      const { width, height } = sourcePage;
      const scale = Math.min(cellWidth / width, cellHeight / height) * 0.92;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      const x = margin + col * cellWidth + (cellWidth - scaledWidth) / 2;
      const y =
        pageHeight - margin - (row + 1) * cellHeight + (cellHeight - scaledHeight) / 2;

      nUpPage.drawPage(sourcePage, { x, y, width: scaledWidth, height: scaledHeight });
    }
  }
  return nUpDoc;
}

function parseNUpValue(instructions?: string | null): number {
  const match = instructions?.match(/(\d)/);
  const value = match ? Number(match[1]) : 2;
  return [2, 4, 6, 9].includes(value) ? value : 2;
}

async function resizePdfPages(doc: PDFDocument, newSize: [number, number]) {
  const [targetWidth, targetHeight] = newSize;
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const scale = Math.min(targetWidth / width, targetHeight / height);
    const contentWidth = width * scale;
    const contentHeight = height * scale;
    const x = (targetWidth - contentWidth) / 2;
    const y = (targetHeight - contentHeight) / 2;

    const current = page.getSize();
    page.translateContent(
      x - page.getX(),
      y + (current.height - page.getSize().height) / 2
    );
    page.setWidth(targetWidth);
    page.setHeight(targetHeight);
  }
}

function parseResizeSize(instructions?: string | null): string {
  const normalized = instructions?.toLowerCase() ?? "";
  if (normalized.includes("letter")) return "letter";
  if (normalized.includes("legal")) return "legal";
  if (normalized.includes("tabloid")) return "tabloid";
  if (normalized.includes("executive")) return "executive";
  return "a4";
}

async function createBooklet(doc: PDFDocument): Promise<PDFDocument> {
  const bookletDoc = await PDFDocument.create();
  const pageCount = doc.getPageCount();
  const sheetCount = Math.ceil(pageCount / 4);

  for (let sheet = 0; sheet < sheetCount; sheet++) {
    const order: number[] = [];
    const first = sheet * 4;
    const second = (sheet + 1) * 4 - 1;

    if (first < pageCount) order.push(first);
    if (first + 1 < pageCount) order.push(first + 1);
    if (second >= 0 && second < pageCount) order.push(second);
    if (second - 1 >= 0 && second - 1 < pageCount) order.push(second - 1);

    const pages = await bookletDoc.copyPages(doc, order);
    pages.forEach((page) => bookletDoc.addPage(page));
  }
  return bookletDoc;
}

/* ------------------------------------------------------------------ */
/* Watermarks + redaction parsing                                      */
/* ------------------------------------------------------------------ */

async function applyTextWatermark(doc: PDFDocument, text: string) {
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 7;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 0.2,
      rotate: degrees(45)
    });
  });
}

function applyImageWatermark(doc: PDFDocument, image: PDFImage) {
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const { width: imageWidth, height: imageHeight } = image.scale(1);
    const scale = Math.min(width / imageWidth, height / imageHeight) * 0.35;
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    page.drawImage(image, {
      x: (width - drawWidth) / 2,
      y: (height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
      opacity: 0.25
    });
  });
}

function parseRedactInstructions(instructions?: string | null): {
  areas: RedactArea[];
  terms: string[];
} {
  const areas: RedactArea[] = [];
  const terms: string[] = [];

  if (!instructions) return { areas, terms };

  for (const part of instructions.split(/[;\n]+/).map((p) => p.trim()).filter(Boolean)) {
    const areaMatch = part.match(
      /^(?:area|rect|box)(?:[:=])\s*(\d+):([\d.]+),([\d.]+),([\d.]+),([\d.]+)/
    );
    if (areaMatch) {
      areas.push({
        page: parseInt(areaMatch[1], 10),
        x: clamp01(parseFloat(areaMatch[2])),
        y: clamp01(parseFloat(areaMatch[3])),
        width: clamp01(parseFloat(areaMatch[4])),
        height: clamp01(parseFloat(areaMatch[5]))
      });
      continue;
    }

    const textMatch = part.match(/^(?:text|term|words?)(?:[:=])\s*(.+)/i);
    if (textMatch) {
      terms.push(
        ...textMatch[1].split(/[,|]/).map((t) => t.trim()).filter(Boolean)
      );
    }
  }

  return { areas, terms };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/* ------------------------------------------------------------------ */
/* Parsers                                                             */
/* ------------------------------------------------------------------ */

function parsePageIndices(pageCount: number, instructions?: string | null): number[] {
  if (!instructions) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }
  return instructions
    .split(/[, ]+/)
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => !Number.isNaN(i) && i >= 0 && i < pageCount);
}

function parseRotateAngle(instructions?: string | null): number {
  const match = instructions?.match(/(90|180|270)/);
  return match ? Number(match[0]) : 90;
}

function parsePageRange(pageCount: number, instructions?: string | null): number[] {
  if (!instructions) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }
  const match = instructions.match(/(\d+)(?:-(\d+))?/);
  if (!match) return [];
  const start = Math.max(1, Number(match[1]));
  const end = Math.min(pageCount, Number(match[2] ?? match[1]));
  const indices = [];
  for (let i = start; i <= end; i++) indices.push(i - 1);
  return indices;
}

function parseInstructionValue(instructions?: string | null): string | null {
  if (!instructions) return null;
  const match = instructions.match(/(?:text|note|password|watermark)[:=]\s*([^\n;]+)/i);
  return match ? match[1].trim() : instructions.trim();
}

function parseMetadata(
  instructions?: string | null
): { title?: string; author?: string; subject?: string } {
  const result: { title?: string; author?: string; subject?: string } = {};
  if (!instructions) return result;

  for (const part of instructions.split(/[;\n]+/).map((p) => p.trim()).filter(Boolean)) {
    const [key, ...rest] = part.split(/[:=]/);
    const value = rest.join(":").trim();
    if (!value) continue;
    const k = key.toLowerCase();
    if (k.includes("title")) result.title = value;
    else if (k.includes("author")) result.author = value;
    else if (k.includes("subject")) result.subject = value;
  }
  return result;
}

function parseScale(instructions?: string | null): number {
  const match = instructions?.match(/(\d+(?:\.\d+)?)\s*(?:x|scale)/i);
  if (match) {
    const s = Number(match[1]);
    return Math.min(3, Math.max(1, s));
  }
  return 2;
}