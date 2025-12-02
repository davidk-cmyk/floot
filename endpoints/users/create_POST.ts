import { schema, OutputType } from "./create_POST.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import { generateRandomPassword } from "../../helpers/generateRandomPassword";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { Selectable } from "kysely";
import { Users } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const { user: adminUser } = await getServerUserSession(request);

    if (adminUser.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: Admins only" }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", input.email)
      .where("organizationId", "=", adminUser.organizationId)
      .executeTakeFirst();

    if (existingUser) {
      return new Response(
        superjson.stringify({ error: "User with this email already exists" }),
        { status: 409 }
      );
    }

    const password = generateRandomPassword();
    const passwordHash = await generatePasswordHash(password);

    const newUser = await db.transaction().execute(async (trx) => {
      const createdUser = await trx
        .insertInto("users")
        .values({
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: `${input.firstName} ${input.lastName}`,
          email: input.email,
          role: input.role,
          hasLoggedIn: false,
          isActive: true,
          organizationId: adminUser.organizationId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("userPasswords")
        .values({
          userId: createdUser.id,
          passwordHash: passwordHash,
        })
        .execute();

      return createdUser;
    });

    const response: OutputType = {
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        organizationId: newUser.organizationId,
        oauthProvider: null,
                hasLoggedIn: newUser.hasLoggedIn ?? false,
      },
      password: password,
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }
    if (error instanceof Error) {
      return new Response(superjson.stringify({ error: error.message }), {
        status: 400,
      });
    }
    return new Response(
      superjson.stringify({ error: "An unknown error occurred" }),
      { status: 500 }
    );
  }
}