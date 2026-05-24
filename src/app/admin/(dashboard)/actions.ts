"use server";

import { redirect } from "next/navigation";

import { debugLog, debugWarn } from "@/lib/logging/server-debug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function adminLogout() {
  const supabase = await createSupabaseServerClient();
  debugLog("adminLogout", "start");
  const { error } = await supabase.auth.signOut();
  if (error) {
    debugWarn("adminLogout", "signOut_failed", { error: error.message });
  } else {
    debugLog("adminLogout", "success");
  }
  redirect("/admin/login");
}
