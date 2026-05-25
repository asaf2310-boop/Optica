-- Optica — optional seed (run after schema.sql and Auth users exist)
-- Create Auth users in Dashboard first (see README), then run this file.

-- Sample availability for the next ~3 weeks (same slot pattern as demo)
do $$
declare
  opto record;
  d date;
  day_offset int;
  default_slots text[] := array[
    '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
  ];
  offsets int[] := array[1, 2, 3, 5, 7, 9, 12, 15, 18, 21];
begin
  for opto in select id from optometrists loop
    foreach day_offset in array offsets loop
      d := (current_date + day_offset)::date;
      insert into availability (optometrist_id, date, slots, is_active)
      values (opto.id, d, default_slots, true)
      on conflict (optometrist_id, date) do nothing;
    end loop;
  end loop;
end $$;

-- Link Auth users to profiles (emails: {username}@optica.app)
insert into profiles (id, username, role, full_name, optometrist_id)
select
  u.id,
  split_part(u.email, '@', 1) as username,
  case split_part(u.email, '@', 1)
    when 'admin' then 'admin'
    when 'optica' then 'admin'
    else 'staff'
  end as role,
  case split_part(u.email, '@', 1)
    when 'admin' then 'מנהל מערכת'
    when 'optica' then 'אופטיקה (בדיקות)'
    when 'yossi' then 'יוסי כהן'
    when 'michal' then 'מיכל לוי'
    when 'dana' then 'דנה אברהם'
    else split_part(u.email, '@', 1)
  end as full_name,
  case split_part(u.email, '@', 1)
    when 'optica' then 'opto_1'
    when 'yossi' then 'opto_1'
    when 'michal' then 'opto_2'
    when 'dana' then 'opto_3'
    else null
  end as optometrist_id
from auth.users u
where u.email like '%@optica.app'
on conflict (id) do update set
  username = excluded.username,
  role = excluded.role,
  full_name = excluded.full_name,
  optometrist_id = excluded.optometrist_id;
