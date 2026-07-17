import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers, adminAssignRole, adminRemoveRole } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["admin", "users"], queryFn: () => adminListUsers() });

export const Route = createFileRoute("/_authenticated/admin/users")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin"><div className="bg-card border border-border p-8 text-sm">{error.message}</div></PortalShell>
  ),
  component: UsersAdmin,
});

type Role = "admin" | "doctor" | "patient";
type UserRow = { id: string; email: string; full_name: string; created_at: string; roles: string[] };
const ALL_ROLES: Role[] = ["admin", "doctor", "patient"];

function UsersAdmin() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const assign = useServerFn(adminAssignRole);
  const remove = useServerFn(adminRemoveRole);
  const [query, setQuery] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const grant = useMutation({
    mutationFn: (v: { userId: string; role: Role }) => assign({ data: v }),
    onSuccess: () => { toast.success("Role assigned"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: (v: { userId: string; role: Role }) => remove({ data: v }),
    onSuccess: () => { toast.success("Role removed"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data as UserRow[];
    return (data as UserRow[]).filter((u) =>
      u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q)
    );
  }, [data, query]);

  return (
    <PortalShell scope="admin">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="mono-label mb-2">ACCESS / USERS</div>
          <h1 className="text-2xl font-bold tracking-tight">Users & roles</h1>
          <p className="text-xs text-muted-foreground mt-1">Assign admin, doctor, or patient roles. Users must sign up first.</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email or name…"
          className="bg-background border border-border p-2 text-sm rounded-sm w-64"
        />
      </div>

      <div className="border border-border">
        <div className="hidden md:grid grid-cols-12 gap-3 p-3 bg-muted/50 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <div className="col-span-4">User</div>
          <div className="col-span-4">Current roles</div>
          <div className="col-span-4 text-right">Assign role</div>
        </div>
        {filtered.map((u) => (
          <div key={u.id} className="border-t border-border bg-card p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-4">
              <div className="text-sm font-semibold">{u.full_name || u.email.split("@")[0]}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{u.email}</div>
            </div>
            <div className="md:col-span-4 flex flex-wrap gap-1.5">
              {u.roles.length === 0 && <span className="text-[11px] text-muted-foreground">none</span>}
              {u.roles.map((r) => (
                <button
                  key={r}
                  onClick={() => confirm(`Remove role "${r}" from ${u.email}?`) && revoke.mutate({ userId: u.id, role: r as Role })}
                  className="group inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-mono border border-border px-2 py-1 rounded-sm hover:border-destructive hover:text-destructive"
                  title="Click to remove"
                >
                  {r}
                  <span className="opacity-50 group-hover:opacity-100">×</span>
                </button>
              ))}
            </div>
            <div className="md:col-span-4 md:text-right">
              <RoleAssigner
                currentRoles={u.roles}
                disabled={grant.isPending}
                onAssign={(role) => grant.mutate({ userId: u.id, role })}
              />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-8 text-sm text-muted-foreground">No users match.</div>}
      </div>
    </PortalShell>
  );
}

function RoleAssigner({ currentRoles, disabled, onAssign }: { currentRoles: string[]; disabled: boolean; onAssign: (r: Role) => void }) {
  const available = ALL_ROLES.filter((r) => !currentRoles.includes(r));
  const [value, setValue] = useState<Role | "">("");
  if (available.length === 0) return <span className="text-[11px] text-muted-foreground">all roles assigned</span>;
  return (
    <div className="inline-flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value as Role)}
        className="bg-background border border-border p-1.5 text-xs rounded-sm"
      >
        <option value="">Select role…</option>
        {available.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <button
        disabled={!value || disabled}
        onClick={() => { if (value) { onAssign(value); setValue(""); } }}
        className="text-[10px] font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-sm disabled:opacity-40"
      >
        ADD
      </button>
    </div>
  );
}
