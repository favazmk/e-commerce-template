# Customer Accounts & Authentication

What exists, how the security decisions were made, and what you have to
configure in Supabase.

---

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | Sign in |
| `/register` | Create an account, with password strength guidance |
| `/forgot-password` | Request a reset link |
| `/reset-password` | Choose a new password after following the link |
| `/auth/callback` | Server route that exchanges a one-time code for a session |
| `/account` | Overview — spend, orders in flight, default address |
| `/account/orders` | Order history |
| `/account/orders/[orderNumber]` | One order, with a tracking timeline |
| `/account/addresses` | Address book, with a default per type |
| `/account/profile` | Name and phone |
| `/account/security` | Change password, change email, sign out everywhere |
| `/track-order` | Guest order tracking — no account needed |

---

## Supabase configuration

In your Supabase project, **Authentication → URL Configuration**:

- **Site URL**: `https://<your-domain>`
- **Redirect URLs**: add `https://<your-domain>/auth/callback`

Without the redirect URL, confirmation and password-reset links fail with
"requested path is invalid".

**Authentication → Providers → Email**:

- Enable **Confirm email** for production. A store that lets anyone register
  with someone else's address invites impersonation and bounced order mail.
- Set the minimum password length to **8** to match the client-side check.

**Authentication → Email Templates**: replace the default Supabase branding with
your own. These emails are the first thing a new customer receives from you.

---

## Security decisions, and why

### Identity comes only from the session cookie

`getSessionUser()` in `src/lib/auth/session.ts` is the single source of identity.
No route reads a user id from a header, a query string or a JSON body. Those are
fully attacker-controlled — accepting one turns "edit my address" into "edit
anyone's address".

The account API routes take no user id parameter at all. There is exactly one
profile `/api/account/profile` can write, and it is the caller's.

### Role escalation is blocked at three independent layers

`users.role` decides who reaches the admin panel, so it gets defence in depth:

1. **Column privileges** — `authenticated` holds `UPDATE` on `name`, `phone` and
   `avatar_url` only.
2. **A database trigger** — `guard_user_privileged_columns()` pins `role`, `id`,
   `email` and `created_at` to their previous values for any non-service-role
   caller. This survives a future migration accidentally re-granting table-wide
   UPDATE.
3. **Server validation** — `AccountService.updateProfile` uses a Zod schema that
   has no `role` field, so it cannot be passed through even by mistake.

> Row Level Security decides which *rows* a statement may touch. It cannot
> restrict which *columns*. That distinction is why the original
> `FOR UPDATE USING (auth.uid() = id)` policy — which looks correct — allowed
> any customer to set their own role to `super_admin` from the browser console.
> Migration `20260105000000_privilege_escalation_fix.sql` closes it, and
> `tests/integration/privilege-escalation.test.ts` proves it stays closed.

### Redirects are validated

`?redirectTo=` is attacker-controlled. `safeRedirectPath()` accepts only
same-origin single-slash paths. Without it, a link like
`https://your-store.com/login?redirectTo=https://evil.example` shows your real
domain in the address bar while the customer types their password, then bounces
them somewhere hostile — the customer never sees a URL they distrust.

Covered by `tests/safe-redirect.test.ts`, including the backslash and
percent-encoding bypasses that defeat naive implementations.

### Password reset cannot be replayed

The reset link goes to `/auth/callback`, which exchanges the one-time code for
an httpOnly session cookie **server-side** — so the tokens never pass through
client JavaScript where an XSS could read them. After the password is changed
the session is revoked, forcing a deliberate sign-in with the new password.

### Changing a password requires the old one

`/account/security` re-authenticates before calling `updateUser`. Supabase only
requires a valid session, so without this step anyone reaching an unlocked
device could change the password and lock the real owner out.

### Email enumeration is not possible

- Wrong email and wrong password produce the same sign-in message.
- `/forgot-password` shows the same success screen whether or not the address
  has an account.
- Guest order lookup returns one message for "no such order" and "wrong email".

Each of these would otherwise let someone map your customer list one address at
a time.

### Guest order tracking needs two factors

`/track-order` requires the order number **and** the email it was placed with.
The order number alone already gates guest orders, but a public form invites
enumeration against every order number at once; requiring the email means a
guessed number is useless. The endpoint is rate-limited, and returns a narrow
projection — status and line items, never the phone number, full address or
payment records.

---

## Rate limiting

`src/lib/security/rate-limit.ts` throttles auth-adjacent and public write
endpoints:

| Bucket | Limit |
|--------|-------|
| Coupon validation | 15 / 10 min |
| Review submission | 5 / hour |
| Back-in-stock | 8 / hour |
| Newsletter | 6 / hour |
| Order tracking | 12 / 10 min |
| Public reads | 120 / min |

**Be honest about what this is.** It is an in-process counter, so on serverless
each instance keeps its own — the effective limit is `limit × instances`. It
stops cheap, high-volume abuse without adding a Redis dependency. A store under
determined attack should also enable Vercel Firewall or Cloudflare. Supabase
applies its own limits to auth endpoints independently.

It is never a substitute for authorisation. `requireAdmin()` and RLS decide
access; rate limiting only decides volume.

---

## Data the customer controls

| Data | Where they change it |
|------|----------------------|
| Name, phone | `/account/profile` |
| Email | `/account/security` — confirmed from both old and new address |
| Password | `/account/security` — requires the current password |
| Addresses | `/account/addresses` |
| Active sessions | `/account/security` — sign out on all devices |
| Recently viewed | Cleared from the strip, or by clearing browser storage |
| Cookie consent | "Cookie settings" in the footer |
| Newsletter | Unsubscribe link in every email |

This list is what a data-subject-access request is answered with, so keep it
accurate if you add fields.
