import { z } from "zod";

export const summonerSearchSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  queue: z.coerce.number().int().optional(),
  playedWith: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type SummonerSearch = z.infer<typeof summonerSearchSchema>;
