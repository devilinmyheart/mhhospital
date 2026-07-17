import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { adminOverview } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";

const qo = queryOptions({ queryKey: ["admin", "overview"], queryFn: () => adminOverview() });

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin">
      <div className="bg-card border border-border p-8 text-sm">
        <div className="mono-label mb-2">ACCESS</div>
        <p>{error.message}</p>
      </div>
    </PortalShell>
  ),
  component: AdminHome,
});

function AdminHome() {
  const { data } = useSuspenseQuery(qo);
  const stats = [
    { k: "DEPARTMENTS", v: data.departments },
    { k: "DOCTORS", v: data.doctors },
    { k: "ACTIVE", v: data.activeDoctors },
    { k: "APPTS TOTAL", v: data.appointments },
    { k: "APPTS TODAY", v: data.appointmentsToday },
  ];
  return (
    <PortalShell scope="admin">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">OVERVIEW</div>
        <h1 className="text-2xl font-bold tracking-tight">Hospital operations</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border border-border">
        {stats.map((s) => (
          <div key={s.k} className="bg-card p-5">
            <div className="mono-label mb-2">{s.k}</div>
            <div className="text-3xl font-bold">{s.v}</div>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
