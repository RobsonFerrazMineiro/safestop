-- ============================================================================
-- SafeStop — Sprint 2.5: Interdição Oficial (extensão record_occurrence_decision + timeline)
-- ============================================================================
-- Referências: docs/decisions/INTERDICAO-OFICIAL-DECISIONS.md (PO-IO-1…PO-IO-12)
-- Estende record_occurrence_decision — NÃO cria RPC nova.
-- Branch VER_E_AGIR (2.4) permanece intacto.
-- SEM MDHO, SEM notification_events, SEM ALTER TABLE estrutural.
-- ============================================================================

-- ============================================================================
-- 1. RPC record_occurrence_decision — branches VER_E_AGIR + INTERDICAO_OFICIAL
-- ============================================================================

create or replace function public.record_occurrence_decision(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_occurrence_id uuid;
  v_decision_type text;
  v_decision_reason text;
  v_organization_id uuid;
  v_status text;
  v_decision_id uuid;
  v_transitioned_at timestamptz;
  v_existing_decision_id uuid;
  v_target_status text;
  v_history_to_status text;
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

  if p_payload is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Payload é obrigatório.'
      )
    );
  end if;

  v_occurrence_id := nullif(btrim(p_payload ->> 'occurrence_id'), '')::uuid;
  v_decision_type := nullif(btrim(p_payload ->> 'decision_type'), '');
  v_decision_reason := nullif(btrim(p_payload ->> 'decision_reason'), '');

  if v_occurrence_id is null or v_decision_type is null or v_decision_reason is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Campos obrigatórios: occurrence_id, decision_type, decision_reason.'
      )
    );
  end if;

  if v_decision_type not in ('VER_E_AGIR', 'INTERDICAO_OFICIAL') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'decision_type inválido. Permitido: VER_E_AGIR, INTERDICAO_OFICIAL.'
      )
    );
  end if;

  if char_length(v_decision_reason) < 10 or char_length(v_decision_reason) > 4000 then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'decision_reason deve ter entre 10 e 4000 caracteres.'
      )
    );
  end if;

  select o.organization_id, o.status
    into v_organization_id, v_status
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

  if not (v_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem vínculo ativo na organização da ocorrência.'
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

  if v_decision_type = 'VER_E_AGIR' then
    if not public.has_permission('occurrence.evaluate', v_organization_id) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'FORBIDDEN',
          'message', 'Usuário sem permissão occurrence.evaluate.'
        )
      );
    end if;

    v_target_status := 'VER_E_AGIR';
    v_history_to_status := 'VER_E_AGIR';
  else
    if not public.has_permission('occurrence.confirm_interdiction', v_organization_id) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'FORBIDDEN',
          'message', 'Usuário sem permissão occurrence.confirm_interdiction.'
        )
      );
    end if;

    v_target_status := 'INTERDICAO_CONFIRMADA';
    v_history_to_status := 'INTERDICAO_CONFIRMADA';
  end if;

  select d.id
    into v_existing_decision_id
  from public.occurrence_decisions d
  where d.occurrence_id = v_occurrence_id
  limit 1;

  if v_existing_decision_id is not null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'ALREADY_DECIDED',
        'message', 'Esta ocorrência já possui decisão registrada.',
        'decisionId', v_existing_decision_id
      )
    );
  end if;

  if v_decision_type = 'VER_E_AGIR' and v_status = 'VER_E_AGIR' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Ocorrência já está em Ver e Agir.',
        'currentStatus', v_status
      )
    );
  end if;

  if v_decision_type = 'INTERDICAO_OFICIAL' and v_status = 'INTERDICAO_CONFIRMADA' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Ocorrência já está com Interdição Oficial confirmada.',
        'currentStatus', v_status
      )
    );
  end if;

  if v_status <> 'EM_AVALIACAO' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Decisão só pode ser registrada com ocorrência em EM_AVALIACAO.',
        'currentStatus', v_status
      )
    );
  end if;

  update public.occurrences
  set
    status = v_target_status,
    decision_type = v_decision_type,
    evaluated_at = now(),
    updated_at = now()
  where id = v_occurrence_id
    and status = 'EM_AVALIACAO';

  if not found then
    select o.status
      into v_status
    from public.occurrences o
    where o.id = v_occurrence_id;

    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao atualizar status da ocorrência.',
        'currentStatus', v_status
      )
    );
  end if;

  insert into public.occurrence_decisions (
    occurrence_id,
    decision_type,
    decision_reason,
    decided_by,
    decided_at
  )
  values (
    v_occurrence_id,
    v_decision_type,
    v_decision_reason,
    v_user_id,
    now()
  )
  returning id into v_decision_id;

  insert into public.occurrence_status_history (
    occurrence_id,
    from_status,
    to_status,
    reason,
    metadata,
    changed_by
  )
  values (
    v_occurrence_id,
    'EM_AVALIACAO',
    v_history_to_status,
    left(v_decision_reason, 500),
    jsonb_build_object(
      'decision_type', v_decision_type,
      'decision_id', v_decision_id
    ),
    v_user_id
  )
  returning changed_at into v_transitioned_at;

  -- notification dispatch Sprint 3 (sem implementar)

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'decision', jsonb_build_object(
        'id', v_decision_id,
        'occurrence_id', v_occurrence_id,
        'decision_type', v_decision_type,
        'decision_reason', v_decision_reason,
        'decided_by', v_user_id,
        'decided_at', v_transitioned_at
      ),
      'occurrence', jsonb_build_object(
        'id', v_occurrence_id,
        'status', v_target_status,
        'decision_type', v_decision_type,
        'evaluated_at', v_transitioned_at
      )
    )
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao registrar decisão.'
      )
    );
