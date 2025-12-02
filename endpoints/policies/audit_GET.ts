import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType, AuditLogEntry, assertAuditLogAction } from "./audit_GET.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: Admins only" }),
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const input = schema.parse({
      policyId: url.searchParams.has("policyId")
        ? parseInt(url.searchParams.get("policyId")!, 10)
        : undefined,
      policyName: url.searchParams.get("policyName") || undefined,
      action: url.searchParams.get("action") || undefined,
      userId: url.searchParams.has("userId")
        ? parseInt(url.searchParams.get("userId")!, 10)
        : undefined,
      userName: url.searchParams.get("userName") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      sortBy: (url.searchParams.get("sortBy") as any) || "actionTimestamp",
      sortOrder: (url.searchParams.get("sortOrder") as any) || "desc",
      page: url.searchParams.has("page")
        ? parseInt(url.searchParams.get("page")!, 10)
        : 1,
      limit: url.searchParams.has("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : 20,
    });

    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const offset = (page - 1) * limit;

    // Create filter-only base query without select, orderBy, or limit
    let baseQuery = db
      .selectFrom("policyAuditLog")
      .innerJoin("users", "users.id", "policyAuditLog.actionBy")
      .where("policyAuditLog.organizationId", "=", session.user.organizationId);

    // Apply all WHERE clauses to the base query
    if (input.policyId) {
      baseQuery = baseQuery.where("policyAuditLog.policyId", "=", input.policyId);
    }
    if (input.policyName) {
      baseQuery = baseQuery.where("policyAuditLog.policyName", "ilike", `%${input.policyName}%`);
    }
    if (input.action) {
      baseQuery = baseQuery.where("policyAuditLog.action", "=", input.action);
    }
    if (input.userId) {
      baseQuery = baseQuery.where("policyAuditLog.actionBy", "=", input.userId);
    }
    if (input.userName) {
      baseQuery = baseQuery.where("users.displayName", "ilike", `%${input.userName}%`);
    }
    if (input.startDate) {
      baseQuery = baseQuery.where(
        "policyAuditLog.actionTimestamp",
        ">=",
        new Date(input.startDate)
      );
    }
    if (input.endDate) {
      // Add 1 day to endDate to make it inclusive
      const inclusiveEndDate = new Date(input.endDate);
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
      baseQuery = baseQuery.where(
        "policyAuditLog.actionTimestamp",
        "<",
        inclusiveEndDate
      );
    }

    // Build the paginated results query by cloning base and adding explicit column selection, ordering, and pagination
    const sortColumn =
      input.sortBy === "policyName"
        ? "policyAuditLog.policyName"
        : input.sortBy === "user"
        ? "users.displayName"
        : "policyAuditLog.actionTimestamp";

    const resultsQuery = baseQuery
      .select([
        "policyAuditLog.id",
        "policyAuditLog.policyId",
        "policyAuditLog.policyName",
        "policyAuditLog.action",
        "policyAuditLog.actionTimestamp",
        "policyAuditLog.details",
        "users.id as userId",
        "users.displayName as userDisplayName",
        "users.email as userEmail",
      ])
      .orderBy(sortColumn, input.sortOrder ?? "desc")
      .limit(limit)
      .offset(offset);

    // Build the count query by cloning base and only selecting COUNT(*)
    const countQuery = baseQuery
      .select((eb) => eb.fn.countAll<string>().as("count"));

    const [logs, totalResult] = await Promise.all([
      resultsQuery.execute(),
      countQuery.executeTakeFirstOrThrow(),
    ]);

    const totalLogs = parseInt(totalResult.count, 10);

    const auditLogEntries: AuditLogEntry[] = logs.map((log) => {
      assertAuditLogAction(log.action); // validates and narrows type
      return {
        id: log.id,
        policyId: log.policyId,
        policyName: log.policyName,
        action: log.action, // now properly typed as AuditLogAction
        actionTimestamp: log.actionTimestamp,
        details: log.details,
        user: {
          id: log.userId,
          displayName: log.userDisplayName,
          email: log.userEmail,
        },
      };
    });

    const output: OutputType = {
      logs: auditLogEntries,
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
      },
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching policy audit logs:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}