import { z } from "zod";

export function PaginatedResponse<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    next: z.string().nullable(),
    previous: z.string().nullable(),
    count: z.number(),
    results: z.array(schema),
  });
}
export type PaginatedResponseType<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export function PaginatedCursorResponse<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(schema),
  });
}
export type PaginatedCursorResponse<T> = {
  next: string | null;
  previous: string | null;
  results: T[];
};

export const MetaHead = z.object({
  type: z.string().default(""),
  title: z.string().default(""),
  url: z.string().default(""),
  image: z.string().default(""),
  description: z.string().default(""),
});

export type MetaHead = z.infer<typeof MetaHead>;
