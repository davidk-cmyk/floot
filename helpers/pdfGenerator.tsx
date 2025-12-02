import { Selectable } from "kysely";
import {
  Policies,
  OrganizationDownloadSettings,
  LayoutTemplates,
  PortalLayoutOverrides,
  Organizations,
  OrganizationVariables,
} from "./schema";
import { jsPDF } from "jspdf";
import { renderLayout, LayoutRenderInput } from "./layoutRenderer";
import { parseLexicalHtml, ContentBlock, TextSpan } from "./contentParser";
import { parseMetadata } from "./metadataParser";

// Type definitions shared across document generators
type DownloadFormat = "pdf" | "docx" | "md";

type GeneratedDocument = {
  data: string; // base64 encoded
  mimeType: string;
  filename: string;
  fileSize: number; // in bytes
};

export type DocumentGenerationInput = {
  policy: Selectable<Policies>;
  organization: Selectable<Organizations>;
  organizationVariables: Selectable<OrganizationVariables>[];
  settings: Selectable<OrganizationDownloadSettings> | null;
  layoutTemplate?: Selectable<LayoutTemplates> | null;
  portalOverrides?: Selectable<PortalLayoutOverrides> | null;
  format: DownloadFormat;
};

/**
 * Renders a formatted TextSpan onto the jsPDF document.
 * @param doc The jsPDF instance.
 * @param span The TextSpan to render.
 * @param x The x-coordinate.
 * @param y The y-coordinate.
 * @returns The width of the rendered text.
 */
function renderTextSpanToPdf(
  doc: jsPDF,
  span: TextSpan,
  x: number,
  y: number
): number {
  let fontStyle = "normal";
  if (span.bold && span.italic) {
    fontStyle = "bolditalic";
  } else if (span.bold) {
    fontStyle = "bold";
  } else if (span.italic) {
    fontStyle = "italic";
  }

  doc.setFont("helvetica", fontStyle);
  // Underline and strikethrough require drawing lines
  const textWidth = doc.getTextWidth(span.text);
  doc.text(span.text, x, y);

  if (span.underline) {
    doc.line(x, y + 1, x + textWidth, y + 1);
  }
  if (span.strikethrough) {
    const fontSize = doc.getFontSize();
    doc.line(x, y - fontSize / 4, x + textWidth, y - fontSize / 4);
  }

  return textWidth;
}

/**
 * Renders an array of TextSpans with proper formatting on a single line.
 * @param doc The jsPDF instance.
 * @param spans The TextSpan array to render.
 * @param x The starting x-coordinate.
 * @param y The y-coordinate.
 * @param maxWidth The maximum width available.
 * @returns The total width used.
 */
function renderTextSpansLine(
  doc: jsPDF,
  spans: TextSpan[],
  x: number,
  y: number,
  maxWidth: number
): number {
  let currentX = x;
  for (const span of spans) {
    const spanWidth = renderTextSpanToPdf(doc, span, currentX, y);
    currentX += spanWidth;
    if (currentX > x + maxWidth) break; // Stop if we exceed max width
  }
  return currentX - x;
}

/**
 * Renders an array of TextSpans with text wrapping and proper formatting.
 * @param doc The jsPDF instance.
 * @param spans The TextSpan array to render.
 * @param x The starting x-coordinate.
 * @param y The starting y-coordinate.
 * @param maxWidth The maximum width available.
 * @param paragraphLineHeight The height per line.
 * @returns The total height used.
 */
function renderTextSpansWrapped(
  doc: jsPDF,
  spans: TextSpan[],
  x: number,
  y: number,
  maxWidth: number,
  paragraphLineHeight: number
): number {
  let currentY = y;
  let currentLine: TextSpan[] = [];
  let currentLineWidth = 0;

  // Helper to flush current line
  const flushLine = () => {
    if (currentLine.length > 0) {
      renderTextSpansLine(doc, currentLine, x, currentY, maxWidth);
      currentY += paragraphLineHeight;
      currentLine = [];
      currentLineWidth = 0;
    }
  };

  // Set font to normal to measure text properly
  doc.setFont("helvetica", "normal");
  const baseCharWidth = doc.getTextWidth("M"); // Approximate character width

  for (const span of spans) {
    const words = span.text.split(" ");
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordSpan: TextSpan = { ...span, text: word + (i < words.length - 1 ? " " : "") };
      
      // Estimate word width (not perfect but good enough for wrapping)
      const estimatedWidth = wordSpan.text.length * baseCharWidth;
      
      if (currentLineWidth + estimatedWidth > maxWidth && currentLine.length > 0) {
        flushLine();
      }
      
      currentLine.push(wordSpan);
      currentLineWidth += estimatedWidth;
    }
  }
  
  flushLine(); // Flush remaining content
  return currentY - y;
}

/**
 * Generates a policy document in PDF format.
 *
 * @param input The data required for document generation.
 * @param filename The desired filename for the generated document.
 * @returns A promise that resolves to a GeneratedDocument object.
 */
