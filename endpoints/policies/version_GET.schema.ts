import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { PolicyVersions } from "../../helpers/schema";

export const schema = z.object({
  policyId: z.number().int().positive(),
  versionNumber: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<PolicyVersions>;

export const getGetPolicyVersion = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.set("policyId", String(params.policyId));
  searchParams.set("versionNumber", String(params.versionNumber));

  const result = await fetch(
    `/_api/policies/version?${searchParams.toString()}`,
    {
      method: "GET",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }
  );

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error);
  }
  return superjson.parse<OutputType>(await result.text());
};