import { useMemo } from "react";
import { useSettings } from "./useSettingsApi";
import { useOrgFromUrl } from "./useOrgFromUrl";

// --- Constants ---

const BRANDING_KEYS = {
  LOGO: "branding.logo",
  PORTAL_NAME: "branding.portalName",
  PORTAL_DESCRIPTION: "branding.portalDescription",
  PRIMARY_COLOR: "branding.primaryColor",
  SECONDARY_COLOR: "branding.secondaryColor",
  CUSTOM_DOMAIN: "branding.customDomain",
} as const;

const DEFAULT_BRANDING_CONFIG = {
  logoUrl: null,
  portalName: "Public Policy Portal",
  portalDescription:
    "Welcome. Here you can find all publicly available policies. Use the filters to narrow your search.",
  primaryColor: "var(--primary)",
  secondaryColor: "var(--secondary)",
  customDomain: null,
};

// --- Types ---

/**
 * Configuration for a custom domain.
 * - domain: The custom domain name (e.g., 'policies.mycompany.com').
 * - sslStatus: The current status of the SSL certificate for the domain.
 */
export type CustomDomainConfig = {
  domain: string;
  sslStatus: "pending" | "active" | "error";
};

/**
 * Represents the complete branding configuration for the portal.
 */
export type BrandingConfig = {
  logoUrl: string | null;
  portalName: string;
  portalDescription: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: CustomDomainConfig | null;
};

// --- Type Guards ---

/**
 * Type guard to validate the structure of the custom domain configuration
 * from the database settings.
 * @param value The value to check.
 * @returns True if the value is a valid CustomDomainConfig object.
 */
function isCustomDomainConfig(value: unknown): value is CustomDomainConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.domain === "string" &&
    (obj.sslStatus === "pending" ||
      obj.sslStatus === "active" ||
      obj.sslStatus === "error")
  );
}

/**
 * Type guard to validate string values from settings
 */
function isValidStringValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// --- Hook ---

/**
 * A hook to fetch and provide branding settings for the application.
 * It retrieves settings from the API, provides sensible defaults, and
 * handles loading and error states.
 *
 * @returns An object containing the branding configuration, loading state, and error state.
 */
export const useBranding = () => {
  const { organizationId } = useOrgFromUrl();

  const logoQuery = useSettings(BRANDING_KEYS.LOGO, true, organizationId);
  const portalNameQuery = useSettings(BRANDING_KEYS.PORTAL_NAME, true, organizationId);
  const portalDescriptionQuery = useSettings(BRANDING_KEYS.PORTAL_DESCRIPTION, true, organizationId);
  const primaryColorQuery = useSettings(BRANDING_KEYS.PRIMARY_COLOR, true, organizationId);
  const secondaryColorQuery = useSettings(BRANDING_KEYS.SECONDARY_COLOR, true, organizationId);
  const customDomainQuery = useSettings(BRANDING_KEYS.CUSTOM_DOMAIN, true, organizationId);

  const queries = [
    logoQuery,
    portalNameQuery,
    portalDescriptionQuery,
    primaryColorQuery,
    secondaryColorQuery,
    customDomainQuery,
  ];

  const isLoading = queries.some((query) => query.isLoading);
  const isFetching = queries.some((query) => query.isFetching);
  const isError = queries.some((query) => query.isError);
  const error = queries.find((query) => query.error)?.error;

  const brandingConfig = useMemo((): BrandingConfig => {
    // Extract and validate individual setting values
    const logoValue = logoQuery.data?.settingValue;
    const portalNameValue = portalNameQuery.data?.settingValue;
    const portalDescriptionValue = portalDescriptionQuery.data?.settingValue;
    const primaryColorValue = primaryColorQuery.data?.settingValue;
    const secondaryColorValue = secondaryColorQuery.data?.settingValue;
    const customDomainValue = customDomainQuery.data?.settingValue;

    // Process logo URL - can be string or null
    const logoUrl = isValidStringValue(logoValue) ? logoValue : null;

    // Process portal name with fallback to default
    const portalName = isValidStringValue(portalNameValue) 
      ? portalNameValue 
      : DEFAULT_BRANDING_CONFIG.portalName;

    // Process portal description with fallback to default
    const portalDescription = isValidStringValue(portalDescriptionValue)
      ? portalDescriptionValue
      : DEFAULT_BRANDING_CONFIG.portalDescription;

    // Process primary color with fallback to default
    const primaryColor = isValidStringValue(primaryColorValue)
      ? primaryColorValue
      : DEFAULT_BRANDING_CONFIG.primaryColor;

    // Process secondary color with fallback to default
    const secondaryColor = isValidStringValue(secondaryColorValue)
      ? secondaryColorValue
      : DEFAULT_BRANDING_CONFIG.secondaryColor;

    // Process custom domain - can be CustomDomainConfig object or null
    let customDomain: CustomDomainConfig | null = null;
    if (isCustomDomainConfig(customDomainValue)) {
      customDomain = customDomainValue;
    } else if (isValidStringValue(customDomainValue)) {
      // Handle legacy case where custom domain might be stored as just a string
      customDomain = {
        domain: customDomainValue,
        sslStatus: "pending" as const,
      };
    }

    return {
      logoUrl,
      portalName,
      portalDescription,
      primaryColor,
      secondaryColor,
      customDomain,
    };
  }, [
    logoQuery.data,
    portalNameQuery.data,
    portalDescriptionQuery.data,
    primaryColorQuery.data,
    secondaryColorQuery.data,
    customDomainQuery.data,
  ]);

  return {
    brandingConfig,
    isLoading: isLoading || isFetching,
    isError,
    error,
  };
};