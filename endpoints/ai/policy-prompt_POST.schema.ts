import { z } from "zod";
import superjson from "superjson";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const schema = z.object({
  policyText: z.string().min(1, "Policy text is required."),
  prompt: z.string().min(1, "A prompt is required."),
  history: z.array(messageSchema).optional(),
});

export type InputType = z.infer<typeof schema>;
export type Message = z.infer<typeof messageSchema>;

// The output is a stream of text, so the helper returns a ReadableStream.
export type OutputType = ReadableStream<string>;

export const postPolicyPrompt = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const response = await fetch(`/_api/ai/policy-prompt`, {
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
    let errorMessage = "Failed to process policy prompt";
    
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