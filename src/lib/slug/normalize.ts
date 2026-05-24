export function normalizeSlug(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      // Replace spaces/underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Remove invalid URL path chars (keep a-z, 0-9, hyphen)
      .replace(/[^a-z0-9-]/g, "")
      // Collapse multiple hyphens
      .replace(/-+/g, "-")
      // Trim hyphens
      .replace(/^-|-$/g, "")
  );
}

