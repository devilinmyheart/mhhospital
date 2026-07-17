import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function myDoctorId(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.from("doctors").select("id").eq("user_id", context.userId).maybeSingle();
  return data?.id as string | undefined;
}

export const getDoctorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const doctorId = await myDoctorId(context);
    if (!doctorId) return { doctorId: null, today: [], upcoming: [] };
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const [{ data: today }, { data: upcoming }] = await Promise.all([
      context.supabase
        .from("appointments")
        .select("id, scheduled_at, mode, status, reason")
        .eq("doctor_id", doctorId)
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString())
        .order("scheduled_at"),
      context.supabase
        .from("appointments")
        .select("id, scheduled_at, mode, status")
        .eq("doctor_id", doctorId)
        .eq("status", "booked")
        .gt("scheduled_at", endOfDay.toISOString())
        .order("scheduled_at")
        .limit(20),
    ]);
    return { doctorId, today: today ?? [], upcoming: upcoming ?? [] };
  });

export const getDoctorAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const doctorId = await myDoctorId(context);
    if (!doctorId) return [];
    const { data } = await context.supabase
      .from("appointments")
      .select("id, scheduled_at, mode, status, reason, notes, patient_id")
      .eq("doctor_id", doctorId)
      .order("scheduled_at", { ascending: false });
    return data ?? [];
  });

export const markAppointmentCompleted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ appointmentId: z.string().uuid(), notes: z.string().max(2000).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const doctorId = await myDoctorId(context);
    if (!doctorId) throw new Error("Not a doctor");
    const { error } = await context.supabase
      .from("appointments")
      .update({ status: "completed", notes: data.notes ?? null })
      .eq("id", data.appointmentId)
      .eq("doctor_id", doctorId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const doctorConfirmAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const doctorId = await myDoctorId(context);
    if (!doctorId) throw new Error("Not a doctor");
    const { error } = await context.supabase
      .from("appointments")
      .update({ status: "booked" })
      .eq("id", data.appointmentId)
      .eq("doctor_id", doctorId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const doctorRejectAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const doctorId = await myDoctorId(context);
    if (!doctorId) throw new Error("Not a doctor");
    const { error } = await context.supabase
      .from("appointments")
      .update({ status: "rejected" })
      .eq("id", data.appointmentId)
      .eq("doctor_id", doctorId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const rxSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  medications: z.array(z.object({ name: z.string().min(1), dosage: z.string().min(1), frequency: z.string().min(1) })).min(1),
  notes: z.string().max(2000).optional(),
  refills: z.number().int().min(0).max(12).default(0),
});

export const issuePrescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rxSchema.parse(d))
  .handler(async ({ context, data }) => {
    const doctorId = await myDoctorId(context);
    if (!doctorId) throw new Error("Not a doctor");
    const { error } = await context.supabase.from("prescriptions").insert({
      appointment_id: data.appointmentId,
      patient_id: data.patientId,
      doctor_id: doctorId,
      medications: data.medications,
      notes: data.notes ?? null,
      refills_remaining: data.refills,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const doctorId = await myDoctorId(context);
    if (!doctorId) return [];
    const { data } = await context.supabase
      .from("doctor_availability")
      .select("id, weekday, start_time, end_time, break_start, break_end, slot_duration_min, max_bookings_per_slot")
      .eq("doctor_id", doctorId)
      .order("weekday");
    return data ?? [];
  });

const availabilitySlotSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  break_start: z.string().nullable().optional(),
  break_end: z.string().nullable().optional(),
  slot_duration_min: z.number().int().min(5).max(240).default(30),
  max_bookings_per_slot: z.number().int().min(1).max(20).default(1),
});

export const setMyAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ slots: z.array(availabilitySlotSchema) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const doctorId = await myDoctorId(context);
    if (!doctorId) throw new Error("Not a doctor");
    await context.supabase.from("doctor_availability").delete().eq("doctor_id", doctorId);
    if (data.slots.length) {
      const rows = data.slots.map((s) => ({
        doctor_id: doctorId,
        weekday: s.weekday,
        start_time: s.start_time,
        end_time: s.end_time,
        break_start: s.break_start || null,
        break_end: s.break_end || null,
        slot_duration_min: s.slot_duration_min,
        max_bookings_per_slot: s.max_bookings_per_slot,
      }));
      const { error } = await context.supabase.from("doctor_availability").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
