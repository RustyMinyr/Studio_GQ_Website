-- Studio GQ booking system for Turso / SQLite.
-- Apply once using `npm run turso:migrate` after adding local Turso credentials.

pragma foreign_keys = on;

create table if not exists studio_booking_groups (
  id text primary key,
  request_id text not null unique,
  payload_hash text not null,
  created_at text not null
);

create table if not exists studio_bookings (
  id text primary key,
  booking_group_id text not null references studio_booking_groups(id) on delete cascade,
  booking_date text not null,
  session text not null check (session in ('morning', 'afternoon', 'full_day')),
  name text not null,
  company text,
  email text not null,
  phone text not null,
  additional_items text not null default '[]',
  message text not null,
  price_zar integer not null check (price_zar in (2500, 4500)),
  status text not null check (status in ('pending', 'confirmed', 'cancelled', 'expired')),
  hold_expires_at text,
  created_at text not null,
  updated_at text not null,
  check ((status = 'pending' and hold_expires_at is not null) or (status <> 'pending' and hold_expires_at is null))
);

create index if not exists studio_bookings_booking_date_idx on studio_bookings (booking_date);
create index if not exists studio_bookings_group_idx on studio_bookings (booking_group_id);
create index if not exists studio_bookings_pending_hold_idx on studio_bookings (hold_expires_at) where status = 'pending';

create table if not exists studio_calendar_blocks (
  id text primary key,
  booking_date text not null,
  session text not null check (session in ('morning', 'afternoon', 'full_day')),
  title text not null,
  note text,
  created_at text not null,
  updated_at text not null
);

create index if not exists studio_calendar_blocks_booking_date_idx on studio_calendar_blocks (booking_date);

create table if not exists studio_booking_slots (
  id integer primary key,
  booking_id text references studio_bookings(id) on delete cascade,
  block_id text references studio_calendar_blocks(id) on delete cascade,
  booking_date text not null,
  slot text not null check (slot in ('morning', 'afternoon')),
  created_at text not null,
  unique (booking_date, slot),
  check ((booking_id is not null and block_id is null) or (booking_id is null and block_id is not null))
);

create index if not exists studio_booking_slots_booking_idx on studio_booking_slots (booking_id);
create index if not exists studio_booking_slots_block_idx on studio_booking_slots (block_id);
