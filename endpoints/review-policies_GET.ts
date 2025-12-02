import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema, OutputType } from "./review-policies_GET.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Zod needs to coerce string 'true'/'false' to boolean and numbers
    const transformedParams = {
      ...queryParams,
      overdue_only: queryParams.overdue_only === 'true',
      page: queryParams.page ? parseInt(queryParams.page, 10) : undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : undefined,
    };

    const input = schema.parse(transformedParams);

    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let query = db.
    selectFrom("policies").
    innerJoin("users as author", "author.id", "policies.authorId").
    select([
    "policies.id",
    "policies.title",
    "policies.department",
    "policies.category",
    "policies.reviewDate",
    "author.id as authorId",
    "author.displayName as authorDisplayName",
    sql<number>`EXTRACT(DAY FROM NOW() - "policies"."review_date")`.as("daysOverdue"),
    sql<"overdue" | "due_soon" | "upcoming">`
          CASE
            WHEN "policies"."review_date" < NOW() THEN 'overdue'
            WHEN "policies"."review_date" >= NOW() AND "policies"."review_date" <= NOW() + interval '7 day' THEN 'due_soon'
            ELSE 'upcoming'
          END
        `.as("reviewStatus")]
    ).
    where("policies.organizationId", "=", user.organizationId).
    where("policies.reviewDate", "<=", thirtyDaysFromNow).
    where("policies.reviewDate", "is not", null);

    if (user.role === "editor") {
      query = query.where((eb) =>
      eb.or([
      eb("policies.authorId", "=", user.id),
      eb("policies.reviewedBy", "=", user.id)]
      )
      );
    }

    if (input.department) {
      query = query.where("policies.department", "=", input.department);
    }

    if (input.category) {
      query = query.where("policies.category", "=", input.category);
    }

    if (input.overdue_only) {
      query = query.where("policies.reviewDate", "<", new Date());
    }

    const sort = input.sort ?? "review_date";
    const order = input.order ?? (sort === "review_date" ? "asc" : "desc");

    if (sort === "review_date") {
      query = query.orderBy("policies.reviewDate", order);
    } else if (sort === "title") {
      query = query.orderBy("policies.title", order);
    } else if (sort === "department") {
      query = query.orderBy("policies.department", order);
    }

    // Get total count for pagination
    let countQuery = db
      .selectFrom("policies")
      .innerJoin("users as author", "author.id", "policies.authorId")
      .select((eb) => eb.fn.countAll<string>().as("count"))
      .where("policies.organizationId", "=", user.organizationId)
      .where("policies.reviewDate", "<=", thirtyDaysFromNow)
      .where("policies.reviewDate", "is not", null);

    if (user.role === "editor") {
      countQuery = countQuery.where((eb) =>
      eb.or([
      eb("policies.authorId", "=", user.id),
      eb("policies.reviewedBy", "=", user.id)]
      )
      );
    }

    if (input.department) {
      countQuery = countQuery.where("policies.department", "=", input.department);
    }

    if (input.category) {
      countQuery = countQuery.where("policies.category", "=", input.category);
    }

    if (input.overdue_only) {
      countQuery = countQuery.where("policies.reviewDate", "<", new Date());
    }

    const offset = (page - 1) * limit;

    // Execute queries
    const [policies, totalPoliciesResult] = await Promise.all([
      query.limit(limit).offset(offset).execute(),
      countQuery.executeTakeFirstOrThrow(),
    ]);

    const totalPolicies = parseInt(totalPoliciesResult.count, 10);

    const output: OutputType = {
      policies: policies as any[],
      pagination: {
        page,
        limit,
        total: totalPolicies,
        totalPages: Math.ceil(totalPolicies / limit),
      },
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to fetch policies for review:", error);
    const errorMessage =
    error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400
    });
  }
}