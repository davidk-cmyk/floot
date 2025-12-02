import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const session = await db
      .selectFrom("policyReadingSessions")
      .where("id", "=", input.sessionId)
      .where("userId", "=", user.id)
      .select(["sessionStartedAt", "sessionEndedAt"])
      .executeTakeFirst();

    if (!session) {
      return new Response(
        superjson.stringify({ error: "Reading session not found or you do not have permission to update it." }),
        { status: 404 }
      );
    }

    if (session.sessionEndedAt) {
        return new Response(
            superjson.stringify({ error: "This reading session has already ended." }),
            { status: 400 }
        );
    }

    const now = new Date();
    const timeSpentSeconds = session.sessionStartedAt 
      ? Math.round((now.getTime() - new Date(session.sessionStartedAt).getTime()) / 1000)
      : 0;

    const updatedSession = await db
      .updateTable("policyReadingSessions")
      .set({
        completionPercentage: input.completionPercentage,
        pagesVisited: input.pagesVisited,
        timeSpentSeconds,
        sessionEndedAt: input.isFinalUpdate ? now : null,
      })
      .where("id", "=", input.sessionId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(updatedSession satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating reading session:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}