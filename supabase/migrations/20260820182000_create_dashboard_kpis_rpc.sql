-- ============================================================================
-- SafeStop — Sprint 3.2: RPC get_dashboard_kpis
-- ============================================================================
-- Referência: docs/decisions/DASHBOARD-DECISIONS.md (PO-DASH-1…PO-DASH-4)
-- SECURITY DEFINER + gates has_permission() explícitos (RLS bypass intencional).
-- ============================================================================

create function public.get_dashboard_kpis(
  p_organization_id uuid,
  p_due_soon_days integer default 3,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_member_id uuid;
  v_due_soon_days integer;
  v_period_ready boolean;
  v_has_contacts boolean;

  v_can_occurrence_read boolean;
  v_can_report_read boolean;
  v_can_mdho_queue boolean;
  v_can_action_plan boolean;

  v_my_pending_actions integer := 0;
  v_my_overdue_actions integer := 0;
  v_my_pending_awareness integer := 0;

  v_scoped_open_occurrences integer;
  v_scoped_pending_awareness integer;

  v_active_occurrences integer;
  v_pending_evaluation integer;
  v_active_interdictions integer;
  v_awaiting_validation integer;
  v_mdho_pending_approval integer;
  v_overdue_action_items integer;
  v_due_soon_action_items integer;
  v_open_action_plans integer;
  v_pending_awareness_org integer;

  v_new_occurrences_in_period integer;
  v_avg_evaluation_minutes integer;
  v_avg_release_minutes integer;
  v_action_completion_rate integer;

  v_occurrences_by_status_family jsonb;
  v_occurrences_by_area jsonb;
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

  if p_organization_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'p_organization_id é obrigatório.'
      )
    );
  end if;

  if p_organization_id not in (select public.current_organization_ids())
     and not public.is_platform_admin() then
    raise exception 'ORGANIZATION_NOT_ALLOWED' using errcode = '42501';
  end if;

  v_due_soon_days := least(greatest(coalesce(p_due_soon_days, 3), 1), 30);
  v_period_ready := p_period_start is not null and p_period_end is not null;

  v_member_id := public.lookup_organization_member_id(v_user_id, p_organization_id);

  v_can_occurrence_read := public.has_permission('occurrence.read', p_organization_id);
  v_can_report_read := public.has_permission('report.read', p_organization_id);
  v_can_mdho_queue := v_can_occurrence_read
    or public.has_permission('mdho.approve', p_organization_id)
    or public.has_permission('mdho.return', p_organization_id);
  v_can_action_plan := v_can_occurrence_read
    or public.has_permission('action_plan.create', p_organization_id)
    or public.has_permission('action_plan.manage', p_organization_id)
    or public.has_permission('action_plan.validate', p_organization_id);

  v_has_contacts := false;
  if v_member_id is not null then
    select exists (
      select 1
      from public.organization_contacts oc
      where oc.organization_id = p_organization_id
        and oc.organization_member_id = v_member_id
        and oc.is_active = true
    )
    into v_has_contacts;
  end if;

  -- --------------------------------------------------------------------------
  -- personal.* (sempre quando há membro na organização)
  -- --------------------------------------------------------------------------
  if v_member_id is not null then
    select
      count(*) filter (where ai.status in ('PENDING', 'IN_PROGRESS')),
      count(*) filter (
        where ai.status not in ('COMPLETED', 'CANCELLED')
          and ai.due_at < now()
      )
    into v_my_pending_actions, v_my_overdue_actions
    from public.action_items ai
    where ai.organization_id = p_organization_id
      and ai.responsible_member_id = v_member_id
      and ai.status not in ('COMPLETED', 'CANCELLED');

    select count(*)
    into v_my_pending_awareness
    from public.notifications n
    where n.organization_id = p_organization_id
      and n.recipient_member_id = v_member_id
      and n.requires_awareness
      and n.awareness_confirmed_at is null;
  end if;

  -- --------------------------------------------------------------------------
  -- operational.* (organization_contacts ativo do membro)
  -- --------------------------------------------------------------------------
  if v_has_contacts then
    select count(*)
    into v_scoped_open_occurrences
    from public.occurrences o
    where o.organization_id = p_organization_id
      and o.status not in ('ENCERRADA', 'CANCELADA')
      and public.can_access_occurrence(o.id)
      and exists (
        select 1
        from public.organization_contacts oc
        where oc.organization_id = p_organization_id
          and oc.organization_member_id = v_member_id
          and oc.is_active = true
          and (oc.area_id is null or oc.area_id = o.area_id)
          and (oc.unit_id is null or oc.unit_id = o.unit_id)
          and (oc.contract_id is null or oc.contract_id = o.contract_id)
          and (
            oc.management_department_id is null
            or oc.management_department_id = o.management_department_id
          )
      );

    select count(*)
    into v_scoped_pending_awareness
    from public.notifications n
    join public.notification_events ne on ne.id = n.notification_event_id
    join public.occurrences o on o.id = ne.occurrence_id
    where n.organization_id = p_organization_id
      and n.requires_awareness
      and n.awareness_confirmed_at is null
      and public.can_access_occurrence(o.id)
      and exists (
        select 1
        from public.organization_contacts oc
        where oc.organization_id = p_organization_id
          and oc.organization_member_id = v_member_id
          and oc.is_active = true
          and (oc.area_id is null or oc.area_id = o.area_id)
          and (oc.unit_id is null or oc.unit_id = o.unit_id)
          and (oc.contract_id is null or oc.contract_id = o.contract_id)
          and (
            oc.management_department_id is null
            or oc.management_department_id = o.management_department_id
          )
      );
  end if;

  -- --------------------------------------------------------------------------
  -- managerial.* — ocorrências
  -- --------------------------------------------------------------------------
  if v_can_occurrence_read then
    select count(*)
    into v_active_occurrences
    from public.occurrences o
    where o.organization_id = p_organization_id
      and o.status not in ('ENCERRADA', 'CANCELADA')
      and public.can_access_occurrence(o.id);

    select count(*)
    into v_pending_evaluation
    from public.occurrences o
    where o.organization_id = p_organization_id
      and o.status in ('PARALISACAO_PREVENTIVA', 'EM_AVALIACAO')
      and public.can_access_occurrence(o.id);

    select count(*)
    into v_active_interdictions
    from public.occurrences o
    where o.organization_id = p_organization_id
      and o.status in (
        'INTERDICAO_CONFIRMADA',
        'MDHO_EM_PREENCHIMENTO',
        'AGUARDANDO_APROVACAO_HSE',
        'AGUARDANDO_REGISTRO_IMS',
        'EM_TRATATIVA',
        'AGUARDANDO_VALIDACAO'
      )
      and public.can_access_occurrence(o.id);

    select count(*)
    into v_awaiting_validation
    from public.occurrences o
    where o.organization_id = p_organization_id
      and o.status = 'AGUARDANDO_VALIDACAO'
      and public.can_access_occurrence(o.id);

    select jsonb_build_object(
      'OPEN_EVALUATION', coalesce(count(*) filter (
        where o.status in ('PARALISACAO_PREVENTIVA', 'EM_AVALIACAO')
      ), 0),
      'VER_E_AGIR', coalesce(count(*) filter (where o.status = 'VER_E_AGIR'), 0),
      'INTERDICTED', coalesce(count(*) filter (
        where o.status in (
          'INTERDICAO_CONFIRMADA',
          'MDHO_EM_PREENCHIMENTO',
          'AGUARDANDO_APROVACAO_HSE',
          'AGUARDANDO_REGISTRO_IMS'
        )
      ), 0),
      'IN_TREATMENT', coalesce(count(*) filter (where o.status = 'EM_TRATATIVA'), 0),
      'AWAITING_VALIDATION', coalesce(count(*) filter (where o.status = 'AGUARDANDO_VALIDACAO'), 0),
      'COMPLETED', coalesce(count(*) filter (where o.status in ('LIBERADA', 'ENCERRADA')), 0),
      'CANCELLED', coalesce(count(*) filter (where o.status = 'CANCELADA'), 0)
    )
    into v_occurrences_by_status_family
    from public.occurrences o
    where o.organization_id = p_organization_id
      and public.can_access_occurrence(o.id);

    if v_period_ready then
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', x.area_id,
            'label', x.area_name,
            'count', x.cnt
          )
          order by x.cnt desc, x.area_name asc
        ),
        '[]'::jsonb
      )
      into v_occurrences_by_area
      from (
        select
          o.area_id,
          coalesce(ar.name, 'Área sem nome') as area_name,
          count(*)::bigint as cnt
        from public.occurrences o
        left join public.areas ar on ar.id = o.area_id
        where o.organization_id = p_organization_id
          and o.created_at >= p_period_start
          and o.created_at <= p_period_end
          and public.can_access_occurrence(o.id)
        group by o.area_id, ar.name
      ) x;

      select count(*)
      into v_new_occurrences_in_period
      from public.occurrences o
      where o.organization_id = p_organization_id
        and o.created_at >= p_period_start
        and o.created_at <= p_period_end
        and public.can_access_occurrence(o.id);

      select round(avg(extract(epoch from (o.evaluated_at - o.created_at)) / 60.0))::integer
      into v_avg_evaluation_minutes
      from public.occurrences o
      where o.organization_id = p_organization_id
        and o.evaluated_at is not null
        and o.evaluated_at >= p_period_start
        and o.evaluated_at <= p_period_end
        and public.can_access_occurrence(o.id);

      select round(avg(extract(epoch from (o.released_at - coalesce(o.stopped_at, o.created_at))) / 60.0))::integer
      into v_avg_release_minutes
      from public.occurrences o
      where o.organization_id = p_organization_id
        and o.released_at is not null
        and o.released_at >= p_period_start
        and o.released_at <= p_period_end
        and public.can_access_occurrence(o.id);
    end if;
  end if;

  -- --------------------------------------------------------------------------
  -- managerial — MDHO
  -- --------------------------------------------------------------------------
  if v_can_mdho_queue then
    select count(*)
    into v_mdho_pending_approval
    from public.mdho_assessments a
    join public.occurrences o on o.id = a.occurrence_id
    where a.organization_id = p_organization_id
      and a.status = 'SUBMITTED'
      and o.status = 'AGUARDANDO_APROVACAO_HSE'
      and public.can_access_occurrence(a.occurrence_id);
  end if;

  -- --------------------------------------------------------------------------
  -- managerial — plano de ação
  -- --------------------------------------------------------------------------
  if v_can_action_plan then
    select count(*)
    into v_overdue_action_items
    from public.action_items ai
    join public.action_plans ap on ap.id = ai.action_plan_id
    where ai.organization_id = p_organization_id
      and ai.due_at < now()
      and ai.status not in ('COMPLETED', 'CANCELLED')
      and public.can_access_occurrence(ap.occurrence_id);

    select count(*)
    into v_due_soon_action_items
    from public.action_items ai
    join public.action_plans ap on ap.id = ai.action_plan_id
    where ai.organization_id = p_organization_id
      and ai.status not in ('COMPLETED', 'CANCELLED')
      and ai.due_at >= now()
      and ai.due_at <= now() + make_interval(days => v_due_soon_days)
      and public.can_access_occurrence(ap.occurrence_id);

    select count(*)
    into v_open_action_plans
    from public.action_plans ap
    where ap.organization_id = p_organization_id
      and ap.status not in ('COMPLETED', 'CANCELLED')
      and public.can_access_occurrence(ap.occurrence_id);

    if v_period_ready then
      with finished as (
        select ai.status
        from public.action_items ai
        join public.action_plans ap on ap.id = ai.action_plan_id
        where ai.organization_id = p_organization_id
          and public.can_access_occurrence(ap.occurrence_id)
          and (
            (ai.status = 'COMPLETED' and ai.completed_at between p_period_start and p_period_end)
            or (ai.status = 'CANCELLED' and ai.updated_at between p_period_start and p_period_end)
          )
      )
      select case
        when count(*) = 0 then null
        else round(
          100.0 * count(*) filter (where status = 'COMPLETED') / count(*)
        )::integer
      end
      into v_action_completion_rate
      from finished;
    end if;
  end if;

  -- --------------------------------------------------------------------------
  -- managerial — pendingAwarenessOrg (exclusivo report.read; agregação org-wide)
  -- --------------------------------------------------------------------------
  if v_can_report_read then
    select count(*)
    into v_pending_awareness_org
    from public.notifications n
    where n.organization_id = p_organization_id
      and n.requires_awareness
      and n.awareness_confirmed_at is null;
  end if;

  return jsonb_build_object(
    'personal', jsonb_build_object(
      'myPendingActions', coalesce(v_my_pending_actions, 0),
      'myOverdueActions', coalesce(v_my_overdue_actions, 0),
      'myPendingAwareness', coalesce(v_my_pending_awareness, 0)
    ),
    'operational', jsonb_build_object(
      'scopedOpenOccurrences', case when v_has_contacts then v_scoped_open_occurrences else null end,
      'scopedPendingAwareness', case when v_has_contacts then v_scoped_pending_awareness else null end
    ),
    'managerial', jsonb_build_object(
      'activeOccurrences', case when v_can_occurrence_read then v_active_occurrences else null end,
      'pendingEvaluation', case when v_can_occurrence_read then v_pending_evaluation else null end,
      'activeInterdictions', case when v_can_occurrence_read then v_active_interdictions else null end,
      'awaitingValidation', case when v_can_occurrence_read then v_awaiting_validation else null end,
      'mdhoPendingApproval', case when v_can_mdho_queue then v_mdho_pending_approval else null end,
      'overdueActionItems', case when v_can_action_plan then v_overdue_action_items else null end,
      'dueSoonActionItems', case when v_can_action_plan then v_due_soon_action_items else null end,
      'openActionPlans', case when v_can_action_plan then v_open_action_plans else null end,
      'pendingAwarenessOrg', case when v_can_report_read then v_pending_awareness_org else null end,
      'newOccurrencesInPeriod', case when v_can_occurrence_read and v_period_ready then v_new_occurrences_in_period else null end,
      'avgEvaluationTimeMinutes', case when v_can_occurrence_read and v_period_ready then v_avg_evaluation_minutes else null end,
      'avgReleaseTimeMinutes', case when v_can_occurrence_read and v_period_ready then v_avg_release_minutes else null end,
      'actionCompletionRate', case when v_can_action_plan and v_period_ready then v_action_completion_rate else null end,
      'occurrencesByStatusFamily', case when v_can_occurrence_read then v_occurrences_by_status_family else null end,
      'occurrencesByArea', case when v_can_occurrence_read and v_period_ready then v_occurrences_by_area else null end
    )
  );
end;
$$;

comment on function public.get_dashboard_kpis(uuid, integer, timestamptz, timestamptz) is
  'KPIs de estoque/fluxo do Dashboard (Sprint 3.2). SECURITY DEFINER com gates has_permission() explícitos.';

grant execute on function public.get_dashboard_kpis(uuid, integer, timestamptz, timestamptz) to authenticated;

-- ============================================================================
-- Testes manuais (Sprint 3.2 — S32-FIN-M01/M02)
-- ============================================================================
-- T1) qa-gestor (report.read + occurrence.read):
--   activeOccurrences=0, pendingAwarenessOrg=0, personal preenchido — PASS (2026-08-19)
-- T2) qa-field (sem report.read):
--   pendingAwarenessOrg=null, personal.myPendingActions=0 — PASS
-- T3) qa-gestor + p_organization_id Beta (spoof):
--   HTTP 403, ORGANIZATION_NOT_ALLOWED (42501) — PASS
