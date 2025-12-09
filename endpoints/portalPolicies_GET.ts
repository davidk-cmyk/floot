import { Selectable } from "kysely";
import { db } from "../helpers/db";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { schema, OutputType, PolicyWithAcknowledgement } from "./portalPolicies_GET.schema";
import superjson from "superjson";
import bcrypt from "bcryptjs";
import { Portals, Users } from "../helpers/schema";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    
    const input = schema.parse({
      portalSlug: url.searchParams.get("portalSlug"),
      search: url.searchParams.get("search") || undefined,
      status: url.searchParams.get("status") || undefined,
      department: url.searchParams.get("department") || undefined,
      category: url.searchParams.get("category") || undefined,
      page: url.searchParams.has("page") ? parseInt(url.searchParams.get("page")!, 10) : 1,
      limit: url.searchParams.has("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 10,
      password: url.searchParams.get("password") || undefined,
    });

    if (!input.portalSlug) {
      return new Response(superjson.stringify({ error: "Portal slug is required." }), { status: 400 });
    }

    let user: { id: number; email: string; displayName: string; role: string; organizationId: number } | null = null;
    try {
      const session = await getServerUserSession(request);
      user = session.user;
    } catch (error) {
      // Not authenticated, which is fine for public portals
    }

    // Find portal with slug, prioritizing user's organization if authenticated
    let portal: Selectable<Portals> | undefined = undefined;
    
    if (user) {
      // First try to find portal in user's organization
      portal = await db
        .selectFrom("portals")
        .where("slug", "=", input.portalSlug)
        .where("organizationId", "=", user.organizationId)
        .where("isActive", "=", true)
        .selectAll()
        .orderBy("id", "desc")
        .executeTakeFirst();
    }

    // If no portal found in user's org or user not authenticated, find any active portal with the slug
    if (!portal) {
      portal = await db
        .selectFrom("portals")
        .where("slug", "=", input.portalSlug)
        .where("isActive", "=", true)
        .selectAll()
        .orderBy("id", "desc")
        .executeTakeFirst();
    }

    if (!portal) {
      return new Response(superjson.stringify({ error: "Portal not found or is not active." }), { status: 404 });
    }

    // Access Control Logic
    switch (portal.accessType) {
      case "password":
        if (!input.password || !portal.passwordHash || !(await bcrypt.compare(input.password, portal.passwordHash))) {
          return new Response(superjson.stringify({ error: "Invalid password." }), { status: 401 });
        }
        break;
      case "authenticated":
        if (!user || user.organizationId !== portal.organizationId) {
          return new Response(superjson.stringify({ error: "Authentication required." }), { status: 401 });
        }
        break;
      case "role_based":
        if (!user || user.organizationId !== portal.organizationId || !portal.allowedRoles?.includes(user.role)) {
          return new Response(superjson.stringify({ error: "Access denied." }), { status: 403 });
        }
        break;
      case "public":
      default:
        // No checks needed
        break;
    }

    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const offset = (page - 1) * limit;

    // Step 1: Get all policies assigned to the portal (without acknowledgment data)
    let query = db
      .selectFrom("policies")
      .innerJoin("policyPortalAssignments", "policyPortalAssignments.policyId", "policies.id")
      .where("policyPortalAssignments.portalId", "=", portal.id);

    // Apply status filtering based on user role
    if (user && (user.role === "admin" || user.role === "editor")) {
      // Admin/Editor can see both draft and published policies
      query = query.where("policies.status", "in", ["draft", "published"]);
    } else {
      // All other users (including public) can only see published policies
      query = query.where("policies.status", "=", "published");
    }

    if (input.search) {
      query = query.where("policies.title", "ilike", `%${input.search}%`);
    }

    if (input.status) {
      query = query.where("policies.status", "=", input.status);
    }

    if (input.department) {
      query = query.where("policies.department", "=", input.department);
    }

    if (input.category) {
      query = query.where("policies.category", "=", input.category);
    }

    let countQuery = query;

    const [policiesResult, totalResult] = await Promise.all([
      query.selectAll("policies").limit(limit).offset(offset).orderBy("policies.createdAt", "desc").execute(),
      countQuery.select((eb) => eb.fn.countAll<string>().as("count")).executeTakeFirstOrThrow(),
    ]);

    const total = parseInt(totalResult.count, 10);

    // Step 2: If user is authenticated, get all acknowledgments for these policies for the current user
    let acknowledgments: Set<number> = new Set();
    if (user && policiesResult.length > 0) {
      const policyIds = policiesResult.map(p => p.id);
      const acknowledgedPolicies = await db
        .selectFrom("policyAcknowledgments")
        .select("policyId")
        .where("userId", "=", user.id)
        .where("policyId", "in", policyIds)
        .execute();
      
      acknowledgments = new Set(acknowledgedPolicies.map(a => a.policyId));
    }

    // Step 3: Merge the results to add the acknowledged field to each policy
    const policiesWithAcknowledgement: PolicyWithAcknowledgement[] = policiesResult.map(policy => ({
      ...policy,
      acknowledged: acknowledgments.has(policy.id),
    }));

    const output: OutputType = {
      portal: {
        id: portal.id,
        name: portal.name,
        slug: portal.slug,
        label: portal.label,
        description: portal.description,
        accessType: portal.accessType,
        acknowledgmentMode: portal.acknowledgmentMode,
      },
      policies: policiesWithAcknowledgement,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error fetching policies for portal:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}