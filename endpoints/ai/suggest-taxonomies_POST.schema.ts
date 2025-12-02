import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  topic: z
    .string()
    .min(3, "Topic must be at least 3 characters long.")
    .max(200, "Topic must be 200 characters or less."),
});

export const outputSchema = z.object({
  categories: z.array(z.string()),
  departments: z.array(z.string()),
  tags: z.array(z.string()),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = z.infer<typeof outputSchema>;

export const postSuggestTaxonomies = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/ai/suggest-taxonomies`, {
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
    throw new Error((errorObject as any).error || "Failed to suggest taxonomies");
  }
  return superjson.parse<OutputType>(await result.text());
};