"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ResetPasswordForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("This reset link is invalid or expired. Please request a new one.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage("Password updated. You can now sign in.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return <p className="text-sm text-zinc-600">Loading...</p>;
  }

  if (!hasSession) {
    return (
      <p className="text-sm text-rose-700">
        This reset link is invalid or expired. Please request a new one.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-1 h-12 rounded-md bg-zinc-900 px-5 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Update password"}
      </button>
    </form>
  );
}

