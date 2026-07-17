import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverPublic() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listDepartments = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data, error } = await sb
    .from("departments")
    .select("id, name, slug, description, code")
    .order("code");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listDoctors = createServerFn({ method: "GET" })
  .inputValidator((d: { departmentId?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const sb = serverPublic();
    let q = sb
      .from("doctors")
      .select("id, full_name, title, bio, photo_url, department_id, departments(name, slug)")
      .eq("is_active", true)
      .order("full_name");
    if (data.departmentId) q = q.eq("department_id", data.departmentId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getDoctor = createServerFn({ method: "GET" })
  .inputValidator((d: { doctorId: string }) => d)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { data: doctor, error } = await sb
      .from("doctors")
      .select("id, full_name, title, bio, photo_url, department_id, departments(name, slug)")
      .eq("id", data.doctorId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doctor) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: avail } = await supabaseAdmin
      .from("doctor_availability")
      .select("weekday, start_time, end_time")
      .eq("doctor_id", data.doctorId)
      .order("weekday");
    return { ...doctor, availability: avail ?? [] };
  });

export const getDoctorAvailability = createServerFn({ method: "GET" })
  .inputValidator((d: { doctorId: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: slots }, { data: booked }] = await Promise.all([
      supabaseAdmin
        .from("doctor_availability")
        .select("weekday, start_time, end_time, break_start, break_end, slot_duration_min, max_bookings_per_slot")
        .eq("doctor_id", data.doctorId),
      supabaseAdmin.from("appointments").select("scheduled_at, duration_min").eq("doctor_id", data.doctorId).in("status", ["pending", "booked"]),
    ]);
    return { slots: slots ?? [], booked: booked ?? [] };
  });

export const listApprovedReviews = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data, error } = await sb
    .from("reviews")
    .select("id, display_name, relation, rating, quote, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw new Error(error.message);
  return data ?? [];
});

