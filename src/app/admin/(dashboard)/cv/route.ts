import { NextResponse } from "next/server";

import { requireAdminForRoute } from "@/lib/auth/admin-route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminLogAction } from "@/lib/logging/actions";
import { logAdminEvent } from "@/lib/logging/log-admin-event";

export async function GET(request: Request) {
  const auth = await requireAdminForRoute();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const applicationId = searchParams.get("applicationId");
  if (!applicationId) {
    return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: appRow, error } = await supabase
    .from("applications")
    .select("id,form_id,cv_public_url")
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !appRow?.cv_public_url) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  await logAdminEvent({
    actorUserId: auth.user.id,
    action: AdminLogAction.CvDownloaded,
    entityType: "cv",
    entityId: appRow.id,
    details: { formId: appRow.form_id },
  });

  return NextResponse.redirect(appRow.cv_public_url, { status: 302 });
}
