import { handle as handleStream } from "../../helpers/handleOpenAIStream";
import { schema } from "./suggest-missing-policies_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { UserRole } from "../../helpers/schema";
import { db } from "../../helpers/db";

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

  if (!user.organizationId) {
    return new Response(
      JSON.stringify({
        error: "User is not associated with an organization.",
      }),
      { status: 400 }
    );
  }

  // Fetch existing policy titles, categories, and departments for the organization
  const existingPolicies = await db
    .selectFrom("policies")
    .select(["title", "category", "department"])
    .where("organizationId", "=", user.organizationId)
    .execute();

  const systemPrompt = `You are an AI Policy Advisor for a company. Your task is to analyze a list of existing policies and conduct a comprehensive assessment to suggest 6-8 important policies that are likely missing.

Instructions:
1.  Review the provided list of existing policy titles, categories, and departments thoroughly.
2.  Conduct a comprehensive analysis across ALL major business areas to identify critical gaps. Ensure coverage across: HR practices, IT security, data protection, workplace safety, financial controls, operational procedures, legal compliance, and business conduct.
3.  Prioritize policies that are:
   - Legally required or highly recommended for compliance
   - Essential for business operations and risk management
   - Common industry standards that most organizations need
   - Critical for protecting employees, customers, and company assets
4.  Ensure your suggestions provide balanced coverage across the standard categories: "Human Resources", "Information Technology & Security", "Health & Safety", "Finance & Expenses", "Operations & Conduct", "Legal & Compliance", "Data Protection & Privacy".
5.  For each suggestion, provide a clear, specific title and a concise description (1-2 sentences) explaining why it's important and its business value.
6.  Do not suggest policies that are variations or duplicates of existing ones - carefully check for semantic overlap.
7.  Consider policies needed for different business scenarios: remote work, vendor management, incident response, employee lifecycle, data handling, financial controls, etc.
8.  CRITICAL: Return ONLY a JSON object with a "policies" key containing an array of exactly 6-8 policy suggestions. Each object in the array must have exactly three keys: "title", "description", and "category". Ensure diverse coverage across all categories.

Example format (return exactly this structure):
{
  "policies": [
    {
      "title": "Example Policy Title",
      "description": "Example description explaining the policy importance and business value.",
      "category": "Human Resources"
    }
  ]
}`;

  return handleStream(request, schema, systemPrompt, () => {
    const policyList =
      existingPolicies.length > 0
        ? existingPolicies
            .map(
              (p) =>
                `- Title: ${p.title}, Category: ${p.category || "N/A"}, Department: ${p.department || "N/A"}`
            )
            .join("\n")
        : "No policies exist yet.";

    return `Here is the list of current policies for the organization:\n${policyList}\n\nBased on this list, please suggest missing policies.`;
  });
}