create table public.demo_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  first_name    text not null,
  last_name     text not null,
  business_name text not null,
  venue_type    text not null,
  num_sites     integer not null,
  postcode      text not null,
  email         text not null,
  phone         text not null
);

-- Only the service role can read/write (submissions go through the edge function).
-- The service role bypasses RLS by design — no policies are needed.
alter table public.demo_requests enable row level security;
