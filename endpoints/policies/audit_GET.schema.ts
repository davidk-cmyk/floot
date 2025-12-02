import { z } from "zod";
import superjson from "superjson";
import { Json } from "../../helpers/schema";

// Canonical enum for audit log action types - single source of truth
export const AUDIT_LOG_ACTIONS = [
  "create",
  "edit", 
  "delete",
  "approve", 
  "reject",
  "publish",
  "unpublish",
  "acknowledge",
  "reminder",
  "settings_update"
] as const;

export type AuditLogAction = typeof AUDIT_LOG_ACTIONS[number];

// Type guard to check if a string is a valid AuditLogAction
export function isAuditLogAction(action: string): action is AuditLogAction {
  return (AUDIT_LOG_ACTIONS as readonly string[]).includes(action);
}

// Assertion function to validate and narrow the type
export function assertAuditLogAction(action: string): asserts action is AuditLogAction {
  if (!isAuditLogAction(action)) {
    throw new Error(`Invalid audit log action: ${action}. Valid actions are: ${AUDIT_LOG_ACTIONS.join(', ')}`);
  }
}

export const schema = z.object({
  // Filters
  policyId: z.number().int().optional(),
  policyName: z.string().optional(),
  action: z.enum(AUDIT_LOG_ACTIONS).optional(),
  userId: z.number().int().optional(),
  userName: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  // Sorting
  sortBy: z.enum(["actionTimestamp", "policyName", "user"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),

  // Pagination
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type InputType = z.infer<typeof schema>;

export type AuditLogEntry = {
  id: number;
  policyId: number;
  policyName: string;
  action: AuditLogAction;
  actionTimestamp: Date;
  details: Json | null;
  user: {
    id: number;
    displayName: string;
    email: string;
  };
};

export type OutputType = {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getPolicyAudit = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();

  if (params.policyId) searchParams.set("policyId", String(params.policyId));
  if (params.policyName) searchParams.set("policyName", params.policyName);
  if (params.action) searchParams.set("action", params.action);
  if (params.userId) searchParams.set("userId", String(params.userId));
  if (params.userName) searchParams.set("userName", params.userName);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const result = await fetch(
    `/_api/policies/audit?${searchParams.toString()}`,
    {
      method: "GET",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }
  );

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error);
  }
  return superjson.parse<OutputType>(await result.text());
};