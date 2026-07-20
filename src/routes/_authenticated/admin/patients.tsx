import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  adminListPatients,
  adminListPatientReports,
  adminUploadPatientReport,
  adminDeletePatientReport,
  adminReportSignedUrl,
} from "@/lib/patients.functions";
import { PortalShell } from "@/components/portal-shell";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["admin", "patients"], queryFn: () => adminListPatients() });

export const Route = createFileRoute("/_authenticated/admin/patients")({
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  errorComponent: ({ error }) => (
    <PortalShell scope="admin"><div className="bg-card border border-border p-8 text-sm">{error.message}</div></PortalShell>
  ),
  component: Patients,
});

function Patients() {
  const { data: patients } = useSuspenseQuery(qo);
  const [selected, setSelected] = useState<any>(null);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients as any[];
    return (patients as any[]).filter((p) => (p.full_name ?? "").toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q));
  }, [patients, query]);

  return (
    <PortalShell scope="admin">
      <div className="mb-6">
        <div className="mono-label mb-2">PATIENTS</div>
        <h1 className="text-2xl font-bold tracking-tight">Patient records</h1>
        <p className="text-xs text-muted-foreground mt-1">Select a patient to upload reports or manage their files.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="border border-border bg-card">
          <div className="p-3 border-b border-border">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-full bg-background border border-border p-2 text-sm rounded-sm" />
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {filtered.map((p: any) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`block w-full text-left px-3 py-2.5 border-b border-border hover:bg-accent ${selected?.id === p.id ? "bg-primary/10" : ""}`}
              >
                <div className="text-sm font-semibold">{p.full_name || p.email.split("@")[0]}</div>
                <div className="text-[11px] font-mono text-muted-foreground">{p.email}</div>
              </button>
            ))}
            {filtered.length === 0 && <div className="p-6 text-xs text-muted-foreground">No patients.</div>}
          </div>
        </div>
        <div className="lg:col-span-2">
          {selected ? <PatientPanel patient={selected} /> : (
            <div className="border border-border bg-card p-10 text-center text-sm text-muted-foreground">Select a patient to begin.</div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}

function PatientPanel({ patient }: { patient: any }) {
  const qc = useQueryClient();
  const key = ["admin", "patient-reports", patient.id];
  const { data: reports = [] } = useQuery({ queryKey: key, queryFn: () => adminListPatientReports({ data: { patientId: patient.id } }) });
  const uploadFn = useServerFn(adminUploadPatientReport);
  const deleteFn = useServerFn(adminDeletePatientReport);
  const signFn = useServerFn(adminReportSignedUrl);
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const upload = useMutation({
    mutationFn: (v: { title: string; category: string; file: File }) =>
      fileToBase64(v.file).then((base64) =>
        uploadFn({ data: {
          patientId: patient.id,
          title: v.title,
          category: v.category || undefined,
          fileName: v.file.name,
          contentType: v.file.type || "application/octet-stream",
          fileBase64: base64,
        } })
      ),
    onSuccess: () => { toast.success("Report uploaded"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { reportId: id } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("lab");
  const [file, setFile] = useState<File | null>(null);

  async function openReport(id: string) {
    try {
      const { url } = await signFn({ data: { reportId: id } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border p-4">
        <div className="text-lg font-semibold">{patient.full_name || patient.email.split("@")[0]}</div>
        <div className="text-xs font-mono text-muted-foreground">{patient.email}{patient.phone ? ` · ${patient.phone}` : ""}</div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !file) return toast.error("Title and file required");
          upload.mutate({ title, category, file }, { onSuccess: () => { setTitle(""); setFile(null); } });
        }}
        className="bg-card border border-border p-4 space-y-3"
      >
        <div className="mono-label">UPLOAD REPORT</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Report title" className="bg-background border border-border p-2 text-sm rounded-sm" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-background border border-border p-2 text-sm rounded-sm">
            <option value="lab">Lab</option>
            <option value="imaging">Imaging</option>
            <option value="pathology">Pathology</option>
            <option value="prescription">Prescription</option>
            <option value="discharge">Discharge summary</option>
            <option value="other">Other</option>
          </select>
        </div>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" />
        <div className="text-[10px] text-muted-foreground font-mono">Max 15 MB. PDF, images or docs.</div>
        <button disabled={upload.isPending} className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-40">
          {upload.isPending ? "Uploading…" : "Upload"}
        </button>
      </form>

      <div className="border border-border">
        <div className="px-3 py-2 border-b border-border mono-label bg-muted/40">UPLOADED FILES</div>
        {reports.length === 0 && <div className="p-6 text-xs text-muted-foreground">No files yet.</div>}
        {reports.map((r: any) => (
          <div key={r.id} className="p-3 border-b border-border last:border-b-0 bg-card flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold">{r.title}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{r.category ?? "—"} · {new Date(r.uploaded_at).toLocaleString()}</div>
            </div>
            {r.file_path && (
              <button onClick={() => openReport(r.id)} className="text-[11px] font-mono uppercase border border-border px-3 py-1.5 hover:bg-accent">Open</button>
            )}
            <button
              onClick={() => confirm("Delete this report?") && del.mutate(r.id)}
              className="text-[11px] font-mono uppercase border border-emergency/40 text-emergency px-3 py-1.5 hover:bg-emergency/10"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      resolve(s.slice(s.indexOf(",") + 1));
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
