-- Storage bucket for PDF/Word source files uploaded during fiche
-- generation. Vercel's Serverless Functions reject any request body over
-- 4.5 MB (a hard, non-configurable platform limit) — routing large files
-- straight from the browser to Supabase Storage instead of through our own
-- Route Handler is what lets fiche generation accept a PDF of any size.
-- The server (app/api/fiches/generate) later downloads the file
-- server-to-server via the service-role client and deletes it once
-- processed; see lib/files/upload.ts for the client-side upload helper.
insert into storage.buckets (id, name, public)
values ('source-uploads', 'source-uploads', false)
on conflict (id) do nothing;

-- Each object is stored at "<user_id>/<random>-<filename>" — these
-- policies scope every operation to the owner's own folder. The server
-- itself reads/deletes via the service-role client, which bypasses RLS
-- entirely, so these only matter for direct client access.
create policy "source_uploads_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'source-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "source_uploads_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'source-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "source_uploads_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'source-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
