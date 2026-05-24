import Image from "next/image";
import { notFound } from "next/navigation";

import { ApplicationForm } from "@/app/forms/[slug]/ui/application-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const headerBgByColor: Record<string, string> = {
  zinc: "bg-zinc-900",
  blue: "bg-blue-600",
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  amber: "bg-amber-600",
  violet: "bg-violet-600",
};

export default async function FormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id,slug,title,summary,logo_object_path,header_color,is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!form || !form.is_active) notFound();

  const env = getEnv();
  const headerBg = headerBgByColor[form.header_color] ?? headerBgByColor.zinc;
  const logoUrl = form.logo_object_path
    ? `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rms-logos/${form.logo_object_path}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className={`${headerBg} text-white`}>
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-6 py-8">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${form.title} logo`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-md bg-white/10 object-contain"
            />
          ) : null}
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold leading-7">{form.title}</h1>
            {form.summary ? (
              <p className="text-sm text-white/80">{form.summary}</p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <ApplicationForm slug={form.slug} />
        </div>
      </main>
    </div>
  );
}
