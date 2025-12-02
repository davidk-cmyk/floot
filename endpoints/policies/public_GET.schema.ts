import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies, Users } from "../../helpers/schema";

export const schema = z.object({
  policyId: z.coerce.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

type PolicyAuthor = Pick<
  Selectable<Users>,
  "id" | "displayName" | "email" | "avatarUrl"
>;

export type OutputType = Selectable<Policies> & {
  author: PolicyAuthor;
};

export const getPublicPolicy = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const url = new URL(`/_api/policies/public`, window.location.origin);
  url.searchParams.append("policyId", validatedParams.policyId.toString());

  const result = await fetch(url.toString(), {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error(
      (errorObject as any).error || "Failed to fetch public policy"
    );
  }
  return superjson.parse<OutputType>(await result.text());
};