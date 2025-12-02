import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./version_GET.schema";
import superjson from "superjson";
import { Selectable } from "kysely";
import { PolicyVersions } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    await getServerUserSession(request);

    const url = new URL(request.url);
    const input = schema.parse({
      policyId: url.searchParams.has("policyId")
        ? parseInt(url.searchParams.get("policyId")!, 10)
        : undefined,
      versionNumber: url.searchParams.has("versionNumber")
        ? parseInt(url.searchParams.get("versionNumber")!, 10)
        : undefined,
    });

    if (!input.policyId || !input.versionNumber) {
      return new Response(
        superjson.stringify({
          error: "Policy ID and Version Number are required.",
        }),
        { status: 400 }
      );
    }

    const version = await db
      .selectFrom("policyVersions")
      .selectAll()
      .where("policyId", "=", input.policyId)
      .where("versionNumber", "=", input.versionNumber)
      .executeTakeFirst();

    if (!version) {
      return new Response(
        superjson.stringify({ error: "Policy version not found." }),
        { status: 404 }
      );
    }

    return new Response(
      superjson.stringify(version satisfies Selectable<PolicyVersions>),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching policy version:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}