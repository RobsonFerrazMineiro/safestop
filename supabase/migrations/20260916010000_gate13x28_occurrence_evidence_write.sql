-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.2.8: WRITE evidência tenant|origin|contractor
-- ============================================================================
-- Origin/contractor com occurrence.create na PRÓPRIA org anexa evidência
-- na PP que pode LER (can_access_occurrence). Path/organization_id do
-- attachment permanecem o TENANT. Sem wildcard GERENCIADORA. Sem
-- organization.manage. Storage SELECT 13X.2.2 inalterado. Action-items
-- INSERT inalterado.
-- ============================================================================


-- ============================================================================
-- 1. Helper WRITE (só leitura; não substitui can_read)
-- ============================================================================

create or replace function public.can_write_occurrence_evidence(p_occurrence_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.occurrences o
    where o.id = p_occurrence_id
      and public.can_access_occurrence(o.id)
      and exists (
        select 1
        from public.current_organization_ids() as auth_org(id)
        where public.has_permission('occurrence.create', auth_org.id)
          and (
            o.organization_id = auth_org.id
            or (
              o.origin_organization_id is not null
              and o.origin_organization_id = auth_org.id
            )
            or (
              o.contractor_organization_id is not null
              and o.contractor_organization_id = auth_org.id
            )
          )
      )
  );
$$;

comment on function public.can_write_occurrence_evidence(uuid) is
  'Gate 13X.2.8: WRITE evidência da PP. can_access_occurrence E occurrence.create na org atuante que é tenant, origin (se NOT NULL) ou contractor (se NOT NULL). Sem participation_role. Sem attachment.*. Path Storage continua o tenant.';

grant execute on function public.can_write_occurrence_evidence(uuid) to authenticated;
revoke all on function public.can_write_occurrence_evidence(uuid) from public;


-- ============================================================================
-- 2. prepare — helper; organization_id/path = tenant da occurrence
-- ============================================================================

create or replace function public.prepare_occurrence_attachment_upload(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_occurrence_id uuid;
  v_organization_id uuid;
  v_occurrence_status text;
  v_attachment_type text;
  v_original_file_name text;
  v_mime_type text;
  v_file_size bigint;
  v_caption text;
  v_latitude numeric(9, 6);
  v_longitude numeric(9, 6);
  v_captured_at timestamptz;
  v_attachment_id uuid;
  v_storage_ext text;
  v_storage_path text;
  v_active_count integer;
  v_bucket constant text := 'occurrence-evidence';
  v_max_file_size constant bigint := 10485760;
  v_max_attachments constant integer := 20;
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

  if payload is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Payload é obrigatório.'
      )
    );
  end if;

  v_occurrence_id := nullif(btrim(payload ->> 'occurrence_id'), '')::uuid;
  v_attachment_type := nullif(btrim(payload ->> 'attachment_type'), '');
  v_original_file_name := nullif(btrim(payload ->> 'original_file_name'), '');
  v_mime_type := nullif(btrim(payload ->> 'mime_type'), '');
  v_file_size := nullif(payload ->> 'file_size', '')::bigint;
  v_caption := nullif(btrim(payload ->> 'caption'), '');
  v_latitude := nullif(payload ->> 'latitude', '')::numeric(9, 6);
  v_longitude := nullif(payload ->> 'longitude', '')::numeric(9, 6);
  v_captured_at := nullif(payload ->> 'captured_at', '')::timestamptz;

  if v_occurrence_id is null
     or v_attachment_type is null
     or v_original_file_name is null
     or v_mime_type is null
     or v_file_size is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Campos obrigatórios: occurrence_id, attachment_type, original_file_name, mime_type, file_size.'
      )
    );
  end if;

  if v_attachment_type not in (
    'INITIAL_EVIDENCE', 'CORRECTION_EVIDENCE', 'RELEASE_EVIDENCE', 'DOCUMENT', 'OTHER'
  ) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'attachment_type inválido.'
      )
    );
  end if;

  if v_mime_type not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'mime_type não permitido.'
      )
    );
  end if;

  if v_file_size <= 0 or v_file_size > v_max_file_size then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'file_size fora do limite permitido (1 byte — 10 MiB).'
      )
    );
  end if;

  if v_caption is not null and char_length(v_caption) > 500 then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'caption excede 500 caracteres.'
      )
    );
  end if;

  select o.organization_id, o.status
    into v_organization_id, v_occurrence_status
  from public.occurrences o
  where o.id = v_occurrence_id;

  if v_organization_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Ocorrência não encontrada.'
      )
    );
  end if;

  if v_occurrence_status in ('LIBERADA', 'ENCERRADA', 'CANCELADA') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Upload não permitido para ocorrência encerrada ou cancelada.'
      )
    );
  end if;

  if not public.can_write_occurrence_evidence(v_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão para anexar evidência nesta ocorrência.'
      )
    );
  end if;

  select count(*)::integer
    into v_active_count
  from public.occurrence_attachments a
  where a.occurrence_id = v_occurrence_id
    and a.deleted_at is null
    and a.upload_status in ('PENDING', 'COMPLETED');

  if v_active_count >= v_max_attachments then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Limite de evidências por ocorrência atingido.'
      )
    );
  end if;

  v_storage_ext := case v_mime_type
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
    when 'application/pdf' then 'pdf'
  end;

  v_attachment_id := gen_random_uuid();
  v_storage_path := format(
    '%s/%s/%s/%s.%s',
    v_organization_id,
    v_occurrence_id,
    v_attachment_id,
    v_attachment_id,
    v_storage_ext
  );

  insert into public.occurrence_attachments (
    id,
    organization_id,
    occurrence_id,
    uploaded_by,
    attachment_type,
    storage_bucket,
    storage_path,
    original_file_name,
    mime_type,
    file_size,
    caption,
    latitude,
    longitude,
    captured_at,
    upload_status
  )
  values (
    v_attachment_id,
    v_organization_id,
    v_occurrence_id,
    v_user_id,
    v_attachment_type,
    v_bucket,
    v_storage_path,
    left(v_original_file_name, 255),
    v_mime_type,
    v_file_size,
    v_caption,
    v_latitude,
    v_longitude,
    coalesce(v_captured_at, now()),
    'PENDING'
  );

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'attachment_id', v_attachment_id,
      'bucket', v_bucket,
      'storage_path', v_storage_path,
      'upload_status', 'PENDING'
    )
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao preparar upload.'
      )
    );
