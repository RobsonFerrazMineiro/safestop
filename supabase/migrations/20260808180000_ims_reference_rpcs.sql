-- ============================================================================
-- SafeStop — Sprint 2.8: Referência IMS (register + update + timeline)
-- ============================================================================
-- Referências: docs/decisions/IMS-REFERENCE-DECISIONS.md (PO-IMS-1…PO-IMS-16)
-- Campos ims_reference_* já existem em occurrences (Sprint 2.0).
-- SEM tabela nova; SEM integração externa IMS.
-- ============================================================================

-- ============================================================================
-- 1. RPC register_ims_reference
-- ============================================================================

create function public.register_ims_reference(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_occurrence_id uuid;
  v_ims_code text;
  v_organization_id uuid;
  v_status text;
  v_decision_type text;
  v_existing_code text;
  v_registered_at timestamptz;
  v_registered_by uuid;
  v_transitioned_at timestamptz;
  v_mdho_approved boolean;
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
  v_ims_code := nullif(btrim(p_payload ->> 'ims_reference_code'), '');

  if v_occurrence_id is null or v_ims_code is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Campos obrigatórios: occurrence_id, ims_reference_code.'
      )
    );
  end if;

  if v_ims_code !~ '^BAA-[0-9]{2}-[0-9]{4,}$' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Use o formato BAA-XX-0000 (ex.: BAA-26-0001).'
      )
    );
  end if;

  select
    o.organization_id,
    o.status,
    o.decision_type,
    o.ims_reference_code,
    o.ims_reference_registered_at,
    o.ims_reference_registered_by
  into
    v_organization_id,
    v_status,
    v_decision_type,
    v_existing_code,
    v_registered_at,
    v_registered_by
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

  if not public.has_permission('ims_reference.register', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão ims_reference.register.'
      )
    );
  end if;

  if v_decision_type is distinct from 'INTERDICAO_OFICIAL' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Referência IMS não aplicável ao ramo Ver e Agir.'
      )
    );
  end if;

  if v_status = 'EM_TRATATIVA' and v_existing_code is not null then
    if v_ims_code = v_existing_code then
      return jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
          'occurrence', jsonb_build_object(
            'id', v_occurrence_id,
            'status', 'EM_TRATATIVA',
            'ims_reference_code', v_existing_code,
            'ims_reference_registered_at', v_registered_at,
            'ims_reference_registered_by', v_registered_by
          ),
          'idempotent', true
        )
      );
    end if;

    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'ALREADY_REGISTERED',
        'message', 'Esta ocorrência já possui referência IMS registrada.',
        'imsReferenceCode', v_existing_code
      )
    );
  end if;

  if v_existing_code is not null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'ALREADY_REGISTERED',
        'message', 'Esta ocorrência já possui referência IMS registrada.',
        'imsReferenceCode', v_existing_code
      )
    );
  end if;

  if v_status <> 'AGUARDANDO_REGISTRO_IMS' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Registro IMS só permitido com ocorrência em AGUARDANDO_REGISTRO_IMS.',
        'currentStatus', v_status
      )
    );
  end if;

  select exists (
    select 1
    from public.mdho_assessments a
    where a.occurrence_id = v_occurrence_id
      and a.status = 'APPROVED'
  )
  into v_mdho_approved;

  if not v_mdho_approved then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'MDHO deve estar aprovado antes do registro IMS.'
      )
    );
  end if;

  update public.occurrences
  set
    ims_reference_code = v_ims_code,
    ims_reference_registered_at = now(),
    ims_reference_registered_by = v_user_id,
    status = 'EM_TRATATIVA',
    updated_at = now()
  where id = v_occurrence_id
    and status = 'AGUARDANDO_REGISTRO_IMS'
    and ims_reference_code is null;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao registrar referência IMS.'
      )
    );
  end if;

  insert into public.occurrence_status_history (
    occurrence_id,
    from_status,
    to_status,
    metadata,
    changed_by
  )
  values (
    v_occurrence_id,
    'AGUARDANDO_REGISTRO_IMS',
    'EM_TRATATIVA',
    jsonb_build_object(
      'action', 'register_ims',
      'ims_reference_code', v_ims_code
    ),
    v_user_id
  )
  returning changed_at into v_transitioned_at;

  -- notification dispatch Sprint 3 (sem implementar)

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'occurrence', jsonb_build_object(
        'id', v_occurrence_id,
        'status', 'EM_TRATATIVA',
        'ims_reference_code', v_ims_code,
        'ims_reference_registered_at', v_transitioned_at,
        'ims_reference_registered_by', v_user_id
      )
    )
  );
