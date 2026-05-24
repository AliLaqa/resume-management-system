import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { removeFormLogo, updateForm } from "@/app/admin/(dashboard)/forms/[slug]/edit/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/env";

const headerColorOptions = [
  { value: "zinc", label: "Zinc" },
  { value: "blue", label: "Blue" },
  { value: "emerald", label: "Emerald" },
  { value: "rose", label: "Rose" },
  { value: "amber", label: "Amber" },
  { value: "violet", label: "Violet" },
] as const;

export default async function FormEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: form } = await supabase
    .from("forms")
    .select("id,slug,title,summary,logo_object_path,header_color,is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!form) notFound();

  const env = getEnv();
  const logoUrl = form.logo_object_path
    ? `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rms-logos/${form.logo_object_path}`
    : null;

  const action = updateForm.bind(null, form.slug);
  const removeLogoAction = removeFormLogo.bind(null, form.slug);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Edit Form</h1>
          <p className="mt-1 text-sm text-zinc-600">
            <span className="font-medium text-zinc-900">{form.slug}</span>
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
        {error ? (
          <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              defaultValue={form.title}
              className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="summary">
              Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={3}
              defaultValue={form.summary ?? ""}
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
              defaultValue={form.header_color}
              className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
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
              defaultChecked={form.is_active}
              className="h-4 w-4"
            />
            <label className="text-sm" htmlFor="is_active">
              Active (publicly accessible)
            </label>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="logo">
              Logo (optional)
            </label>
            {logoUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={logoUrl}
                    alt="Current logo"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-md border border-zinc-200 object-contain"
                  />
                  <button
                    type="submit"
                    formAction={removeLogoAction}
                    formNoValidate
                    aria-label="Remove logo"
                    className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm text-zinc-700 shadow-sm hover:bg-zinc-50"
                    title="Remove logo"
                  >
                    ×
                  </button>
                </div>
                <span className="text-xs text-zinc-500">
                  Uploading a new logo will replace the current one.
                </span>
              </div>
            ) : (
              <span className="text-xs text-zinc-500">No logo uploaded.</span>
            )}
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/*"
              className="h-11 rounded-md border border-zinc-200 px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="h-12 rounded-md bg-zinc-900 px-5 text-sm font-medium text-white"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
