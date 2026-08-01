-- ============================================================================
-- SafeStop — Sprint 2.2: RPCs complete / fail / delete / signed URL
-- ============================================================================
-- Referências: docs/database.md §13.1, §24; docs/engineering.md §18.8–§18.12
-- ============================================================================

-- TTL centralizado para URLs assinadas de evidências (1 hora)
-- Exportado também em packages/types/src/occurrence-attachment.ts

-- ============================================================================
-- 1. Storage SELECT — download autorizado via URL assinada (occurrence.read)
-- ============================================================================

create policy occurrence_evidence_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'occurrence-evidence'
    and exists (
      select 1
      from public.occurrence_attachments a
      where a.storage_bucket = storage.objects.bucket_id
        and a.storage_path = storage.objects.name
        and a.upload_status = 'COMPLETED'
        and a.deleted_at is null
        and public.has_permission('occurrence.read', a.organization_id)
        and public.can_access_occurrence(a.occurrence_id)
    )
  );


-- ============================================================================
-- 2. complete_occurrence_attachment_upload — HEAD verify + COMPLETED
-- ============================================================================

create function public.complete_occurrence_attachment_upload(target_attachment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_attachment public.occurrence_attachments%rowtype;
  v_storage_size bigint;
  v_occurrence_status text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'UNAUTHORIZED',
        'message', 'Usuário não autenticado.'
      )
    );
  end if;

  if target_attachment_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'target_attachment_id é obrigatório.'
      )
    );
  end if;

  select a.*
    into v_attachment
  from public.occurrence_attachments a
  where a.id = target_attachment_id
    and a.deleted_at is null;

  if v_attachment.id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Anexo não encontrado.'
      )
    );
  end if;

  if v_attachment.upload_status <> 'PENDING' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Somente anexos PENDING podem ser concluídos.'
      )
    );
  end if;

  if v_attachment.uploaded_by <> v_user_id then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Somente o autor do upload pode concluir o anexo.'
      )
    );
  end if;

  if not public.has_permission('occurrence.create', v_attachment.organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.create.'
      )
    );
  end if;

  if not public.can_access_occurrence(v_attachment.occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  select o.status
    into v_occurrence_status
  from public.occurrences o
  where o.id = v_attachment.occurrence_id;

  if v_occurrence_status in ('LIBERADA', 'ENCERRADA', 'CANCELADA') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Upload não permitido para ocorrência encerrada ou cancelada.'
      )
    );
  end if;

  select (so.metadata ->> 'size')::bigint
    into v_storage_size
  from storage.objects so
  where so.bucket_id = v_attachment.storage_bucket
    and so.name = v_attachment.storage_path;

  if v_storage_size is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Arquivo não encontrado no Storage. Envie o upload antes de concluir.'
      )
    );
  end if;

  if v_storage_size <> v_attachment.file_size then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Tamanho do arquivo no Storage difere do registrado.'
      )
    );
  end if;

  update public.occurrence_attachments a
  set upload_status = 'COMPLETED'
  where a.id = v_attachment.id;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'attachment_id', v_attachment.id,
      'upload_status', 'COMPLETED'
    )
  );
end;
$$;

comment on function public.complete_occurrence_attachment_upload(uuid) is
  'Verifica objeto no Storage (HEAD/metadata) e marca anexo COMPLETED (Sprint 2.2).';


-- ============================================================================
-- 3. fail_occurrence_attachment_upload — FAILED + cleanup Storage
-- ============================================================================

create function public.fail_occurrence_attachment_upload(
  target_attachment_id uuid,
  failure_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_attachment public.occurrence_attachments%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'UNAUTHORIZED',
        'message', 'Usuário não autenticado.'
      )
    );
  end if;

  if target_attachment_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'target_attachment_id é obrigatório.'
      )
    );
  end if;

  select a.*
    into v_attachment
  from public.occurrence_attachments a
  where a.id = target_attachment_id
    and a.deleted_at is null;

  if v_attachment.id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Anexo não encontrado.'
      )
    );
  end if;

  if v_attachment.upload_status <> 'PENDING' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Somente anexos PENDING podem falhar.'
      )
    );
  end if;

  if v_attachment.uploaded_by <> v_user_id then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Somente o autor do upload pode marcar falha.'
      )
    );
  end if;

  if not public.has_permission('occurrence.create', v_attachment.organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.create.'
      )
    );
  end if;

  if not public.can_access_occurrence(v_attachment.occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  delete from storage.objects so
  where so.bucket_id = v_attachment.storage_bucket
    and so.name = v_attachment.storage_path;

  update public.occurrence_attachments a
  set upload_status = 'FAILED'
  where a.id = v_attachment.id;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'attachment_id', v_attachment.id,
      'upload_status', 'FAILED',
      'failure_reason', nullif(btrim(failure_reason), '')
    )
  );