end;
$$;

comment on function public.register_ims_reference(jsonb) is
  'AGUARDANDO_REGISTRO_IMS → EM_TRATATIVA; registro manual código BAA (Sprint 2.8).';


-- ============================================================================
-- 2. RPC update_ims_reference
-- ============================================================================

create function public.update_ims_reference(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_occurrence_id uuid;
  v_ims_code text;
  v_update_reason text;
  v_organization_id uuid;
  v_status text;
  v_decision_type text;
  v_previous_code text;
  v_updated_at timestamptz;
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
  v_ims_code := nullif(btrim(p_payload ->> 'ims_reference_code'), '');
  v_update_reason := nullif(btrim(p_payload ->> 'update_reason'), '');

  if v_occurrence_id is null or v_ims_code is null or v_update_reason is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Campos obrigatórios: occurrence_id, ims_reference_code, update_reason.'
      )
    );
  end if;

  if v_ims_code !~ '^BAA-[0-9]{2}-[0-9]{4,}$' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Use o formato BAA-XX-0000 (ex.: BAA-26-0001).'
      )
    );
  end if;

  if char_length(v_update_reason) < 10 or char_length(v_update_reason) > 4000 then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'update_reason deve ter entre 10 e 4000 caracteres.'
      )
    );
  end if;

  select
    o.organization_id,
    o.status,
    o.decision_type,
    o.ims_reference_code
  into
    v_organization_id,
    v_status,
    v_decision_type,
    v_previous_code
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

  if not public.has_permission('ims_reference.update', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão ims_reference.update.'
      )
    );
  end if;

  if v_decision_type is distinct from 'INTERDICAO_OFICIAL' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Referência IMS não aplicável ao ramo Ver e Agir.'
      )
    );
  end if;

  if v_previous_code is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Referência IMS ainda não registrada nesta ocorrência.'
      )
    );
  end if;

  if v_status in ('ENCERRADA', 'LIBERADA', 'CANCELADA') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Referência IMS não pode ser alterada em status terminal.',
        'currentStatus', v_status
      )
    );
  end if;

  if v_status not in ('EM_TRATATIVA', 'AGUARDANDO_VALIDACAO') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Referência IMS só pode ser corrigida após registro em tratativa.',
        'currentStatus', v_status
      )
    );
  end if;

  if v_ims_code = v_previous_code then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Novo código IMS deve ser diferente do código atual.'
      )
    );
  end if;

  update public.occurrences
  set
    ims_reference_code = v_ims_code,
    ims_reference_updated_at = now(),
    ims_reference_updated_by = v_user_id,
    updated_at = now()
  where id = v_occurrence_id
    and ims_reference_code = v_previous_code
    and status = v_status;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao atualizar referência IMS.'
      )
    );
  end if;

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
    v_status,
    v_status,
    left(v_update_reason, 500),
    jsonb_build_object(
      'action', 'update_ims',
      'previous_code', v_previous_code,
      'new_code', v_ims_code,
      'update_reason', left(v_update_reason, 200)
    ),
    v_user_id
  )
  returning changed_at into v_updated_at;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'occurrence', jsonb_build_object(
        'id', v_occurrence_id,
        'status', v_status,
        'ims_reference_code', v_ims_code,
        'ims_reference_updated_at', v_updated_at,
        'ims_reference_updated_by', v_user_id,
        'previous_ims_reference_code', v_previous_code
      )
    )
  );
