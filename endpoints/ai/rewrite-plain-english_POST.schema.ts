import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  policyText: z.string().min(1, "Policy text is required."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = ReadableStream<string>;

export const postRewritePlainEnglish = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/ai/rewrite-plain-english`, {
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
    let errorMessage = "Failed to rewrite policy";
    
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