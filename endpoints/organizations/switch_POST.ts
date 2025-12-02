import { schema, OutputType } from "./switch_POST.schema";
import superjson from 'superjson';
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { User } from "../../helpers/User";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { organizationId: targetOrganizationId } = schema.parse(json);

    // A user can only belong to one organization as per the current schema.
    // The switch functionality is only relevant if a user can access multiple organizations.
    // For now, we will validate that the user is trying to switch to the organization they already belong to.
    // This logic will need to be updated if a user_organizations mapping is introduced.
    const userOrganizations = await db
      .selectFrom('users')
      .select('organizationId')
      .where('id', '=', user.id)
      .execute();

    const hasAccess = userOrganizations.some(org => org.organizationId === targetOrganizationId);

    if (!hasAccess) {
      return new Response(superjson.stringify({ error: "Access denied to this organization." }), { status: 403 });
    }

    // Update the user's active organizationId in the database
    await db
      .updateTable('users')
      .set({ organizationId: targetOrganizationId })
      .where('id', '=', user.id)
      .execute();

    const updatedUser: User = {
      ...user,
      organizationId: targetOrganizationId,
    };

    // The session itself doesn't store organizationId, so no need to update JWT.
    // The user object is fetched from DB on each session check.
    // We return the updated user object to the client.
    return new Response(superjson.stringify({ user: updatedUser } satisfies OutputType));

  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    if (error instanceof Error) {
      console.error("Error switching organization:", error);
      return new Response(superjson.stringify({ error: error.message }), { status: 400 });
    }
    console.error("An unknown error occurred:", error);
    return new Response(superjson.stringify({ error: "An unexpected error occurred" }), { status: 500 });
  }
}