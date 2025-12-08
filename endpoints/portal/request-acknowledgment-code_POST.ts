import { db } from "../../helpers/db";
import { schema, OutputType } from "./request-acknowledgment-code_POST.schema";
import { sendConfirmationCodeEmail } from "../../helpers/emailService";
import superjson from "superjson";
import { randomInt } from "crypto";
import { addMinutes } from "date-fns";

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

    const recipient = await db
      .selectFrom("portalEmailRecipients")
      .where("portalId", "=", portal.id)
      .where("email", "ilike", lowercasedEmail)
      .executeTakeFirst();

    if (!recipient) {
      return new Response(
        superjson.stringify({
          success: false,
          message: "Email not found in the acknowledgment list for this portal.",
        } satisfies OutputType),
        { status: 403 }
      );
    }

    const code = randomInt(100000, 999999).toString();
    const expiresAt = addMinutes(new Date(), 15);

    await db
      .insertInto("acknowledgmentConfirmationCodes")
      .values({
        portalId: portal.id,
        policyId: policy.id,
        email: lowercasedEmail,
        code,
        expiresAt,
      })
      .execute();

    await sendConfirmationCodeEmail(lowercasedEmail, code);

    return new Response(
      superjson.stringify({
        success: true,
        message: "A confirmation code has been sent to your email.",
      } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error requesting acknowledgment code:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ success: false, message }), {
      status: 400,
    });
  }
}