end;
$$;

comment on function public.record_occurrence_decision(jsonb) is
  'EM_AVALIACAO → VER_E_AGIR (evaluate) ou INTERDICAO_CONFIRMADA (confirm_interdiction). Sprint 2.5.';


-- ============================================================================
-- 2. Patch get_occurrence_timeline — título IO PO-IO-11 + metadata enriquecida
-- ============================================================================

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
        when h.from_status = 'PARALISACAO_PREVENTIVA' and h.to_status = 'EM_AVALIACAO'
          then 'Avaliação iniciada'
        when h.from_status = 'EM_AVALIACAO' and h.to_status = 'VER_E_AGIR'
          then 'Decisão: Ver e Agir'
        when h.from_status = 'EM_AVALIACAO' and h.to_status = 'INTERDICAO_CONFIRMADA'
          then 'Interdição Oficial confirmada'
        else 'Alterado para ' || public.format_occurrence_status_label(h.to_status)
      end as title,
      nullif(btrim(h.reason), '') as body,
      case
        when h.from_status is null then jsonb_build_object(
          'toStatus', h.to_status,
          'historyId', h.id
        )
        when h.from_status = 'PARALISACAO_PREVENTIVA' and h.to_status = 'EM_AVALIACAO' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'start_evaluation'),
          'evaluatorName', pr_eval.full_name
        )
        when h.from_status = 'EM_AVALIACAO' and h.to_status = 'VER_E_AGIR' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'decisionType', coalesce(od.decision_type, h.metadata ->> 'decision_type'),
          'decisionReason', left(coalesce(od.decision_reason, h.reason), 200),
          'decisionId', od.id,
          'evaluatorName', pr_eval.full_name
        )
        when h.from_status = 'EM_AVALIACAO' and h.to_status = 'INTERDICAO_CONFIRMADA' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'decisionType', coalesce(od.decision_type, h.metadata ->> 'decision_type'),
          'decisionReason', left(coalesce(od.decision_reason, h.reason), 200),
          'decisionId', od.id,
          'decidedByName', pr_eval.full_name
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
    left join public.occurrence_decisions od
      on od.id = nullif(h.metadata ->> 'decision_id', '')::uuid
    left join public.profiles pr_eval on pr_eval.id = h.changed_by
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

comment on function public.get_occurrence_timeline(uuid, jsonb, integer) is
  'Feed timeline unificado; títulos VA (2.4) + IO (2.5 PO-IO-11).';
