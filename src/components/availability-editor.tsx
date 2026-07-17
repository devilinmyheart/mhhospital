import { useState } from "react";

export type AvailRow = {
  weekday: number;
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  slot_duration_min: number;
  max_bookings_per_slot: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toHHMM(v: string | null | undefined) {
  if (!v) return "";
  return v.slice(0, 5);
}

function emptyRow(weekday = 1): AvailRow {
  return {
    weekday,
    start_time: "09:00",
    end_time: "17:00",
    break_start: "12:00",
    break_end: "13:00",
    slot_duration_min: 30,
    max_bookings_per_slot: 1,
  };
}

export function AvailabilityEditor({
  initial,
  onSave,
  saving,
}: {
  initial: AvailRow[];
  onSave: (rows: AvailRow[]) => void;
  saving: boolean;
}) {
  const [rows, setRows] = useState<AvailRow[]>(() =>
    initial.map((r) => ({
      ...r,
      start_time: toHHMM(r.start_time),
      end_time: toHHMM(r.end_time),
      break_start: toHHMM(r.break_start),
      break_end: toHHMM(r.break_end),
    })),
  );

  const update = (i: number, patch: Partial<AvailRow>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No availability configured. Add a rule below.</p>
      )}
      {rows.map((r, i) => (
        <div key={i} className="bg-card border border-border p-4 grid grid-cols-12 gap-3 items-end">
          <div className="col-span-6 md:col-span-2">
            <label className="mono-label block mb-1">DAY</label>
            <select
              value={r.weekday}
              onChange={(e) => update(i, { weekday: Number(e.target.value) })}
              className="w-full bg-background border border-border p-2 text-sm rounded-sm"
            >
              {WEEKDAYS.map((w, idx) => (<option key={idx} value={idx}>{w}</option>))}
            </select>
          </div>
          <div className="col-span-3 md:col-span-1">
            <label className="mono-label block mb-1">START</label>
            <input type="time" value={r.start_time} onChange={(e) => update(i, { start_time: e.target.value })} className="w-full bg-background border border-border p-2 text-sm rounded-sm font-mono" />
          </div>
          <div className="col-span-3 md:col-span-1">
            <label className="mono-label block mb-1">END</label>
            <input type="time" value={r.end_time} onChange={(e) => update(i, { end_time: e.target.value })} className="w-full bg-background border border-border p-2 text-sm rounded-sm font-mono" />
          </div>
          <div className="col-span-3 md:col-span-1">
            <label className="mono-label block mb-1">BREAK ST</label>
            <input type="time" value={r.break_start ?? ""} onChange={(e) => update(i, { break_start: e.target.value || null })} className="w-full bg-background border border-border p-2 text-sm rounded-sm font-mono" />
          </div>
          <div className="col-span-3 md:col-span-1">
            <label className="mono-label block mb-1">BREAK END</label>
            <input type="time" value={r.break_end ?? ""} onChange={(e) => update(i, { break_end: e.target.value || null })} className="w-full bg-background border border-border p-2 text-sm rounded-sm font-mono" />
          </div>
          <div className="col-span-3 md:col-span-2">
            <label className="mono-label block mb-1">SLOT (MIN)</label>
            <input type="number" min={5} max={240} value={r.slot_duration_min} onChange={(e) => update(i, { slot_duration_min: Number(e.target.value) })} className="w-full bg-background border border-border p-2 text-sm rounded-sm font-mono" />
          </div>
          <div className="col-span-3 md:col-span-2">
            <label className="mono-label block mb-1">MAX / SLOT</label>
            <input type="number" min={1} max={20} value={r.max_bookings_per_slot} onChange={(e) => update(i, { max_bookings_per_slot: Number(e.target.value) })} className="w-full bg-background border border-border p-2 text-sm rounded-sm font-mono" />
          </div>
          <div className="col-span-6 md:col-span-2 text-right">
            <button onClick={() => setRows((s) => s.filter((_, idx) => idx !== i))} className="text-[11px] font-mono border border-border px-3 py-2 hover:bg-emergency/10 hover:text-emergency">
              REMOVE
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setRows((s) => [...s, emptyRow()])} className="text-[11px] font-mono border border-border px-3 py-2 hover:bg-accent">
          + ADD RULE
        </button>
        <button
          disabled={saving}
          onClick={() => onSave(rows.map((r) => ({
            ...r,
            break_start: r.break_start || null,
            break_end: r.break_end || null,
          })))}
          className="ml-auto bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "SAVING..." : "SAVE AVAILABILITY"}
        </button>
      </div>
    </div>
  );
}
