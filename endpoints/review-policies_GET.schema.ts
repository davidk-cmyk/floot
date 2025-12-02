import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  department: z.string().optional(),
  category: z.string().optional(),
  overdue_only: z.boolean().optional(),
  sort: z.enum(["review_date", "title", "department"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type InputType = z.infer<typeof schema>;

export type PolicyForReview = {
  id: number;
  title: string;
  department: string | null;
  category: string | null;
  reviewDate: Date | null;
  authorId: number;
  authorDisplayName: string;
  daysOverdue: number;
  reviewStatus: "overdue" | "due_soon" | "upcoming";
};

export type OutputType = {
  policies: PolicyForReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getReviewPolicies = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const result = await fetch(`/_api/review-policies?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    const errorMessage = typeof errorObject === 'object' && 
                        errorObject !== null && 
                        'error' in errorObject && 
                        typeof errorObject.error === 'string' 
                        ? errorObject.error 
                        : "Failed to fetch policies for review";
    throw new Error(errorMessage);
  }
  return superjson.parse<OutputType>(await result.text());
};