import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getMyDashboard } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal-shell";

const qo = queryOptions({ queryKey: ["portal", "dashboard"], queryFn: () => getMyDashboard() });

export const Route = createFileRoute("/_authenticated/portal/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: Overview,
});

function Overview() {
  const { data } = useSuspenseQuery(qo);
  const next: any = data.nextAppointment;

  return (
    <PortalShell scope="patient">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">OVERVIEW</div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border mb-6">
        <div className="bg-card p-5">
          <div className="mono-label mb-2">NEXT APPOINTMENT</div>
          {next ? (
            <>
              <div className="font-semibold">{next.doctors?.full_name}</div>
              <div className="text-xs text-muted-foreground">{next.departments?.name}</div>
              <div className="font-mono text-sm mt-2">{new Date(next.scheduled_at).toLocaleString()}</div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">None scheduled.</div>
          )}
        </div>
        <div className="bg-card p-5">
          <div className="mono-label mb-2">PRESCRIPTIONS</div>
          <div className="text-3xl font-bold">{data.prescriptionCount}</div>
          <div className="text-xs text-muted-foreground mt-1">{data.refillsAvailable} refill(s) available</div>
        </div>
        <div className="bg-card p-5">
          <div className="mono-label mb-2">RECENT REPORTS</div>
          <div className="text-3xl font-bold">{data.recentReports.length}</div>
          <div className="text-xs text-muted-foreground mt-1">latest medical documents</div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/book" className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold rounded-sm">BOOK NEW APPOINTMENT</Link>
        <Link to="/portal/appointments" className="border border-border px-4 py-2 text-sm font-semibold rounded-sm hover:bg-accent">View all appointments</Link>
      </div>
    </PortalShell>
  );
}
