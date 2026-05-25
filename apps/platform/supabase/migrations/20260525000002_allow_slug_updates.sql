-- ============================================================
-- Allow admins to edit slugs on events, venues, organizers,
-- and event_briefs. A BEFORE-UPDATE trigger normalizes the
-- submitted value (lowercase, hyphen-separated) so an admin
-- can paste raw text and still get a clean URL. If the field
-- is cleared, the slug is regenerated from the source column.
--
-- The existing UNIQUE constraint still guards against
-- collisions and will raise an error to the caller.
-- ============================================================

-- ------------------------------------------------------------
-- Slugify-only helper (no suffix; used for normalizing admin input)
-- ------------------------------------------------------------
create or replace function slugify(source_text text)
returns text
language plpgsql
immutable
as $$
declare
  out_text text;
begin
  out_text := lower(coalesce(source_text, ''));
  out_text := regexp_replace(out_text, '[^a-z0-9]+', '-', 'g');
  out_text := regexp_replace(out_text, '^-+|-+$', '', 'g');
  out_text := substring(out_text from 1 for 60);
  out_text := regexp_replace(out_text, '-+$', '', 'g');
  return out_text;
end;
$$;

-- ------------------------------------------------------------
-- events — normalize-on-update trigger
-- ------------------------------------------------------------
create or replace function events_normalize_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_slug(new.title, 'events');
  elsif new.slug is distinct from old.slug then
    new.slug := slugify(new.slug);
    if new.slug = '' then
      new.slug := generate_slug(new.title, 'events');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists events_normalize_slug_trigger on events;
create trigger events_normalize_slug_trigger
  before update on events
  for each row execute function events_normalize_slug();

-- ------------------------------------------------------------
-- venues
-- ------------------------------------------------------------
create or replace function venues_normalize_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_slug(new.name, 'venues');
  elsif new.slug is distinct from old.slug then
    new.slug := slugify(new.slug);
    if new.slug = '' then
      new.slug := generate_slug(new.name, 'venues');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists venues_normalize_slug_trigger on venues;
create trigger venues_normalize_slug_trigger
  before update on venues
  for each row execute function venues_normalize_slug();

-- ------------------------------------------------------------
-- organizers
-- ------------------------------------------------------------
create or replace function organizers_normalize_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_slug(new.name, 'organizers');
  elsif new.slug is distinct from old.slug then
    new.slug := slugify(new.slug);
    if new.slug = '' then
      new.slug := generate_slug(new.name, 'organizers');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists organizers_normalize_slug_trigger on organizers;
create trigger organizers_normalize_slug_trigger
  before update on organizers
  for each row execute function organizers_normalize_slug();

-- ------------------------------------------------------------
-- event_briefs
-- ------------------------------------------------------------
create or replace function event_briefs_normalize_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := generate_slug(new.title, 'event_briefs');
  elsif new.slug is distinct from old.slug then
    new.slug := slugify(new.slug);
    if new.slug = '' then
      new.slug := generate_slug(new.title, 'event_briefs');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists event_briefs_normalize_slug_trigger on event_briefs;
create trigger event_briefs_normalize_slug_trigger
  before update on event_briefs
  for each row execute function event_briefs_normalize_slug();
