create table if not exists public.store_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id bigint not null,
  created_at timestamptz not null default now()
);

create unique index if not exists store_favorites_user_store_idx
  on public.store_favorites (user_id, store_id);

alter table public.store_favorites enable row level security;

drop policy if exists "users_manage_own_store_favorites" on public.store_favorites;
create policy "users_manage_own_store_favorites"
  on public.store_favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "service_role_store_favorites" on public.store_favorites;
create policy "service_role_store_favorites"
  on public.store_favorites
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.store_reviews (
  id uuid primary key default gen_random_uuid(),
  store_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create unique index if not exists store_reviews_store_user_idx
  on public.store_reviews (store_id, user_id);

alter table public.store_reviews enable row level security;

drop policy if exists "anyone_select_reviews" on public.store_reviews;
create policy "anyone_select_reviews"
  on public.store_reviews
  for select
  using (true);

drop policy if exists "users_upsert_own_reviews" on public.store_reviews;
create policy "users_upsert_own_reviews"
  on public.store_reviews
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "users_update_own_reviews" on public.store_reviews;
create policy "users_update_own_reviews"
  on public.store_reviews
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "service_role_store_reviews" on public.store_reviews;
create policy "service_role_store_reviews"
  on public.store_reviews
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "public_insert_waitlist" on public.waitlist;
create policy "public_insert_waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public_update_waitlist" on public.waitlist;
create policy "public_update_waitlist"
  on public.waitlist
  for update
  to anon, authenticated
  using (true)
  with check (true);
