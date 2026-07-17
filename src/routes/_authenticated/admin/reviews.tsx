import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListReviews, adminSetReviewApproval, adminDeleteReview } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["admin", "reviews"], queryFn: () => adminListReviews() });

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin"><div className="bg-card border border-border p-8 text-sm">{error.message}</div></PortalShell>
  ),
  component: ReviewsAdmin,
});

function ReviewsAdmin() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const setAppr = useServerFn(adminSetReviewApproval);
  const del = useServerFn(adminDeleteReview);
  const inv = () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
  const appr = useMutation({ mutationFn: (v: { id: string; approved: boolean }) => setAppr({ data: v }), onSuccess: () => { toast.success("Updated"); inv(); }, onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); inv(); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <PortalShell scope="admin">
      <div className="mb-6">
        <div className="mono-label mb-2">COMMUNITY / REVIEWS</div>
        <h1 className="text-2xl font-bold tracking-tight">Patient reviews</h1>
      </div>
      <div className="grid gap-3">
        {data.map((r: any) => (
          <div key={r.id} className="bg-card border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{r.display_name}</span>
                  {r.relation && <span className="text-[11px] text-muted-foreground">· {r.relation}</span>}
                  <span className="text-[11px] font-mono">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${r.approved ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {r.approved ? "APPROVED" : "PENDING"}
                  </span>
                </div>
                <p className="text-sm">{r.quote}</p>
                <div className="text-[11px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => appr.mutate({ id: r.id, approved: !r.approved })} className="text-[11px] font-semibold border border-border px-3 py-1.5 rounded-sm hover:bg-accent">
                  {r.approved ? "UNAPPROVE" : "APPROVE"}
                </button>
                <button onClick={() => confirm("Delete review?") && remove.mutate(r.id)} className="text-[11px] font-semibold border border-destructive text-destructive px-3 py-1.5 rounded-sm hover:bg-destructive/10">DEL</button>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="p-8 text-sm text-muted-foreground bg-card border border-border">No reviews yet.</div>}
      </div>
    </PortalShell>
  );
}
