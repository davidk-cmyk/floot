import { handle as handleStream } from "../../helpers/handleAIStream";
import { schema } from "./suggest-improvements_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { UserRole } from "../../helpers/schema";
import { db } from "../../helpers/db";
import { 
  extractTemplateVariables 
} from "../../helpers/templateProcessorBackend";

const ALLOWED_ROLES: UserRole[] = ["admin", "editor"];

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

  // Get organization variables from database
  const variables = await db
    .selectFrom("organizationVariables")
    .selectAll()
    .where("organizationId", "=", user.organizationId)
    .execute();

  // Build variable context from the fetched variables
  const availableVars = variables
    .filter(v => v.variableValue && v.variableValue.trim())
    .map(v => `/${v.variableName}/ (${v.variableValue})`);

  let variableContext = '';
  if (availableVars.length > 0) {
    variableContext = `\n\nAVAILABLE ORGANIZATION VARIABLES:
Consider suggesting the use of these variables to replace hard-coded information:
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

  const systemPrompt = `You are an AI Policy Authoring Assistant. Your task is to analyze an existing policy and suggest improvements.

Instructions:
1.  Analyze the provided policy content for clarity, completeness, compliance, and accessibility.
2.  Provide structured suggestions for improvement.
3.  Organize suggestions into categories (e.g., "Clarity", "Completeness", "Compliance", "Accessibility", "Variable Usage").
4.  For each suggestion, briefly explain the issue and propose a concrete improvement.
5.  Format the output as a Markdown list.
6.  **IMPORTANT**: In the "Variable Usage" section, ONLY suggest using variables that are in the provided list. DO NOT suggest creating new variables. If hard-coded information exists but no matching variable is available, suggest adding a placeholder instead of inventing a variable.${variableContext}`;

  return handleStream(request, schema, systemPrompt, (input) => {
    // Extract existing variables from the policy text
    const existingVariables = extractTemplateVariables(input.policyText);
    let existingVarsContext = '';
    
    if (existingVariables.length > 0) {
      existingVarsContext = `\n\nCURRENTLY USED VARIABLES:
The following variables are already in use (acknowledge them in your analysis):
${existingVariables.map(v => `/${v}/`).join(', ')}`;
    }
    
    return `Analyze the following policy and suggest improvements:${existingVarsContext}\n\n---\n\n${input.policyText}`;
  });
}