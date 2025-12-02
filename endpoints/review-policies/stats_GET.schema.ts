import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  totalDueForReview: number;
  totalOverdue: number;
  dueSoon: number;
  upcoming: number;
};

export const getReviewStats = async (
  params?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/review-policies/stats`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    const errorMessage =
      typeof errorObject === "object" &&
      errorObject !== null &&
      "error" in errorObject &&
      typeof errorObject.error === "string"
        ? errorObject.error
        : "Failed to fetch policy review stats";
    throw new Error(errorMessage);
  }
  return superjson.parse<OutputType>(await result.text());
};