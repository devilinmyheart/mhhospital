import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListHospitals, adminUpsertHospital, adminDeleteHospital } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { useState } from "react";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["admin", "hospitals"], queryFn: () => adminListHospitals() });

export const Route = createFileRoute("/_authenticated/admin/hospitals")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin"><div className="bg-card border border-border p-8 text-sm">{error.message}</div></PortalShell>
  ),
  component: HospitalsAdmin,
});

type Hospital = {
  id: string; name: string; slug: string | null; address: string | null; city: string | null;
  state: string | null; postal_code: string | null; phone: string | null; email: string | null;
  emergency_phone: string | null; image_url: string | null; description: string | null; is_active: boolean;
};

const blank: Partial<Hospital> = {
  name: "", slug: "", address: "", city: "", state: "", postal_code: "",
  phone: "", email: "", emergency_phone: "", image_url: "", description: "", is_active: true,
};

function HospitalsAdmin() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertHospital);
  const del = useServerFn(adminDeleteHospital);
  const [editing, setEditing] = useState<Partial<Hospital> | null>(null);

  const save = useMutation({
    mutationFn: (d: Partial<Hospital>) => upsert({ data: d as any }),
    onSuccess: () => { toast.success("Saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "hospitals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "hospitals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PortalShell scope="admin">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="mono-label mb-2">NETWORK / HOSPITALS</div>
          <h1 className="text-2xl font-bold tracking-tight">Hospitals</h1>
        </div>
        <button onClick={() => setEditing(blank)} className="text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-sm">+ NEW HOSPITAL</button>
      </div>

      {editing && (
        <div className="mb-6 bg-card border border-border p-4 grid gap-3 md:grid-cols-2">
          <Field label="Name *" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
          <Field label="Slug (URL id)" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
          <Field label="Address" value={editing.address ?? ""} onChange={(v) => setEditing({ ...editing, address: v })} />
          <Field label="City" value={editing.city ?? ""} onChange={(v) => setEditing({ ...editing, city: v })} />
          <Field label="State" value={editing.state ?? ""} onChange={(v) => setEditing({ ...editing, state: v })} />
          <Field label="Postal code" value={editing.postal_code ?? ""} onChange={(v) => setEditing({ ...editing, postal_code: v })} />
          <Field label="Phone" value={editing.phone ?? ""} onChange={(v) => setEditing({ ...editing, phone: v })} />
          <Field label="Email" value={editing.email ?? ""} onChange={(v) => setEditing({ ...editing, email: v })} />
          <Field label="Emergency line" value={editing.emergency_phone ?? ""} onChange={(v) => setEditing({ ...editing, emergency_phone: v })} />
          <Field label="Image URL" value={editing.image_url ?? ""} onChange={(v) => setEditing({ ...editing, image_url: v })} />
          <label className="md:col-span-2 block">
            <div className="mono-label mb-1">Description</div>
            <textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className="w-full bg-background border border-border p-2 text-sm rounded-sm" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
            <span className="text-xs">Active (visible to public)</span>
          </label>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className="text-[11px] px-3 py-2 border border-border rounded-sm">CANCEL</button>
            <button disabled={save.isPending || !editing.name} onClick={() => save.mutate(editing)} className="text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-sm disabled:opacity-50">
              {save.isPending ? "..." : "SAVE"}
            </button>
          </div>
        </div>
      )}

      <div className="border border-border">
        {data.map((h: Hospital) => (
          <div key={h.id} className="border-b border-border last:border-b-0 bg-card p-4 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-4">
              <div className="text-sm font-semibold flex items-center gap-2">
                {h.name}
                {!h.is_active && <span className="text-[10px] px-1.5 py-0.5 border border-border rounded-sm text-muted-foreground">INACTIVE</span>}
              </div>
              <div className="text-[11px] text-muted-foreground">{h.city ?? "—"}{h.state ? `, ${h.state}` : ""}</div>
            </div>
            <div className="col-span-4 text-xs text-muted-foreground">{h.address ?? "—"}</div>
            <div className="col-span-2 text-xs font-mono">{h.phone ?? h.emergency_phone ?? "—"}</div>
            <div className="col-span-2 text-right space-x-2">
              <button onClick={() => setEditing(h)} className="text-[11px] font-semibold border border-border px-3 py-1.5 rounded-sm hover:bg-accent">EDIT</button>
              <button onClick={() => confirm(`Delete ${h.name}?`) && remove.mutate(h.id)} className="text-[11px] font-semibold border border-destructive text-destructive px-3 py-1.5 rounded-sm hover:bg-destructive/10">DEL</button>
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="p-8 text-sm text-muted-foreground">No hospitals yet.</div>}
      </div>
    </PortalShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="mono-label mb-1">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border p-2 text-sm rounded-sm" />
    </label>
  );
}
