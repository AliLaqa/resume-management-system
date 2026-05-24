import { NextResponse } from "next/server";

import { debugWarn } from "@/lib/logging/server-debug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdminForRoute() {
  const supabase = await createSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    debugWarn("requireAdminForRoute", "unauthorized", {
      error: userError?.message ?? null,
    });
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = userData.user;
  const isAdminRes = await supabase.rpc("is_admin", {});
  if (isAdminRes.error || !isAdminRes.data) {
    debugWarn("requireAdminForRoute", "forbidden", {
      userId: user.id,
      error: isAdminRes.error?.message ?? null,
      data: isAdminRes.data ?? null,
    });
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const isOwnerRes = await supabase.rpc("is_owner", {});

  return {
    ok: true as const,
    user,
    isOwner: Boolean(isOwnerRes.data),
  };
}
