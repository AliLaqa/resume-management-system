import { NextResponse } from "next/server";

import { z } from "zod";

import { requireAdminForRoute } from "@/lib/auth/admin-route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminLogAction } from "@/lib/logging/actions";
import { logAdminEvent } from "@/lib/logging/log-admin-event";
import { toCsv } from "@/lib/export/csv";
import { toXlsxBuffer } from "@/lib/export/xlsx";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  format: z.enum(["csv", "xlsx"]),
});

export async function POST(
  request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const auth = await requireAdminForRoute();
  if (!auth.ok) return auth.response;

  const { slug } = await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id,slug,title")
    .eq("slug", slug)
    .maybeSingle();

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  const { data: rows, error } = await supabase
    .from("applications")
    .select(
      "id,created_at,name,cnic,degree,specialization,years_experience,previous_organization,remarks,cv_public_url",
    )
    .eq("form_id", form.id)
    .in("id", parsed.data.ids)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ordered = rows ?? [];

  const headers = [
    "Sno",
    "Name",
    "CNIC",
    "Degree",
    "Area of Specialization",
    "Years of Experience",
    "Notable Previous Organization",
    "Remarks",
    "CV Attach",
  ];

  const formattedRows = ordered.map((r, idx) => ({
    Sno: idx + 1,
    Name: r.name,
    CNIC: r.cnic,
    Degree: r.degree,
    Specialization: r.specialization,
    Years: r.years_experience,
    PreviousOrg: r.previous_organization,
    Remarks: r.remarks ?? "",
    Cv: r.cv_public_url ?? "",
  }));

  if (parsed.data.format === "csv") {
    const csvRows: string[][] = [
      headers,
      ...formattedRows.map((r) => [
        String(r.Sno),
        String(r.Name ?? ""),
        String(r.CNIC ?? ""),
        String(r.Degree ?? ""),
        String(r.Specialization ?? ""),
        String(r.Years ?? ""),
        String(r.PreviousOrg ?? ""),
        String(r.Remarks ?? ""),
        String(r.Cv ?? ""),
      ]),
    ];

    const csv = toCsv(csvRows);

    await logAdminEvent({
      actorUserId: auth.user.id,
      action: AdminLogAction.ExportCsv,
      entityType: "export",
      entityId: form.id,
      details: { formId: form.id, formSlug: form.slug, count: ordered.length },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="applications-${form.slug}.csv"`,
      },
    });
  }

  const xlsx = await toXlsxBuffer({
    sheetName: "Applications",
    columns: [
      { header: "Sno", key: "Sno", width: 8 },
      { header: "Name", key: "Name", width: 26 },
      { header: "CNIC", key: "CNIC", width: 18 },
      { header: "Degree", key: "Degree", width: 22 },
      { header: "Area of Specialization", key: "Specialization", width: 26 },
      { header: "Years of Experience", key: "Years", width: 20 },
      { header: "Notable Previous Organization", key: "PreviousOrg", width: 28 },
      { header: "Remarks", key: "Remarks", width: 26 },
      { header: "CV Attach", key: "Cv", width: 40 },
    ],
    rows: formattedRows.map((r) => ({
      Sno: r.Sno,
      Name: r.Name,
      CNIC: r.CNIC,
      Degree: r.Degree,
      Specialization: r.Specialization,
      Years: r.Years,
      PreviousOrg: r.PreviousOrg,
      Remarks: r.Remarks,
      Cv: r.Cv,
    })),
  });

  await logAdminEvent({
    actorUserId: auth.user.id,
    action: AdminLogAction.ExportXlsx,
    entityType: "export",
    entityId: form.id,
    details: { formId: form.id, formSlug: form.slug, count: ordered.length },
  });

  return new NextResponse(xlsx, {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="applications-${form.slug}.xlsx"`,
    },
  });
}
