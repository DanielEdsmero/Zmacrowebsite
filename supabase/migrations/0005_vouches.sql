-- Community vouches: screenshot proof uploads (no login required)

create table if not exists vouches (
  id uuid primary key default gen_random_uuid(),
  macro_id uuid references macros(id) on delete set null,
  image_url text not null,
  caption text,
  author_name text not null default 'Anonymous',
  ip text,
  created_at timestamptz default now(),
  constraint vouches_author_name_length check (length(author_name) <= 50),
  constraint vouches_caption_length check (caption is null or length(caption) <= 300)
);

create index if not exists vouches_created_at_idx on vouches (created_at desc);
create index if not exists vouches_macro_id_idx on vouches (macro_id);

alter table vouches enable row level security;

drop policy if exists "public can read vouches" on vouches;
create policy "public can read vouches"
  on vouches for select
  using (true);

drop policy if exists "public can insert vouches" on vouches;
create policy "public can insert vouches"
  on vouches for insert
  with check (
    length(author_name) <= 50
    and (caption is null or length(caption) <= 300)
  );
