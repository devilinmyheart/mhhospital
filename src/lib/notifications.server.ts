// Server-only helper. Never import from client code.
export async function pushNotification(rows: { user_id: string; title: string; body?: string; link?: string }[]) {
  if (rows.length === 0) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("notifications").insert(rows.map((r) => ({
    user_id: r.user_id,
    title: r.title,
    body: r.body ?? null,
    link: r.link ?? null,
  })));
}

export async function getAdminUserIds(): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
  return (data ?? []).map((r: any) => r.user_id);
}

export function appointmentNumber(id: string, scheduledAtIso: string): string {
  const d = new Date(scheduledAtIso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const suffix = id.replace(/-/g, "").slice(-4).toUpperCase();
  return `MH-${yyyy}${mm}${dd}-${hh}${mi}-${suffix}`;
}
