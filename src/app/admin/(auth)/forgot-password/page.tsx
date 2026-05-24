import Link from "next/link";

import { requestPasswordReset } from "@/app/admin/(auth)/forgot-password/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Reset Password</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Enter your email to receive a password reset link.
          </p>

          {error ? (
            <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <form action={requestPasswordReset} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              className="mt-1 h-12 rounded-md bg-zinc-900 px-5 text-sm font-medium text-white"
            >
              Send reset link
            </button>
          </form>

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

