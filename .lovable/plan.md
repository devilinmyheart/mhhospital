## Problem

Availability check fails because of a timezone mismatch between client and server.

- Admin sets rules like Mon 09:00–17:00 (interpreted as local/India time).
- Client (`src/routes/book.tsx`) builds slots using the browser's local weekday/hour, and sends `new Date(\`${dateStr}T${time}:00\`).toISOString()` — a UTC instant.
- Server (`validateAndReserveSlot` in `src/lib/portal.functions.ts`) does `new Date(scheduledAt)` then `local.getDay()` / `getHours()`. On the Cloudflare Worker the "local" timezone is UTC, so 09:00 IST becomes 03:30 UTC, which falls outside the 09:00–17:00 rule → "Selected time is outside the doctor's availability."

## Fix

Stop deriving weekday/HH:MM from a `Date` on the server. Have the client send the intended wall-clock components alongside the ISO instant, and validate rules against those.

### Changes

1. `src/lib/portal.functions.ts`
   - Extend `bookSchema` and the reschedule schema with `weekday: 0–6` and `localTime: "HH:MM"` fields.
   - Rewrite `validateAndReserveSlot` to accept `{ weekday, hhmm }` from the caller and match rules directly against those, instead of computing them from `new Date(scheduledAt)`.
   - Keep slot-capacity check using the ISO instant + `slot_duration_min` (that comparison is timezone-safe because both sides are UTC instants).

2. `src/routes/book.tsx`
   - When calling `bookFn`, also pass `weekday: new Date(dateStr + "T00:00:00").getDay()` and `localTime: time`.

3. `src/components/reschedule-dialog.tsx` (or wherever `rescheduleAppointment` is invoked)
   - Same: send `weekday` and `localTime` derived from the picked date/time.

### Why this works

The client already knows the wall-clock weekday and HH:MM the user picked (that's what the UI displays and what the admin's rules refer to). Sending those verbatim removes any server-side timezone interpretation. The stored `scheduled_at` remains a correct UTC instant for capacity checks and calendar display.

### Out of scope

- No schema change; `doctor_availability` still stores `time`/`weekday` as-is.
- No change to admin availability editor.
- No fix for the unrelated security findings currently shown in the More panel.