end;
$$;

comment on function public.update_ims_reference(jsonb) is
  'Corrige ims_reference_code em EM_TRATATIVA+; history metadata update_ims (Sprint 2.8).';


-- ============================================================================
-- 3. Grants
-- ============================================================================

grant execute on function public.register_ims_reference(jsonb) to authenticated;
grant execute on function public.update_ims_reference(jsonb) to authenticated;


-- ============================================================================
-- 4. Patch get_occurrence_timeline — títulos IMS (PO-IMS-9)
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
        when h.from_status = 'INTERDICAO_CONFIRMADA' and h.to_status = 'MDHO_EM_PREENCHIMENTO'
          then 'MDHO iniciado'
        when h.from_status = 'MDHO_EM_PREENCHIMENTO' and h.to_status = 'AGUARDANDO_APROVACAO_HSE'
          then 'MDHO enviado'
        when h.from_status = 'AGUARDANDO_APROVACAO_HSE' and h.to_status = 'AGUARDANDO_REGISTRO_IMS'
          then 'MDHO aprovado'
        when h.from_status = 'AGUARDANDO_APROVACAO_HSE' and h.to_status = 'MDHO_EM_PREENCHIMENTO'
          then 'MDHO devolvido'
        when h.from_status = 'AGUARDANDO_REGISTRO_IMS' and h.to_status = 'EM_TRATATIVA'
          then 'Referência IMS registrada'
        when h.from_status = 'EM_TRATATIVA' and h.to_status = 'EM_TRATATIVA'
          and coalesce(h.metadata ->> 'action', '') = 'update_ims'
          then 'Referência IMS alterada'
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
        when h.from_status = 'INTERDICAO_CONFIRMADA' and h.to_status = 'MDHO_EM_PREENCHIMENTO' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'start_mdho'),
          'assessmentId', h.metadata ->> 'assessment_id',
          'actorName', pr_eval.full_name
        )
        when h.from_status = 'MDHO_EM_PREENCHIMENTO' and h.to_status = 'AGUARDANDO_APROVACAO_HSE' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'submit_mdho'),
          'assessmentId', h.metadata ->> 'assessment_id',
          'actorName', pr_eval.full_name
        )
        when h.from_status = 'AGUARDANDO_APROVACAO_HSE' and h.to_status = 'AGUARDANDO_REGISTRO_IMS' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'approve_mdho'),
          'assessmentId', h.metadata ->> 'assessment_id',
          'actorName', pr_eval.full_name
        )
        when h.from_status = 'AGUARDANDO_APROVACAO_HSE' and h.to_status = 'MDHO_EM_PREENCHIMENTO' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'return_mdho'),
          'assessmentId', h.metadata ->> 'assessment_id',
          'returnReason', left(coalesce(h.metadata ->> 'return_reason', h.reason), 200),
          'actorName', pr_eval.full_name
        )
        when h.from_status = 'AGUARDANDO_REGISTRO_IMS' and h.to_status = 'EM_TRATATIVA' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'register_ims'),
          'imsReferenceCode', h.metadata ->> 'ims_reference_code',
          'actorName', pr_eval.full_name
        )
        when h.from_status = 'EM_TRATATIVA' and h.to_status = 'EM_TRATATIVA'
          and coalesce(h.metadata ->> 'action', '') = 'update_ims' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', 'update_ims',
          'previousCode', h.metadata ->> 'previous_code',
          'newCode', h.metadata ->> 'new_code',
          'updateReason', left(coalesce(h.metadata ->> 'update_reason', h.reason), 200),
          'actorName', pr_eval.full_name
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
  'Feed timeline unificado; títulos VA + IO + MDHO + IMS (Sprint 2.8).';
