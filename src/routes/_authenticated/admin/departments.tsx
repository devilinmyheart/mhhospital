import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListDepartments, adminUpsertDepartment, adminDeleteDepartment } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { useState } from "react";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["admin", "departments"], queryFn: () => adminListDepartments() });

export const Route = createFileRoute("/_authenticated/admin/departments")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin"><div className="bg-card border border-border p-8 text-sm">{error.message}</div></PortalShell>
  ),
  component: DepartmentsAdmin,
});

type Dept = { id: string; name: string; slug: string; code: string; description: string };
const blank = { name: "", slug: "", code: "", description: "" };

function DepartmentsAdmin() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertDepartment);
  const del = useServerFn(adminDeleteDepartment);
  const [editing, setEditing] = useState<Partial<Dept> | null>(null);

  const save = useMutation({
    mutationFn: (d: Partial<Dept>) => upsert({ data: d as any }),
    onSuccess: () => { toast.success("Saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "departments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "departments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PortalShell scope="admin">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mono-label mb-2">DIRECTORY / DEPARTMENTS</div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
        </div>
        <button onClick={() => setEditing(blank)} className="text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-sm">+ NEW DEPARTMENT</button>
      </div>

      {editing && (
        <div className="mb-6 bg-card border border-border p-4 grid gap-3 md:grid-cols-2">
          <Input label="Name" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
          <Input label="Slug" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
          <Input label="Code" value={editing.code ?? ""} onChange={(v) => setEditing({ ...editing, code: v })} />
          <Input label="Description" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} />
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className="text-[11px] px-3 py-2 border border-border rounded-sm">CANCEL</button>
            <button disabled={save.isPending} onClick={() => save.mutate(editing)} className="text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-sm disabled:opacity-50">
              {save.isPending ? "..." : "SAVE"}
            </button>
          </div>
        </div>
      )}

      <div className="border border-border">
        {data.map((d: Dept) => (
          <div key={d.id} className="border-b border-border last:border-b-0 bg-card p-4 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-4">
              <div className="text-sm font-semibold">{d.name}</div>
              <div className="text-[11px] text-muted-foreground">/{d.slug} · {d.code}</div>
            </div>
            <div className="col-span-6 text-xs text-muted-foreground line-clamp-2">{d.description}</div>
            <div className="col-span-2 text-right space-x-2">
              <button onClick={() => setEditing(d)} className="text-[11px] font-semibold border border-border px-3 py-1.5 rounded-sm hover:bg-accent">EDIT</button>
              <button onClick={() => confirm(`Delete ${d.name}?`) && remove.mutate(d.id)} className="text-[11px] font-semibold border border-destructive text-destructive px-3 py-1.5 rounded-sm hover:bg-destructive/10">DEL</button>
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="p-8 text-sm text-muted-foreground">No departments yet.</div>}
      </div>
    </PortalShell>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="mono-label mb-1">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border p-2 text-sm rounded-sm" />
    </label>
  );
}
