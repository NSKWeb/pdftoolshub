import { PDFDocument, PDFRawStream, PDFName, StandardFonts, degrees, rgb } from "pdf-lib";
import type { PDFImage } from "pdf-lib";
import pdfParse from "pdf-parse";
import { fromBuffer } from "pdf2pic";
import { Document, Paragraph, TextRun, Packer } from "docx";
import * as pako from "pako";
import JSZip from "jszip";
import { PDFProcessingError } from "./errors";
import Tesseract from "tesseract.js";

export type ProcessedResult = {
  buffer: Buffer;
  contentType: string;
  filename: string;
};

const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
  tabloid: [792, 1224],
  executive: [522, 756]
};

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

  const fileBuffers = await Promise.all(files.map(async (file) => Buffer.from(await file.arrayBuffer())));

  switch (tool) {
    case "merge": {
      const merged = await PDFDocument.create();
      for (const buffer of fileBuffers) {
        const doc = await PDFDocument.load(buffer);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const mergedBytes = await merged.save();
      return {
        buffer: Buffer.from(mergedBytes),
        contentType: "application/pdf",
        filename: "merged.pdf"
      };
    }
    case "split": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const range = parsePageRange(instructions, doc.getPageCount());
      const extracted = await PDFDocument.create();
      const pages = await extracted.copyPages(doc, range);
      pages.forEach((page) => extracted.addPage(page));
      const splitBytes = await extracted.save();
      return {
        buffer: Buffer.from(splitBytes),
        contentType: "application/pdf",
        filename: "split-part.pdf"
      };
    }
    case "compress": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const compressedBytes = await doc.save({ useObjectStreams: true });
      return {
        buffer: Buffer.from(compressedBytes),
        contentType: "application/pdf",
        filename: "compressed.pdf"
      };
    }
    case "rotate": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const angle = parseRotateAngle(instructions);
      doc.getPages().forEach((page) => {
        const current = page.getRotation().angle;
        page.setRotation(degrees(current + angle));
      });
      const rotatedBytes = await doc.save();
      return {
        buffer: Buffer.from(rotatedBytes),
        contentType: "application/pdf",
        filename: "rotated.pdf"
      };
    }
    case "pdf-to-office": {
      const docxBuffer = await convertPdfToDocx(fileBuffers[0]);
      return {
        buffer: docxBuffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "converted.docx"
      };
    }
    case "pdf-to-images": {
      const format = instructions?.toLowerCase().includes('png') ? 'png' : 'jpeg';
      const zipBuffer = await convertPdfToImages(fileBuffers[0], format);
      return {
        buffer: zipBuffer,
        contentType: "application/zip",
        filename: `pdf-pages.zip`
      };
    }
    case "images-to-pdf": {
      const pdf = await PDFDocument.create();
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const buffer = fileBuffers[i];
        if (!file.type.startsWith("image/")) {
          throw new PDFProcessingError("Images to PDF only supports image uploads", "INVALID_FILE_TYPE");
        }
        const image = file.type === "image/png" ? await pdf.embedPng(buffer) : await pdf.embedJpg(buffer);
        const { width, height } = image.scale(1);
        const page = pdf.addPage([width, height]);
        page.drawImage(image, { x: 0, y: 0, width, height });
      }
      const pdfBytes = await pdf.save();
      return {
        buffer: Buffer.from(pdfBytes),
        contentType: "application/pdf",
        filename: "images.pdf"
      };
    }
    case "pdf-to-text": {
      const text = await extractTextFromPdf(fileBuffers[0]);
      return {
        buffer: Buffer.from(text, 'utf-8'),
        contentType: "text/plain",
        filename: "extracted-text.txt"
      };
    }
    case "watermark-text": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const text = parseInstructionValue(instructions) ?? "CONFIDENTIAL";
      await applyTextWatermark(doc, text);
      const watermarked = await doc.save();
      return {
        buffer: Buffer.from(watermarked),
        contentType: "application/pdf",
        filename: "watermarked.pdf"
      };
    }
    case "watermark-image": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const imageFile = files[1];
      if (!imageFile) {
        throw new PDFProcessingError("Upload a second image file to use as a watermark", "MISSING_WATERMARK_IMAGE");
      }
      if (!imageFile.type.startsWith("image/")) {
        throw new PDFProcessingError("Watermark image must be a PNG or JPG file", "INVALID_WATERMARK_TYPE");
      }
      const imageBuffer = fileBuffers[1];
      const image = imageFile.type === "image/png" ? await doc.embedPng(imageBuffer) : await doc.embedJpg(imageBuffer);
      applyImageWatermark(doc, image);
      const watermarked = await doc.save();
      return {
        buffer: Buffer.from(watermarked),
        contentType: "application/pdf",
        filename: "image-watermarked.pdf"
      };
    }
    case "annotate": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const annotation = parseInstructionValue(instructions) ?? "Review annotation";
      await applyAnnotations(doc, annotation);
      const annotated = await doc.save();
      return {
        buffer: Buffer.from(annotated),
        contentType: "application/pdf",
        filename: "annotated.pdf"
      };
    }
    case "extract-pages": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const extracted = await PDFDocument.create();
      const indices = parsePageRange(instructions, doc.getPageCount());
      const pages = await extracted.copyPages(doc, indices);
      pages.forEach((page) => extracted.addPage(page));
      const extractedBytes = await extracted.save();
      return {
        buffer: Buffer.from(extractedBytes),
        contentType: "application/pdf",
        filename: "extracted-pages.pdf"
      };
    }
    case "extract-images": {
      const images = await extractImagesFromPdf(fileBuffers[0]);
      return {
        buffer: images,
        contentType: "application/zip",
        filename: "extracted-images.zip"
      };
    }
    case "metadata": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const metadata = parseMetadata(instructions);
      if (metadata.title) {
        doc.setTitle(metadata.title);
      }
      if (metadata.author) {
        doc.setAuthor(metadata.author);
      }
      if (metadata.subject) {
        doc.setSubject(metadata.subject);
      }
      const metadataBytes = await doc.save();
      return {
        buffer: Buffer.from(metadataBytes),
        contentType: "application/pdf",
        filename: "metadata-updated.pdf"
      };
    }
    case "reorder": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const indices = parsePageIndices(instructions, doc.getPageCount());
      const reordered = await PDFDocument.create();
      const pages = await reordered.copyPages(doc, indices);
      pages.forEach((page) => reordered.addPage(page));
      const reorderedBytes = await reordered.save();
      return {
        buffer: Buffer.from(reorderedBytes),
        contentType: "application/pdf",
        filename: "reordered.pdf"
      };
    }
    case "delete-pages": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const toDelete = new Set(parsePageRange(instructions, doc.getPageCount()));
      const remainingIndices = [];
      for (let i = 0; i < doc.getPageCount(); i++) {
        if (!toDelete.has(i)) {
          remainingIndices.push(i);
        }
      }
      if (remainingIndices.length === 0) {
        throw new PDFProcessingError("Cannot delete all pages", "INVALID_OPERATION");
      }
      const updated = await PDFDocument.create();
      const pages = await updated.copyPages(doc, remainingIndices);
      pages.forEach((page) => updated.addPage(page));
      const updatedBytes = await updated.save();
      return {
        buffer: Buffer.from(updatedBytes),
        contentType: "application/pdf",
        filename: "pages-deleted.pdf"
      };
    }
    case "page-numbers": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      await addPageNumbers(doc, instructions);
      const resultBytes = await doc.save();
      return {
        buffer: Buffer.from(resultBytes),
        contentType: "application/pdf",
        filename: "with-page-numbers.pdf"
      };
    }
    case "ocr": {
      const ocrText = await performOCR(fileBuffers[0], instructions);
      return {
        buffer: Buffer.from(ocrText, 'utf-8'),
        contentType: "text/plain",
        filename: "ocr-result.txt"
      };
    }
    case "compare": {
      if (files.length < 2) {
        throw new PDFProcessingError("Please upload two PDFs to compare", "MISSING_SECOND_FILE");
      }
      const diffReport = await comparePdfs(fileBuffers[0], fileBuffers[1]);
      return {
        buffer: Buffer.from(diffReport, 'utf-8'),
        contentType: "text/plain",
        filename: "comparison-report.txt"
      };
    }
    case "redact": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      await redactAreas(doc, instructions);
      const redactedBytes = await doc.save();
      return {
        buffer: Buffer.from(redactedBytes),
        contentType: "application/pdf",
        filename: "redacted.pdf"
      };
    }
    case "flatten": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      doc.getPages().forEach((page) => {
        page.node.delete(PDFName.of("Annots"));
      });
      const flattenedBytes = await doc.save();
      return {
        buffer: Buffer.from(flattenedBytes),
        contentType: "application/pdf",
        filename: "flattened.pdf"
      };
    }
    case "n-up": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const nValue = parseNUpValue(instructions);
      const nUpDoc = await createNUpPdf(doc, nValue);
      const nUpBytes = await nUpDoc.save();
      return {
        buffer: Buffer.from(nUpBytes),
        contentType: "application/pdf",
        filename: `${nValue}-up.pdf`
      };
    }
    case "resize": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const sizeName = parseResizeSize(instructions);
      const newSize = PAGE_SIZES[sizeName] || PAGE_SIZES.a4;
      await resizePdfPages(doc, newSize);
      const resizedBytes = await doc.save();
      return {
        buffer: Buffer.from(resizedBytes),
        contentType: "application/pdf",
        filename: `resized-${sizeName}.pdf`
      };
    }
    case "booklet": {
      const doc = await PDFDocument.load(fileBuffers[0]);
      const bookletDoc = await createBooklet(doc);
      const bookletBytes = await bookletDoc.save();
      return {
        buffer: Buffer.from(bookletBytes),
        contentType: "application/pdf",
        filename: "booklet.pdf"
      };
    }
    case "repair": {
      const repairedBytes = await repairPdf(fileBuffers[0]);
      return {
        buffer: Buffer.from(repairedBytes),
        contentType: "application/pdf",
        filename: "repaired.pdf"
      };
    }
    case "pdf-to-html": {
      const html = await convertPdfToHtml(fileBuffers[0]);
      return {
        buffer: Buffer.from(html, 'utf-8'),
        contentType: "text/html",
        filename: "output.html"
      };
    }
    default: {
      throw new PDFProcessingError(`Unknown tool: ${tool}`, "UNKNOWN_TOOL");
    }
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    if (!data.text || data.text.trim().length === 0) {
      return 'No text content found in PDF. The PDF may be scanned or image-based. Try using OCR.';
    }
    return data.text;
  } catch (error) {
    throw new PDFProcessingError(
      `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`,
      "TEXT_EXTRACTION_FAILED"
    );
  }
}

