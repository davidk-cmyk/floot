/**
 * Backend-only version of global policy taxonomy constants.
 * This file contains the same constants as globalPolicyTaxonomies but without React dependencies,
 * making it safe for use in backend endpoints and server-side code.
 */

/**
 * Standard policy categories used across the platform for consistent classification.
 * These provide a unified taxonomy that enables cross-organization analytics and reporting.
 */
export const STANDARD_POLICY_CATEGORIES = [
  "Human Resources",
  "Information Technology & Security", 
  "Health & Safety",
  "Finance & Expenses",
  "Operations & Conduct",
  "Legal & Compliance",
  "Data Protection & Privacy",
] as const;

/**
 * Standard departments found in most organizations.
 * Used for policy assignment and coverage analysis.
 */
export const STANDARD_DEPARTMENTS = [
  "Executive / Leadership",
  "Human Resources", 
  "IT",
  "Finance",
  "Operations",
  "Sales & Marketing",
  "Legal",
  "Product & Engineering",
] as const;

/**
 * Comprehensive list of standard policy tags for granular categorization.
 * These enable detailed filtering, search, and analytics across the platform.
 */
export const STANDARD_POLICY_TAGS = [
  // Human Resources
  "recruitment",
  "onboarding", 
  "offboarding",
  "performance management",
  "annual leave",
  "sick leave",
  "parental leave",
  "employee benefits",
  "pension",
  "payroll",
  "training and development",
  "employee relations",
  "grievance",
  "disciplinary",
  "diversity and inclusion",
  "employee wellbeing",
  "remote working",
  "flexible working",

  // Information Technology & Security
  "acceptable use",
  "cybersecurity",
  "password policy",
  "data security",
  "software management",
  "hardware management", 
  "network security",
  "bring your own device (BYOD)",
  "incident response",
  "information classification",
  "access control",

  // Health & Safety
  "workplace safety",
  "fire safety",
  "first aid",
  "display screen equipment (DSE)",
  "mental health at work",
  "accident reporting",
  "risk assessment",
  "lone working",

  // Finance & Expenses
  "expense claims",
  "procurement",
  "purchasing",
  "invoicing",
  "budgeting",
  "corporate card usage",
  "anti-money laundering (AML)",

  // Operations & Conduct
  "code of conduct",
  "dress code",
  "internal communications",
  "social media usage",
  "company property",
  "business travel",
  "confidentiality",
  "conflict of interest",

  // Legal & Compliance
  "GDPR",
  "anti-bribery and corruption",
  "whistleblowing",
  "equal opportunity",
  "modern slavery statement",
  "intellectual property",
  "records management",

  // Data Protection & Privacy
  "data privacy",
  "data retention",
  "subject access request (SAR)",
  "data breach notification",
  "privacy impact assessment (PIA)",
] as const;

// Type definitions for the constants
export type StandardPolicyCategory = typeof STANDARD_POLICY_CATEGORIES[number];
export type StandardDepartment = typeof STANDARD_DEPARTMENTS[number];
export type StandardPolicyTag = typeof STANDARD_POLICY_TAGS[number];