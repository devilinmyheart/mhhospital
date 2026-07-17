## Goal
Give admins a place to manage multiple hospital branches and assign roles (admin, doctor, patient) to any user — with all writes restricted to admins.

## 1. Database (single migration)

New `public.hospitals` table:
- `id uuid pk`, `name text not null`, `slug text unique`, `address text`, `city text`, `state text`, `postal_code text`, `phone text`, `email text`, `emergency_phone text`, `is_active bool default true`, `image_url text`, `description text`, `created_at`, `updated_at` (+ trigger).
- GRANTs: `SELECT` to `anon, authenticated` (public listings); `INSERT/UPDATE/DELETE` to `authenticated`; `ALL` to `service_role`.
- RLS policies:
  - Public read: `is_active = true` for `anon`, all rows for `authenticated`.
  - Insert/Update/Delete: `has_role(auth.uid(), 'admin')` only.
- Optional link: add nullable `hospital_id uuid references hospitals(id)` on `doctors` and `departments` so future entries can be scoped (non-breaking).

Extra RLS on `user_roles` for admin management:
- Existing: authenticated read-own. Add:
  - Admins can `SELECT` all rows.
  - Admins can `INSERT` / `DELETE` any row (`has_role(auth.uid(),'admin')`).
- Do not allow patients/doctors to escalate themselves — only admin path.

Seed the current MH Hospital as the first hospital row.

## 2. Server functions (`src/lib/admin.functions.ts`, extend)

All use `requireSupabaseAuth` + verify `has_role(userId,'admin')` via `context.supabase.rpc('has_role', ...)`. Throw 403 otherwise.

- `listHospitals()` — admin read all (public listing already possible via existing public fn if needed).
- `upsertHospital({ id?, ...fields })`
- `deleteHospital({ id })`
- `listUsersWithRoles()` — joins `profiles` + `user_roles`. Uses `supabaseAdmin` (dynamic import inside handler) to include auth email; returns `{ id, email, full_name, roles: string[] }[]`.
- `assignRole({ userId, role })` — insert into `user_roles` (idempotent via `ON CONFLICT DO NOTHING`).
- `removeRole({ userId, role })` — delete; block removing the caller's own last `admin` role to prevent lockout.

## 3. Routes (all under existing admin gate)

`src/routes/_authenticated/admin/hospitals.tsx`
- Table of hospitals with columns: name, city, phone, active toggle, actions.
- "New hospital" dialog + "Edit" dialog sharing one form (name/address/city/state/postal/phone/email/emergency/image/description/active).
- Delete with confirm.

`src/routes/_authenticated/admin/users.tsx`
- Search box (client-side filter over email/name).
- Row per user: shows current role chips (admin/doctor/patient) with an "×" to remove, plus an "Add role" dropdown → calls `assignRole`.
- Warn on removing last admin (server enforces too).

Update `src/routes/_authenticated/admin/index.tsx` sidebar/nav to link both new pages.

## 4. Header/portal nav
Already role-aware (admin → `/admin`). Just add the two new links inside the admin layout nav; no header change needed.

## 5. Notes / non-goals
- No changes to appointment/doctor logic beyond adding optional `hospital_id` column (nullable, non-breaking).
- Role assignment UI is admin-only; patients still self-register as `patient` via existing `handle_new_user` trigger.
- No email invitations in this pass — role assignment operates on users who already exist in `auth.users`.

Confirm and I'll implement in one build pass (migration first, then code).