async function convertPdfToDocx(pdfBuffer: Buffer): Promise<Buffer> {
  const text = await extractTextFromPdf(pdfBuffer);
  const paragraphs = text.split('\n').filter(line => line.trim());
  
  if (paragraphs.length === 0) {
    throw new PDFProcessingError("No text content to convert to DOCX", "NO_CONTENT");
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs.map(p => new Paragraph({
        children: [new TextRun({ text: p })]
      }))
    }]
  });
  
  return Packer.toBuffer(doc);
}

async function convertPdfToImages(buffer: Buffer, format: 'png' | 'jpeg'): Promise<Buffer> {
  const zip = new JSZip();
  
  try {
    const data = await pdfParse(buffer);
    const pageCount = data.numpages;
    
    if (pageCount > 50) {
      throw new PDFProcessingError("PDF has too many pages for image conversion (max 50)", "PAGE_LIMIT_EXCEEDED");
    }
    
    if (pageCount === 0) {
      throw new PDFProcessingError("PDF has no pages", "INVALID_PDF");
    }
    
    const convert = fromBuffer(buffer, {
      density: 150,
      format,
      width: 1240,
      height: 1754,
      savePath: '/tmp'
    });
    
    const images = await convert.bulk(pageCount);
    
    let hasImages = false;
    images.forEach((img, idx) => {
      if (img.base64) {
        zip.file(`page-${idx + 1}.${format}`, img.base64, { base64: true });
        hasImages = true;
      }
    });
    
    if (!hasImages) {
      throw new PDFProcessingError("Failed to convert PDF pages to images", "CONVERSION_FAILED");
    }
    
    return zip.generateAsync({ type: 'nodebuffer' });
  } catch (error) {
    if (error instanceof PDFProcessingError) throw error;
    throw new PDFProcessingError(
      `Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      "IMAGE_CONVERSION_FAILED"
    );
  }
}

async function extractImagesFromPdf(buffer: Buffer): Promise<Buffer> {
  const doc = await PDFDocument.load(buffer);
  const zip = new JSZip();
  let imageCount = 0;
  
  const enumeratedIndirectObjects = doc.context.enumerateIndirectObjects();
  
  for (let i = 0; i < enumeratedIndirectObjects.length; i++) {
    const [, obj] = enumeratedIndirectObjects[i];
    
    if (obj instanceof PDFRawStream) {
      const { lookup } = obj.dict;
      const subtype = lookup(PDFName.of('Subtype'));
      
      if (subtype === PDFName.of('Image')) {
        const width = lookup(PDFName.of('Width'))?.asNumber() || 0;
        const height = lookup(PDFName.of('Height'))?.asNumber() || 0;
        
        if (width > 0 && height > 0) {
          const filter = lookup(PDFName.of('Filter'));
          let extension = 'bin';
          let imageBuffer: Buffer;
          
          if (filter === PDFName.of('DCTDecode')) {
            extension = 'jpg';
            imageBuffer = Buffer.from(obj.contents);
          } else if (filter === PDFName.of('FlateDecode')) {
            extension = 'png';
            try {
              const decompressed = pako.inflate(obj.contents);
              imageBuffer = Buffer.from(decompressed);
            } catch {
              continue;
            }
          } else {
            continue;
          }
          
          zip.file(`image-${++imageCount}.${extension}`, imageBuffer);
        }
      }
    }
  }
  
  if (imageCount === 0) {
    zip.file('info.txt', 'No embedded images found in this PDF');
  }
  
  return zip.generateAsync({ type: 'nodebuffer' });
}

async function performOCR(buffer: Buffer, instructions?: string | null): Promise<string> {
  try {
    const format = instructions?.toLowerCase().includes('png') ? 'png' : 'jpeg';
    const convert = fromBuffer(buffer, {
      density: 300,
      format,
      width: 2480,
      height: 3508,
      savePath: '/tmp'
    });
    
    const data = await pdfParse(buffer);
    const pageCount = data.numpages;
    
    if (pageCount > 20) {
      throw new PDFProcessingError("PDF has too many pages for OCR (max 20)", "PAGE_LIMIT_EXCEEDED");
    }
    
    const images = await convert.bulk(pageCount);
    let fullText = "";
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.base64) {
        const result = await Tesseract.recognize(`data:image/${format};base64,${img.base64}`, 'eng', {
          logger: () => {}
        });
        fullText += `\n--- Page ${i + 1} ---\n${result.data.text}\n`;
      }
    }
    
    if (!fullText.trim()) {
      throw new PDFProcessingError("OCR failed to extract any text from the PDF", "OCR_FAILED");
    }
    
    return fullText;
  } catch (error) {
    if (error instanceof PDFProcessingError) throw error;
    throw new PDFProcessingError(
      `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      "OCR_FAILED"
    );
  }
}

