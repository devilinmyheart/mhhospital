import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getDoctorAppointments, doctorConfirmAppointment, doctorRejectAppointment } from "@/lib/doctor.functions";
import { PortalShell } from "@/components/portal-shell";
import { RejectReasonDialog } from "@/components/reject-reason-dialog";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["doctor", "appts"], queryFn: () => getDoctorAppointments() });

export const Route = createFileRoute("/_authenticated/doctor/queue")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: Queue,
});

function Queue() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const pending = useMemo(() => (data as any[]).filter((a) => a.status === "pending").sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)), [data]);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const confirmFn = useServerFn(doctorConfirmAppointment);
  const rejectFn = useServerFn(doctorRejectAppointment);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["doctor"] });
  const confirmMut = useMutation({
    mutationFn: (id: string) => confirmFn({ data: { appointmentId: id } }),
    onSuccess: () => { toast.success("Confirmed"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rejectMut = useMutation({
    mutationFn: (v: { id: string; reason: string }) => rejectFn({ data: { appointmentId: v.id, reason: v.reason } }),
    onSuccess: () => { toast.success("Rejected"); invalidate(); setRejectTarget(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PortalShell scope="doctor">
      <div className="mb-6">
        <div className="mono-label mb-2">APPROVAL QUEUE</div>
        <h1 className="text-2xl font-bold tracking-tight">Pending appointments</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {pending.length} request{pending.length === 1 ? "" : "s"} awaiting your decision.
        </p>
      </div>
      {pending.length === 0 ? (
        <div className="bg-card border border-border p-10 text-center text-sm text-muted-foreground">Nothing pending.</div>
      ) : (
        <div className="border border-border">
          {pending.map((a: any) => (
            <div key={a.id} className="border-b border-border last:border-b-0 bg-card p-4 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3 font-mono text-xs">{new Date(a.scheduled_at).toLocaleString()}</div>
              <div className="col-span-1 mono-label">{a.mode === "video" ? "VIDEO" : "IN-PERSON"}</div>
              <div className="col-span-5 text-sm text-muted-foreground">{a.reason || "—"}</div>
              <div className="col-span-3 flex justify-end gap-2 flex-wrap">
                <button
                  disabled={confirmMut.isPending}
                  onClick={() => confirmMut.mutate(a.id)}
                  className="bg-primary text-primary-foreground text-[11px] font-mono uppercase px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setRejectTarget(a)}
                  className="border border-emergency/40 text-emergency text-[11px] font-mono uppercase px-3 py-1.5 hover:bg-emergency/10"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <RejectReasonDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        pending={rejectMut.isPending}
        onConfirm={(reason) => rejectTarget && rejectMut.mutate({ id: rejectTarget.id, reason })}
      />
    </PortalShell>
  );
}
