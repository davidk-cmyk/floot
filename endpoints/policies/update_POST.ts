import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies } from "../../helpers/schema";
import { handlePolicyError, PolicyNotFoundError, UnauthorizedPolicyActionError } from "../../helpers/policyErrorService";
import { updateDepartmentSetting, updateCategorySetting } from "../../helpers/policyTaxonomyService";
import { auditPolicyUpdate } from "../../helpers/policyAuditService";
import { recordPolicyVersion } from "../../helpers/policyVersionService";
import { withPolicyTransaction } from "../../helpers/policyTransactionService";
import { createNotification, NotificationCreator } from "../../helpers/notificationHelpers";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { policyId, changeSummary, portalIds, ...updateData } = schema.parse(json);

    const policy = await db
      .selectFrom("policies")
      .select(["authorId", "currentVersion", "title"])
      .where("id", "=", policyId)
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    if (!policy) {
      throw new PolicyNotFoundError();
    }

    const canUpdate =
      user.role === "admin" ||
      user.role === "editor" ||
      policy.authorId === user.id;

    if (!canUpdate) {
      throw new UnauthorizedPolicyActionError("You do not have permission to update this policy.");
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        superjson.stringify({ error: "No fields to update provided." }),
        { status: 400 }
      );
    }

    const updatedPolicy = await withPolicyTransaction(async (trx) => {
      // Update the policy
      const updated = await trx
        .updateTable("policies")
        .set({
          ...updateData,
          currentVersion: (policy.currentVersion || 1) + 1, // Increment version
        })
        .where("id", "=", policyId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Handle portal assignment changes if portalIds are explicitly provided
      if (portalIds !== undefined && portalIds !== null) {
        // Fetch current assignments
        const currentAssignments = await trx
          .selectFrom("policyPortalAssignments")
          .select("portalId")
          .where("policyId", "=", policyId)
          .execute();

        const currentPortalIds = currentAssignments.map(a => a.portalId);
        const newPortalIds = portalIds;

        // Calculate what to add and remove
        const toAdd = newPortalIds.filter(id => !currentPortalIds.includes(id));
        const toRemove = currentPortalIds.filter(id => !newPortalIds.includes(id));

        // Remove assignments that are no longer needed
        if (toRemove.length > 0) {
          await trx
            .deleteFrom("policyPortalAssignments")
            .where("policyId", "=", policyId)
            .where("portalId", "in", toRemove)
            .execute();
        }

        // Add new assignments
        if (toAdd.length > 0) {
          // Verify portals exist, are active, and belong to organization
          const portals = await trx
            .selectFrom("portals")
            .select("id")
            .where("organizationId", "=", user.organizationId)
            .where("id", "in", toAdd)
            .where("isActive", "=", true)
            .execute();

          if (portals.length !== toAdd.length) {
            throw new Error("One or more portals not found or inactive");
          }

          // Create assignment records for toAdd
          const assignmentValues = toAdd.map(portalId => ({
            policyId: policyId,
            portalId,
          }));

          // Insert into policyPortalAssignments table
          await trx
            .insertInto("policyPortalAssignments")
            .values(assignmentValues)
            .execute();
        }
      }

      return updated;
    });

    // Handle taxonomy updates (non-blocking)
    if (updateData.department) {
      await updateDepartmentSetting(updateData.department, user.organizationId);
    }
    
    if (updateData.category) {
      await updateCategorySetting(updateData.category, user.organizationId);
    }

    // Generate portal URLs if policy status is being set to 'published'
    let portalUrls: string[] = [];
    if (updateData.status === 'published') {
      try {
        const portalAssignments = await db
          .selectFrom("policyPortalAssignments")
          .innerJoin("portals", "portals.id", "policyPortalAssignments.portalId")
          .select("portals.slug")
          .where("policyPortalAssignments.policyId", "=", policyId)
          .where("portals.organizationId", "=", user.organizationId)
          .where("portals.isActive", "=", true)
          .execute();

        portalUrls = portalAssignments.map(assignment => `/${user.organizationId}/${assignment.slug}/${policyId}`);
      } catch (error) {
        console.error("Error fetching portal URLs for published policy:", {
          policyId: updatedPolicy.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't fail the entire update if portal URL generation fails
      }
    }

    // Log the policy update
    await auditPolicyUpdate(updatedPolicy, updateData, changeSummary, user, request);

    // Record policy version
    await recordPolicyVersion(updatedPolicy, user, changeSummary);

    // Send notifications to assigned users if policy is published
    if (updateData.status === 'published' || updatedPolicy.status === 'published') {
      try {
        // Get all users assigned to this policy (exclude the user who performed the update)
        const assignedUsers = await db
          .selectFrom("policyAssignments")
          .innerJoin("users", "users.id", "policyAssignments.userId")
          .select([
            "policyAssignments.userId",
            "users.displayName",
          ])
          .where("policyAssignments.policyId", "=", policyId)
          .where("policyAssignments.organizationId", "=", user.organizationId)
          .where("policyAssignments.userId", "!=", user.id)
          .execute();

        if (assignedUsers.length > 0) {
          // Fetch updater display name for metadata
          const updaterDetails = await db
            .selectFrom("users")
            .select("displayName")
            .where("id", "=", user.id)
            .executeTakeFirst();

          const updaterDisplayName = updaterDetails?.displayName || "Admin";

          // Create notifications for each assigned user
          const notificationPromises = assignedUsers.map(async (assignedUser) => {
            const notification: NotificationCreator = {
              userId: assignedUser.userId,
              organizationId: user.organizationId,
              type: "policy_update",
              title: "Policy Updated",
              message: `The policy '${updatedPolicy.title}' has been updated. Please review the changes.`,
              relatedPolicyId: policyId,
              metadata: {
                updatedBy: updaterDisplayName,
                versionNumber: updatedPolicy.currentVersion,
              },
            };

            return createNotification(notification);
          });

          await Promise.all(notificationPromises);
        }
      } catch (error) {
        // Log but don't fail the update
        console.error("Error creating notifications for policy update:", {
          policyId: updatedPolicy.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const response = {
      ...updatedPolicy,
      ...(portalUrls.length > 0 && { portalUrls }),
    };

    return new Response(superjson.stringify(response satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handlePolicyError(error, { endpoint: 'policies/update' });
  }
}