-- Fix: retornar CONFLICT jsonb em vez de raise exception no UPDATE concorrente.

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

  if v_decision_type <> 'VER_E_AGIR' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'decision_type inválido para Sprint 2.4. Permitido: VER_E_AGIR.'
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

  if not public.has_permission('occurrence.evaluate', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.evaluate.'
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

  if v_status = 'VER_E_AGIR' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Ocorrência já está em Ver e Agir.',
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
    status = 'VER_E_AGIR',
    decision_type = 'VER_E_AGIR',
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
    'VER_E_AGIR',
    left(v_decision_reason, 500),
    jsonb_build_object(
      'decision_type', v_decision_type,
      'decision_id', v_decision_id
    ),
    v_user_id
  )
  returning changed_at into v_transitioned_at;

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
        'status', 'VER_E_AGIR',
        'decision_type', 'VER_E_AGIR',
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
