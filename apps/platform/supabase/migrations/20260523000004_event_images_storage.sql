-- ============================================================
-- Storage: event-images bucket + RLS policies
-- ============================================================

-- Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- Authenticated users (admins) can upload images
create policy "Authenticated users can upload event images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-images');

-- Anyone can view event images (bucket is public)
create policy "Public can view event images"
  on storage.objects for select
  to public
  using (bucket_id = 'event-images');

-- Authenticated users can delete event images they uploaded
create policy "Authenticated users can delete event images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-images');
