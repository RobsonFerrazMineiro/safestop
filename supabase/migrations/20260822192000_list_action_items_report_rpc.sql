-- ============================================================================
-- SafeStop — Sprint 3.3: RPC list_action_items_report
-- ============================================================================
-- Referência: docs/decisions/REPORTS-DECISIONS.md (handoff DATABASE item 2)
-- SECURITY INVOKER — RLS existente de action_items (occurrence.read +
-- can_access_occurrence via action_plans) já cobre o escopo de leitura.
-- isOverdue/isDueSoon replicam exatamente packages/types/src/dashboard-formulas.ts
-- (isOverdueActionItem / isDueSoonActionItem) — mesmo threshold, sem reinventar.
-- ============================================================================

create function public.list_action_items_report(
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
  'Relatório de Plano de Ação (Sprint 3.3). SECURITY INVOKER — RLS de action_items cobre occurrence.read + can_access_occurrence. isOverdue/isDueSoon replicam dashboard-formulas.ts.';

grant execute on function public.list_action_items_report(
  uuid, timestamptz, timestamptz, uuid, text[], boolean, boolean, integer, text, text, jsonb, integer
) to authenticated;
