-- ============================================================================
-- SafeStop — Sprint 3.0: Plano de Ação RPCs + timeline + Storage subpath
-- ============================================================================
-- Referências: docs/decisions/ACTION-PLAN-DECISIONS.md
-- SEM submit_action_plan_for_occurrence_validation; SEM notification_events; SEM audit_events.
-- ============================================================================

-- ============================================================================
-- 1. create_action_plan
-- ============================================================================

create function public.create_action_plan(p_payload jsonb)
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

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'plan', jsonb_build_object('id', v_plan_id, 'status', 'OPEN', 'occurrence_id', v_occurrence_id, 'summary', v_summary)
    )
  );
end;
$$;


-- ============================================================================
-- 2. update_action_plan
-- ============================================================================

create function public.update_action_plan(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_plan_id uuid;
  v_summary text;
  v_plan public.action_plans%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  v_plan_id := nullif(btrim(p_payload ->> 'plan_id'), '')::uuid;
  v_summary := nullif(btrim(p_payload ->> 'summary'), '');

  if v_plan_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'plan_id é obrigatório.'));
  end if;

  select * into v_plan from public.action_plans where id = v_plan_id;

  if v_plan.id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Plano não encontrado.'));
  end if;

  if not public.can_access_occurrence(v_plan.occurrence_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem escopo de acesso à ocorrência.'));
  end if;

  if not (
    public.has_permission('action_plan.create', v_plan.organization_id)
    or public.has_permission('action_plan.manage', v_plan.organization_id)
  ) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão para editar o plano.'));
  end if;

  if v_plan.status in ('COMPLETED', 'CANCELLED') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Plano não editável neste status.'));
  end if;

  update public.action_plans set summary = coalesce(v_summary, summary) where id = v_plan_id;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object('plan', jsonb_build_object('id', v_plan_id, 'summary', coalesce(v_summary, v_plan.summary)))
  );
end;
$$;


-- ============================================================================
-- 3. add_action_item
-- ============================================================================

create function public.add_action_item(p_payload jsonb)
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

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'item', jsonb_build_object('id', v_item_id, 'status', 'PENDING', 'action_plan_id', v_plan_id)
    )
  );
end;
$$;


-- ============================================================================
-- 4. update_action_item
-- ============================================================================

create function public.update_action_item(p_payload jsonb)
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


-- ============================================================================
-- 5. start_action_item
-- ============================================================================

create function public.start_action_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_item public.action_items%rowtype;
  v_plan public.action_plans%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  if p_item_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_item_id é obrigatório.'));
  end if;

  select * into v_item from public.action_items where id = p_item_id;
  if v_item.id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Ação não encontrada.'));
  end if;

  select * into v_plan from public.action_plans where id = v_item.action_plan_id;

  if not public.can_access_occurrence(v_plan.occurrence_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem escopo de acesso à ocorrência.'));
  end if;

  if not (
    public.has_permission('action_plan.manage', v_item.organization_id)
    or public.is_action_item_responsible_member(p_item_id, v_user_id)
  ) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão para iniciar a ação.'));
  end if;

  if v_item.status <> 'PENDING' then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Somente ações PENDING podem ser iniciadas.'));
  end if;

  update public.action_items set status = 'IN_PROGRESS' where id = p_item_id;

  if v_plan.status = 'OPEN' then
    update public.action_plans set status = 'IN_PROGRESS' where id = v_plan.id;
  end if;

  insert into public.occurrence_status_history (occurrence_id, from_status, to_status, metadata, changed_by)
  values (
    v_plan.occurrence_id, 'EM_TRATATIVA', 'EM_TRATATIVA',
    jsonb_build_object(
      'timeline_kind', 'ACTION_ITEM_STATUS_CHANGED',
      'action', 'action_item_status_changed',
      'sub_action', 'start',
      'item_id', p_item_id,
      'previousStatus', 'PENDING',
      'newStatus', 'IN_PROGRESS'
    ),
    v_user_id
  );

  return jsonb_build_object('success', true, 'data', jsonb_build_object('item', jsonb_build_object('id', p_item_id, 'status', 'IN_PROGRESS')));
end;
$$;


-- ============================================================================
-- 6. submit_action_item
-- ============================================================================

create function public.submit_action_item(p_payload jsonb)
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

  return jsonb_build_object('success', true, 'data', jsonb_build_object('item', jsonb_build_object('id', v_item_id, 'status', 'AWAITING_VALIDATION')));
end;
$$;


-- ============================================================================
-- 7. validate_action_item
-- ============================================================================

create function public.validate_action_item(p_payload jsonb)
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

  return jsonb_build_object('success', true, 'data', jsonb_build_object('item', jsonb_build_object('id', v_item_id, 'status', v_new_status)));
end;
$$;


-- ============================================================================
-- 8. cancel_action_item
-- ============================================================================

create function public.cancel_action_item(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_item_id uuid;
  v_reason text;
  v_item public.action_items%rowtype;
  v_plan public.action_plans%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  v_item_id := nullif(btrim(p_payload ->> 'item_id'), '')::uuid;
  v_reason := nullif(btrim(p_payload ->> 'reason'), '');

  if v_item_id is null or v_reason is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'item_id e reason são obrigatórios.'));
  end if;

  if char_length(v_reason) < 10 or char_length(v_reason) > 4000 then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Motivo deve ter entre 10 e 4000 caracteres.'));
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

  if v_item.status in ('COMPLETED', 'CANCELLED') then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'STATUS_MISMATCH', 'message', 'Ação não pode ser cancelada neste status.'));
  end if;

  update public.action_items set status = 'CANCELLED' where id = v_item_id;

  insert into public.occurrence_status_history (occurrence_id, from_status, to_status, reason, metadata, changed_by)
  values (
    v_plan.occurrence_id, 'EM_TRATATIVA', 'EM_TRATATIVA', v_reason,
    jsonb_build_object(
      'timeline_kind', 'ACTION_ITEM_STATUS_CHANGED',
      'action', 'action_item_status_changed',
      'sub_action', 'cancel',
      'item_id', v_item_id,
      'previousStatus', v_item.status,
      'newStatus', 'CANCELLED'
    ),
    v_user_id
  );

  return jsonb_build_object('success', true, 'data', jsonb_build_object('item', jsonb_build_object('id', v_item_id, 'status', 'CANCELLED')));
