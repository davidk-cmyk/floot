import { z } from "zod";

export const schema = z.object({
  userId: z.number().int().positive(),
});
