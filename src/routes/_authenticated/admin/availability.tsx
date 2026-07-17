import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListDoctors, adminGetDoctorAvailability, adminSetDoctorAvailability } from "@/lib/admin.functions";
import { PortalShell } from "@/components/portal-shell";
import { AvailabilityEditor, type AvailRow } from "@/components/availability-editor";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ doctor: z.string().uuid().optional() });

const listQO = queryOptions({ queryKey: ["admin", "doctors"], queryFn: () => adminListDoctors() });

export const Route = createFileRoute("/_authenticated/admin/availability")({
  validateSearch: searchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(listQO),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin">
      <div className="bg-card border border-border p-8 text-sm">{error.message}</div>
    </PortalShell>
  ),
  component: AdminAvail,
});

function AdminAvail() {
  const { doctor: doctorId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: doctors } = useSuspenseQuery(listQO);

  return (
    <PortalShell scope="admin">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">SCHEDULING / RULES</div>
        <h1 className="text-2xl font-bold tracking-tight">Doctor availability</h1>
      </div>
      <div className="mb-4">
        <label className="mono-label block mb-2">SELECT DOCTOR</label>
        <select
          value={doctorId ?? ""}
          onChange={(e) => navigate({ to: "/admin/availability", search: { doctor: e.target.value || undefined } })}
          className="w-full md:w-96 bg-card border border-border p-3 text-sm rounded-sm"
        >
          <option value="">— pick a doctor —</option>
          {doctors.map((d: any) => (
            <option key={d.id} value={d.id}>
              {d.full_name} — {d.departments?.name}
            </option>
          ))}
        </select>
      </div>
      {doctorId && <DoctorPanel doctorId={doctorId} />}
    </PortalShell>
  );
}

function DoctorPanel({ doctorId }: { doctorId: string }) {
  const qo = queryOptions({
    queryKey: ["admin", "avail", doctorId],
    queryFn: () => adminGetDoctorAvailability({ data: { doctorId } }),
  });
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const save = useServerFn(adminSetDoctorAvailability);
  const mut = useMutation({
    mutationFn: (slots: AvailRow[]) => save({ data: { doctorId, slots } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin", "avail", doctorId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-4">
      <div className="bg-card border border-border p-4 mb-4">
        <div className="mono-label mb-1">EDITING</div>
        <div className="font-semibold">{data.doctor?.full_name}</div>
        <div className="text-xs text-muted-foreground">{data.doctor?.title} — {(data.doctor as any)?.departments?.name}</div>
      </div>
      <AvailabilityEditor initial={data.slots as any} onSave={(rows) => mut.mutate(rows)} saving={mut.isPending} />
    </div>
  );
}
