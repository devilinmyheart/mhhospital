import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminAllAppointments, adminUpdateAppointment } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["admin", "appointments"], queryFn: () => adminAllAppointments() });

export const Route = createFileRoute("/_authenticated/admin/appointments")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin"><div className="bg-card border border-border p-8 text-sm">{error.message}</div></PortalShell>
  ),
  component: ApptsAdmin,
});

function ApptsAdmin() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const upd = useServerFn(adminUpdateAppointment);
  const mut = useMutation({
    mutationFn: (v: { id: string; status: "booked" | "completed" | "cancelled" }) => upd({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "appointments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PortalShell scope="admin">
      <div className="mb-6">
        <div className="mono-label mb-2">OPERATIONS / APPOINTMENTS</div>
        <h1 className="text-2xl font-bold tracking-tight">All appointments</h1>
      </div>
      <div className="border border-border">
        {data.map((a: any) => (
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
            <div className="col-span-1">
              <span className={`text-[10px] font-mono px-2 py-1 rounded uppercase ${
                a.status === "completed" ? "bg-success/10 text-success" :
                a.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                "bg-primary/10 text-primary"
              }`}>{a.status}</span>
            </div>
            <div className="col-span-2 text-right">
              <select
                value={a.status}
                onChange={(e) => mut.mutate({ id: a.id, status: e.target.value as any })}
                className="text-[11px] bg-background border border-border p-1.5 rounded-sm"
              >
                <option value="booked">booked</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="p-8 text-sm text-muted-foreground">No appointments.</div>}
      </div>
    </PortalShell>
  );
}
