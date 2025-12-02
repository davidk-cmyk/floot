import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  topic: z.string().min(1, "Policy topic is required."),
  department: z.string().optional(),
  category: z.string().optional(),
  keyRequirements: z.string().optional(),
  tags: z.array(z.string()).optional(),
  effectiveDate: z.date().optional(),
  expirationDate: z.date().optional(),
  versionNotes: z.string().optional(),
  visibility: z.enum(["public", "internal", "group-limited"]).optional(),
  groupRestriction: z.string().optional(),
  requiresAcknowledgment: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

// The output is a stream of text, so the helper returns a ReadableStream.
// The final resolved value will be a string.
export type OutputType = ReadableStream<string>;

export const postGeneratePolicy = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/ai/generate-policy`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage = "Failed to generate policy";
    
    try {
      // Try to parse as superjson first (for structured error responses)
      const errorObject = superjson.parse(responseText);
      errorMessage = (errorObject as any).error || errorMessage;
    } catch {
      // If JSON parsing fails, treat as plain text error message
      errorMessage = responseText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("The response body is empty.");
  }

  return response.body.pipeThrough(new TextDecoderStream());
};