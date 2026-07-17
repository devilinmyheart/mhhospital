## Goal

New patient bookings arrive as **pending** and become **booked** only after an admin or the assigned doctor confirms them. Rejection is also supported.

## Changes

### 1. Database (migration)

- Extend the appointment status enum with `pending` and `rejected` (keep existing `booked`, `completed`, `cancelled`).
- Change the default status for new appointments to `pending`.
- Update `appointments_restrict_patient_updates()` trigger so patients may still only set status to `cancelled` (no self-approval).
- Video-consultation join window (in `consultation.$appointmentId.tsx`) already checks `status = 'booked'`, so pending appointments cannot start a video call — no schema change needed there.

### 2. Server functions

- `src/lib/portal.functions.ts` › `bookAppointment`: insert with `status: "pending"`. Keep slot-capacity validation as-is (a pending booking still holds the slot to prevent double-booking).
- `src/lib/portal.functions.ts` › `getMyDashboard` / `getMyAppointments`: return status so the UI can show a "Pending confirmation" badge.
- `src/lib/admin.functions.ts` and `src/lib/doctor.functions.ts`: add `confirmAppointment({ appointmentId })` and `rejectAppointment({ appointmentId, reason? })`. Admin version works on any appointment; doctor version restricts to `doctor.user_id = auth.uid()`. Both flip status `pending → booked` (confirm) or `pending → rejected` (reject).

### 3. UI

- **Patient portal** (`_authenticated/portal/appointments.tsx`, dashboard): show a "PENDING" badge for pending rows; hide the "Join video" CTA until confirmed; keep Cancel available.
- **Booking success** (`book.tsx`): change toast/redirect copy to "Request submitted — awaiting confirmation" and route to `/portal/appointments` instead of the video room even for video mode.
- **Admin appointments** (`_authenticated/admin/appointments.tsx`): add a "Pending" filter at the top and Confirm / Reject buttons on pending rows.
- **Doctor appointments** (`_authenticated/doctor/appointments.tsx`): same Confirm / Reject actions, scoped to the doctor's own appointments.

### Out of scope

- Email notifications on confirm/reject (can be added later if desired).
- Reworking the existing security findings visible in the More panel.