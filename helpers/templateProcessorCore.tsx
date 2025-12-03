import { Organization } from './Organization';

/**
 * Template Processor Core
 * Shared template processing logic for both frontend and backend.
 * This module contains no React dependencies and can be used anywhere.
 */

// TypeScript types for the variable structure
export interface OrganizationVariables {
  company?: Record<string, string | null | undefined>;
  leadership?: Record<string, string | null | undefined>;
  departments?: Record<string, string | null | undefined>;
  policies?: Record<string, string | null | undefined>;
  contact?: Record<string, string | null | undefined>;
  [category: string]: Record<string, string | null | undefined> | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  undefinedVariables: string[];
  invalidPaths: string[];
}

// Regex patterns
const DYNAMIC_VARIABLE_REGEX = /\/([a-zA-Z0-9_.]+)(?:\|([^/]+))?\//g;
const COMPANY_NAME_PLACEHOLDER_REGEX = /\[\s*(?:your company name|company name|organization name)\s*\]|\{\{\s*company name\s*\}\}|\{\s*company name\s*\}|\[Company Name\]/gi;

/**
 * Resolves a nested object path like 'company.name' or 'leadership.ceo'
 */
export function resolveObjectPath(obj: unknown, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  if (typeof current === 'string') {
    return current;
  }
  if (current === null || current === undefined) {
    return undefined;
  }
  return String(current);
}

/**
 * Applies formatting to a string value
 */
export function applyFormatting(value: string, format: string): string {
  switch (format.toLowerCase().trim()) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'capitalize':
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    case 'title':
      return value.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      );
    default:
      return value;
  }
}

const FORMAT_DIRECTIVES = ['uppercase', 'lowercase', 'capitalize', 'title'];

/**
 * Creates default organization variables from an Organization object
 */
export function createDefaultVariables(organization: Organization | undefined): OrganizationVariables {
  return {
    company: {
      name: organization?.name || '',
      email: '',
      address: '',
      phone: '',
    },
    leadership: {
      ceo: '',
      hrDirector: '',
      dpo: '',
    },
    departments: {
      hr: '',
      it: '',
      legal: '',
      finance: '',
    },
    policies: {
      workingHours: '',
      probationPeriod: '',
      annualLeave: '',
    },
    contact: {
      hrEmail: '',
      supportPhone: '',
    },
  };
}

/**
 * Merges default variables with custom variables from settings
 */
export function mergeVariables(
  defaultVars: OrganizationVariables,
  customVars: Partial<OrganizationVariables> | undefined
): OrganizationVariables {
  if (!customVars) {
    return defaultVars;
  }

  return {
    company: { ...defaultVars.company, ...customVars.company },
    leadership: { ...defaultVars.leadership, ...customVars.leadership },
    departments: { ...defaultVars.departments, ...customVars.departments },
    policies: { ...defaultVars.policies, ...customVars.policies },
    contact: { ...defaultVars.contact, ...customVars.contact },
  };
}

/**
 * Extracts all variable paths used in template content
 */
export function extractTemplateVariables(content: string | null | undefined): string[] {
  if (!content) {
    return [];
  }

  const variables: string[] = [];
  const regex = new RegExp(DYNAMIC_VARIABLE_REGEX.source, 'g');
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variablePath = match[1];
    if (!variables.includes(variablePath)) {
      variables.push(variablePath);
    }
  }

  return variables;
}

/**
 * Validates template content and returns information about undefined variables
 */
export function validateTemplateVariables(
  content: string | null | undefined,
  variables: OrganizationVariables
): ValidationResult {
  if (!content) {
    return { isValid: true, undefinedVariables: [], invalidPaths: [] };
  }

  const undefinedVariables: string[] = [];
  const invalidPaths: string[] = [];
  const regex = new RegExp(DYNAMIC_VARIABLE_REGEX.source, 'g');
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variablePath = match[1];
    const fallbackValue = match[2];

    try {
      const resolvedValue = resolveObjectPath(variables, variablePath);

      if (resolvedValue === undefined || resolvedValue === null || resolvedValue === '') {
        if (!fallbackValue) {
          undefinedVariables.push(variablePath);
        }
      }
    } catch {
      invalidPaths.push(variablePath);
    }
  }

  return {
    isValid: undefinedVariables.length === 0 && invalidPaths.length === 0,
    undefinedVariables,
    invalidPaths,
  };
}

/**
 * Replaces legacy company name placeholders with organization name
 */
export function processCompanyNamePlaceholders(
  content: string | null | undefined,
  organization: Organization | undefined
): string {
  if (!content) {
    return '';
  }
  if (!organization?.name) {
    return content;
  }

  return content.replace(COMPANY_NAME_PLACEHOLDER_REGEX, organization.name);
}

/**
 * Enhanced template processor that handles both legacy placeholders and new dynamic variables
 * This is the main processing function used by both frontend and backend.
 */
export function processTemplateContent(
  content: string | null | undefined,
  organization: Organization | undefined,
  organizationVariables: OrganizationVariables | undefined = undefined
): string {
  if (!content) {
    return '';
  }

  let processedContent = content;

  // Step 1: Handle legacy company name placeholders for backward compatibility
  processedContent = processCompanyNamePlaceholders(processedContent, organization);

  // Step 2: Handle dynamic variables with the new /variable.path/ syntax
  if (organizationVariables) {
    processedContent = processedContent.replace(
      DYNAMIC_VARIABLE_REGEX,
      (match, variablePath, fallbackOrFormat) => {
        try {
          const resolvedValue = resolveObjectPath(organizationVariables, variablePath);

          if (resolvedValue === undefined || resolvedValue === null || resolvedValue === '') {
            // If no value found, check if we have a fallback
            if (fallbackOrFormat && !FORMAT_DIRECTIVES.includes(fallbackOrFormat.toLowerCase().trim())) {
              return fallbackOrFormat;
            }
            // Return the original placeholder if no fallback
            return match;
          }

          const stringValue = String(resolvedValue);

          // Check if fallbackOrFormat is actually a format directive
          if (fallbackOrFormat && FORMAT_DIRECTIVES.includes(fallbackOrFormat.toLowerCase().trim())) {
            return applyFormatting(stringValue, fallbackOrFormat);
          }

          return stringValue;
        } catch {
          // Return original placeholder on error
          return match;
        }
      }
    );
  }

  return processedContent;
}

/**
 * Safely convert unknown settings data to OrganizationVariables type
 */
export function validateOrganizationVariables(data: unknown): OrganizationVariables {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }

  const result: OrganizationVariables = {};
  const obj = data as Record<string, unknown>;

  for (const [category, categoryData] of Object.entries(obj)) {
    if (categoryData && typeof categoryData === 'object' && !Array.isArray(categoryData)) {
      const categoryObj = categoryData as Record<string, unknown>;
      result[category] = {};

      for (const [key, value] of Object.entries(categoryObj)) {
        if (typeof value === 'string' || value === null) {
          result[category]![key] = value;
        } else if (value !== undefined) {
          result[category]![key] = String(value);
        }
      }
    }
  }

  return result;
}
