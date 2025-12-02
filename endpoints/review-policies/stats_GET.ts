import { db } from '../../helpers/db';
import { getServerUserSession } from '../../helpers/getServerUserSession';
import { OutputType } from "./stats_GET.schema";
import superjson from "superjson";
import { sql } from 'kysely';

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const now = new Date();

    let query = db
      .selectFrom("policies")
      .where("policies.organizationId", "=", user.organizationId)
      .where("policies.reviewDate", "is not", null)
      .where("policies.reviewDate", "<=", thirtyDaysFromNow);

    if (user.role === "editor") {
      query = query.where((eb) =>
        eb.or([
          eb("policies.authorId", "=", user.id),
          eb("policies.reviewedBy", "=", user.id),
        ])
      );
    }

    const statsResult = await query
      .select((eb) => [
        eb.fn.countAll<string>().as("totalDueForReview"),
        eb.fn
          .countAll<string>()
          .filterWhere("policies.reviewDate", "<", now)
          .as("totalOverdue"),
        eb.fn
          .countAll<string>()
          .filterWhere("policies.reviewDate", ">=", now)
          .filterWhere("policies.reviewDate", "<=", sevenDaysFromNow)
          .as("dueSoon"),
        eb.fn
          .countAll<string>()
          .filterWhere("policies.reviewDate", ">", sevenDaysFromNow)
          .as("upcoming"),
      ])
      .executeTakeFirst();

    if (!statsResult) {
      // This should not happen, but as a safeguard return zeroed stats.
      const zeroStats: OutputType = {
        totalDueForReview: 0,
        totalOverdue: 0,
        dueSoon: 0,
        upcoming: 0,
      };
      return new Response(superjson.stringify(zeroStats), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const output: OutputType = {
      totalDueForReview: parseInt(statsResult.totalDueForReview, 10),
      totalOverdue: parseInt(statsResult.totalOverdue, 10),
      dueSoon: parseInt(statsResult.dueSoon, 10),
      upcoming: parseInt(statsResult.upcoming, 10),
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch policy review stats:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}