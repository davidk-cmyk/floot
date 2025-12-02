import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a 6-digit confirmation code to a user's email via Resend.
 * In demo mode (when DISABLE_DEMO_MODE is not set to "true"), logs the code instead of sending.
 * @param to The recipient's email address.
 * @param code The 6-digit confirmation code to send.
 */
export async function sendConfirmationCodeEmail(
  to: string,
  code: string
): Promise<void> {
      // Demo mode is enabled for demonstration purposes
  // Change this to false when you want to use real email sending
  const isDemoMode = true;

  if (isDemoMode) {
    console.log(`[DEMO MODE] Confirmation code for ${to}: ${code}`);
    return;
  }

  // Using Resend's onboarding domain for initial setup
  // For production, update to your custom domain like: 'MyPolicyPortal <noreply@mpp.ruunis.com>'
  const from = "MyPolicyPortal <info@mpp.ruunis.com>";

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: "Policy Acknowledgment Confirmation Code",
      text: `Your confirmation code is: ${code}. This code will expire in 15 minutes.`,
      html: `<p>Your confirmation code is: <strong>${code}</strong>. This code will expire in 15 minutes.</p>`,
    });

    if (result.error) {
      console.error("Error sending confirmation code email via Resend:", result.error);
      throw new Error("Failed to send confirmation email.");
    }

    console.log(`Confirmation code email sent to ${to}`);
  } catch (error) {
    console.error("Error sending confirmation code email via Resend:", error);
    throw new Error("Failed to send confirmation email.");
  }
}