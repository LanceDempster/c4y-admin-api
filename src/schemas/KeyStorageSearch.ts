import { z } from "zod";

export const KeyStorageSearchSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  level: z.string().optional(),
  page: z.number().optional(),
});

export type KeyStorageSearch = z.infer<typeof KeyStorageSearchSchema>;
