import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getMyAppointments } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal-shell";

const qo = queryOptions({ queryKey: ["portal", "appointments"], queryFn: () => getMyAppointments() });

export const Route = createFileRoute("/_authenticated/portal/appointments")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: Appts,
});

const statusColors: Record<string, string> = {
  booked: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-emergency/10 text-emergency",
};

function Appts() {
  const { data } = useSuspenseQuery(qo);
  return (
    <PortalShell scope="patient">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">APPOINTMENTS</div>
        <h1 className="text-2xl font-bold tracking-tight">All appointments</h1>
      </div>

      {data.length === 0 && <p className="text-sm text-muted-foreground">No appointments yet.</p>}

      <div className="border border-border">
        {data.map((a: any) => (
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
                {a.status}
              </span>
            </div>
            <div className="col-span-1 text-right text-[11px] text-muted-foreground">{a.duration_min}min</div>
            {a.mode === "video" && a.status === "booked" && (
              <div className="col-span-12 pt-2 flex justify-end">
                <Link
                  to="/portal/consultation/$appointmentId"
                  params={{ appointmentId: a.id }}
                  className="bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-mono uppercase hover:opacity-90"
                >
                  Join video visit →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
