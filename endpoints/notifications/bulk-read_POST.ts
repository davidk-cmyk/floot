import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./bulk-read_POST.schema";
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

    console.log(
      `User ${user.id} marked ${updatedCount} notifications as read.`
    );

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to bulk mark notifications as read:", error);
    let errorMessage = "An unexpected error occurred.";
    let statusCode = 500;

    if (error instanceof ZodError) {
      errorMessage = "Invalid input provided.";
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      // NotAuthenticatedError from getServerUserSession would result in a 500 from the framework,
      // which is fine, but we can be more specific if we catch it.
      if (error.name === 'NotAuthenticatedError') {
        statusCode = 401;
      }
    }

    return new Response(superjson.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}