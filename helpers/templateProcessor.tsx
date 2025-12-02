import { useMemo } from 'react';
import { useOrganization } from './useOrganization';
import { useSettings } from './useSettingsApi';
import { Organization } from './Organization';

// Type definition for organization variables structure
export interface OrganizationVariables {
  company?: Record<string, string | null>;
  leadership?: Record<string, string | null>;
  departments?: Record<string, string | null>;
  policies?: Record<string, string | null>;
  contact?: Record<string, string | null>;
  [category: string]: Record<string, string | null> | undefined;
}

/**
 * Legacy function to replace company name placeholders with organization name
 */
export const processCompanyNamePlaceholders = (
  content: string | null | undefined,
  organization: Organization | undefined
): string => {
  if (!content) return '';
  if (!organization) return content;

  return content
    .replace(/\[Company Name\]/g, organization.name)
    .replace(/\{\{Company Name\}\}/g, organization.name);
};

/**
 * Enhanced template processor that handles both legacy and modern variable syntax
 */
export const processTemplateContent = (
  content: string,
  organization: Organization | undefined,
  variables: OrganizationVariables
): string => {
  if (!content) return '';

  let processedContent = content;

  // First, handle legacy company name placeholders
  processedContent = processCompanyNamePlaceholders(processedContent, organization);

  // Then handle modern variable syntax /category.key/ and /category.key|fallback|format/
  processedContent = processedContent.replace(
    /\/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)(?:\|([^\/|]*?))?(?:\|([^\/]*?))?\//g,
    (match, category, key, fallback, format) => {
      const value = variables[category]?.[key];
      
      let result: string;
      if (typeof value === 'string') {
        result = value;
      } else if (fallback) {
        result = fallback;
      } else {
        return match; // Return original if no value and no fallback
      }

      // Apply formatting if specified
      if (format) {
        switch (format.toLowerCase()) {
          case 'uppercase':
            result = result.toUpperCase();
            break;
          case 'lowercase':
            result = result.toLowerCase();
            break;
          default:
            // Unknown format, apply as-is
            break;
        }
      }

      return result;
    }
  );

  return processedContent;
};

/**
 * Extract all template variables from content
 */
export const extractTemplateVariables = (content: string | null | undefined): string[] => {
  if (!content) return [];

  const variables: string[] = [];
  const regex = /\/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)(?:\|[^\/]*?)?\//g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variablePath = `${match[1]}.${match[2]}`;
    if (!variables.includes(variablePath)) {
      variables.push(variablePath);
    }
  }

  return variables;
};

/**
 * Validate that all template variables in content are defined
 */
export const validateTemplateVariables = (
  content: string,
  variables: OrganizationVariables
): { isValid: boolean; undefinedVariables: string[] } => {
  const extractedVars = extractTemplateVariables(content);
  const undefinedVariables: string[] = [];

  for (const varPath of extractedVars) {
    const [category, key] = varPath.split('.');
    const value = variables[category]?.[key];
    
    // Check if the original content has a fallback for this variable
    const fallbackRegex = new RegExp(`\/${category}\\.${key}\\|[^\/|]+`, 'g');
    const hasFallback = fallbackRegex.test(content);
    
    if (typeof value !== 'string' && !hasFallback) {
      undefinedVariables.push(varPath);
    }
  }

  return {
    isValid: undefinedVariables.length === 0,
    undefinedVariables,
  };
};

/**
 * React hook for comprehensive template processing with organization variables
 */
export const useProcessedTemplate = (content: string) => {
  const { organizationState } = useOrganization();
  const { data: settingsData, isFetching } = useSettings('organization_variables', 
    organizationState.type === 'active'
  );

  const result = useMemo(() => {
    if (organizationState.type !== 'active') {
      return {
        processedContent: content,
        isLoading: false,
        variables: {} as OrganizationVariables,
      };
    }

    const organization = organizationState.currentOrganization;
    const variables: OrganizationVariables = settingsData?.settingValue as OrganizationVariables || {};

    const processedContent = processTemplateContent(content, organization, variables);

    return {
      processedContent,
      isLoading: isFetching,
      variables,
    };
  }, [content, organizationState, settingsData, isFetching]);

  return result;
};

/**
 * Safely convert unknown settings data to OrganizationVariables type
 */
export const validateOrganizationVariables = (data: unknown): OrganizationVariables => {
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
        } else {
          result[category]![key] = String(value);
        }
      }
    }
  }

  return result;
};

/**
 * React hook for simple company name placeholder processing (backward compatibility)
 */
export const useProcessedContent = (content: string): string => {
  const { organizationState } = useOrganization();

  return useMemo(() => {
    if (organizationState.type !== 'active') {
      return content;
    }

    return processCompanyNamePlaceholders(content, organizationState.currentOrganization);
  }, [content, organizationState]);
};