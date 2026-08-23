-- ============================================================================
-- SafeStop — Sprint 3.3: RPC list_awareness_report
-- ============================================================================
-- Referência: docs/decisions/REPORTS-DECISIONS.md (PO-REP-4, achado técnico)
-- SECURITY DEFINER — notifications_select (RLS) restringe leitura a
-- recipient_member_id = current_organization_member_id(); agregação org-wide
-- do Relatório de Ciência exige bypass controlado, mesmo padrão de
-- pendingAwarenessOrg em get_dashboard_kpis (DASHBOARD-DECISIONS.md).
-- Gate has_permission('report.read', ...) é a PRIMEIRA linha executável —
-- sem ele, nenhuma linha é retornada, mesmo com occurrence.read amplo.
-- ============================================================================

create function public.list_awareness_report(
  p_organization_id uuid,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null,
  p_occurrence_id uuid default null,
  p_recipient_member_id uuid default null,
  p_pending_only boolean default null,
  p_sort_field text default 'created_at',
  p_sort_direction text default 'desc',
  p_cursor jsonb default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
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
  -- PRIMEIRA LINHA (PO-REP-4, achado técnico): sem esse gate, nenhuma linha
  -- é retornada, mesmo com occurrence.read amplo.
  if not public.has_permission('report.read', p_organization_id) then
    raise exception 'PERMISSION_DENIED' using errcode = '42501';
  end if;

  if p_organization_id not in (select public.current_organization_ids())
     and not public.is_platform_admin() then
    raise exception 'ORGANIZATION_NOT_ALLOWED' using errcode = '42501';
  end if;

  v_sort_field := coalesce(p_sort_field, 'created_at');
  if v_sort_field not in ('created_at', 'event_type') then
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
      n.id,
      ne.occurrence_id,
      n.notification_event_id,
      ne.event_type,
      n.recipient_member_id,
      public.resolve_member_display_name(n.recipient_member_id) as recipient_member_name,
      n.requires_awareness,
      n.read_at,
      n.awareness_confirmed_at,
      n.created_at,
      case v_sort_field
        when 'event_type' then ne.event_type
        else to_char(n.created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US')
      end as sort_value
    from public.notifications n
    join public.notification_events ne on ne.id = n.notification_event_id
    where n.organization_id = p_organization_id
      and (p_period_start is null or n.created_at >= p_period_start)
      and (p_period_end is null or n.created_at <= p_period_end)
      and (p_occurrence_id is null or ne.occurrence_id = p_occurrence_id)
      and (p_recipient_member_id is null or n.recipient_member_id = p_recipient_member_id)
      and (
        p_pending_only is null
        or (p_pending_only = true and n.requires_awareness and n.awareness_confirmed_at is null)
        or (p_pending_only = false and not (n.requires_awareness and n.awareness_confirmed_at is null))
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
            'notificationEventId', n.notification_event_id,
            'eventType', n.event_type,
            'recipientMemberId', n.recipient_member_id,
            'recipientMemberName', n.recipient_member_name,
            'requiresAwareness', n.requires_awareness,
            'readAt', n.read_at,
            'awarenessConfirmedAt', n.awareness_confirmed_at,
            'createdAt', n.created_at
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

comment on function public.list_awareness_report(
  uuid, timestamptz, timestamptz, uuid, uuid, boolean, text, text, jsonb, integer
) is
  'Relatório de Ciência (Sprint 3.3, PO-REP-4). SECURITY DEFINER com gate has_permission(report.read) na primeira linha — agregação org-wide de notifications, mesmo padrão de pendingAwarenessOrg.';

grant execute on function public.list_awareness_report(
  uuid, timestamptz, timestamptz, uuid, uuid, boolean, text, text, jsonb, integer
) to authenticated;
