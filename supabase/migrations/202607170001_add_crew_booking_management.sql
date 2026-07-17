-- Simple crew-portal operations for Studio GQ.
--
-- This keeps the public availability contract intact: every active booking or
-- studio block owns one or both rows in studio_booking_slots. Public calendar
-- reads therefore continue to query the same slot ledger.

alter table public.studio_bookings
  add column if not exists hold_expires_at timestamptz;

-- Existing pending enquiries receive the same 48-hour window from their
-- original submission time. The expiry function below will release any that
-- have already elapsed when it first runs.
update public.studio_bookings
set hold_expires_at = created_at + interval '48 hours'
where status = 'pending'
  and hold_expires_at is null;

alter table public.studio_bookings
  drop constraint if exists studio_bookings_status_check;

alter table public.studio_bookings
  add constraint studio_bookings_status_check
  check (status in ('pending', 'confirmed', 'cancelled', 'expired'));

alter table public.studio_bookings
  drop constraint if exists studio_bookings_pending_hold_check;

alter table public.studio_bookings
  add constraint studio_bookings_pending_hold_check
  check (
    (status = 'pending' and hold_expires_at is not null)
    or (status <> 'pending' and hold_expires_at is null)
  );

create index if not exists studio_bookings_pending_hold_expires_idx
  on public.studio_bookings (hold_expires_at)
  where status = 'pending';

-- A calendar block is an internal studio hold (maintenance, private use, and
-- so on), not a client booking. It shares the slot ledger with bookings so a
-- block can never overlap a public reservation.
create table if not exists public.studio_calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  booking_date date not null,
  session text not null check (session in ('morning', 'afternoon', 'full_day')),
  title text not null check (char_length(trim(title)) between 2 and 100),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_calendar_blocks_booking_date_idx
  on public.studio_calendar_blocks (booking_date);

alter table public.studio_calendar_blocks enable row level security;
revoke all on table public.studio_calendar_blocks from anon, authenticated;
grant select on table public.studio_calendar_blocks to service_role;

alter table public.studio_booking_slots
  alter column booking_id drop not null,
  add column if not exists block_id uuid references public.studio_calendar_blocks(id) on delete cascade;

alter table public.studio_booking_slots
  drop constraint if exists studio_booking_slots_booking_or_block_check;

alter table public.studio_booking_slots
  add constraint studio_booking_slots_booking_or_block_check
  check (num_nonnulls(booking_id, block_id) = 1);

create index if not exists studio_booking_slots_block_id_idx
  on public.studio_booking_slots (block_id)
  where block_id is not null;

drop trigger if exists studio_calendar_blocks_set_updated_at on public.studio_calendar_blocks;
create trigger studio_calendar_blocks_set_updated_at
before update on public.studio_calendar_blocks
for each row execute function public.set_studio_booking_updated_at();

