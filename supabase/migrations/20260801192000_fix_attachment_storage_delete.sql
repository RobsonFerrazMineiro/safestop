-- ============================================================================
-- Fix: delete Storage via RPC com storage.allow_delete_query (protect_delete)
-- ============================================================================

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
