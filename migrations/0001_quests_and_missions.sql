-- ════════════════════════════════════════════════════════════════════
--  Missions → Quest System migration
--  One self-referential `items` table. Quests and missions share a row
--  shape, distinguished by `type`. Missions are recursive (parent_id),
--  and every mission stores its owning root quest (quest_id) for O(1)
--  quest labelling and quest-level cascade.
--
--  NOTE: start_time / end_time are stored as INT minutes-from-midnight,
--  reconciling with the prior `tasks` schema and the client's time math
--  (avoids Postgres `time` overflow when a duration crosses midnight).
-- ════════════════════════════════════════════════════════════════════

-- Old placeholder table is no longer used.
drop table if exists tasks cascade;

create table if not exists items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  type           text not null check (type in ('quest','mission')),
  title          text not null default '',
  completed      boolean not null default false,
  completed_at   timestamptz,
  archived       boolean not null default false,
  quest_id       uuid references items(id) on delete cascade,   -- owning root quest; null only for quests
  parent_id      uuid references items(id) on delete cascade,   -- immediate parent (quest or mission); null for quests
  scheduled_date date,                                          -- "move to" date; missions only
  start_time     int,                                           -- minutes from midnight; missions only
  end_time       int,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Shape constraints
  constraint quest_shape check (
    type <> 'quest' or (quest_id is null and parent_id is null and scheduled_date is null)
  ),
  constraint mission_shape check (
    type <> 'mission' or (quest_id is not null and parent_id is not null)
  )
);

create index if not exists items_quest_id_idx   on items (quest_id);
create index if not exists items_parent_id_idx  on items (parent_id);
create index if not exists items_sched_idx      on items (scheduled_date);
create index if not exists items_user_type_idx  on items (user_id, type);

-- ─── Row Level Security ─────────────────────────────────────────────
alter table items enable row level security;

create policy "select own items" on items
  for select using (user_id = auth.uid());

create policy "insert own items" on items
  for insert with check (user_id = auth.uid());

create policy "update own items" on items
  for update using (user_id = auth.uid());

create policy "delete own items" on items
  for delete using (user_id = auth.uid());

-- ─── updated_at trigger ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_updated_at on items;
create trigger items_updated_at
  before update on items
  for each row execute function set_updated_at();

-- ─── Cascade: complete a mission + its entire descendant subtree ─────
--  Adjacency recursion on parent_id. RLS (invoker rights) keeps this
--  scoped to the calling user's rows.
create or replace function complete_subtree(root uuid)
returns void as $$
  with recursive sub as (
    select id from items where id = root
    union all
    select i.id from items i join sub on i.parent_id = sub.id
  )
  update items
     set completed = true, completed_at = now(), updated_at = now()
   where id in (select id from sub);
$$ language sql;

-- ─── Cascade: complete a quest ──────────────────────────────────────
--  Single update over quest_id captures missions at every depth, then
--  the quest itself is completed AND archived.
create or replace function complete_quest(q uuid)
returns void as $$
  update items
     set completed = true, completed_at = now(), updated_at = now()
   where quest_id = q;

  update items
     set completed = true, archived = true, completed_at = now(), updated_at = now()
   where id = q;
$$ language sql;

-- ─── Realtime (cross-device live sync) ──────────────────────────────
alter publication supabase_realtime add table items;
