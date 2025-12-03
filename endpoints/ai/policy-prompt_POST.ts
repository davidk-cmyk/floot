import { z } from "zod";
import superjson from "superjson";
import { schema } from "./policy-prompt_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { UserRole } from "../../helpers/schema";
import { db } from "../../helpers/db";
import Anthropic from "@anthropic-ai/sdk";

const ALLOWED_ROLES: UserRole[] = ["admin", "editor"];

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
    const anthropic = getAnthropicClient();
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

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
