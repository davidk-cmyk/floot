import { z } from "zod";
import superjson from "superjson";
import { schema } from "./policy-prompt_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { UserRole } from "../../helpers/schema";
import { db } from "../../helpers/db";

const ALLOWED_ROLES: UserRole[] = ["admin", "editor"];

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

export async function handle(request: Request) {
  const { user } = await getServerUserSession(request);
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return new Response(
      JSON.stringify({
        error: "You do not have permission to perform this action.",
      }),
      { status: 403 }
    );
  }

  // Get organization variables
  const variables = await db
    .selectFrom("organizationVariables")
    .selectAll()
    .where("organizationId", "=", user.organizationId)
    .execute();

  const availableVars = variables
    .filter(v => v.variableValue && v.variableValue.trim())
    .map(v => `/${v.variableName}/ (${v.variableValue})`);

  let variableContext = '';
  if (availableVars.length > 0) {
    variableContext = `\n\nAVAILABLE ORGANIZATION VARIABLES:\nThese variables are available if needed:\n${availableVars.join('\n')}\n\n**CRITICAL RULES FOR VARIABLES:**\n1. PRESERVE all existing literal company information (addresses, emails, names, phone numbers, etc.) exactly as written. DO NOT replace real values with variable syntax.\n2. Only use variable syntax (e.g., /company.name/) if it ALREADY EXISTS in the provided text. Never introduce new variable syntax.\n3. DO NOT convert literal values to variables.\n4. If variable syntax already exists in the text, preserve it as-is.`;
  } else {
    variableContext = '\n\n**IMPORTANT**: No organization variables are configured. Do not use any /variable.name/ syntax in your output.';
  }

  const systemPrompt = `You are an AI Policy Authoring Assistant. Your task is to act as an editor and modify the provided policy document based on the user's instructions.

Instructions:
1.  Carefully analyze the user's prompt to understand the requested changes. This could involve content addition/removal, rephrasing, formatting changes, structural reorganization, or correcting grammar and spelling.
2.  Apply the changes directly to the provided policy text.
3.  Return ONLY the complete, modified policy document as clean Markdown text. Do not include any conversational text, explanations, apologies, or code fence wrappers (like \`\`\`markdown or \`\`\`) in your response. The output must be the full, updated policy content as plain Markdown without any code block formatting.
4.  If the user's prompt is unclear or ambiguous, make a reasonable interpretation and apply the change.
5.  Maintain the overall professional tone and structure of the policy unless explicitly asked to change it.
6.  **CRITICAL**: Preserve all literal company-specific details (addresses, phone numbers, emails, names, etc.) exactly as written. Never replace them with variables unless the variable syntax already exists in the original text.${variableContext}`;

  try {
    const apiKey = await getOpenAIKey();
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    // Construct the user message
    const historyMessages = (validatedInput.history || [])
      .map(
        (msg) =>
          `${msg.role === "user" ? "Previous instruction" : "Previous version"}:\n${msg.content}`
      )
      .join("\n\n---\n\n");

    const userMessageParts = [
      "Here is the current policy document:",
      "",
      "=== POLICY DOCUMENT START ===",
      validatedInput.policyText,
      "=== POLICY DOCUMENT END ===",
      "",
      "---",
      "",
      historyMessages,
      `\nPlease apply the following instruction to the document: "${validatedInput.prompt}"`,
    ];

    const userMessage = userMessageParts.join("\n");

    const openaiPayload = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
      // Note: No response_format here since we want plain text, not JSON
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