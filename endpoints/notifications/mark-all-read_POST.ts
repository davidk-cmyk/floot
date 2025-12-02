import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { OutputType } from "./mark-all-read_POST.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    const result = await db
      .updateTable("notifications")
      .set({ isRead: true, readAt: new Date() })
      .where("userId", "=", user.id)
      .where("organizationId", "=", user.organizationId)
      .where("isRead", "=", false)
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
    console.error("Failed to mark all notifications as read:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}