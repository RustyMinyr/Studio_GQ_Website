-- Studio GQ booking ledger and atomic slot reservation.
-- Apply this migration with the Supabase CLI or paste it into the SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.studio_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_date date not null,
  session text not null check (session in ('morning', 'afternoon', 'full_day')),
  name text not null check (char_length(name) between 2 and 100),
  company text check (company is null or char_length(company) <= 120),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) between 7 and 30),
  additional_items text[] not null default '{}',
  message text not null check (char_length(message) between 20 and 2000),
  price_zar integer not null check (price_zar in (2500, 4500)),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_booking_slots (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.studio_bookings(id) on delete cascade,
  booking_date date not null,
  slot text not null check (slot in ('morning', 'afternoon')),
  created_at timestamptz not null default now(),
  constraint studio_booking_slots_date_slot_key unique (booking_date, slot)
);

create index if not exists studio_bookings_booking_date_idx
  on public.studio_bookings (booking_date);

alter table public.studio_bookings enable row level security;
alter table public.studio_booking_slots enable row level security;

revoke all on table public.studio_bookings from anon, authenticated;
revoke all on table public.studio_booking_slots from anon, authenticated;

create or replace function public.create_studio_booking(
  p_booking_date date,
  p_session text,
  p_name text,
  p_company text,
  p_email text,
  p_phone text,
  p_additional_items text[],
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking_id uuid;
  v_price_zar integer;
begin
  if p_booking_date < (now() at time zone 'Africa/Johannesburg')::date then
    raise exception 'Booking date cannot be in the past' using errcode = '22023';
  end if;

  if p_session not in ('morning', 'afternoon', 'full_day') then
    raise exception 'Invalid session' using errcode = '22023';
  end if;

  if not coalesce(p_additional_items, '{}') <@ array[
    'studio_flashes',
    'constant_lighting',
    'green_screen',
    'catering',
    'audio_recording',
    'live_streaming',
    'videographer',
    'photographer'
  ]::text[] then
    raise exception 'Invalid additional item' using errcode = '22023';
  end if;

  v_price_zar := case when p_session = 'full_day' then 4500 else 2500 end;

  insert into public.studio_bookings (
    booking_date,
    session,
    name,
    company,
    email,
    phone,
    additional_items,
    message,
    price_zar
  )
  values (
    p_booking_date,
    p_session,
    p_name,
    nullif(trim(p_company), ''),
    p_email,
    p_phone,
    coalesce(p_additional_items, '{}'),
    p_message,
    v_price_zar
  )
  returning id into v_booking_id;

  if p_session in ('morning', 'full_day') then
    insert into public.studio_booking_slots (booking_id, booking_date, slot)
    values (v_booking_id, p_booking_date, 'morning');
  end if;

  if p_session in ('afternoon', 'full_day') then
    insert into public.studio_booking_slots (booking_id, booking_date, slot)
    values (v_booking_id, p_booking_date, 'afternoon');
  end if;

  return v_booking_id;
end;
$$;

revoke all on function public.create_studio_booking(date, text, text, text, text, text, text[], text)
  from public, anon, authenticated;
grant execute on function public.create_studio_booking(date, text, text, text, text, text, text[], text)
  to service_role;

grant select on table public.studio_booking_slots to service_role;
grant select, insert, update, delete on table public.studio_bookings to service_role;
grant usage, select on sequence public.studio_booking_slots_id_seq to service_role;
