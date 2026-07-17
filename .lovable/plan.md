
# MH Hospital — Build Plan

Building the "Operational Dashboard" direction: dense, precise, mono-accented, blue primary + red emergency ribbon, JetBrains Mono labels + Inter body.

## Scope (v1)

### Public site (no login required)
- **Home (`/`)** — Emergency ribbon, hero "Patient Operations Center", featured departments, medical directorship, Quick Schedule widget, telemedicine card, testimonial, footer.
- **Departments (`/departments`)** — grid of all specialties (Cardiology, Neurology, Oncology, Orthopedics, Pediatrics, General Practice, etc.) with descriptions and specialist counts.
- **Physicians (`/physicians`)** — searchable/filterable doctor directory with department filter, availability badge, "Book" CTA per doctor. Detail route `/physicians/$doctorId`.
- **Book Appointment (`/book`)** — 3-step wizard: pick department/doctor → pick date → pick time slot → confirm. Supports "In-person" or "Video consultation" mode.
- **About / Contact (`/about`, `/contact`)** — hospital info, hours, emergency line, location.
- **Auth (`/auth`)** — sign up / sign in (email + password + Google).

### Patient portal (`/_authenticated/portal/*`)
- **Dashboard** — Next appointment, active prescriptions, pending reports (mirrors homepage hero widgets, but with real data).
- **Appointments** — list of upcoming/past appointments, cancel/reschedule.
- **Prescriptions** — list of prescriptions issued by doctors, refill status.
- **Reports** — list of medical reports uploaded by doctors, download link.
- **Consultation room (`/portal/consult/$appointmentId`)** — for video appointments, placeholder video UI (Jitsi-embed style iframe stub) + chat area. Real video SDK is out of v1 scope; we build the room shell that any WebRTC provider can drop into later.

### Doctor portal (`/_authenticated/doctor/*`)
- **Dashboard** — today's appointments, quick stats.
- **Schedule** — set availability slots (day + time ranges).
- **Appointments** — see assigned patient appointments, mark completed, add notes.
- **Issue prescription / upload report** — attached to a completed appointment.

### Admin portal (`/_authenticated/admin/*`)
- **Overview** — counts of doctors, patients, appointments today.
- **Manage doctors** — create doctor profile, assign department, activate/deactivate.
- **Manage departments** — CRUD departments.
- **All appointments** — read-only oversight table.

Role gating is enforced with `has_role()` in RLS and re-checked in server functions.

## Technical plan

### Stack
TanStack Start (already scaffolded) + Lovable Cloud (Supabase) for auth, database, storage. TanStack Query for all data fetching, `createServerFn` for privileged/auth reads, publishable-key server client for public reads (departments, physicians directory).

### Database (Lovable Cloud migration)
- `app_role` enum: `patient | doctor | admin`
- `user_roles(user_id, role)` + `has_role()` security-definer function (per user-roles rules)
- `profiles(id → auth.users, full_name, phone, date_of_birth, created_at)` — auto-created on signup via trigger
- `departments(id, name, slug, description, specialist_count)`
- `doctors(id, user_id → auth.users nullable, full_name, department_id, title, bio, photo_url, is_active)`
- `doctor_availability(id, doctor_id, weekday 0-6, start_time, end_time)` — recurring weekly slots
- `appointments(id, patient_id → auth.users, doctor_id, department_id, scheduled_at, duration_min, mode enum in_person|video, status enum booked|completed|cancelled, reason, created_at)`
- `prescriptions(id, appointment_id, patient_id, doctor_id, medications jsonb, notes, issued_at)`
- `medical_reports(id, patient_id, doctor_id, appointment_id nullable, title, file_path, uploaded_at)` — file in Storage bucket `medical-reports` (private).

All tables get `GRANT`s (authenticated + service_role, plus `anon SELECT` on `departments`, `doctors`, `doctor_availability` which are public), RLS enabled, and policies:
- patients see their own appointments/prescriptions/reports/profile
- doctors see appointments where they are the doctor + related prescriptions/reports
- admins see all (via `has_role(auth.uid(),'admin')`)
- public reads on departments, active doctors, availability

Seed migration inserts departments and a few doctor rows so the site is not empty on first load.

### Server functions
- `listDepartments`, `listDoctors({ departmentId? })`, `getDoctor(id)`, `getDoctorAvailability(doctorId, dateRange)` — public, server publishable client.
- `bookAppointment` — auth-required, validates slot is free and within availability.
- `getMyAppointments`, `cancelAppointment` — patient, RLS via `requireSupabaseAuth`.
- `getDoctorSchedule`, `setDoctorAvailability`, `markAppointmentCompleted`, `issuePrescription`, `uploadReport` — doctor role checked.
- `adminListDoctors`, `createDoctor`, `updateDepartment`, `adminListAppointments` — admin role checked.

### Design system (`src/styles.css`)
Port the direction's tokens as oklch: `--primary` (blue), `--emergency` (red), `--background` (near-white), `--foreground`, `--muted`, `--border`. Add `--font-mono` (JetBrains Mono) and `--font-sans` (Inter), loaded via `<link>` in `__root.tsx` head. Add `slideUp` animate-enter utility. Sharp corners (`rounded-sm`), thin borders, dense typography, uppercase mono micro-labels.

### Root layout
`__root.tsx` gets meta ("MH Hospital — Advanced Medical Care & Online Consultation"), Google Fonts link, `QueryClientProvider`, `Toaster`, sticky top nav + emergency ribbon on public routes, and an auth-aware sign-in/portal link.

### Auth
Email/password + Google (via Lovable broker). On signup, trigger inserts `profiles` row + assigns `patient` role by default. Password reset page at `/reset-password`. Doctor and admin roles are assigned by an admin from the admin portal (first admin seeded via migration if the user provides an email — otherwise assigned manually after signup).

### Out of scope for v1 (called out honestly)
- Real WebRTC video — we ship a consult room shell with a placeholder video panel and chat, ready to wire into Daily/Jitsi/Twilio later.
- Payments/insurance.
- SMS notifications.
- Live ER wait time — shown as static content ("Emergency 24/7") on the ribbon.

## Deliverables in this build turn
Enable Lovable Cloud, run the full migration + seed, add design tokens, build all routes above with real data wired end-to-end, and populate seed data so the homepage renders with real departments and doctors immediately.
