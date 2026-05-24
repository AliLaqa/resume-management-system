import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  // In Next.js client bundles, only direct `process.env.NEXT_PUBLIC_*` accesses
  // are inlined. Avoid passing the whole `process.env` object to zod.
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  };

  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      "Missing/invalid environment variables. Check NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and (server-only) SUPABASE_SECRET_KEY.",
    );
  }
  return parsed.data;
}
