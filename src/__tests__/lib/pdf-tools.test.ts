import { processPdfTool } from '@/lib/pdf-tools';
import { createTestPdf, createMockFile } from '../utils/test-helpers';

describe('PDF Tools', () => {
  describe('pdf-to-text', () => {
    it('should extract text from PDF', async () => {
      const pdfBuffer = await createTestPdf('Hello World');
      const file = createMockFile('test.pdf', 'application/pdf', pdfBuffer);
      
      const result = await processPdfTool({
        tool: 'pdf-to-text',
        files: [file]
      });
      
      expect(result.contentType).toBe('text/plain');
      expect(result.filename).toBe('extracted-text.txt');
      expect(result.buffer.toString()).toContain('Sample PDF text');
    });
  });

  describe('merge', () => {
    it('should merge multiple PDFs', async () => {
      const pdf1 = await createTestPdf('Page 1');
      const pdf2 = await createTestPdf('Page 2');
      
      const result = await processPdfTool({
        tool: 'merge',
        files: [
          createMockFile('1.pdf', 'application/pdf', pdf1),
          createMockFile('2.pdf', 'application/pdf', pdf2)
        ]
      });
      
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('merged.pdf');
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('rotate', () => {
    it('should rotate PDF pages', async () => {
      const pdf = await createTestPdf('Test');
      
      const result = await processPdfTool({
        tool: 'rotate',
        files: [createMockFile('test.pdf', 'application/pdf', pdf)],
        instructions: '90'
      });
      
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('rotated.pdf');
    });
  });

  describe('split', () => {
    it('should split PDF pages', async () => {
      const pdf = await createTestPdf('Test');
      
      const result = await processPdfTool({
        tool: 'split',
        files: [createMockFile('test.pdf', 'application/pdf', pdf)],
        instructions: '1-1'
      });
      
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('split-part.pdf');
    });
  });

  describe('compress', () => {
    it('should compress PDF', async () => {
      const pdf = await createTestPdf('Test');
      
      const result = await processPdfTool({
        tool: 'compress',
        files: [createMockFile('test.pdf', 'application/pdf', pdf)]
      });
      
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe('compressed.pdf');
    });
  });
});
