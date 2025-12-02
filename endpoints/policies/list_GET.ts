import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./list_GET.schema";
import { buildPolicyQuery } from "../../helpers/policyQueryBuilder";
import { getFilterMetadata } from "../../helpers/policyFilterMetadata";
import { getPortalAssignments } from "../../helpers/policyPortalAssignments";
import superjson from "superjson";

export async function handle(request: Request) {
  const startTime = Date.now();
  
  try {
    // Try to get user session, but don't fail if not authenticated
    let user = null;
    try {
      const session = await getServerUserSession(request);
      user = session.user;
    } catch (error) {
      // User is not authenticated, continue with public-only access
    }

    const url = new URL(request.url);
    
    // Parse tags array from multiple query parameters
    const tagsParams = url.searchParams.getAll("tags");
    
    const input = schema.parse({
      search: url.searchParams.get("search") || undefined,
      status: url.searchParams.get("status") || undefined,
      department: url.searchParams.get("department") || undefined,
      category: url.searchParams.get("category") || undefined,
      portal: url.searchParams.get("portal") || undefined,
      tags: tagsParams.length > 0 ? tagsParams : undefined,
      requiresAcknowledgment: url.searchParams.has("requiresAcknowledgment")
        ? url.searchParams.get("requiresAcknowledgment") === "true"
        : undefined,
      sortBy: (url.searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (url.searchParams.get("sortOrder") as any) || "desc",
      page: url.searchParams.has("page")
        ? parseInt(url.searchParams.get("page")!, 10)
        : 1,
      limit: url.searchParams.has("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : 10,
      publicOnly: url.searchParams.has("publicOnly")
        ? url.searchParams.get("publicOnly") === "true"
        : undefined,
      getFilterMetadata: url.searchParams.has("getFilterMetadata")
        ? url.searchParams.get("getFilterMetadata") === "true"
        : undefined,
    });

    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const forcePublicOnly = !user || !!input.publicOnly;

    console.log("Policy list request:", {
      isAuthenticated: !!user,
      organizationId: user?.organizationId || null,
      forcePublicOnly,
      hasFilters: !!(input.search || input.status || input.department || input.category || input.portal || input.tags?.length || typeof input.requiresAcknowledgment === "boolean")
    });

    // Handle filter metadata request
    const filterMetadata = input.getFilterMetadata 
      ? await getFilterMetadata(user, forcePublicOnly)
      : undefined;

    // Build optimized query
    const baseQuery = buildPolicyQuery(user, forcePublicOnly, input);

    // Apply sorting and pagination to main query
    const sortColumn = input.sortBy === 'title' ? 'policies.title' :
                      input.sortBy === 'updatedAt' ? 'policies.updatedAt' :
                      input.sortBy === 'effectiveDate' ? 'policies.effectiveDate' :
                      'policies.createdAt';
    
    const paginatedQuery = baseQuery.orderBy(sortColumn, input.sortOrder).limit(limit).offset((page - 1) * limit);

    // Get count using the same CTE level to avoid PostgreSQL scoping issues
    const countQuery = baseQuery
      .clearSelect()
      .clearOrderBy()
      .clearLimit()
      .clearOffset()
      .select((eb) => eb.fn.countAll<string>().as("count"));

    const queryStart = Date.now();
    const [policies, totalPoliciesResult] = await Promise.all([
      paginatedQuery.execute(),
      countQuery.executeTakeFirstOrThrow(),
    ]);
    const queryTime = Date.now() - queryStart;

    // Get portal information for each policy
    const portalsByPolicy = await getPortalAssignments(policies.map((p: any) => p.id));

    const totalPolicies = parseInt(totalPoliciesResult.count, 10);

    const output: OutputType = {
      policies: (policies as any[]).map((p) => ({
        ...p,
        acknowledged: !!p.acknowledged,
        acknowledgedCount: parseInt(p.acknowledgedCount || "0", 10),
        assignedCount: parseInt(p.assignedCount || "0", 10),
        overdueCount: parseInt(p.overdueCount || "0", 10),
        dueSoonCount: parseInt(p.dueSoonCount || "0", 10),
        requiresAcknowledgmentFromPortals: !!p.requiresAcknowledgmentFromPortals,
        assignedPortals: portalsByPolicy[p.id] || [],
      })),
      pagination: {
        page,
        limit,
        total: totalPolicies,
        totalPages: Math.ceil(totalPolicies / limit),
      },
      ...(filterMetadata && { filterMetadata }),
    };

    const totalTime = Date.now() - startTime;
    console.log("Policy list performance:", {
      totalTime: `${totalTime}ms`,
      queryTime: `${queryTime}ms`,
      resultCount: policies.length,
      totalPolicies,
      hasPortalJoins: forcePublicOnly || typeof input.requiresAcknowledgment === "boolean"
    });

    const responseBody = superjson.stringify(output);
    return new Response(responseBody, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching policies:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}