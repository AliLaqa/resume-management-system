import { z } from "zod";

export const applicationCreateSchema = z.object({
  name: z.string().trim().min(1),
  cnic: z.string().trim().min(1),
  degree: z.string().trim().min(1),
  specialization: z.string().trim().min(1),
  years_experience: z.coerce.number().int().min(0),
  previous_organization: z.string().trim().min(1),
  remarks: z.string().trim().optional().nullable(),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;

