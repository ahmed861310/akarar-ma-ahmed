-- V27 provider service image upload fix
alter table public.providers add column if not exists image_url text;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('provider-images','provider-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "provider images public read" on storage.objects;
drop policy if exists "provider images owner upload" on storage.objects;
drop policy if exists "provider images owner update" on storage.objects;
drop policy if exists "provider images owner delete" on storage.objects;
create policy "provider images public read" on storage.objects for select using (bucket_id='provider-images');
create policy "provider images owner upload" on storage.objects for insert to authenticated with check (bucket_id='provider-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "provider images owner update" on storage.objects for update to authenticated using (bucket_id='provider-images' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='provider-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "provider images owner delete" on storage.objects for delete to authenticated using (bucket_id='provider-images' and (storage.foldername(name))[1]=auth.uid()::text);
