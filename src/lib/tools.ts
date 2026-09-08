export const tools = [
  // Basic Tools
  {
    slug: "merge",
    name: "Merge PDFs",
    description: "Combine multiple PDFs into a single file."
  },
  {
    slug: "split",
    name: "Split PDF",
    description: "Extract pages or ranges into separate files."
  },
  {
    slug: "compress",
    name: "Compress PDF",
    description: "Reduce file sizes while preserving quality."
  },
  {
    slug: "rotate",
    name: "Rotate PDF",
    description: "Rotate pages by 90°/180°/270°."
  },
  {
    slug: "extract-pages",
    name: "Extract Pages",
    description: "Pull specific pages into a new file."
  },
  {
    slug: "delete-pages",
    name: "Delete Pages",
    description: "Remove specific pages from a PDF."
  },
  {
    slug: "reorder",
    name: "Reorder Pages",
    description: "Change the order of pages in a PDF."
  },
  // Convert Tools
  {
    slug: "pdf-to-text",
    name: "PDF to Text",
    description: "Extract selectable text from PDFs."
  },
  {
    slug: "pdf-to-images",
    name: "PDF to Images",
    description: "Export PDF pages as JPG or PNG."
  },
  {
    slug: "images-to-pdf",
    name: "Images to PDF",
    description: "Convert JPG/PNG images into a PDF."
  },
  {
    slug: "pdf-to-office",
    name: "PDF to DOCX",
    description: "Convert PDF to Word document."
  },
  {
    slug: "pdf-to-html",
    name: "PDF to HTML",
    description: "Convert PDF to HTML representation."
  },
  {
    slug: "ocr",
    name: "OCR PDF",
    description: "Extract text from scanned/image PDFs."
  },
  // Edit Tools
  {
    slug: "watermark-text",
    name: "Text Watermark",
    description: "Apply text watermarks across your PDF."
  },
  {
    slug: "watermark-image",
    name: "Image Watermark",
    description: "Stamp a logo or image watermark."
  },
  {
    slug: "annotate",
    name: "Text Annotations",
    description: "Add text notes and highlights to PDFs."
  },
  {
    slug: "page-numbers",
    name: "Add Page Numbers",
    description: "Add page numbers to all pages."
  },
  {
    slug: "metadata",
    name: "Edit Metadata",
    description: "Edit title, author, and subject metadata."
  },
  // Security/Privacy Tools
  {
    slug: "redact",
    name: "Redact PDF",
    description: "Black out sensitive areas in PDFs."
  },
  // Advanced Tools
  {
    slug: "compare",
    name: "Compare PDFs",
    description: "Compare text content of two PDFs."
  },
  {
    slug: "flatten",
    name: "Flatten PDF",
    description: "Remove interactivity for print-ready output."
  },
  {
    slug: "n-up",
    name: "N-up PDF",
    description: "Arrange 2 or 4 pages per sheet."
  },
  {
    slug: "resize",
    name: "Resize PDF",
    description: "Change page dimensions (A4, Letter, etc.)."
  },
  {
    slug: "booklet",
    name: "Booklet",
    description: "Reorder pages for booklet printing."
  },
  {
    slug: "repair",
    name: "Repair PDF",
    description: "Fix corrupted or damaged PDFs."
  },
  {
    slug: "extract-images",
    name: "Extract Images",
    description: "Download embedded images from PDFs."
  }
] as const;
