import type { PolicyWithAcknowledgement as ListPolicy } from "../endpoints/policies/list_GET.schema";
import type { PolicyWithAcknowledgement as PortalPolicy } from "../endpoints/portalPolicies_GET.schema";
import type { PolicyForReview } from "../endpoints/review-policies_GET.schema";

/**
 * A unified interface for policy data used across different UI components like cards and lists.
 * This allows components to be agnostic of the data source (e.g., list, internal, portal, or review endpoints).
 * All fields are optional to accommodate variations between different endpoint responses.
 */
export type PolicyCardData = {
  id: number;
  title: string;
  status?: string | null;
  department?: string | null;
  category?: string | null;
  tags?: string[] | null;
  effectiveDate?: Date | string | null;
  updatedAt?: Date | string | null;
  acknowledged?: boolean;
  acknowledgedCount?: number;
  assignedCount?: number;
  overdueCount?: number;
  dueSoonCount?: number;
  requiresAcknowledgment?: boolean;
  author?: {
    id: number;
    displayName: string;
    avatarUrl: string | null;
  };
  assignedPortals?: Array<{
    id: number;
    name: string;
    slug: string;
    requiresAcknowledgment: boolean;
  }>;
  reviewDate?: Date | string | null;
  daysOverdue?: number;
  daysUntilDue?: number;
  reviewStatus?: "overdue" | "due_soon" | "upcoming";
};

/**
 * Adapter to convert a policy object from the `policies/list_GET` endpoint
 * into the unified `PolicyCardData` format.
 * @param policy - The policy object from the list endpoint.
 * @returns A `PolicyCardData` object.
 */
export const fromListEndpoint = (policy: ListPolicy): PolicyCardData => {
  return {
    id: policy.id,
    title: policy.title,
    status: policy.status,
    department: policy.department,
    category: policy.category,
    tags: policy.tags,
    effectiveDate: policy.effectiveDate,
    updatedAt: policy.updatedAt,
    acknowledged: policy.acknowledged,
    acknowledgedCount: policy.acknowledgedCount,
    assignedCount: policy.assignedCount,
    overdueCount: policy.overdueCount,
    dueSoonCount: policy.dueSoonCount,
    requiresAcknowledgment: policy.requiresAcknowledgmentFromPortals,
    assignedPortals: policy.assignedPortals,
  };
};


/**
 * Adapter to convert a policy object from the `portalPolicies_GET` endpoint
 * into the unified `PolicyCardData` format.
 * @param policy - The policy object from the portal policies endpoint.
 * @returns A `PolicyCardData` object.
 */
export const fromPortalEndpoint = (policy: PortalPolicy): PolicyCardData => {
  return {
    id: policy.id,
    title: policy.title,
    status: policy.status,
    department: policy.department,
    category: policy.category,
    tags: policy.tags,
    effectiveDate: policy.effectiveDate,
    updatedAt: policy.updatedAt,
    acknowledged: policy.acknowledged,
    // Portal policies don't expose detailed acknowledgment stats or author info.
  };
};

/**
 * Adapter to convert a policy object from the `review-policies_GET` endpoint schema
 * into the unified `PolicyCardData` format.
 * @param policy - The policy object from the review policies endpoint.
 * @returns A `PolicyCardData` object.
 */
export const fromReviewEndpoint = (policy: PolicyForReview): PolicyCardData => {
  // Calculate daysUntilDue based on reviewDate if not overdue
  const daysUntilDue = policy.daysOverdue <= 0 ? Math.abs(policy.daysOverdue) : undefined;

  return {
    id: policy.id,
    title: policy.title,
    status: undefined, // Not available in PolicyForReview schema
    department: policy.department,
    category: policy.category,
    tags: [], // Not available in PolicyForReview schema, default to empty array
    effectiveDate: null, // Not available in PolicyForReview schema
    updatedAt: null, // Not available in PolicyForReview schema
    author: {
      id: policy.authorId,
      displayName: policy.authorDisplayName,
      avatarUrl: null, // Not available in PolicyForReview schema
    },
    reviewDate: policy.reviewDate,
    daysOverdue: policy.daysOverdue > 0 ? policy.daysOverdue : undefined,
    daysUntilDue: daysUntilDue,
    reviewStatus: policy.reviewStatus,
    // Review policies don't have acknowledgment-related fields
    requiresAcknowledgment: false,
  };
};