async function addPageNumbers(doc: PDFDocument, instructions?: string | null) {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const totalPages = doc.getPageCount();
  const position = instructions?.toLowerCase().includes('bottom') ? 'bottom' : 'top';
  const format = instructions?.toLowerCase().includes('roman') ? 'roman' : 'arabic';
  
  doc.getPages().forEach((page, index) => {
    const { width, height } = page.getSize();
    const pageNum = format === 'roman' ? toRoman(index + 1) : String(index + 1);
    const text = `${pageNum} / ${format === 'roman' ? toRoman(totalPages) : totalPages}`;
    const textWidth = font.widthOfTextAtSize(text, 10);
    
    const y = position === 'bottom' ? 20 : height - 30;
    const x = width - textWidth - 20;
    
    page.drawText(text, {
      x,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
  });
}

function toRoman(num: number): string {
  const romanNumerals = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ];
  let result = '';
  for (const [letter, value] of romanNumerals) {
    while (num >= value) {
      result += letter;
      num -= value;
    }
  }
  return result || 'i';
}

async function comparePdfs(pdf1Buffer: Buffer, pdf2Buffer: Buffer): Promise<string> {
  const text1 = await extractTextFromPdf(pdf1Buffer);
  const text2 = await extractTextFromPdf(pdf2Buffer);
  
  const lines1 = text1.split('\n').filter(l => l.trim());
  const lines2 = text2.split('\n').filter(l => l.trim());
  
  let report = "PDF Comparison Report\n";
  report += "======================\n\n";
  report += `PDF 1: ${lines1.length} lines of text\n`;
  report += `PDF 2: ${lines2.length} lines of text\n\n`;
  
  const maxLen = Math.max(lines1.length, lines2.length);
  let differences = 0;
  
  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i] || '';
    const line2 = lines2[i] || '';
    if (line1 !== line2) {
      differences++;
    }
  }
  
  if (differences === 0 && lines1.length === lines2.length) {
    report += "Result: PDFs are identical\n";
  } else {
    report += `Result: Found ${differences} differences\n\n`;
    report += "First 10 differences:\n";
    let shown = 0;
    for (let i = 0; i < maxLen && shown < 10; i++) {
      const line1 = lines1[i] || '(empty)';
      const line2 = lines2[i] || '(empty)';
      if (line1 !== line2) {
        report += `\nLine ${i + 1}:\n  PDF 1: ${line1.substring(0, 80)}\n  PDF 2: ${line2.substring(0, 80)}\n`;
        shown++;
      }
    }
  }
  
  return report;
}

