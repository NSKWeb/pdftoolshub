import '@testing-library/jest-dom';

// Augment jest matchers for jest-dom types (v6 style).
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

// pdf-render uses pdfjs-dist ESM + native canvas — heavy for unit tests.
// Mock it so the processing core can be exercised without a worker thread.
jest.mock('@/lib/pdf-render', () => ({
  renderPdfToImages: jest.fn(),
  extractPdfText: jest.fn(async () => 'Sample PDF text content'),
  getTextItemsWithPosition: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  createRequestLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }))
}));
