import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDepartments, listDoctors, getDoctorAvailability } from "@/lib/public.functions";
import { bookAppointment } from "@/lib/portal.functions";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { useState, useMemo } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  doctor: z.string().optional(),
  mode: z.enum(["in_person", "video"]).optional(),
});

const deptQO = queryOptions({ queryKey: ["departments"], queryFn: () => listDepartments() });
const docsQO = queryOptions({ queryKey: ["doctors", "all"], queryFn: () => listDoctors({ data: {} }) });

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book an appointment — MH Hospital" },
      { name: "description", content: "Book an in-person visit or video consultation with an MH Hospital physician." },
      { property: "og:title", content: "Book an appointment — MH Hospital" },
      { property: "og:description", content: "Choose a department, doctor, and time — in person or by video." },
      { property: "og:url", content: "https://mhhospital.lovable.app/book" },
    ],
    links: [{ rel: "canonical", href: "https://mhhospital.lovable.app/book" }],
  }),
  validateSearch: searchSchema,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(deptQO);
    context.queryClient.ensureQueryData(docsQO);
  },
  component: Book,
});

function Book() {
  const { doctor: initialDoctorId, mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const { data: departments } = useSuspenseQuery(deptQO);
  const { data: doctors } = useSuspenseQuery(docsQO);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<"in_person" | "video">(initialMode ?? "in_person");
  const [departmentId, setDepartmentId] = useState<string>(() => {
    if (initialDoctorId) {
      const doc = doctors.find((d: any) => d.id === initialDoctorId);
      return doc?.department_id ?? "";
    }
    return "";
  });
  const [doctorId, setDoctorId] = useState<string>(initialDoctorId ?? "");
  const [dateStr, setDateStr] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const filteredDoctors = departmentId
    ? doctors.filter((d: any) => d.department_id === departmentId)
    : doctors;

  const availQO = queryOptions({
    queryKey: ["avail", doctorId],
    queryFn: () => getDoctorAvailability({ data: { doctorId } }),
    enabled: !!doctorId,
  } as any);
  const { data: avail } = useSuspenseQuery(
    doctorId ? availQO : { queryKey: ["avail", "none"], queryFn: async () => ({ slots: [], booked: [] }) },
  );

  const next7Days = useMemo(() => {
    const days: { iso: string; label: string; weekday: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      days.push({
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
        weekday: d.getDay(),
      });
    }
    return days;
  }, []);

  const timeSlots = useMemo(() => {
    if (!dateStr || !avail) return [];
    const d = new Date(dateStr + "T00:00:00");
    const wd = d.getDay();
    const bookedCounts = new Map<string, number>();
    for (const b of (avail as any).booked || []) {
      if (!b.scheduled_at.startsWith(dateStr)) continue;
      const key = new Date(b.scheduled_at).toTimeString().slice(0, 5);
      bookedCounts.set(key, (bookedCounts.get(key) ?? 0) + 1);
    }
    const out: string[] = [];
    for (const sl of (avail as any).slots) {
      if (sl.weekday !== wd) continue;
      const dur = sl.slot_duration_min ?? 30;
      const cap = sl.max_bookings_per_slot ?? 1;
      const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const start = toMin(sl.start_time);
      const end = toMin(sl.end_time);
      const brS = sl.break_start ? toMin(sl.break_start) : null;
      const brE = sl.break_end ? toMin(sl.break_end) : null;
      for (let cur = start; cur + dur <= end; cur += dur) {
        if (brS !== null && brE !== null && cur < brE && cur + dur > brS) continue;
        const h = String(Math.floor(cur / 60)).padStart(2, "0");
        const m = String(cur % 60).padStart(2, "0");
        const key = `${h}:${m}`;
        if ((bookedCounts.get(key) ?? 0) >= cap) continue;
        out.push(key);
      }
    }
    return Array.from(new Set(out)).sort();
  }, [dateStr, avail]);

  const bookFn = useServerFn(bookAppointment);
  const mutation = useMutation({
    mutationFn: async () => {
      const { data: sess } = await supabase.auth.getUser();
      if (!sess.user) {
        navigate({ to: "/auth", search: { next: "/book" } as any });
        throw new Error("Please sign in to book.");
      }
      const scheduledAt = new Date(`${dateStr}T${time}:00`).toISOString();
      const weekday = new Date(`${dateStr}T00:00:00`).getDay();
      return bookFn({ data: { doctorId, departmentId, scheduledAt, mode, reason: reason || undefined, weekday, localTime: time } });
    },
    onSuccess: () => {
      toast.success("Request submitted — awaiting confirmation from the clinic.");
      navigate({ to: "/portal/appointments" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const StepDot = ({ n, label }: { n: number; label: string }) => (
    <div className="flex items-center gap-2">
      <div className={`size-6 rounded-full grid place-items-center text-[11px] font-mono ${step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"}`}>{n}</div>
      <span className={`text-xs font-medium ${step >= n ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-3xl mx-auto p-4 lg:p-6">
        <div className="mb-8 animate-enter">
          <div className="mono-label mb-2">SCHEDULER / BOOK</div>
          <h1 className="text-3xl font-bold tracking-tight">Book an appointment</h1>
        </div>

        <div className="flex items-center gap-6 mb-8 border-b border-border pb-4">
          <StepDot n={1} label="Doctor" />
          <div className="h-px w-8 bg-border" />
          <StepDot n={2} label="Time" />
          <div className="h-px w-8 bg-border" />
          <StepDot n={3} label="Confirm" />
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="mono-label block mb-2">MODE</label>
              <div className="grid grid-cols-2 gap-2">
                {(["in_person", "video"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`border p-4 text-sm font-medium ${mode === m ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-accent"}`}
                  >
                    {m === "in_person" ? "In-person visit" : "Video consultation"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="book-department" className="mono-label block mb-2">DEPARTMENT</label>
              <select
                id="book-department"
                name="department"
                className="w-full bg-card border border-border p-3 text-sm rounded-sm"
                value={departmentId}
                onChange={(e) => { setDepartmentId(e.target.value); setDoctorId(""); }}
              >
                <option value="">Any department</option>
                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>

            <div>
              <label className="mono-label block mb-2">DOCTOR</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-auto border border-border p-2">
                {filteredDoctors.map((doc: any) => (
                  <button
                    key={doc.id}
                    onClick={() => { setDoctorId(doc.id); setDepartmentId(doc.department_id); }}
                    className={`text-left p-3 border ${doctorId === doc.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}
                  >
                    <div className="font-semibold text-sm">{doc.full_name}</div>
                    <div className="text-[11px] text-muted-foreground">{doc.title}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!doctorId || !departmentId}
              onClick={() => setStep(2)}
              className="w-full bg-foreground text-background py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-30"
            >
              NEXT: SELECT TIME
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="mono-label block mb-2">DATE</label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {next7Days.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => { setDateStr(d.iso); setTime(""); }}
                    className={`p-2 text-xs border ${dateStr === d.iso ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {dateStr && (
              <div>
                <label className="mono-label block mb-2">TIME</label>
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No slots available for this date.</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {timeSlots.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`p-2 text-xs font-mono border ${time === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 border border-border py-3 text-sm font-semibold hover:bg-accent">← BACK</button>
              <button
                disabled={!time}
                onClick={() => setStep(3)}
                className="flex-1 bg-foreground text-background py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-30"
              >
                NEXT: CONFIRM
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-card border border-border p-6">
              <div className="mono-label mb-4">APPOINTMENT_SUMMARY</div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="mono-label mb-1">Doctor</dt><dd className="font-semibold">{doctors.find((d: any) => d.id === doctorId)?.full_name}</dd></div>
                <div><dt className="mono-label mb-1">Department</dt><dd className="font-semibold">{departments.find((d) => d.id === departmentId)?.name}</dd></div>
                <div><dt className="mono-label mb-1">Date</dt><dd className="font-semibold">{dateStr}</dd></div>
                <div><dt className="mono-label mb-1">Time</dt><dd className="font-semibold font-mono">{time}</dd></div>
                <div><dt className="mono-label mb-1">Mode</dt><dd className="font-semibold">{mode === "video" ? "Video consultation" : "In-person"}</dd></div>
              </dl>
            </div>

            <div>
              <label htmlFor="book-reason" className="mono-label block mb-2">REASON (OPTIONAL)</label>
              <textarea
                id="book-reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                rows={3}
                className="w-full bg-card border border-border p-3 text-sm rounded-sm"
                placeholder="Brief description of symptoms or reason for visit"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 border border-border py-3 text-sm font-semibold hover:bg-accent">← BACK</button>
              <button
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
                className="flex-1 bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {mutation.isPending ? "BOOKING..." : "CONFIRM BOOKING"}
              </button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
