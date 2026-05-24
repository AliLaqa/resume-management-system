"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formCreateSchema } from "@/lib/validation/form";
import { AdminLogAction } from "@/lib/logging/actions";
import { logAdminEvent } from "@/lib/logging/log-admin-event";

export async function createForm(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const parsed = formCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/forms?error=${encodeURIComponent("Invalid form data.")}`);
  }

  const { data: inserted, error } = await supabase
    .from("forms")
    .insert({
      slug: parsed.data.slug,
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      header_color: parsed.data.header_color,
      is_active: parsed.data.is_active,
    })
    .select("id,slug")
    .single();

  if (error || !inserted) {
    redirect(
      `/admin/forms?error=${encodeURIComponent(error?.message ?? "Create failed.")}`,
    );
  }

  await logAdminEvent({
    actorUserId: admin.user.id,
    action: AdminLogAction.FormCreated,
    entityType: "form",
    entityId: inserted.id,
    details: { slug: inserted.slug },
  });

  redirect(`/admin/forms/${encodeURIComponent(inserted.slug)}`);
}
