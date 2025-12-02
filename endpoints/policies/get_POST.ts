import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType, PolicyAssignmentRow, PolicyAcknowledgmentRow } from "./get_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { Kysely, sql } from "kysely";
import { DB } from "../../helpers/schema";

async function getPolicyWithAuthor(policyId: number, organizationId: number, dbInstance: Kysely<DB>) {
  return await dbInstance
    .selectFrom("policies")
    .innerJoin("users", "policies.authorId", "users.id")
    .leftJoin("oauthAccounts", "users.id", "oauthAccounts.userId")
    .where("policies.id", "=", policyId)
    .where("policies.organizationId", "=", organizationId)
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
      "policies.reviewedBy",
      "policies.reviewDate",
      "policies.reviewedAt",
      "users.id as author.id",
      "users.displayName as author.displayName",
      "users.email as author.email",
      "users.avatarUrl as author.avatarUrl",
      "oauthAccounts.provider as author.oauthProvider",
    ])
    .executeTakeFirst();
}

async function checkRequiresAcknowledgmentFromPortals(policyId: number, dbInstance: Kysely<DB>): Promise<boolean> {
  const portalWithAcknowledgment = await dbInstance
    .selectFrom("policyPortalAssignments")
    .innerJoin("portals", "policyPortalAssignments.portalId", "portals.id")
    .where("policyPortalAssignments.policyId", "=", policyId)
    .where("portals.requiresAcknowledgment", "=", true)
    .where("portals.isActive", "=", true)
    .executeTakeFirst();

  return !!portalWithAcknowledgment;
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

async function getAssignedPortals(policyId: number, dbInstance: Kysely<DB>) {
  return await dbInstance
    .selectFrom("policyPortalAssignments")
    .innerJoin("portals", "portals.id", "policyPortalAssignments.portalId")
    .select([
      "portals.id",
      "portals.name",
      "portals.slug",
      "portals.requiresAcknowledgment"
    ])
    .where("policyPortalAssignments.policyId", "=", policyId)
    .where("portals.isActive", "=", true)
    .execute();
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { policyId } = schema.parse(json);

    const policyWithAuthor = await getPolicyWithAuthor(policyId, user.organizationId, db);

    if (!policyWithAuthor) {
      return new Response(
        superjson.stringify({ error: "Policy not found" }),
        { status: 404 }
      );
    }

    // Fetch all data in parallel
    const [
      requiresAcknowledgmentFromPortals,
      assignedPortals,
      currentUserAssignment,
      currentUserAcknowledgment,
      policyVersions,
      readingSessions,
      adminViewData,
    ] = await Promise.all([
      checkRequiresAcknowledgmentFromPortals(policyId, db),
      getAssignedPortals(policyId, db),
      db
        .selectFrom("policyAssignments")
        .selectAll()
        .where("policyId", "=", policyId)
        .where("userId", "=", user.id)
        .where("organizationId", "=", user.organizationId)
        .executeTakeFirst(),
      db
        .selectFrom("policyAcknowledgments")
        .selectAll()
        .where("policyId", "=", policyId)
        .where("userId", "=", user.id)
        .where("organizationId", "=", user.organizationId)
        .executeTakeFirst(),
      db
        .selectFrom("policyVersions")
        .selectAll()
        .where("policyId", "=", policyId)
        .where("organizationId", "=", user.organizationId)
        .orderBy("versionNumber", "desc")
        .execute(),
      db
        .selectFrom("policyReadingSessions")
        .selectAll()
        .where("policyId", "=", policyId)
        .where("userId", "=", user.id)
        .where("organizationId", "=", user.organizationId)
        .orderBy("sessionStartedAt", "desc")
        .execute(),
      user.role === "admin"
        ? db
            .selectFrom("policyAssignments as pa")
            .fullJoin(
              "policyAcknowledgments as pack",
              (join) =>
                join
                  .onRef("pa.policyId", "=", "pack.policyId")
                  .onRef("pa.userId", "=", "pack.userId")
            )
            .innerJoin("users as u", "u.id", "pa.userId")
            .leftJoin("oauthAccounts as oa", "u.id", "oa.userId")
            .where("pa.policyId", "=", policyId)
            .where("pa.organizationId", "=", user.organizationId)
            .select([
              "u.id as userId",
              "u.displayName",
              "u.email",
              "u.avatarUrl",
              "oa.provider as oauthProvider",
              "pa.id as assignmentId",
              "pa.assignedAt",
              "pa.assignedBy",
              "pa.dueDate",
              "pa.isMandatory",
              "pa.lastReminderSentAt",
              "pa.notificationSentAt",
              "pa.reminderCount",
              "pack.id as acknowledgmentId",
              "pack.acknowledgedAt",
              "pack.ipAddress",
              "pack.reminderCount",
              "pack.reminderSentAt",
            ])
            .execute()
        : Promise.resolve(null),
    ]);

    // Destructure author fields from the flat Kysely row
    const {
      "author.id": authorId,
      "author.displayName": authorDisplayName,
      "author.email": authorEmail,
      "author.avatarUrl": authorAvatarUrl,
      "author.oauthProvider": authorOauthProvider,
      ...policyData
    } = policyWithAuthor;

    const output: OutputType = {
      policy: {
        ...policyData,
        requiresAcknowledgmentFromPortals: requiresAcknowledgmentFromPortals,
        assignedPortals: assignedPortals.map(portal => ({
          id: portal.id,
          name: portal.name,
          slug: portal.slug,
          requiresAcknowledgment: portal.requiresAcknowledgment ?? false,
        })),
        author: {
          id: authorId,
          displayName: authorDisplayName,
          email: authorEmail,
          avatarUrl: authorAvatarUrl,
          oauthProvider: authorOauthProvider,
        },
      },
      currentUserStatus: {
        assignment: currentUserAssignment ?? null,
        acknowledgment: currentUserAcknowledgment ?? null,
      },
      versions: policyVersions,
      readingSessions: readingSessions,
      adminView:
        adminViewData?.map((row) => ({
          user: {
            id: row.userId,
            displayName: row.displayName ?? "",
            email: row.email ?? "",
            avatarUrl: row.avatarUrl ?? null,
            oauthProvider: row.oauthProvider ?? null,
          },
          assignment: row.assignmentId != null
            ? ({
                id: row.assignmentId,
                policyId: policyId,
                userId: row.userId,
                organizationId: user.organizationId,
                assignedAt: row.assignedAt,
                assignedBy: row.assignedBy as number,
                dueDate: row.dueDate,
                isMandatory: row.isMandatory,
                lastReminderSentAt: row.lastReminderSentAt,
                notificationSentAt: row.notificationSentAt,
                reminderCount: row.reminderCount,
              } satisfies PolicyAssignmentRow)
            : null,
          acknowledgment: row.acknowledgmentId != null
            ? ({
                id: row.acknowledgmentId,
                policyId: policyId,
                userId: row.userId,
                organizationId: user.organizationId,
                acknowledgedAt: row.acknowledgedAt,
                ipAddress: row.ipAddress,
                reminderCount: row.reminderCount,
                reminderSentAt: row.reminderSentAt,
              } satisfies PolicyAcknowledgmentRow)
            : null,
        })) ?? null,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching policy details:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "User not authenticated" }),
        { status: 401 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}