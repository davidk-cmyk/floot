import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./start_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { policyId } = schema.parse(json);

    // Verify policy exists and belongs to user's organization
    const policy = await db
      .selectFrom("policies")
      .select("id")
      .where("id", "=", policyId)
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    if (!policy) {
      return new Response(
        superjson.stringify({ error: "Policy not found or access denied." }),
        { status: 404 }
      );
    }

    const newSession = await db
      .insertInto("policyReadingSessions")
      .values({
        policyId,
        userId: user.id,
        organizationId: user.organizationId,
        sessionStartedAt: new Date(),
        timeSpentSeconds: 0,
        completionPercentage: 0,
        pagesVisited: 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(newSession satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    console.error("Error starting reading session:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}