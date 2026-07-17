import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListMessages, adminUpdateMessageStatus, adminDeleteMessage } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["admin", "messages"], queryFn: () => adminListMessages() });

export const Route = createFileRoute("/_authenticated/admin/messages")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin"><div className="bg-card border border-border p-8 text-sm">{error.message}</div></PortalShell>
  ),
  component: MessagesAdmin,
});

function MessagesAdmin() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const setStatus = useServerFn(adminUpdateMessageStatus);
  const del = useServerFn(adminDeleteMessage);
  const inv = () => qc.invalidateQueries({ queryKey: ["admin", "messages"] });
  const upd = useMutation({ mutationFn: (v: { id: string; status: "new" | "read" | "resolved" }) => setStatus({ data: v }), onSuccess: () => { toast.success("Updated"); inv(); }, onError: (e: Error) => toast.error(e.message) });
  const rm = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); inv(); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <PortalShell scope="admin">
      <div className="mb-6">
        <div className="mono-label mb-2">INBOX / CONTACT MESSAGES</div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
      </div>
      <div className="grid gap-3">
        {data.map((m: any) => (
          <div key={m.id} className="bg-card border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{m.name}</span>
                  <a href={`mailto:${m.email}`} className="text-[11px] text-primary">{m.email}</a>
                  {m.phone && <a href={`tel:${m.phone}`} className="text-[11px] text-muted-foreground">· {m.phone}</a>}
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                    m.status === "resolved" ? "bg-success/10 text-success" :
                    m.status === "read" ? "bg-muted text-muted-foreground" :
                    "bg-primary/10 text-primary"
                  }`}>{m.status}</span>
                </div>
                <div className="text-xs font-semibold mb-1">{m.subject}</div>
                <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                <div className="text-[11px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <select value={m.status} onChange={(e) => upd.mutate({ id: m.id, status: e.target.value as any })} className="text-[11px] bg-background border border-border p-1.5 rounded-sm">
                  <option value="new">new</option>
                  <option value="read">read</option>
                  <option value="resolved">resolved</option>
                </select>
                <button onClick={() => confirm("Delete message?") && rm.mutate(m.id)} className="text-[11px] font-semibold border border-destructive text-destructive px-3 py-1.5 rounded-sm hover:bg-destructive/10">DEL</button>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="p-8 text-sm text-muted-foreground bg-card border border-border">No messages.</div>}
      </div>
    </PortalShell>
  );
}
