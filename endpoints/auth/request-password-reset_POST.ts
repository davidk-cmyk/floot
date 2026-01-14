import { db } from "../../helpers/db";
import { schema, OutputType } from "./request-password-reset_POST.schema";
import { sendPasswordResetEmail } from "../../helpers/emailService";
import { randomInt } from "crypto";
import { addMinutes } from "date-fns";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email } = schema.parse(json);

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db
      .selectFrom("users")
      .innerJoin("userPasswords", "users.id", "userPasswords.userId")
      .select(["users.id", "users.email"])
      .where("users.email", "ilike", normalizedEmail)
      .executeTakeFirst();

    if (!user) {
      return Response.json({
        success: true,
        message: "If an account exists with this email, a reset code has been sent.",
      } satisfies OutputType);
    }

    const code = randomInt(100000, 999999).toString();
    const expiresAt = addMinutes(new Date(), 15);

    await db
      .insertInto("passwordResetCodes")
      .values({
        userId: user.id,
        email: normalizedEmail,
        code,
        expiresAt,
      })
      .execute();

    try {
      await sendPasswordResetEmail(normalizedEmail, code);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return Response.json(
        {
          success: false,
          message: "Failed to send reset email. Please try again later.",
        } satisfies OutputType,
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "If an account exists with this email, a reset code has been sent.",
    } satisfies OutputType);
  } catch (error) {
    console.error("Error requesting password reset:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return Response.json(
      { success: false, message } satisfies OutputType,
      { status: 400 }
    );
  }
}