async function redactAreas(doc: PDFDocument, instructions?: string | null) {
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const redactions = parseRedactionAreas(instructions, doc.getPageCount());
  
  doc.getPages().forEach((page, pageIndex) => {
    const pageRedactions = redactions.filter(r => r.page === pageIndex + 1);
    const { width, height } = page.getSize();
    
    for (const redact of pageRedactions) {
      page.drawRectangle({
        x: redact.x * width,
        y: height - (redact.y * height) - (redact.height * height),
        width: redact.width * width,
        height: redact.height * height,
        color: rgb(0, 0, 0)
      });
    }
  });
}

function parseRedactionAreas(instructions?: string | null, pageCount?: number) {
  const areas: Array<{page: number; x: number; y: number; width: number; height: number}> = [];
  
  if (!instructions) {
    return areas;
  }
  
  const parts = instructions.split(/[,;]/);
  for (const part of parts) {
    const match = part.trim().match(/(\d+):([\d.]+),([\d.]+),([\d.]+),([\d.]+)/);
    if (match) {
      const page = parseInt(match[1], 10);
      if (page >= 1 && page <= (pageCount || 999)) {
        areas.push({
          page,
          x: parseFloat(match[2]),
          y: parseFloat(match[3]),
          width: parseFloat(match[4]),
          height: parseFloat(match[5])
        });
      }
    }
  }
  
  return areas;
}

