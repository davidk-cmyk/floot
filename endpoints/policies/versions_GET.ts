import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./versions_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    const url = new URL(request.url);
    const input = schema.parse({
      policyId: url.searchParams.has("policyId")
        ? parseInt(url.searchParams.get("policyId")!, 10)
        : undefined,
    });

    if (!input.policyId) {
      return new Response(
        superjson.stringify({ error: "Policy ID is required." }),
        { status: 400 }
      );
    }

    const versions = await db
      .selectFrom("policyVersions")
      .innerJoin("users", "policyVersions.createdBy", "users.id")
      .where("policyVersions.policyId", "=", input.policyId)
      .where("policyVersions.organizationId", "=", user.organizationId)
      .select([
        "policyVersions.id",
        "policyVersions.policyId",
        "policyVersions.versionNumber",
        "policyVersions.title",
        "policyVersions.createdAt",
        "policyVersions.changeSummary",
        "users.displayName as createdByDisplayName",
      ])
      .orderBy("policyVersions.versionNumber", "desc")
      .execute();

    return new Response(superjson.stringify(versions satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching policy versions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}