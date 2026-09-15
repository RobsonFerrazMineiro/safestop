-- ============================================================================
-- SafeStop — Fase 3 / Gate 13B: Endurecimento RLS/RPC Workspace
-- ============================================================================
-- Escopo:
--   1) RLS foundation: is_active + acesso efetivo; memberships só próprias
--   2) Trigger de integridade Organization × Workspace em occurrences
--   3) create_occurrence: workspace_id OPCIONAL no payload (Strategy B)
--      — ausente/null = legado (compatível com Web/Mobile atuais)
--      — presente = exige can_access_workspace + link ativo org↔ws
--   4) Documentação inline do inventário SECURITY DEFINER / Reports
--
-- Não edita migrations Gate 12 / 13A.
-- Não torna workspace_id NOT NULL.
-- Não espalha workspace_id em filhos.
-- Não Offline / outbox / sync.
-- Zero UI.
--
-- Helpers can_access_workspace / current_workspace_ids / can_access_occurrence
-- preservados (semântica 13A). Policies foundation passam a usá-los.
-- ============================================================================


-- ============================================================================
-- 1. RLS foundation — workspaces
-- ============================================================================
-- Antes: SELECT se existia link da Organization (mesmo sem membership).
-- Depois: SELECT se is_platform_admin() OU can_access_workspace(id)
--         (can_access_workspace já exige Workspace/link/membership/org member ativos).

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select to authenticated
  using (
    public.is_platform_admin()
    or public.can_access_workspace(id)
  );

comment on policy workspaces_select on public.workspaces is
  'Gate 13B: usuário comum só vê Workspace com acesso efetivo (can_access_workspace). Platform Admin: exceção centralizada.';


-- ============================================================================
-- 2. RLS foundation — organization_workspace_links
-- ============================================================================
-- Antes: qualquer org em current_organization_ids (incl. links inativos).
-- Depois: platform admin OU (link ativo AND can_access_workspace).
-- organization.manage NÃO amplia visibilidade.

drop policy if exists organization_workspace_links_select on public.organization_workspace_links;
create policy organization_workspace_links_select on public.organization_workspace_links
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      is_active = true
      and public.can_access_workspace(workspace_id)
    )
  );

comment on policy organization_workspace_links_select on public.organization_workspace_links is
  'Gate 13B: links inativos ocultos ao usuário comum; sem wildcard por Organization Membership.';


-- ============================================================================
-- 3. RLS foundation — workspace_memberships
-- ============================================================================
-- Antes: todos os grants da Organization do usuário.
-- Depois: platform admin OU apenas grants próprios (organization_member.profile_id = auth.uid())
--         e membership ativa. Administração ampla = Gate futuro (workspace.manage).

drop policy if exists workspace_memberships_select on public.workspace_memberships;
create policy workspace_memberships_select on public.workspace_memberships
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      is_active = true
      and exists (
        select 1
        from public.organization_members om
        where om.id = workspace_memberships.organization_member_id
          and om.profile_id = auth.uid()
          and om.is_active = true
      )
    )
  );

comment on policy workspace_memberships_select on public.workspace_memberships is
  'Gate 13B: disclosure restrito aos próprios grants ativos. Sem listagem de terceiros da Organization.';


-- INSERT/UPDATE foundation permanecem is_platform_admin() (Gate 12/13A).
-- Sem DELETE grant / policy — soft deactivate via UPDATE.


-- ============================================================================
-- 4. Trigger — integridade Organization × Workspace em occurrences
-- ============================================================================
-- Impede organization_id = A + workspace_id = W sem link ativo A↔W.
-- Também exige Workspace ativo. Não aplica quando workspace_id IS NULL (legado).

create or replace function public.validate_occurrence_workspace_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.workspace_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.workspaces w
    where w.id = new.workspace_id
      and w.is_active = true
  ) then
    raise exception 'workspace_id inválido ou Workspace inativo'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.organization_workspace_links owl
    where owl.organization_id = new.organization_id
      and owl.workspace_id = new.workspace_id
      and owl.is_active = true
  ) then
    raise exception 'organization_id não possui link ativo com workspace_id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function public.validate_occurrence_workspace_assignment() is
  'Gate 13B: garante Organization ↔ Workspace ativo quando occurrences.workspace_id IS NOT NULL. Legado NULL permanece permitido.';

