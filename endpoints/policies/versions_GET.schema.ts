import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  policyId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type PolicyVersionInfo = {
  id: number;
  policyId: number;
  versionNumber: number;
  title: string;
  createdAt: Date | null;
  changeSummary: string | null;
  createdByDisplayName: string;
};

export type OutputType = PolicyVersionInfo[];

export const getGetPolicyVersions = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.set("policyId", String(params.policyId));

  const result = await fetch(
    `/_api/policies/versions?${searchParams.toString()}`,
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