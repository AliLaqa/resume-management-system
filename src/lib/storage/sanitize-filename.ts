export function sanitizeFilename(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "file";

  // Remove any path segments and control characters.
  const base = trimmed
    .split(/[/\\\\]+/g)
    .pop()!
    .replace(/[\u0000-\u001F\u007F]/g, "");

  // Keep a conservative set of characters for object keys.
  const cleaned = base.replace(/[^a-zA-Z0-9._ -]/g, "").trim();
  if (!cleaned) return "file";

  return cleaned;
}

