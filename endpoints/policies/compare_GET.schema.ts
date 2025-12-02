import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { PolicyVersions } from "../../helpers/schema";

export const schema = z.object({
  policyId: z.number().int().positive(),
  version1: z.number().int().positive(),
  version2: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  version1: Selectable<PolicyVersions>;
  version2: Selectable<PolicyVersions>;
};

export const getComparePolicyVersions = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.set("policyId", String(params.policyId));
  searchParams.set("version1", String(params.version1));
  searchParams.set("version2", String(params.version2));

  const result = await fetch(
    `/_api/policies/compare?${searchParams.toString()}`,
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