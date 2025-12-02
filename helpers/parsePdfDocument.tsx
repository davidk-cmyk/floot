import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Set workerSrc to an empty string for serverless/Node.js environments.
// This prevents pdfjs-dist from trying to load a worker script, which is not available.
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

/**
 * Parses a PDF file from a Buffer and extracts its text content.
 *
 * @param pdfBuffer The Buffer containing the PDF file data.
 * @returns A promise that resolves to the extracted text content as a single string.
 *          Paragraphs are separated by double newlines.
 * @throws An error if the PDF parsing fails.
 */
export const parsePdfDocument = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    // pdfjs-dist's getDocument expects a typed array.
    const data = new Uint8Array(pdfBuffer);

    const loadingTask = pdfjsLib.getDocument(data);
    const pdfDocument = await loadingTask.promise;

    const pageTexts: string[] = [];
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text from each item and join them to form the page's content.
      // A simple space join is used here. More complex logic could be added to
      // reconstruct paragraphs based on positioning if needed.
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      pageTexts.push(pageText);
    }

    // Join the text from all pages, separating each page's content with a double newline
    // to simulate paragraph breaks between pages.
    return pageTexts.join('\n\n');
  } catch (error: unknown) {
    console.error("Failed to parse PDF document:", error);
    if (error instanceof Error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during PDF parsing.");
  }
};