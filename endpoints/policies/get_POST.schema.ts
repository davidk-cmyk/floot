import { z } from "zod";
import superjson from "superjson";
import { Selectable, ColumnType } from "kysely";
import {
  Policies,
  PolicyAssignments,
  PolicyAcknowledgments,
  PolicyVersions,
  PolicyReadingSessions,
  Users,
  Timestamp,
} from "../../helpers/schema";

export const schema = z.object({
  policyId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

// Helper type to unwrap ColumnType wrappers
type UnwrapSelectable<T> = T extends ColumnType<infer S, any, any> ? UnwrapSelectable<S> : T;

// Unwrapped row types for PolicyAssignments and PolicyAcknowledgments
export type PolicyAssignmentRow = {
  [K in keyof PolicyAssignments]: UnwrapSelectable<PolicyAssignments[K]>;
};

export type PolicyAcknowledgmentRow = Omit<
  {
    [K in keyof PolicyAcknowledgments]: UnwrapSelectable<PolicyAcknowledgments[K]>;
  },
  "quizAttemptId" | "understandingCompletedAt" | "keyPointsConfirmedAt"
>;

// Unwrapped row type for Policies
type UnwrappedPolicies = {
  [K in keyof Policies]: UnwrapSelectable<Policies[K]>;
};

// Type for the author information, subset of Users table
type PolicyAuthor = Pick<
  Selectable<Users>,
  "id" | "displayName" | "email" | "avatarUrl"
> & {
  oauthProvider: string | null;
};

// Type for the main policy data including the author object
export type PolicyWithAuthor = Omit<UnwrappedPolicies, "requiresAcknowledgment"> & {
  author: PolicyAuthor;
  requiresAcknowledgmentFromPortals: boolean;
  assignedPortals: Array<{
    id: number;
    name: string;
    slug: string;
    requiresAcknowledgment: boolean;
  }>;
};

// Type for the current user's assignment and acknowledgment status
export type CurrentUserStatus = {
  assignment: PolicyAssignmentRow | null;
  acknowledgment: PolicyAcknowledgmentRow | null;
};

// Type for the admin view, showing status for all assigned users
export type UserAssignmentAndAcknowledgment = {
  user: Pick<Selectable<Users>, "id" | "displayName" | "email" | "avatarUrl"> & {
    oauthProvider: string | null;
  };
  assignment: PolicyAssignmentRow | null;
  acknowledgment: PolicyAcknowledgmentRow | null;
};

// The final output type for the endpoint
export type OutputType = {
  policy: PolicyWithAuthor;
  currentUserStatus: CurrentUserStatus;
  versions: Selectable<PolicyVersions>[];
  readingSessions: Selectable<PolicyReadingSessions>[];
  adminView: UserAssignmentAndAcknowledgment[] | null; // Null if user is not an admin
};

export const postGetPolicy = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/get`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error || "Failed to fetch policy details");
  }
  return superjson.parse<OutputType>(await result.text());
};