end;
$$;

comment on function public.fail_occurrence_attachment_upload(uuid, text) is
  'Marca anexo FAILED e remove objeto PENDING do Storage quando existir (Sprint 2.2).';


-- ============================================================================
-- 4. delete_occurrence_attachment — soft delete + Storage delete (server)
-- ============================================================================

create function public.delete_occurrence_attachment(target_attachment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_attachment public.occurrence_attachments%rowtype;
  v_occurrence_status text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'UNAUTHORIZED',
        'message', 'Usuário não autenticado.'
      )
    );
  end if;

  if target_attachment_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'target_attachment_id é obrigatório.'
      )
    );
  end if;

  select a.*
    into v_attachment
  from public.occurrence_attachments a
  where a.id = target_attachment_id
    and a.deleted_at is null;

  if v_attachment.id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Anexo não encontrado.'
      )
    );
  end if;

  if not public.has_permission('occurrence.create', v_attachment.organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.create.'
      )
    );
  end if;

  if not public.can_access_occurrence(v_attachment.occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  select o.status
    into v_occurrence_status
  from public.occurrences o
  where o.id = v_attachment.occurrence_id;

  if v_occurrence_status in ('LIBERADA', 'ENCERRADA', 'CANCELADA') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Exclusão não permitida após encerramento da ocorrência.'
      )
    );
  end if;

  delete from storage.objects so
  where so.bucket_id = v_attachment.storage_bucket
    and so.name = v_attachment.storage_path;

  update public.occurrence_attachments a
  set
    deleted_at = now(),
    deleted_by = v_user_id
  where a.id = v_attachment.id;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'attachment_id', v_attachment.id,
      'deleted_at', now()
    )
  );
end;
$$;

comment on function public.delete_occurrence_attachment(uuid) is
  'Soft delete do anexo + remoção do objeto no Storage (Sprint 2.2).';


-- ============================================================================
-- 5. get_occurrence_attachment_signed_url — TTL centralizado
-- ============================================================================

create function public.get_occurrence_attachment_signed_url(target_attachment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_attachment public.occurrence_attachments%rowtype;
  v_signed_url_ttl_seconds constant integer := 3600;
  v_expires_at timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'UNAUTHORIZED',
        'message', 'Usuário não autenticado.'
      )
    );
  end if;

  if target_attachment_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'target_attachment_id é obrigatório.'
      )
    );
  end if;

  select a.*
    into v_attachment
  from public.occurrence_attachments a
  where a.id = target_attachment_id
    and a.deleted_at is null;

  if v_attachment.id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Anexo não encontrado.'
      )
    );
  end if;

  if v_attachment.upload_status <> 'COMPLETED' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Somente anexos COMPLETED possuem URL assinada.'
      )
    );
  end if;

  if not public.has_permission('occurrence.read', v_attachment.organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.read.'
      )
    );
  end if;

  if not public.can_access_occurrence(v_attachment.occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  if not exists (
    select 1
    from storage.objects so
    where so.bucket_id = v_attachment.storage_bucket
      and so.name = v_attachment.storage_path
  ) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Arquivo não encontrado no Storage.'
      )
    );
  end if;

  v_expires_at := now() + make_interval(secs => v_signed_url_ttl_seconds);

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'attachment_id', v_attachment.id,
      'bucket', v_attachment.storage_bucket,
      'storage_path', v_attachment.storage_path,
      'expires_in_seconds', v_signed_url_ttl_seconds,
      'expires_at', v_expires_at,
      'signed_url', null
    )
  );
end;
$$;

comment on function public.get_occurrence_attachment_signed_url(uuid) is
  'Autoriza download e retorna metadados + TTL centralizado (3600s). Cliente gera signed_url via Storage API com a mesma sessão.';


-- ============================================================================
-- 6. Grants
-- ============================================================================

grant execute on function public.complete_occurrence_attachment_upload(uuid) to authenticated;
grant execute on function public.fail_occurrence_attachment_upload(uuid, text) to authenticated;
grant execute on function public.delete_occurrence_attachment(uuid) to authenticated;
grant execute on function public.get_occurrence_attachment_signed_url(uuid) to authenticated;
