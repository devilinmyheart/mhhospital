import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { adminAllAppointments, adminUpdateAppointment, adminConfirmAppointment, adminRejectAppointment } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { RejectReasonDialog } from "@/components/reject-reason-dialog";
import { toast } from "sonner";


const qo = queryOptions({ queryKey: ["admin", "appointments"], queryFn: () => adminAllAppointments() });

export const Route = createFileRoute("/_authenticated/admin/appointments")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin"><div className="bg-card border border-border p-8 text-sm">{error.message}</div></PortalShell>
  ),
  component: ApptsAdmin,
});

const FILTERS = ["pending", "booked", "completed", "cancelled", "rejected", "all"] as const;
type Filter = typeof FILTERS[number];

function ApptsAdmin() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const upd = useServerFn(adminUpdateAppointment);
  const confirmFn = useServerFn(adminConfirmAppointment);
  const rejectFn = useServerFn(adminRejectAppointment);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "appointments"] });
  const mut = useMutation({
    mutationFn: (v: { id: string; status: "pending" | "booked" | "completed" | "cancelled" | "rejected" }) => upd({ data: v }),
    onSuccess: () => { toast.success("Updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const confirmMut = useMutation({
    mutationFn: (id: string) => confirmFn({ data: { appointmentId: id } }),
    onSuccess: () => { toast.success("Appointment confirmed"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rejectMut = useMutation({
    mutationFn: (v: { id: string; reason: string }) => rejectFn({ data: { appointmentId: v.id, reason: v.reason } }),
    onSuccess: () => { toast.success("Appointment rejected"); invalidate(); setRejectTarget(null); },
    onError: (e: Error) => toast.error(e.message),
  });


  const filtered = useMemo(
    () => (filter === "all" ? data : data.filter((a: any) => a.status === filter)),
    [data, filter],
  );
  const pendingCount = useMemo(() => data.filter((a: any) => a.status === "pending").length, [data]);

  return (
    <PortalShell scope="admin">
      <div className="mb-6">
        <div className="mono-label mb-2">OPERATIONS / APPOINTMENTS</div>
        <h1 className="text-2xl font-bold tracking-tight">All appointments</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11px] font-mono uppercase px-3 py-1.5 border ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
          >
            {f}{f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="border border-border">
        {filtered.map((a: any) => (
          <div key={a.id} className="border-b border-border last:border-b-0 bg-card p-4 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-3">
              <div className="text-sm font-semibold">{new Date(a.scheduled_at).toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground uppercase font-mono">{a.mode}</div>
            </div>
            <div className="col-span-3 text-xs">
              <div>{a.doctors?.full_name ?? "—"}</div>
              <div className="text-muted-foreground">{a.departments?.name}</div>
            </div>
            <div className="col-span-2 text-xs text-muted-foreground line-clamp-2">{a.reason || "—"}</div>
            <div className="col-span-1">
              <span className={`text-[10px] font-mono px-2 py-1 rounded uppercase ${
                a.status === "completed" ? "bg-success/10 text-success" :
                a.status === "cancelled" || a.status === "rejected" ? "bg-destructive/10 text-destructive" :
                a.status === "pending" ? "bg-warning/10 text-warning" :
                "bg-primary/10 text-primary"
              }`}>{a.status}</span>
            </div>
            <div className="col-span-3 text-right flex justify-end gap-2 flex-wrap">
              {a.status === "pending" && (
                <>
                  <button
                    disabled={confirmMut.isPending}
                    onClick={() => confirmMut.mutate(a.id)}
                    className="bg-primary text-primary-foreground text-[11px] font-mono uppercase px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setRejectTarget(a)}
                    className="border border-emergency/40 text-emergency text-[11px] font-mono uppercase px-3 py-1.5 hover:bg-emergency/10 disabled:opacity-50"
                  >
                    Reject
                  </button>

                </>
              )}
              <select
                value={a.status}
                onChange={(e) => mut.mutate({ id: a.id, status: e.target.value as any })}
                className="text-[11px] bg-background border border-border p-1.5 rounded-sm"
              >
                <option value="pending">pending</option>
                <option value="booked">booked</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-8 text-sm text-muted-foreground">No appointments.</div>}
      </div>
    </PortalShell>
  );
}
