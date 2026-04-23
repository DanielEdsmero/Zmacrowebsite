-- Page view tracking for analytics dashboard.
create table if not exists page_views (
  id          uuid        primary key default gen_random_uuid(),
  path        text        not null,
  macro_id    uuid        references macros(id) on delete set null,
  ip          text,
  user_agent  text,
  viewed_at   timestamptz default now()
);

create index if not exists page_views_viewed_at_idx
  on page_views (viewed_at desc);

create index if not exists page_views_path_viewed_at_idx
  on page_views (path, viewed_at desc);

alter table page_views enable row level security;
-- No public policies: only the service role may read or write.
