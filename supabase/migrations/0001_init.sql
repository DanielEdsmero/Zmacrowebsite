-- Z Macro — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

create table if not exists macros (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_description text not null,
  long_description text,
  version text not null,
  price_usd numeric default 0,
  cover_url text,
  file_path text not null,
  screenshots text[] default '{}',
  published boolean default false,
  download_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists macros_published_created_at_idx
  on macros (published, created_at desc);

create table if not exists download_logs (
  id uuid primary key default gen_random_uuid(),
  macro_id uuid references macros(id) on delete cascade,
  ip text,
  user_agent text,
  downloaded_at timestamptz default now()
);

create index if not exists download_logs_macro_id_downloaded_at_idx
  on download_logs (macro_id, downloaded_at desc);

-- Keep updated_at fresh on writes.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists macros_set_updated_at on macros;
create trigger macros_set_updated_at
  before update on macros
  for each row execute function set_updated_at();

-- Row Level Security.
-- The service-role key used by server code bypasses RLS; these policies only
-- constrain the anon / authenticated roles that reach the DB from the browser.
alter table macros enable row level security;
alter table download_logs enable row level security;

drop policy if exists "public can read published macros" on macros;
create policy "public can read published macros"
  on macros for select
  using (published = true);

-- No insert/update/delete policies for macros: only the service role may write.
-- No policies for download_logs: only the service role may read or write.
