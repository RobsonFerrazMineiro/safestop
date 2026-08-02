-- ============================================================================
-- SafeStop — Sprint 2.3: occurrence_comments + get_occurrence_timeline
-- ============================================================================
-- Referências: docs/database.md §11.1, §12.1; docs/decisions/TIMELINE-DECISIONS.md
-- SEM tabela occurrence_timeline; SEM INSERT SYSTEM_NOTE; history imutável.
-- Mutations em occurrence_comments somente via RPC BACKEND (Etapa 2).
-- ============================================================================

-- ============================================================================
-- 1. Tabela occurrence_comments
-- ============================================================================

create table public.occurrence_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  occurrence_id uuid not null references public.occurrences (id) on delete restrict,
  author_id uuid not null references public.profiles (id) on delete restrict,
  comment_type text not null default 'GENERAL',
  content text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  edited_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,

  constraint occurrence_comments_id_org_unique unique (id, organization_id),
  constraint occurrence_comments_comment_type_check
    check (comment_type in (
      'GENERAL',
      'CORRECTION_UPDATE',
      'LEADERSHIP_NOTE',
      'HSE_NOTE',
      'RELEASE_NOTE',
      'SYSTEM_NOTE'
    )),
  constraint occurrence_comments_content_active_check
    check (
      deleted_at is not null
      or (
        length(btrim(content)) >= 1
        and char_length(content) <= 2000
      )
    )
);

comment on table public.occurrence_comments is
  'Comentários textuais da ocorrência (docs/database.md §12.1). Exclusão lógica; timeline via RPC.';
comment on column public.occurrence_comments.is_internal is
  'Reservado — sem filtro RLS por papel na Sprint 2.3 (TIMELINE-DECISIONS PO-10).';

create index idx_occurrence_comments_occurrence_active
  on public.occurrence_comments (occurrence_id, created_at desc)
  where deleted_at is null;

create index idx_occurrence_comments_org_active
  on public.occurrence_comments (organization_id, created_at desc)
  where deleted_at is null;

create index idx_occurrence_comments_author_id_idx
  on public.occurrence_comments (author_id)
  where deleted_at is null;

create trigger set_updated_at
  before update on public.occurrence_comments
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 2. Trigger consistência organization_id ↔ occurrences
-- ============================================================================

create function public.validate_occurrence_comment_org()
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

comment on function public.validate_occurrence_comment_org() is
  'Garante organization_id = occurrences.organization_id (Sprint 2.3).';

create trigger validate_occurrence_comment_org
  before insert or update on public.occurrence_comments
  for each row execute function public.validate_occurrence_comment_org();


-- ============================================================================
-- 3. RPC get_occurrence_timeline — UNION ALL server-side
-- ============================================================================

