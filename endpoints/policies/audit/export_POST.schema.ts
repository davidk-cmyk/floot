import { z } from "zod";
import superjson from "superjson";
import { AUDIT_LOG_ACTIONS } from "../audit_GET.schema";

// Re-using the filter and sort schemas from the main audit endpoint, but excluding pagination.
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
});

export type InputType = z.infer<typeof schema>;

// The output is a raw Response object containing the CSV file.
// The client is responsible for handling this response (e.g., triggering a download).
export type OutputType = Response;

export const postPolicyAuditExport = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/audit/export`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    // If the response is not OK, it might be a JSON error from the server
    try {
      const errorObject = superjson.parse<{ error: string }>(
        await result.text()
      );
      throw new Error(errorObject.error);
    } catch (e) {
      // If parsing fails, throw a generic error
      throw new Error(`Failed to export audit log: ${result.statusText}`);
    }
  }

  // Return the raw response for the client to handle file download
  return result;
};