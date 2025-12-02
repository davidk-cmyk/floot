import { handle as handleStream } from "../../helpers/handleOpenAIStream";
import { schema } from "./rewrite-plain-english_POST.schema";
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
These variables are available if needed:
${availableVars.join('\n')}

**CRITICAL RULES FOR VARIABLES:**
1. PRESERVE all existing literal company information (addresses, emails, names, phone numbers, etc.) exactly as written. DO NOT replace real values with variable syntax.
2. If variable syntax like /company.name/ already exists in the text, preserve it. Otherwise, keep all literal values as-is.
3. DO NOT convert literal values to variables.
4. DO NOT invent, create, or suggest new variables under ANY circumstances.`;
  } else {
    variableContext = `\n\nNo organization variables are configured. Do not use any variable syntax in your output.`;
  }

  const systemPrompt = `You are an AI Policy Authoring Assistant. Your task is to rewrite complex policy text into plain, simple English.

Instructions:
1.  Simplify complex sentences and vocabulary.
2.  Maintain the original meaning and all legal/compliance requirements.
3.  Use clear, direct language that is easy for a general audience to understand.
4.  Break down long paragraphs into shorter, more digestible ones.
5.  The output should be the rewritten text only.
6.  **CRITICAL**: Keep all literal company information (addresses, emails, names, phone numbers, etc.) exactly as written in the original text. Only preserve existing variable syntax if it's already present. Never convert literal values to variables.${variableContext}`;

  return handleStream(request, schema, systemPrompt, (input) => {
    // Extract existing variables from the policy text
    const existingVariables = extractTemplateVariables(input.policyText);
    let existingVarsContext = '';
    
    if (existingVariables.length > 0) {
      existingVarsContext = `\n\nEXISTING VARIABLES IN TEXT:
The following variables are already used in this text - preserve them:
${existingVariables.map(v => `/${v}/`).join(', ')}`;
    }
    
    return `Rewrite the following policy text in plain English:${existingVarsContext}\n\n---\n\n${input.policyText}`;
  });
}