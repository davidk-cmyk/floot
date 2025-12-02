import { z } from 'zod';
import { processVariables } from './variableProcessor';

// Extract standard variables from variableProcessor's variableResolvers
// This is done by importing the module and accessing the resolver keys
export const getStandardVariables = (): Array<{ key: string; label: string; example: string }> => {
  // We need to dynamically access variableProcessor's variableResolvers
  // Since we can't directly export the resolver map, we'll use a type-safe approach
  // by defining the known standard variables that come from variableProcessor
  
  const standardVariables = [
    // Policy variables
    { key: 'policy.title', label: 'Policy Title', example: 'Employee Handbook' },
    { key: 'policy.version', label: 'Policy Version', example: 'v2.1' },
    { key: 'policy.effectiveDate', label: 'Effective Date', example: 'January 1, 2024' },
    { key: 'policy.department', label: 'Department', example: 'Human Resources' },
    { key: 'policy.category', label: 'Category', example: 'HR Policies' },
    { key: 'policy.tags', label: 'Tags', example: 'HR, Compliance' },
    { key: 'policy.expirationDate', label: 'Expiration Date', example: 'December 31, 2024' },
    
    // Document variables
    { key: 'document.pageNumber', label: 'Current Page Number', example: '1' },
    { key: 'document.totalPages', label: 'Total Pages', example: '5' },
    { key: 'document.printDate', label: 'Print Date', example: 'March 15, 2024' },
    { key: 'document.printTime', label: 'Print Time', example: '2:30 PM' },
    
    // Standard company variables
    { key: 'company.name', label: 'Company Name', example: 'Acme Corporation' },
    { key: 'company.email', label: 'Company Email', example: 'contact@acme.com' },
    { key: 'company.address', label: 'Company Address', example: '123 Main St, City, State' },
    { key: 'company.phone', label: 'Company Phone', example: '(555) 123-4567' },
  ];

  return standardVariables;
};

// Default templates with helpful examples
export const DEFAULT_TEMPLATES = {
  headerTemplate: '/company.name/ - Confidential\nPage /document.pageNumber/ of /document.totalPages/',
  footerTemplate: 'Policy: /policy.title/ | Version: /policy.version/ | Effective: /policy.effectiveDate/\nPrinted: /document.printDate/ at /document.printTime/',
};

// Template validation schema
export const validateTemplate = (template: string, customVariableKeys: string[] = []): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Get all valid variable keys (standard + custom)
  const standardVariables = getStandardVariables();
  const allValidKeys = new Set([
    ...standardVariables.map(v => v.key),
    ...customVariableKeys.map(key => `company.${key}`)
  ]);
  
  // Find all variable references in the template
  const variablePattern = /\/([a-zA-Z0-9_.]+)\//g;
  const matches = Array.from(template.matchAll(variablePattern));
  
  for (const match of matches) {
    const variablePath = match[1];
    const isValidVariable = allValidKeys.has(variablePath);
    
    if (!isValidVariable) {
      errors.push(`Unknown variable: /${variablePath}/`);
    }
  }
  
  // Check for common syntax errors
  const openSlashes = (template.match(/\/[^/]*$/g) || []).length;
  if (openSlashes > 0) {
    errors.push('Unclosed variable reference found. Variables must be wrapped in forward slashes like /variable.name/');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Helper to get variable categories for dropdown
// This now accepts custom variables as a parameter
export const getVariablesByCategory = (customVariables: Array<{ key: string; label: string; example: string }> = []) => {
  const standardVariables = getStandardVariables();
  
  // Group standard variables by prefix
  const policyVars = standardVariables.filter(v => v.key.startsWith('policy.'));
  const documentVars = standardVariables.filter(v => v.key.startsWith('document.'));
  const standardCompanyVars = standardVariables.filter(v => v.key.startsWith('company.'));
  
  return [
    {
      category: 'Policy',
      variables: policyVars,
    },
    {
      category: 'Document',
      variables: documentVars,
    },
    {
      category: 'Company',
      variables: standardCompanyVars,
    },
    {
      category: 'Custom',
      variables: customVariables,
    },
  ];
};