import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getMyReports } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal-shell";

const qo = queryOptions({ queryKey: ["portal", "reports"], queryFn: () => getMyReports() });

export const Route = createFileRoute("/_authenticated/portal/reports")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: Reports,
});

function Reports() {
  const { data } = useSuspenseQuery(qo);
  return (
    <PortalShell scope="patient">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">MEDICAL REPORTS</div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
      </div>
      {data.length === 0 && <p className="text-sm text-muted-foreground">No reports available.</p>}
      <div className="border border-border">
        {data.map((r: any) => (
          <div key={r.id} className="border-b border-border last:border-b-0 bg-card p-4 flex items-center gap-4">
            <div className="mono-label w-24 shrink-0">{new Date(r.uploaded_at).toLocaleDateString()}</div>
            <div className="flex-1 text-sm font-semibold">{r.title}</div>
            <span className="text-[10px] font-mono bg-muted px-2 py-1 rounded uppercase">{r.status}</span>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
