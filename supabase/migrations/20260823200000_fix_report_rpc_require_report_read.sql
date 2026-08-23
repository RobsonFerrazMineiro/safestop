-- ============================================================================
-- SafeStop — Sprint 3.3: Gate G — exigir report.read em list_occurrences_report
-- e list_action_items_report
-- ============================================================================
-- Referência: docs/decisions/REPORTS-DECISIONS.md ("report.read continua sendo
-- o único gate de todos os três relatórios do P0 ... e da auditoria de
-- exportação"). Achado da revisão SECURITY (Gate F, SEC-REP-M01): as duas RPCs
-- abaixo eram SECURITY INVOKER e dependiam apenas de occurrence.read + RLS
-- (can_access_occurrence) para o escopo de dados, sem checagem explícita de
-- report.read — confirmado com evidência real (qa-fiscal, occurrence.read sem
-- report.read, mesma organização, recebeu HTTP 200 com dados). O gate de
-- report.read existia apenas na tela de WEB (frontend), nunca na camada de
-- dados — violação de defesa em profundidade.
--
-- Correção: CREATE OR REPLACE FUNCTION mantendo a MESMA assinatura (preserva
-- os GRANTs existentes), adicionando checagem explícita
-- has_permission('report.read', p_organization_id) logo após a validação de
-- organização, seguindo o mesmo padrão já usado em todas as RLS policies do
-- projeto (is_platform_admin() OR has_permission(...)) — não o padrão usado em
-- list_awareness_report, que checa has_permission() antes de is_platform_admin()
-- e bloquearia um administrador de plataforma sem vínculo direto na
-- organização-alvo.
--
-- Preservado sem alteração: RLS/can_access_occurrence (escopo de dados),
-- allowlist de ordenação, paginação por cursor, todos os filtros existentes.
-- ============================================================================

create or replace function public.list_occurrences_report(
  p_organization_id uuid,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null,
  p_area_id uuid default null,
  p_contract_id uuid default null,
  p_contractor_organization_id uuid default null,
  p_status text[] default null,
  p_severity text[] default null,
  p_has_ims boolean default null,
  p_search text default null,
  p_sort_field text default 'occurred_at',
  p_sort_direction text default 'desc',
  p_cursor jsonb default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_sort_field text;
  v_sort_direction text;
  v_limit integer;
  v_fetch_limit integer;
  v_cursor_sort_value text;
  v_cursor_id uuid;
  v_items jsonb;
  v_has_next boolean;
  v_next_cursor jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;

  if p_organization_id is null then
    raise exception 'VALIDATION_ERROR: p_organization_id é obrigatório' using errcode = '22023';
  end if;

  if p_organization_id not in (select public.current_organization_ids())
     and not public.is_platform_admin() then
    raise exception 'ORGANIZATION_NOT_ALLOWED' using errcode = '42501';
  end if;

  -- Gate G (SEC-REP-M01): report.read é obrigatório na camada de dados, não
  -- apenas na tela de WEB. occurrence.read continua controlando o escopo de
  -- linhas via RLS/can_access_occurrence, mas sem report.read a RPC inteira
  -- é negada, mesmo que o usuário enxergasse as mesmas ocorrências uma a uma.
  if not public.is_platform_admin()
     and not public.has_permission('report.read', p_organization_id) then
    raise exception 'PERMISSION_DENIED' using errcode = '42501';
  end if;

  -- Allowlist interna de ordenação — nunca interpolar p_sort_field em SQL.
  v_sort_field := coalesce(p_sort_field, 'occurred_at');
  if v_sort_field not in ('public_code', 'occurred_at', 'status', 'severity', 'area') then
    raise exception 'INVALID_SORT_FIELD' using errcode = '22023';
  end if;

  v_sort_direction := lower(coalesce(p_sort_direction, 'desc'));
  if v_sort_direction not in ('asc', 'desc') then
    raise exception 'INVALID_SORT_DIRECTION' using errcode = '22023';
  end if;

  v_limit := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_fetch_limit := v_limit + 1;

  if p_cursor is not null and p_cursor <> 'null'::jsonb then
    v_cursor_sort_value := p_cursor ->> 'sortValue';
    v_cursor_id := nullif(p_cursor ->> 'id', '')::uuid;
  end if;

  with base as (
    select
      o.id,
      o.public_code,
      o.occurred_at,
      o.area_id,
      ar.name as area_name,
      o.contract_id,
      c.contract_number,
      c.name as contract_name,
      o.contractor_organization_id,
      public.resolve_organization_display_name(o.contractor_organization_id) as contractor_organization_name,
      o.status,
      case o.status
        when 'PARALISACAO_PREVENTIVA' then 'OPEN_EVALUATION'
        when 'EM_AVALIACAO' then 'OPEN_EVALUATION'
        when 'VER_E_AGIR' then 'VER_E_AGIR'
        when 'INTERDICAO_CONFIRMADA' then 'INTERDICTED'
        when 'MDHO_EM_PREENCHIMENTO' then 'INTERDICTED'
        when 'AGUARDANDO_APROVACAO_HSE' then 'INTERDICTED'
        when 'AGUARDANDO_REGISTRO_IMS' then 'INTERDICTED'
        when 'EM_TRATATIVA' then 'IN_TREATMENT'
        when 'AGUARDANDO_VALIDACAO' then 'AWAITING_VALIDATION'
        when 'LIBERADA' then 'COMPLETED'
        when 'ENCERRADA' then 'COMPLETED'
        when 'CANCELADA' then 'CANCELLED'
      end as status_family,
      o.severity,
      o.decision_type,
      o.ims_reference_code,
      o.unit_id,
      u.name as unit_name,
      o.management_department_id,
      md.name as management_department_name,
      o.stopped_at,
      o.evaluated_at,
      o.released_at,
      o.closed_at,
      o.cancelled_at,
      o.cancellation_reason,
      public.resolve_profile_display_name(o.created_by) as created_by_name,
      public.resolve_profile_display_name(o.assigned_evaluator_id) as assigned_evaluator_name,
      case v_sort_field
        when 'public_code' then o.public_code
        when 'status' then o.status
        when 'severity' then o.severity
        when 'area' then coalesce(ar.name, '')
        else to_char(o.occurred_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US')
      end as sort_value
    from public.occurrences o
    left join public.areas ar on ar.id = o.area_id
    left join public.contracts c on c.id = o.contract_id
    left join public.units u on u.id = o.unit_id
    left join public.management_departments md on md.id = o.management_department_id
    where o.organization_id = p_organization_id
      and public.can_access_occurrence(o.id)
      and (p_period_start is null or o.occurred_at >= p_period_start)
      and (p_period_end is null or o.occurred_at <= p_period_end)
      and (p_area_id is null or o.area_id = p_area_id)
      and (p_contract_id is null or o.contract_id = p_contract_id)
      and (p_contractor_organization_id is null or o.contractor_organization_id = p_contractor_organization_id)
      and (p_status is null or array_length(p_status, 1) is null or o.status = any (p_status))
      and (p_severity is null or array_length(p_severity, 1) is null or o.severity = any (p_severity))
      and (
        p_has_ims is null
        or (p_has_ims = true and o.ims_reference_code is not null)
        or (p_has_ims = false and o.ims_reference_code is null)
      )
      and (
        p_search is null
        or btrim(p_search) = ''
        or position(upper(p_search) in upper(o.public_code)) > 0
      )
  ),
  filtered as (
    select b.*
    from base b
    where v_cursor_sort_value is null
       or (v_sort_direction = 'desc' and (b.sort_value, b.id) < (v_cursor_sort_value, v_cursor_id))
       or (v_sort_direction = 'asc' and (b.sort_value, b.id) > (v_cursor_sort_value, v_cursor_id))
  ),
  numbered as (
    select
      f.*,
      row_number() over (
        order by
          (case when v_sort_direction = 'asc' then f.sort_value end) asc,
          (case when v_sort_direction = 'desc' then f.sort_value end) desc,
          (case when v_sort_direction = 'asc' then f.id end) asc,
          (case when v_sort_direction = 'desc' then f.id end) desc
      ) as row_num
    from filtered f
  )
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', n.id,
            'publicCode', n.public_code,
            'occurredAt', n.occurred_at,
            'areaId', n.area_id,
            'areaName', n.area_name,
            'contractId', n.contract_id,
            'contractNumber', n.contract_number,
            'contractName', n.contract_name,
            'contractorOrganizationId', n.contractor_organization_id,
            'contractorOrganizationName', n.contractor_organization_name,
            'status', n.status,
            'statusFamily', n.status_family,
            'severity', n.severity,
            'decisionType', n.decision_type,
            'imsReferenceCode', n.ims_reference_code,
            'unitId', n.unit_id,
            'unitName', n.unit_name,
            'managementDepartmentId', n.management_department_id,
            'managementDepartmentName', n.management_department_name,
            'stoppedAt', n.stopped_at,
            'evaluatedAt', n.evaluated_at,
            'releasedAt', n.released_at,
            'closedAt', n.closed_at,
            'cancelledAt', n.cancelled_at,
            'cancellationReason', n.cancellation_reason,
            'createdByName', n.created_by_name,
            'assignedEvaluatorName', n.assigned_evaluator_name
          )
          order by n.row_num
        )
        from numbered n
        where n.row_num <= v_limit
      ),
      '[]'::jsonb
    ),
    exists (select 1 from numbered n where n.row_num = v_fetch_limit),
    (
      select jsonb_build_object('sortValue', n.sort_value, 'id', n.id)
      from numbered n
      where n.row_num = v_limit
    )
  into v_items, v_has_next, v_next_cursor
  from (select 1) as _dummy;

  if not coalesce(v_has_next, false) then
    v_next_cursor := null;
  end if;

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'nextCursor', v_next_cursor,
    'hasNext', coalesce(v_has_next, false)
  );
