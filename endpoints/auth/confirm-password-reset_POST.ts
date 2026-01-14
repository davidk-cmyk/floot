import { db } from "../../helpers/db";
import { schema, OutputType } from "./confirm-password-reset_POST.schema";
import { hash } from "bcryptjs";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email, code, newPassword } = schema.parse(json);

    const normalizedEmail = email.toLowerCase().trim();

    const resetCode = await db
      .selectFrom("passwordResetCodes")
      .selectAll()
      .where("email", "ilike", normalizedEmail)
      .where("code", "=", code)
      .where("used", "=", false)
      .orderBy("createdAt", "desc")
      .executeTakeFirst();

    if (!resetCode) {
      return Response.json(
        {
          success: false,
          message: "Invalid or expired reset code.",
        } satisfies OutputType,
        { status: 400 }
      );
    }

    if (new Date() > new Date(resetCode.expiresAt)) {
      return Response.json(
        {
          success: false,
          message: "Reset code has expired. Please request a new one.",
        } satisfies OutputType,
        { status: 400 }
      );
    }

    const passwordHash = await hash(newPassword, 12);

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("passwordResetCodes")
        .set({ used: true })
        .where("id", "=", resetCode.id)
        .execute();

      await trx
        .updateTable("userPasswords")
        .set({ passwordHash })
        .where("userId", "=", resetCode.userId)
        .execute();
    });

    return Response.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    } satisfies OutputType);
  } catch (error) {
    console.error("Error confirming password reset:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return Response.json(
      { success: false, message } satisfies OutputType,
      { status: 400 }
    );
  }
}
