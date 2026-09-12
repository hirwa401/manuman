-- Host approval workflow. Run after supabase_profiles_migration.sql.
-- This migration preserves existing profiles and host access.

create table if not exists public.host_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  email text,
  driver_license text,
  phone text,
  location text,
  terms_accepted boolean default false,
  terms_version text default 'host-v1',
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

create unique index if not exists host_requests_one_pending_per_user
  on public.host_requests(user_id) where status = 'pending';

alter table public.host_requests enable row level security;

do $$
begin
  -- Host applications contain sensitive identity information. The API uses
  -- the Supabase service role, so clients should not read this table directly.
  drop policy if exists "Allow all" on public.host_requests;
end
$$;

notify pgrst, 'reload schema';

alter table public.host_requests add column if not exists email text;
alter table public.host_requests add column if not exists driver_license text;
alter table public.host_requests add column if not exists phone text;
alter table public.host_requests add column if not exists location text;
alter table public.host_requests add column if not exists terms_accepted boolean default false;
alter table public.host_requests add column if not exists terms_version text default 'host-v1';

notify pgrst, 'reload schema';