import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { SubmissionsTable } from "@/app/admin/(dashboard)/forms/[slug]/ui/submissions-table";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id,slug,title,is_active,header_color,created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!form) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id,created_at,name,cnic,degree,specialization,years_experience,previous_organization,remarks,cv_public_url,cv_original_filename",
    )
    .eq("form_id", form.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">{form.title}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Public link:{" "}
              <Link
                href={`/forms/${encodeURIComponent(form.slug)}`}
                className="text-zinc-900 underline"
                target="_blank"
              >
                /forms/{form.slug}
              </Link>
            </p>
          </div>
          <Link
            href={`/admin/forms/${encodeURIComponent(form.slug)}/edit`}
            className="h-9 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Edit form
          </Link>
        </div>
        <div className="text-xs text-zinc-500">
          Status: {form.is_active ? "Active" : "Inactive"} • Created:{" "}
          {new Date(form.created_at).toLocaleString()}
        </div>
      </div>

      <SubmissionsTable
        formSlug={form.slug}
        isOwner={admin.isOwner}
        applications={applications ?? []}
      />
    </div>
  );
}
