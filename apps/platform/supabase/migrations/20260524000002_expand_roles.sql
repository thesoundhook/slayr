-- Expand admin roles beyond super_admin / events_viewer
alter table admin_profiles
  drop constraint admin_profiles_role_check;

alter table admin_profiles
  add constraint admin_profiles_role_check
  check (role in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'));
