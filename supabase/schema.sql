-- Optica — Supabase schema (run in SQL Editor)
-- Service role key: migrations only — never in the Vite frontend.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists optometrists (
  id text primary key,
  name text not null,
  title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  optometrist_id text not null references optometrists(id) on delete cascade,
  date date not null,
  slots text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (optometrist_id, date)
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  patient_phone text not null,
  patient_email text,
  optometrist_id text not null references optometrists(id),
  optometrist_name text not null,
  date date not null,
  time text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'pending_reassignment')),
  marketing_consent boolean not null default false,
  notes text,
  reassignment_token uuid unique,
  previous_optometrist_id text references optometrists(id) on delete set null,
  previous_optometrist_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_reassignment_token
  on appointments(reassignment_token)
  where reassignment_token is not null;

-- Staff profiles (linked to Supabase Auth users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null check (role in ('admin', 'staff')),
  full_name text not null,
  optometrist_id text references optometrists(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint staff_has_optometrist check (
    role = 'admin' or optometrist_id is not null
  )
);

create index if not exists idx_availability_opto_date on availability(optometrist_id, date);
create index if not exists idx_appointments_opto_date on appointments(optometrist_id, date);
create index if not exists idx_appointments_date on appointments(date);
create index if not exists idx_profiles_username on profiles(username);

-- ---------------------------------------------------------------------------
-- Seed optometrists
-- ---------------------------------------------------------------------------

insert into optometrists (id, name, title) values
  ('opto_1', 'ד"ר יוסי כהן', 'אופטומטריסט בכיר'),
  ('opto_2', 'ד"ר מיכל לוי', 'אופטומטריסטית'),
  ('opto_3', 'ד"ר דנה אברהם', 'אופטומטריסטית')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.my_optometrist_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select optometrist_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table optometrists enable row level security;
alter table availability enable row level security;
alter table appointments enable row level security;
alter table profiles enable row level security;

-- Optometrists: public read (booking UI)
drop policy if exists optometrists_select_public on optometrists;
create policy optometrists_select_public on optometrists
  for select using (true);

-- Availability: public read; staff/admin write scoped
drop policy if exists availability_select_public on availability;
create policy availability_select_public on availability
  for select using (true);

drop policy if exists availability_insert_staff on availability;
create policy availability_insert_staff on availability
  for insert to authenticated
  with check (
    public.is_admin()
    or optometrist_id = public.my_optometrist_id()
  );

drop policy if exists availability_update_staff on availability;
create policy availability_update_staff on availability
  for update to authenticated
  using (
    public.is_admin()
    or optometrist_id = public.my_optometrist_id()
  )
  with check (
    public.is_admin()
    or optometrist_id = public.my_optometrist_id()
  );

drop policy if exists availability_delete_staff on availability;
create policy availability_delete_staff on availability
  for delete to authenticated
  using (
    public.is_admin()
    or optometrist_id = public.my_optometrist_id()
  );

-- Appointments: anon read/insert for public booking; authenticated read is scoped
drop policy if exists appointments_select_public on appointments;
drop policy if exists appointments_select_anon on appointments;
create policy appointments_select_anon on appointments
  for select to anon
  using (true);

drop policy if exists appointments_select_authenticated on appointments;
create policy appointments_select_authenticated on appointments
  for select to authenticated
  using (
    public.is_admin()
    or optometrist_id = public.my_optometrist_id()
  );

drop policy if exists appointments_insert_public on appointments;
create policy appointments_insert_public on appointments
  for insert with check (true);

drop policy if exists appointments_update_staff on appointments;
create policy appointments_update_staff on appointments
  for update to authenticated
  using (
    public.is_admin()
    or optometrist_id = public.my_optometrist_id()
  )
  with check (
    public.is_admin()
    or optometrist_id = public.my_optometrist_id()
  );

drop policy if exists appointments_delete_staff on appointments;
create policy appointments_delete_staff on appointments
  for delete to authenticated
  using (
    public.is_admin()
    or optometrist_id = public.my_optometrist_id()
  );

-- Profiles: users read own row; admins read all
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Reassignment token (public respond links)
-- ---------------------------------------------------------------------------

create or replace function public.get_appointment_by_reassignment_token(p_token uuid)
returns setof appointments
language sql
stable
security definer
set search_path = public
as $$
  select * from public.appointments
  where reassignment_token = p_token
  limit 1;
$$;

create or replace function public.respond_to_reassignment(p_token uuid, p_action text)
returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  apt appointments%rowtype;
begin
  if p_action not in ('confirm', 'cancel') then
    raise exception 'invalid_action';
  end if;

  select * into apt from public.appointments
  where reassignment_token = p_token
  for update;

  if not found then
    raise exception 'invalid_token';
  end if;

  if p_action = 'confirm' then
    if apt.status = 'confirmed' and apt.reassignment_token is null then
      return apt;
    end if;
    if apt.status <> 'pending_reassignment' then
      raise exception 'invalid_state';
    end if;
    update public.appointments
    set status = 'confirmed', reassignment_token = null
    where id = apt.id
    returning * into apt;
    return apt;
  end if;

  if apt.status = 'cancelled' and apt.reassignment_token is null then
    return apt;
  end if;
  if apt.status <> 'pending_reassignment' then
    raise exception 'invalid_state';
  end if;

  update public.appointments
  set status = 'cancelled', reassignment_token = null
  where id = apt.id
  returning * into apt;

  return apt;
end;
$$;

revoke all on function public.get_appointment_by_reassignment_token(uuid) from public;
revoke all on function public.respond_to_reassignment(uuid, text) from public;
grant execute on function public.get_appointment_by_reassignment_token(uuid) to anon, authenticated;
grant execute on function public.respond_to_reassignment(uuid, text) to anon, authenticated;