async function createNUpPdf(doc: PDFDocument, n: number): Promise<PDFDocument> {
  const nUpDoc = await PDFDocument.create();
  const pages = doc.getPageIndices();
  const nUpPages: number[][] = [];
  
  for (let i = 0; i < pages.length; i += n) {
    nUpPages.push(pages.slice(i, i + n));
  }
  
  const cols = n === 4 ? 2 : 2;
  const rows = n === 4 ? 2 : 1;
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const cellWidth = (pageWidth - margin * 2) / cols;
  const cellHeight = (pageHeight - margin * 2) / rows;
  
  for (const group of nUpPages) {
    const nUpPage = nUpDoc.addPage([pageWidth, pageHeight]);
    
    for (let i = 0; i < group.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const [sourcePage] = await nUpDoc.copyPages(doc, [group[i]]);
      
      if (sourcePage) {
        const { width, height } = sourcePage.getSize();
        const scale = Math.min(cellWidth / width, cellHeight / height) * 0.9;
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        
        const x = margin + col * cellWidth + (cellWidth - scaledWidth) / 2;
        const y = pageHeight - margin - (row + 1) * cellHeight + (cellHeight - scaledHeight) / 2;
        
        nUpPage.drawPage(sourcePage, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight
        });
      }
    }
  }
  
  return nUpDoc;
}

function parseNUpValue(instructions?: string | null): number {
  if (instructions?.includes('4')) return 4;
  return 2;
}

async function resizePdfPages(doc: PDFDocument, newSize: [number, number]) {
  const [targetWidth, targetHeight] = newSize;
  
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const scaleX = targetWidth / width;
    const scaleY = targetHeight / height;
    const scale = Math.min(scaleX, scaleY);
    
    page.setWidth(targetWidth);
    page.setHeight(targetHeight);
    
    const contentWidth = width * scale;
    const contentHeight = height * scale;
    const x = (targetWidth - contentWidth) / 2;
    const y = (targetHeight - contentHeight) / 2;
    
    page.translateContent(x - page.getX(), y - page.getY());
  }
}

function parseResizeSize(instructions?: string | null): string {
  const normalized = instructions?.toLowerCase() || '';
  if (normalized.includes('letter')) return 'letter';
  if (normalized.includes('legal')) return 'legal';
  if (normalized.includes('tabloid')) return 'tabloid';
  if (normalized.includes('executive')) return 'executive';
  return 'a4';
}

