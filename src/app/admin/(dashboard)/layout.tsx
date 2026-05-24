import Link from "next/link";

import { adminLogout } from "@/app/admin/(dashboard)/actions";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm font-semibold text-zinc-900">
              Resume Management System
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-zinc-700 sm:flex">
              <Link href="/admin/forms" className="hover:text-zinc-900">
                Forms
              </Link>
              <Link href="/admin/admins" className="hover:text-zinc-900">
                Admins
              </Link>
              <Link href="/admin/logs" className="hover:text-zinc-900">
                Logs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:inline">
              {admin.user.email}
              {admin.isOwner ? " (Owner)" : ""}
            </span>
            <form action={adminLogout}>
              <button
                type="submit"
                className="h-9 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 hover:bg-zinc-50"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

