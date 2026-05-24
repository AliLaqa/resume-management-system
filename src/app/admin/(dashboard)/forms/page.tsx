import Link from "next/link";

import { createForm } from "@/app/admin/(dashboard)/forms/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const headerColorOptions = [
  { value: "zinc", label: "Zinc" },
  { value: "blue", label: "Blue" },
  { value: "emerald", label: "Emerald" },
  { value: "rose", label: "Rose" },
  { value: "amber", label: "Amber" },
  { value: "violet", label: "Violet" },
] as const;

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: forms } = await supabase
    .from("forms")
    .select("id,slug,title,is_active,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">Forms</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Create a saved form. Slug is required and will be normalized.
        </p>

        {error ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <form action={createForm} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="slug">
              Slug (required)
            </label>
            <input
              id="slug"
              name="slug"
              required
              className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              placeholder="e.g. summer-internship-2026"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              placeholder="e.g. Summer Internship 2026"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="summary">
              Summary (optional)
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={3}
              className="rounded-md border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="header_color">
              Header color
            </label>
            <select
              id="header_color"
              name="header_color"
              className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              defaultValue="zinc"
            >
              {headerColorOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 md:mt-7">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked
              className="h-4 w-4"
            />
            <label className="text-sm" htmlFor="is_active">
              Active (publicly accessible)
            </label>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="h-12 rounded-md bg-zinc-900 px-5 text-sm font-medium text-white"
            >
              Create form
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Saved forms</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
              <tr>
                <th className="px-6 py-3">Slug</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {(forms ?? []).map((f) => (
                <tr key={f.id} className="border-t border-zinc-200">
                  <td className="px-6 py-3">
                    <Link
                      href={`/admin/forms/${encodeURIComponent(f.slug)}`}
                      className="text-zinc-900 underline"
                    >
                      {f.slug}
                    </Link>
                  </td>
                  <td className="px-6 py-3">{f.title}</td>
                  <td className="px-6 py-3">
                    {f.is_active ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {new Date(f.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!forms?.length ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-zinc-600" colSpan={4}>
                    No forms yet.
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
