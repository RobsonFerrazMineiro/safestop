-- ============================================================================
-- SafeStop — Sprint 2.1: endurecer create_occurrence + listagem contratadas/contratos
-- ============================================================================
-- Reforça A-R2/A-R4: campos sensíveis ignorados no payload cliente.
-- SW-03: list_organization_contractors (contratadas com contrato ativo)
-- SW-04: list_organization_contracts (contratos filtrados por contratada)
-- Referência: docs/decisions/PREVENTIVE-STOP-DECISIONS.md A-R2, A-R4
-- ============================================================================

create or replace function public.create_occurrence(payload jsonb)
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
  'Registra Paralisação Preventiva (Sprint 2.1): status PARALISACAO_PREVENTIVA, stopped_at=occurred_at, contractor_organization_id obrigatório com contrato ativo, public_code via contador global. Ignora created_by, status, public_code e stopped_at do payload cliente.';


-- ============================================================================
-- SW-03 — Contratadas com contrato ativo na organização cliente (A-R2)
-- ============================================================================

create function public.list_organization_contractors(target_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_data jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'UNAUTHORIZED',
        'message', 'Usuário não autenticado.'
      )
    );
  end if;

  if target_organization_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'target_organization_id é obrigatório.'
      )
    );
  end if;

  if not (target_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem vínculo ativo na organização informada.'
      )
    );
  end if;

  if not public.has_permission('occurrence.create', target_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.create na organização informada.'
      )
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'contractor_organization_id', contractors.contractor_organization_id,
        'contractor_name', contractors.contractor_name
      )
      order by contractors.contractor_name
    ),
    '[]'::jsonb
  )
  into v_data
  from (
    select distinct
      ctr.id as contractor_organization_id,
      ctr.name as contractor_name
    from public.contracts c
    join public.organizations ctr on ctr.id = c.contractor_organization_id
    where c.client_organization_id = target_organization_id
      and c.is_active = true
  ) as contractors;

  return jsonb_build_object(
    'success', true,
    'data', v_data
  );
end;
$$;

comment on function public.list_organization_contractors(uuid) is
  'Lista contratadas com contrato ativo para a organização cliente (A-R2 / SW-03). Requer occurrence.create.';


-- ============================================================================
-- SW-04 — Contratos ativos filtrados por organização e contratada opcional
-- ============================================================================

create function public.list_organization_contracts(
  target_organization_id uuid,
  filter_contractor_organization_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_data jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'UNAUTHORIZED',
        'message', 'Usuário não autenticado.'
      )
    );
  end if;

  if target_organization_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'target_organization_id é obrigatório.'
      )
    );
  end if;

  if not (target_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem vínculo ativo na organização informada.'
      )
    );
  end if;

  if not public.has_permission('occurrence.create', target_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.create na organização informada.'
      )
    );
  end if;

  if filter_contractor_organization_id is not null
     and not exists (
       select 1
       from public.contracts c
       where c.client_organization_id = target_organization_id
         and c.contractor_organization_id = filter_contractor_organization_id
         and c.is_active = true
     ) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'filter_contractor_organization_id não possui contrato ativo com a organização informada.'
      )
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'contract_id', contracts.contract_id,
        'contract_number', contracts.contract_number,
        'name', contracts.name,
        'contractor_organization_id', contracts.contractor_organization_id,
        'unit_id', contracts.unit_id
      )
      order by contracts.contract_number nulls last, contracts.name
    ),
    '[]'::jsonb
  )
  into v_data
  from (
    select
      c.id as contract_id,
      c.contract_number,
      c.name,
      c.contractor_organization_id,
      c.unit_id
    from public.contracts c
    where c.client_organization_id = target_organization_id
      and c.is_active = true
      and (
        filter_contractor_organization_id is null
        or c.contractor_organization_id = filter_contractor_organization_id
      )
  ) as contracts;

  return jsonb_build_object(
    'success', true,
    'data', v_data
  );
end;
$$;

comment on function public.list_organization_contracts(uuid, uuid) is
  'Lista contratos ativos da organização cliente, com filtro opcional por contratada (SW-04). Requer occurrence.create.';

grant execute on function public.list_organization_contractors(uuid) to authenticated;
grant execute on function public.list_organization_contracts(uuid, uuid) to authenticated;
