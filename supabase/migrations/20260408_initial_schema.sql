-- ============================================================
-- Uppy Map — Initial Schema Migration
-- Created: 2026-04-08
-- Database: djbwmipyvqulhtacrsyh.supabase.co
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users primary key,
  username text unique,
  full_name text,
  phone text,
  avatar_url text,
  bio text,
  role text default 'customer',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "users_read_own_profile" on public.profiles for select using (auth.uid() = id);
create policy "users_insert_own_profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users_update_own_profile" on public.profiles for update using (auth.uid() = id);
create policy "service_role_profiles" on public.profiles for all using (true);

-- ── Waitlist ─────────────────────────────────────────────────
create table if not exists public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  phone text,
  role text default 'buyer',
  source text default 'thrifter_map_beta',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists waitlist_email_idx on public.waitlist (email);
alter table public.waitlist enable row level security;
create policy "service_role_waitlist" on public.waitlist for all using (true);

-- ── Store Proposals (new / edit / remove) ────────────────────
create table if not exists public.store_proposals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('new_store', 'edit_store', 'remove_store')),
  store_id bigint,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  name text,
  description text,
  category text,
  city text,
  country text,
  address text,
  website text,
  instagram text,
  lat float,
  lng float,
  images text[] default '{}',
  reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  reviewer_note text,
  created_at timestamptz default now()
);

create index if not exists store_proposals_user_idx on public.store_proposals (user_id);
create index if not exists store_proposals_status_idx on public.store_proposals (status);

alter table public.store_proposals enable row level security;
create policy "users_insert_own_proposals" on public.store_proposals for insert with check (auth.uid() = user_id);
create policy "users_select_proposals" on public.store_proposals for select using (auth.uid() = user_id or status = 'approved');
create policy "users_update_own_pending" on public.store_proposals for update using (auth.uid() = user_id and status = 'pending');
create policy "service_role_proposals" on public.store_proposals for all using (true);

-- ── Review Photos ────────────────────────────────────────────
create table if not exists public.review_photos (
  id uuid default gen_random_uuid() primary key,
  review_id uuid not null,
  user_id uuid references auth.users not null,
  image_url text not null,
  created_at timestamptz default now()
);

create index if not exists review_photos_review_idx on public.review_photos (review_id);

alter table public.review_photos enable row level security;
create policy "anyone_select_review_photos" on public.review_photos for select using (true);
create policy "users_insert_review_photos" on public.review_photos for insert with check (auth.uid() = user_id);
create policy "service_role_review_photos" on public.review_photos for all using (true);

-- ── Store Reviews RLS (table exists from uppy-platform) ─────
-- These policies allow uppy-map authenticated users to read/write reviews
create policy "anyone_select_reviews" on public.store_reviews for select using (true);
create policy "users_upsert_own_reviews" on public.store_reviews for insert with check (auth.uid()::text = user_id::text);
create policy "users_update_own_reviews" on public.store_reviews for update using (auth.uid()::text = user_id::text);

-- ── Store Favorites RLS ──────────────────────────────────────
create policy "users_manage_own_store_favorites" on public.store_favorites for all using (auth.uid()::text = user_id::text);

-- ── Leaderboard View ─────────────────────────────────────────
create or replace view public.leaderboard as
select
  user_id,
  sum(case
    when type = 'new_store' then 5
    when type = 'edit_store' then 3
    when type = 'remove_store' then 3
    else 0
  end)::int as points,
  count(*)::int as approved_count,
  min(reviewed_at) as first_approved_at
from public.store_proposals
where status = 'approved'
group by user_id
order by points desc, first_approved_at asc;

grant select on public.leaderboard to anon, authenticated;
