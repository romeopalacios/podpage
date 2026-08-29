-- Run this entire file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.review_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 100),
  body text not null check (char_length(body) between 10 and 2000),
  author text not null check (char_length(author) between 2 and 80),
  email text not null check (char_length(email) between 3 and 254),
  rating smallint not null check (rating between 1 and 5),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);

create table if not exists public.public_reviews (
  id uuid primary key references public.review_submissions(id) on delete cascade,
  title text not null,
  body text not null,
  author text not null,
  rating smallint not null,
  created_at timestamptz not null
);

alter table public.review_submissions enable row level security;
alter table public.public_reviews enable row level security;

revoke all on public.review_submissions from anon, authenticated;
revoke all on public.public_reviews from anon, authenticated;
grant insert on public.review_submissions to anon;
grant select, update on public.review_submissions to authenticated;
grant select on public.public_reviews to anon, authenticated;

drop policy if exists "Anyone can submit a pending review" on public.review_submissions;
create policy "Anyone can submit a pending review"
on public.review_submissions for insert to anon
with check (status = 'pending' and moderated_at is null);

drop policy if exists "Admin can read submissions" on public.review_submissions;
create policy "Admin can read submissions"
on public.review_submissions for select to authenticated
using ((auth.jwt() ->> 'email') = 'uncoveredlegacypodcast@gmail.com');

drop policy if exists "Admin can moderate submissions" on public.review_submissions;
create policy "Admin can moderate submissions"
on public.review_submissions for update to authenticated
using ((auth.jwt() ->> 'email') = 'uncoveredlegacypodcast@gmail.com')
with check ((auth.jwt() ->> 'email') = 'uncoveredlegacypodcast@gmail.com');

drop policy if exists "Approved reviews are public" on public.public_reviews;
create policy "Approved reviews are public"
on public.public_reviews for select to anon, authenticated
using (true);

create or replace function public.publish_moderated_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' then
    new.moderated_at = coalesce(new.moderated_at, now());
    insert into public.public_reviews (id, title, body, author, rating, created_at)
    values (new.id, new.title, new.body, new.author, new.rating, new.created_at)
    on conflict (id) do update set
      title = excluded.title,
      body = excluded.body,
      author = excluded.author,
      rating = excluded.rating;
  elsif new.status = 'rejected' then
    new.moderated_at = coalesce(new.moderated_at, now());
    delete from public.public_reviews where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists publish_review_after_moderation on public.review_submissions;
create trigger publish_review_after_moderation
before update on public.review_submissions
for each row execute function public.publish_moderated_review();

create index if not exists review_submissions_status_created_idx
on public.review_submissions (status, created_at desc);

create index if not exists public_reviews_created_idx
on public.public_reviews (created_at desc);
