"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireOwner } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { AdminLogAction } from "@/lib/logging/actions";
import { logAdminEvent } from "@/lib/logging/log-admin-event";

export async function inviteAdmin(formData: FormData) {
  const owner = await requireOwner();

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/admin/admins?error=Email%20is%20required");
  }

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const redirectTo = host ? `${proto}://${host}/admin/reset-password` : undefined;

  const service = createSupabaseServiceRoleClient();
  const invite = await service.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });
  if (invite.error || !invite.data.user) {
    redirect(
      `/admin/admins?error=${encodeURIComponent(invite.error?.message ?? "Invite failed")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const insert = await supabase.from("admins").insert({
    user_id: invite.data.user.id,
    is_owner: false,
  });
  if (insert.error) {
    redirect(`/admin/admins?error=${encodeURIComponent(insert.error.message)}`);
  }

  await logAdminEvent({
    actorUserId: owner.user.id,
    action: AdminLogAction.AdminAdded,
    entityType: "admin",
    entityId: invite.data.user.id,
    details: { email },
  });

  redirect("/admin/admins?ok=invited");
}

export async function removeAdmin(formData: FormData) {
  const owner = await requireOwner();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) {
    redirect("/admin/admins?error=Missing%20user_id");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("admins").delete().eq("user_id", userId);
  if (error) {
    redirect(`/admin/admins?error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent({
    actorUserId: owner.user.id,
    action: AdminLogAction.AdminRemoved,
    entityType: "admin",
    entityId: userId,
    details: {},
  });

  redirect("/admin/admins?ok=removed");
}
