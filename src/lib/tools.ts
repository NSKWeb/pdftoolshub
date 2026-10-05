export type ToolCategory =
  | "Basic Tools"
  | "Convert Tools"
  | "Edit Tools"
  | "Security/Privacy"
  | "Advanced Tools";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  /** Editorial accent used for the tool's illustration and detail page. */
  accent: "vermilion" | "cobalt" | "olive";
  /** Concrete jobs this tool is built for — shown on the tool page. */
  useCases: readonly string[];
};

export const tools = [
  // Basic Tools
  {
    slug: "merge",
    name: "Merge PDFs",
    description: "Combine multiple PDFs into a single file.",
    category: "Basic Tools",
    accent: "vermilion",
    useCases: [
      "Combine contracts, invoices, or reports into a single packet",
      "Assemble a submission from separate chapters or appendices",
      "Join scans with their cover sheets before archiving"
    ]
  },
  {
    slug: "split",
    name: "Split PDF",
    description: "Extract pages or ranges into separate files.",
    category: "Basic Tools",
    accent: "cobalt",
    useCases: [
      "Separate one chapter or section from a large document",
      "Send only the relevant pages to a client",
      "Break a scan bundle into individual records"
    ]
  },
  {
    slug: "compress",
    name: "Compress PDF",
    description: "Reduce file sizes while preserving quality.",
    category: "Basic Tools",
    accent: "olive",
    useCases: [
      "Shrink a file to fit an email or upload limit",
      "Reduce storage for long-term archives",
      "Speed up sharing over slow connections"
    ]
  },
  {
    slug: "rotate",
    name: "Rotate PDF",
    description: "Rotate pages by 90°/180°/270°.",
    category: "Basic Tools",
    accent: "vermilion",
    useCases: [
      "Fix sideways scans in a single pass",
      "Correct mixed-orientation pages from a phone camera",
      "Prepare landscape exhibits for reading"
    ]
  },
  {
    slug: "extract-pages",
    name: "Extract Pages",
    description: "Pull specific pages into a new file.",
    category: "Basic Tools",
    accent: "cobalt",
    useCases: [
      "Pull a signed signature page from a contract",
      "Collect specific figures or tables into a new file",
      "Grab a single page for quick reference"
    ]
  },
  {
    slug: "delete-pages",
    name: "Delete Pages",
    description: "Remove specific pages from a PDF.",
    category: "Basic Tools",
    accent: "vermilion",
    useCases: [
      "Remove blank or duplicate pages from a scan",
      "Strip internal drafts before sending externally",
      "Drop cover pages you no longer need"
    ]
  },
  {
    slug: "reorder",
    name: "Reorder Pages",
    description: "Change the order of pages in a PDF.",
    category: "Basic Tools",
    accent: "olive",
    useCases: [
      "Put scanned pages back into the correct sequence",
      "Move an executive summary to the front",
      "Rearrange forms before signing"
    ]
  },
  // Convert Tools
  {
    slug: "pdf-to-text",
    name: "PDF to Text",
    description: "Extract selectable text from PDFs.",
    category: "Convert Tools",
    accent: "cobalt",
    useCases: [
      "Extract copy for editing or translation",
      "Feed text into search or an index",
      "Pull data out of an invoice or statement"
    ]
  },
  {
    slug: "pdf-to-images",
    name: "PDF to Images",
    description: "Export PDF pages as JPG or PNG.",
    category: "Convert Tools",
    accent: "vermilion",
    useCases: [
      "Turn slides into shareable images",
      "Create thumbnails for a catalogue",
      "Post a single page to social media"
    ]
  },
  {
    slug: "images-to-pdf",
    name: "Images to PDF",
    description: "Convert JPG/PNG images into a PDF.",
    category: "Convert Tools",
    accent: "olive",
    useCases: [
      "Combine phone photos into one document",
      "Build a portfolio or receipt bundle",
      "Convert whiteboard shots into a PDF"
    ]
  },
  {
    slug: "pdf-to-office",
    name: "PDF to DOCX",
    description: "Convert PDF to Word document.",
    category: "Convert Tools",
    accent: "cobalt",
    useCases: [
      "Edit the wording of a locked report",
      "Reuse layouts in a new document",
      "Hand off to a colleague who works in Word"
    ]
  },
  {
    slug: "pdf-to-html",
    name: "PDF to HTML",
    description: "Convert PDF to HTML representation.",
    category: "Convert Tools",
    accent: "olive",
    useCases: [
      "Publish a document on the web",
      "Make a PDF readable on mobile browsers",
      "Embed content in a CMS"
    ]
  },
  {
    slug: "ocr",
    name: "OCR PDF",
    description: "Extract text from scanned/image PDFs.",
    category: "Convert Tools",
    accent: "cobalt",
    useCases: [
      "Make a scanned contract searchable",
      "Digitise printed archives",
      "Extract text from photographed pages"
    ]
  },
  // Edit Tools
  {
    slug: "watermark-text",
    name: "Text Watermark",
    description: "Apply text watermarks across your PDF.",
    category: "Edit Tools",
    accent: "vermilion",
    useCases: [
      "Mark drafts as confidential",
      "Brand every page with your company name",
      "Add a tracking label before sharing"
    ]
  },
  {
    slug: "watermark-image",
    name: "Image Watermark",
    description: "Stamp a logo or image watermark.",
    category: "Edit Tools",
    accent: "cobalt",
    useCases: [
      "Stamp a logo on outgoing documents",
      "Apply a signature or seal",
      "Protect proofs with a visible mark"
    ]
  },
  {
    slug: "annotate",
    name: "Text Annotations",
    description: "Add text notes and highlights to PDFs.",
    category: "Edit Tools",
    accent: "olive",
    useCases: [
      "Leave review notes for a colleague",
      "Highlight key clauses",
      "Add sign-off comments to a proof"
    ]
  },
  {
    slug: "page-numbers",
    name: "Add Page Numbers",
    description: "Add page numbers to all pages.",
    category: "Edit Tools",
    accent: "vermilion",
    useCases: [
      "Number the pages of a printed report",
      "Add Bates-style numbering for legal files",
      "Keep multi-part documents in order"
    ]
  },
  {
    slug: "metadata",
    name: "Edit Metadata",
    description: "Edit title, author, and subject metadata.",
    category: "Edit Tools",
    accent: "cobalt",
    useCases: [
      "Set a clear title for search and sharing",
      "Correct the author on a published file",
      "Tag documents with a subject or keywords"
    ]
  },
  // Security/Privacy Tools
  {
    slug: "redact",
    name: "Redact PDF",
    description: "Black out sensitive areas in PDFs.",
    category: "Security/Privacy",
    accent: "vermilion",
    useCases: [
      "Black out personal data before release",
      "Hide account numbers in a statement",
      "Prepare documents for public disclosure"
    ]
  },
  // Advanced Tools
  {
    slug: "compare",
    name: "Compare PDFs",
    description: "Compare text content of two PDFs.",
    category: "Advanced Tools",
    accent: "cobalt",
    useCases: [
      "Spot changes between two contract versions",
      "Verify a proof against the final copy",
      "Check that edits were applied correctly"
    ]
  },
  {
    slug: "flatten",
    name: "Flatten PDF",
    description: "Remove interactivity for print-ready output.",
    category: "Advanced Tools",
    accent: "olive",
    useCases: [
      "Lock form fields for print",
      "Remove interactive layers before archiving",
      "Guarantee identical output on every viewer"
    ]
  },
  {
    slug: "n-up",
    name: "N-up PDF",
    description: "Arrange 2 or 4 pages per sheet.",
    category: "Advanced Tools",
    accent: "vermilion",
    useCases: [
      "Print two or four pages per sheet to save paper",
      "Create handouts from slides",
      "Condense a long report for review"
    ]
  },
  {
    slug: "resize",
    name: "Resize PDF",
    description: "Change page dimensions (A4, Letter, etc.).",
    category: "Advanced Tools",
    accent: "cobalt",
    useCases: [
      "Match a required page size such as A4 or Letter",
      "Fit a document to a specific printer",
      "Normalise mixed page sizes"
    ]
  },
  {
    slug: "booklet",
    name: "Booklet",
    description: "Reorder pages for booklet printing.",
    category: "Advanced Tools",
    accent: "olive",
    useCases: [
      "Print a folded booklet or zine",
      "Prepare a programme for an event",
      "Impose pages for saddle-stitch binding"
    ]
  },
  {
    slug: "repair",
    name: "Repair PDF",
    description: "Fix corrupted or damaged PDFs.",
    category: "Advanced Tools",
    accent: "vermilion",
    useCases: [
      "Open a PDF that will not load",
      "Recover a file after a failed download",
      "Rebuild a document with a damaged structure"
    ]
  },
  {
    slug: "extract-images",
    name: "Extract Images",
    description: "Download embedded images from PDFs.",
    category: "Advanced Tools",
    accent: "cobalt",
    useCases: [
      "Reuse photos embedded in a report",
      "Collect figures for a presentation",
      "Recover images from a scanned document"
    ]
  }
] as const satisfies readonly Tool[];

export type ToolSlug = (typeof tools)[number]["slug"];

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getRelatedTools(slug: string, limit = 4): Tool[] {
  const tool = getTool(slug);
  if (!tool) return [];
  const sameCategory = tools.filter(
    (t) => t.category === tool.category && t.slug !== slug
  );
  const others = tools.filter(
    (t) => t.category !== tool.category && t.slug !== tool.slug
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export const toolAccentClass: Record<Tool["accent"], string> = {
  vermilion: "text-vermilion",
  cobalt: "text-cobalt",
  olive: "text-olive"
};

export const toolAccentHex: Record<Tool["accent"], string> = {
  vermilion: "#d93a11",
  cobalt: "#1b3aa3",
  olive: "#5c6b2a"
};
