import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import type { AdminLogActionType } from "@/lib/logging/actions";

export type AdminLogEntityType =
  | "form"
  | "application"
  | "admin"
  | "export"
  | "cv";

export async function logAdminEvent(params: {
  actorUserId: string;
  action: AdminLogActionType;
  entityType: AdminLogEntityType;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("admin_event_log").insert({
    actor_user_id: params.actorUserId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    details: params.details ?? {},
  });
  if (error) {
    throw new Error(`Failed to write admin log: ${error.message}`);
  }
}

