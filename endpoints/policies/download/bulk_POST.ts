import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./bulk_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { generateDocument, DocumentGenerationInput } from "../../../helpers/documentGenerator";
import JSZip from "jszip";
import { Selectable } from "kysely";
import { Policies } from "../../../helpers/schema";

async function getAccessiblePolicies(
  userId: number,
  userRole: string,
  organizationId: number,
  policyIds: number[]
): Promise<Selectable<Policies>[]> {
  if (userRole === "admin") {
    return db
      .selectFrom("policies")
      .selectAll()
      .where("id", "in", policyIds)
      .where("organizationId", "=", organizationId)
      .execute();
  }

  // For non-admins, find policies that are either directly assigned or public.
  const assignedPolicyIds = await db
    .selectFrom("policyAssignments")
    .where("userId", "=", userId)
    .where("policyId", "in", policyIds)
    .where("organizationId", "=", organizationId)
    .select("policyId")
    .execute();

  const publicPolicyIds = await db
    .selectFrom("policyPortalAssignments")
    .innerJoin("portals", "policyPortalAssignments.portalId", "portals.id")
    .where("policyPortalAssignments.policyId", "in", policyIds)
    .where("portals.accessType", "=", "public")
    .where("portals.isActive", "=", true)
    .where("portals.organizationId", "=", organizationId)
    .select("policyPortalAssignments.policyId")
    .execute();

  const accessiblePolicyIds = [
    ...new Set([
      ...assignedPolicyIds.map((p) => p.policyId),
      ...publicPolicyIds.map((p) => p.policyId),
    ]),
  ];

  if (accessiblePolicyIds.length === 0) {
    return [];
  }

  return db
    .selectFrom("policies")
    .selectAll()
    .where("id", "in", accessiblePolicyIds)
    .execute();
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { policyIds, format } = schema.parse(json);

    if (policyIds.length === 0) {
      return new Response(
        superjson.stringify({ error: "No policy IDs provided." }),
        { status: 400 }
      );
    }

    const accessiblePolicies = await getAccessiblePolicies(
      user.id,
      user.role,
      user.organizationId,
      policyIds
    );

    if (accessiblePolicies.length === 0) {
      return new Response(
        superjson.stringify({ error: "You do not have access to any of the requested policies." }),
        { status: 403 }
      );
    }

    const settings = await db
      .selectFrom("organizationDownloadSettings")
      .selectAll()
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    // Fetch organization details
    const organization = await db
      .selectFrom("organizations")
      .selectAll()
      .where("id", "=", user.organizationId)
      .executeTakeFirst();

    if (!organization) {
      return new Response(
        superjson.stringify({ error: "Organization not found." }),
        { status: 404 }
      );
    }

    // Fetch organization variables for enhanced generation
    const organizationVariables = await db
      .selectFrom("organizationVariables")
      .selectAll()
      .where("organizationId", "=", user.organizationId)
      .execute();

    // Fetch layout template if configured
    let layoutTemplate = null;
    if (settings?.layoutTemplateId) {
      layoutTemplate = await db
        .selectFrom("layoutTemplates")
        .selectAll()
        .where("id", "=", settings.layoutTemplateId)
        .executeTakeFirst();
    } else {
      // Fallback to default layout template
      layoutTemplate = await db
        .selectFrom("layoutTemplates")
        .selectAll()
        .where("isDefault", "=", true)
        .executeTakeFirst();
    }

    const zip = new JSZip();
    const downloadLogs: any[] = [];

    for (const policy of accessiblePolicies) {
      const startTime = Date.now();
      
      // Check for portal-specific layout overrides for this policy
      let portalOverrides = null;
      const portalAssignment = await db
        .selectFrom("policyPortalAssignments")
        .innerJoin("portals", "policyPortalAssignments.portalId", "portals.id")
        .where("policyPortalAssignments.policyId", "=", policy.id)
        .where("portals.accessType", "=", "public")
        .where("portals.isActive", "=", true)
        .where("portals.organizationId", "=", user.organizationId)
        .select("portals.id as portalId")
        .executeTakeFirst();

      if (portalAssignment && layoutTemplate) {
        portalOverrides = await db
          .selectFrom("portalLayoutOverrides")
          .selectAll()
          .where("portalId", "=", portalAssignment.portalId)
          .where("layoutTemplateId", "=", layoutTemplate.id)
          .executeTakeFirst();
      }

      // Document Generation using enhanced API
      const generationInput: DocumentGenerationInput = {
        policy,
        organization,
        organizationVariables,
                settings: settings || null,
        layoutTemplate,
        portalOverrides,
        format,
      };
      
      const { data, filename, fileSize } = await generateDocument(generationInput);
      const generationTimeMs = Date.now() - startTime;

      // Add file to zip (data is base64, need to decode for zip)
      zip.file(filename, data, { base64: true });

      downloadLogs.push({
        policyId: policy.id,
        userId: user.id,
        format,
        ipAddress: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
        fileSize,
        generationTimeMs,
      });
    }

    // Log all downloads
    if (downloadLogs.length > 0) {
      await db.insertInto("policyDownloads").values(downloadLogs).execute();
    }

    const zipContent = await zip.generateAsync({ type: "base64" });
    const date = new Date().toISOString().split("T")[0];
    const filename = `policies-${date}.zip`;

    const output: OutputType = {
      data: zipContent,
      mimeType: "application/zip",
      filename,
      processedCount: accessiblePolicies.length,
      requestedCount: policyIds.length,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error bulk downloading policies:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "User not authenticated" }),
        { status: 401 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}