import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const adminListPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: patients } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "patient");
    const ids = (patients ?? []).map((r: any) => r.user_id);
    if (ids.length === 0) return [];
    const [{ data: profiles }, users] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", ids),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    const emailMap = new Map(users.data.users.map((u: any) => [u.id, u.email]));
    return (profiles ?? []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      email: emailMap.get(p.id) ?? "",
    })).sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
  });

export const adminListPatientReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ patientId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reports } = await supabaseAdmin
      .from("medical_reports")
      .select("id, title, category, status, uploaded_at, file_path")
      .eq("patient_id", data.patientId)
      .order("uploaded_at", { ascending: false });
    return reports ?? [];
  });

// Upload a base64-encoded file to storage and insert a medical_reports row.
export const adminUploadPatientReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      patientId: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
      category: z.string().trim().max(80).optional(),
      fileName: z.string().trim().min(1).max(200),
      contentType: z.string().trim().max(120),
      // base64 (no data-URL prefix). Client strips it.
      fileBase64: z.string().min(1).max(20_000_000),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const buf = Buffer.from(data.fileBase64, "base64");
    if (buf.byteLength > 15 * 1024 * 1024) throw new Error("File too large (max 15 MB)");
    const safeName = data.fileName.replace(/[^A-Za-z0-9._-]/g, "_");
    const path = `${data.patientId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabaseAdmin.storage.from("patient-files").upload(path, buf, {
      contentType: data.contentType,
      upsert: false,
    });
    if (upErr) throw new Error(upErr.message);
    const { error: insErr } = await supabaseAdmin.from("medical_reports").insert({
      patient_id: data.patientId,
      title: data.title,
      category: data.category ?? null,
      status: "final",
      file_path: path,
    });
    if (insErr) throw new Error(insErr.message);
    // Notify patient
    const { pushNotification } = await import("@/lib/notifications.server");
    await pushNotification([{ user_id: data.patientId, title: `New report uploaded`, body: data.title, link: "/portal/reports" }]);
    return { ok: true };
  });

export const adminDeletePatientReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ reportId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rep } = await supabaseAdmin.from("medical_reports").select("file_path").eq("id", data.reportId).maybeSingle();
    if (rep?.file_path) await supabaseAdmin.storage.from("patient-files").remove([rep.file_path]);
    await supabaseAdmin.from("medical_reports").delete().eq("id", data.reportId);
    return { ok: true };
  });

export const adminReportSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ reportId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rep } = await supabaseAdmin.from("medical_reports").select("file_path").eq("id", data.reportId).maybeSingle();
    if (!rep?.file_path) throw new Error("No file");
    const { data: signed, error } = await supabaseAdmin.storage.from("patient-files").createSignedUrl(rep.file_path, 300);
    if (error || !signed) throw new Error(error?.message ?? "Signing failed");
    return { url: signed.signedUrl };
  });
