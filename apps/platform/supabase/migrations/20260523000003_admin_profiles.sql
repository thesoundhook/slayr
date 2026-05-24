-- ============================================================
-- Admin Profiles — role-based access for admin panel users
-- Roles: super_admin (full access), events_viewer (events only)
-- ============================================================

create table admin_profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  role       text not null default 'events_viewer' check (role in ('super_admin', 'events_viewer')),
  name       text,
  created_at timestamptz not null default now()
);

-- Security-definer function so RLS policies can check the caller's role
-- without causing a recursive RLS query.
create or replace function get_my_admin_role()
returns text
language sql
security definer
stable
as $$
  select role from admin_profiles where user_id = auth.uid()
$$;

alter table admin_profiles enable row level security;

-- Every authenticated user can read their own profile (needed on app load)
create policy "Users can read own profile"
  on admin_profiles for select
  using (user_id = auth.uid());

-- Super admins can read all profiles
create policy "Super admins can read all profiles"
  on admin_profiles for select
  using (get_my_admin_role() = 'super_admin');

-- Super admins can insert new profiles (invite flow creates the row)
create policy "Super admins can insert profiles"
  on admin_profiles for insert
  with check (get_my_admin_role() = 'super_admin');

-- Super admins can update roles
create policy "Super admins can update profiles"
  on admin_profiles for update
  using (get_my_admin_role() = 'super_admin');

-- Super admins can remove members
create policy "Super admins can delete profiles"
  on admin_profiles for delete
  using (get_my_admin_role() = 'super_admin');

grant select, insert, update, delete on admin_profiles to authenticated;
grant select, insert, update, delete on admin_profiles to service_role;

-- ============================================================
-- Bootstrap: insert your own user as the first super_admin.
-- Replace the email below and run this block manually after
-- the migration, or run it directly in the SQL editor:
--
--   insert into admin_profiles (user_id, role, name)
--   select id, 'super_admin', email
--   from auth.users
--   where email = 'your@email.com';
-- ============================================================
