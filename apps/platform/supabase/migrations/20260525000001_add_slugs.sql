-- ============================================================
-- Short, name-based slugs for user-facing entities.
--
-- Adds a `slug TEXT UNIQUE NOT NULL` column to events, venues,
-- organizers, and event_briefs. Slugs are auto-generated on
-- insert via a BEFORE-INSERT trigger and backfilled here for
-- existing rows. Old UUID URLs continue to work because the app
-- resolves /events/<value> against either `id` or `slug`.
--
-- Slug shape: <slugified-name-or-title>-<4-char-base16-suffix>
--   e.g. summer-fest-2026-a7b9
-- Slugs are immutable after creation (no UPDATE trigger).
-- ============================================================

-- ------------------------------------------------------------
-- Slug generator
-- ------------------------------------------------------------
create or replace function generate_slug(source_text text, target_table text)
returns text
language plpgsql
as $$
declare
  base       text;
  suffix     text;
  candidate  text;
  collisions int;
  attempt    int := 0;
begin
  base := lower(coalesce(source_text, ''));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '^-+|-+$', '', 'g');
  base := substring(base from 1 for 40);
  base := regexp_replace(base, '-+$', '', 'g');
  if base = '' then
    base := 'item';
  end if;

  loop
    suffix := substring(md5(random()::text || clock_timestamp()::text) from 1 for 4);
    candidate := base || '-' || suffix;
    execute format('select count(*) from %I where slug = $1', target_table)
      into collisions
      using candidate;
    if collisions = 0 then
      return candidate;
    end if;
    attempt := attempt + 1;
    if attempt > 10 then
      raise exception 'generate_slug: could not find unique slug for % on %', base, target_table;
    end if;
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- events
-- ------------------------------------------------------------
alter table events add column if not exists slug text;

do $$
declare r record;
begin
  for r in select id, title from events where slug is null loop
    update events set slug = generate_slug(r.title, 'events') where id = r.id;
  end loop;
end $$;

alter table events alter column slug set not null;
alter table events add constraint events_slug_unique unique (slug);
create index if not exists events_slug_idx on events (slug);

create or replace function events_set_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_slug(new.title, 'events');
  end if;
  return new;
end $$;

drop trigger if exists events_set_slug_trigger on events;
create trigger events_set_slug_trigger
  before insert on events
  for each row execute function events_set_slug();

-- ------------------------------------------------------------
-- venues
-- ------------------------------------------------------------
alter table venues add column if not exists slug text;

do $$
declare r record;
begin
  for r in select id, name from venues where slug is null loop
    update venues set slug = generate_slug(r.name, 'venues') where id = r.id;
  end loop;
end $$;

alter table venues alter column slug set not null;
alter table venues add constraint venues_slug_unique unique (slug);
create index if not exists venues_slug_idx on venues (slug);

create or replace function venues_set_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_slug(new.name, 'venues');
  end if;
  return new;
end $$;

drop trigger if exists venues_set_slug_trigger on venues;
create trigger venues_set_slug_trigger
  before insert on venues
  for each row execute function venues_set_slug();

-- ------------------------------------------------------------
-- organizers
-- ------------------------------------------------------------
alter table organizers add column if not exists slug text;

do $$
declare r record;
begin
  for r in select id, name from organizers where slug is null loop
    update organizers set slug = generate_slug(r.name, 'organizers') where id = r.id;
  end loop;
end $$;

alter table organizers alter column slug set not null;
alter table organizers add constraint organizers_slug_unique unique (slug);
create index if not exists organizers_slug_idx on organizers (slug);

create or replace function organizers_set_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_slug(new.name, 'organizers');
  end if;
  return new;
end $$;

drop trigger if exists organizers_set_slug_trigger on organizers;
create trigger organizers_set_slug_trigger
  before insert on organizers
  for each row execute function organizers_set_slug();

-- ------------------------------------------------------------
-- event_briefs
-- ------------------------------------------------------------
alter table event_briefs add column if not exists slug text;

do $$
declare r record;
begin
  for r in select id, title from event_briefs where slug is null loop
    update event_briefs set slug = generate_slug(r.title, 'event_briefs') where id = r.id;
  end loop;
end $$;

alter table event_briefs alter column slug set not null;
alter table event_briefs add constraint event_briefs_slug_unique unique (slug);
create index if not exists event_briefs_slug_idx on event_briefs (slug);

create or replace function event_briefs_set_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_slug(new.title, 'event_briefs');
  end if;
  return new;
end $$;

drop trigger if exists event_briefs_set_slug_trigger on event_briefs;
create trigger event_briefs_set_slug_trigger
  before insert on event_briefs
  for each row execute function event_briefs_set_slug();
