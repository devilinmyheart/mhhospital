import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [d, doctors, appts] = await Promise.all([
      context.supabase.from("departments").select("id"),
      context.supabase.from("doctors").select("id, is_active"),
      context.supabase.from("appointments").select("id, status, scheduled_at"),
    ]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      departments: (d.data ?? []).length,
      doctors: (doctors.data ?? []).length,
      activeDoctors: (doctors.data ?? []).filter((x: any) => x.is_active).length,
      appointments: (appts.data ?? []).length,
      appointmentsToday: (appts.data ?? []).filter((a: any) => new Date(a.scheduled_at) >= today && new Date(a.scheduled_at) < new Date(today.getTime() + 86400000)).length,
    };
  });

export const adminListDoctors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("doctors")
      .select("id, full_name, title, is_active, department_id, user_id, departments(name)")
      .order("full_name");
    return data ?? [];
  });

const createDoctorSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(120),
  department_id: z.string().uuid(),
  bio: z.string().max(2000).optional(),
});

export const adminCreateDoctor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createDoctorSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("doctors").insert({ ...data, is_active: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminLinkDoctorUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ doctorId: z.string().uuid(), userEmail: z.string().email() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // find user by email
    const { data: usersPage, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersErr) throw new Error(usersErr.message);
    const user = usersPage.users.find((u) => u.email?.toLowerCase() === data.userEmail.toLowerCase());
    if (!user) throw new Error("User not found — they must sign up first.");
    await supabaseAdmin.from("doctors").update({ user_id: user.id }).eq("id", data.doctorId);
    await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role: "doctor" }, { onConflict: "user_id,role" });
    return { ok: true };
  });

export const adminGrantAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userEmail: z.string().email() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = usersPage?.users.find((u) => u.email?.toLowerCase() === data.userEmail.toLowerCase());
    if (!user) throw new Error("User not found");
    await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
    return { ok: true };
  });

export const adminToggleDoctor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ doctorId: z.string().uuid(), isActive: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await context.supabase.from("doctors").update({ is_active: data.isActive }).eq("id", data.doctorId);
    return { ok: true };
  });

export const adminAllAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("appointments")
      .select("id, scheduled_at, mode, status, reason, doctors(full_name), departments(name)")
      .order("scheduled_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

const availabilityRowSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  break_start: z.string().nullable().optional(),
  break_end: z.string().nullable().optional(),
  slot_duration_min: z.number().int().min(5).max(240).default(30),
  max_bookings_per_slot: z.number().int().min(1).max(20).default(1),
});

export const adminGetDoctorAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ doctorId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: doctor } = await context.supabase
      .from("doctors")
      .select("id, full_name, title, departments(name)")
      .eq("id", data.doctorId)
      .maybeSingle();
    const { data: slots } = await context.supabase
      .from("doctor_availability")
      .select("id, weekday, start_time, end_time, break_start, break_end, slot_duration_min, max_bookings_per_slot")
      .eq("doctor_id", data.doctorId)
      .order("weekday");
    return { doctor, slots: slots ?? [] };
  });

export const adminSetDoctorAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ doctorId: z.string().uuid(), slots: z.array(availabilityRowSchema) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await context.supabase.from("doctor_availability").delete().eq("doctor_id", data.doctorId);
    if (data.slots.length) {
      const rows = data.slots.map((s) => ({
        doctor_id: data.doctorId,
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
