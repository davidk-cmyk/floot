import { schema } from "./generate-policy_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { UserRole } from "../../helpers/schema";
import { db } from "../../helpers/db";
import { processTemplateContent, OrganizationVariables } from "../../helpers/templateProcessorBackend";
import superjson from "superjson";
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

function transformVariablesToNestedStructure(
  variables: Array<{ variableName: string; variableValue: string | null }>
): OrganizationVariables {
  const nested: OrganizationVariables = {
    company: {},
    leadership: {},
    departments: {},
    policies: {},
    contact: {},
  };

  for (const variable of variables) {
    const { variableName, variableValue } = variable;
    if (!variableValue || !variableValue.trim()) {
      continue;
    }

    const parts = variableName.split('.');
    if (parts.length !== 2) {
      console.warn(`Skipping invalid variable name format: ${variableName}`);
      continue;
    }

    const [category, field] = parts;
    
    if (category === 'company' || category === 'leadership' || category === 'departments' || category === 'policies' || category === 'contact') {
      (nested[category] as any)[field] = variableValue;
    } else {
      console.warn(`Unknown variable category: ${category}`);
    }
  }

  return nested;
}

export async function handle(request: Request) {
  const { user } = await getServerUserSession(request);
  if (!ALLOWED_ROLES.includes(user.role)) {
    return new Response(
      JSON.stringify({
        error: "You do not have permission to perform this action.",
      }),
      { status: 403 }
    );
  }

  const organization = await db
    .selectFrom("organizations")
    .selectAll()
    .where("id", "=", user.organizationId)
    .executeTakeFirst();

  if (!organization) {
    return new Response(
      JSON.stringify({
        error: "Organization not found.",
      }),
      { status: 404 }
    );
  }

  const variables = await db
    .selectFrom("organizationVariables")
    .selectAll()
    .where("organizationId", "=", user.organizationId)
    .execute();

  const nestedVariables = transformVariablesToNestedStructure(variables);

  const availableVars = variables
    .filter(v => v.variableValue && v.variableValue.trim())
    .map(v => `/${v.variableName}/ (${v.variableValue})`);

  let variableContext = '';
  if (availableVars.length > 0) {
    variableContext = `\n\nAVAILABLE ORGANIZATION VARIABLES:
Use these variables in your policy content where appropriate by using the /variable.name/ syntax:
${availableVars.join('\n')}

**CRITICAL RULES FOR VARIABLES:**
1. ONLY use variables from the list above that are explicitly provided.
2. DO NOT invent, create, or suggest new variables under ANY circumstances.
3. If you need information that doesn't have a variable, use a generic placeholder like [INFORMATION NEEDED] or leave it blank.
4. DO NOT use variable syntax (/ /) for anything not in the provided list.
5. If the variable list is empty, do not use any variable syntax at all.`;
  } else {
    variableContext = `\n\nNo organization variables are configured. Do not use any variable syntax in your output.`;
  }

  const systemPrompt = `You are an AI Policy Authoring Assistant. Your task is to generate a comprehensive and professional policy document based on the user's request.

Instructions:
1.  Generate a clear, concise title for the policy.
2.  Structure the policy with logical sections and headings.
3.  Use professional and formal language suitable for a corporate or organizational policy.
4.  Incorporate any specified key requirements, department, and target audience information.
5.  Ensure the content is practical, actionable, and covers the topic thoroughly.
6.  The output should be a single block of Markdown text, starting with a level 1 heading for the title (e.g., '# Policy Title').
7.  **CRITICAL**: ONLY use the variables listed above. DO NOT create new variables. Use the /variable.name/ syntax ONLY for the explicitly provided variables.${variableContext}`;

  try {
    const anthropic = getAnthropicClient();
    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    const userMessageParts = [
      `Generate a new policy on the topic of: "${validatedInput.topic}".`,
    ];
    if (validatedInput.department) {
      userMessageParts.push(`This policy is for the ${validatedInput.department} department.`);
    }
    if (validatedInput.category) {
      userMessageParts.push(`This policy falls under the ${validatedInput.category} category.`);
    }
    if (validatedInput.keyRequirements) {
      userMessageParts.push(`Please ensure the following key requirements are met: ${validatedInput.keyRequirements}`);
    }
    if (validatedInput.tags && validatedInput.tags.length > 0) {
      userMessageParts.push(`The policy should be tagged with the following tags: ${validatedInput.tags.join(", ")}`);
    }
    if (validatedInput.effectiveDate) {
      userMessageParts.push(`The policy will become effective on: ${validatedInput.effectiveDate.toLocaleDateString()}`);
    }
    if (validatedInput.expirationDate) {
      userMessageParts.push(`The policy will expire on: ${validatedInput.expirationDate.toLocaleDateString()}`);
    }
    if (validatedInput.versionNotes) {
      userMessageParts.push(`Version notes: ${validatedInput.versionNotes}`);
    }
    if (validatedInput.visibility) {
      userMessageParts.push(`The policy visibility is set to: ${validatedInput.visibility}`);
    }
    if (validatedInput.groupRestriction) {
      userMessageParts.push(`The policy is restricted to the following group: ${validatedInput.groupRestriction}`);
    }
    if (validatedInput.requiresAcknowledgment) {
      userMessageParts.push(`This policy requires user acknowledgment - users must acknowledge that they have read and understood this policy.`);
    }
    const userMessage = userMessageParts.join("\n");

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: "user", content: userMessage },
      ],
    });

    const encoder = new TextEncoder();
    let bufferedContent = '';
    let streamError: Error | null = null;

    const processedStream = new ReadableStream({
      async start(controller) {
        stream.on('text', (text) => {
          if (text) {
            controller.enqueue(encoder.encode(`data: ${text}\n\n`));
            bufferedContent += text;
          }
        });

        stream.on('error', (error) => {
          console.error("Anthropic stream error:", error);
          streamError = error;
        });

        stream.on('end', () => {
          try {
            console.log("Processing template content with variables...");
            const processedContent = processTemplateContent(
              bufferedContent,
              organization,
              nestedVariables
            );

            controller.enqueue(encoder.encode(`data: __VARIABLES_PROCESSED__\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(processedContent)}\n\n`));
          } catch (error) {
            console.error("Error processing template:", error);
          } finally {
            controller.close();
          }
        });

        try {
          await stream.finalMessage();
        } catch (error) {
          console.error("Error waiting for final message:", error);
          if (!streamError) {
            controller.close();
          }
        }
      },
    });

    return new Response(processedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in generate-policy:", error);
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "An unknown error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
