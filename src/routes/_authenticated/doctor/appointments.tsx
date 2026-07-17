import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDoctorAppointments, markAppointmentCompleted } from "@/lib/doctor.functions";
import { PortalShell } from "@/components/portal-shell";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["doctor", "appts"], queryFn: () => getDoctorAppointments() });

export const Route = createFileRoute("/_authenticated/doctor/appointments")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: DocAppts,
});

function DocAppts() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const complete = useServerFn(markAppointmentCompleted);
  const mut = useMutation({
    mutationFn: (appointmentId: string) => complete({ data: { appointmentId } }),
    onSuccess: () => { toast.success("Marked completed"); qc.invalidateQueries({ queryKey: ["doctor"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PortalShell scope="doctor">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">APPOINTMENTS</div>
        <h1 className="text-2xl font-bold tracking-tight">All appointments</h1>
      </div>
      <div className="border border-border">
        {data.map((a: any) => (
          <div key={a.id} className="border-b border-border last:border-b-0 bg-card p-4 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-3 font-mono text-xs">{new Date(a.scheduled_at).toLocaleString()}</div>
            <div className="col-span-1 mono-label">{a.mode === "video" ? "VIDEO" : "IN-PERSON"}</div>
            <div className="col-span-4 text-sm text-muted-foreground">{a.reason || "—"}</div>
            <div className="col-span-2">
              <span className="text-[10px] font-mono bg-muted px-2 py-1 rounded uppercase">{a.status}</span>
            </div>
            <div className="col-span-2 text-right">
              {a.status === "booked" && (
                <button
                  onClick={() => mut.mutate(a.id)}
                  disabled={mut.isPending}
                  className="text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-sm hover:opacity-90"
                >
                  COMPLETE
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
