import { PDFDocument } from 'pdf-lib';

export async function createTestPdf(content: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  const { width, height } = page.getSize();
  
  page.drawText(content, {
    x: 50,
    y: height - 50,
    size: 12
  });
  
  return Buffer.from(await doc.save());
}

export function createMockFile(name: string, type: string, content: Buffer): File {
  return new File([content], name, { type });
}
