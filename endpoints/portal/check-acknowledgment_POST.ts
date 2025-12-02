import { db } from "../../helpers/db";
import { schema, OutputType } from "./check-acknowledgment_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { portalSlug, policyId, email } = schema.parse(json);

    const lowercasedEmail = email.toLowerCase().trim();

    const portal = await db
      .selectFrom("portals")
      .select(["id", "accessType", "organizationId"])
      .where("slug", "=", portalSlug)
      .where("isActive", "=", true)
      .orderBy("id", "desc")
      .executeTakeFirst();

    if (!portal) {
      return new Response(
        superjson.stringify({
          success: false,
          message: "Portal not found or is not active.",
        } satisfies OutputType),
        { status: 404 }
      );
    }

    if (portal.accessType !== "password") {
      return new Response(
        superjson.stringify({
          success: false,
          message: "This check is only for password-protected portals.",
        } satisfies OutputType),
        { status: 400 }
      );
    }

    const policy = await db
      .selectFrom("policies")
      .select("id")
      .where("id", "=", policyId)
      .where("organizationId", "=", portal.organizationId)
      .executeTakeFirst();

    if (!policy) {
      return new Response(
        superjson.stringify({
          success: false,
          message: "Policy not found.",
        } satisfies OutputType),
        { status: 404 }
      );
    }

    const acknowledgment = await db
      .selectFrom("emailBasedAcknowledgments")
      .select(["acknowledgedAt"])
      .where("portalId", "=", portal.id)
      .where("policyId", "=", policy.id)
      .where("email", "ilike", lowercasedEmail)
      .executeTakeFirst();

    return new Response(
      superjson.stringify({
        success: true,
        isAcknowledged: !!acknowledgment,
        acknowledgedAt: acknowledgment?.acknowledgedAt ?? null,
      } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking acknowledgment:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ success: false, message }), {
      status: 400,
    });
  }
}