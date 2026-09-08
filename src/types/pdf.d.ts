declare module 'pdf-parse' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }
  function parse(buffer: Buffer): Promise<PDFParseResult>;
  export = parse;
}