async function createBooklet(doc: PDFDocument): Promise<PDFDocument> {
  const bookletDoc = await PDFDocument.create();
  const pageCount = doc.getPageCount();
  const sheetCount = Math.ceil(pageCount / 4);
  
  for (let sheet = 0; sheet < sheetCount; sheet++) {
    const frontSheet: number[] = [];
    const backSheet: number[] = [];
    
    const frontPageIndex = sheet * 4;
    const backPageIndex = (sheet + 1) * 4 - 1;
    
    if (frontPageIndex < pageCount) {
      frontSheet.push(frontPageIndex);
    }
    if (frontPageIndex + 1 < pageCount) {
      backSheet.push(frontPageIndex + 1);
    }
    if (backPageIndex >= 0 && backPageIndex < pageCount) {
      backSheet.push(backPageIndex);
    }
    if (backPageIndex - 1 >= 0 && backPageIndex - 1 < pageCount) {
      backSheet.push(backPageIndex - 1);
    }
    
    const frontPages = await bookletDoc.copyPages(doc, frontSheet);
    frontPages.forEach(page => bookletDoc.addPage(page));
    
    const backPages = await bookletDoc.copyPages(doc, backSheet);
    backPages.forEach(page => bookletDoc.addPage(page));
  }
  
  return bookletDoc;
}

async function repairPdf(buffer: Buffer): Promise<Buffer> {
  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const repairedBytes = await doc.save();
    return Buffer.from(repairedBytes);
  } catch (error) {
    throw new PDFProcessingError(
      `Failed to repair PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      "REPAIR_FAILED"
    );
  }
}

async function convertPdfToHtml(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  const text = data.text || '';
  const pageCount = data.numpages;
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PDF to HTML</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .page { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; }
    .page-number { color: #666; text-align: center; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>PDF Content</h1>
  <p>Total Pages: ${pageCount}</p>
  <div class="content">
    ${text.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('\n')}
  </div>
</body>
</html>`;
  
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parsePageIndices(instructions?: string | null, pageCount: number) {
  if (!instructions) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }
  return instructions
    .split(/[, ]+/)
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => !isNaN(i) && i >= 0 && i < pageCount);
}

function parseRotateAngle(instructions?: string | null) {
  const match = instructions?.match(/(90|180|270)/);
  return match ? Number(match[0]) : 90;
}

function parsePageRange(instructions?: string | null, pageCount: number) {
  if (!instructions) {
    return [0];
  }

  const match = instructions.match(/(\d+)(?:-(\d+))?/);
  if (!match) {
    return [0];
  }
  const start = Math.max(1, Number(match[1]));
  const end = Math.min(pageCount, Number(match[2] ?? match[1]));
  const indices = [];
  for (let i = start; i <= end; i += 1) {
    indices.push(i - 1);
  }
  return indices.length ? indices : [0];
}

function parseInstructionValue(instructions?: string | null) {
  if (!instructions) {
    return null;
  }
  const match = instructions.match(/(?:text|note|password)[:=]\s*([^\n;]+)/i);
  return match ? match[1].trim() : instructions.trim();
}

function parseMetadata(instructions?: string | null) {
  if (!instructions) {
    return {} as { title?: string; author?: string; subject?: string };
  }
  const result: { title?: string; author?: string; subject?: string } = {};
  const parts = instructions.split(/[;\n]+/).map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    const [key, ...rest] = part.split(/[:=]/);
    const value = rest.join(":").trim();
    if (!value) {
      continue;
    }
    const normalized = key.toLowerCase();
    if (normalized.includes("title")) {
      result.title = value;
    } else if (normalized.includes("author")) {
      result.author = value;
    } else if (normalized.includes("subject")) {
      result.subject = value;
    }
  }
  return result;
}

function resolveOfficeExtension(instructions?: string | null) {
  const normalized = instructions?.toLowerCase() ?? "";
  if (normalized.includes("excel") || normalized.includes("xlsx")) {
    return "xlsx";
  }
  if (normalized.includes("powerpoint") || normalized.includes("ppt")) {
    return "pptx";
  }
  return "docx";
}

async function applyTextWatermark(doc: PDFDocument, text: string) {
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 6;
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
    const scale = Math.min(width / imageWidth, height / imageHeight) * 0.4;
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

async function applyAnnotations(doc: PDFDocument, annotation: string) {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.getPages().forEach((page, index) => {
    const { width, height } = page.getSize();
    page.drawText(`Note ${index + 1}: ${annotation}`, {
      x: 40,
      y: height - 40,
      size: 12,
      font,
      color: rgb(0.8, 0.9, 1)
    });
  });
}
