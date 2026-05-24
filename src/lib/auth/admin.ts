import { redirect } from "next/navigation";

import { debugWarn } from "@/lib/logging/server-debug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    debugWarn("requireAdmin", "no_authenticated_user", {
      error: userError?.message ?? null,
    });
    redirect("/admin/login");
  }

  const user = userData.user;

  const isAdminRes = await supabase.rpc("is_admin", {});
  if (isAdminRes.error || !isAdminRes.data) {
    debugWarn("requireAdmin", "not_admin", {
      userId: user.id,
      error: isAdminRes.error?.message ?? null,
      data: isAdminRes.data ?? null,
    });
    redirect("/admin/unauthorized");
  }

  const isOwnerRes = await supabase.rpc("is_owner", {});

  return {
    user,
    isOwner: Boolean(isOwnerRes.data),
  };
}

export async function requireOwner() {
  const admin = await requireAdmin();
  if (!admin.isOwner) {
    redirect("/admin");
  }
  return admin;
}
