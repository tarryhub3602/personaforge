create extension if not exists "pgcrypto";

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  plan text not null check (plan in ('free', 'oneshot', 'pro')),
  description text,
  personas jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists generations_ip_created_at_idx
  on public.generations (ip, created_at desc);

create index if not exists generations_description_idx
  on public.generations (description text_pattern_ops);

alter table public.generations enable row level security;

create policy "Allow anon read generations"
  on public.generations
  for select
  to anon
  using (true);

create policy "Allow anon insert generations"
  on public.generations
  for insert
  to anon
  with check (true);

create policy "Allow anon update generations"
  on public.generations
  for update
  to anon
  using (true)
  with check (true);

create policy "Allow anon delete generations"
  on public.generations
  for delete
  to anon
  using (true);
