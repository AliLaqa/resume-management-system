"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { debugWarn } from "@/lib/logging/server-debug";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formCreateSchema } from "@/lib/validation/form";
import { AdminLogAction } from "@/lib/logging/actions";
import { logAdminEvent } from "@/lib/logging/log-admin-event";

function toUserCreateFormError(error: { code?: string | null; message?: string | null }) {
  // Postgres unique violation: duplicate slug
  if (error.code === "23505") {
    return "That slug is already in use. Please choose a different slug.";
  }

  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("forms_slug_unique") || (msg.includes("duplicate") && msg.includes("slug"))) {
    return "That slug is already in use. Please choose a different slug.";
  }

  return "Could not create the form. Please try again.";
}

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
    if (error) {
      debugWarn("createForm", "insert_failed", {
        code: (error as unknown as { code?: string }).code ?? null,
        message: error.message,
      });
    }
    redirect(
      `/admin/forms?error=${encodeURIComponent(
        toUserCreateFormError(error ?? {}),
      )}`,
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
