-- ============================================================================
-- Fix: policy INSERT occurrence-evidence — path oficial tem 3 pastas + arquivo
-- ============================================================================
-- storage.foldername('{org}/{occ}/{attachment_id}/{attachment_id}.ext') → 3 elementos
-- Referência: docs/database.md §24.2
-- ============================================================================

drop policy if exists occurrence_evidence_storage_insert on storage.objects;

create policy occurrence_evidence_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'occurrence-evidence'
    and auth.uid() is not null
    and coalesce(array_length(storage.foldername(name), 1), 0) = 3
    and (storage.foldername(name))[1]::uuid in (select public.current_organization_ids())
    and public.has_permission(
      'occurrence.create',
      (storage.foldername(name))[1]::uuid
    )
    and public.can_access_occurrence((storage.foldername(name))[2]::uuid)
    and exists (
      select 1
      from public.occurrence_attachments a
      where a.id = (storage.foldername(name))[3]::uuid
        and a.occurrence_id = (storage.foldername(name))[2]::uuid
        and a.organization_id = (storage.foldername(name))[1]::uuid
        and a.storage_path = name
        and a.uploaded_by = auth.uid()
        and a.upload_status = 'PENDING'
        and a.deleted_at is null
    )
  );
