# Missions Server — Task Assignment API

A small NestJS + TypeScript service that adds **domain-restricted task assignment** on top of the [Missions](../README.md) frontend: a user can assign a task to a colleague sharing their email domain, who gets notified by email even if they've never used the app.

It's a separate, additive service — it never touches your personal quests/missions data, and the main app works exactly as before if this service isn't deployed at all.

## Why a separate backend

Two things here can't be done safely from the browser:

1. **Domain-based authorization** — "you may only assign within your own approved company domain" has to be enforced server-side; a client can't be trusted to self-report which domain it belongs to.
2. **Cross-user writes + a privileged key** — creating an assignment writes into the recipient's view of the data, and emailing a non-registered user needs a secret API key. Both require the Supabase **service-role** key, which must never reach the browser.

The two new tables (`approved_domains`, `assignments`) have Row Level Security enabled with **zero policies** for the `anon`/`authenticated` roles — meaning they are unreachable from the browser even with a leaked anon key. The only way in is through this service's service-role client, which enforces the domain rule in one audited place ([`assignments.service.ts`](src/assignments/assignments.service.ts)).

## Architecture

```
src/
  auth/        SupabaseAuthGuard — verifies the caller's Supabase access token via
               supabase.auth.getUser(), attaches { id, email } to the request
  supabase/    Service-role Supabase client (server-only)
  domains/     approved_domains lookup — the admin-managed allowlist
  email/       Resend integration + the assignment notification template
  assignments/ Controller + Service — the domain-match authorization rule,
               assignment CRUD, and the assignee_user_id backfill
  me/          GET /me/eligibility — lets the frontend decide whether to show
               the feature at all
```

## Managing the approved domain list

There is deliberately **no admin API or UI** for this — only the project owner can decide which domains may use the feature, so it's a plain table you manage directly in the Supabase SQL editor:

```sql
insert into approved_domains (domain) values ('yourcompany.com');
-- remove one:
delete from approved_domains where domain = 'yourcompany.com';
```

Users whose verified email domain isn't in this table never see the assignment feature in the frontend at all (checked via `GET /me/eligibility`).

## Local dev setup

```bash
cd server
npm install
cp .env.example .env   # fill in the values below
npm run start:dev      # → http://localhost:3000
```

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Same Supabase project as the frontend — Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` key. **Never** put this in the frontend or commit it. |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | A verified sender, e.g. `Missions <notifications@yourdomain.com>` |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |
| `PORT` | Defaults to 3000 |

Run `../migrations/0004_assignments.sql` and `../migrations/0006_assignment_update_request.sql` in the Supabase SQL editor before starting the server — same process as the other migrations in the main README.

## API

All routes require `Authorization: Bearer <supabase-access-token>`.

| Route | Purpose |
|---|---|
| `GET /me/eligibility` | `{ eligible, domain }` — whether the caller's domain is approved |
| `POST /assignments` | `{ assigneeEmail, title, description? }` — create + email an assignment (assignee must share the caller's approved domain) |
| `GET /assignments/mine` | Assignments received by the caller (auto-links any sent before they had an account) |
| `GET /assignments/sent` | Assignments the caller has sent to others |
| `PATCH /assignments/:id/status` | `{ status: 'pending' \| 'completed' }` — assignee only |
| `PATCH /assignments/:id/request-update` | Assigner pings the assignee by email for a status update on a still-pending task — assigner only |

## Testing

```bash
npm test        # unit tests — the domain-match authorization logic
npm run test:e2e  # e2e — the eligibility endpoint over real HTTP, with the auth guard stubbed
```

## Deployment

This needs a real Node runtime — it can't run on Cloudflare Pages (static-only) alongside the frontend. Railway or Render both work well for a service this size:

- **Build command**: `npm install && npm run build`
- **Start command**: `npm run start:prod`
- Set all the env vars above in the host's dashboard (same discipline as the frontend's Cloudflare Pages env vars — real secrets only ever live there, never in a committed file)
- Update the frontend's `VITE_ASSIGNMENTS_API_URL` (in Cloudflare Pages) to point at the deployed URL, and set `CORS_ORIGIN` here to match the frontend's origin
