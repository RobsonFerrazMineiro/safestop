-- ============================================================================
-- SafeStop — Sprint 3.1: Notification dispatch patches (auto-generated)
-- ============================================================================

-- Patch: create_action_plan
create or replace function public.create_action_plan(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_occurrence_id uuid;
  v_summary text;
  v_organization_id uuid;
  v_status text;
  v_decision_type text;
  v_ims_code text;
  v_existing_plan_id uuid;
  v_existing_status text;
  v_plan_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  if p_payload is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Payload é obrigatório.'));
  end if;

  v_occurrence_id := nullif(btrim(p_payload ->> 'occurrence_id'), '')::uuid;
  v_summary := nullif(btrim(p_payload ->> 'summary'), '');

  if v_occurrence_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'occurrence_id é obrigatório.'));
  end if;

  if v_summary is not null and char_length(v_summary) > 4000 then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'summary deve ter no máximo 4000 caracteres.'));
  end if;

  select o.organization_id, o.status, o.decision_type, o.ims_reference_code
    into v_organization_id, v_status, v_decision_type, v_ims_code
  from public.occurrences o
  where o.id = v_occurrence_id;

  if v_organization_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Ocorrência não encontrada.'));
  end if;

  if not (v_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem vínculo ativo na organização da ocorrência.'));
  end if;

  if not public.can_access_occurrence(v_occurrence_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem escopo de acesso à ocorrência.'));
  end if;

  if not public.has_permission('action_plan.create', v_organization_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão action_plan.create.'));
  end if;

  if v_decision_type is distinct from 'INTERDICAO_OFICIAL' then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Plano de Ação não aplicável ao ramo Ver e Agir.'));
  end if;

  if v_status is distinct from 'EM_TRATATIVA' then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Plano de Ação só pode ser criado em EM_TRATATIVA.'));
  end if;

  if v_ims_code is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Registre a referência IMS antes de criar o Plano de Ação.'));
  end if;

  select ap.id, ap.status
    into v_existing_plan_id, v_existing_status
  from public.action_plans ap
  where ap.occurrence_id = v_occurrence_id
    and ap.status in ('OPEN', 'IN_PROGRESS', 'AWAITING_VALIDATION')
  limit 1;

  if v_existing_plan_id is not null then
    return jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'plan', jsonb_build_object('id', v_existing_plan_id, 'status', v_existing_status, 'occurrence_id', v_occurrence_id),
        'idempotent', true
      )
    );
  end if;

  insert into public.action_plans (occurrence_id, organization_id, status, summary, created_by)
  values (v_occurrence_id, v_organization_id, 'OPEN', v_summary, v_user_id)
  returning id into v_plan_id;

  insert into public.occurrence_status_history (occurrence_id, from_status, to_status, metadata, changed_by)
  values (
    v_occurrence_id,
    'EM_TRATATIVA',
    'EM_TRATATIVA',
    jsonb_build_object(
      'timeline_kind', 'ACTION_PLAN_CREATED',
      'action', 'action_plan_created',
      'plan_id', v_plan_id
    ),
    v_user_id
  );

  perform public.create_occurrence_notification_event(
    v_occurrence_id,
    'ACTION_PLAN_CREATED',
    'MEDIUM',
    'Plano de Ação criado',
    coalesce(v_summary, 'Plano de Ação criado para a ocorrência.'),
    false,
    public.lookup_organization_member_id(v_user_id, v_organization_id),
    v_user_id,
    jsonb_build_object('plan_id', v_plan_id)
  );

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'plan', jsonb_build_object('id', v_plan_id, 'status', 'OPEN', 'occurrence_id', v_occurrence_id, 'summary', v_summary)
    )
  );
end;
$$;

