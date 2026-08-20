-- ============================================================================
-- SafeStop — Sprint 3.1: Notifications foundation
-- ============================================================================
-- Referências: docs/database.md §17; docs/decisions/NOTIFICATIONS-DECISIONS.md; PO-CON-21
-- SEM notification_deliveries; SEM device_tokens; SEM push/e-mail.
-- ============================================================================

-- ============================================================================
-- 1. occurrence_participants — deduplicação por ocorrência + membro
-- ============================================================================

alter table public.occurrence_participants
  add constraint occurrence_participants_occurrence_member_unique
  unique (occurrence_id, organization_member_id);

comment on constraint occurrence_participants_occurrence_member_unique
  on public.occurrence_participants is
  'Sprint 3.1: snapshot imutável — um membro no máximo uma vez por ocorrência (ON CONFLICT DO NOTHING).';


-- ============================================================================
-- 2. notification_events
-- ============================================================================

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  occurrence_id uuid not null references public.occurrences (id) on delete restrict,
  event_type text not null,
  priority text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,

  constraint notification_events_event_type_check check (
    event_type in (
      'OCCURRENCE_CREATED',
      'DECISION_REQUIRED',
      'VER_AND_ACT_REQUIRED',
      'INTERDICTION_CONFIRMED',
      'MDHO_APPROVAL_REQUIRED',
      'MDHO_RETURNED',
      'MDHO_APPROVED',
      'IMS_REFERENCE_REGISTERED',
      'ACTION_PLAN_CREATED',
      'ACTION_ITEM_ASSIGNED',
      'ACTION_ITEM_SUBMITTED',
      'ACTION_ITEM_VALIDATED',
      'ACTION_ITEM_RETURNED',
      'ACTION_PLAN_COMPLETED'
    )
  ),
  constraint notification_events_priority_check check (
    priority in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
  )
);

comment on table public.notification_events is
  'Evento de negócio que originou comunicação (docs/database.md §17.2).';

create index notification_events_occurrence_id_idx
  on public.notification_events (occurrence_id);


-- ============================================================================
-- 3. notifications
-- ============================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  notification_event_id uuid not null references public.notification_events (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  recipient_member_id uuid not null references public.organization_members (id) on delete restrict,
  title text not null,
  message text not null,
  priority text not null,
  requires_awareness boolean not null default false,
  read_at timestamptz,
  awareness_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz,

  constraint notifications_priority_check check (
    priority in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
  ),
  constraint notifications_title_not_blank check (btrim(title) <> ''),
  constraint notifications_message_not_blank check (btrim(message) <> ''),
  constraint notifications_event_recipient_unique unique (notification_event_id, recipient_member_id)
);

comment on table public.notifications is
  'Notificação in-app individual por destinatário (docs/database.md §17.3).';

create index notifications_recipient_read_created_idx
  on public.notifications (recipient_member_id, read_at, created_at desc);

create index notifications_org_recipient_idx
  on public.notifications (organization_id, recipient_member_id);


-- ============================================================================
-- 4. Helpers
-- ============================================================================

