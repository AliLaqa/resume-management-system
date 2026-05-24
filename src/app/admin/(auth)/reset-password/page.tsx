import Link from "next/link";

import { ResetPasswordForm } from "@/app/admin/(auth)/reset-password/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Set New Password</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Choose a new password for your admin account.
          </p>

          <ResetPasswordForm />

          <div className="mt-4 text-sm">
            <Link href="/admin/login" className="text-zinc-900 underline">
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

