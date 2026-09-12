import { PDFDocument } from 'pdf-lib';

export async function createTestPdf(content: string, pageCount = 1): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage();
    const { width, height } = page.getSize();

    page.drawText(pageCount > 1 ? `${content} ${i + 1}` : content, {
      x: 50,
      y: height - 50 - i * 30,
      size: 12
    });
  }

  return Buffer.from(await doc.save());
}

export function createMockFile(name: string, type: string, content: Buffer): File {
  // Buffer → Uint8Array keeps TS happy (Buffer is not a valid BlobPart in newer DOM types).
  return new File([new Uint8Array(content)], name, { type });
}
