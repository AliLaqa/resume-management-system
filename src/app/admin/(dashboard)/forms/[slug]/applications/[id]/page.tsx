import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminLogAction } from "@/lib/logging/actions";
import { logAdminEvent } from "@/lib/logging/log-admin-event";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id,slug,title")
    .eq("slug", slug)
    .maybeSingle();
  if (!form) notFound();

  const { data: app } = await supabase
    .from("applications")
    .select(
      "id,created_at,name,cnic,degree,specialization,years_experience,previous_organization,remarks,cv_public_url,cv_original_filename",
    )
    .eq("id", id)
    .eq("form_id", form.id)
    .maybeSingle();

  if (!app) notFound();

  await logAdminEvent({
    actorUserId: admin.user.id,
    action: AdminLogAction.ApplicationViewed,
    entityType: "application",
    entityId: app.id,
    details: { formId: form.id, formSlug: form.slug },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            Application details
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Form: <span className="font-medium text-zinc-900">{form.title}</span>
          </p>
        </div>
        <Link
          href={`/admin/forms/${encodeURIComponent(form.slug)}`}
          className="h-9 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          Back
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-zinc-500">Submitted</div>
            <div className="mt-1 text-sm text-zinc-900">
              {new Date(app.created_at).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Name</div>
            <div className="mt-1 text-sm text-zinc-900">{app.name}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">CNIC</div>
            <div className="mt-1 text-sm text-zinc-900">{app.cnic}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Degree</div>
            <div className="mt-1 text-sm text-zinc-900">{app.degree}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Specialization</div>
            <div className="mt-1 text-sm text-zinc-900">{app.specialization}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Years of Experience</div>
            <div className="mt-1 text-sm text-zinc-900">{app.years_experience}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Notable Previous Organization</div>
            <div className="mt-1 text-sm text-zinc-900">{app.previous_organization}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">CV Attach</div>
            <div className="mt-1 text-sm">
              {app.cv_public_url ? (
                <a
                  href={`/admin/cv?applicationId=${encodeURIComponent(app.id)}`}
                  className="text-zinc-900 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {app.cv_original_filename ?? "Download CV"}
                </a>
              ) : (
                <span className="text-zinc-400">—</span>
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs font-medium text-zinc-500">Remarks</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-900">
              {app.remarks ?? ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
