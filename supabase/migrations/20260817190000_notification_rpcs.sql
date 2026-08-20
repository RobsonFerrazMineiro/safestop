-- ============================================================================
-- SafeStop — Sprint 3.1: Notification RPCs (read / ciência / listagem)
-- ============================================================================

-- ============================================================================
-- 1. mark_notification_read
-- ============================================================================

create function public.mark_notification_read(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_notification public.notifications%rowtype;
  v_read_at timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  if p_notification_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_notification_id é obrigatório.'));
  end if;

  select n.* into v_notification
  from public.notifications n
  where n.id = p_notification_id;

  if v_notification.id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Notificação não encontrada.'));
  end if;

  if not public.has_permission('notification.read', v_notification.organization_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão notification.read.'));
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.id = v_notification.recipient_member_id
      and om.profile_id = v_user_id
      and om.is_active = true
  ) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Notificação pertence a outro destinatário.'));
  end if;

  if v_notification.read_at is not null then
    return jsonb_build_object(
      'success', true,
      'data', jsonb_build_object('notification_id', p_notification_id, 'read_at', v_notification.read_at, 'idempotent', true)
    );
  end if;

  update public.notifications
  set read_at = now()
  where id = p_notification_id
  returning read_at into v_read_at;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object('notification_id', p_notification_id, 'read_at', v_read_at)
  );
end;
$$;


-- ============================================================================
-- 2. mark_all_notifications_read
-- ============================================================================

create function public.mark_all_notifications_read(p_organization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_member_id uuid;
  v_updated integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  if p_organization_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_organization_id é obrigatório.'));
  end if;

  if not (p_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem vínculo ativo na organização.'));
  end if;

  if not public.has_permission('notification.read', p_organization_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão notification.read.'));
  end if;

  v_member_id := public.lookup_organization_member_id(v_user_id, p_organization_id);

  if v_member_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Membro organizacional não encontrado.'));
  end if;

  update public.notifications n
  set read_at = now()
  where n.organization_id = p_organization_id
    and n.recipient_member_id = v_member_id
    and n.read_at is null;

  get diagnostics v_updated = row_count;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object('updated_count', v_updated)
  );
end;
$$;


-- ============================================================================
-- 3. confirm_notification_awareness
-- ============================================================================

create function public.confirm_notification_awareness(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_notification public.notifications%rowtype;
  v_confirmed_at timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  if p_notification_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_notification_id é obrigatório.'));
  end if;

  select n.* into v_notification
  from public.notifications n
  where n.id = p_notification_id;

  if v_notification.id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Notificação não encontrada.'));
  end if;

  if not public.has_permission('notification.confirm_awareness', v_notification.organization_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão notification.confirm_awareness.'));
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.id = v_notification.recipient_member_id
      and om.profile_id = v_user_id
      and om.is_active = true
  ) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Notificação pertence a outro destinatário.'));
  end if;

  if not v_notification.requires_awareness then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'Esta notificação não exige confirmação de ciência.'));
  end if;

  if v_notification.awareness_confirmed_at is not null then
    return jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'notification_id', p_notification_id,
        'awareness_confirmed_at', v_notification.awareness_confirmed_at,
        'idempotent', true
      )
    );
  end if;

  update public.notifications
  set
    awareness_confirmed_at = now(),
    read_at = coalesce(read_at, now())
  where id = p_notification_id
  returning awareness_confirmed_at into v_confirmed_at;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object('notification_id', p_notification_id, 'awareness_confirmed_at', v_confirmed_at)
  );
end;
$$;


-- ============================================================================
-- 4. list_my_notifications
-- ============================================================================

create function public.list_my_notifications(
  p_organization_id uuid,
  p_cursor timestamptz default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_member_id uuid;
  v_limit integer;
  v_fetch_limit integer;
  v_items jsonb;
  v_next_cursor timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'UNAUTHORIZED', 'message', 'Usuário não autenticado.'));
  end if;

  if p_organization_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_organization_id é obrigatório.'));
  end if;

  if not (p_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem vínculo ativo na organização.'));
  end if;

  if not public.has_permission('notification.read', p_organization_id) then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Usuário sem permissão notification.read.'));
  end if;

  v_member_id := public.lookup_organization_member_id(v_user_id, p_organization_id);

  if v_member_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Membro organizacional não encontrado.'));
  end if;

  v_limit := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_fetch_limit := v_limit + 1;

  with page as (
    select
      n.id,
      n.notification_event_id,
      n.title,
      n.message,
      n.priority,
      n.requires_awareness,
      n.read_at,
      n.awareness_confirmed_at,
      n.created_at,
      ne.event_type,
      ne.occurrence_id
    from public.notifications n
    join public.notification_events ne on ne.id = n.notification_event_id
    where n.organization_id = p_organization_id
      and n.recipient_member_id = v_member_id
      and (p_cursor is null or n.created_at < p_cursor)
    order by n.created_at desc, n.id desc
    limit v_fetch_limit
  )
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'notificationEventId', p.notification_event_id,
            'eventType', p.event_type,
            'occurrenceId', p.occurrence_id,
            'title', p.title,
            'message', p.message,
            'priority', p.priority,
            'requiresAwareness', p.requires_awareness,
            'readAt', p.read_at,
            'awarenessConfirmedAt', p.awareness_confirmed_at,
            'createdAt', p.created_at
          )
          order by p.created_at desc, p.id desc
        )
        from (select * from page order by created_at desc, id desc limit v_limit) p
      ),
      '[]'::jsonb
    ),
    (select p.created_at from page p order by p.created_at asc, p.id asc offset v_limit limit 1)
  into v_items, v_next_cursor;

  return jsonb_build_object(
    'success', true,
    'items', coalesce(v_items, '[]'::jsonb),
    'nextCursor', v_next_cursor
  );
end;
$$;


-- ============================================================================
-- 5. Grants
-- ============================================================================

grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read(uuid) to authenticated;
grant execute on function public.confirm_notification_awareness(uuid) to authenticated;
grant execute on function public.list_my_notifications(uuid, timestamptz, integer) to authenticated;

-- ============================================================================
-- 6. Testes SQL manuais (Sprint 3.1 — item 8)
-- ============================================================================
-- Executado em 2026-08-19 (ambiente local, pnpm supabase:db:reset + script QA).
--
-- T1) PP + organization_contacts (4 contact_type: CONTRACT_INSPECTOR, HSE_SUPERVISOR,
--     HSE_LEADERSHIP, AREA_MANAGER) escopo contract_id + area_id Alpha:
--   occurrence_id: bdb8a4d4-3d55-40a0-bd33-aaea04f4fa47
--   count(*)=4, count(distinct recipient_member_id)=4
--   destinatários: c008 (Gestor/AREA_MANAGER), c009 (Supervisor), c010 (Fiscal), c011 (Liderança)
--   autor c001 (qa-field) excluído — PASS
--
-- T2) mark_notification_read 2× (qa-fiscal, notification 56b48f9d-8d6f-488d-9542-5c7db6185d38):
--   1ª chamada success=true, read_at=2026-08-19T22:42:55.063814+00:00
--   2ª chamada success=true, idempotent=true, read_at inalterado — PASS
--
-- T3) confirm_notification_awareness em requires_awareness=false
--     (DECISION_REQUIRED após start_occurrence_evaluation, notification a69ff742-…):
--   success=false, error.code=VALIDATION_ERROR — PASS
--
-- T4) confirm_notification_awareness como qa-fiscal em notificação de c009 (supervisor):
--   success=false, error.code=FORBIDDEN — PASS