end;
$$;

comment on function public.prepare_occurrence_attachment_upload(jsonb) is
  'Gate 13X.2.8: PENDING via can_write_occurrence_evidence. organization_id e path prefix = tenant da occurrence. MIME jpeg/png/webp/pdf. uploaded_by = auth.uid().';


-- ============================================================================
-- 3. complete / fail / delete — mesmo helper
-- ============================================================================

create or replace function public.complete_occurrence_attachment_upload(target_attachment_id uuid)
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

  if not public.can_write_occurrence_evidence(v_attachment.occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão para anexar evidência nesta ocorrência.'
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
  'Gate 13X.2.8: COMPLETED via can_write_occurrence_evidence. uploaded_by = auth.uid() intacto.';

create or replace function public.fail_occurrence_attachment_upload(
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

  if not public.can_write_occurrence_evidence(v_attachment.occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão para anexar evidência nesta ocorrência.'
      )
    );
  end if;

  perform set_config('storage.allow_delete_query', 'true', true);

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
  'Gate 13X.2.8: FAILED via can_write_occurrence_evidence + cleanup Storage PENDING.';

create or replace function public.delete_occurrence_attachment(target_attachment_id uuid)
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

  if not public.can_write_occurrence_evidence(v_attachment.occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão para anexar evidência nesta ocorrência.'
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

  perform set_config('storage.allow_delete_query', 'true', true);

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
  'Gate 13X.2.8: soft-delete via can_write_occurrence_evidence. Sem occurrence.create só no tenant.';


-- ============================================================================
-- 4. Storage INSERT — branch occurrence usa helper; action-items intacto
-- ============================================================================

drop policy if exists occurrence_evidence_storage_insert on storage.objects;

create policy occurrence_evidence_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'occurrence-evidence'
    and auth.uid() is not null
    and coalesce(array_length(storage.foldername(name), 1), 0) = 3
    and (
      (
        (storage.foldername(name))[2] is distinct from 'action-items'
        and public.can_write_occurrence_evidence((storage.foldername(name))[2]::uuid)
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
      )
      or (
        (storage.foldername(name))[2] = 'action-items'
        and (storage.foldername(name))[1]::uuid in (select public.current_organization_ids())
        and exists (
          select 1
          from public.action_item_attachments a
          where a.action_item_id = (storage.foldername(name))[3]::uuid
            and a.organization_id = (storage.foldername(name))[1]::uuid
            and a.storage_path = name
            and a.uploaded_by = auth.uid()
            and a.upload_status = 'PENDING'
            and a.deleted_at is null
            and (
              public.has_permission('action_plan.manage', a.organization_id)
              or public.is_action_item_responsible_member(a.action_item_id, auth.uid())
            )
        )
      )
    )
  );
