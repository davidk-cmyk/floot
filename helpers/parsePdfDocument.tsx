import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
}

export const parsePdfDocument = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    const data = new Uint8Array(pdfBuffer);

    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdfDocument = await loadingTask.promise;

    const pageTexts: string[] = [];
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      pageTexts.push(pageText);
    }

    return pageTexts.join('\n\n');
  } catch (error: unknown) {
    console.error("Failed to parse PDF document:", error);
    if (error instanceof Error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during PDF parsing.");
  }
};
