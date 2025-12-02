import { Selectable } from "kysely";
import {
  LayoutTemplates,
  PortalLayoutOverrides,
  Policies,
  Organizations,
  OrganizationVariables,
} from "./schema";
import { processVariables, VariableDataContext } from "./variableProcessor";

// --- TYPE DEFINITIONS ---

/**
 * Represents the fully rendered layout components after processing.
 */
export type RenderedLayout = {
  header: string;
  footer: string;
  metadata: string;
};

/**
 * Input data required for rendering a layout.
 */
export type LayoutRenderInput = {
  policy: Selectable<Policies>;
  organization: Selectable<Organizations>;
  organizationVariables: Selectable<OrganizationVariables>[];
  // The base layout template to use (e.g., from organization settings)
  baseLayout: Selectable<LayoutTemplates> | null;
  // Optional portal-specific overrides
  portalOverrides?: Selectable<PortalLayoutOverrides> | null;
  // Optional document-specific context for variables like page numbers
  documentContext?: {
    pageNumber?: number;
    totalPages?: number;
  };
};

// --- HELPER FUNCTIONS ---

/**
 * Constructs the full data context required by the variableProcessor.
 * @param input The layout render input data.
 * @returns A `VariableDataContext` object.
 */
const buildVariableContext = (
  input: LayoutRenderInput
): VariableDataContext => {
  const { policy, organization, organizationVariables, documentContext } = input;

  // Map custom variables into a simpler key-value object
  const customVars = organizationVariables.reduce((acc, v) => {
    if (v.variableValue) {
      acc[v.variableName] = v.variableValue;
    }
    return acc;
  }, {} as Record<string, string>);

  return {
    policy: {
      title: policy.title,
      currentVersion: policy.currentVersion,
      effectiveDate: policy.effectiveDate,
      department: policy.department,
      category: policy.category,
      tags: policy.tags,
      expirationDate: policy.expirationDate,
    },
    organization: {
      name: organization.name,
      // Assuming these standard fields are stored in organizationVariables
      email: customVars.email ?? null,
      address: customVars.address ?? null,
      phone: customVars.phone ?? null,
      custom: customVars,
    },
    document: {
      ...documentContext,
      printDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      printTime: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  };
};

// --- CORE RENDERING FUNCTION ---

/**
 * Renders a complete document layout, including header, footer, and metadata.
 * It applies portal-specific overrides and uses the variableProcessor to inject dynamic content.
 *
 * @param input - An object containing all necessary data for rendering.
 * @returns A `RenderedLayout` object with the processed header, footer, and metadata strings.
 */
export const renderLayout = (input: LayoutRenderInput): RenderedLayout => {
  const { baseLayout, portalOverrides } = input;

  // Determine the final templates to use, applying overrides where they exist.
  // An empty string in an override is treated as an intentional blanking of the section.
  const finalHeaderTemplate =
    portalOverrides?.headerOverride !== null &&
    portalOverrides?.headerOverride !== undefined
      ? portalOverrides.headerOverride
      : baseLayout?.headerTemplate;

  const finalFooterTemplate =
    portalOverrides?.footerOverride !== null &&
    portalOverrides?.footerOverride !== undefined
      ? portalOverrides.footerOverride
      : baseLayout?.footerTemplate;

  const finalMetadataTemplate =
    portalOverrides?.metadataOverride !== null &&
    portalOverrides?.metadataOverride !== undefined
      ? portalOverrides.metadataOverride
      : baseLayout?.metadataTemplate;

  // Build the data context for variable substitution.
  const context = buildVariableContext(input);

  // Process each template with the dynamic data.
  const renderedHeader = processVariables(finalHeaderTemplate, context);
  const renderedFooter = processVariables(finalFooterTemplate, context);
  const renderedMetadata = processVariables(finalMetadataTemplate, context);

  return {
    header: renderedHeader,
    footer: renderedFooter,
    metadata: renderedMetadata,
  };
};