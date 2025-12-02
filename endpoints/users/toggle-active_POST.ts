import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./toggle-active_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user: adminUser } = await getServerUserSession(request);

    if (adminUser.role !== "admin") {
      return new Response(
        superjson.stringify({
          error: "Forbidden",
        }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const { userId, isActive } = schema.parse(json);

    if (adminUser.id === userId) {
      return new Response(
        superjson.stringify({ error: "Admins cannot change their own active status." }),
        { status: 400 }
      );
    }

    const result = await db
      .updateTable("users")
      .set({ isActive })
      .where("id", "=", userId)
      .executeTakeFirst();

    if (result.numUpdatedRows === 0n) {
        return new Response(
            superjson.stringify({ error: "User not found." }),
            { status: 404 }
        );
    }

    // If deactivating a user, also expire their sessions
    if (!isActive) {
        await db.deleteFrom("sessions").where("userId", "=", userId).execute();
    }

    return new Response(
      superjson.stringify({ success: true } satisfies OutputType)
    );
  } catch (error) {
    console.error("Failed to toggle user active status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
}