-- Patch: add_action_item
create or replace function public.add_action_item(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_plan_id uuid;
  v_title text;
  v_description text;
  v_responsible_member_id uuid;
  v_responsible_org_id uuid;
  v_due_at timestamptz;
  v_priority text;
  v_plan public.action_plans%rowtype;
  v_item_id uuid;
  v_member_org_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  v_plan_id := nullif(btrim(p_payload ->> 'action_plan_id'), '')::uuid;
  if v_plan_id is null then
    v_plan_id := nullif(btrim(p_payload ->> 'plan_id'), '')::uuid;
  end if;

  v_title := nullif(btrim(p_payload ->> 'title'), '');
  v_description := nullif(btrim(p_payload ->> 'description'), '');
  v_responsible_member_id := nullif(btrim(p_payload ->> 'responsible_member_id'), '')::uuid;
  v_responsible_org_id := nullif(btrim(p_payload ->> 'responsible_organization_id'), '')::uuid;
  v_due_at := nullif(p_payload ->> 'due_at', '')::timestamptz;
  v_priority := nullif(btrim(p_payload ->> 'priority'), '');

  if v_plan_id is null or v_title is null or v_responsible_member_id is null or v_due_at is null or v_priority is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Campos obrigatórios: action_plan_id, title, responsible_member_id, due_at, priority.'));
  end if;

  if v_priority not in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'priority inválida.'));
  end if;

  select * into v_plan from public.action_plans where id = v_plan_id;

  if v_plan.id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Plano não encontrado.'));
  end if;

  if not public.has_permission('action_plan.manage', v_plan.organization_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão action_plan.manage.'));
  end if;

  if not public.can_access_occurrence(v_plan.occurrence_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem escopo de acesso à ocorrência.'));
  end if;

  if v_plan.status in ('COMPLETED', 'CANCELLED') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Plano não aceita novas ações neste status.'));
  end if;

  select om.organization_id into v_member_org_id
  from public.organization_members om
  where om.id = v_responsible_member_id and om.is_active = true;

  if v_member_org_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Responsável inválido ou inativo.'));
  end if;

  if v_member_org_id <> v_plan.organization_id then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Responsável deve pertencer à organização da ocorrência.'));
  end if;

  if v_responsible_org_id is null then
    v_responsible_org_id := v_plan.organization_id;
  end if;

  insert into public.action_items (
    action_plan_id, organization_id, title, description,
    responsible_member_id, responsible_organization_id, due_at, priority, status
  )
  values (
    v_plan_id, v_plan.organization_id, v_title, v_description,
    v_responsible_member_id, v_responsible_org_id, v_due_at, v_priority, 'PENDING'
  )
  returning id into v_item_id;

  if v_plan.status = 'OPEN' then
    update public.action_plans set status = 'IN_PROGRESS' where id = v_plan_id;
  end if;

  insert into public.occurrence_status_history (occurrence_id, from_status, to_status, metadata, changed_by)
  values (
    v_plan.occurrence_id, 'EM_TRATATIVA', 'EM_TRATATIVA',
    jsonb_build_object(
      'timeline_kind', 'ACTION_ITEM_CREATED',
      'action', 'action_item_created',
      'plan_id', v_plan_id,
      'item_id', v_item_id,
      'title', v_title,
      'priority', v_priority
    ),
    v_user_id
  );

  perform public.create_occurrence_notification_event(
    v_plan.occurrence_id,
    'ACTION_ITEM_ASSIGNED',
    'MEDIUM',
    'Ação corretiva atribuída',
    v_title,
    false,
    public.lookup_organization_member_id(v_user_id, v_plan.organization_id),
    v_user_id,
    jsonb_build_object('item_id', v_item_id, 'plan_id', v_plan_id),
    jsonb_build_array(jsonb_build_object('organization_member_id', v_responsible_member_id, 'participant_type', 'ACTION_OWNER'))
  );

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'item', jsonb_build_object('id', v_item_id, 'status', 'PENDING', 'action_plan_id', v_plan_id)
    )
  );
end;
$$;

