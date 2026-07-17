import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getMyPrescriptions } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal-shell";

const qo = queryOptions({ queryKey: ["portal", "rx"], queryFn: () => getMyPrescriptions() });

export const Route = createFileRoute("/_authenticated/portal/prescriptions")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: Rx,
});

function Rx() {
  const { data } = useSuspenseQuery(qo);
  return (
    <PortalShell scope="patient">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">PRESCRIPTIONS</div>
        <h1 className="text-2xl font-bold tracking-tight">Prescriptions</h1>
      </div>
      {data.length === 0 && <p className="text-sm text-muted-foreground">No prescriptions.</p>}
      <div className="space-y-3">
        {data.map((r: any) => (
          <div key={r.id} className="bg-card border border-border p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="mono-label">{new Date(r.issued_at).toLocaleDateString()}</div>
                <div className="text-sm font-semibold mt-1">Issued by {r.doctors?.full_name}</div>
              </div>
              <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {r.refills_remaining ?? 0} REFILLS
              </span>
            </div>
            <ul className="mt-3 text-sm space-y-1">
              {(r.medications ?? []).map((m: any, i: number) => (
                <li key={i} className="font-mono text-xs">
                  • {m.name} — {m.dosage} — {m.frequency}
                </li>
              ))}
            </ul>
            {r.notes && <p className="text-xs text-muted-foreground mt-3">{r.notes}</p>}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
