"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { formUpdateSchema } from "@/lib/validation/form";
import { sanitizeFilename } from "@/lib/storage/sanitize-filename";
import { AdminLogAction } from "@/lib/logging/actions";
import { logAdminEvent } from "@/lib/logging/log-admin-event";

export async function updateForm(slug: string, formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: existingError } = await supabase
    .from("forms")
    .select("id,slug,is_active,logo_object_path")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError || !existing) {
    redirect("/admin/forms?error=Form%20not%20found");
  }

  const parsed = formUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/forms/${encodeURIComponent(slug)}/edit?error=Invalid%20data`);
  }

  let logoObjectPath: string | null | undefined = undefined;
  const logo = formData.get("logo");
  const logoFile =
    logo instanceof File && logo.size > 0 ? (logo as File) : null;
  if (logoFile) {
    const service = createSupabaseServiceRoleClient();
    const safeName = sanitizeFilename(logoFile.name);
    const objectPath = `forms/${existing.id}/${safeName}`;
    const bytes = Buffer.from(await logoFile.arrayBuffer());

    const upload = await service.storage.from("rms-logos").upload(objectPath, bytes, {
      contentType: logoFile.type || undefined,
      upsert: true,
    });
    if (upload.error) {
      redirect(
        `/admin/forms/${encodeURIComponent(slug)}/edit?error=${encodeURIComponent(upload.error.message)}`,
      );
    }
    logoObjectPath = objectPath;
  }

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    patch[k] = v;
  }
  if (logoObjectPath !== undefined) patch.logo_object_path = logoObjectPath;

  const { data: updated, error: updateError } = await supabase
    .from("forms")
    .update(patch)
    .eq("id", existing.id)
    .select("id,slug,is_active")
    .single();

  if (updateError || !updated) {
    redirect(
      `/admin/forms/${encodeURIComponent(slug)}/edit?error=${encodeURIComponent(updateError?.message ?? "Update failed")}`,
    );
  }

  await logAdminEvent({
    actorUserId: admin.user.id,
    action: AdminLogAction.FormUpdated,
    entityType: "form",
    entityId: updated.id,
    details: { slug: updated.slug },
  });

  if (!existing.is_active && updated.is_active) {
    await logAdminEvent({
      actorUserId: admin.user.id,
      action: AdminLogAction.FormPublished,
      entityType: "form",
      entityId: updated.id,
      details: { slug: updated.slug },
    });
  }

  redirect(`/admin/forms/${encodeURIComponent(updated.slug)}`);
}
