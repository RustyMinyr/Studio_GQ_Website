-- Idempotent booking requests and explicit booking lifecycle operations.
-- Apply after 202607160001_create_studio_bookings.sql.

alter table public.studio_bookings
  add column if not exists request_id uuid;

update public.studio_bookings
set request_id = gen_random_uuid()
where request_id is null;

alter table public.studio_bookings
  alter column request_id set not null;

create unique index if not exists studio_bookings_request_id_key
  on public.studio_bookings (request_id);

create or replace function public.set_studio_booking_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists studio_bookings_set_updated_at on public.studio_bookings;
create trigger studio_bookings_set_updated_at
before update on public.studio_bookings
for each row execute function public.set_studio_booking_updated_at();

drop function if exists public.create_studio_booking(
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

  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select *
  into v_existing
  from public.studio_bookings
  where request_id = p_request_id;

  if found then
    if v_existing.status = 'cancelled' then
      raise exception 'request_id_cancelled' using errcode = 'P0001';
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
    price_zar
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

create or replace function public.confirm_studio_booking(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.studio_bookings
  set status = 'confirmed'
  where id = p_booking_id
    and status = 'pending';

  return found;
end;
$$;

create or replace function public.cancel_studio_booking(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.studio_bookings
  set status = 'cancelled'
  where id = p_booking_id
    and status in ('pending', 'confirmed');

  if not found then
    return false;
  end if;

  delete from public.studio_booking_slots
  where booking_id = p_booking_id;

  return true;
end;
$$;

revoke all on function public.create_studio_booking(
  uuid,
  date,
  text,
  text,
  text,
  text,
  text,
  text[],
  text
) from public, anon, authenticated;
grant execute on function public.create_studio_booking(
  uuid,
  date,
  text,
  text,
  text,
  text,
  text,
  text[],
  text
) to service_role;

revoke all on function public.confirm_studio_booking(uuid)
  from public, anon, authenticated;
grant execute on function public.confirm_studio_booking(uuid)
  to service_role;

revoke all on function public.cancel_studio_booking(uuid)
  from public, anon, authenticated;
grant execute on function public.cancel_studio_booking(uuid)
  to service_role;

-- Keep the service key on the public API path while preventing direct writes
-- that could desynchronise bookings from their reserved slots.
revoke insert, update, delete on table public.studio_bookings from service_role;
revoke usage, select on sequence public.studio_booking_slots_id_seq from service_role;
