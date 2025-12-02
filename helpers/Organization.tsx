// Organization interface based on the database schema
export interface Organization {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Utility functions for organization management
export const createOrganizationSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const isOrganizationActive = (organization: Organization): boolean => {
  return organization.isActive !== false;
};