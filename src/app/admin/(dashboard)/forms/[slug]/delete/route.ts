import { NextResponse } from "next/server";

import { z } from "zod";

import { requireAdminForRoute } from "@/lib/auth/admin-route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { AdminLogAction } from "@/lib/logging/actions";
import { logAdminEvent } from "@/lib/logging/log-admin-event";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export async function POST(
  request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const auth = await requireAdminForRoute();
  if (!auth.ok) return auth.response;
  if (!auth.isOwner) {
    return NextResponse.json({ error: "Owner only." }, { status: 403 });
  }

  const { slug } = await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: form } = await supabase
    .from("forms")
    .select("id,slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  const { data: apps, error: appsError } = await supabase
    .from("applications")
    .select("id,cv_object_path")
    .eq("form_id", form.id)
    .in("id", parsed.data.ids);

  if (appsError) {
    return NextResponse.json({ error: appsError.message }, { status: 500 });
  }

  const objectPaths = (apps ?? [])
    .map((a) => a.cv_object_path)
    .filter((p): p is string => Boolean(p));

  if (objectPaths.length) {
    const service = createSupabaseServiceRoleClient();
    await service.storage.from("rms-cv").remove(objectPaths);
  }

  const { error: deleteError } = await supabase
    .from("applications")
    .delete()
    .eq("form_id", form.id)
    .in("id", parsed.data.ids);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await logAdminEvent({
    actorUserId: auth.user.id,
    action: AdminLogAction.ApplicationDeleted,
    entityType: "application",
    entityId: null,
    details: { formId: form.id, formSlug: form.slug, count: parsed.data.ids.length },
  });

  return NextResponse.json({ ok: true });
}