export async function generatePdf(
  input: DocumentGenerationInput,
  filename: string
): Promise<GeneratedDocument> {
  const {
    policy,
    organization,
    organizationVariables,
    settings,
    layoutTemplate,
    portalOverrides,
  } = input;

  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let currentPage = 1;

  const contentBlocks = parseLexicalHtml(policy.content);

  const checkPageBreak = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin - 15) {
      // Leave space for footer
      currentPage++;
      doc.addPage();
      y = margin;
    }
  };

  // Render header for the first page
  const firstPageLayoutInput: LayoutRenderInput = {
    policy,
    organization,
    organizationVariables,
    baseLayout: layoutTemplate || null,
    portalOverrides,
    documentContext: { pageNumber: 1, totalPages: 1 }, // totalPages is unknown, will be updated later
  };
  const firstPageLayout = renderLayout(firstPageLayoutInput);

  if (firstPageLayout.header) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(firstPageLayout.header, margin, y);
    y += 10;
  }

  // Add metadata if enabled
  if (settings?.showMetadata && firstPageLayout.metadata) {
    const metadataPairs = parseMetadata(firstPageLayout.metadata);
    
    if (metadataPairs.length > 0) {
      doc.setFontSize(9);
      const rowHeight = 8;
      const fieldWidth = contentWidth * 0.3;
      const valueWidth = contentWidth * 0.7;
      
      // Draw table
      metadataPairs.forEach((pair, index) => {
        const currentY = y + (index * rowHeight);
        
        // Check if we need a page break
        checkPageBreak(rowHeight);
        
        // Draw borders
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, currentY - 2, fieldWidth, rowHeight);
        doc.rect(margin + fieldWidth, currentY - 2, valueWidth, rowHeight);
        
        // Draw field name (bold)
        doc.setFont("helvetica", "bold");
        doc.text(pair.field || "", margin + 2, currentY + 3);
        
        // Draw value (normal)
        doc.setFont("helvetica", "normal");
        const valueLines = doc.splitTextToSize(pair.value || "", valueWidth - 4);
        doc.text(valueLines, margin + fieldWidth + 2, currentY + 3);
      });
      
      y += metadataPairs.length * rowHeight + 10;
    }
  }

  // Check if content already has a title as the first heading
  const hasTitle = contentBlocks.length > 0 && 
    contentBlocks[0].type === "heading" && 
    contentBlocks[0].level === 1 &&
    contentBlocks[0].children.some(span => 
      span.text.toLowerCase().includes(policy.title.toLowerCase())
    );
  
  // Add title only if not already present in content
  if (!hasTitle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const titleLines = doc.splitTextToSize(policy.title, contentWidth);
    checkPageBreak(titleLines.length * 10);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 10 + 5;
  }

  // Declare line height variables at function scope to avoid case block scoping issues
  let headingLineHeight: number;
  let paragraphLineHeight: number;

  // Process content blocks
  contentBlocks.forEach((block) => {
    switch (block.type) {
      case "heading":
        // Use proper font hierarchy: 18px for H1, 16px for H2, 14px for H3
        const headingSizes = { 1: 18, 2: 16, 3: 14, 4: 12, 5: 11, 6: 10 };
        const headingSize = headingSizes[block.level as keyof typeof headingSizes] || 12;
        headingLineHeight = headingSize * 0.8;
        
        checkPageBreak(headingLineHeight + 4);
        doc.setFontSize(headingSize);
        
        // Process TextSpans individually to preserve formatting
        const headingHeight = renderTextSpansWrapped(
          doc, 
          block.children, 
          margin, 
          y, 
          contentWidth, 
          headingLineHeight
        );
        y += headingHeight + 4;
        break;

      case "paragraph":
        doc.setFontSize(12);
        paragraphLineHeight = 7;
        
        // Estimate required height for page break check
        const estimatedLines = Math.ceil(
          block.children.reduce((acc, span) => acc + span.text.length, 0) / 80
        );
        checkPageBreak(estimatedLines * paragraphLineHeight);
        
        // Process TextSpans individually to preserve formatting
        const paragraphHeight = renderTextSpansWrapped(
          doc, 
          block.children, 
          margin, 
          y, 
          contentWidth, 
          paragraphLineHeight
        );
        y += paragraphHeight + 5;
        break;

      case "list":
        doc.setFontSize(12);
        block.items.forEach((item, index) => {
          const marker = block.listType === "ordered" ? `${index + 1}.` : "•";
          paragraphLineHeight = 7;
          
          // Estimate required height
          const estimatedLines = Math.ceil(
            item.children.reduce((acc, span) => acc + span.text.length, 0) / 70
          );
          checkPageBreak(estimatedLines * paragraphLineHeight);
          
          // Render marker
          doc.setFont("helvetica", "normal");
          doc.text(marker, margin, y);
          
          // Process item TextSpans individually to preserve formatting
          const itemHeight = renderTextSpansWrapped(
            doc, 
            item.children, 
            margin + 8, 
            y, 
            contentWidth - 8, 
            paragraphLineHeight
          );
          y += itemHeight + 2;
        });
        y += 5;
        break;
    }
  });

  // Add footers to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageLayoutInput: LayoutRenderInput = {
      ...firstPageLayoutInput,
      documentContext: { pageNumber: i, totalPages: pageCount },
    };
    const pageLayout = renderLayout(pageLayoutInput);

    if (pageLayout.footer) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const pageNumFormat =
        settings?.pageNumberFormat === "simple"
          ? `Page ${i}`
          : `Page ${i} of ${pageCount}`;
      doc.text(
        `${pageLayout.footer} | ${pageNumFormat}`,
        margin,
        pageHeight - 10
      );
    }
  }

  const dataUri = doc.output("datauristring");
  const base64Data = dataUri.substring(dataUri.indexOf(",") + 1);
  // Calculate binary size from base64 data (more accurate than Buffer approach)
  const binaryLength = Math.ceil(base64Data.length * 3 / 4);

  return {
    data: base64Data,
    mimeType: "application/pdf",
    filename,
    fileSize: binaryLength,
  };
}