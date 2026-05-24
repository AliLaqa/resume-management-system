import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Access Denied</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Your account is not authorized to access the admin dashboard.
          </p>
          <div className="mt-6 text-sm">
            <Link href="/admin/login" className="text-zinc-900 underline">
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

