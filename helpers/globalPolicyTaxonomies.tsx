import { useMemo } from "react";
import { useSettings } from "./useSettingsApi";

/**
 * Setting key for storing custom policy taxonomies in the database.
 */
export const POLICY_TAXONOMIES_SETTING_KEY = "policy_taxonomies";

/**
 * Type definition for custom taxonomies stored in organization settings.
 */
export type CustomTaxonomies = {
  categories: string[];
  departments: string[];
  tags: string[];
};

// --- Standard (Global) Taxonomies ---

/**
 * Standard, global categories for classifying policies.
 * These are used for cross-organization analytics.
 */
export const STANDARD_POLICY_CATEGORIES: readonly string[] = [
  "Human Resources",
  "Information Technology & Security",
  "Health & Safety",
  "Finance & Expenses",
  "Operations & Conduct",
  "Legal & Compliance",
  "Data Protection & Privacy",
];

/**
 * Standard, global departments within a typical SME.
 * These are used for cross-organization analytics.
 */
export const STANDARD_DEPARTMENTS: readonly string[] = [
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
 * A comprehensive list of standard, global tags for policies.
 * These are used for cross-organization analytics.
 */
export const STANDARD_POLICY_TAGS: readonly string[] = [
  // Human Resources
  "recruitment", "onboarding", "offboarding", "performance management", "annual leave", "sick leave", "parental leave", "employee benefits", "pension", "payroll", "training and development", "employee relations", "grievance", "disciplinary", "diversity and inclusion", "employee wellbeing", "remote working", "flexible working",
  // Information Technology & Security
  "acceptable use", "cybersecurity", "password policy", "data security", "software management", "hardware management", "network security", "bring your own device (BYOD)", "incident response", "information classification", "access control",
  // Health & Safety
  "workplace safety", "fire safety", "first aid", "display screen equipment (DSE)", "mental health at work", "accident reporting", "risk assessment", "lone working",
  // Finance & Expenses
  "expense claims", "procurement", "purchasing", "invoicing", "budgeting", "corporate card usage", "anti-money laundering (AML)",
  // Operations & Conduct
  "code of conduct", "dress code", "internal communications", "social media usage", "company property", "business travel", "confidentiality", "conflict of interest",
  // Legal & Compliance
  "GDPR", "anti-bribery and corruption", "whistleblowing", "equal opportunity", "modern slavery statement", "intellectual property", "records management",
  // Data Protection & Privacy
  "data privacy", "data retention", "subject access request (SAR)", "data breach notification", "privacy impact assessment (PIA)",
];


// --- Helper Functions ---

/**
 * Returns the list of standard policy categories.
 * @returns A readonly array of standard category strings.
 */
export const getStandardCategories = (): readonly string[] => STANDARD_POLICY_CATEGORIES;

/**
 * Returns the list of standard policy departments.
 * @returns A readonly array of standard department strings.
 */
export const getStandardDepartments = (): readonly string[] => STANDARD_DEPARTMENTS;

/**
 * Returns the list of standard policy tags.
 * @returns A readonly array of standard tag strings.
 */
export const getStandardTags = (): readonly string[] => STANDARD_POLICY_TAGS;

/**
 * Merges a standard list with a custom list, removing duplicates and preserving order.
 * @param standardList The base list of standard items.
 * @param customList The list of custom items to add.
 * @returns A new array containing unique items from both lists.
 */
const getCombinedList = (standardList: readonly string[], customList?: string[]): string[] => {
  if (!customList || customList.length === 0) {
    return [...standardList];
  }
  const combined = new Set([...standardList, ...customList]);
  return Array.from(combined);
};

/**
 * A React hook to fetch an organization's custom policy taxonomies and provide combined
 * (standard + custom) lists for use in UI components like forms and filters.
 *
 * It handles loading and error states for fetching settings.
 *
 * @returns An object containing combined lists for categories, departments, and tags,
 *          along with the loading status.
 */
export const usePolicyTaxonomies = () => {
  const { data: settings, isFetching } = useSettings(POLICY_TAXONOMIES_SETTING_KEY);

  const customTaxonomies = useMemo(() => {
    if (!settings?.settingValue) {
      return { categories: [], departments: [], tags: [] };
    }

    let parsedValue: any;
    
    // Handle case where settingValue is a string that needs parsing
    if (typeof settings.settingValue === 'string') {
      try {
        parsedValue = JSON.parse(settings.settingValue);
      } catch (error) {
        console.error('Failed to parse custom taxonomies setting value:', error);
        return { categories: [], departments: [], tags: [] };
      }
    } else {
      parsedValue = settings.settingValue;
    }

    // Validate that the parsed value has the expected structure
    if (
      typeof parsedValue === 'object' &&
      parsedValue !== null &&
      !Array.isArray(parsedValue)
    ) {
      return {
        categories: Array.isArray(parsedValue.categories) ? parsedValue.categories : [],
        departments: Array.isArray(parsedValue.departments) ? parsedValue.departments : [],
        tags: Array.isArray(parsedValue.tags) ? parsedValue.tags : [],
      };
    }

    console.error('Invalid custom taxonomies data structure:', parsedValue);
    return { categories: [], departments: [], tags: [] };
  }, [settings]);

  const combinedCategories = useMemo(
    () => getCombinedList(STANDARD_POLICY_CATEGORIES, customTaxonomies.categories),
    [customTaxonomies.categories]
  );

  const combinedDepartments = useMemo(
    () => getCombinedList(STANDARD_DEPARTMENTS, customTaxonomies.departments),
    [customTaxonomies.departments]
  );

  const combinedTags = useMemo(
    () => getCombinedList(STANDARD_POLICY_TAGS, customTaxonomies.tags),
    [customTaxonomies.tags]
  );

  return {
    isLoading: isFetching,
    combinedCategories,
    combinedDepartments,
    combinedTags,
    customTaxonomies,
  };
};