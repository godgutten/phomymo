-- Phomymo cloud templates schema.
--
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> New query,
-- paste, Run. Then copy your project URL and anon key into
-- src/web/supabase-config.js.

create table if not exists public.designs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One design per name per user; this is the upsert conflict target the client
  -- relies on when re-saving an existing design.
  constraint designs_user_name_unique unique (user_id, name),
  constraint designs_name_not_blank check (length(trim(name)) > 0)
);

-- The load dialog always reads "my designs, newest first".
create index if not exists designs_user_updated_idx
  on public.designs (user_id, updated_at desc);

-- Row Level Security is the only thing standing between users, since the anon
-- key ships to the browser. Every policy below is scoped to the caller's own id.
alter table public.designs enable row level security;

drop policy if exists "Users read their own designs" on public.designs;
create policy "Users read their own designs"
  on public.designs for select
  using (auth.uid() = user_id);

drop policy if exists "Users create their own designs" on public.designs;
create policy "Users create their own designs"
  on public.designs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own designs" on public.designs;
create policy "Users update their own designs"
  on public.designs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete their own designs" on public.designs;
create policy "Users delete their own designs"
  on public.designs for delete
  using (auth.uid() = user_id);
