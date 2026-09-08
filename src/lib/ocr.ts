import { createWorker } from 'tesseract.js';

export async function performOcr(imageBuffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imageBuffer);
  await worker.terminate();
  return text;
}
