import { db } from "../../helpers/db";
import { schema, OutputType } from "./confirm-acknowledgment_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { portalSlug, policyId, email, code } = schema.parse(json);

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
          message: "This acknowledgment method is only for password-protected portals.",
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

    const confirmationCode = await db
      .selectFrom("acknowledgmentConfirmationCodes")
      .selectAll()
      .where("portalId", "=", portal.id)
      .where("policyId", "=", policy.id)
      .where("email", "ilike", lowercasedEmail)
      .where("code", "=", code)
      .executeTakeFirst();

    if (
      !confirmationCode ||
      confirmationCode.used ||
      new Date() > new Date(confirmationCode.expiresAt)
    ) {
      return new Response(
        superjson.stringify({
          success: false,
          message: "Invalid or expired confirmation code.",
        } satisfies OutputType),
        { status: 400 }
      );
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("acknowledgmentConfirmationCodes")
        .set({ used: true })
        .where("id", "=", confirmationCode.id)
        .execute();

      await trx
        .insertInto("emailBasedAcknowledgments")
        .values({
          organizationId: portal.organizationId,
          portalId: portal.id,
          policyId: policy.id,
          email: lowercasedEmail,
          acknowledgedAt: new Date(),
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0],
          userAgent: request.headers.get("user-agent"),
        })
                .onConflict((oc) =>
          oc
            .columns(["portalId", "policyId", "email"])
            .doUpdateSet({
              acknowledgedAt: new Date(),
              ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0],
              userAgent: request.headers.get("user-agent"),
            })
        )
        .execute();
    });

    return new Response(
      superjson.stringify({
        success: true,
        message: "Acknowledgment recorded successfully.",
      } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error confirming acknowledgment:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ success: false, message }), {
      status: 400,
    });
  }
}