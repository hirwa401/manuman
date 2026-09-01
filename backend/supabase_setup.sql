-- Drop existing tables if any
drop table if exists ratings;
drop table if exists contacts;
drop table if exists bookings;
drop table if exists fleet;
drop table if exists profiles;

-- PROFILES TABLE (linked to Supabase Auth users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  phone text,
  role text default 'customer' check(role in ('customer','host','admin')),
  created_at timestamptz default now()
);

-- FLEET TABLE
create table fleet (
  id uuid default gen_random_uuid() primary key,
  host_id uuid references profiles(id) on delete set null,
  year text not null,
  make text not null,
  model text not null,
  category text not null,
  price numeric not null,
  image_url text,
  features text[],
  available boolean default true,
  approved boolean default false,
  created_at timestamptz default now()
);

-- BOOKINGS TABLE
create table bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  pickup text not null,
  pickup_date date not null,
  return_date date not null,
  vehicle_id text not null,
  vehicle_name text,
  customer_name text,
  customer_email text,
  customer_phone text,
  driver_license text,
  driver_license_image text,
  terms_accepted boolean default false,
  payment_method text default 'cash',
  total_amount numeric default 0,
  delivery_fee numeric default 0,
  status text default 'pending',
  created_at timestamptz default now()
);

-- CONTACTS TABLE
create table contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz default now()
);

-- RATINGS TABLE
create table ratings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  name text,
  rating integer not null check(rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table fleet enable row level security;
alter table bookings enable row level security;
alter table contacts enable row level security;
alter table ratings enable row level security;

create policy "Allow all" on profiles for all using (true) with check (true);
create policy "Allow all" on fleet for all using (true) with check (true);
create policy "Allow all" on bookings for all using (true) with check (true);
create policy "Allow all" on contacts for all using (true) with check (true);
create policy "Allow all" on ratings for all using (true) with check (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SEED DEFAULT FLEET (approved by default for admin cars)
insert into fleet (year, make, model, category, price, image_url, features, approved) values
  ('2022', 'Toyota', 'RAV4 Hybrid', 'SUV', 75, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80', ARRAY['Fuel Efficient Hybrid','All-Wheel Drive (AWD)','Spacious & Comfortable','Ideal for All Seasons'], true),
  ('2017', 'Honda', 'Odyssey XL', 'MINIVAN', 85, 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80', ARRAY['8-Passenger Seating','Power Sliding Doors','Tri-Zone Climate Control','Perfect for Family Trips'], true),
  ('2018', 'Chevrolet', 'Cruze', 'SEDAN', 55, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80', ARRAY['Great on Gas','Easy to Park','Smooth & Reliable','Perfect for Daily Use'], true);
