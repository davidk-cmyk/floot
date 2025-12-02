import { db } from '../../../helpers/db';
import { getServerUserSession } from '../../../helpers/getServerUserSession';
import { schema, OutputType } from "./export_POST.schema";
import superjson from "superjson";
import { formatAuditDetailsForText } from '../../../helpers/formatAuditDetailsForText';

function escapeCsvField(field: string | null | undefined): string {
  if (field === null || field === undefined) {
    return "";
  }
  const str = String(field);
  // If the field contains a comma, a double quote, or a newline, wrap it in double quotes.
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    // Escape existing double quotes by doubling them.
    const escapedStr = str.replace(/"/g, '""');
    return `"${escapedStr}"`;
  }
  return str;
}

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: Admins only" }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    let baseQuery = db.
    selectFrom("policyAuditLog").
    innerJoin("users", "users.id", "policyAuditLog.actionBy").
    where("policyAuditLog.organizationId", "=", session.user.organizationId);

    // Apply filters
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
      const inclusiveEndDate = new Date(input.endDate);
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
      baseQuery = baseQuery.where(
        "policyAuditLog.actionTimestamp",
        "<",
        inclusiveEndDate
      );
    }

    const sortColumn =
    input.sortBy === "policyName" ?
    "policyAuditLog.policyName" :
    input.sortBy === "user" ?
    "users.displayName" :
    "policyAuditLog.actionTimestamp";

    const logs = await baseQuery.
    select([
    "policyAuditLog.policyName",
    "policyAuditLog.action",
    "policyAuditLog.actionTimestamp",
    "policyAuditLog.details",
    "users.displayName as userDisplayName"]
    ).
    orderBy(sortColumn, input.sortOrder ?? "desc").
    execute();

    const headers = ["Policy Name", "Action", "Timestamp", "Performed By", "Details"];
    const csvRows = [headers.join(",")];

    for (const log of logs) {
      const row = [
      escapeCsvField(log.policyName),
      escapeCsvField(log.action),
      escapeCsvField(log.actionTimestamp.toISOString()),
      escapeCsvField(log.userDisplayName),
      escapeCsvField(formatAuditDetailsForText(log.details))];

      csvRows.push(row.join(","));
    }

        const csvContent = csvRows.join("\n");
    const now = new Date();
    const timestamp = now.toISOString().split('.')[0].replace(/[:.]/g, "-"); // Remove milliseconds
    const filename = `audit-log-${timestamp}.csv`;

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Error exporting policy audit logs:", error);
    const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}