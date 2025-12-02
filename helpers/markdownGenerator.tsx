import { Selectable } from "kysely";
import {
  Policies,
  OrganizationDownloadSettings,
  LayoutTemplates,
  PortalLayoutOverrides,
  Organizations,
  OrganizationVariables,
} from "./schema";
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
 * Converts an array of TextSpan objects into a single Markdown string.
 * @param spans The TextSpan objects to convert.
 * @returns A Markdown formatted string.
 */
function textSpansToMarkdown(spans: TextSpan[]): string {
  return spans
    .map((span) => {
      let text = span.text;
      if (span.bold) text = `**${text}**`;
      if (span.italic) text = `*${text}*`;
      if (span.strikethrough) text = `~~${text}~~`;
      // Note: Markdown doesn't have a standard syntax for underline.
      return text;
    })
    .join("");
}

/**
 * Converts a single ContentBlock object into its Markdown representation.
 * @param block The ContentBlock to convert.
 * @returns A Markdown formatted string for the block.
 */
function contentBlockToMarkdown(block: ContentBlock): string {
  switch (block.type) {
    case "heading":
      const headingPrefix = "#".repeat(block.level);
      return `${headingPrefix} ${textSpansToMarkdown(block.children)}\n\n`;

    case "paragraph":
      return `${textSpansToMarkdown(block.children)}\n\n`;

    case "list":
      return (
        block.items
          .map((item, index) => {
            const marker = block.listType === "ordered" ? `${index + 1}.` : "-";
            return `${marker} ${textSpansToMarkdown(item.children)}`;
          })
          .join("\n") + "\n\n"
      );

    default:
      return "";
  }
}

/**
 * Generates a policy document in Markdown format.
 *
 * @param input The data required for document generation.
 * @param filename The desired filename for the generated document.
 * @returns A promise that resolves to a GeneratedDocument object.
 */
export async function generateMarkdown(
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

  // Parse the HTML content from the policy into a structured AST.
  const contentBlocks = parseLexicalHtml(policy.content);

  // Check if content already has a title as the first heading
  const hasTitle = contentBlocks.length > 0 && 
    contentBlocks[0].type === "heading" && 
    contentBlocks[0].level === 1 &&
    contentBlocks[0].children.some(span => 
      span.text.toLowerCase().includes(policy.title.toLowerCase())
    );

  // Start with the policy title as a level 1 heading only if not already present
  let content = "";
  if (!hasTitle) {
    content = `# ${policy.title}\n\n`;
  }

  // Convert each content block from the AST into its Markdown equivalent.
  contentBlocks.forEach((block) => {
    content += contentBlockToMarkdown(block);
  });

  // If metadata is enabled in settings, render and prepend it.
  if (settings?.showMetadata) {
    const layoutInput: LayoutRenderInput = {
      policy,
      organization,
      organizationVariables,
      baseLayout: layoutTemplate || null,
      portalOverrides,
    };

    const renderedLayout = renderLayout(layoutInput);

    if (renderedLayout.metadata) {
      const metadataPairs = parseMetadata(renderedLayout.metadata);
      
      if (metadataPairs.length > 0) {
        // Generate markdown table without headers
        const metadataTable = metadataPairs
          .map(pair => `| ${pair.field || ""} | ${pair.value || ""} |`)
          .join('\n');
        
        // Prepend metadata table to the main content
        content = `${metadataTable}\n\n${content}`;
      }
    }
  }

  const base64Data = btoa(unescape(encodeURIComponent(content)));
  const contentLength = new TextEncoder().encode(content).length;
  return {
    data: base64Data,
    mimeType: "text/markdown",
    filename,
    fileSize: contentLength,
  };
}