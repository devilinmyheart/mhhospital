import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyReports, getMyReportSignedUrl } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal-shell";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["portal", "reports"], queryFn: () => getMyReports() });

export const Route = createFileRoute("/_authenticated/portal/reports")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: Reports,
});

function Reports() {
  const { data } = useSuspenseQuery(qo);
  const signFn = useServerFn(getMyReportSignedUrl);
  async function open(id: string) {
    try {
      const { url } = await signFn({ data: { reportId: id } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) { toast.error(e.message); }
  }
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
            {r.file_path && (
              <button onClick={() => open(r.id)} className="text-[11px] font-mono uppercase border border-border px-3 py-1.5 hover:bg-accent">
                Download
              </button>
            )}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
