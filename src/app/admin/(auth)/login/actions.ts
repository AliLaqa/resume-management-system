"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { debugLog, debugWarn, maskEmail } from "@/lib/logging/server-debug";

export async function adminLogin(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  debugLog("adminLogin", "attempt", {
    email: maskEmail(email),
    hasPassword: Boolean(password),
  });

  if (!email || !password) {
    debugWarn("adminLogin", "missing_credentials", { email: maskEmail(email) });
    redirect("/admin/login?error=Missing%20email%20or%20password");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    debugWarn("adminLogin", "failed", { email: maskEmail(email), error: error.message });
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  debugLog("adminLogin", "success", { email: maskEmail(email) });
  redirect("/admin");
}
