-- Migration: optometrist reassignment email flow
-- Run in Supabase SQL Editor if schema.sql was already applied without these columns.

alter table public.appointments drop constraint if exists appointments_status_check;

alter table public.appointments
  add column if not exists reassignment_token uuid unique,
  add column if not exists previous_optometrist_id text references public.optometrists(id) on delete set null,
  add column if not exists previous_optometrist_name text;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'pending_reassignment'));

create index if not exists idx_appointments_reassignment_token
  on public.appointments(reassignment_token)
  where reassignment_token is not null;

-- Functions: copy from schema.sql (get_appointment_by_reassignment_token, respond_to_reassignment)
