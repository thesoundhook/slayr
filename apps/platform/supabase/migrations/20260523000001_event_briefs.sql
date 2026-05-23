-- ============================================================
-- Event Briefs — Admin client brief management
-- ============================================================

create table if not exists event_briefs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  title        text not null default 'Untitled Brief',
  status       text not null default 'draft' check (status in ('draft', 'complete')),
  current_gate integer not null default 1 check (current_gate between 1 and 16),
  data         jsonb not null default '{}'::jsonb
);

-- Row-level security (allow all for authenticated admin users)
alter table event_briefs enable row level security;

create policy "Authenticated users can manage event_briefs"
  on event_briefs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Index for list queries
create index if not exists event_briefs_updated_at_idx on event_briefs (updated_at desc);
