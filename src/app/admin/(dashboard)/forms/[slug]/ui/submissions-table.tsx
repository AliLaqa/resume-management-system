"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ApplicationRow = {
  id: string;
  created_at: string;
  name: string;
  cnic: string;
  degree: string;
  specialization: string;
  years_experience: number;
  previous_organization: string;
  remarks: string | null;
  cv_public_url: string | null;
  cv_original_filename: string | null;
};

async function downloadFromResponse(res: Response, filenameFallback: string) {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cd = res.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/i.exec(cd);
  a.download = match?.[1] ?? filenameFallback;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatSubmittedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

export function SubmissionsTable(props: {
  formSlug: string;
  isOwner: boolean;
  applications: ApplicationRow[];
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected],
  );

  const allSelected = props.applications.length > 0 && selectedIds.length === props.applications.length;

  function toggleAll() {
    if (allSelected) {
      setSelected({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const row of props.applications) next[row.id] = true;
    setSelected(next);
  }

  async function exportSelected(format: "csv" | "xlsx") {
    setError(null);
    setMessage(null);
    if (!selectedIds.length) {
      setError("Select at least one submission to export.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/admin/forms/${encodeURIComponent(props.formSlug)}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, format }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Export failed.");
        return;
      }
      const filename = `applications-${props.formSlug}.${format}`;
      await downloadFromResponse(res, filename);
      setMessage(`Exported ${selectedIds.length} submissions.`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    setError(null);
    setMessage(null);
    if (!selectedIds.length) {
      setError("Select at least one submission to delete.");
      return;
    }
    const ok = confirm(
      `Delete ${selectedIds.length} submission(s)? This will also delete their CV files.`,
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/admin/forms/${encodeURIComponent(props.formSlug)}/delete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Delete failed.");
        return;
      }
      setMessage(`Deleted ${selectedIds.length} submission(s).`);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Submissions</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Select rows to export as CSV/XLSX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => exportSelected("csv")}
            className="h-9 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => exportSelected("xlsx")}
            className="h-9 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            Export XLSX
          </button>
          {props.isOwner ? (
            <button
              type="button"
              disabled={busy}
              onClick={deleteSelected}
              className="h-9 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm text-rose-800 hover:bg-rose-100 disabled:opacity-50"
            >
              Delete selected
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-6 py-3">Submitted</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">CNIC</th>
              <th className="px-6 py-3">Degree</th>
              <th className="px-6 py-3">Specialization</th>
              <th className="px-6 py-3">Experience</th>
              <th className="px-6 py-3">Previous Org</th>
              <th className="px-6 py-3">Remarks</th>
              <th className="px-6 py-3">CV Attach</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {props.applications.map((r) => (
              <tr key={r.id} className="border-t border-zinc-200 align-top">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[r.id])}
                    onChange={(e) =>
                      setSelected((prev) => ({ ...prev, [r.id]: e.target.checked }))
                    }
                    aria-label={`Select ${r.name}`}
                  />
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-xs text-zinc-600">
                  {formatSubmittedAt(r.created_at)}
                </td>
                <td className="px-6 py-3">{r.name}</td>
                <td className="px-6 py-3">{r.cnic}</td>
                <td className="px-6 py-3">{r.degree}</td>
                <td className="px-6 py-3">{r.specialization}</td>
                <td className="px-6 py-3">{r.years_experience}</td>
                <td className="px-6 py-3">{r.previous_organization}</td>
                <td className="px-6 py-3">{r.remarks ?? ""}</td>
                <td className="px-6 py-3">
                  {r.cv_public_url ? (
                    <a
                      href={`/admin/cv?applicationId=${encodeURIComponent(r.id)}`}
                      target="_blank"
                      className="text-zinc-900 underline"
                      rel="noreferrer"
                    >
                      {r.cv_original_filename ?? "CV"}
                    </a>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/forms/${encodeURIComponent(props.formSlug)}/applications/${encodeURIComponent(r.id)}`}
                      className="text-zinc-900 underline"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!props.applications.length ? (
              <tr>
                <td className="px-6 py-6 text-sm text-zinc-600" colSpan={11}>
                  No submissions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
