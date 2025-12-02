import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import { schema, OutputType } from "./drop-password_POST.schema";
import superjson from "superjson";

function generateRandomPassword(length: number = 12): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

export async function handle(request: Request) {
  try {
    const { user: adminUser } = await getServerUserSession(request);

    if (adminUser.role !== "admin") {
      return new Response(
        superjson.stringify({
          error: "Forbidden",
        }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const { userId } = schema.parse(json);

    // Generate a new random password
    const newPassword = generateRandomPassword(12);
    const passwordHash = await generatePasswordHash(newPassword);

    // Upsert the password hash in the database
    await db
      .insertInto("userPasswords")
      .values({
        userId: userId,
        passwordHash: passwordHash,
      })
      .onConflict((oc) => oc.column("userId").doUpdateSet({
        passwordHash: passwordHash,
      }))
      .execute();

    console.log(`Generated new password for user ${userId}`);

    return new Response(
      superjson.stringify({ 
        success: true, 
        password: newPassword 
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Failed to generate new user password:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
}