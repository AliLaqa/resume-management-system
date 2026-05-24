"use client";

import { useRouter } from "next/navigation";

export function RefreshButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="h-9 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 hover:bg-zinc-50"
    >
      Refresh
    </button>
  );
}

