-- ============================================================================
-- SafeStop — Sprint 2.2: occurrence_attachments + Storage occurrence-evidence
-- ============================================================================
-- Referências: docs/database.md §13.1, §24; arquitetura Sprint 2.2 (2026-08-01)
-- Fluxo: prepare (PENDING) → Storage INSERT (policy) → complete (Etapa BACKEND)
-- Mutations diretas na tabela negadas — somente RPC SECURITY DEFINER.
-- ============================================================================

-- Limite PO-3 (recomendação arquitetura): 10 MiB por arquivo
-- Máximo PO-4: 20 evidências ativas por ocorrência

-- ============================================================================
-- 1. Tabela occurrence_attachments
-- ============================================================================

create table public.occurrence_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  occurrence_id uuid not null references public.occurrences (id) on delete restrict,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  attachment_type text not null,
  storage_bucket text not null default 'occurrence-evidence',
  storage_path text not null,
  original_file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  caption text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  captured_at timestamptz,
  upload_status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,

  constraint occurrence_attachments_storage_path_unique unique (storage_path),
  constraint occurrence_attachments_id_org_unique unique (id, organization_id),
  constraint occurrence_attachments_original_file_name_not_blank
    check (btrim(original_file_name) <> ''),
  constraint occurrence_attachments_storage_bucket_occurrence_evidence
    check (storage_bucket = 'occurrence-evidence'),
  constraint occurrence_attachments_attachment_type_check
    check (attachment_type in (
      'INITIAL_EVIDENCE',
      'CORRECTION_EVIDENCE',
      'RELEASE_EVIDENCE',
      'DOCUMENT',
      'OTHER'
    )),
  constraint occurrence_attachments_upload_status_check
    check (upload_status in ('PENDING', 'COMPLETED', 'FAILED')),
  constraint occurrence_attachments_mime_type_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint occurrence_attachments_file_size_check
    check (file_size > 0 and file_size <= 10485760),
  constraint occurrence_attachments_caption_max_length
    check (caption is null or char_length(caption) <= 500)
);

comment on table public.occurrence_attachments is
  'Metadados de evidências de ocorrência; binário no bucket occurrence-evidence (docs/database.md §13.1).';
comment on column public.occurrence_attachments.storage_path is
  'Path oficial: {organization_id}/{occurrence_id}/{attachment_id}/{attachment_id}.{ext}';
comment on column public.occurrence_attachments.upload_status is
  'PENDING após prepare; COMPLETED após upload+complete; FAILED via fail RPC.';

create index occurrence_attachments_occurrence_active_idx
  on public.occurrence_attachments (occurrence_id, created_at desc)
  where deleted_at is null;

create index occurrence_attachments_org_active_idx
  on public.occurrence_attachments (organization_id, created_at desc)
  where deleted_at is null;

create index occurrence_attachments_uploaded_by_idx
  on public.occurrence_attachments (uploaded_by)
  where deleted_at is null;

create trigger set_updated_at
  before update on public.occurrence_attachments
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 2. Trigger consistência organization_id ↔ occurrences
-- ============================================================================

create function public.validate_occurrence_attachment_org()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_occurrence_org_id uuid;
begin
  select o.organization_id
    into v_occurrence_org_id
  from public.occurrences o
  where o.id = new.occurrence_id;

  if v_occurrence_org_id is null then
    raise exception 'occurrence_id % inválido', new.occurrence_id;
  end if;

  if new.organization_id <> v_occurrence_org_id then
    raise exception
      'organization_id (%) deve corresponder à organização da ocorrência (%)',
      new.organization_id, new.occurrence_id;
  end if;

  return new;
end;
$$;

comment on function public.validate_occurrence_attachment_org() is
  'Garante organization_id = occurrences.organization_id (Sprint 2.2).';

create trigger validate_occurrence_attachment_org
  before insert or update on public.occurrence_attachments
  for each row execute function public.validate_occurrence_attachment_org();


-- ============================================================================
-- 3. RPC prepare_occurrence_attachment_upload (PENDING)
-- ============================================================================

create function public.prepare_occurrence_attachment_upload(payload jsonb)
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

  if v_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
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

  v_storage_ext := case v_mime_type
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
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
  'Prepara evidência PENDING + storage_path server-side (Sprint 2.2).';


-- ============================================================================
-- 4. Row Level Security — SELECT only; sem INSERT/UPDATE/DELETE direto
-- ============================================================================

alter table public.occurrence_attachments enable row level security;

create policy occurrence_attachments_select on public.occurrence_attachments
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      deleted_at is null
      and public.has_permission('occurrence.read', organization_id)
      and public.can_access_occurrence(occurrence_id)
    )
  );

revoke insert, update, delete on public.occurrence_attachments from authenticated;
grant select on public.occurrence_attachments to authenticated;
grant execute on function public.prepare_occurrence_attachment_upload(jsonb) to authenticated;


-- ============================================================================
-- 5. Bucket occurrence-evidence + Storage policy INSERT
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'occurrence-evidence',
  'occurrence-evidence',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy occurrence_evidence_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'occurrence-evidence'
    and auth.uid() is not null
    and coalesce(array_length(storage.foldername(name), 1), 0) = 4
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
