-- ============================================================================
-- SafeStop — fix db lint: action item attachment RPCs
-- ============================================================================
-- fail_action_item_attachment_upload: usar failure_reason no retorno (espelho occurrence).
-- get_action_item_attachment_signed_url: validar auth.uid() antes da leitura.
-- ============================================================================

create or replace function public.fail_action_item_attachment_upload(
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
  v_attachment public.action_item_attachments%rowtype;
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

  select * into v_attachment
  from public.action_item_attachments
  where id = target_attachment_id
    and deleted_at is null;

  if v_attachment.upload_status <> 'PENDING' or v_attachment.uploaded_by <> v_user_id then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Operação não permitida.'
      )
    );
  end if;

  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects so
  where so.bucket_id = v_attachment.storage_bucket
    and so.name = v_attachment.storage_path;

  update public.action_item_attachments
  set upload_status = 'FAILED'
  where id = target_attachment_id;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'attachment_id', target_attachment_id,
      'upload_status', 'FAILED',
      'failure_reason', nullif(btrim(failure_reason), '')
    )
  );
end;
$$;

create or replace function public.get_action_item_attachment_signed_url(target_attachment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_attachment public.action_item_attachments%rowtype;
  v_occurrence_id uuid;
  v_signed_url_ttl_seconds constant integer := 3600;
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

  select a.* into v_attachment
  from public.action_item_attachments a
  where a.id = target_attachment_id
    and a.deleted_at is null
    and a.upload_status = 'COMPLETED';

  if v_attachment.id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Anexo não encontrado.'
      )
    );
  end if;

  select ap.occurrence_id into v_occurrence_id
  from public.action_items ai
  join public.action_plans ap on ap.id = ai.action_plan_id
  where ai.id = v_attachment.action_item_id;

  if not public.has_permission('occurrence.read', v_attachment.organization_id)
     or not public.can_access_occurrence(v_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão.'
      )
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'attachment_id', target_attachment_id,
      'bucket', v_attachment.storage_bucket,
      'storage_path', v_attachment.storage_path,
      'expires_in_seconds', v_signed_url_ttl_seconds,
      'signed_url', null
    )
  );
end;
$$;
