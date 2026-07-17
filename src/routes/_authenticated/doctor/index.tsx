import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getDoctorDashboard } from "@/lib/doctor.functions";
import { PortalShell } from "@/components/portal-shell";

const qo = queryOptions({ queryKey: ["doctor", "dashboard"], queryFn: () => getDoctorDashboard() });

export const Route = createFileRoute("/_authenticated/doctor/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: DoctorHome,
});

function DoctorHome() {
  const { data } = useSuspenseQuery(qo);
  if (!data.doctorId) {
    return (
      <PortalShell scope="doctor">
        <div className="bg-card border border-border p-8 text-sm">
          <div className="mono-label mb-2">ACCESS</div>
          <p>You are not linked to a doctor record. Ask an administrator to link your account.</p>
        </div>
      </PortalShell>
    );
  }
  return (
    <PortalShell scope="doctor">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">TODAY</div>
        <h1 className="text-2xl font-bold tracking-tight">Today's schedule</h1>
      </div>
      {data.today.length === 0 ? (
        <p className="text-sm text-muted-foreground">No appointments today.</p>
      ) : (
        <div className="border border-border mb-8">
          {data.today.map((a: any) => (
            <div key={a.id} className="border-b border-border last:border-b-0 bg-card p-4 flex items-center gap-4">
              <div className="font-mono text-sm w-24">{new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              <div className="mono-label">{a.mode === "video" ? "VIDEO" : "IN-PERSON"}</div>
              <div className="flex-1 text-sm">{a.reason || "—"}</div>
              <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-1 rounded uppercase">{a.status}</span>
            </div>
          ))}
        </div>
      )}
      <h2 className="mono-label mb-3">UPCOMING</h2>
      <div className="border border-border">
        {data.upcoming.map((a: any) => (
          <div key={a.id} className="border-b border-border last:border-b-0 bg-card p-4 flex items-center gap-4">
            <div className="font-mono text-xs w-40">{new Date(a.scheduled_at).toLocaleString()}</div>
            <div className="mono-label">{a.mode === "video" ? "VIDEO" : "IN-PERSON"}</div>
            <span className="ml-auto text-[10px] font-mono bg-muted px-2 py-1 rounded uppercase">{a.status}</span>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
