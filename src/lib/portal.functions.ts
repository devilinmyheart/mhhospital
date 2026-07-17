import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    return (data ?? []).map((r) => r.role);
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("id, full_name, phone, date_of_birth")
      .eq("id", context.userId)
      .maybeSingle();
    return data;
  });

export const getMyDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const nowIso = new Date().toISOString();
    const [{ data: nextAppt }, { data: rxCount }, { data: reports }] = await Promise.all([
      context.supabase
        .from("appointments")
        .select("id, scheduled_at, mode, status, doctors(full_name), departments(name)")
        .eq("patient_id", context.userId)
        .eq("status", "booked")
        .gte("scheduled_at", nowIso)
        .order("scheduled_at")
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("prescriptions")
        .select("id, refills_remaining", { count: "exact" })
        .eq("patient_id", context.userId),
      context.supabase
        .from("medical_reports")
        .select("id, title, status, uploaded_at")
        .eq("patient_id", context.userId)
        .order("uploaded_at", { ascending: false })
        .limit(3),
    ]);
    return {
      nextAppointment: nextAppt,
      prescriptionCount: (rxCount ?? []).length,
      refillsAvailable: (rxCount ?? []).filter((r) => (r.refills_remaining ?? 0) > 0).length,
      recentReports: reports ?? [],
    };
  });

export const getMyAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("appointments")
      .select("id, scheduled_at, duration_min, mode, status, reason, notes, doctors(full_name, title), departments(name)")
      .eq("patient_id", context.userId)
      .order("scheduled_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAppointmentById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { appointmentId: string }) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: appt, error } = await context.supabase
      .from("appointments")
      .select("id, scheduled_at, duration_min, mode, status, reason, notes, patient_id, doctor_id, doctors(full_name, title), departments(name)")
      .eq("id", data.appointmentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!appt) throw new Error("Appointment not found");
    // RLS lets patients or the assigned doctor read; extra defense in depth:
    if (appt.patient_id !== context.userId && appt.doctor_id) {
      const { data: doc } = await context.supabase.from("doctors").select("user_id").eq("id", appt.doctor_id).maybeSingle();
      if (!doc || doc.user_id !== context.userId) throw new Error("Forbidden");
    }
    return appt;
  });

export const getMyPrescriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("prescriptions")
      .select("id, medications, notes, refills_remaining, issued_at, doctors(full_name)")
      .eq("patient_id", context.userId)
      .order("issued_at", { ascending: false });
    return data ?? [];
  });

export const getMyReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("medical_reports")
      .select("id, title, category, status, uploaded_at, doctors(full_name)")
      .eq("patient_id", context.userId)
      .order("uploaded_at", { ascending: false });
    return data ?? [];
  });

export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { appointmentId: string }) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", data.appointmentId)
      .eq("patient_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const bookSchema = z.object({
  doctorId: z.string().uuid(),
  departmentId: z.string().uuid(),
  scheduledAt: z.string(),
  mode: z.enum(["in_person", "video"]),
  reason: z.string().max(500).optional(),
});

export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bookSchema.parse(d))
  .handler(async ({ context, data }) => {
    const when = new Date(data.scheduledAt);
    if (isNaN(when.getTime())) throw new Error("Invalid time");
    const weekday = when.getUTCDay();
    // Use local time components for comparison with time-of-day values.
    const local = new Date(when);
    const hhmm = `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`;

    const { data: rules } = await context.supabase
      .from("doctor_availability")
      .select("weekday, start_time, end_time, break_start, break_end, slot_duration_min, max_bookings_per_slot")
      .eq("doctor_id", data.doctorId)
      .eq("weekday", new Date(when.toISOString().slice(0, 10) + "T00:00:00").getDay());
    const rule = (rules ?? []).find((r: any) => {
      if (r.weekday !== new Date(data.scheduledAt).getDay()) return false;
      if (hhmm < r.start_time.slice(0, 5) || hhmm >= r.end_time.slice(0, 5)) return false;
      if (r.break_start && r.break_end && hhmm >= r.break_start.slice(0, 5) && hhmm < r.break_end.slice(0, 5)) return false;
      return true;
    });
    if (!rule) throw new Error("Selected time is outside the doctor's availability.");

    const slotStart = new Date(when);
    const slotEnd = new Date(when.getTime() + rule.slot_duration_min * 60_000);
    const { count } = await context.supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", data.doctorId)
      .eq("status", "booked")
      .gte("scheduled_at", slotStart.toISOString())
      .lt("scheduled_at", slotEnd.toISOString());
    if ((count ?? 0) >= rule.max_bookings_per_slot) {
      throw new Error("This slot is fully booked.");
    }

    const { data: appt, error } = await context.supabase
      .from("appointments")
      .insert({
        patient_id: context.userId,
        doctor_id: data.doctorId,
        department_id: data.departmentId,
        scheduled_at: data.scheduledAt,
        duration_min: rule.slot_duration_min,
        mode: data.mode,
        reason: data.reason ?? null,
        status: "booked",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: appt.id };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(1).max(120),
        phone: z.string().trim().max(30).optional().nullable(),
        date_of_birth: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
