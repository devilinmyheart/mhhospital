import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListDoctors, adminLinkDoctorUser, adminCreateDoctor, adminToggleDoctor, adminDeleteDoctor, adminListDepartments } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { useState } from "react";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["admin", "doctors"], queryFn: () => adminListDoctors() });
const deptQO = queryOptions({ queryKey: ["admin", "departments"], queryFn: () => adminListDepartments() });

export const Route = createFileRoute("/_authenticated/admin/doctors")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(qo),
    context.queryClient.ensureQueryData(deptQO),
  ]),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin">
      <div className="bg-card border border-border p-8 text-sm">{error.message}</div>
    </PortalShell>
  ),
  component: AdminDoctors,
});

function AdminDoctors() {
  const { data } = useSuspenseQuery(qo);
  const { data: depts } = useSuspenseQuery(deptQO);
  const qc = useQueryClient();
  const link = useServerFn(adminLinkDoctorUser);
  const create = useServerFn(adminCreateDoctor);
  const toggle = useServerFn(adminToggleDoctor);
  const del = useServerFn(adminDeleteDoctor);
  const [linking, setLinking] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ full_name: "", title: "", department_id: "", bio: "" });
  const inv = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const mut = useMutation({
    mutationFn: (doctorId: string) => link({ data: { doctorId, userEmail: email } }),
    onSuccess: () => { toast.success("Linked"); setLinking(null); setEmail(""); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const createMut = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => { toast.success("Doctor added"); setShowCreate(false); setForm({ full_name: "", title: "", department_id: "", bio: "" }); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (v: { doctorId: string; isActive: boolean }) => toggle({ data: v }),
    onSuccess: () => inv(),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PortalShell scope="admin">
      <div className="mb-6 flex items-center justify-between animate-enter">
        <div>
          <div className="mono-label mb-2">DIRECTORY / DOCTORS</div>
          <h1 className="text-2xl font-bold tracking-tight">Doctors</h1>
        </div>
        <button onClick={() => setShowCreate((s) => !s)} className="text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-sm">
          {showCreate ? "CLOSE" : "+ NEW DOCTOR"}
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 bg-card border border-border p-4 grid gap-3 md:grid-cols-2">
          <label className="block"><div className="mono-label mb-1">Full name</div><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full bg-background border border-border p-2 text-sm rounded-sm" /></label>
          <label className="block"><div className="mono-label mb-1">Title</div><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-background border border-border p-2 text-sm rounded-sm" /></label>
          <label className="block"><div className="mono-label mb-1">Department</div>
            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full bg-background border border-border p-2 text-sm rounded-sm">
              <option value="">Select…</option>
              {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="block md:col-span-2"><div className="mono-label mb-1">Bio</div><textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full bg-background border border-border p-2 text-sm rounded-sm" /></label>
          <div className="md:col-span-2 flex justify-end">
            <button disabled={createMut.isPending || !form.full_name || !form.title || !form.department_id} onClick={() => createMut.mutate()} className="text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-sm disabled:opacity-50">
              {createMut.isPending ? "..." : "CREATE"}
            </button>
          </div>
        </div>
      )}

      <div className="border border-border">
        {data.map((d: any) => (
          <div key={d.id} className="border-b border-border last:border-b-0 bg-card p-4">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4">
                <div className="text-sm font-semibold">{d.full_name}</div>
                <div className="text-[11px] text-muted-foreground">{d.title}</div>
              </div>
              <div className="col-span-3 text-xs">{d.departments?.name}</div>
              <div className="col-span-2">
                <button
                  onClick={() => toggleMut.mutate({ doctorId: d.id, isActive: !d.is_active })}
                  className={`text-[10px] font-mono px-2 py-1 rounded uppercase ${d.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {d.is_active ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
              <div className="col-span-3 text-right space-x-2">
                {d.user_id ? (
                  <span className="mono-label">LINKED</span>
                ) : (
                  <button
                    onClick={() => setLinking(linking === d.id ? null : d.id)}
                    className="text-[11px] font-semibold border border-border px-3 py-1.5 rounded-sm hover:bg-accent"
                  >
                    LINK USER
                  </button>
                )}
                <button
                  onClick={() => confirm(`Delete ${d.full_name}?`) && delMut.mutate(d.id)}
                  className="text-[11px] font-semibold border border-destructive text-destructive px-3 py-1.5 rounded-sm hover:bg-destructive/10"
                >
                  DEL
                </button>
              </div>
            </div>
            {linking === d.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-background border border-border p-2 text-xs rounded-sm"
                />
                <button
                  disabled={mut.isPending || !email}
                  onClick={() => mut.mutate(d.id)}
                  className="text-[11px] font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-sm disabled:opacity-50"
                >
                  {mut.isPending ? "..." : "SAVE"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
