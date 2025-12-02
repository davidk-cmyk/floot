import { z } from "zod";
import superjson from "superjson";

// This helper centralizes the logic for handling OpenAI streaming endpoints.
// It's not a React component or hook, just a server-side utility function.

async function getOpenAIKey(): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY environment variable is not set.");
    throw new Error("AI service is not configured.");
  }
  return apiKey;
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
    const apiKey = await getOpenAIKey();
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const userMessage = createUserMessage(validatedInput);

    const openaiPayload = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
    };

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(openaiPayload),
      }
    );

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.json();
      console.error("OpenAI API error:", errorBody);
      return createErrorResponse(
        errorBody.error?.message || "Failed to get response from AI service.",
        openaiResponse.status
      );
    }

    // The body is a stream of Server-Sent Events (SSE). We need to parse it.
    const readableStream = new ReadableStream({
      async start(controller) {
        if (!openaiResponse.body) {
          controller.close();
          return;
        }
        const reader = openaiResponse.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.substring(6);
                if (data.trim() === "[DONE]") {
                  break;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (e) {
                  console.error("Error parsing OpenAI stream data:", e, "Data:", data);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error reading OpenAI stream:", error);
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