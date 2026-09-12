-- Safe production migration for host vehicle listings.
-- This only adds missing columns and preserves existing fleet rows.

alter table public.fleet
  add column if not exists host_id uuid references public.profiles(id) on delete set null;

alter table public.fleet
  add column if not exists approved boolean default true;

alter table public.fleet
  add column if not exists interior_images text[] default '{}';

-- Existing admin vehicles remain visible; new host listings are inserted as
-- pending by the backend with approved = false.
update public.fleet
set approved = true
where approved is null;

notify pgrst, 'reload schema';