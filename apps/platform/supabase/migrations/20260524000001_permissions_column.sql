-- Add per-user permissions array to admin_profiles
alter table admin_profiles
  add column if not exists permissions text[] not null default '{}';

-- Seed defaults for existing rows
update admin_profiles
  set permissions = array[
    'dashboard','events.view','events.create','events.edit',
    'attendees.view','orders.view','scan',
    'briefs.view','briefs.manage',
    'venues.view','venues.manage',
    'organizers.view','organizers.manage',
    'team.manage'
  ]
  where role = 'super_admin';

update admin_profiles
  set permissions = array['events.view','attendees.view','scan']
  where role = 'events_viewer';
