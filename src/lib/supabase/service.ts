import { createClient } from "@supabase/supabase-js";

import { getEnv } from "@/lib/env";

export function createSupabaseServiceRoleClient() {
  const env = getEnv();
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY is required for server-side admin operations (uploads, admin management, and logs).",
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
