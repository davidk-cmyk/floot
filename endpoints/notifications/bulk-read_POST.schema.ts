import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  notificationIds: z.array(z.number().int().positive()).min(1, "At least one notification ID is required."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  updatedCount: number;
};

export const postBulkReadNotifications = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/notifications/bulk-read`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    try {
      const errorObject = superjson.parse(await result.text());
      const errorMessage = 
        typeof errorObject === 'object' && 
        errorObject !== null && 
        'error' in errorObject && 
        typeof errorObject.error === 'string' 
          ? errorObject.error 
          : "An unknown error occurred";
      throw new Error(errorMessage);
    } catch (e) {
      throw new Error(`Request failed with status ${result.status}`);
    }
  }
  
  return superjson.parse<OutputType>(await result.text());
};