// Import types and categories from policyTemplateModel
import { PolicyTemplate, POLICY_TEMPLATE_CATEGORIES } from './policyTemplateModel';

// Import template arrays from each category helper
import { EMPLOYMENT_HR_TEMPLATES } from './employmentHRTemplates';
import { DATA_PROTECTION_TEMPLATES } from './dataProtectionTemplates';
import { HEALTH_SAFETY_TEMPLATES } from './healthSafetyTemplates';
import { BUSINESS_OPERATIONS_TEMPLATES } from './businessOperationsTemplates';

// Export the combined POLICY_TEMPLATES array using spread syntax
export const POLICY_TEMPLATES: PolicyTemplate[] = [
  ...EMPLOYMENT_HR_TEMPLATES,
  ...DATA_PROTECTION_TEMPLATES,
  ...HEALTH_SAFETY_TEMPLATES,
  ...BUSINESS_OPERATIONS_TEMPLATES,
];

// Re-export POLICY_TEMPLATE_CATEGORIES for backward compatibility
export { POLICY_TEMPLATE_CATEGORIES };

// Re-export all types from policyTemplateModel to maintain backward compatibility
export type { PolicyTemplate, PolicyTemplateCategory, PolicyTemplateType } from './policyTemplateModel';