-- ============================================================================
-- SafeStop — Sprint 3.1: Notification dispatch patches (auto-generated)
-- ============================================================================

-- Patch: create_occurrence
create or replace function public.create_occurrence(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_organization_id uuid;
  v_area_id uuid;
  v_unit_id uuid;
  v_management_department_id uuid;
  v_contract_id uuid;
  v_contractor_organization_id uuid;
  v_title text;
  v_task_description text;
  v_location_description text;
  v_condition_description text;
  v_immediate_action_description text;
  v_severity text;
  v_latitude numeric(9, 6);
  v_longitude numeric(9, 6);
  v_location_accuracy numeric(8, 2);
  v_occurred_at timestamptz;
  v_stopped_at timestamptz;
  v_area_unit_id uuid;
  v_year smallint;
  v_sequence integer;
  v_public_code text;
  v_occurrence_id uuid;
  v_result jsonb;
begin
  -- Campos ignorados do payload cliente (nunca lidos abaixo):
  -- created_by, status, public_code, stopped_at
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

  v_organization_id := nullif(btrim(payload ->> 'organization_id'), '')::uuid;
  v_area_id := nullif(btrim(payload ->> 'area_id'), '')::uuid;
  v_unit_id := nullif(btrim(payload ->> 'unit_id'), '')::uuid;
  v_management_department_id := nullif(btrim(payload ->> 'management_department_id'), '')::uuid;
  v_contract_id := nullif(btrim(payload ->> 'contract_id'), '')::uuid;
  v_contractor_organization_id := nullif(btrim(payload ->> 'contractor_organization_id'), '')::uuid;
  v_title := nullif(btrim(payload ->> 'title'), '');
  v_task_description := nullif(btrim(payload ->> 'task_description'), '');
  v_location_description := nullif(btrim(payload ->> 'location_description'), '');
  v_condition_description := nullif(btrim(payload ->> 'condition_description'), '');
  v_immediate_action_description := nullif(btrim(payload ->> 'immediate_action_description'), '');
  v_severity := nullif(btrim(payload ->> 'severity'), '');
  v_latitude := nullif(payload ->> 'latitude', '')::numeric(9, 6);
  v_longitude := nullif(payload ->> 'longitude', '')::numeric(9, 6);
  v_location_accuracy := nullif(payload ->> 'location_accuracy', '')::numeric(8, 2);
  v_occurred_at := coalesce(nullif(payload ->> 'occurred_at', '')::timestamptz, now());
  v_stopped_at := v_occurred_at;

  if v_organization_id is null
     or v_area_id is null
     or v_contractor_organization_id is null
     or v_title is null
     or v_task_description is null
     or v_location_description is null
     or v_condition_description is null
     or v_severity is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Campos obrigatórios ausentes: organization_id, area_id, contractor_organization_id, title, task_description, location_description, condition_description, severity.'
      )
    );
  end if;

  if v_severity not in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'severity inválida. Valores permitidos: LOW, MEDIUM, HIGH, CRITICAL.'
      )
    );
  end if;

  if not (v_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem vínculo ativo na organização informada.'
      )
    );
  end if;

  if not public.has_permission('occurrence.create', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.create na organização informada.'
      )
    );
  end if;

  if not exists (
    select 1
    from public.contracts c
    where c.client_organization_id = v_organization_id
      and c.contractor_organization_id = v_contractor_organization_id
      and c.is_active = true
  ) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'contractor_organization_id deve ser uma contratada vinculada por contrato ativo à organização informada.'
      )
    );
  end if;

  if v_contract_id is not null then
    if not exists (
      select 1
      from public.contracts c
      where c.id = v_contract_id
        and c.client_organization_id = v_organization_id
        and c.contractor_organization_id = v_contractor_organization_id
        and c.is_active = true
    ) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'VALIDATION_ERROR',
          'message', 'contract_id inválido ou inconsistente com organization_id e contractor_organization_id.'
        )
      );
    end if;
  end if;

  select a.unit_id
    into v_area_unit_id
  from public.areas a
  where a.id = v_area_id
    and a.organization_id = v_organization_id
    and a.is_active = true;

  if v_area_unit_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'area_id inválida, inativa ou não pertence à organização informada.'
      )
    );
  end if;

  if v_unit_id is null then
    v_unit_id := v_area_unit_id;
  elsif v_unit_id <> v_area_unit_id then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'unit_id deve ser consistente com a unidade da área informada.'
      )
    );
  end if;

  if v_management_department_id is not null then
    if not exists (
      select 1
      from public.management_departments md
      where md.id = v_management_department_id
        and md.organization_id = v_organization_id
        and md.is_active = true
    ) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'VALIDATION_ERROR',
          'message', 'management_department_id inválida ou não pertence à organização informada.'
        )
      );
    end if;
  end if;

  v_year := (extract(year from timezone('utc', now()))::integer % 100)::smallint;

  insert into public.occurrence_public_code_yearly_counters (year, last_value)
  values (v_year, 1)
  on conflict (year)
  do update
    set last_value = public.occurrence_public_code_yearly_counters.last_value + 1
  returning last_value into v_sequence;

  v_public_code := 'SS-'
    || lpad(v_year::text, 2, '0')
    || '-'
    || lpad(v_sequence::text, 6, '0');

  insert into public.occurrences (
    organization_id,
    unit_id,
    area_id,
    management_department_id,
    contract_id,
    contractor_organization_id,
    public_code,
    title,
    task_description,
    location_description,
    condition_description,
    immediate_action_description,
    severity,
    status,
    latitude,
    longitude,
    location_accuracy,
    occurred_at,
    stopped_at,
    created_by
  )
  values (
    v_organization_id,
    v_unit_id,
    v_area_id,
    v_management_department_id,
    v_contract_id,
    v_contractor_organization_id,
    v_public_code,
    v_title,
    v_task_description,
    v_location_description,
    v_condition_description,
    v_immediate_action_description,
    v_severity,
    'PARALISACAO_PREVENTIVA',
    v_latitude,
    v_longitude,
    v_location_accuracy,
    v_occurred_at,
    v_stopped_at,
    v_user_id
  )
  returning id into v_occurrence_id;

  insert into public.occurrence_status_history (
    occurrence_id,
    from_status,
    to_status,
    changed_by
  )
  values (
    v_occurrence_id,
    null,
    'PARALISACAO_PREVENTIVA',
    v_user_id
  );

  select jsonb_build_object(
    'id', o.id,
    'organization_id', o.organization_id,
    'area_id', o.area_id,
    'unit_id', o.unit_id,
    'contract_id', o.contract_id,
    'contractor_organization_id', o.contractor_organization_id,
    'public_code', o.public_code,
    'title', o.title,
    'severity', o.severity,
    'status', o.status,
    'created_by', o.created_by,
    'occurred_at', o.occurred_at,
    'stopped_at', o.stopped_at,
    'created_at', o.created_at
  )
  into v_result
  from public.occurrences o
  where o.id = v_occurrence_id;

  perform public.create_occurrence_notification_event(
    v_occurrence_id,
    'OCCURRENCE_CREATED',
    'CRITICAL',
    'Paralisação Preventiva registrada',
    coalesce(v_title, 'Nova Paralisação Preventiva'),
    true,
    public.lookup_organization_member_id(v_user_id, v_organization_id),
    v_user_id,
    jsonb_build_object('public_code', v_public_code)
  );

  return jsonb_build_object(
    'success', true,
    'data', v_result
  );

