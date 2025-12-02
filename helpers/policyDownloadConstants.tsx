/**
 * This helper contains shared constants for policy download functionality.
 * Centralizing these constants prevents circular dependencies between endpoints and their schemas.
 */

// Defines the supported file formats for downloading policies.
export const supportedFormats = ["pdf", "docx", "md"] as const;