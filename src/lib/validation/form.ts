import { z } from "zod";

import { normalizeSlug } from "@/lib/slug/normalize";

export const headerColorSchema = z.enum([
  "zinc",
  "blue",
  "emerald",
  "rose",
  "amber",
  "violet",
]);

export const formCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .transform((v) => normalizeSlug(v))
    .refine((v) => v.length > 0, { message: "Slug is required." }),
  title: z.string().trim().min(1),
  summary: z.string().trim().optional().nullable(),
  header_color: headerColorSchema.default("zinc"),
  is_active: z.coerce.boolean().default(true),
});

export type FormCreateInput = z.infer<typeof formCreateSchema>;

export const formUpdateSchema = formCreateSchema.partial().extend({
  slug: z
    .string()
    .min(1)
    .transform((v) => normalizeSlug(v))
    .optional(),
});

export type FormUpdateInput = z.infer<typeof formUpdateSchema>;

