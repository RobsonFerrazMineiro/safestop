-- ============================================================================
-- SafeStop — Etapa 2 BACKEND: RPC create_occurrence
-- ============================================================================
-- Referências: docs/database.md §8, §11.1, §21; docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md
-- can_access_occurrence já definida em 20260715220000_create_occurrences_foundation.sql
-- ============================================================================

create function public.create_occurrence(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_organization_id uuid;
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
  v_area_unit_id uuid;
  v_year smallint;
  v_sequence integer;
  v_public_code text;
  v_occurrence_id uuid;
  v_result jsonb;
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

  if payload is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Payload é obrigatório.'
      )
    );
  end if;

  -- created_by nunca vem do payload; ignoramos se presente.
  v_organization_id := nullif(btrim(payload ->> 'organization_id'), '')::uuid;
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

  if v_organization_id is null
     or v_area_id is null
     or v_title is null
     or v_task_description is null
     or v_location_description is null
     or v_condition_description is null
     or v_severity is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Campos obrigatórios ausentes: organization_id, area_id, title, task_description, location_description, condition_description, severity.'
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

  insert into public.occurrence_public_code_counters (organization_id, year, last_value)
  values (v_organization_id, v_year, 1)
  on conflict (organization_id, year)
  do update
    set last_value = public.occurrence_public_code_counters.last_value + 1
  returning last_value into v_sequence;

  v_public_code := 'SS-'
    || lpad(v_year::text, 2, '0')
    || '-'
    || lpad(v_sequence::text, 6, '0');

  insert into public.occurrences (
    organization_id,
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
    created_by
  )
  values (
    v_organization_id,
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
    'area_id', o.area_id,
    'unit_id', o.unit_id,
    'public_code', o.public_code,
    'title', o.title,
    'severity', o.severity,
    'status', o.status,
    'created_by', o.created_by,
    'occurred_at', o.occurred_at,
    'created_at', o.created_at
  )
  into v_result
  from public.occurrences o
  where o.id = v_occurrence_id;

  return jsonb_build_object(
    'success', true,
    'data', v_result
  );

exception
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
  'Registra Paralisação Preventiva com status inicial PARALISACAO_PREVENTIVA, public_code SS-{YY}-{NNNNNN} e histórico. Valida occurrence.create e vínculo organizacional. created_by = auth.uid().';

grant execute on function public.create_occurrence(jsonb) to authenticated;