-- Patch: update_action_item
create or replace function public.update_action_item(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_item_id uuid;
  v_title text;
  v_description text;
  v_responsible_member_id uuid;
  v_due_at timestamptz;
  v_priority text;
  v_item public.action_items%rowtype;
  v_plan public.action_plans%rowtype;
  v_old_responsible uuid;
  v_old_due timestamptz;
  v_member_org_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  v_item_id := nullif(btrim(p_payload ->> 'item_id'), '')::uuid;
  v_title := nullif(btrim(p_payload ->> 'title'), '');
  v_description := nullif(btrim(p_payload ->> 'description'), '');
  v_responsible_member_id := nullif(btrim(p_payload ->> 'responsible_member_id'), '')::uuid;
  v_due_at := nullif(p_payload ->> 'due_at', '')::timestamptz;
  v_priority := nullif(btrim(p_payload ->> 'priority'), '');

  if v_item_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'item_id é obrigatório.'));
  end if;

  select * into v_item from public.action_items where id = v_item_id;
  if v_item.id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Ação não encontrada.'));
  end if;

  select * into v_plan from public.action_plans where id = v_item.action_plan_id;

  if not public.has_permission('action_plan.manage', v_item.organization_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão action_plan.manage.'));
  end if;

  if not public.can_access_occurrence(v_plan.occurrence_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem escopo de acesso à ocorrência.'));
  end if;

  if v_item.status in ('COMPLETED', 'CANCELLED', 'AWAITING_VALIDATION') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Ação não editável neste status.'));
  end if;

  v_old_responsible := v_item.responsible_member_id;
  v_old_due := v_item.due_at;

  if v_responsible_member_id is not null then
    select om.organization_id into v_member_org_id
    from public.organization_members om
    where om.id = v_responsible_member_id and om.is_active = true;

    if v_member_org_id is null or v_member_org_id <> v_item.organization_id then
      return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Responsável deve pertencer à organização da ocorrência.'));
    end if;
  end if;

  update public.action_items
  set
    title = coalesce(v_title, title),
    description = coalesce(v_description, description),
    responsible_member_id = coalesce(v_responsible_member_id, responsible_member_id),
    due_at = coalesce(v_due_at, due_at),
    priority = coalesce(v_priority, priority)
  where id = v_item_id;

  if v_responsible_member_id is not null and v_responsible_member_id <> v_old_responsible then
    perform public.create_occurrence_notification_event(
      v_plan.occurrence_id,
      'ACTION_ITEM_ASSIGNED',
      'MEDIUM',
      'Responsável da ação alterado',
      coalesce(v_title, v_item.title),
      false,
      public.lookup_organization_member_id(v_user_id, v_item.organization_id),
      v_user_id,
      jsonb_build_object('item_id', v_item_id),
      jsonb_build_array(jsonb_build_object('organization_member_id', v_responsible_member_id, 'participant_type', 'ACTION_OWNER'))
    );

    insert into public.occurrence_status_history (occurrence_id, from_status, to_status, metadata, changed_by)
    values (
      v_plan.occurrence_id, 'EM_TRATATIVA', 'EM_TRATATIVA',
      jsonb_build_object(
        'timeline_kind', 'ACTION_ITEM_ASSIGNED',
        'action', 'action_item_assigned',
        'item_id', v_item_id,
        'previousResponsibleMemberId', v_old_responsible,
        'newResponsibleMemberId', v_responsible_member_id
      ),
      v_user_id
    );
  end if;

  if v_due_at is not null and v_due_at <> v_old_due then
    insert into public.occurrence_status_history (occurrence_id, from_status, to_status, metadata, changed_by)
    values (
      v_plan.occurrence_id, 'EM_TRATATIVA', 'EM_TRATATIVA',
      jsonb_build_object(
        'timeline_kind', 'ACTION_ITEM_DUE_CHANGED',
        'action', 'action_item_due_changed',
        'item_id', v_item_id,
        'previousDueAt', v_old_due,
        'newDueAt', v_due_at
      ),
      v_user_id
    );
  end if;

  return jsonb_build_object('success', true, 'data', jsonb_build_object('item_id', v_item_id));
end;
$$;

-- Patch: submit_action_item
create or replace function public.submit_action_item(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_item_id uuid;
  v_completion_description text;
  v_item public.action_items%rowtype;
  v_plan public.action_plans%rowtype;
  v_evidence_count integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  v_item_id := nullif(btrim(p_payload ->> 'item_id'), '')::uuid;
  v_completion_description := nullif(btrim(p_payload ->> 'completion_description'), '');

  if v_item_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'item_id é obrigatório.'));
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
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão para concluir a ação.'));
  end if;

  if v_item.status not in ('IN_PROGRESS', 'PENDING') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Ação não pode ser enviada para validação neste status.'));
  end if;

  if v_item.priority in ('CRITICAL', 'HIGH') then
    select count(*) into v_evidence_count
    from public.action_item_attachments a
    where a.action_item_id = v_item_id
      and a.upload_status = 'COMPLETED'
      and a.deleted_at is null;

    if v_evidence_count < 1 then
      return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Anexe ao menos uma evidência para esta prioridade.'));
    end if;
  end if;

  update public.action_items
  set
    status = 'AWAITING_VALIDATION',
    completion_description = v_completion_description,
    completed_at = now(),
    completed_by = v_user_id
  where id = v_item_id;

  insert into public.occurrence_status_history (occurrence_id, from_status, to_status, metadata, changed_by)
  values (
    v_plan.occurrence_id, 'EM_TRATATIVA', 'EM_TRATATIVA',
    jsonb_build_object(
      'timeline_kind', 'ACTION_ITEM_STATUS_CHANGED',
      'action', 'action_item_status_changed',
      'sub_action', 'submit',
      'item_id', v_item_id,
      'previousStatus', v_item.status,
      'newStatus', 'AWAITING_VALIDATION'
    ),
    v_user_id
  );

  perform public.create_occurrence_notification_event(
    v_plan.occurrence_id,
    'ACTION_ITEM_SUBMITTED',
    'HIGH',
    'Ação enviada para validação',
    coalesce(v_item.title, 'Ação corretiva'),
    false,
    public.lookup_organization_member_id(v_user_id, v_item.organization_id),
    v_user_id,
    jsonb_build_object('item_id', v_item_id)
  );

  return jsonb_build_object('success', true, 'data', jsonb_build_object('item', jsonb_build_object('id', v_item_id, 'status', 'AWAITING_VALIDATION')));
end;
$$;

-- Patch: validate_action_item
create or replace function public.validate_action_item(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_item_id uuid;
  v_outcome text;
  v_note text;
  v_item public.action_items%rowtype;
  v_plan public.action_plans%rowtype;
  v_new_status text;
  v_sub_action text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  v_item_id := nullif(btrim(p_payload ->> 'item_id'), '')::uuid;
  v_outcome := nullif(btrim(p_payload ->> 'outcome'), '');
  v_note := nullif(btrim(p_payload ->> 'note'), '');

  if v_item_id is null or v_outcome is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'item_id e outcome são obrigatórios.'));
  end if;

  if v_outcome not in ('COMPLETED', 'REJECTED') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'outcome deve ser COMPLETED ou REJECTED.'));
  end if;

  select * into v_item from public.action_items where id = v_item_id;
  if v_item.id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Ação não encontrada.'));
  end if;

  select * into v_plan from public.action_plans where id = v_item.action_plan_id;

  if not public.has_permission('action_plan.validate', v_item.organization_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão action_plan.validate.'));
  end if;

  if not public.can_access_occurrence(v_plan.occurrence_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem escopo de acesso à ocorrência.'));
  end if;

  if v_item.status <> 'AWAITING_VALIDATION' then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Ação não está aguardando validação.'));
  end if;

  if v_item.completed_by = v_user_id then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'SELF_VALIDATION_FORBIDDEN', 'message', 'Quem concluiu a ação não pode validá-la.'));
  end if;

  if v_outcome = 'REJECTED' and (v_note is null or char_length(v_note) < 10) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Motivo da rejeição deve ter entre 10 e 4000 caracteres.'));
  end if;

  if v_outcome = 'COMPLETED' then
    v_new_status := 'COMPLETED';
    v_sub_action := 'validate_completed';
  else
    v_new_status := 'IN_PROGRESS';
    v_sub_action := 'validate_rejected';
  end if;

  update public.action_items
  set
    status = v_new_status,
    validated_at = now(),
    validated_by = v_user_id,
    validation_note = v_note
  where id = v_item_id;

  insert into public.occurrence_status_history (occurrence_id, from_status, to_status, reason, metadata, changed_by)
  values (
    v_plan.occurrence_id, 'EM_TRATATIVA', 'EM_TRATATIVA', v_note,
    jsonb_build_object(
      'timeline_kind', 'ACTION_ITEM_STATUS_CHANGED',
      'action', 'action_item_status_changed',
      'sub_action', v_sub_action,
      'item_id', v_item_id,
      'previousStatus', 'AWAITING_VALIDATION',
      'newStatus', v_new_status,
      'outcome', v_outcome
    ),
    v_user_id
  );

  if v_outcome = 'COMPLETED' then
    perform public.create_occurrence_notification_event(
      v_plan.occurrence_id,
      'ACTION_ITEM_VALIDATED',
      'MEDIUM',
      'Ação validada',
      coalesce(v_item.title, 'Ação corretiva'),
      false,
      public.lookup_organization_member_id(v_user_id, v_item.organization_id),
      v_user_id,
      jsonb_build_object('item_id', v_item_id),
      jsonb_build_array(jsonb_build_object('organization_member_id', v_item.responsible_member_id, 'participant_type', 'ACTION_OWNER'))
    );
  else
    perform public.create_occurrence_notification_event(
      v_plan.occurrence_id,
      'ACTION_ITEM_RETURNED',
      'HIGH',
      'Ação devolvida para correção',
      coalesce(v_note, 'Ação devolvida para correção.'),
      false,
      public.lookup_organization_member_id(v_user_id, v_item.organization_id),
      v_user_id,
      jsonb_build_object('item_id', v_item_id),
      jsonb_build_array(jsonb_build_object('organization_member_id', v_item.responsible_member_id, 'participant_type', 'ACTION_OWNER'))
    );
  end if;

  return jsonb_build_object('success', true, 'data', jsonb_build_object('item', jsonb_build_object('id', v_item_id, 'status', v_new_status)));
