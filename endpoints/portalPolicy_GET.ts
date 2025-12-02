import { db } from "../helpers/db";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { schema, OutputType } from "./portalPolicy_GET.schema";
import superjson from "superjson";
import bcrypt from "bcryptjs";
import { PolicyWithAuthor } from "../helpers/policyTypes";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);

    const input = schema.parse({
      portalSlug: url.searchParams.get("portalSlug"),
      policyId: url.searchParams.has("policyId") ? parseInt(url.searchParams.get("policyId")!, 10) : undefined,
      password: url.searchParams.get("password") || undefined,
    });

    if (!input.portalSlug || !input.policyId) {
      return new Response(superjson.stringify({ error: "Portal slug and policy ID are required." }), { status: 400 });
    }

    // Get user session first to check authentication
    let user = null;
    try {
      const session = await getServerUserSession(request);
      user = session.user;
    } catch (error) {
      // Not authenticated, which is fine for public portals
    }

    // Find portal with slug, prioritizing user's organization if authenticated
    let portal = null;
    
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

    // Check if policy is assigned to this portal
    const policyPortalAssignment = await db
      .selectFrom("policyPortalAssignments")
      .where("portalId", "=", portal.id)
      .where("policyId", "=", input.policyId)
      .executeTakeFirst();

    if (!policyPortalAssignment) {
      return new Response(superjson.stringify({ error: "Policy not found in this portal." }), { status: 404 });
    }

    // Get policy with author information and assigned portals
    let policyQuery = db
      .selectFrom("policies")
      .innerJoin("users", "policies.authorId", "users.id")
      .leftJoin("oauthAccounts", "users.id", "oauthAccounts.userId")
      .where("policies.id", "=", input.policyId)
      .where("policies.organizationId", "=", portal.organizationId);

    // Apply status filtering based on user role
    if (user && (user.role === "admin" || user.role === "editor")) {
      // Admin/Editor can see both draft and published policies
      policyQuery = policyQuery.where("policies.status", "in", ["draft", "published"]);
    } else {
      // All other users (including public) can only see published policies
      policyQuery = policyQuery.where("policies.status", "=", "published");
    }

    const policyWithAuthor = await policyQuery
      .select([
        "policies.id",
        "policies.title",
        "policies.content",
        "policies.status",
        "policies.category",
        "policies.department",
        "policies.effectiveDate",
        "policies.expirationDate",
        "policies.publishedAt",
        "policies.createdAt",
        "policies.updatedAt",
        "policies.currentVersion",
        "policies.tags",
        "policies.authorId",
        "policies.organizationId",
        "policies.approvedAt",
        "policies.approvedBy",
        "policies.reviewedAt",
        "policies.reviewedBy",
        "policies.reviewDate",
        "users.id as authorId",
        "users.displayName as authorDisplayName",
        "users.email as authorEmail",
        "users.avatarUrl as authorAvatarUrl",
        "oauthAccounts.provider as authorOauthProvider",
      ])
      .executeTakeFirst();

    if (!policyWithAuthor) {
      return new Response(superjson.stringify({ error: "Policy not found or not published." }), { status: 404 });
    }
    
    const assignedPortals = await db
        .selectFrom("policyPortalAssignments")
        .innerJoin("portals", "portals.id", "policyPortalAssignments.portalId")
        .select([
          "portals.id",
          "portals.name",
          "portals.slug",
          "portals.requiresAcknowledgment"
        ])
        .where("policyPortalAssignments.policyId", "=", input.policyId)
        .where("portals.isActive", "=", true)
        .execute();

    const requiresAcknowledgmentFromPortals = portal.requiresAcknowledgment ?? false;

    const policy: PolicyWithAuthor = {
        id: policyWithAuthor.id,
        title: policyWithAuthor.title,
        content: policyWithAuthor.content,
        status: policyWithAuthor.status,
        category: policyWithAuthor.category,
        department: policyWithAuthor.department,
        effectiveDate: policyWithAuthor.effectiveDate,
        expirationDate: policyWithAuthor.expirationDate,
        publishedAt: policyWithAuthor.publishedAt,
        createdAt: policyWithAuthor.createdAt,
        updatedAt: policyWithAuthor.updatedAt,
        currentVersion: policyWithAuthor.currentVersion,
        tags: policyWithAuthor.tags,
        authorId: policyWithAuthor.authorId,
        organizationId: policyWithAuthor.organizationId,
        approvedAt: policyWithAuthor.approvedAt,
        approvedBy: policyWithAuthor.approvedBy,
        reviewedAt: policyWithAuthor.reviewedAt,
        reviewedBy: policyWithAuthor.reviewedBy,
        reviewDate: policyWithAuthor.reviewDate,
        requiresAcknowledgmentFromPortals,
        assignedPortals: assignedPortals.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          requiresAcknowledgment: p.requiresAcknowledgment ?? false,
        })),
        author: {
          id: policyWithAuthor.authorId,
          displayName: policyWithAuthor.authorDisplayName,
          email: policyWithAuthor.authorEmail,
          avatarUrl: policyWithAuthor.authorAvatarUrl,
          oauthProvider: policyWithAuthor.authorOauthProvider,
        },
    };

    // Check for user acknowledgment status if user is authenticated
    let userAcknowledgmentStatus = undefined;
    if (user) {
      const acknowledgment = await db
        .selectFrom("policyAcknowledgments")
        .select(["id", "acknowledgedAt"])
        .where("userId", "=", user.id)
        .where("policyId", "=", input.policyId)
        .where("organizationId", "=", user.organizationId)
        .executeTakeFirst();

      userAcknowledgmentStatus = {
        isAcknowledged: !!acknowledgment,
        acknowledgedAt: acknowledgment?.acknowledgedAt ?? null,
        acknowledgmentId: acknowledgment?.id ?? null,
      };
    }

    const output: OutputType = {
      portal: {
        id: portal.id,
        name: portal.name,
        slug: portal.slug,
        description: portal.description,
        accessType: portal.accessType,
        acknowledgmentMode: portal.acknowledgmentMode,
      },
      policy,
      userAcknowledgmentStatus,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error fetching policy details for portal:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}