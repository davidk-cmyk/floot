import { z } from "zod";
import superjson from "superjson";

// No input schema is needed as the endpoint infers context from the user's session.
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type Suggestion = {
  title: string;
  description: string;
  category: string;
};

// The output is a stream of text, which will resolve to a JSON string
// that can be parsed into an array of Suggestion objects.
export type OutputType = ReadableStream<string>;

export const postSuggestMissingPolicies = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const response = await fetch(`/_api/ai/suggest-missing-policies`, {
    method: "POST",
    body: superjson.stringify(body),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorObject = superjson.parse(await response.text());
    throw new Error((errorObject as any).error || "Failed to get policy suggestions");
  }

  if (!response.body) {
    throw new Error("The response body is empty.");
  }

  return response.body.pipeThrough(new TextDecoderStream());
};