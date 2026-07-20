-- Atomically reserve one session across multiple selected Studio GQ dates.
-- Apply this migration in the Supabase SQL Editor after the existing migrations.

create table if not exists public.studio_booking_groups (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  booking_dates date[] not null check (cardinality(booking_dates) between 1 and 14),
  session text not null check (session in ('morning', 'afternoon', 'full_day')),
  name text not null check (char_length(name) between 2 and 100),
  company text check (company is null or char_length(company) <= 120),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) between 7 and 30),
  additional_items text[] not null default '{}',
  message text not null check (char_length(message) between 20 and 2000),
  created_at timestamptz not null default now()
);

alter table public.studio_booking_groups enable row level security;
revoke all on table public.studio_booking_groups from anon, authenticated;
grant select on table public.studio_booking_groups to service_role;

alter table public.studio_bookings
  add column if not exists booking_group_id uuid references public.studio_booking_groups(id) on delete set null;

create index if not exists studio_bookings_booking_group_id_idx
  on public.studio_bookings (booking_group_id)
  where booking_group_id is not null;

create or replace function public.create_studio_booking_group(
  p_request_id uuid,
  p_booking_dates date[],
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
  v_group_id uuid;
  v_booking_id uuid;
  v_existing public.studio_booking_groups%rowtype;
  v_booking_date date;
  v_booking_dates date[];
  v_additional_items text[];
  v_company text;
  v_email text;
  v_message text;
  v_name text;
  v_phone text;
  v_price_zar integer;
begin
  if p_request_id is null then
    raise exception 'Request identifier is required' using errcode = '22023';
  end if;

  if p_session not in ('morning', 'afternoon', 'full_day') then
    raise exception 'Invalid session' using errcode = '22023';
  end if;

  if cardinality(p_booking_dates) is null or cardinality(p_booking_dates) < 1 or cardinality(p_booking_dates) > 14 then
    raise exception 'Choose between one and fourteen booking dates' using errcode = '22023';
  end if;

  select array_agg(booking_date order by booking_date)
  into v_booking_dates
  from (
    select distinct booking_date
    from unnest(p_booking_dates) as selected_dates(booking_date)
  ) dates;

  if cardinality(v_booking_dates) <> cardinality(p_booking_dates) then
    raise exception 'Booking dates must be unique' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(v_booking_dates) as selected_dates(booking_date)
    where booking_date < (now() at time zone 'Africa/Johannesburg')::date
  ) then
    raise exception 'Booking date cannot be in the past' using errcode = '22023';
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

  v_additional_items := array(
    select distinct item
    from unnest(coalesce(p_additional_items, '{}')) as item
    order by item
  );
  v_company := nullif(trim(p_company), '');
  v_email := trim(p_email);
  v_message := trim(p_message);
  v_name := trim(p_name);
  v_phone := trim(p_phone);
  v_price_zar := case when p_session = 'full_day' then 4500 else 2500 end;

  perform public.expire_studio_booking_holds();
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select *
  into v_existing
  from public.studio_booking_groups
  where request_id = p_request_id;

  if found then
    if v_existing.booking_dates = v_booking_dates
      and v_existing.session = p_session
      and v_existing.name = v_name
      and v_existing.company is not distinct from v_company
      and v_existing.email = v_email
      and v_existing.phone = v_phone
      and v_existing.additional_items = v_additional_items
      and v_existing.message = v_message then
      return v_existing.id;
    end if;

    raise exception 'request_id_payload_mismatch' using errcode = 'P0001';
  end if;

  insert into public.studio_booking_groups (
    request_id,
    booking_dates,
    session,
    name,
    company,
    email,
    phone,
    additional_items,
    message
  ) values (
    p_request_id,
    v_booking_dates,
    p_session,
    v_name,
    v_company,
    v_email,
    v_phone,
    v_additional_items,
    v_message
  ) returning id into v_group_id;

  foreach v_booking_date in array v_booking_dates loop
    insert into public.studio_bookings (
      request_id,
      booking_group_id,
      booking_date,
      session,
      name,
      company,
      email,
      phone,
      additional_items,
      message,
      price_zar,
      status,
      hold_expires_at
    ) values (
      gen_random_uuid(),
      v_group_id,
      v_booking_date,
      p_session,
      v_name,
      v_company,
      v_email,
      v_phone,
      v_additional_items,
      v_message,
      v_price_zar,
      'pending',
      now() + interval '48 hours'
    ) returning id into v_booking_id;

    if p_session in ('morning', 'full_day') then
      insert into public.studio_booking_slots (booking_id, booking_date, slot)
      values (v_booking_id, v_booking_date, 'morning');
    end if;

    if p_session in ('afternoon', 'full_day') then
      insert into public.studio_booking_slots (booking_id, booking_date, slot)
      values (v_booking_id, v_booking_date, 'afternoon');
    end if;
  end loop;

  return (select id from public.studio_booking_groups where request_id = p_request_id);
end;
$$;

revoke all on function public.create_studio_booking_group(
  uuid, date[], text, text, text, text, text, text[], text
) from public, anon, authenticated;
grant execute on function public.create_studio_booking_group(
  uuid, date[], text, text, text, text, text, text[], text
) to service_role;
