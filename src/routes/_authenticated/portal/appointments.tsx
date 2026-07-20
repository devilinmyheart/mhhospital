import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getMyAppointments, cancelAppointment, rescheduleAppointment } from "@/lib/portal.functions";
import { getDoctorAvailability } from "@/lib/public.functions";
import { PortalShell } from "@/components/portal-shell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["portal", "appointments"], queryFn: () => getMyAppointments() });

export const Route = createFileRoute("/_authenticated/portal/appointments")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: Appts,
});

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border border-warning/30",
  booked: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-emergency/10 text-emergency",
  no_show: "bg-emergency/10 text-emergency",
};

function Appts() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<any>(null);

  const cancelFn = useServerFn(cancelAppointment);
  const cancelMut = useMutation({
    mutationFn: (appointmentId: string) => cancelFn({ data: { appointmentId } }),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      qc.invalidateQueries({ queryKey: ["portal"] });
      setCancelTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PortalShell scope="patient">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">APPOINTMENTS</div>
        <h1 className="text-2xl font-bold tracking-tight">All appointments</h1>
      </div>

      {data.length === 0 && <p className="text-sm text-muted-foreground">No appointments yet.</p>}

      <div className="border border-border">
        {data.map((a: any) => {
          const active = a.status === "booked" || a.status === "pending";
          const upcoming = active && new Date(a.scheduled_at).getTime() > Date.now();
          return (
            <div key={a.id} className="border-b border-border last:border-b-0 bg-card p-4 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3 font-mono text-xs">{new Date(a.scheduled_at).toLocaleString()}</div>
              <div className="col-span-3">
                <div className="text-sm font-semibold">{a.doctors?.full_name}</div>
                <div className="text-[11px] text-muted-foreground">{a.doctors?.title}</div>
              </div>
              <div className="col-span-2 text-xs">{a.departments?.name}</div>
              <div className="col-span-1 mono-label">{a.mode === "video" ? "VIDEO" : "IN-PERSON"}</div>
              <div className="col-span-2">
                <span className={`text-[10px] font-mono px-2 py-1 rounded uppercase ${statusColors[a.status] ?? "bg-muted"}`}>
                  {a.status === "pending" ? "AWAITING APPROVAL" : a.status}
                </span>
              </div>
              <div className="col-span-1 text-right text-[11px] text-muted-foreground">{a.duration_min}min</div>
              {a.status === "rejected" && a.rejection_reason && (
                <div className="col-span-12 text-[11px] bg-emergency/10 border border-emergency/30 text-emergency p-2 rounded">
                  <span className="font-mono uppercase mr-2">Reason:</span>{a.rejection_reason}
                </div>
              )}


              {upcoming && (
                <div className="col-span-12 pt-2 flex flex-wrap justify-end gap-2">
                  {a.mode === "video" && a.status === "booked" && (
                    <>
                      <Link
                        to="/portal/consultation/$appointmentId"
                        params={{ appointmentId: a.id }}
                        search={{ session: a.session_token }}
                        className="bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-mono uppercase hover:opacity-90"
                      >
                        Join video visit →
                      </Link>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/portal/consultation/${a.id}?session=${a.session_token}`;
                          navigator.clipboard.writeText(url).then(
                            () => toast.success("Session link copied"),
                            () => toast.error("Unable to copy link"),
                          );
                        }}
                        className="border border-border px-3 py-1.5 text-[11px] font-mono uppercase hover:bg-accent"
                      >
                        Copy session link
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setRescheduleTarget(a)}
                    className="border border-border px-3 py-1.5 text-[11px] font-mono uppercase hover:bg-accent"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => setCancelTarget(a)}
                    className="border border-emergency/40 text-emergency px-3 py-1.5 text-[11px] font-mono uppercase hover:bg-emergency/10"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget && (
                <>
                  With {cancelTarget.doctors?.full_name} on{" "}
                  {new Date(cancelTarget.scheduled_at).toLocaleString()}. This cannot be undone — you'll need to book again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMut.isPending}>Keep appointment</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelMut.isPending}
              onClick={() => cancelTarget && cancelMut.mutate(cancelTarget.id)}
              className="bg-emergency text-emergency-foreground hover:bg-emergency/90"
            >
              {cancelMut.isPending ? "Cancelling…" : "Cancel appointment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {rescheduleTarget && (
        <RescheduleDialog
          appt={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["portal"] });
            setRescheduleTarget(null);
          }}
        />
      )}
    </PortalShell>
  );
}

function RescheduleDialog({ appt, onClose, onDone }: { appt: any; onClose: () => void; onDone: () => void }) {
  const [dateStr, setDateStr] = useState("");
  const [time, setTime] = useState("");

  const availQuery = useQuery({
    queryKey: ["doctor-availability", appt.doctor_id],
    queryFn: () => getDoctorAvailability({ data: { doctorId: appt.doctor_id } }),
  });

  const next7Days = useMemo(() => {
    const days: { iso: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      days.push({
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      });
    }
    return days;
  }, []);

  const timeSlots = useMemo(() => {
    const avail: any = availQuery.data;
    if (!dateStr || !avail) return [];
    const d = new Date(dateStr + "T00:00:00");
    const wd = d.getDay();
    const bookedCounts = new Map<string, number>();
    for (const b of avail.booked || []) {
      if (!b.scheduled_at.startsWith(dateStr)) continue;
      // Don't count the appointment being rescheduled against its own slot
      if (b.scheduled_at === appt.scheduled_at && b.duration_min === appt.duration_min) continue;
      const key = new Date(b.scheduled_at).toTimeString().slice(0, 5);
      bookedCounts.set(key, (bookedCounts.get(key) ?? 0) + 1);
    }
    const out: string[] = [];
    for (const sl of avail.slots) {
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
        // Must be in the future
        const slotTime = new Date(`${dateStr}T${key}:00`).getTime();
        if (slotTime <= Date.now() + 60 * 60 * 1000) continue;
        out.push(key);
      }
    }
    return Array.from(new Set(out)).sort();
  }, [dateStr, availQuery.data, appt.scheduled_at, appt.duration_min]);

  const rescheduleFn = useServerFn(rescheduleAppointment);
  const mut = useMutation({
    mutationFn: () => {
      const scheduledAt = new Date(`${dateStr}T${time}:00`).toISOString();
      const weekday = new Date(`${dateStr}T00:00:00`).getDay();
      return rescheduleFn({ data: { appointmentId: appt.id, scheduledAt, weekday, localTime: time } });
    },
    onSuccess: () => {
      toast.success("Appointment rescheduled");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground font-mono">
            {appt.doctors?.full_name} · currently {new Date(appt.scheduled_at).toLocaleString()}
          </div>

          <div>
            <label className="mono-label block mb-2">DATE</label>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {next7Days.map((d) => (
                <button
                  key={d.iso}
                  onClick={() => { setDateStr(d.iso); setTime(""); }}
                  className={`p-2 text-[11px] border ${dateStr === d.iso ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {dateStr && (
            <div>
              <label className="mono-label block mb-2">TIME</label>
              {availQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : timeSlots.length === 0 ? (
                <p className="text-xs text-muted-foreground">No slots available for this date.</p>
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
        </div>
        <DialogFooter>
          <button onClick={onClose} className="border border-border px-4 py-2 text-sm">Cancel</button>
          <button
            disabled={!time || mut.isPending}
            onClick={() => mut.mutate()}
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {mut.isPending ? "Rescheduling…" : "Confirm new time"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
