import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, InputType, OutputType } from "./send-reminders_POST.schema";
import { sendBulkPolicyReminders, PolicyReminderEmailData } from "../../helpers/emailService";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: You must be an admin." }),
        { status: 403 }
      );
    }

    const body = superjson.parse<InputType>(await request.text());
    const parsed = schema.safeParse(body);
    
    if (!parsed.success) {
      return new Response(
        superjson.stringify({ error: "Invalid request data", details: parsed.error.issues }),
        { status: 400 }
      );
    }

    const { reminders, customMessage } = parsed.data;

    if (reminders.length === 0) {
      return new Response(
        superjson.stringify({ error: "No reminders to send" }),
        { status: 400 }
      );
    }

    const validReminders = await db
      .selectFrom("portalEmailRecipients")
      .innerJoin("portals", "portals.id", "portalEmailRecipients.portalId")
      .innerJoin("policyPortalAssignments", "policyPortalAssignments.portalId", "portals.id")
      .innerJoin("policies", "policies.id", "policyPortalAssignments.policyId")
      .where("portals.organizationId", "=", user.organizationId)
      .where((eb) =>
        eb.or(
          reminders.map((r) =>
            eb.and([
              eb("portalEmailRecipients.email", "=", r.email),
              eb("policies.id", "=", r.policyId),
              eb("portals.id", "=", r.portalId),
            ])
          )
        )
      )
      .select([
        "portalEmailRecipients.email",
        "policies.id as policyId",
        "policies.title as policyTitle",
        "portals.id as portalId",
        "portals.name as portalName",
        "portals.slug as portalSlug",
      ])
      .execute();

    if (validReminders.length === 0) {
      return new Response(
        superjson.stringify({ error: "No valid reminders to send. All requested reminders are either invalid or not in your organization." }),
        { status: 400 }
      );
    }

    const organization = await db
      .selectFrom("organizations")
      .where("id", "=", user.organizationId)
      .select(["id", "slug"])
      .executeTakeFirst();

    if (!organization) {
      return new Response(
        superjson.stringify({ error: "Organization not found" }),
        { status: 404 }
      );
    }

    const baseUrl = process.env.APP_BASE_URL
      || (process.env.REPLIT_DEPLOYMENT_URL ? `https://${process.env.REPLIT_DEPLOYMENT_URL}` : null)
      || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null)
      || "http://localhost:5000";

    const emailData: PolicyReminderEmailData[] = validReminders.map((reminder) => {
      const policyUrl = `${baseUrl}/${organization.slug}/portal/${reminder.portalSlug}/policy/${reminder.policyId}`;

      return {
        recipientEmail: reminder.email,
        policyTitle: reminder.policyTitle,
        portalName: reminder.portalName,
        portalUrl: policyUrl,
        customMessage,
      };
    });

    const results = await sendBulkPolicyReminders(emailData);

    const output: OutputType = results;

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending reminder emails:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}
