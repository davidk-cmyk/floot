import { Selectable } from "kysely";
import {
  Policies,
  OrganizationDownloadSettings,
  LayoutTemplates,
  PortalLayoutOverrides,
  Organizations,
  OrganizationVariables,
} from "./schema";
import { generateMarkdown } from "./markdownGenerator";
import { generateDocx } from "./docxGenerator";
import { generatePdf } from "./pdfGenerator";

type DownloadFormat = "pdf" | "docx" | "md";

type GeneratedDocument = {
  data: string; // base64 encoded
  mimeType: string;
  filename: string;
  fileSize: number; // in bytes
};

// Enhanced input type for the new system
export type DocumentGenerationInput = {
  policy: Selectable<Policies>;
  organization: Selectable<Organizations>;
  organizationVariables: Selectable<OrganizationVariables>[];
  settings: Selectable<OrganizationDownloadSettings> | null;
  layoutTemplate?: Selectable<LayoutTemplates> | null;
  portalOverrides?: Selectable<PortalLayoutOverrides> | null;
  format: DownloadFormat;
};

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes
}

// Enhanced main function with new layout system
export async function generateDocument(
  input: DocumentGenerationInput
): Promise<GeneratedDocument> {
  const { policy, format } = input;
  const filename = `${createSlug(policy.title)}.${format}`;

  switch (format) {
    case "md":
      return generateMarkdown(input, filename);
    case "docx":
      return generateDocx(input, filename);
    case "pdf":
      return generatePdf(input, filename);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// Backward compatibility function
export async function generateDocumentLegacy(
  policy: Selectable<Policies>,
  format: DownloadFormat,
  settings: Selectable<OrganizationDownloadSettings> | null
): Promise<GeneratedDocument> {
  // Create a minimal input for backward compatibility
  const input: DocumentGenerationInput = {
    policy,
    organization: { id: 0, name: "Unknown Organization", slug: "unknown", createdAt: new Date(), updatedAt: new Date(), domain: null, isActive: true },
    organizationVariables: [],
    settings,
    format,
  };
  
  return generateDocument(input);
}