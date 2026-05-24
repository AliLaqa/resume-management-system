import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50">
      <main className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Resume Management System
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Public job application forms live at <span className="font-medium">/forms/&lt;slug&gt;</span>. Admins manage forms, submissions, exports, and logs from the dashboard.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white"
          >
            Admin Login
          </Link>
          <Link
            href="/admin"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
