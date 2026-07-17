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
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin">
      <div className="bg-card border border-border p-8 text-sm">{error.message}</div>
    </PortalShell>
  ),
  component: AdminDoctors,
});

function AdminDoctors() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const link = useServerFn(adminLinkDoctorUser);
  const [linking, setLinking] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const mut = useMutation({
    mutationFn: (doctorId: string) => link({ data: { doctorId, userEmail: email } }),
    onSuccess: () => { toast.success("Linked"); setLinking(null); setEmail(""); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PortalShell scope="admin">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">DIRECTORY / DOCTORS</div>
        <h1 className="text-2xl font-bold tracking-tight">Doctors</h1>
      </div>
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
                <span className={`text-[10px] font-mono px-2 py-1 rounded uppercase ${d.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {d.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div className="col-span-3 text-right">
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
