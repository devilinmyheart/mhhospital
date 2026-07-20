import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function RejectReasonDialog({
  open, onClose, onConfirm, pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 3;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setReason(""); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="mono-label block">Reason (shown to patient)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full bg-background border border-border p-2 text-sm rounded-sm"
            placeholder="e.g. Doctor unavailable at this time — please rebook."
          />
          <div className="text-[10px] font-mono text-muted-foreground text-right">{reason.length}/500</div>
        </div>
        <DialogFooter>
          <button onClick={() => { onClose(); setReason(""); }} className="border border-border px-4 py-2 text-sm">Cancel</button>
          <button
            disabled={!valid || pending}
            onClick={() => valid && onConfirm(reason.trim())}
            className="bg-emergency text-emergency-foreground px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {pending ? "Rejecting…" : "Reject appointment"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
