import { db } from "../../helpers/db";
import { getServerSessionOrThrow } from "../../helpers/getSetServerSession";
import { schema, OutputType } from "./public_GET.schema";
import superjson from "superjson";
import { Kysely } from "kysely";
import { DB, Users } from "../../helpers/schema";
import { Selectable } from "kysely";

type PolicyAuthor = Pick<
  Selectable<Users>,
  "id" | "displayName" | "email" | "avatarUrl"
>;

async function getPolicyWithAuthor(policyId: number, dbInstance: Kysely<DB>) {
  return await dbInstance
    .selectFrom("policies")
    .innerJoin("users", "policies.authorId", "users.id")
    .where("policies.id", "=", policyId)
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
      "users.id as authorId_user",
      "users.displayName as authorDisplayName",
      "users.email as authorEmail",
      "users.avatarUrl as authorAvatarUrl",
    ])
    .executeTakeFirst();
}

async function checkIsPublic(policyId: number, dbInstance: Kysely<DB>): Promise<boolean> {
  const publicPortalAssignment = await dbInstance
    .selectFrom("policyPortalAssignments")
    .innerJoin("portals", "policyPortalAssignments.portalId", "portals.id")
    .where("policyPortalAssignments.policyId", "=", policyId)
    .where("portals.accessType", "=", "public")
    .where("portals.isActive", "=", true)
    .executeTakeFirst();

  return !!publicPortalAssignment;
}

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const policyIdParam = url.searchParams.get("policyId");

    const validationResult = schema.safeParse({ policyId: policyIdParam });
    if (!validationResult.success) {
      return new Response(
        superjson.stringify({ error: "Invalid policyId provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { policyId } = validationResult.data;

    let user: Selectable<Users> | null = null;
    try {
      const session = await getServerSessionOrThrow(request);
      const userResult = await db
        .selectFrom("sessions")
        .innerJoin("users", "sessions.userId", "users.id")
        .where("sessions.id", "=", session.id)
        .selectAll("users")
        .executeTakeFirst();
      user = userResult ?? null; // Convert undefined to null
    } catch (error) {
      // Not authenticated, which is fine for public policies.
      // We can ignore the error and proceed with user as null.
      console.log("No active session found, proceeding as guest.");
    }

    const [policyWithAuthorRaw, isPublic] = await Promise.all([
      getPolicyWithAuthor(policyId, db),
      checkIsPublic(policyId, db),
    ]);

    if (!policyWithAuthorRaw) {
      return new Response(
        superjson.stringify({ error: "Policy not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const isAdmin = user?.role === "admin";

    // Check if policy is public by checking if it's assigned to any public portals
    if (!isAdmin && !isPublic) {
      return new Response(
        superjson.stringify({ error: "Policy not found or access denied" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const author: PolicyAuthor = {
      id: policyWithAuthorRaw.authorId_user,
      displayName: policyWithAuthorRaw.authorDisplayName,
      email: policyWithAuthorRaw.authorEmail,
      avatarUrl: policyWithAuthorRaw.authorAvatarUrl,
    };

    const {
      authorId_user,
      authorDisplayName,
      authorEmail,
      authorAvatarUrl,
      ...policyData
    } = policyWithAuthorRaw;

    const output: OutputType = {
      ...policyData,
      author,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching public policy:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}