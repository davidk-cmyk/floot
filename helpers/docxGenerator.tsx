import { Selectable } from "kysely";
import {
  Policies,
  OrganizationDownloadSettings,
  LayoutTemplates,
  PortalLayoutOverrides,
  Organizations,
  OrganizationVariables,
} from "./schema";
import {
  Packer,
  Document,
  Paragraph,
  TextRun,
  Header,
  Footer,
  PageNumber,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
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
 * Converts an array of TextSpan objects into an array of DOCX TextRun objects.
 * @param spans The TextSpan objects to convert.
 * @returns An array of TextRun instances for use in a DOCX Paragraph.
 */
function textSpansToDocxRuns(spans: TextSpan[]): TextRun[] {
  return spans.map(
    (span) =>
      new TextRun({
        text: span.text,
        bold: span.bold || false,
        italics: span.italic || false,
        underline: span.underline ? {} : undefined,
        strike: span.strikethrough || false,
      })
  );
}

/**
 * Converts an array of ContentBlock objects into an array of DOCX Paragraphs.
 * @param blocks The ContentBlock objects from the AST.
 * @returns An array of Paragraph instances for the DOCX document body.
 */
function contentBlocksToDocxElements(blocks: ContentBlock[]): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];

  blocks.forEach((block) => {
    switch (block.type) {
      case "heading":
        const headingLevels: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        elements.push(
          new Paragraph({
            children: textSpansToDocxRuns(block.children),
            heading: headingLevels[block.level] || HeadingLevel.HEADING_1,
          })
        );
        break;

      case "paragraph":
        elements.push(
          new Paragraph({
            children: textSpansToDocxRuns(block.children),
          })
        );
        break;

      case "list":
        block.items.forEach((item) => {
          elements.push(
            new Paragraph({
              children: textSpansToDocxRuns(item.children),
              numbering: {
                reference:
                  block.listType === "ordered"
                    ? "numbered-list"
                    : "bulleted-list",
                level: 0,
              },
            })
          );
        });
        break;
    }
  });

  return elements;
}

/**
 * Generates a policy document in DOCX format.
 *
 * @param input The data required for document generation.
 * @param filename The desired filename for the generated document.
 * @returns A promise that resolves to a GeneratedDocument object.
 */
export async function generateDocx(
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

  const layoutInput: LayoutRenderInput = {
    policy,
    organization,
    organizationVariables,
    baseLayout: layoutTemplate || null,
    portalOverrides,
    documentContext: {
      pageNumber: 1,
      totalPages: 1, // DOCX calculates this automatically
    },
  };

  const renderedLayout = renderLayout(layoutInput);
    const documentChildren: (Paragraph | Table)[] = [];

  // Add metadata if enabled
  if (settings?.showMetadata && renderedLayout.metadata) {
    const metadataPairs = parseMetadata(renderedLayout.metadata);
    
    if (metadataPairs.length > 0) {
      const metadataTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: "none", size: 0 },
          bottom: { style: "none", size: 0 },
          left: { style: "none", size: 0 },
          right: { style: "none", size: 0 },
          insideHorizontal: { style: "none", size: 0 },
          insideVertical: { style: "none", size: 0 },
        },
        rows: metadataPairs.map(pair => new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({
                children: [new TextRun({
                  text: pair.field || "",
                  bold: true,
                  size: 20, // 10pt
                  color: "666666",
                })],
              })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [new Paragraph({
                children: [new TextRun({
                  text: pair.value || "",
                  size: 20, // 10pt
                  color: "666666",
                })],
              })],
            }),
          ],
        })),
      });
      
      documentChildren.push(metadataTable);
      documentChildren.push(new Paragraph("")); // Spacing
    }
  }

  // Parse HTML and convert to DOCX elements
  const contentBlocks = parseLexicalHtml(policy.content);
  
  // Check if content already has a title as the first heading
  const hasTitle = contentBlocks.length > 0 && 
    contentBlocks[0].type === "heading" && 
    contentBlocks[0].level === 1 &&
    contentBlocks[0].children.some(span => 
      span.text.toLowerCase().includes(policy.title.toLowerCase())
    );
  
  // Add title only if not already present in content
  if (!hasTitle) {
    documentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: policy.title, bold: true })],
        heading: HeadingLevel.HEADING_1,
      })
    );
  }
  
  const contentElements = contentBlocksToDocxElements(contentBlocks);
  documentChildren.push(...contentElements);

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 32, bold: true },
          paragraph: { spacing: { after: 240, before: 240 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 28, bold: true },
          paragraph: { spacing: { after: 200, before: 200 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 26, bold: true },
          paragraph: { spacing: { after: 160, before: 160 } },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bulleted-list",
          levels: [
            {
              level: 0,
              format: "bullet",
              text: "•",
              alignment: "left",
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: "numbered-list",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: "left",
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: renderedLayout.header
          ? {
              default: new Header({
                children: [new Paragraph(renderedLayout.header)],
              }),
            }
          : undefined,
        footers: renderedLayout.footer
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ children: [PageNumber.CURRENT] }),
                      new TextRun(` | ${renderedLayout.footer}`),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        children: documentChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const base64Data = btoa(String.fromCharCode(...uint8Array));
  return {
    data: base64Data,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename,
    fileSize: blob.size,
  };
}