end;
$$;

-- Patch: complete_action_plan
create or replace function public.complete_action_plan(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_plan public.action_plans%rowtype;
  v_total integer;
  v_terminal integer;
  v_completed integer;
  v_occurrence_status text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  if p_plan_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_plan_id é obrigatório.'));
  end if;

  select * into v_plan from public.action_plans where id = p_plan_id;
  if v_plan.id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Plano não encontrado.'));
  end if;

  if not public.has_permission('action_plan.manage', v_plan.organization_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão action_plan.manage.'));
  end if;

  if not public.can_access_occurrence(v_plan.occurrence_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem escopo de acesso à ocorrência.'));
  end if;

  if v_plan.status = 'COMPLETED' then
    return jsonb_build_object('success', true, 'data', jsonb_build_object('plan', jsonb_build_object('id', p_plan_id, 'status', 'COMPLETED'), 'idempotent', true));
  end if;

  if v_plan.status in ('CANCELLED') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Plano cancelado não pode ser concluído.'));
  end if;

  select count(*) into v_total from public.action_items where action_plan_id = p_plan_id;
  if v_total = 0 then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Plano deve possuir ao menos uma ação.'));
  end if;

  select count(*) into v_terminal
  from public.action_items
  where action_plan_id = p_plan_id and status in ('COMPLETED', 'CANCELLED');

  select count(*) into v_completed
  from public.action_items
  where action_plan_id = p_plan_id and status = 'COMPLETED';

  if v_terminal <> v_total then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Todas as ações devem estar concluídas ou canceladas.'));
  end if;

  if v_completed < 1 then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Ao menos uma ação deve estar concluída (COMPLETED).'));
  end if;

  update public.action_plans set status = 'COMPLETED', closed_at = now() where id = p_plan_id;

  select o.status into v_occurrence_status from public.occurrences o where o.id = v_plan.occurrence_id;

  insert into public.occurrence_status_history (occurrence_id, from_status, to_status, metadata, changed_by)
  values (
    v_plan.occurrence_id, 'EM_TRATATIVA', 'EM_TRATATIVA',
    jsonb_build_object(
      'timeline_kind', 'ACTION_PLAN_COMPLETED',
      'action', 'action_plan_completed',
      'plan_id', p_plan_id
    ),
    v_user_id
  );

  perform public.create_occurrence_notification_event(
    v_plan.occurrence_id,
    'ACTION_PLAN_COMPLETED',
    'LOW',
    'Plano de Ação concluído',
    'Todas as ações do plano foram concluídas ou canceladas.',
    false,
    public.lookup_organization_member_id(v_user_id, v_plan.organization_id),
    v_user_id,
    jsonb_build_object('plan_id', p_plan_id),
    (
      select coalesce(jsonb_agg(x), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'organization_member_id', public.lookup_organization_member_id(o.created_by, v_plan.organization_id),
          'participant_type', 'REPORTER'
        ) as x
        from public.occurrences o
        where o.id = v_plan.occurrence_id
          and public.lookup_organization_member_id(o.created_by, v_plan.organization_id) is not null
        union all
        select jsonb_build_object(
          'organization_member_id', r.organization_member_id,
          'participant_type', r.participant_type
        )
        from public.resolve_occurrence_notification_recipients(
          v_plan.occurrence_id,
          'ACTION_PLAN_COMPLETED',
          public.lookup_organization_member_id(v_user_id, v_plan.organization_id)
        ) r
      ) s
    )
  );

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'plan', jsonb_build_object('id', p_plan_id, 'status', 'COMPLETED'),
      'occurrence', jsonb_build_object('id', v_plan.occurrence_id, 'status', v_occurrence_status)
    )
  );
end;
$$;
