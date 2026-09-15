-- ============================================================================
-- SafeStop — Evidências: permitir application/pdf (PO aprovado)
-- ============================================================================
-- Escopo: CHECK mime_type em occurrence_attachments e action_item_attachments;
--         RPCs prepare_*_attachment_upload; bucket occurrence-evidence.
-- Preserva: limite 10 MiB (10485760), file_size > 0, bucket privado, policies/RLS.
-- Não altera: policies Storage, RLS, estrutura de path, attachment_type enum.
--
-- Allowlist final (exata):
--   image/jpeg, image/png, image/webp, application/pdf
-- Extensão derivada do MIME (não do filename):
--   jpeg→jpg, png→png, webp→webp, pdf→pdf
--
-- Rollback (reverter allowlist para fotos-only):
--   1) recriar CHECKs sem application/pdf
--   2) restaurar prepare_* sem pdf no CASE/allowlist
--   3) update storage.buckets allowed_mime_types sem pdf
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHECK constraints — occurrence_attachments
-- ----------------------------------------------------------------------------

alter table public.occurrence_attachments
  drop constraint occurrence_attachments_mime_type_check;

alter table public.occurrence_attachments
  add constraint occurrence_attachments_mime_type_check
    check (mime_type in (
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ));

comment on constraint occurrence_attachments_mime_type_check
  on public.occurrence_attachments is
  'MIME allowlist evidências: jpeg/png/webp + application/pdf. Limite tamanho permanece em occurrence_attachments_file_size_check (≤ 10 MiB).';

-- ----------------------------------------------------------------------------
-- 2. CHECK constraints — action_item_attachments
-- ----------------------------------------------------------------------------

alter table public.action_item_attachments
  drop constraint action_item_attachments_mime_type_check;

alter table public.action_item_attachments
  add constraint action_item_attachments_mime_type_check
    check (mime_type in (
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ));

comment on constraint action_item_attachments_mime_type_check
  on public.action_item_attachments is
  'MIME allowlist evidências de ação: jpeg/png/webp + application/pdf. Limite tamanho permanece em action_item_attachments_file_size_check (≤ 10 MiB).';

-- ----------------------------------------------------------------------------
-- 3. RPC prepare_occurrence_attachment_upload — allowlist + .pdf
-- ----------------------------------------------------------------------------
-- CREATE OR REPLACE preserva GRANT EXECUTE existente.
-- attachment_type continua independente do MIME (DOCUMENT já existia no CHECK;
-- PDF não força nem impede DOCUMENT — o cliente envia attachment_type).

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

  if not (v_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem vínculo ativo na organização da ocorrência.'
      )
    );
  end if;

  if not public.has_permission('occurrence.create', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.create.'
      )
    );
  end if;

  if not public.can_access_occurrence(v_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
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

  -- Extensão derivada exclusivamente do MIME validado (não do filename).
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
  'Prepara evidência PENDING + storage_path server-side. MIME allowlist: jpeg/png/webp/pdf. Extensão do path derivada do MIME. Limite 10 MiB. attachment_type independente do MIME (DOCUMENT já suportado).';

-- ----------------------------------------------------------------------------
-- 4. RPC prepare_action_item_attachment_upload — mesma allowlist + .pdf
-- ----------------------------------------------------------------------------

create or replace function public.prepare_action_item_attachment_upload(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_item_id uuid;
  v_original_file_name text;
  v_mime_type text;
  v_file_size bigint;
  v_caption text;
  v_item public.action_items%rowtype;
  v_plan public.action_plans%rowtype;
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
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  v_item_id := nullif(btrim(payload ->> 'action_item_id'), '')::uuid;
  v_original_file_name := nullif(btrim(payload ->> 'original_file_name'), '');
  v_mime_type := nullif(btrim(payload ->> 'mime_type'), '');
  v_file_size := nullif(payload ->> 'file_size', '')::bigint;
  v_caption := nullif(btrim(payload ->> 'caption'), '');

  if v_item_id is null or v_original_file_name is null or v_mime_type is null or v_file_size is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Campos obrigatórios: action_item_id, original_file_name, mime_type, file_size.'));
  end if;

  if v_file_size <= 0 or v_file_size > v_max_file_size then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'file_size inválido (máx. 10 MiB).'));
  end if;

  if v_mime_type not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'mime_type não permitido.'));
  end if;

  select * into v_item from public.action_items where id = v_item_id;
  if v_item.id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Ação não encontrada.'));
  end if;

  select * into v_plan from public.action_plans where id = v_item.action_plan_id;

  if not public.can_access_occurrence(v_plan.occurrence_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem escopo de acesso à ocorrência.'));
  end if;

  if not (
    public.has_permission('action_plan.manage', v_item.organization_id)
    or public.is_action_item_responsible_member(v_item_id, v_user_id)
  ) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão para anexar evidência.'));
  end if;

  if v_item.status in ('COMPLETED', 'CANCELLED') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Ação não aceita evidências neste status.'));
  end if;

  select count(*)::integer into v_active_count
  from public.action_item_attachments a
  where a.action_item_id = v_item_id and a.deleted_at is null and a.upload_status in ('PENDING', 'COMPLETED');

  if v_active_count >= v_max_attachments then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Limite de evidências por ação atingido.'));
  end if;

  -- Extensão derivada exclusivamente do MIME validado (não do filename).
  v_storage_ext := case v_mime_type
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
    when 'application/pdf' then 'pdf'
  end;
  v_attachment_id := gen_random_uuid();
  v_storage_path := format('%s/action-items/%s/%s.%s', v_item.organization_id, v_item_id, v_attachment_id, v_storage_ext);

  insert into public.action_item_attachments (
    id, action_item_id, organization_id, uploaded_by, storage_bucket, storage_path,
    original_file_name, mime_type, file_size, caption, upload_status
  )
  values (
    v_attachment_id, v_item_id, v_item.organization_id, v_user_id, v_bucket, v_storage_path,
    left(v_original_file_name, 255), v_mime_type, v_file_size, v_caption, 'PENDING'
  );

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object('attachment_id', v_attachment_id, 'bucket', v_bucket, 'storage_path', v_storage_path, 'upload_status', 'PENDING')
  );
end;
$$;

comment on function public.prepare_action_item_attachment_upload(jsonb) is
  'Prepara anexo PENDING de action_item. MIME allowlist alinhada à occurrence: jpeg/png/webp/pdf. Extensão do path derivada do MIME. Limite 10 MiB. Path: {org}/action-items/{itemId}/{attachment}.{ext}.';

-- ----------------------------------------------------------------------------
-- 5. Bucket occurrence-evidence — allowed_mime_types (+ pdf)
-- ----------------------------------------------------------------------------
-- Preserva public=false e file_size_limit=10485760. Não altera policies.

update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]::text[],
  public = false,
  file_size_limit = 10485760
where id = 'occurrence-evidence';
