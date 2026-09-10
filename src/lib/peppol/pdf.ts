import type { PdfExtractionResult } from "./types";

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PAGES = 50;

export type PdfProgress = {
  stage: "loading" | "page" | "done";
  page: number;
  total: number;
};

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

export async function extractPdfText(
  file: File,
  onProgress?: (p: PdfProgress) => void,
): Promise<PdfExtractionResult> {
  if (file.size > MAX_BYTES) {
    return {
      success: false,
      fullText: "",
      pages: [],
      pageCount: 0,
      error: {
        code: "TOO_LARGE",
        userMessage: `This PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB. The in-browser limit is 20 MB — split the file or export a smaller PDF.`,
      },
    };
  }

  try {
    const pdfjs = await loadPdfjs();
    onProgress?.({ stage: "loading", page: 0, total: 0 });
    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data, password: "" });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const limit = Math.min(pageCount, MAX_PAGES);
    const pages: { pageNumber: number; text: string }[] = [];

    for (let i = 1; i <= limit; i += 1) {
      onProgress?.({ stage: "page", page: i, total: limit });
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // pdf.js returns positioned text fragments rather than semantic lines.
      // Preserve the visual line structure so invoice extraction can distinguish
      // labels, totals and line items instead of receiving one giant paragraph.
      const positioned = content.items
        .filter((item): item is typeof item & { str: string; transform: number[] } =>
          "str" in item && typeof item.str === "string" && Array.isArray(item.transform),
        )
        .map((item) => ({
          text: item.str,
          x: item.transform[4] ?? 0,
          y: item.transform[5] ?? 0,
        }))
        .filter((item) => item.text.trim().length > 0);

      const lineGroups: { y: number; items: { text: string; x: number }[] }[] = [];
      for (const item of positioned) {
        let group = lineGroups.find((candidate) => Math.abs(candidate.y - item.y) <= 2.5);
        if (!group) {
          group = { y: item.y, items: [] };
          lineGroups.push(group);
        }
        group.items.push({ text: item.text, x: item.x });
      }
      lineGroups.sort((a, b) => b.y - a.y);
      const text = lineGroups
        .map((group) => group.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" ").trim())
        .filter(Boolean)
        .join("\n");
      pages.push({ pageNumber: i, text });
    }

    const fullText = pages
      .map((p) => p.text)
      .join("\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ");

    if (!fullText.replace(/\s/g, "").length) {
      return {
        success: false,
        fullText: "",
        pages,
        pageCount,
        error: {
          code: "NO_TEXT",
          userMessage:
            "This PDF has no extractable text. Scanned invoices need OCR, which we do not run in your browser. Export a text-based PDF from your accounting tool, or fill the fields by hand.",
        },
      };
    }

    onProgress?.({ stage: "done", page: limit, total: limit });
    return { success: true, fullText, pages, pageCount };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/password/i.test(msg)) {
      return {
        success: false,
        fullText: "",
        pages: [],
        pageCount: 0,
        error: {
          code: "PASSWORD",
          userMessage: "This PDF is password-protected. Remove the password and try again.",
        },
      };
    }
    return {
      success: false,
      fullText: "",
      pages: [],
      pageCount: 0,
      error: {
        code: /corrupt|invalid/i.test(msg) ? "CORRUPT" : "UNKNOWN",
        userMessage: "We could not read this PDF. Try re-exporting it from the original tool.",
      },
    };
  }
}

export async function renderPdfPage(file: File, pageNumber = 1, target: HTMLCanvasElement) {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));
  const unscaled = page.getViewport({ scale: 1 });
  const scale = Math.min(1.6, 560 / unscaled.width);
  const viewport = page.getViewport({ scale });
  target.width = viewport.width;
  target.height = viewport.height;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  await page.render({ canvasContext: ctx, viewport }).promise;
}
