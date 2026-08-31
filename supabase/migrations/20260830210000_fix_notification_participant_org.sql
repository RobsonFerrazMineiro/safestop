-- ============================================================================
-- SafeStop — Fix: occurrence_participants.organization_id must match the member org
-- ============================================================================
-- create_occurrence_notification_event inseria participantes da contratada com
-- organization_id da ocorrência (cliente). Isso viola a FK composta
-- (organization_member_id, organization_id) → organization_members e faz
-- create_occurrence cair em INTERNAL_ERROR ("Não foi possível registrar...").
-- Correção: usar organization_members.organization_id do destinatário.
-- ============================================================================

create or replace function public.create_occurrence_notification_event(
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
  v_member_organization_id uuid;
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

      select om.organization_id
        into v_member_organization_id
      from public.organization_members om
      where om.id = v_member_id
        and om.is_active = true;

      if v_member_organization_id is null then
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
        v_member_organization_id,
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
      select om.organization_id
        into v_member_organization_id
      from public.organization_members om
      where om.id = v_recipient.organization_member_id
        and om.is_active = true;

      if v_member_organization_id is null then
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
        v_member_organization_id,
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

comment on function public.create_occurrence_notification_event(
  uuid, text, text, text, text, boolean, uuid, uuid, jsonb, jsonb
) is
  'Cria notification_event + recipients. occurrence_participants.organization_id segue a org do member (cliente ou contratada).';
