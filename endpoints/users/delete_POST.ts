import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./delete_POST.schema";
import superjson from "superjson";
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";

async function deleteUserTransactions(userId: number, trx: Transaction<DB>) {
  // Depending on foreign key constraints, the order might matter.
  // It's safer to delete from tables that reference the user first.
  await trx.deleteFrom("policyAcknowledgments").where("userId", "=", userId).execute();
  await trx.deleteFrom("policyAssignments").where("userId", "=", userId).execute();
  await trx.deleteFrom("policyReadingSessions").where("userId", "=", userId).execute();
  await trx.deleteFrom("oauthAccounts").where("userId", "=", userId).execute();
  await trx.deleteFrom("userPasswords").where("userId", "=", userId).execute();
  await trx.deleteFrom("sessions").where("userId", "=", userId).execute();
  
  // Finally, delete the user itself
  const result = await trx.deleteFrom("users").where("id", "=", userId).executeTakeFirst();

  if (result.numDeletedRows === 0n) {
    throw new Error("User not found or already deleted.");
  }
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

    if (adminUser.id === userId) {
      return new Response(
        superjson.stringify({ error: "Admins cannot delete their own account." }),
        { status: 400 }
      );
    }

    await db.transaction().execute(async (trx) => {
      await deleteUserTransactions(userId, trx);
    });

    return new Response(
      superjson.stringify({ success: true } satisfies OutputType)
    );
  } catch (error) {
    console.error("Failed to delete user:", error);
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