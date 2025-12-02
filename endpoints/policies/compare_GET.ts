import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./compare_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    const url = new URL(request.url);
    const input = schema.parse({
      policyId: url.searchParams.has("policyId")
        ? parseInt(url.searchParams.get("policyId")!, 10)
        : undefined,
      version1: url.searchParams.has("version1")
        ? parseInt(url.searchParams.get("version1")!, 10)
        : undefined,
      version2: url.searchParams.has("version2")
        ? parseInt(url.searchParams.get("version2")!, 10)
        : undefined,
    });

    if (!input.policyId || !input.version1 || !input.version2) {
      return new Response(
        superjson.stringify({
          error: "Policy ID, version1, and version2 are required.",
        }),
        { status: 400 }
      );
    }

    const [version1Data, version2Data] = await Promise.all([
      db
        .selectFrom("policyVersions")
        .selectAll()
        .where("policyId", "=", input.policyId)
        .where("versionNumber", "=", input.version1)
        .where("organizationId", "=", user.organizationId)
        .executeTakeFirst(),
      db
        .selectFrom("policyVersions")
        .selectAll()
        .where("policyId", "=", input.policyId)
        .where("versionNumber", "=", input.version2)
        .where("organizationId", "=", user.organizationId)
        .executeTakeFirst(),
    ]);

    if (!version1Data || !version2Data) {
      return new Response(
        superjson.stringify({
          error: "One or both policy versions not found.",
        }),
        { status: 404 }
      );
    }

    const output: OutputType = {
      version1: version1Data,
      version2: version2Data,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error comparing policy versions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}