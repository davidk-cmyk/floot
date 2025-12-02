import { z } from "zod";
import superjson from "superjson";
import { PolicyWithAuthor } from "../helpers/policyTypes";
import { PublicPortalInfo } from "./portalPolicies_GET.schema";

export const schema = z.object({
  portalSlug: z.string(),
  policyId: z.number().int(),
  password: z.string().optional()
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  portal: PublicPortalInfo;
  policy: PolicyWithAuthor;
  userAcknowledgmentStatus?: {
    isAcknowledged: boolean;
    acknowledgedAt: Date | null;
    acknowledgmentId: number | null;
  };
};

export const getPortalPolicyDetails = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.set("portalSlug", params.portalSlug);
  searchParams.set("policyId", String(params.policyId));
  if (params.password) searchParams.set("password", params.password);

  const result = await fetch(
    `/_api/portalPolicy?${searchParams.toString()}`,
    {
      method: "GET",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    }
  );

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error);
  }
  return superjson.parse<OutputType>(await result.text());
};