exception
  when unique_violation then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Código público da ocorrência já existe. Tente novamente.'
      )
    );
  when others then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'INTERNAL_ERROR',
        'message', 'Não foi possível registrar a ocorrência.'
      )
    );
end;
$$;

-- Patch: start_occurrence_evaluation
create or replace function public.start_occurrence_evaluation(p_occurrence_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_organization_id uuid;
  v_status text;
  v_assigned_evaluator_id uuid;
  v_updated_at timestamptz;
  v_transitioned_at timestamptz;
  v_rows integer;
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

  select o.organization_id, o.status, o.assigned_evaluator_id, o.updated_at
    into v_organization_id, v_status, v_assigned_evaluator_id, v_updated_at
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

  if not public.can_access_occurrence(p_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  update public.occurrences
  set
    status = 'EM_AVALIACAO',
    assigned_evaluator_id = v_user_id,
    updated_at = now()
  where id = p_occurrence_id
    and status = 'PARALISACAO_PREVENTIVA';

  get diagnostics v_rows = row_count;

  if v_rows = 1 then
    insert into public.occurrence_status_history (
      occurrence_id,
      from_status,
      to_status,
      metadata,
      changed_by
    )
    values (
      p_occurrence_id,
      'PARALISACAO_PREVENTIVA',
      'EM_AVALIACAO',
      jsonb_build_object('action', 'start_evaluation'),
      v_user_id
    )
    returning changed_at into v_transitioned_at;

    -- notification dispatch Sprint 3 (sem implementar)

    perform public.create_occurrence_notification_event(
      p_occurrence_id,
      'DECISION_REQUIRED',
      'HIGH',
      'Avaliação iniciada',
      'Ocorrência aguarda avaliação da liderança HSE.',
      false,
      public.lookup_organization_member_id(v_user_id, v_organization_id),
      v_user_id,
      jsonb_build_object('action', 'start_evaluation')
    );

    return jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'occurrence_id', p_occurrence_id,
        'previous_status', 'PARALISACAO_PREVENTIVA',
        'current_status', 'EM_AVALIACAO',
        'assigned_evaluator_id', v_user_id,
        'transitioned_at', v_transitioned_at
      )
    );
  end if;

  select o.status, o.assigned_evaluator_id, o.updated_at
    into v_status, v_assigned_evaluator_id, v_updated_at
  from public.occurrences o
  where o.id = p_occurrence_id;

  if v_status = 'EM_AVALIACAO' and v_assigned_evaluator_id = v_user_id then
    select h.changed_at
      into v_transitioned_at
    from public.occurrence_status_history h
    where h.occurrence_id = p_occurrence_id
      and h.from_status = 'PARALISACAO_PREVENTIVA'
      and h.to_status = 'EM_AVALIACAO'
    order by h.changed_at desc, h.id desc
    limit 1;

    return jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'occurrence_id', p_occurrence_id,
        'previous_status', 'EM_AVALIACAO',
        'current_status', 'EM_AVALIACAO',
        'assigned_evaluator_id', v_assigned_evaluator_id,
        'transitioned_at', coalesce(v_transitioned_at, v_updated_at)
      )
    );
  end if;

  return jsonb_build_object(
    'success', false,
    'error', jsonb_build_object(
      'code', 'STATUS_MISMATCH',
      'message', 'Ocorrência não está em Paralisação Preventiva ou avaliação já iniciada por outro usuário.',
      'currentStatus', v_status
    )
  );
end;
$$;

-- Patch: record_occurrence_decision
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

  if v_decision_type = 'VER_E_AGIR' then
    perform public.create_occurrence_notification_event(
      v_occurrence_id,
      'VER_AND_ACT_REQUIRED',
      'HIGH',
      'Decisão: Ver e Agir',
      left(v_decision_reason, 500),
      true,
      public.lookup_organization_member_id(v_user_id, v_organization_id),
      v_user_id,
      jsonb_build_object('decision_type', v_decision_type, 'decision_id', v_decision_id)
    );
  elsif v_decision_type = 'INTERDICAO_OFICIAL' then
    perform public.create_occurrence_notification_event(
      v_occurrence_id,
      'INTERDICTION_CONFIRMED',
      'CRITICAL',
      'Interdição Oficial confirmada',
      left(v_decision_reason, 500),
      true,
      public.lookup_organization_member_id(v_user_id, v_organization_id),
      v_user_id,
      jsonb_build_object('decision_type', v_decision_type, 'decision_id', v_decision_id)
    );
  end if;

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
