import { Organization } from './Organization';

// TypeScript types for the variable structure
export interface OrganizationVariables {
  company: {
    name?: string;
    email?: string;
    address?: string;
    phone?: string;
  };
  leadership: {
    ceo?: string;
    hrDirector?: string;
    dpo?: string;
  };
  departments: {
    hr?: string;
    it?: string;
    legal?: string;
    finance?: string;
  };
  policies: {
    workingHours?: string;
    probationPeriod?: string;
    annualLeave?: string;
  };
  contact: {
    hrEmail?: string;
    supportPhone?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  undefinedVariables: string[];
  invalidPaths: string[];
}

// Regex patterns
const dynamicVariableRegex = /\/([a-zA-Z0-9_.]+)(?:\|([^/]+))?\//g;
const companyNamePlaceholderRegex = /\[\s*(?:your company name|company name|organization name)\s*\]|\{\{\s*company name\s*\}\}|\{\s*company name\s*\}/gi;

/**
 * Resolves a nested object path like 'company.name' or 'leadership.ceo'
 */
const resolveObjectPath = (obj: any, path: string): any => {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }

  return current;
};

/**
 * Applies formatting to a string value
 */
const applyFormatting = (value: string, format: string): string => {
  switch (format.toLowerCase().trim()) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'capitalize':
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    case 'title':
      return value.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    default:
      return value;
  }
};

/**
 * Creates default organization variables from an Organization object
 */
export const createDefaultVariables = (organization: Organization | undefined): OrganizationVariables => {
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
};

/**
 * Merges default variables with custom variables from settings
 */
export const mergeVariables = (
  defaultVars: OrganizationVariables,
  customVars: Partial<OrganizationVariables> | undefined
): OrganizationVariables => {
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
};

/**
 * Validates template content and returns information about undefined variables
 */
export const validateTemplateVariables = (
  content: string | null | undefined,
  variables: OrganizationVariables
): ValidationResult => {
  if (!content) {
    return { isValid: true, undefinedVariables: [], invalidPaths: [] };
  }

  const undefinedVariables: string[] = [];
  const invalidPaths: string[] = [];
  const matches = content.matchAll(dynamicVariableRegex);

  for (const match of matches) {
    const variablePath = match[1];
    const fallbackValue = match[2];

    try {
      const resolvedValue = resolveObjectPath(variables, variablePath);
      
      if (resolvedValue === undefined || resolvedValue === null || resolvedValue === '') {
        if (!fallbackValue) {
          undefinedVariables.push(variablePath);
        }
      }
    } catch (error) {
      invalidPaths.push(variablePath);
    }
  }

  return {
    isValid: undefinedVariables.length === 0 && invalidPaths.length === 0,
    undefinedVariables,
    invalidPaths,
  };
};

/**
 * Extracts all variable paths used in template content
 */
export const extractTemplateVariables = (content: string | null | undefined): string[] => {
  if (!content) {
    return [];
  }

  const variables: string[] = [];
  const matches = content.matchAll(dynamicVariableRegex);

  for (const match of matches) {
    const variablePath = match[1];
    if (!variables.includes(variablePath)) {
      variables.push(variablePath);
    }
  }

  return variables;
};

/**
 * Enhanced template processor that handles both legacy placeholders and new dynamic variables
 */
export const processTemplateContent = (
  content: string | null | undefined,
  organization: Organization | undefined,
  organizationVariables: OrganizationVariables | undefined = undefined
): string => {
  if (!content) {
    return '';
  }

  let processedContent = content;

  // Step 1: Handle legacy company name placeholders for backward compatibility
  if (organization?.name) {
    processedContent = processedContent.replace(companyNamePlaceholderRegex, organization.name);
  }

  // Step 2: Handle dynamic variables with the new /variable.path/ syntax
  if (organizationVariables) {
    processedContent = processedContent.replace(dynamicVariableRegex, (match, variablePath, fallbackOrFormat) => {
      try {
        const resolvedValue = resolveObjectPath(organizationVariables, variablePath);
        
        if (resolvedValue === undefined || resolvedValue === null || resolvedValue === '') {
          // If no value found, check if we have a fallback
          if (fallbackOrFormat) {
            return fallbackOrFormat;
          }
          // Return the original placeholder if no fallback
          console.warn(`Template variable not found: ${variablePath}`);
          return match;
        }

        const stringValue = String(resolvedValue);
        
        // Check if fallbackOrFormat is actually a format directive
        if (fallbackOrFormat && ['uppercase', 'lowercase', 'capitalize', 'title'].includes(fallbackOrFormat.toLowerCase().trim())) {
          return applyFormatting(stringValue, fallbackOrFormat);
        }
        
        return stringValue;
      } catch (error) {
        console.error(`Error processing template variable ${variablePath}:`, error);
        return match; // Return original placeholder on error
      }
    });
  }

  return processedContent;
};

/**
 * Legacy function maintained for backward compatibility
 */
export const processCompanyNamePlaceholders = (
  content: string | null | undefined,
  organization: Organization | undefined
): string => {
  if (!content) {
    return '';
  }
  if (!organization?.name) {
    return content;
  }

  return content.replace(companyNamePlaceholderRegex, organization.name);
};