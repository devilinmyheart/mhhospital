
## The problem

After sign-in, `src/routes/auth.tsx` always navigates to `/portal` — regardless of the user's role. The admin routes at `/admin/*` exist and are functional, but nothing sends the admin user there. That's why logging in as `admin@mhhospital.com` lands on the Patient Portal.

There is no role-aware landing logic, and the site header doesn't surface an "Admin" link either, so admins have no visible entry point.

## The fix

**1. Add a `getMyRoles()` server function** (or reuse the existing one in `src/lib/portal.functions.ts`) that returns the roles for the current user from `user_roles`.

**2. Role-aware post-login redirect in `src/routes/auth.tsx`:**
After a successful sign-in / signup / already-signed-in check, fetch the user's roles and route to:
- `/admin` if roles include `admin`
- `/doctor` if roles include `doctor`
- `/portal` otherwise (patient)

The `?next=` search param, when present, still takes precedence (so deep-links keep working).

**3. Add a role-based nav badge in `src/components/site-header.tsx`:**
When signed in, show a "Portal" link that points to the user's correct landing route (Admin / Doctor / Patient) based on role, so the admin has a one-click way in from anywhere.

**4. Guard the wrong-portal case gracefully:**
`/_authenticated/admin/*` routes already check `assertAdmin()` via `admin.functions.ts`. Add a small `beforeLoad` (or loader redirect) on `/portal` and `/admin` so if an admin lands on `/portal` directly, they're bounced to `/admin`, and non-admins hitting `/admin` are bounced to `/portal`. This prevents future confusion.

## Files touched

- `src/routes/auth.tsx` — role-aware redirect after auth
- `src/components/site-header.tsx` — dynamic "Portal" link based on role
- `src/routes/_authenticated/portal/index.tsx` + `src/routes/_authenticated/admin/index.tsx` — optional loader-side role redirect
- `src/lib/portal.functions.ts` — ensure `getMyRoles()` is exported (already exists)

No database or RLS changes are required — the `admin` role is already assigned to your account and the admin pages already work; this is purely a routing/UX fix.
