import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./download_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { generateDocument, DocumentGenerationInput } from "../../helpers/documentGenerator";
import { sql } from "kysely";

const DEFAULT_RATE_LIMIT = 10;

async function canUserAccessPolicy(
  userId: number,
  userRole: string,
  organizationId: number,
  policyId: number
): Promise<boolean> {
  if (userRole === "admin") {
    return true;
  }

  // Check for direct assignment
  const assignment = await db
    .selectFrom("policyAssignments")
    .where("userId", "=", userId)
    .where("policyId", "=", policyId)
    .where("organizationId", "=", organizationId)
    .select("id")
    .executeTakeFirst();

  if (assignment) {
    return true;
  }

  // Check if policy is in a public portal
  const publicPortalAssignment = await db
    .selectFrom("policyPortalAssignments")
    .innerJoin("portals", "policyPortalAssignments.portalId", "portals.id")
    .where("policyPortalAssignments.policyId", "=", policyId)
    .where("portals.accessType", "=", "public")
    .where("portals.isActive", "=", true)
    .where("portals.organizationId", "=", organizationId)
    .select("portals.id")
    .executeTakeFirst();

  return !!publicPortalAssignment;
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { policyId, format } = schema.parse(json);

    const settings = await db
      .selectFrom("organizationDownloadSettings")
      .selectAll()
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    const rateLimit = settings?.rateLimitPerMinute ?? DEFAULT_RATE_LIMIT;

    // Rate Limiting
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const { count } = await db
      .selectFrom("policyDownloads")
      .select(db.fn.count("id").as("count"))
      .where("userId", "=", user.id)
      .where("downloadedAt", ">", oneMinuteAgo)
      .executeTakeFirstOrThrow();

    if (Number(count) >= rateLimit) {
      return new Response(
        superjson.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429 }
      );
    }

    // Access Validation
    const hasAccess = await canUserAccessPolicy(
      user.id,
      user.role,
      user.organizationId,
      policyId
    );
    if (!hasAccess) {
      return new Response(
        superjson.stringify({ error: "You do not have permission to access this policy." }),
        { status: 403 }
      );
    }

    const policy = await db
      .selectFrom("policies")
      .selectAll()
      .where("id", "=", policyId)
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    if (!policy) {
      return new Response(
        superjson.stringify({ error: "Policy not found." }),
        { status: 404 }
      );
    }

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

    // Check for portal-specific layout overrides
    let portalOverrides = null;
    // Determine if user is accessing via a portal (check for public portal access)
    const portalAssignment = await db
      .selectFrom("policyPortalAssignments")
      .innerJoin("portals", "policyPortalAssignments.portalId", "portals.id")
      .where("policyPortalAssignments.policyId", "=", policyId)
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
    const startTime = Date.now();
    
    const generationInput: DocumentGenerationInput = {
      policy,
      organization,
      organizationVariables,
            settings: settings || null,
      layoutTemplate,
      portalOverrides,
      format,
    };
    
    const { data, mimeType, filename, fileSize } = await generateDocument(generationInput);
    const generationTimeMs = Date.now() - startTime;

    // Track Download
    await db
      .insertInto("policyDownloads")
      .values({
        policyId: policy.id,
        userId: user.id,
        format,
        ipAddress: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
        fileSize,
        generationTimeMs,
      })
      .execute();

    const output: OutputType = {
      data,
      mimeType,
      filename,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error downloading policy:", error);
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