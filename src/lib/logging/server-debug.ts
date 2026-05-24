type DebugMeta = Record<string, unknown>;

function isDebugLogsEnabled() {
  const raw = (process.env.RMS_DEBUG_LOGS ?? "").trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;
  return process.env.NODE_ENV !== "production";
}

export function maskEmail(email: string) {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed ? "***" : "";

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  const localMasked =
    local.length <= 2
      ? `${local[0] ?? ""}*`
      : `${local.slice(0, 1)}***${local.slice(-1)}`;

  return `${localMasked}@${domain}`;
}

export function debugLog(scope: string, message: string, meta?: DebugMeta) {
  if (!isDebugLogsEnabled()) return;
  const payload = meta ? JSON.stringify(meta) : "";
  // eslint-disable-next-line no-console
  console.info(`[RMS][${scope}] ${message}${payload ? ` ${payload}` : ""}`);
}

export function debugWarn(scope: string, message: string, meta?: DebugMeta) {
  if (!isDebugLogsEnabled()) return;
  const payload = meta ? JSON.stringify(meta) : "";
  // eslint-disable-next-line no-console
  console.warn(`[RMS][${scope}] ${message}${payload ? ` ${payload}` : ""}`);
}

export function debugError(scope: string, message: string, meta?: DebugMeta) {
  if (!isDebugLogsEnabled()) return;
  const payload = meta ? JSON.stringify(meta) : "";
  // eslint-disable-next-line no-console
  console.error(`[RMS][${scope}] ${message}${payload ? ` ${payload}` : ""}`);
}

