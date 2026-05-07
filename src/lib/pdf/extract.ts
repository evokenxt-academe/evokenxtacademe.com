// lib/pdf/extract.ts
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function normalizePdfBuffer(input: Buffer): Buffer {
  const header = Buffer.from("%PDF-");
  const eof = Buffer.from("%%EOF");
  const start = input.indexOf(header);
  const end = input.lastIndexOf(eof);
  if (start === -1 || end === -1) return input;
  const sliced = input.slice(start, end + eof.length);
  return sliced.length > 0 ? sliced : input;
}

// ── Strategy 1: pdfjs-dist (ESM, v4+ and v5+) ────────────────────────────────
async function extractWithPdfJs(buffer: Buffer): Promise<string> {
  // v5 removed legacy/ — only build/ exists now. Try both paths.
  let pdfjs: any;
  const candidates = [
    "pdfjs-dist/build/pdf.mjs",       // v5+
    "pdfjs-dist/legacy/build/pdf.mjs", // v4
    "pdfjs-dist/build/pdf.js",         // very old
  ];

  for (const path of candidates) {
    try {
      pdfjs = await import(path);
      break;
    } catch {
      continue;
    }
  }

  if (!pdfjs?.getDocument) {
    throw new Error("pdfjs-dist not resolvable from any known path");
  }

  // Disable worker — mandatory for Next.js API routes (no DOM/Worker API)
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = "";
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    stopAtErrors: false,
  });

  const doc = await loadingTask.promise;

  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (text) pages.push(text);
        page.cleanup();
      } catch {
        // skip malformed page, keep going
      }
    }

    const result = pages.join("\n").trim();
    if (!result) throw new Error("pdfjs returned empty text");
    return result;
  } finally {
    await doc.destroy();
  }
}

// ── Strategy 2: pdf-parse (legacy CJS) ───────────────────────────────────────
async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  let parser: any;

  // Avoid the debug side-effect in Next.js by loading the impl directly
  try {
    parser = require("pdf-parse/lib/pdf-parse.js");
  } catch {
    try {
      parser = require("pdf-parse");
    } catch {
      throw new Error("pdf-parse not installed");
    }
  }

  // Handle both module shapes: { default: fn } | fn | { PDFParse }
  const fn =
    typeof parser === "function"
      ? parser
      : typeof parser?.default === "function"
      ? parser.default
      : null;

  if (!fn) throw new Error("pdf-parse: could not resolve parser function");

  const result = await fn(buffer);
  const text = result?.text?.trim();
  if (!text) throw new Error("pdf-parse returned empty text");
  return text;
}

// ── Strategy 3: buffer repair heuristics for bad XRef ────────────────────────
async function extractWithRepair(buffer: Buffer): Promise<string> {
  const normalized = normalizePdfBuffer(buffer);

  // Try pdfjs on normalized buffer
  if (!normalized.equals(buffer)) {
    try {
      return await extractWithPdfJs(normalized);
    } catch { /* continue */ }
  }

  // Inject synthetic trailer — recovers PDFs with mislocated xref table
  const patched = Buffer.concat([
    buffer,
    Buffer.from("\nstartxref\n0\n%%EOF\n"),
  ]);
  try {
    return await extractWithPdfJs(patched);
  } catch { /* continue */ }

  // Last resort: pdf-parse on normalized
  if (!normalized.equals(buffer)) {
    try {
      return await extractWithPdfParse(normalized);
    } catch { /* continue */ }
  }

  throw new Error("All repair strategies exhausted");
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const errors: string[] = [];

  // 1. Try pdfjs first (handles more edge cases than pdf-parse)
  try {
    return await extractWithPdfJs(buffer);
  } catch (e: any) {
    errors.push(`pdfjs: ${e.message}`);
  }

  // 2. Try pdf-parse
  try {
    return await extractWithPdfParse(buffer);
  } catch (e: any) {
    errors.push(`pdf-parse: ${e.message}`);
  }

  // 3. Try repair strategies (covers bad XRef, corrupted trailer, etc.)
  try {
    return await extractWithRepair(buffer);
  } catch (e: any) {
    errors.push(`repair: ${e.message}`);
  }

  // All failed — surface all errors so it's debuggable
  throw new Error(
    `PDF extraction failed after all strategies:\n${errors.join("\n")}`
  );
}