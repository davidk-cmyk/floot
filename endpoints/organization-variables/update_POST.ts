import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: Admins only" }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const { variables } = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      const results = [];
      for (const variable of variables) {
        const upsertResult = await trx
          .insertInto("organizationVariables")
          .values({
            organizationId: user.organizationId,
            variableName: variable.variableName,
            variableValue: variable.variableValue,
            isSystemVariable: false, // User-defined variables are never system variables
          })
          .onConflict((oc) =>
            oc
              .columns(["organizationId", "variableName"])
              .doUpdateSet({ variableValue: variable.variableValue })
          )
          .returningAll()
          .executeTakeFirstOrThrow();
        results.push(upsertResult);
      }
      return results;
    });

    const output: OutputType = { success: true, variables: result };
    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating organization variables:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "User not authenticated" }),
        { status: 401 }
      );
    }
    if (error instanceof ZodError) {
      return new Response(
        superjson.stringify({ error: "Invalid input", details: error.errors }),
        { status: 400 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}