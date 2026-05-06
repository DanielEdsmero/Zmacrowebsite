-- Add premium/stripe fields to macros
alter table macros
  add column if not exists is_premium boolean not null default false,
  add column if not exists stripe_price_id text;

-- Purchases table: one row per completed Stripe checkout
create table if not exists purchases (
  id              uuid        primary key default gen_random_uuid(),
  macro_id        uuid        not null references macros(id) on delete cascade,
  stripe_session_id text      not null unique,
  buyer_email     text,
  download_token  uuid        not null default gen_random_uuid(),
  amount_paid     integer,       -- in cents
  created_at      timestamptz not null default now()
);

create index if not exists purchases_stripe_session_id_idx on purchases(stripe_session_id);
create index if not exists purchases_download_token_idx on purchases(download_token);
create index if not exists purchases_macro_id_idx on purchases(macro_id);

-- No public RLS on purchases — service role only
alter table purchases enable row level security;
