import { handle as handleStream } from "../../helpers/handleOpenAIStream";
import { schema } from "./generate-policy_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { UserRole } from "../../helpers/schema";
import { db } from "../../helpers/db";
import { processTemplateContent, OrganizationVariables } from "../../helpers/templateProcessorBackend";
import superjson from "superjson";


const ALLOWED_ROLES: UserRole[] = ["admin", "editor"];

// Transform flat database variables into nested structure
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
    
    // Type-safe assignment to nested structure
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

  // Get organization details
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

  // Get organization variables from database
  const variables = await db
    .selectFrom("organizationVariables")
    .selectAll()
    .where("organizationId", "=", user.organizationId)
    .execute();

  // Transform variables to nested structure for template processing
  const nestedVariables = transformVariablesToNestedStructure(variables);

  // Build variable context from the fetched variables
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

  // Parse and validate input
  const json = superjson.parse(await request.text());
  const validatedInput = schema.parse(json);

  // Build user message
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

  // Get OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY environment variable is not set.");
    return new Response(
      superjson.stringify({ error: "AI service is not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Call OpenAI
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
    return new Response(
      superjson.stringify({
        error: errorBody.error?.message || "Failed to get response from AI service."
      }),
      { status: openaiResponse.status, headers: { "Content-Type": "application/json" } }
    );
  }

  // Two-phase streaming: raw content first (real-time), then processed content with variables
  const processedStream = new ReadableStream({
    async start(controller) {
      if (!openaiResponse.body) {
        controller.close();
        return;
      }

      const reader = openaiResponse.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let bufferedContent = '';

      try {
        // Phase 1: Stream raw chunks immediately while buffering
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
                  // Stream immediately to client in SSE format for real-time display
                  controller.enqueue(encoder.encode(`data: ${content}\n\n`));
                  // Also buffer for variable processing
                  bufferedContent += content;
                }
              } catch (e) {
                console.error("Error parsing OpenAI stream data:", e, "Data:", data);
              }
            }
          }
        }

        // Phase 2: Process variables and send final version
        console.log("Processing template content with variables...");
        const processedContent = processTemplateContent(
          bufferedContent,
          organization,
          nestedVariables
        );

        // Send marker followed by processed content in SSE format
        // JSON encode to preserve multi-line content with blank lines as a single SSE message
        controller.enqueue(encoder.encode(`data: __VARIABLES_PROCESSED__\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(processedContent)}\n\n`));
        
      } catch (error) {
        console.error("Error in stream processing:", error);
        controller.error(error);
      } finally {
        controller.close();
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
}