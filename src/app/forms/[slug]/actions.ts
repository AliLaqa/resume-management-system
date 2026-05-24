"use server";

import { applicationCreateSchema } from "@/lib/validation/application";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { sanitizeFilename } from "@/lib/storage/sanitize-filename";
import { normalizeSlug } from "@/lib/slug/normalize";

export type SubmitApplicationState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function submitApplication(
  slug: string,
  _prevState: SubmitApplicationState | undefined,
  formData: FormData,
): Promise<SubmitApplicationState> {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return { ok: false, message: "Invalid form link." };
  }

  const raw = {
    name: formData.get("name"),
    cnic: formData.get("cnic"),
    degree: formData.get("degree"),
    specialization: formData.get("specialization"),
    years_experience: formData.get("years_experience"),
    previous_organization: formData.get("previous_organization"),
    remarks: formData.get("remarks"),
  };

  const parsed = applicationCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const cvFile = formData.get("cv");
  const file =
    cvFile instanceof File && cvFile.size > 0 ? (cvFile as File) : null;
  if (!file) {
    return {
      ok: false,
      message: "Please attach your CV (PDF, DOC, or DOCX).",
      fieldErrors: { cv: ["CV is required."] },
    };
  }

  const mime = file.type || "";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const allowed =
    mime === "application/pdf" ||
    mime === "application/msword" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "pdf" ||
    ext === "doc" ||
    ext === "docx";

  if (!allowed) {
    return {
      ok: false,
      message: "Only PDF, DOC, or DOCX files are allowed.",
      fieldErrors: { cv: ["Invalid file type."] },
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: formRow, error: formError } = await supabase
    .from("forms")
    .select("id,is_active")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (formError || !formRow || !formRow.is_active) {
    return { ok: false, message: "This form is not available right now." };
  }

  const applicationId = crypto.randomUUID();
  const safeName = sanitizeFilename(file.name);
  const objectPath = `applications/${applicationId}/${safeName}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadRes = await supabase.storage
    .from("rms-cv")
    .upload(objectPath, bytes, {
      contentType: mime || undefined,
      upsert: false,
    });

  if (uploadRes.error) {
    return { ok: false, message: `Upload failed: ${uploadRes.error.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from("rms-cv")
    .getPublicUrl(objectPath);

  const insertRes = await supabase.from("applications").insert({
    id: applicationId,
    form_id: formRow.id,
    name: parsed.data.name,
    cnic: parsed.data.cnic,
    degree: parsed.data.degree,
    specialization: parsed.data.specialization,
    years_experience: parsed.data.years_experience,
    previous_organization: parsed.data.previous_organization,
    remarks: parsed.data.remarks ?? null,
    cv_object_path: objectPath,
    cv_public_url: publicUrlData.publicUrl,
    cv_original_filename: file.name,
    cv_mime_type: mime || null,
    cv_size_bytes: file.size,
  });

  if (insertRes.error) {
    // Best-effort cleanup: delete uploaded file if DB insert fails.
    await supabase.storage.from("rms-cv").remove([objectPath]);
    return { ok: false, message: `Submission failed: ${insertRes.error.message}` };
  }

  return {
    ok: true,
    message: "Application submitted successfully.",
  };
}
