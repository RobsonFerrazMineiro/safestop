-- ============================================================================
-- Fix TL-19: bypass is_platform_admin() em leitura timeline/comentários (O10)
-- ============================================================================
-- Referências: OCCURRENCE-FOUNDATION-DECISIONS.md § O10;
--              VERIFICATION-sprint-2.3-timeline.md TL-19
-- Leitura cross-org: is_platform_admin() OR occurrence.read na org alvo.
-- can_access_occurrence() já inclui is_platform_admin() internamente.
-- ============================================================================

create or replace function public.can_read_occurrence_in_org(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin()
    or public.has_permission('occurrence.read', p_organization_id);
$$;

comment on function public.can_read_occurrence_in_org(uuid) is
  'Escopo de leitura na org: occurrence.read ou is_platform_admin() (O10 / TL-19).';

grant execute on function public.can_read_occurrence_in_org(uuid) to authenticated;


-- get_occurrence_timeline — substituir checagem occurrence.read
create or replace function public.get_occurrence_timeline(
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

  if not public.can_read_occurrence_in_org(v_organization_id) then
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
        else 'Alterado para ' || public.format_occurrence_status_label(h.to_status)
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
          'fromStatusLabel', public.format_occurrence_status_label(h.from_status),
          'toStatusLabel', public.format_occurrence_status_label(h.to_status),
          'historyId', h.id,
          'reason', h.reason
        )
      end as metadata
    from public.occurrence_status_history h
    where h.occurrence_id = p_occurrence_id
      and (
        h.from_status is not null
        or h.id = (
          select h2.id
          from public.occurrence_status_history h2
          where h2.occurrence_id = p_occurrence_id
            and h2.from_status is null
          order by h2.changed_at asc, h2.id asc
          limit 1
        )
      )

    union all

    select
      c.id,
      'COMMENT_ADDED',
      c.created_at,
      c.author_id,
      'Comentário adicionado',
      c.content,
      jsonb_build_object(
        'commentId', c.id,
        'commentType', c.comment_type,
        'isEdited', c.edited_at is not null,
        'isInternal', c.is_internal,
        'editedAt', c.edited_at,
        'editedBy', c.edited_by
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
      'Evidência adicionada',
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


create or replace function public.create_occurrence_comment(
  p_occurrence_id uuid,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_organization_id uuid;
  v_occurrence_status text;
  v_content text;
  v_comment public.occurrence_comments%rowtype;
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

  v_content := nullif(btrim(p_content), '');

  if v_content is null or char_length(v_content) > 2000 then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Conteúdo deve ter entre 1 e 2000 caracteres.'
      )
    );
  end if;

  select o.organization_id, o.status
    into v_organization_id, v_occurrence_status
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

  if v_occurrence_status in ('ENCERRADA', 'CANCELADA') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Comentários não permitidos em ocorrência encerrada ou cancelada.'
      )
    );
  end if;

  if not public.can_read_occurrence_in_org(v_organization_id) then
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

  insert into public.occurrence_comments (
    organization_id,
    occurrence_id,
    author_id,
    comment_type,
    content
  )
  values (
    v_organization_id,
    p_occurrence_id,
    v_user_id,
    'GENERAL',
    v_content
  )
  returning * into v_comment;

  return jsonb_build_object(
    'success', true,
    'comment', jsonb_build_object(
      'id', v_comment.id,
      'organizationId', v_comment.organization_id,
      'occurrenceId', v_comment.occurrence_id,
      'authorId', v_comment.author_id,
      'commentType', v_comment.comment_type,
      'content', v_comment.content,
      'isInternal', v_comment.is_internal,
      'createdAt', v_comment.created_at,
      'editedAt', v_comment.edited_at,
      'editedBy', v_comment.edited_by
    )
  );
exception
  when check_violation then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Conteúdo inválido.'
      )
    );
end;
$$;


create or replace function public.update_occurrence_comment(
  p_comment_id uuid,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_comment public.occurrence_comments%rowtype;
  v_occurrence_status text;
  v_content text;
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

  if p_comment_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'p_comment_id é obrigatório.'
      )
    );
  end if;

  v_content := nullif(btrim(p_content), '');

  if v_content is null or char_length(v_content) > 2000 then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Conteúdo deve ter entre 1 e 2000 caracteres.'
      )
    );
  end if;

  select c.*
    into v_comment
  from public.occurrence_comments c
  where c.id = p_comment_id;

  if v_comment.id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Comentário não encontrado.'
      )
    );
  end if;

  if v_comment.deleted_at is not null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Comentário não encontrado.'
      )
    );
  end if;

  if v_comment.comment_type <> 'GENERAL' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Somente comentários GENERAL podem ser editados.'
      )
    );
  end if;

  if v_comment.author_id <> v_user_id then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Somente o autor pode editar o comentário.'
      )
    );
  end if;

  if v_comment.created_at + interval '24 hours' <= now() then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Prazo de edição de 24 horas expirado.'
      )
    );
  end if;

  select o.status
    into v_occurrence_status
  from public.occurrences o
  where o.id = v_comment.occurrence_id;

  if v_occurrence_status in ('ENCERRADA', 'CANCELADA') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Comentários não permitidos em ocorrência encerrada ou cancelada.'
      )
    );
  end if;

  if not public.can_read_occurrence_in_org(v_comment.organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.read.'
      )
    );
  end if;

  if not public.can_access_occurrence(v_comment.occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  update public.occurrence_comments c
  set
    content = v_content,
    edited_at = now(),
    edited_by = v_user_id
  where c.id = v_comment.id
  returning * into v_comment;

  return jsonb_build_object(
    'success', true,
    'comment', jsonb_build_object(
      'id', v_comment.id,
      'organizationId', v_comment.organization_id,
      'occurrenceId', v_comment.occurrence_id,
      'authorId', v_comment.author_id,
      'commentType', v_comment.comment_type,
      'content', v_comment.content,
      'isInternal', v_comment.is_internal,
      'createdAt', v_comment.created_at,
      'editedAt', v_comment.edited_at,
      'editedBy', v_comment.edited_by
    )
  );
exception
  when check_violation then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Conteúdo inválido.'
      )
    );
end;
$$;