end;
$$;


-- ============================================================================
-- 9. complete_action_plan
-- ============================================================================

create function public.complete_action_plan(p_plan_id uuid)
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

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'plan', jsonb_build_object('id', p_plan_id, 'status', 'COMPLETED'),
      'occurrence', jsonb_build_object('id', v_plan.occurrence_id, 'status', v_occurrence_status)
    )
  );
end;
$$;


-- ============================================================================
-- 10. prepare_action_item_attachment_upload
-- ============================================================================

create function public.prepare_action_item_attachment_upload(payload jsonb)
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

  if v_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
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

  v_storage_ext := case v_mime_type when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp' end;
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


-- ============================================================================
-- 11–14. Attachment RPCs (complete / fail / delete / signed_url)
-- ============================================================================

create function public.complete_action_item_attachment_upload(target_attachment_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid; v_attachment public.action_item_attachments%rowtype; v_storage_size bigint;
begin
  v_user_id := auth.uid();
  if v_user_id is null then return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.')); end if;
  select * into v_attachment from public.action_item_attachments where id = target_attachment_id and deleted_at is null;
  if v_attachment.id is null then return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Anexo não encontrado.')); end if;
  if v_attachment.upload_status <> 'PENDING' or v_attachment.uploaded_by <> v_user_id then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Operação não permitida.'));
  end if;
  select (so.metadata ->> 'size')::bigint into v_storage_size from storage.objects so
  where so.bucket_id = v_attachment.storage_bucket and so.name = v_attachment.storage_path;
  if v_storage_size is null then return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Arquivo não encontrado no Storage.')); end if;
  update public.action_item_attachments set upload_status = 'COMPLETED', file_size = v_storage_size where id = target_attachment_id;
  return jsonb_build_object('success', true, 'data', jsonb_build_object('attachment_id', target_attachment_id, 'upload_status', 'COMPLETED'));
end; $$;

create function public.fail_action_item_attachment_upload(target_attachment_id uuid, failure_reason text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid; v_attachment public.action_item_attachments%rowtype;
begin
  v_user_id := auth.uid();
  select * into v_attachment from public.action_item_attachments where id = target_attachment_id and deleted_at is null;
  if v_attachment.upload_status <> 'PENDING' or v_attachment.uploaded_by <> v_user_id then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Operação não permitida.'));
  end if;
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects so where so.bucket_id = v_attachment.storage_bucket and so.name = v_attachment.storage_path;
  update public.action_item_attachments set upload_status = 'FAILED' where id = target_attachment_id;
  return jsonb_build_object('success', true, 'data', jsonb_build_object('attachment_id', target_attachment_id, 'upload_status', 'FAILED'));
end; $$;

create function public.delete_action_item_attachment(target_attachment_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid; v_attachment public.action_item_attachments%rowtype;
begin
  v_user_id := auth.uid();
  select * into v_attachment from public.action_item_attachments where id = target_attachment_id and deleted_at is null;
  if v_attachment.id is null then return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Anexo não encontrado.')); end if;
  if not (public.has_permission('action_plan.manage', v_attachment.organization_id) or public.is_action_item_responsible_member(v_attachment.action_item_id, v_user_id)) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão.'));
  end if;
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects so where so.bucket_id = v_attachment.storage_bucket and so.name = v_attachment.storage_path;
  update public.action_item_attachments set deleted_at = now(), deleted_by = v_user_id where id = target_attachment_id;
  return jsonb_build_object('success', true, 'data', jsonb_build_object('attachment_id', target_attachment_id));
end; $$;

create function public.get_action_item_attachment_signed_url(target_attachment_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_user_id uuid; v_attachment public.action_item_attachments%rowtype; v_occurrence_id uuid;
  v_signed_url_ttl_seconds constant integer := 3600;
begin
  v_user_id := auth.uid();
  select a.* into v_attachment
  from public.action_item_attachments a
  where a.id = target_attachment_id and a.deleted_at is null and a.upload_status = 'COMPLETED';
  if v_attachment.id is null then return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Anexo não encontrado.')); end if;
  select ap.occurrence_id into v_occurrence_id
  from public.action_items ai
  join public.action_plans ap on ap.id = ai.action_plan_id
  where ai.id = v_attachment.action_item_id;
  if not public.has_permission('occurrence.read', v_attachment.organization_id) or not public.can_access_occurrence(v_occurrence_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão.'));
  end if;
  return jsonb_build_object('success', true, 'data', jsonb_build_object('attachment_id', target_attachment_id, 'bucket', v_attachment.storage_bucket, 'storage_path', v_attachment.storage_path, 'expires_in_seconds', v_signed_url_ttl_seconds, 'signed_url', null));
end; $$;


-- ============================================================================
-- 15. Storage policies — subpath action-items
-- ============================================================================

drop policy if exists occurrence_evidence_storage_insert on storage.objects;

create policy occurrence_evidence_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'occurrence-evidence'
    and auth.uid() is not null
    and coalesce(array_length(storage.foldername(name), 1), 0) = 3
    and (storage.foldername(name))[1]::uuid in (select public.current_organization_ids())
    and (
      (
        public.has_permission('occurrence.create', (storage.foldername(name))[1]::uuid)
        and public.can_access_occurrence((storage.foldername(name))[2]::uuid)
        and exists (
          select 1 from public.occurrence_attachments a
          where a.id = (storage.foldername(name))[3]::uuid
            and a.occurrence_id = (storage.foldername(name))[2]::uuid
            and a.organization_id = (storage.foldername(name))[1]::uuid
            and a.storage_path = name and a.uploaded_by = auth.uid()
            and a.upload_status = 'PENDING' and a.deleted_at is null
        )
      )
      or (
        (storage.foldername(name))[2] = 'action-items'
        and exists (
          select 1 from public.action_item_attachments a
          where a.action_item_id = (storage.foldername(name))[3]::uuid
            and a.organization_id = (storage.foldername(name))[1]::uuid
            and a.storage_path = name and a.uploaded_by = auth.uid()
            and a.upload_status = 'PENDING' and a.deleted_at is null
            and (public.has_permission('action_plan.manage', a.organization_id)
              or public.is_action_item_responsible_member(a.action_item_id, auth.uid()))
        )
      )
    )
  );

drop policy if exists occurrence_evidence_storage_select on storage.objects;

create policy occurrence_evidence_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'occurrence-evidence'
    and (
      exists (
        select 1 from public.occurrence_attachments a
        where a.storage_bucket = storage.objects.bucket_id and a.storage_path = storage.objects.name
          and a.upload_status = 'COMPLETED' and a.deleted_at is null
          and public.has_permission('occurrence.read', a.organization_id)
          and public.can_access_occurrence(a.occurrence_id)
      )
      or exists (
        select 1 from public.action_item_attachments a
        join public.action_items ai on ai.id = a.action_item_id
        join public.action_plans ap on ap.id = ai.action_plan_id
        where a.storage_bucket = storage.objects.bucket_id and a.storage_path = storage.objects.name
          and a.upload_status = 'COMPLETED' and a.deleted_at is null
          and public.has_permission('occurrence.read', a.organization_id)
          and public.can_access_occurrence(ap.occurrence_id)
      )
    )
  );


-- ============================================================================
-- 16. Grants
-- ============================================================================

grant execute on function public.create_action_plan(jsonb) to authenticated;
grant execute on function public.update_action_plan(jsonb) to authenticated;
grant execute on function public.add_action_item(jsonb) to authenticated;
grant execute on function public.update_action_item(jsonb) to authenticated;
grant execute on function public.start_action_item(uuid) to authenticated;
grant execute on function public.submit_action_item(jsonb) to authenticated;
grant execute on function public.validate_action_item(jsonb) to authenticated;
grant execute on function public.cancel_action_item(jsonb) to authenticated;
grant execute on function public.complete_action_plan(uuid) to authenticated;
grant execute on function public.prepare_action_item_attachment_upload(jsonb) to authenticated;
grant execute on function public.complete_action_item_attachment_upload(uuid) to authenticated;
grant execute on function public.fail_action_item_attachment_upload(uuid, text) to authenticated;
grant execute on function public.delete_action_item_attachment(uuid) to authenticated;
grant execute on function public.get_action_item_attachment_signed_url(uuid) to authenticated;
