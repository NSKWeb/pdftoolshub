import { sign } from 'node-signpdf';
import { PDFDocument } from 'pdf-lib';

export async function signPdf(pdfBuffer: Buffer, certificateBuffer: Buffer): Promise<Buffer> {
  // node-signpdf expects a PDF that already has a placeholder for the signature
  // This is a simplified version for Phase 2
  try {
    const signedPdf = sign(pdfBuffer, certificateBuffer);
    return Buffer.from(signedPdf);
  } catch (error) {
    console.error('Signing failed:', error);
    throw new Error('Could not sign PDF. Ensure it has a signature placeholder.');
  }
}
