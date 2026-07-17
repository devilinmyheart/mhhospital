## The problem

Your app has no "approval" logic. What patients are actually hitting is Supabase's **email confirmation** requirement — the auth logs show a fresh signup followed by a `400: Email not confirmed` on the very next login attempt. The generic error is being read as "needs approval."

## The fix

Turn on **auto-confirm** for email signups so accounts are usable the moment they're created — no verification email, no waiting.

1. Call `configure_auth` with `auto_confirm_email: true` (leaves your other auth settings alone).
2. Improve the signup UX in `src/routes/auth.tsx` so the success toast says "Account created — you're signed in" only after we confirm a session exists, and surface a clearer message if login ever returns `email_not_confirmed` in the future.

## Notes

- No database/schema changes.
- Existing unconfirmed users (like `devilkillermylove@gmail.com` in the logs) will also be able to log in after this flips on.
- Trade-off: anyone can register with any email string (including typos/fakes). That's the accepted cost of instant access — matches what you picked.

Ready to switch to build mode and apply this?