-- Releases all unreviewed public enquiries whose temporary 48-hour hold has
-- elapsed. The optional pg_cron registration below runs it every 15 minutes
-- when the Supabase project has pg_cron enabled.
create or replace function public.expire_studio_booking_holds(
  p_reference_time timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expired_count integer;
begin
  with expired_bookings as (
    update public.studio_bookings
    set status = 'expired',
        hold_expires_at = null
    where status = 'pending'
      and hold_expires_at <= p_reference_time
    returning id
  ), released_slots as (
    delete from public.studio_booking_slots
    where booking_id in (select id from expired_bookings)
  )
  select count(*) into v_expired_count
  from expired_bookings;

  return v_expired_count;
end;
$$;

drop function if exists public.create_studio_booking(
  uuid,
  date,
  text,
  text,
  text,
  text,
  text,
  text[],
  text
);

create or replace function public.create_studio_booking(
  p_request_id uuid,
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
  v_existing public.studio_bookings%rowtype;
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

  perform public.expire_studio_booking_holds();
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select *
  into v_existing
  from public.studio_bookings
  where request_id = p_request_id;

  if found then
    if v_existing.status in ('cancelled', 'expired') then
      raise exception 'request_id_unavailable' using errcode = 'P0001';
    end if;

    if v_existing.booking_date = p_booking_date
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

  v_price_zar := case when p_session = 'full_day' then 4500 else 2500 end;

  insert into public.studio_bookings (
    request_id,
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
  )
  values (
    p_request_id,
    p_booking_date,
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

create or replace function public.confirm_studio_booking(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.studio_bookings%rowtype;
begin
  perform public.expire_studio_booking_holds();

  select * into v_booking
  from public.studio_bookings
  where id = p_booking_id
  for update;

  if not found then
    return false;
  end if;

  if v_booking.status = 'confirmed' then
    return true;
  end if;

  if v_booking.status <> 'pending' then
    return false;
  end if;

  update public.studio_bookings
  set status = 'confirmed',
      hold_expires_at = null
  where id = p_booking_id;

  return true;
end;
$$;

create or replace function public.cancel_studio_booking(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.studio_bookings
  where id = p_booking_id
  for update;

  if not found then
    return false;
  end if;

  if v_status = 'cancelled' then
    return true;
  end if;

  if v_status not in ('pending', 'confirmed') then
    return false;
  end if;

  update public.studio_bookings
  set status = 'cancelled',
      hold_expires_at = null
  where id = p_booking_id;

  delete from public.studio_booking_slots
  where booking_id = p_booking_id;

  return true;
end;
$$;

create or replace function public.reschedule_studio_booking(
  p_booking_id uuid,
  p_booking_date date,
  p_session text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.studio_bookings%rowtype;
  v_price_zar integer;
begin
  if p_booking_date < (now() at time zone 'Africa/Johannesburg')::date then
    raise exception 'Booking date cannot be in the past' using errcode = '22023';
  end if;

  if p_session not in ('morning', 'afternoon', 'full_day') then
    raise exception 'Invalid session' using errcode = '22023';
  end if;

  perform public.expire_studio_booking_holds();

  select * into v_booking
  from public.studio_bookings
  where id = p_booking_id
  for update;

  if not found or v_booking.status not in ('pending', 'confirmed') then
    return false;
  end if;

  v_price_zar := case when p_session = 'full_day' then 4500 else 2500 end;

  -- The function is transactional: if the new slots conflict, the delete and
  -- the booking update are rolled back, preserving the original reservation.
  delete from public.studio_booking_slots where booking_id = p_booking_id;

  if p_session in ('morning', 'full_day') then
    insert into public.studio_booking_slots (booking_id, booking_date, slot)
    values (p_booking_id, p_booking_date, 'morning');
  end if;

  if p_session in ('afternoon', 'full_day') then
    insert into public.studio_booking_slots (booking_id, booking_date, slot)
    values (p_booking_id, p_booking_date, 'afternoon');
  end if;

  update public.studio_bookings
  set booking_date = p_booking_date,
      session = p_session,
      price_zar = v_price_zar
  where id = p_booking_id;

  return true;
end;
$$;

create or replace function public.create_studio_calendar_block(
  p_booking_date date,
  p_session text,
  p_title text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_block_id uuid;
begin
  if p_booking_date < (now() at time zone 'Africa/Johannesburg')::date then
    raise exception 'Block date cannot be in the past' using errcode = '22023';
  end if;

  if p_session not in ('morning', 'afternoon', 'full_day') then
    raise exception 'Invalid session' using errcode = '22023';
  end if;

  insert into public.studio_calendar_blocks (booking_date, session, title, note)
  values (p_booking_date, p_session, trim(p_title), nullif(trim(p_note), ''))
  returning id into v_block_id;

  if p_session in ('morning', 'full_day') then
    insert into public.studio_booking_slots (block_id, booking_date, slot)
    values (v_block_id, p_booking_date, 'morning');
  end if;

  if p_session in ('afternoon', 'full_day') then
    insert into public.studio_booking_slots (block_id, booking_date, slot)
    values (v_block_id, p_booking_date, 'afternoon');
  end if;

  return v_block_id;
end;
$$;

create or replace function public.reschedule_studio_calendar_block(
  p_block_id uuid,
  p_booking_date date,
  p_session text,
  p_title text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_block public.studio_calendar_blocks%rowtype;
begin
  if p_booking_date < (now() at time zone 'Africa/Johannesburg')::date then
    raise exception 'Block date cannot be in the past' using errcode = '22023';
  end if;

  if p_session not in ('morning', 'afternoon', 'full_day') then
    raise exception 'Invalid session' using errcode = '22023';
  end if;

  select * into v_block
  from public.studio_calendar_blocks
  where id = p_block_id
  for update;

  if not found then
    return false;
  end if;

  delete from public.studio_booking_slots where block_id = p_block_id;

  if p_session in ('morning', 'full_day') then
    insert into public.studio_booking_slots (block_id, booking_date, slot)
    values (p_block_id, p_booking_date, 'morning');
  end if;

  if p_session in ('afternoon', 'full_day') then
    insert into public.studio_booking_slots (block_id, booking_date, slot)
    values (p_block_id, p_booking_date, 'afternoon');
  end if;

  update public.studio_calendar_blocks
  set booking_date = p_booking_date,
      session = p_session,
      title = trim(p_title),
      note = nullif(trim(p_note), '')
  where id = p_block_id;

  return true;
end;
$$;

create or replace function public.cancel_studio_calendar_block(p_block_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.studio_calendar_blocks
  where id = p_block_id;

  return found;
end;
$$;

-- Do not require pg_cron just to apply this migration. When it is enabled in
-- Supabase, register a single recurring hold-expiry job. The booking creation
-- and crew-read functions also run expiry defensively, so no stale hold can
-- be confirmed while the scheduled job is unavailable.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (
      select 1
      from cron.job
      where jobname = 'expire-studio-booking-holds'
    ) then
      perform cron.schedule(
        'expire-studio-booking-holds',
        '*/15 * * * *',
        'select public.expire_studio_booking_holds();'
      );
    end if;
  else
    raise notice 'pg_cron is not enabled; schedule public.expire_studio_booking_holds() every 15 minutes after enabling it.';
  end if;
exception
  when insufficient_privilege then
    raise notice 'Unable to register the hold-expiry cron job; schedule public.expire_studio_booking_holds() every 15 minutes in Supabase.';
end;
$$;

revoke all on function public.expire_studio_booking_holds(timestamptz)
  from public, anon, authenticated;
revoke all on function public.create_studio_booking(uuid, date, text, text, text, text, text, text[], text)
  from public, anon, authenticated;
revoke all on function public.confirm_studio_booking(uuid)
  from public, anon, authenticated;
revoke all on function public.cancel_studio_booking(uuid)
  from public, anon, authenticated;
revoke all on function public.reschedule_studio_booking(uuid, date, text)
  from public, anon, authenticated;
revoke all on function public.create_studio_calendar_block(date, text, text, text)
  from public, anon, authenticated;
revoke all on function public.reschedule_studio_calendar_block(uuid, date, text, text, text)
  from public, anon, authenticated;
revoke all on function public.cancel_studio_calendar_block(uuid)
  from public, anon, authenticated;

grant execute on function public.expire_studio_booking_holds(timestamptz) to service_role;
grant execute on function public.create_studio_booking(uuid, date, text, text, text, text, text, text[], text) to service_role;
grant execute on function public.confirm_studio_booking(uuid) to service_role;
grant execute on function public.cancel_studio_booking(uuid) to service_role;
grant execute on function public.reschedule_studio_booking(uuid, date, text) to service_role;
grant execute on function public.create_studio_calendar_block(date, text, text, text) to service_role;
grant execute on function public.reschedule_studio_calendar_block(uuid, date, text, text, text) to service_role;
grant execute on function public.cancel_studio_calendar_block(uuid) to service_role;

grant select on table public.studio_bookings, public.studio_booking_slots to service_role;
