import { useMemo } from 'react';
import { Selectable } from 'kysely';
import { Policies, Portals, Organizations } from './schema';
import { useOrganization } from './useOrganization';
import { processCompanyNamePlaceholders } from './templateProcessorBackend';

// --- Type Definitions ---

// Using Selectable for DB-like structures, but picking fields for clarity.
export type DocumentPolicyData = Pick<
  Selectable<Policies>,
  'title' | 'effectiveDate' | 'expirationDate' | 'status'
> & {
  version?: number; // Version might come from policyVersions table
};

export type DocumentPortalData = Pick<Selectable<Portals>, 'name'>;

export type DocumentPageInfo = {
  pageNumber?: number;
  totalPages?: number;
};

export type DocumentTemplateContext = {
  policy?: Partial<DocumentPolicyData>;
  portal?: Partial<DocumentPortalData>;
  pageInfo?: DocumentPageInfo;
  organization?: Selectable<Organizations>;
};

// --- Helper Functions ---

/**
 * Formats a date object into a localized date string (e.g., "MM/DD/YYYY").
 * @param date - The date to format.
 * @returns A formatted date string or an empty string if the date is invalid.
 */
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    console.error('Invalid date provided to formatDate:', date, error);
    return '';
  }
};

// --- Core Processing Logic ---

/**
 * Processes a document template string (e.g., for headers/footers) by replacing
 * placeholders with dynamic data from the provided context.
 *
 * @param template - The template string containing placeholders like `[Policy Title]`.
 * @param context - An object containing policy, portal, page, and organization data.
 * @returns The processed string with placeholders replaced.
 */
export const processDocumentTemplate = (
  template: string | null | undefined,
  context: DocumentTemplateContext
): string => {
  if (!template) {
    return '';
  }

  // First, process general placeholders like [Company Name] using the existing processor.
  // This ensures consistency and reuses existing logic.
  let processed = processCompanyNamePlaceholders(template, context.organization);

  const { policy = {}, portal = {}, pageInfo = {} } = context;

  const variableMap: Record<string, string> = {
    // Policy variables
    '[Policy Title]': policy.title ?? '',
    '[Effective Date]': formatDate(policy.effectiveDate),
    '[Expiration Date]': formatDate(policy.expirationDate),
    '[Version]': policy.version?.toString() ?? '',
    '[Status]': policy.status ?? '',

    // Portal variables
    '[Portal Name]': portal.name ?? '',

    // Dynamic/Page variables
    '[Page Number]': pageInfo.pageNumber?.toString() ?? '',
    '[Total Pages]': pageInfo.totalPages?.toString() ?? '',
    '[Date]': formatDate(new Date()),
  };

  // Replace document-specific variables
  // Using a regex to find all placeholders in the format [Variable Name]
  processed = processed.replace(/\[([^\]]+)\]/g, (match: string, key: string) => {
    const fullKey = `[${key}]`;
    // Check if our specific map has this key.
    // This avoids replacing placeholders that might be handled by other systems (e.g., [Company Name]).
    if (Object.prototype.hasOwnProperty.call(variableMap, fullKey)) {
      return variableMap[fullKey];
    }
    // If not in our map, return the original placeholder.
    return match;
  });

  return processed;
};

// --- React Hook ---

/**
 * A React hook to process a document template string with data.
 * It automatically injects the current organization's data and memoizes the result
 * for performance.
 *
 * @param template - The template string to process.
 * @param data - An object containing policy, portal, and page info.
 * @returns The processed, ready-to-render string.
 */
export const useProcessedDocumentTemplate = (
  template: string | null | undefined,
  data: {
    policy?: Partial<DocumentPolicyData>;
    portal?: Partial<DocumentPortalData>;
    pageInfo?: DocumentPageInfo;
  }
): string => {
  const { organizationState } = useOrganization();

  const currentOrganization =
    organizationState.type === 'active' || organizationState.type === 'switching'
      ? organizationState.currentOrganization
      : undefined;

  const processedContent = useMemo(() => {
    if (!template) {
      return '';
    }

    const context: DocumentTemplateContext = {
      ...data,
      organization: currentOrganization,
    };

    return processDocumentTemplate(template, context);
  }, [template, data, currentOrganization]);

  return processedContent;
};