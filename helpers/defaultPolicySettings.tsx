/**
 * Default policy settings for new organizations.
 * These are tailored for UK Small and Medium-sized Enterprises (SMEs)
 * with a focus on roles like HR, IT, CEO, and CPO.
 */

/**
 * Default categories for classifying policies.
 * These are high-level groupings to help organize the policy library.
 */
export const DEFAULT_POLICY_CATEGORIES: string[] = [
  "Human Resources",
  "Information Technology & Security",
  "Health & Safety",
  "Finance & Expenses",
  "Operations & Conduct",
  "Legal & Compliance",
  "Data Protection & Privacy",
];

/**
 * Default departments within a typical SME.
 * These can be used for assigning policy ownership or applicability.
 */
export const DEFAULT_DEPARTMENTS: string[] = [
  "Executive / Leadership",
  "Human Resources",
  "IT",
  "Finance",
  "Operations",
  "Sales & Marketing",
  "Legal",
  "Product & Engineering",
];

/**
 * A comprehensive list of default tags for policies.
 * These provide granular filtering and search capabilities.
 * They are grouped by relevance to the default categories for clarity.
 */
export const DEFAULT_POLICY_TAGS: string[] = [
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
];