create function public.get_occurrence_timeline(
  p_occurrence_id uuid,
  p_cursor jsonb default null,
  p_limit integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_organization_id uuid;
  v_limit integer;
  v_fetch_limit integer;
  v_cursor_occurred_at timestamptz;
  v_cursor_id uuid;
  v_items jsonb;
  v_next_cursor jsonb;
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

  if p_occurrence_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'p_occurrence_id é obrigatório.'
      )
    );
  end if;

  select o.organization_id
    into v_organization_id
  from public.occurrences o
  where o.id = p_occurrence_id;

  if v_organization_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Ocorrência não encontrada.'
      )
    );
  end if;

  if not public.has_permission('occurrence.read', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.read.'
      )
    );
  end if;

  if not public.can_access_occurrence(p_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  v_limit := least(greatest(coalesce(p_limit, 30), 1), 100);
  v_fetch_limit := v_limit + 1;

  if p_cursor is not null and p_cursor <> 'null'::jsonb then
    v_cursor_occurred_at := nullif(p_cursor ->> 'occurred_at', '')::timestamptz;
    v_cursor_id := nullif(p_cursor ->> 'id', '')::uuid;
  end if;

  with timeline_source as (
    select
      h.id as source_id,
      case
        when h.from_status is null then 'OCCURRENCE_CREATED'
        else 'STATUS_CHANGED'
      end as kind,
      h.changed_at as occurred_at,
      h.changed_by as actor_id,
      case
        when h.from_status is null then 'Paralisação Preventiva registrada'
        else 'Status atualizado'
      end as title,
      nullif(btrim(h.reason), '') as body,
      case
        when h.from_status is null then jsonb_build_object(
          'toStatus', h.to_status,
          'historyId', h.id
        )
        else jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'reason', h.reason
        )
      end as metadata
    from public.occurrence_status_history h
    where h.occurrence_id = p_occurrence_id

    union all

    select
      c.id,
      'COMMENT_ADDED',
      c.created_at,
      c.author_id,
      'Comentário',
      c.content,
      jsonb_build_object(
        'commentId', c.id,
        'commentType', c.comment_type,
        'isEdited', c.edited_at is not null,
        'isInternal', c.is_internal,
        'editedAt', c.edited_at
      )
    from public.occurrence_comments c
    where c.occurrence_id = p_occurrence_id
      and c.deleted_at is null

    union all

    select
      c.id,
      'COMMENT_REMOVED',
      c.deleted_at,
      coalesce(c.deleted_by, c.author_id),
      'Comentário removido',
      null::text,
      jsonb_build_object(
        'commentId', c.id,
        'commentType', c.comment_type,
        'isRemoved', true,
        'deletedBy', c.deleted_by
      )
    from public.occurrence_comments c
    where c.occurrence_id = p_occurrence_id
      and c.deleted_at is not null

    union all

    select
      a.id,
      'EVIDENCE_ADDED',
      coalesce(a.updated_at, a.created_at),
      a.uploaded_by,
      'Evidência anexada',
      nullif(btrim(a.caption), ''),
      jsonb_build_object(
        'attachmentId', a.id,
        'attachmentType', a.attachment_type,
        'mimeType', a.mime_type,
        'originalFileName', a.original_file_name,
        'fileSize', a.file_size,
        'caption', a.caption
      )
    from public.occurrence_attachments a
    where a.occurrence_id = p_occurrence_id
      and a.upload_status = 'COMPLETED'
      and a.deleted_at is null

    union all

    select
      a.id,
      'EVIDENCE_REMOVED',
      a.deleted_at,
      coalesce(a.deleted_by, a.uploaded_by),
      'Evidência removida',
      null::text,
      jsonb_build_object(
        'attachmentId', a.id,
        'attachmentType', a.attachment_type,
        'isRemoved', true,
        'deletedBy', a.deleted_by,
        'originalFileName', a.original_file_name
      )
    from public.occurrence_attachments a
    where a.occurrence_id = p_occurrence_id
      and a.deleted_at is not null
  ),
  filtered as (
    select ts.*
    from timeline_source ts
    where v_cursor_occurred_at is null
       or v_cursor_id is null
       or (ts.occurred_at, ts.source_id) < (v_cursor_occurred_at, v_cursor_id)
    order by ts.occurred_at desc, ts.source_id desc
    limit v_fetch_limit
  ),
  numbered as (
    select
      f.*,
      row_number() over (order by f.occurred_at desc, f.source_id desc) as row_num
    from filtered f
  ),
  page_items as (
    select
      jsonb_build_object(
        'id', n.source_id,
        'kind', n.kind,
        'occurredAt', n.occurred_at,
        'actorId', n.actor_id,
        'actorName', pr.full_name,
        'title', n.title,
        'body', n.body,
        'metadata', n.metadata
      ) as item,
      n.row_num,
      n.occurred_at,
      n.source_id
    from numbered n
    left join public.profiles pr on pr.id = n.actor_id
  )
  select
    coalesce(
      (
        select jsonb_agg(pi.item order by pi.row_num)
        from page_items pi
        where pi.row_num <= v_limit
      ),
      '[]'::jsonb
    ),
    (
      select jsonb_build_object(
        'occurred_at', pi.occurred_at,
        'id', pi.source_id
      )
      from page_items pi
      where pi.row_num = v_limit + 1
    )
  into v_items, v_next_cursor
  from (select 1) as _dummy;

  return jsonb_build_object(
    'success', true,
    'items', coalesce(v_items, '[]'::jsonb),
    'nextCursor', v_next_cursor
  );
end;
$$;

comment on function public.get_occurrence_timeline(uuid, jsonb, integer) is
  'Feed unificado timeline (history + comments + attachments). Sprint 2.3 — TIMELINE-DECISIONS.';


-- ============================================================================
-- 4. Row Level Security — SELECT only; negar mutations diretas
-- ============================================================================

alter table public.occurrence_comments enable row level security;

create policy occurrence_comments_select on public.occurrence_comments
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      deleted_at is null
      and public.has_permission('occurrence.read', organization_id)
      and public.can_access_occurrence(occurrence_id)
    )
  );

revoke insert, update, delete on public.occurrence_comments from authenticated;
grant select on public.occurrence_comments to authenticated;
grant execute on function public.get_occurrence_timeline(uuid, jsonb, integer) to authenticated;
