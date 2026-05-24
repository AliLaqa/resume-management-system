import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function AdminDebugPage() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  const user = userData.user
    ? { id: userData.user.id, email: userData.user.email }
    : null;

  const notes: string[] = [];

  let adminLookupUserClient: unknown = null;
  if (user?.id) {
    const res = await supabase
      .from("admins")
      .select("user_id,is_owner")
      .eq("user_id", user.id)
      .maybeSingle();
    if (res.error?.message?.toLowerCase().includes("permission denied")) {
      notes.push(
        "Direct SELECT on `admins` is blocked (RLS). This is expected if you rely on RPCs like `is_admin`/`is_owner` for authorization.",
      );
    }
    adminLookupUserClient = {
      data: res.data,
      error: res.error
        ? {
            code: res.error.code ?? null,
            message: res.error.message ?? null,
            hint: (res.error as unknown as { hint?: string }).hint ?? null,
            details: (res.error as unknown as { details?: string }).details ?? null,
          }
        : null,
    };
  }

  let adminLookupServiceRole: unknown = null;
  if (user?.id && process.env.SUPABASE_SECRET_KEY) {
    try {
      const service = createSupabaseServiceRoleClient();
      const res = await service
        .from("admins")
        .select("user_id,is_owner")
        .eq("user_id", user.id)
        .maybeSingle();
      adminLookupServiceRole = {
        data: res.data,
        error: res.error
          ? {
              code: res.error.code ?? null,
              message: res.error.message ?? null,
              hint: (res.error as unknown as { hint?: string }).hint ?? null,
              details: (res.error as unknown as { details?: string }).details ?? null,
            }
          : null,
      };
    } catch (e) {
      adminLookupServiceRole = {
        data: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  const rpcIsAdmin = user?.id
    ? await supabase.rpc("is_admin")
    : { data: null, error: null };
  const rpcIsOwner = user?.id
    ? await supabase.rpc("is_owner")
    : { data: null, error: null };

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Admin Debug</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Dev-only diagnostics for Supabase auth + admin allowlist lookup.
          </p>
          <pre className="mt-6 whitespace-pre-wrap break-words rounded-md bg-zinc-50 p-4 text-xs text-zinc-800">
            {JSON.stringify(
              {
                user,
                userError: userError?.message ?? null,
                notes,
                adminLookupUserClient,
                adminLookupServiceRole,
                rpc: {
                  is_admin: {
                    data: rpcIsAdmin.data ?? null,
                    error: rpcIsAdmin.error?.message ?? null,
                  },
                  is_owner: {
                    data: rpcIsOwner.data ?? null,
                    error: rpcIsOwner.error?.message ?? null,
                  },
                },
              },
              null,
              2,
            )}
          </pre>
        </div>
      </main>
    </div>
  );
}
