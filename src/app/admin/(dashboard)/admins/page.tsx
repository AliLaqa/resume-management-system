import { requireAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

import { inviteAdmin, removeAdmin } from "@/app/admin/(dashboard)/admins/actions";

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: admins } = await supabase
    .from("admins")
    .select("user_id,is_owner,created_at")
    .order("is_owner", { ascending: false })
    .order("created_at", { ascending: true });

  const adminsList = admins ?? [];

  let emailsById: Record<string, string> = {};
  try {
    const service = createSupabaseServiceRoleClient();
    const lookups = await Promise.all(
      adminsList.map((a) => service.auth.admin.getUserById(a.user_id)),
    );
    emailsById = Object.fromEntries(
      lookups
        .map((r) => r.data.user)
        .filter(Boolean)
        .map((u) => [u!.id, u!.email ?? ""]),
    );
  } catch {
    // If service role is not configured, fall back to showing only user IDs.
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">Admins</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Only the owner can add/remove admins. Admin count must stay ≤ 5.
        </p>

        {error ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {ok}
          </p>
        ) : null}

        {admin.isOwner ? (
          <form action={inviteAdmin} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="email">
                Invite admin (email)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                placeholder="admin@example.com"
              />
            </div>
            <button
              type="submit"
              className="h-11 rounded-md bg-zinc-900 px-5 text-sm font-medium text-white"
            >
              Invite
            </button>
          </form>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Admin list</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminsList.map((a) => {
                const isOwner = Boolean(a.is_owner);
                const canRemove =
                  admin.isOwner && !isOwner && a.user_id !== admin.user.id;

                return (
                  <tr key={a.user_id} className="border-t border-zinc-200">
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="text-zinc-900">
                          {emailsById[a.user_id] || a.user_id}
                        </span>
                        {emailsById[a.user_id] ? (
                          <span className="text-xs text-zinc-500">{a.user_id}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {isOwner ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                          Owner
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      {canRemove ? (
                        <form action={removeAdmin}>
                          <input type="hidden" name="user_id" value={a.user_id} />
                          <button
                            type="submit"
                            className="h-9 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm text-rose-800 hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!adminsList.length ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-zinc-600" colSpan={4}>
                    No admins found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
