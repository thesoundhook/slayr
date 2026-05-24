export type Permission =
  | 'dashboard'
  | 'events.view'
  | 'events.create'
  | 'events.edit'
  | 'attendees.view'
  | 'orders.view'
  | 'scan'
  | 'briefs.view'
  | 'briefs.manage'
  | 'venues.view'
  | 'venues.manage'
  | 'organizers.view'
  | 'organizers.manage'
  | 'team.manage'

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard',
  'events.view', 'events.create', 'events.edit',
  'attendees.view', 'orders.view', 'scan',
  'briefs.view', 'briefs.manage',
  'venues.view', 'venues.manage',
  'organizers.view', 'organizers.manage',
  'team.manage',
]

export const PERMISSION_META: Record<Permission, { label: string; description: string }> = {
  'dashboard':           { label: 'Dashboard',          description: 'View analytics and key metrics' },
  'events.view':         { label: 'View Events',         description: 'See the events list and details' },
  'events.create':       { label: 'Create Events',       description: 'Add new events' },
  'events.edit':         { label: 'Edit Events',         description: 'Modify existing events' },
  'attendees.view':      { label: 'View Attendees',      description: 'See attendee lists per event' },
  'orders.view':         { label: 'View Orders',         description: 'See ticket orders and revenue' },
  'scan':                { label: 'Scan Tickets',        description: 'Use the ticket scanner at the door' },
  'briefs.view':         { label: 'View Briefs',         description: 'Read client event briefs' },
  'briefs.manage':       { label: 'Manage Briefs',       description: 'Create and edit briefs' },
  'venues.view':         { label: 'View Venues',         description: 'See venue list and details' },
  'venues.manage':       { label: 'Manage Venues',       description: 'Create and edit venues' },
  'organizers.view':     { label: 'View Organizers',     description: 'See organizer profiles' },
  'organizers.manage':   { label: 'Manage Organizers',   description: 'Create and edit organizers' },
  'team.manage':         { label: 'Manage Team',         description: 'Invite, remove and edit team members' },
}

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: 'Analytics',
    permissions: ['dashboard'],
  },
  {
    label: 'Events',
    permissions: ['events.view', 'events.create', 'events.edit'],
  },
  {
    label: 'Attendees & Operations',
    permissions: ['attendees.view', 'orders.view', 'scan'],
  },
  {
    label: 'Client Work',
    permissions: ['briefs.view', 'briefs.manage'],
  },
  {
    label: 'Catalogue',
    permissions: ['venues.view', 'venues.manage', 'organizers.view', 'organizers.manage'],
  },
  {
    label: 'Settings',
    permissions: ['team.manage'],
  },
]

export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  super_admin:    ALL_PERMISSIONS,
  admin:          ALL_PERMISSIONS.filter(p => p !== 'team.manage'),
  event_manager:  ['events.view', 'events.create', 'events.edit', 'attendees.view', 'orders.view', 'scan', 'venues.view', 'organizers.view'],
  events_viewer:  ['events.view', 'attendees.view', 'scan'],
  scanner:        ['scan'],
}
