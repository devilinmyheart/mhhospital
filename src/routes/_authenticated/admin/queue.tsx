import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { adminAllAppointments, adminConfirmAppointment, adminRejectAppointment } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { RejectReasonDialog } from "@/components/reject-reason-dialog";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["admin", "appointments"], queryFn: () => adminAllAppointments() });

export const Route = createFileRoute("/_authenticated/admin/queue")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin"><div className="bg-card border border-border p-8 text-sm">{error.message}</div></PortalShell>
  ),
  component: Queue,
});

function Queue() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const pending = useMemo(() => (data as any[]).filter((a) => a.status === "pending").sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)), [data]);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const confirmFn = useServerFn(adminConfirmAppointment);
  const rejectFn = useServerFn(adminRejectAppointment);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });
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
    <PortalShell scope="admin">
      <div className="mb-6">
        <div className="mono-label mb-2">APPROVAL QUEUE</div>
        <h1 className="text-2xl font-bold tracking-tight">Pending appointments</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {pending.length} appointment{pending.length === 1 ? "" : "s"} waiting for your decision.
        </p>
      </div>
      {pending.length === 0 ? (
        <div className="bg-card border border-border p-10 text-center text-sm text-muted-foreground">All caught up — no pending requests.</div>
      ) : (
        <div className="border border-border">
          {pending.map((a: any) => (
            <div key={a.id} className="border-b border-border last:border-b-0 bg-card p-4 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3">
                <div className="text-sm font-semibold">{new Date(a.scheduled_at).toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground uppercase font-mono">{a.mode}</div>
              </div>
              <div className="col-span-3 text-xs">
                <div>{a.doctors?.full_name ?? "—"}</div>
                <div className="text-muted-foreground">{a.departments?.name}</div>
              </div>
              <div className="col-span-3 text-xs text-muted-foreground line-clamp-2">{a.reason || "—"}</div>
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
