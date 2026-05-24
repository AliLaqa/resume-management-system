import { requireAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export default async function LogsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: logs } = await supabase
    .from("admin_event_log")
    .select("id,created_at,actor_user_id,action,entity_type,entity_id,details")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = logs ?? [];
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_user_id)));

  let emailsById: Record<string, string> = {};
  try {
    const service = createSupabaseServiceRoleClient();
    const lookups = await Promise.all(
      actorIds.map((id) => service.auth.admin.getUserById(id)),
    );
    emailsById = Object.fromEntries(
      lookups
        .map((r) => r.data.user)
        .filter(Boolean)
        .map((u) => [u!.id, u!.email ?? ""]),
    );
  } catch {
    // optional
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">Admin Logs</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Action logs only (no error logs). Showing latest 200 events.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Actor</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Entity</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-200 align-top">
                <td className="px-6 py-3 whitespace-nowrap text-xs text-zinc-600">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-col">
                    <span className="text-zinc-900">
                      {emailsById[r.actor_user_id] || r.actor_user_id}
                    </span>
                    {emailsById[r.actor_user_id] ? (
                      <span className="text-xs text-zinc-500">
                        {r.actor_user_id}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">{r.action}</td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {r.entity_type}
                  {r.entity_id ? `:${r.entity_id}` : ""}
                </td>
                <td className="px-6 py-3">
                  <pre className="max-w-[520px] whitespace-pre-wrap break-words text-xs text-zinc-600">
                    {JSON.stringify(r.details ?? {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="px-6 py-6 text-sm text-zinc-600" colSpan={5}>
                  No logs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
