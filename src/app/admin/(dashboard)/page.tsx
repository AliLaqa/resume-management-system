import { createSupabaseServerClient } from "@/lib/supabase/server";

import { RefreshButton } from "@/app/admin/(dashboard)/ui/refresh-button";

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

export default async function AdminDashboardHome() {
  const supabase = await createSupabaseServerClient();

  const [formsRes, appsRes, withCvRes] = await Promise.all([
    supabase.from("forms").select("id", { count: "exact", head: true }),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .not("cv_public_url", "is", null),
  ]);

  const formsCount = formsRes.count ?? 0;
  const appsCount = appsRes.count ?? 0;
  const withCvCount = withCvRes.count ?? 0;

  const percentWithCv =
    appsCount && withCvCount
      ? `${Math.round((withCvCount / appsCount) * 100)}%`
      : appsCount === 0
        ? "—"
        : "0%";

  const [exportsRes, cvDownloadsRes, adminsRes] = await Promise.all([
    supabase
      .from("admin_event_log")
      .select("id", { count: "exact", head: true })
      .in("action", ["export.csv", "export.xlsx"]),
    supabase
      .from("admin_event_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "cv.downloaded"),
    supabase.from("admins").select("user_id", { count: "exact", head: true }),
  ]);

  const exportsCount = exportsRes.count ?? 0;
  const cvDownloadsCount = cvDownloadsRes.count ?? 0;
  const adminsCount = adminsRes.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
        <RefreshButton />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Total forms created"
          value={String(formsCount ?? 0)}
        />
        <KpiCard
          label="Total applications received"
          value={String(appsCount ?? 0)}
        />
        <KpiCard label="% submissions with CV" value={percentWithCv} />
        <KpiCard
          label="Total exports generated (CSV/XLSX)"
          value={String(exportsCount ?? 0)}
        />
        <KpiCard
          label="Total CV downloads (dashboard clicks)"
          value={String(cvDownloadsCount ?? 0)}
        />
        <KpiCard label="Total admins (max 5)" value={String(adminsCount ?? 0)} />
      </div>
    </div>
  );
}
