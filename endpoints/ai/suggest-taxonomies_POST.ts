import superjson from "superjson";
import { z } from "zod";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import {
  STANDARD_POLICY_CATEGORIES,
  STANDARD_DEPARTMENTS,
  STANDARD_POLICY_TAGS,
} from "../../helpers/globalPolicyTaxonomiesBackend";
import {
  InputType,
  OutputType,
  schema,
  outputSchema,
} from "./suggest-taxonomies_POST.schema";

const POLICY_TAXONOMIES_SETTING_KEY = "policy_taxonomies";

type CustomTaxonomies = {
  categories: string[];
  departments: string[];
  tags: string[];
};

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

function buildSystemPrompt(
  allCategories: string[],
  allDepartments: string[],
  allTags: string[]
): string {
  return `You are an expert policy management assistant. Your task is to analyze a policy topic and suggest the most relevant classifications from a predefined list.

You will be given a policy topic and lists of available categories, departments, and tags.
Your response MUST be a valid JSON object with three keys: "categories", "departments", and "tags".
Each key should have a value of an array of strings.
The strings in these arrays MUST be exact matches from the provided lists. Do not invent new items.
Select only the most relevant items. If no items are relevant for a given key, return an empty array [].

Available Categories:
${allCategories.join(", ")}

Available Departments:
${allDepartments.join(", ")}

Available Tags:
${allTags.join(", ")}

Example response format:
{
  "categories": ["Information Technology & Security"],
  "departments": ["IT", "All Departments"],
  "tags": ["cybersecurity", "password policy", "acceptable use"]
}`;
}

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const apiKey = await getOpenAIKey();

    const json = superjson.parse(await request.text());
    const validatedInput = schema.parse(json);

    // 1. Fetch custom taxonomies for the user's organization
    const customTaxonomySetting = await db
      .selectFrom("settings")
      .select("settingValue")
      .where("organizationId", "=", user.organizationId)
      .where("settingKey", "=", POLICY_TAXONOMIES_SETTING_KEY)
      .executeTakeFirst();

    const customTaxonomies: CustomTaxonomies = customTaxonomySetting
      ? (customTaxonomySetting.settingValue as CustomTaxonomies)
      : { categories: [], departments: [], tags: [] };

    // 2. Combine standard and custom taxonomies
    const allCategories = [
      ...new Set([
        ...STANDARD_POLICY_CATEGORIES,
        ...(customTaxonomies.categories || []),
      ]),
    ];
    const allDepartments = [
      ...new Set([
        ...STANDARD_DEPARTMENTS,
        ...(customTaxonomies.departments || []),
      ]),
    ];
    const allTags = [
      ...new Set([...STANDARD_POLICY_TAGS, ...(customTaxonomies.tags || [])]),
    ];

    // 3. Construct the prompt and call OpenAI
    const systemPrompt = buildSystemPrompt(
      allCategories,
      allDepartments,
      allTags
    );
    const userMessage = `Policy Topic: "${validatedInput.topic}"`;

    const openaiPayload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
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

    const result = await openaiResponse.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return createErrorResponse("AI returned an empty response.", 500);
    }

    // 4. Parse and validate the AI's response
    const parsedContent = JSON.parse(content);
    const validatedOutput = outputSchema.parse(parsedContent);

    // 5. Filter out any suggestions that are not in the allowed lists (hallucinations)
    const finalOutput: OutputType = {
      categories: validatedOutput.categories.filter((c) =>
        allCategories.includes(c)
      ),
      departments: validatedOutput.departments.filter((d) =>
        allDepartments.includes(d)
      ),
      tags: validatedOutput.tags.filter((t) => allTags.includes(t)),
    };

    return new Response(superjson.stringify(finalOutput satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error suggesting taxonomies:", error);
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