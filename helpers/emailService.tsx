import { Resend } from "resend";

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }

  connectionSettings = await fetch(
    "https://" +
      hostname +
      "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("Resend not connected");
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

export async function sendConfirmationCodeEmail(
  to: string,
  code: string
): Promise<void> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const from = fromEmail || "MyPolicyPortal <noreply@example.com>";

    const result = await client.emails.send({
      from,
      to,
      subject: "Policy Acknowledgment Confirmation Code",
      text: `Your confirmation code is: ${code}. This code will expire in 15 minutes.`,
      html: `<p>Your confirmation code is: <strong>${code}</strong>. This code will expire in 15 minutes.</p>`,
    });

    if (result.error) {
      console.error(
        "Error sending confirmation code email via Resend:",
        result.error
      );
      throw new Error("Failed to send confirmation email.");
    }

    console.log(`Confirmation code email sent to ${to}`);
  } catch (error) {
    console.error("Error sending confirmation code email via Resend:", error);
    throw new Error("Failed to send confirmation email.");
  }
}

export async function sendPasswordResetEmail(
  to: string,
  code: string
): Promise<void> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const from = fromEmail || "MyPolicyPortal <noreply@example.com>";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="color: #666; line-height: 1.6;">
          You requested to reset your password. Use the code below to complete the process:
        </p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">${code}</span>
        </div>
        <p style="color: #666; line-height: 1.6;">
          This code will expire in <strong>15 minutes</strong>.
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">
          If you did not request a password reset, you can safely ignore this email. 
          Your password will remain unchanged.
        </p>
      </div>
    `;

    const result = await client.emails.send({
      from,
      to,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${code}. This code will expire in 15 minutes. If you did not request this, please ignore this email.`,
      html: htmlContent,
    });

    if (result.error) {
      console.error(
        "Error sending password reset email via Resend:",
        result.error
      );
      throw new Error("Failed to send password reset email.");
    }

    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error("Error sending password reset email via Resend:", error);
    throw new Error("Failed to send password reset email.");
  }
}

export interface PolicyReminderEmailData {
  recipientEmail: string;
  policyTitle: string;
  portalName: string;
  portalUrl: string;
  customMessage?: string;
}

export async function sendPolicyReminderEmail(
  data: PolicyReminderEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const from = fromEmail || "MyPolicyPortal <noreply@example.com>";

    const defaultMessage = `This is a friendly reminder that you have an outstanding policy acknowledgement required for "${data.policyTitle}".

Please review and acknowledge this policy at your earliest convenience.

If you have any questions, please contact your administrator.`;

    const message = data.customMessage
      ? data.customMessage.replace("{policyTitle}", data.policyTitle)
      : defaultMessage;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Policy Acknowledgement Required</h2>
        <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        <div style="margin: 24px 0;">
          <a href="${data.portalUrl}" 
             style="background-color: #0066cc; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            View Policy
          </a>
        </div>
        <p style="color: #888; font-size: 12px;">
          This email was sent from ${data.portalName}. If you believe you received this email in error, 
          please contact your administrator.
        </p>
      </div>
    `;

    const result = await client.emails.send({
      from,
      to: data.recipientEmail,
      subject: `Action Required: Policy Acknowledgement for "${data.policyTitle}"`,
      text: `${message}\n\nView the policy here: ${data.portalUrl}`,
      html: htmlContent,
    });

    if (result.error) {
      console.error("Error sending reminder email via Resend:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`Reminder email sent to ${data.recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending reminder email via Resend:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendBulkPolicyReminders(
  reminders: PolicyReminderEmailData[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const reminder of reminders) {
    const result = await sendPolicyReminderEmail(reminder);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(
        `${reminder.recipientEmail}: ${result.error || "Unknown error"}`
      );
    }
  }

  return results;
}
