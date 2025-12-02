import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { ZodError } from "zod";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);

    // Parse multiple types from query parameters
    const typesParam = url.searchParams.getAll("types");
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    const input = schema.parse({
      page: url.searchParams.get("page")
        ? parseInt(url.searchParams.get("page")!, 10)
        : 1,
      limit: url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : 10,
      status: url.searchParams.get("status") ?? "all",
      types: typesParam.length > 0 ? typesParam : undefined,
      dateRange: url.searchParams.get("dateRange") ?? undefined,
      startDate: startDateParam,
      endDate: endDateParam,
      priority: url.searchParams.get("priority") ?? undefined,
      sortBy: url.searchParams.get("sortBy") ?? "date",
      sortOrder: url.searchParams.get("sortOrder") ?? "desc",
      search: url.searchParams.get("search") ?? undefined,
    });

    const { page, limit, status, types, dateRange, startDate, endDate, priority, sortBy, sortOrder, search } = input;
    const offset = (page - 1) * limit;

    // Build base query with joins for search functionality
    let query = db
      .selectFrom("notifications")
      .leftJoin("policies", "notifications.relatedPolicyId", "policies.id")
      .leftJoin("users as relatedUsers", "notifications.relatedUserId", "relatedUsers.id")
      .where("notifications.userId", "=", user.id)
      .where("notifications.organizationId", "=", user.organizationId);

    // Apply status filter
    if (status === "read") {
      query = query.where("notifications.isRead", "=", true);
    } else if (status === "unread") {
      query = query.where("notifications.isRead", "=", false);
    }

    // Apply type filter
    if (types && types.length > 0) {
      query = query.where("notifications.type", "in", types);
    }

    // Apply date range filters
    if (dateRange || startDate || endDate) {
      const now = new Date();
      let filterStartDate: Date | undefined;
      let filterEndDate: Date | undefined;

      if (dateRange === "today") {
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (dateRange === "week") {
        const dayOfWeek = now.getDay();
        filterStartDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        filterStartDate = new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), filterStartDate.getDate());
        filterEndDate = new Date(filterStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === "month") {
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else if (dateRange === "custom") {
        filterStartDate = startDate;
        filterEndDate = endDate;
      }

      if (filterStartDate) {
        query = query.where("notifications.createdAt", ">=", filterStartDate);
      }
      if (filterEndDate) {
        query = query.where("notifications.createdAt", "<", filterEndDate);
      }
    }

    // Apply priority filter (assuming priority is stored in metadata)
    if (priority) {
      query = query.where((eb) => 
        eb.or([
          sql`notifications.metadata ->> 'priority' = ${priority}`,
          // Fallback: derive priority from notification type
          eb.and([
            sql`notifications.metadata ->> 'priority' IS NULL`,
            priority === "high" ? eb("notifications.type", "in", ["policy_approval_required", "urgent_reminder"]) :
            priority === "medium" ? eb("notifications.type", "in", ["policy_assignment", "acknowledgment_reminder"]) :
            eb("notifications.type", "in", ["policy_published", "info"])
          ])
        ])
      );
    }

    // Apply search filter
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          sql`lower(notifications.title) like ${searchTerm}`,
          sql`lower(notifications.message) like ${searchTerm}`,
          sql`lower(policies.title) like ${searchTerm}`,
          sql`lower(related_users.display_name) like ${searchTerm}`,
        ])
      );
    }

    // Apply sorting
    if (sortBy === "date") {
      query = query.orderBy("notifications.createdAt", sortOrder);
    } else if (sortBy === "priority") {
      // Sort by priority with custom ordering
      query = query.orderBy((eb) => 
        eb.case()
          .when(sql`notifications.metadata ->> 'priority' = 'high'`)
          .then(eb.val("1"))
          .when(sql`notifications.metadata ->> 'priority' = 'medium'`)
          .then(eb.val("2"))
          .when(sql`notifications.metadata ->> 'priority' = 'low'`)
          .then(eb.val("3"))
          .when(eb("notifications.type", "in", ["policy_approval_required", "urgent_reminder"]))
          .then(eb.val("1"))
          .when(eb("notifications.type", "in", ["policy_assignment", "acknowledgment_reminder"]))
          .then(eb.val("2"))
          .else(eb.val("3"))
          .end(),
        sortOrder
      ).orderBy("notifications.createdAt", "desc");
    } else if (sortBy === "type") {
      query = query.orderBy("notifications.type", sortOrder).orderBy("notifications.createdAt", "desc");
    } else if (sortBy === "status") {
      query = query.orderBy("notifications.isRead", sortOrder).orderBy("notifications.createdAt", "desc");
    }

    // Get notifications with pagination
    const notifications = await query
      .select([
        "notifications.id",
        "notifications.userId",
        "notifications.organizationId",
        "notifications.title",
        "notifications.message",
        "notifications.type",
        "notifications.isRead",
        "notifications.createdAt",
        "notifications.readAt",
        "notifications.relatedPolicyId",
        "notifications.relatedUserId",
        "notifications.metadata",
        "policies.title as relatedPolicyTitle",
        "relatedUsers.displayName as relatedUserName",
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    // Get total count (reuse base query conditions)
    let countQuery = db
      .selectFrom("notifications")
      .leftJoin("policies", "notifications.relatedPolicyId", "policies.id")
      .leftJoin("users as relatedUsers", "notifications.relatedUserId", "relatedUsers.id")
      .where("notifications.userId", "=", user.id)
      .where("notifications.organizationId", "=", user.organizationId);

    // Apply same filters for count
    if (status === "read") {
      countQuery = countQuery.where("notifications.isRead", "=", true);
    } else if (status === "unread") {
      countQuery = countQuery.where("notifications.isRead", "=", false);
    }

    if (types && types.length > 0) {
      countQuery = countQuery.where("notifications.type", "in", types);
    }

    // Apply same date filters to count query
    if (dateRange || startDate || endDate) {
      const now = new Date();
      let filterStartDate: Date | undefined;
      let filterEndDate: Date | undefined;

      if (dateRange === "today") {
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (dateRange === "week") {
        const dayOfWeek = now.getDay();
        filterStartDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        filterStartDate = new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), filterStartDate.getDate());
        filterEndDate = new Date(filterStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === "month") {
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else if (dateRange === "custom") {
        filterStartDate = startDate;
        filterEndDate = endDate;
      }

      if (filterStartDate) {
        countQuery = countQuery.where("notifications.createdAt", ">=", filterStartDate);
      }
      if (filterEndDate) {
        countQuery = countQuery.where("notifications.createdAt", "<", filterEndDate);
      }
    }

    if (priority) {
      countQuery = countQuery.where((eb) => 
        eb.or([
          sql`notifications.metadata ->> 'priority' = ${priority}`,
          eb.and([
            sql`notifications.metadata ->> 'priority' IS NULL`,
            priority === "high" ? eb("notifications.type", "in", ["policy_approval_required", "urgent_reminder"]) :
            priority === "medium" ? eb("notifications.type", "in", ["policy_assignment", "acknowledgment_reminder"]) :
            eb("notifications.type", "in", ["policy_published", "info"])
          ])
        ])
      );
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      countQuery = countQuery.where((eb) =>
        eb.or([
          sql`lower(notifications.title) like ${searchTerm}`,
          sql`lower(notifications.message) like ${searchTerm}`,
          sql`lower(policies.title) like ${searchTerm}`,
          sql`lower(related_users.display_name) like ${searchTerm}`,
        ])
      );
    }

    const totalResult = await countQuery
      .select((eb) => eb.fn.countAll().as("count"))
      .executeTakeFirstOrThrow();

    // Get unread count for the user
    const unreadResult = await db
      .selectFrom("notifications")
      .where("userId", "=", user.id)
      .where("organizationId", "=", user.organizationId)
      .where("isRead", "=", false)
      .select((eb) => eb.fn.countAll().as("count"))
      .executeTakeFirstOrThrow();

    const total = Number(totalResult.count);
    const unreadCount = Number(unreadResult.count);
    const totalPages = Math.ceil(total / limit);

    const response: OutputType = {
      notifications,
      total,
      page,
      limit,
      totalPages,
      unreadCount,
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to list notifications:", error);
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