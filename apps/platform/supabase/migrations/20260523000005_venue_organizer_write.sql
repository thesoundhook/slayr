-- ============================================================
-- Admin Profiles + Venue/Organizer write access
-- Self-contained: safe to run even if admin_profiles doesn't
-- exist yet. Uses IF NOT EXISTS throughout.
-- ============================================================

-- Admin profiles table (idempotent)
create table if not exists admin_profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  role       text not null default 'events_viewer' check (role in ('super_admin', 'events_viewer')),
  name       text,
  created_at timestamptz not null default now()
);

-- Security-definer helper used by RLS policies below
create or replace function get_my_admin_role()
returns text
language sql
security definer
stable
as $$
  select role from admin_profiles where user_id = auth.uid()
$$;

alter table admin_profiles enable row level security;

-- Admin profile policies (use DO block to skip if they already exist)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'admin_profiles' and policyname = 'Users can read own profile'
  ) then
    execute $p$
      create policy "Users can read own profile"
        on admin_profiles for select
        using (user_id = auth.uid())
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'admin_profiles' and policyname = 'Super admins can read all profiles'
  ) then
    execute $p$
      create policy "Super admins can read all profiles"
        on admin_profiles for select
        using (get_my_admin_role() = 'super_admin')
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'admin_profiles' and policyname = 'Super admins can insert profiles'
  ) then
    execute $p$
      create policy "Super admins can insert profiles"
        on admin_profiles for insert
        with check (get_my_admin_role() = 'super_admin')
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'admin_profiles' and policyname = 'Super admins can update profiles'
  ) then
    execute $p$
      create policy "Super admins can update profiles"
        on admin_profiles for update
        using (get_my_admin_role() = 'super_admin')
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'admin_profiles' and policyname = 'Super admins can delete profiles'
  ) then
    execute $p$
      create policy "Super admins can delete profiles"
        on admin_profiles for delete
        using (get_my_admin_role() = 'super_admin')
    $p$;
  end if;
end $$;

grant select, insert, update, delete on admin_profiles to authenticated;

-- ============================================================
-- Venue & Organizer write policies
-- ============================================================

create policy "Super admins can insert venues"
  on venues for insert
  with check (get_my_admin_role() = 'super_admin');

create policy "Super admins can update venues"
  on venues for update
  using (get_my_admin_role() = 'super_admin');

create policy "Super admins can delete venues"
  on venues for delete
  using (get_my_admin_role() = 'super_admin');

create policy "Super admins can insert organizers"
  on organizers for insert
  with check (get_my_admin_role() = 'super_admin');

create policy "Super admins can update organizers"
  on organizers for update
  using (get_my_admin_role() = 'super_admin');

create policy "Super admins can delete organizers"
  on organizers for delete
  using (get_my_admin_role() = 'super_admin');

grant select, insert, update, delete on venues to authenticated;
grant select, insert, update, delete on organizers to authenticated;

-- ============================================================
-- Bootstrap: make yourself super_admin if not already set.
-- Replace the email and run this block separately in the
-- SQL editor after this migration:
--
--   insert into admin_profiles (user_id, role, name)
--   select id, 'super_admin', email
--   from auth.users
--   where email = 'your@email.com'
--   on conflict (user_id) do update set role = 'super_admin';
-- ============================================================
