-- ════════════════════════════════════════════════════════════════════
--  Domain-restricted task assignment
--
--  `approved_domains` is an admin-only allowlist — rows are inserted
--  directly by the project owner (via this SQL editor / a future admin
--  tool), never by app users. It has RLS enabled with zero policies for
--  the anon/authenticated roles, so it is default-deny for every client
--  request; only the service-role key (used exclusively by the missions
--  server, never the browser) can read or write it.
--
--  `assignments` is likewise fully mediated by the missions server:
--  the server verifies the caller's email domain against
--  approved_domains and enforces "assigner domain === assignee domain"
--  before ever writing a row, using its service-role client. RLS is
--  enabled here too with no client-facing policies, so the table is
--  unreachable from the browser even with a leaked anon key — the only
--  path in is through the audited server code.
-- ════════════════════════════════════════════════════════════════════

create table if not exists approved_domains (
  id         uuid primary key default gen_random_uuid(),
  domain     text not null unique,   -- e.g. 'company.com', stored lowercase
  created_at timestamptz not null default now()
);

alter table approved_domains enable row level security;
-- No policies: default-deny for anon/authenticated. Only service_role
-- (server-side, bypasses RLS) can read/write this table.

create table if not exists assignments (
  id               uuid primary key default gen_random_uuid(),
  assigner_id      uuid not null references auth.users(id) on delete cascade,
  assigner_email   text not null,
  assignee_email   text not null,
  assignee_user_id uuid references auth.users(id) on delete set null,
  title            text not null,
  description      text not null default '',
  status           text not null default 'pending' check (status in ('pending','completed')),
  created_at       timestamptz not null default now(),
  email_sent_at    timestamptz
);

create index if not exists assignments_assignee_user_idx  on assignments (assignee_user_id);
create index if not exists assignments_assignee_email_idx on assignments (lower(assignee_email));
create index if not exists assignments_assigner_idx       on assignments (assigner_id);

alter table assignments enable row level security;
-- No policies: default-deny for anon/authenticated. All reads/writes
-- happen through the missions server's service-role client, which
-- enforces the domain-matching authorization rule in application code.
