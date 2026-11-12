-- =============================================================================
-- Fotos de exercícios e alongamentos: armazenamento PRIVADO por usuária.
-- Caminho de cada arquivo: <id da usuária>/<nome>.webp
-- Só a dona da pasta lê, envia, troca ou apaga as fotos; nada é público.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-images', 'exercise-images', false, 2 * 1024 * 1024, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "fotos: ler as próprias" on storage.objects for select to authenticated
  using (bucket_id = 'exercise-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "fotos: enviar na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'exercise-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "fotos: trocar as próprias" on storage.objects for update to authenticated
  using (bucket_id = 'exercise-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'exercise-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "fotos: apagar as próprias" on storage.objects for delete to authenticated
  using (bucket_id = 'exercise-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
