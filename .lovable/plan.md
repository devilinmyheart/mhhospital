## Goal

Complete the pending-approval workflow with notifications, in-app alerts, rejection reasons, an admin/doctor approval queue, an Ophthalmology department, and admin-side file uploads for patient reports.

## 1. Email notifications (confirm / reject)

- Set up Lovable managed email (requires a verified sender domain — you'll be prompted to enter one you own, e.g. `notify@mh-hospital.com`).
- Scaffold app-email templates: `appointment-confirmed` and `appointment-rejected`, both including a human-readable **appointment number** in the format `MH-YYYYMMDD-HHMM-XXXX` (date + time + short id suffix).
- On confirm/reject server functions (`adminConfirmAppointment`, `adminRejectAppointment`, `doctorConfirmAppointment`, `doctorRejectAppointment`):
  - Send email to the **patient** (their auth email).
  - Send email to the **hospital notification address** (a single configurable admin recipient — you'll provide the address).

If you don't want to set up a sender domain right now, I'll skip the email portion and ship everything else; in-app notifications will still work.

## 2. In-app notifications

- New `notifications` table (`user_id`, `title`, `body`, `link`, `read_at`, `created_at`) with RLS so users only see their own.
- On confirm/reject: insert one row for the patient and one for each admin user.
- Header bell icon with unread count + dropdown list (mark-as-read on click), visible in patient/doctor/admin portals.

## 3. Rejection reason (required)

- Add `rejection_reason text` column to `appointments`.
- `adminRejectAppointment` / `doctorRejectAppointment` now require a non-empty reason (Zod min(3)).
- Admin & doctor UI: replace the plain "Reject" button with a dialog that asks for the reason.
- Patient portal: rejected rows show a red info block with "Reason: {reason}".

## 4. Approval queue page

- New route `/admin/queue` and `/doctor/queue` — lists only `status='pending'` appointments, sorted oldest first, with Confirm and Reject-with-reason actions inline.
- Add "Approval queue" link to the admin & doctor sidebars with a live pending count badge.

## 5. Ophthalmology department

- Insert an "Ophthalmology" row into `departments` (with icon/description consistent with existing seed rows) so it appears in booking and admin lists.

## 6. Admin file uploads for patient records

- Create a private Supabase Storage bucket `patient-files` (admins & the owning patient can read; only admins can write).
- Extend `medical_reports` with `file_path text` (storage key).
- New admin route `/admin/patients` → pick a patient → upload report (title, category, file). Uses `supabaseAdmin` inside a server function to write to storage after verifying admin role.
- Patient portal Reports page: adds a "Download" link that fetches a short-lived signed URL via a server function.

## Out of scope

- SMS notifications.
- Bulk file uploads / drag-and-drop reordering.
- Editing a rejected appointment back to pending (patient must re-book).

## What I need from you before building

1. **Sender email domain** for confirmation/rejection emails — do you have one to configure, or should I skip email for now and do in-app only?
2. **Hospital notification recipient address** (where "notify me on confirm/reject" emails go).