end;
$$;

comment on function public.list_occurrences_report(
  uuid, timestamptz, timestamptz, uuid, uuid, uuid, text[], text[], boolean, text, text, text, jsonb, integer
) is
  'Relatório de Ocorrências (Sprint 3.3, PO-REP-3). SECURITY INVOKER — RLS de occurrences cobre occurrence.read + can_access_occurrence para o escopo de linhas; report.read é exigido explicitamente na RPC (Gate G, SEC-REP-M01) para acesso ao relatório em si. 19 campos da matriz de colunas, sem multiplicar linhas por action_items/participants/notifications.';

-- ============================================================================
-- list_action_items_report
-- ============================================================================

create or replace function public.list_action_items_report(
  p_organization_id uuid,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null,
  p_responsible_member_id uuid default null,
  p_status text[] default null,
  p_overdue_only boolean default null,
  p_due_soon_only boolean default null,
  p_due_soon_days integer default 3,
  p_sort_field text default 'due_at',
  p_sort_direction text default 'asc',
  p_cursor jsonb default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_sort_field text;
  v_sort_direction text;
  v_due_soon_days integer;
  v_limit integer;
  v_fetch_limit integer;
  v_cursor_sort_value text;
  v_cursor_id uuid;
  v_items jsonb;
  v_has_next boolean;
  v_next_cursor jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;

  if p_organization_id is null then
    raise exception 'VALIDATION_ERROR: p_organization_id é obrigatório' using errcode = '22023';
  end if;

  if p_organization_id not in (select public.current_organization_ids())
     and not public.is_platform_admin() then
    raise exception 'ORGANIZATION_NOT_ALLOWED' using errcode = '42501';
  end if;

  -- Gate G (SEC-REP-M01): report.read é obrigatório na camada de dados, não
  -- apenas na tela de WEB. occurrence.read continua controlando o escopo de
  -- linhas via RLS/can_access_occurrence, mas sem report.read a RPC inteira
  -- é negada, mesmo que o usuário enxergasse os mesmos itens um a um.
  if not public.is_platform_admin()
     and not public.has_permission('report.read', p_organization_id) then
    raise exception 'PERMISSION_DENIED' using errcode = '42501';
  end if;

  -- Allowlist interna de ordenação — nunca interpolar p_sort_field em SQL.
  v_sort_field := coalesce(p_sort_field, 'due_at');
  if v_sort_field not in ('due_at', 'status', 'title') then
    raise exception 'INVALID_SORT_FIELD' using errcode = '22023';
  end if;

  v_sort_direction := lower(coalesce(p_sort_direction, 'asc'));
  if v_sort_direction not in ('asc', 'desc') then
    raise exception 'INVALID_SORT_DIRECTION' using errcode = '22023';
  end if;

  -- Mesmo clamp de due_soon_days usado em get_dashboard_kpis (1–30).
  v_due_soon_days := least(greatest(coalesce(p_due_soon_days, 3), 1), 30);

  v_limit := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_fetch_limit := v_limit + 1;

  if p_cursor is not null and p_cursor <> 'null'::jsonb then
    v_cursor_sort_value := p_cursor ->> 'sortValue';
    v_cursor_id := nullif(p_cursor ->> 'id', '')::uuid;
  end if;

  with base as (
    select
      ai.id,
      ap.occurrence_id,
      ai.action_plan_id,
      ai.title,
      ai.responsible_member_id,
      public.resolve_member_display_name(ai.responsible_member_id) as responsible_member_name,
      ai.due_at,
      ai.status,
      ai.completed_at,
      ai.validated_at,
      -- Mesma fórmula de packages/types/src/dashboard-formulas.ts
      -- (isOverdueActionItem): aberta + due_at < now().
      (ai.status not in ('COMPLETED', 'CANCELLED') and ai.due_at < now()) as is_overdue,
      -- Mesma fórmula (isDueSoonActionItem): aberta + due_at no intervalo
      -- [now(), now() + due_soon_days].
      (
        ai.status not in ('COMPLETED', 'CANCELLED')
        and ai.due_at >= now()
        and ai.due_at <= now() + make_interval(days => v_due_soon_days)
      ) as is_due_soon,
      case v_sort_field
        when 'status' then ai.status
        when 'title' then ai.title
        else to_char(ai.due_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US')
      end as sort_value
    from public.action_items ai
    join public.action_plans ap on ap.id = ai.action_plan_id
    where ai.organization_id = p_organization_id
      and public.can_access_occurrence(ap.occurrence_id)
      and (p_period_start is null or ai.due_at >= p_period_start)
      and (p_period_end is null or ai.due_at <= p_period_end)
      and (p_responsible_member_id is null or ai.responsible_member_id = p_responsible_member_id)
      and (p_status is null or array_length(p_status, 1) is null or ai.status = any (p_status))
      and (
        p_overdue_only is not true
        or (ai.status not in ('COMPLETED', 'CANCELLED') and ai.due_at < now())
      )
      and (
        p_due_soon_only is not true
        or (
          ai.status not in ('COMPLETED', 'CANCELLED')
          and ai.due_at >= now()
          and ai.due_at <= now() + make_interval(days => v_due_soon_days)
        )
      )
  ),
  filtered as (
    select b.*
    from base b
    where v_cursor_sort_value is null
       or (v_sort_direction = 'desc' and (b.sort_value, b.id) < (v_cursor_sort_value, v_cursor_id))
       or (v_sort_direction = 'asc' and (b.sort_value, b.id) > (v_cursor_sort_value, v_cursor_id))
  ),
  numbered as (
    select
      f.*,
      row_number() over (
        order by
          (case when v_sort_direction = 'asc' then f.sort_value end) asc,
          (case when v_sort_direction = 'desc' then f.sort_value end) desc,
          (case when v_sort_direction = 'asc' then f.id end) asc,
          (case when v_sort_direction = 'desc' then f.id end) desc
      ) as row_num
    from filtered f
  )
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', n.id,
            'occurrenceId', n.occurrence_id,
            'actionPlanId', n.action_plan_id,
            'title', n.title,
            'responsibleMemberId', n.responsible_member_id,
            'responsibleMemberName', n.responsible_member_name,
            'dueAt', n.due_at,
            'status', n.status,
            'completedAt', n.completed_at,
            'validatedAt', n.validated_at,
            'isOverdue', n.is_overdue,
            'isDueSoon', n.is_due_soon
          )
          order by n.row_num
        )
        from numbered n
        where n.row_num <= v_limit
      ),
      '[]'::jsonb
    ),
    exists (select 1 from numbered n where n.row_num = v_fetch_limit),
    (
      select jsonb_build_object('sortValue', n.sort_value, 'id', n.id)
      from numbered n
      where n.row_num = v_limit
    )
  into v_items, v_has_next, v_next_cursor
  from (select 1) as _dummy;

  if not coalesce(v_has_next, false) then
    v_next_cursor := null;
  end if;

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'nextCursor', v_next_cursor,
    'hasNext', coalesce(v_has_next, false)
  );
end;
$$;

comment on function public.list_action_items_report(
  uuid, timestamptz, timestamptz, uuid, text[], boolean, boolean, integer, text, text, jsonb, integer
) is
  'Relatório de Plano de Ação (Sprint 3.3). SECURITY INVOKER — RLS de action_items cobre occurrence.read + can_access_occurrence para o escopo de linhas; report.read é exigido explicitamente na RPC (Gate G, SEC-REP-M01) para acesso ao relatório em si. isOverdue/isDueSoon replicam dashboard-formulas.ts.';
