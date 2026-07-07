# Client login (Clerk) — setup & operations

The dashboard uses [Clerk](https://clerk.com) for real client authentication.
Clerk owns passwords, magic links, password reset, MFA and lockout. Our code
only reads the **verified** identity and maps it to a `clientId`, which every
data API uses to return *only that client's* AR data.

## One-time setup

1. **Create a Clerk application** at https://dashboard.clerk.com (one app; use the
   Development instance for demos/sales, the Production instance for real clients).
2. **Copy the two keys** from Clerk → API Keys:
   - Publishable key → `pk_test_...` / `pk_live_...`
   - Secret key → `sk_test_...` / `sk_live_...`
3. **Add env vars in Vercel** (Project → Settings → Environment Variables):

   | Variable | Where | Value |
   |----------|-------|-------|
   | `VITE_CLERK_PUBLISHABLE_KEY` | Frontend (build time) | `pk_...` |
   | `CLERK_SECRET_KEY` | Serverless functions | `sk_...` |
   | `ADMIN_SETUP_SECRET` | Serverless functions | any long random string |

   For local dev, put `VITE_CLERK_PUBLISHABLE_KEY` in `dashboard/.env` and
   `CLERK_SECRET_KEY` in `dashboard/api/.env` (both are gitignored).
4. **Configure sign-in options** in Clerk → User & Authentication. Email + password
   works; email magic-link is recommended for non-technical finance users (nothing
   to forget). Turn on "Restrict sign-ups" so only invited clients can create accounts.
5. **Set the redirect/allowed origins** to your dashboard domain (e.g.
   `https://app.lunarlogic.ai`).

## Provisioning a client (do this per client)

1. In Clerk → Users → **Invite**, enter the client's email.
2. After they exist as a user, open the user → **Metadata → Public metadata**, and set:

   ```json
   { "clientId": "gualapack", "clientName": "Gualapack", "role": "client" }
   ```

   - `clientId` **must** match a key in `src/data/mockData.js` and the KV token key
     `qb_token:<clientId>`. Current ids: `kaptain`, `gualapack`, `forvismazars`,
     `meridian`, `qbsandbox`.
   - `role`: `client` for customers, `admin` for LunarLogic staff (admin sees the
     internal dashboard view).
3. The client accepts the invite, sets their own password, and lands on their
   dashboard. No code deploy needed to add a client.

## Connecting a client's QuickBooks (per client)

QuickBooks OAuth is a separate, admin-only step. Visit:

```
https://<your-domain>/api/qb-auth-connect?clientId=<clientId>&key=<ADMIN_SETUP_SECRET>
```

Approve on Intuit's screen; the callback stores the encrypted token + that
client's `realm_id`. From then on the dashboard shows live QB data for that client.

## Security model (why it's built this way)

- Client identity is **never** read from a query string or request body — only
  from a Clerk session token verified server-side (`api/_lib/clerkAuth.js`).
- Each client's QuickBooks calls are scoped to *their own* company (`realm_id`
  stored with the token), not a global company id.
- `qb-auth-connect` is gated by `ADMIN_SETUP_SECRET` because it's a browser
  redirect that can't carry an auth header.
