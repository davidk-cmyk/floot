import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  portalId: z.number().int().positive().optional(),
  status: z.enum(["acknowledged", "pending"]).optional(),
  department: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(25),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  records: {
    email: string;
    policyTitle: string;
    department: string | null;
    portalName: string;
    status: "acknowledged" | "pending";
    acknowledgedAt: Date | null;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getEmailAcknowledgmentReport = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();

  if (params.portalId) searchParams.set("portalId", String(params.portalId));
  if (params.status) searchParams.set("status", params.status);
  if (params.department) searchParams.set("department", params.department);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const result = await fetch(
    `/_api/email-acknowledgment/report?${searchParams.toString()}`,
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
    throw new Error((errorObject as any).error || "An unknown error occurred");
  }
  return superjson.parse<OutputType>(await result.text());
};