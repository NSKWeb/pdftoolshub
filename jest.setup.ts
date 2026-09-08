import '@testing-library/jest-dom';

jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({
    text: 'Sample PDF text content',
    numpages: 2,
    info: { Title: 'Test PDF' }
  }))
}));

jest.mock('pdf2pic', () => ({
  fromBuffer: jest.fn(() => ({
    bulk: jest.fn(() => Promise.resolve([
      { base64: 'base64encodedstring1' },
      { base64: 'base64encodedstring2' }
    ]))
  }))
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
