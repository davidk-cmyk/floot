import { Selectable } from "kysely";
import { Policies, Organizations, OrganizationVariables } from "./schema";

// --- TYPE DEFINITIONS ---

/** Data context for policy-related variables. */
type PolicyDataContext = Partial<
  Pick<
    Selectable<Policies>,
    | "title"
    | "currentVersion"
    | "effectiveDate"
    | "department"
    | "category"
    | "tags"
    | "expirationDate"
  >
>;

/** Data context for organization-related variables. */
type OrganizationDataContext = {
  name?: string | null;
  // Assuming these will be stored as OrganizationVariables
  email?: string | null;
  address?: string | null;
  phone?: string | null;
  // For custom variables defined in the OrganizationVariables table
  custom?: Record<string, string | null>;
};

/** Data context for document-specific variables, often generated at render time. */
type DocumentDataContext = {
  pageNumber?: number;
  totalPages?: number;
  printDate?: string;
  printTime?: string;
};

/** Combined data context for the variable processor. */
export type VariableDataContext = {
  policy?: PolicyDataContext;
  organization?: OrganizationDataContext;
  document?: DocumentDataContext;
};

// --- HELPER FUNCTIONS ---

/**
 * Formats a date object or string into a localized date string (e.g., "January 1, 2024").
 * Returns an empty string if the date is invalid.
 */
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    console.error("Invalid date provided for formatting:", date);
    return "";
  }
};

/**
 * Formats an array of strings into a single comma-separated string.
 * Returns an empty string if the array is null, undefined, or empty.
 */
const formatTags = (tags: string[] | null | undefined): string => {
  if (!tags || tags.length === 0) return "";
  return tags.join(", ");
};

// --- VARIABLE RESOLVER MAP ---

/**
 * A whitelist-based resolver map. Each key corresponds to a supported variable.
 * The value is a function that safely extracts and formats the data from the context.
 * This approach prevents arbitrary code execution and ensures security.
 */
const variableResolvers: {
  [key: string]: (context: VariableDataContext) => string | number | null;
} = {
  // Policy variables
  "policy.title": (ctx) => ctx.policy?.title ?? null,
  "policy.version": (ctx) => ctx.policy?.currentVersion ?? null,
  "policy.effectiveDate": (ctx) => formatDate(ctx.policy?.effectiveDate),
  "policy.department": (ctx) => ctx.policy?.department ?? null,
  "policy.category": (ctx) => ctx.policy?.category ?? null,
  "policy.tags": (ctx) => formatTags(ctx.policy?.tags),
  "policy.expirationDate": (ctx) => formatDate(ctx.policy?.expirationDate),

  // Document variables
  "document.pageNumber": (ctx) => ctx.document?.pageNumber ?? null,
  "document.totalPages": (ctx) => ctx.document?.totalPages ?? null,
  "document.printDate": (ctx) =>
    ctx.document?.printDate ??
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
  "document.printTime": (ctx) =>
    ctx.document?.printTime ??
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),

  // Organization variables
  "company.name": (ctx) => ctx.organization?.name ?? null,
  "company.email": (ctx) => ctx.organization?.email ?? null,
  "company.address": (ctx) => ctx.organization?.address ?? null,
  "company.phone": (ctx) => ctx.organization?.phone ?? null,
};

// --- CORE PROCESSING FUNCTION ---

/**
 * Processes a template string, replacing placeholders like {{variable.name}} with
 * values from the provided data context.
 *
 * @param template The string template to process. Can be null or undefined.
 * @param context The data context containing values for substitution.
 * @returns The processed string with variables replaced, or an empty string if the template is empty.
 */
export const processVariables = (
  template: string | null | undefined,
  context: VariableDataContext
): string => {
  if (!template) {
    return "";
  }

  const variableRegex = /{{\s*([\w.]+)\s*}}/g;

  return template.replace(variableRegex, (match, variableName: string) => {
    let resolvedValue: string | number | null = null;

    // Check for custom organization variables first
    if (
      variableName.startsWith("company.") &&
      context.organization?.custom
    ) {
      const customVarKey = variableName.substring("company.".length);
      if (customVarKey in context.organization.custom) {
        resolvedValue = context.organization.custom[customVarKey];
      }
    }

    // If not found in custom, check the standard resolvers
    if (resolvedValue === null && variableName in variableResolvers) {
      resolvedValue = variableResolvers[variableName](context);
    }

    if (resolvedValue !== null && resolvedValue !== undefined) {
      return String(resolvedValue);
    }

    // If the variable is not found in the resolvers or the data is missing, return a placeholder.
    console.warn(`Missing variable or value for: ${variableName}`);
    return `{{MISSING: ${variableName}}}`;
  });
};