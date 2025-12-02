import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./mark-read_POST.schema";
import superjson from "superjson";
import { ZodError } from "zod";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { notificationIds } = schema.parse(json);

    if (notificationIds.length === 0) {
      return new Response(
        superjson.stringify({
          error: "At least one notification ID must be provided.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await db
      .updateTable("notifications")
      .set({ isRead: true, readAt: new Date() })
      .where("id", "in", notificationIds)
      .where("userId", "=", user.id)
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    const updatedCount = Number(result.numUpdatedRows);

    const response: OutputType = {
      success: true,
      updatedCount,
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    const errorMessage =
      error instanceof ZodError
        ? "Invalid input provided."
        : error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: error instanceof ZodError ? 400 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}