create function public.map_contact_type_to_participant_type(p_contact_type text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_contact_type
    when 'CONTRACTOR_LEADERSHIP' then 'CONTRACTOR_LEADER'
    when 'CONTRACT_INSPECTOR' then 'CONTRACT_INSPECTOR'
    when 'HSE_SUPERVISOR' then 'HSE_SUPERVISOR'
    when 'HSE_LEADERSHIP' then 'HSE_APPROVER'
    when 'AREA_MANAGER' then 'AREA_MANAGER'
    else 'OBSERVER'
  end;
$$;

create function public.lookup_organization_member_id(
  p_profile_id uuid,
  p_organization_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select om.id
  from public.organization_members om
  where om.profile_id = p_profile_id
    and om.organization_id = p_organization_id
    and om.is_active = true
  limit 1;
$$;

create function public.current_organization_member_id(p_organization_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select public.lookup_organization_member_id(auth.uid(), p_organization_id);
$$;


-- ============================================================================
-- 5. resolve_occurrence_notification_recipients
-- ============================================================================

create function public.resolve_occurrence_notification_recipients(
  p_occurrence_id uuid,
  p_event_type text,
  p_exclude_member_id uuid default null
)
returns table (
  organization_member_id uuid,
  participant_type text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_contact_types text[];
begin
  v_contact_types := case p_event_type
    when 'OCCURRENCE_CREATED' then array['CONTRACT_INSPECTOR', 'HSE_SUPERVISOR', 'HSE_LEADERSHIP', 'AREA_MANAGER']
    when 'DECISION_REQUIRED' then array['CONTRACT_INSPECTOR', 'HSE_SUPERVISOR', 'HSE_LEADERSHIP']
    when 'VER_AND_ACT_REQUIRED' then array['CONTRACT_INSPECTOR', 'HSE_SUPERVISOR', 'HSE_LEADERSHIP', 'CONTRACTOR_LEADERSHIP', 'AREA_MANAGER']
    when 'INTERDICTION_CONFIRMED' then array['CONTRACT_INSPECTOR', 'HSE_SUPERVISOR', 'HSE_LEADERSHIP']
    when 'MDHO_APPROVAL_REQUIRED' then array['HSE_LEADERSHIP']
    when 'MDHO_APPROVED' then array['HSE_SUPERVISOR']
    when 'IMS_REFERENCE_REGISTERED' then array['CONTRACT_INSPECTOR', 'HSE_SUPERVISOR', 'HSE_LEADERSHIP', 'AREA_MANAGER']
    when 'ACTION_PLAN_CREATED' then array['HSE_SUPERVISOR', 'HSE_LEADERSHIP']
    when 'ACTION_PLAN_COMPLETED' then array['CONTRACT_INSPECTOR', 'HSE_SUPERVISOR']
    when 'ACTION_ITEM_SUBMITTED' then array['HSE_LEADERSHIP']
    else array[]::text[]
  end;

  return query
  with occurrence_ctx as (
    select
      o.organization_id,
      o.contract_id,
      o.area_id,
      o.unit_id,
      o.management_department_id,
      o.contractor_organization_id
    from public.occurrences o
    where o.id = p_occurrence_id
  ),
  client_contacts as (
    select distinct on (oc.organization_member_id)
      oc.organization_member_id,
      public.map_contact_type_to_participant_type(oc.contact_type) as participant_type
    from public.organization_contacts oc
    cross join occurrence_ctx o
    where oc.is_active = true
      and oc.organization_id = o.organization_id
      and oc.contact_type = any (v_contact_types)
      and (
        (oc.contract_id is not null and oc.contract_id = o.contract_id)
        or (oc.area_id is not null and oc.area_id = o.area_id)
        or (oc.management_department_id is not null and oc.management_department_id = o.management_department_id)
        or (oc.unit_id is not null and oc.unit_id = o.unit_id)
        or (
          oc.contract_id is null
          and oc.area_id is null
          and oc.management_department_id is null
          and oc.unit_id is null
        )
      )
      and (p_exclude_member_id is null or oc.organization_member_id <> p_exclude_member_id)
    order by oc.organization_member_id, oc.priority asc, oc.created_at asc
  ),
  contractor_contacts as (
    select distinct on (oc.organization_member_id)
      oc.organization_member_id,
      public.map_contact_type_to_participant_type(oc.contact_type) as participant_type
    from public.organization_contacts oc
    cross join occurrence_ctx o
    where oc.is_active = true
      and o.contractor_organization_id is not null
      and oc.organization_id = o.contractor_organization_id
      and oc.contact_type = 'CONTRACTOR_LEADERSHIP'
      and p_event_type in ('OCCURRENCE_CREATED', 'VER_AND_ACT_REQUIRED', 'INTERDICTION_CONFIRMED')
      and (
        (oc.contract_id is not null and oc.contract_id = o.contract_id)
        or (oc.area_id is not null and oc.area_id = o.area_id)
        or (oc.management_department_id is not null and oc.management_department_id = o.management_department_id)
        or (oc.unit_id is not null and oc.unit_id = o.unit_id)
        or (
          oc.contract_id is null
          and oc.area_id is null
          and oc.management_department_id is null
          and oc.unit_id is null
        )
      )
      and (p_exclude_member_id is null or oc.organization_member_id <> p_exclude_member_id)
    order by oc.organization_member_id, oc.priority asc, oc.created_at asc
  ),
  managing_custom as (
    select distinct on (oc.organization_member_id)
      oc.organization_member_id,
      'OBSERVER'::text as participant_type
    from public.organization_contacts oc
    cross join occurrence_ctx o
    where oc.is_active = true
      and oc.contact_type = 'CUSTOM'
      and o.contract_id is not null
      and oc.contract_id = o.contract_id
      and p_event_type in ('OCCURRENCE_CREATED', 'INTERDICTION_CONFIRMED', 'DECISION_REQUIRED')
      and (p_exclude_member_id is null or oc.organization_member_id <> p_exclude_member_id)
    order by oc.organization_member_id, oc.priority asc, oc.created_at asc
  ),
  combined as (
    select * from client_contacts
    union all
    select * from contractor_contacts
    union all
    select * from managing_custom
  )
  select distinct on (c.organization_member_id)
    c.organization_member_id,
    c.participant_type
  from combined c
  order by c.organization_member_id;
end;
$$;


-- ============================================================================
-- 6. create_occurrence_notification_event
-- ============================================================================

create function public.create_occurrence_notification_event(
  p_occurrence_id uuid,
  p_event_type text,
  p_priority text,
  p_title text,
  p_message text,
  p_requires_awareness boolean,
  p_exclude_member_id uuid,
  p_created_by uuid,
  p_payload jsonb default '{}'::jsonb,
  p_direct_recipients jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_organization_id uuid;
  v_recipient record;
  v_direct jsonb;
  v_member_id uuid;
  v_participant_type text;
begin
  select o.organization_id
    into v_organization_id
  from public.occurrences o
  where o.id = p_occurrence_id;

  if v_organization_id is null then
    raise exception 'Ocorrência % inválida para notificação', p_occurrence_id;
  end if;

  insert into public.notification_events (
    organization_id,
    occurrence_id,
    event_type,
    priority,
    payload,
    created_by
  )
  values (
    v_organization_id,
    p_occurrence_id,
    p_event_type,
    p_priority,
    coalesce(p_payload, '{}'::jsonb),
    p_created_by
  )
  returning id into v_event_id;

  if p_direct_recipients is not null and jsonb_array_length(p_direct_recipients) > 0 then
    for v_direct in
      select value
      from jsonb_array_elements(p_direct_recipients)
    loop
      v_member_id := nullif(v_direct ->> 'organization_member_id', '')::uuid;
      v_participant_type := coalesce(nullif(v_direct ->> 'participant_type', ''), 'OBSERVER');

      if v_member_id is null then
        continue;
      end if;

      if p_exclude_member_id is not null and v_member_id = p_exclude_member_id then
        continue;
      end if;

      insert into public.occurrence_participants (
        occurrence_id,
        organization_id,
        organization_member_id,
        participant_type,
        created_by
      )
      values (
        p_occurrence_id,
        v_organization_id,
        v_member_id,
        v_participant_type,
        p_created_by
      )
      on conflict (occurrence_id, organization_member_id) do nothing;

      insert into public.notifications (
        notification_event_id,
        organization_id,
        recipient_member_id,
        title,
        message,
        priority,
        requires_awareness
      )
      values (
        v_event_id,
        v_organization_id,
        v_member_id,
        p_title,
        p_message,
        p_priority,
        p_requires_awareness
      )
      on conflict (notification_event_id, recipient_member_id) do nothing;
    end loop;
  else
    for v_recipient in
      select *
      from public.resolve_occurrence_notification_recipients(
        p_occurrence_id,
        p_event_type,
        p_exclude_member_id
      )
    loop
      insert into public.occurrence_participants (
        occurrence_id,
        organization_id,
        organization_member_id,
        participant_type,
        created_by
      )
      values (
        p_occurrence_id,
        v_organization_id,
        v_recipient.organization_member_id,
        v_recipient.participant_type,
        p_created_by
      )
      on conflict (occurrence_id, organization_member_id) do nothing;

      insert into public.notifications (
        notification_event_id,
        organization_id,
        recipient_member_id,
        title,
        message,
        priority,
        requires_awareness
      )
      values (
        v_event_id,
        v_organization_id,
        v_recipient.organization_member_id,
        p_title,
        p_message,
        p_priority,
        p_requires_awareness
      )
      on conflict (notification_event_id, recipient_member_id) do nothing;
    end loop;
  end if;

  return v_event_id;
end;
$$;


-- ============================================================================
-- 7. Row Level Security
-- ============================================================================

alter table public.notification_events enable row level security;
alter table public.notifications enable row level security;

create policy notification_events_select on public.notification_events
  for select to authenticated
  using (public.is_platform_admin());

create policy notifications_select on public.notifications
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      organization_id in (select public.current_organization_ids())
      and exists (
        select 1
        from public.organization_members om
        where om.id = notifications.recipient_member_id
          and om.profile_id = auth.uid()
          and om.is_active = true
      )
    )
  );

revoke insert, update, delete on public.notification_events from authenticated;
revoke insert, update, delete on public.notifications from authenticated;

grant select on public.notification_events to authenticated;
grant select on public.notifications to authenticated;
