create table if not exists public.user_growth_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_growth_states enable row level security;

create policy "users read own growth state"
on public.user_growth_states for select
using (auth.uid() = user_id);

create policy "users insert own growth state"
on public.user_growth_states for insert
with check (auth.uid() = user_id);

create policy "users update own growth state"
on public.user_growth_states for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists user_growth_states_updated_at_idx
on public.user_growth_states(updated_at desc);