drop trigger if exists validate_occurrence_workspace_assignment on public.occurrences;
create trigger validate_occurrence_workspace_assignment
  before insert or update of workspace_id, organization_id
  on public.occurrences
  for each row
  execute function public.validate_occurrence_workspace_assignment();


-- ============================================================================
-- 5. create_occurrence — Strategy B: workspace_id opcional no payload jsonb
-- ============================================================================
-- Compatibilidade: clientes atuais não enviam workspace_id → coluna permanece NULL.
-- Quando informado: exige can_access_workspace + (trigger garante link org↔ws).
-- Não confiar no frontend; servidor valida RBAC + ONDE.

create or replace function public.create_occurrence(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_organization_id uuid;
  v_workspace_id uuid;
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
  v_workspace_id := nullif(btrim(payload ->> 'workspace_id'), '')::uuid;
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

  -- Gate 13B: workspace_id opcional. Se informado, exige acesso efetivo (ONDE).
  -- Compatibilidade: payload sem workspace_id → NULL (legado / cutover futuro).
  if v_workspace_id is not null then
    if not public.can_access_workspace(v_workspace_id) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'FORBIDDEN',
          'message', 'Usuário sem acesso efetivo ao Workspace informado.'
        )
      );
    end if;

    if not exists (
      select 1
      from public.organization_workspace_links owl
      where owl.organization_id = v_organization_id
        and owl.workspace_id = v_workspace_id
        and owl.is_active = true
    ) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'VALIDATION_ERROR',
          'message', 'organization_id não possui link ativo com workspace_id.'
        )
      );
    end if;
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
    workspace_id,
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
    v_workspace_id,
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
    'workspace_id', o.workspace_id,
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
  when check_violation then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Combinação organization_id/workspace_id inválida ou Workspace inativo.'
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

comment on function public.create_occurrence(jsonb) is
  'Cria Paralisação Preventiva. Gate 13B: workspace_id OPCIONAL no payload (Strategy B). Ausente=legado NULL (compat clientes). Presente=exige occurrence.create + can_access_workspace + link ativo org↔ws. SECURITY DEFINER; search_path vazio.';


-- ============================================================================
-- 6. Inventário / classificação (comentários de governança — sem alteração de código)
-- ============================================================================
-- occurrences policies: somente SELECT (occurrence.read + can_access_occurrence).
--   Sem INSERT/UPDATE/DELETE para authenticated (mutações via RPCs SECURITY DEFINER).
--   can_access_occurrence (13A) já aplica Workspace quando workspace_id NOT NULL.
--
-- RPCs mutáveis que já chamam can_access_occurrence (herdam barreira Workspace):
--   start_occurrence_evaluation, record_occurrence_decision, comments, attachments,
--   mdho_*, ims_*, action_plan_*, notification dispatch paths, timeline.
--
-- Dashboard/Reports (Gate 13E UI filter; barreira dados OK via can_access_occurrence):
--   get_dashboard_kpis — SECURITY DEFINER + has_permission + can_access_occurrence
--   list_operational_occurrences — SECURITY INVOKER + RLS + can_access_occurrence
--   list_occurrences_report / list_action_items_report / list_awareness_report —
--     SECURITY INVOKER + report.read + can_access_occurrence
--
-- Notifications: herdam occurrence via can_access_occurrence nos paths de occurrence;
--   list_my_notifications permanece Organization-scoped (leitura ≠ ciência).
-- Contacts: organization_contacts permanece Organization-scoped (sem workspace_id).
--
-- Grants foundation (baseline 13A 20260913161000): SELECT/INSERT/UPDATE authenticated;
--   policies restringem escrita a is_platform_admin(). Sem DELETE. Sem ampliação neste Gate.
