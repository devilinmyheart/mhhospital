import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAvailability, setMyAvailability } from "@/lib/doctor.functions";
import { PortalShell } from "@/components/portal-shell";
import { AvailabilityEditor, type AvailRow } from "@/components/availability-editor";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["doctor", "avail"], queryFn: () => getMyAvailability() });

export const Route = createFileRoute("/_authenticated/doctor/availability")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: DoctorAvail,
});

function DoctorAvail() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const save = useServerFn(setMyAvailability);
  const mut = useMutation({
    mutationFn: (slots: AvailRow[]) => save({ data: { slots } }),
    onSuccess: () => { toast.success("Availability updated"); qc.invalidateQueries({ queryKey: ["doctor"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PortalShell scope="doctor">
      <div className="mb-6 animate-enter">
        <div className="mono-label mb-2">SCHEDULING / RULES</div>
        <h1 className="text-2xl font-bold tracking-tight">Availability rules</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Working hours, break times, slot length, and how many patients can book each slot.
        </p>
      </div>
      <AvailabilityEditor initial={data as any} onSave={(rows) => mut.mutate(rows)} saving={mut.isPending} />
    </PortalShell>
  );
}
