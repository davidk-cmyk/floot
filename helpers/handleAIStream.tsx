import { z } from "zod";
import superjson from "superjson";
import Anthropic from "@anthropic-ai/sdk";

// This helper centralizes the logic for handling AI streaming endpoints.
// Using Replit AI Integrations for Anthropic access - no API key required.
// Charges are billed to your Replit credits.

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  
  if (!apiKey || !baseURL) {
    console.error("Anthropic AI Integration environment variables are not set.");
    throw new Error("AI service is not configured.");
  }
  
  return new Anthropic({
    apiKey,
    baseURL,
  });
}

function createErrorResponse(message: string, status: number): Response {
  return new Response(superjson.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handle<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
  systemPrompt: string,
  createUserMessage: (input: z.infer<T>) => string
): Promise<Response> {
  try {
    const anthropic = getAnthropicClient();
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const userMessage = createUserMessage(validatedInput);

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: "user", content: userMessage },
      ],
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text;
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            }
          }
        } catch (error) {
          console.error("Error reading Anthropic stream:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Invalid input: ${error.errors.map((e) => e.message).join(", ")}`,
        400
      );
    }
    if (error instanceof Error) {
      return createErrorResponse(error.message, 500);
    }
    return createErrorResponse("An unknown error occurred.", 500);
  }
}
