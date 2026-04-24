-- Reviews for macros (anonymous, no login required)

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  macro_id uuid not null references macros(id) on delete cascade,
  author_name text not null default 'Anonymous',
  rating int not null,
  body text,
  safety_vote text,
  ip text,
  created_at timestamptz default now(),
  constraint reviews_rating_check check (rating >= 1 and rating <= 5),
  constraint reviews_safety_vote_check check (
    safety_vote is null or safety_vote in ('safe', 'virus', 'unsure')
  ),
  constraint reviews_author_name_length check (length(author_name) <= 50),
  constraint reviews_body_length check (body is null or length(body) <= 1000)
);

create index if not exists reviews_macro_id_created_at_idx
  on reviews (macro_id, created_at desc);

create index if not exists reviews_created_at_idx
  on reviews (created_at desc);

alter table reviews enable row level security;

drop policy if exists "public can read reviews" on reviews;
create policy "public can read reviews"
  on reviews for select
  using (true);

-- Insert allowed without login; DB constraints enforce the rules.
drop policy if exists "public can insert reviews" on reviews;
create policy "public can insert reviews"
  on reviews for insert
  with check (
    rating >= 1 and rating <= 5
    and length(author_name) <= 50
    and (body is null or length(body) <= 1000)
    and (safety_vote is null or safety_vote in ('safe', 'virus', 'unsure'))
  );
