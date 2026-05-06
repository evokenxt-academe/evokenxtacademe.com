import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type PdfTextResult = {
  text?: string;
};

type ModernPdfParser = {
  getText: () => Promise<PdfTextResult>;
  destroy?: () => Promise<void>;
};

type ModernPdfParserConstructor = new (options: {
  data: Buffer | Uint8Array;
  disableWorker?: boolean;
}) => ModernPdfParser;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // In pdf-parse@1.x, package root can execute a debug path that reads test files.
  // Load the parser implementation directly to avoid that side-effect in Next runtime.
  let pdfParseModule: any;
  try {
    pdfParseModule = require("pdf-parse/lib/pdf-parse.js");
  } catch {
    pdfParseModule = require("pdf-parse");
  }

  const ModernParser: ModernPdfParserConstructor | undefined =
    pdfParseModule?.PDFParse ?? pdfParseModule?.default?.PDFParse;

  if (ModernParser) {
    const parser = new ModernParser({
      data: buffer,
      // Server/API runtime: avoid worker chunk resolution issues in Next.js.
      disableWorker: true,
    });

    try {
      const result = await parser.getText();
      return result?.text ?? "";
    } finally {
      await parser.destroy?.().catch(() => {});
    }
  }

  const legacyParser = pdfParseModule?.default ?? pdfParseModule;
  if (typeof legacyParser === "function") {
    const result = await legacyParser(buffer);
    return result?.text ?? "";
  }

  throw new Error("Unsupported pdf-parse module format");
}
