-- ============================================================================
-- Fix: public_code globalmente único vs contador por organização (A1)
-- ============================================================================
-- Causa do INTERNAL_ERROR na 2ª organização: contador por (organization_id, year)
-- gerava SS-YY-000001 repetido entre tenants, violando occurrences_public_code_unique.
-- Sequência correta para formato SS-{YY}-{NNNNNN} global: plataforma inteira / ano.
-- Referência: docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md A1 (unicidade global).
-- ============================================================================

create table public.occurrence_public_code_yearly_counters (
  year smallint primary key,
  last_value integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint occurrence_public_code_yearly_counters_year_check
    check (year >= 0 and year <= 99),
  constraint occurrence_public_code_yearly_counters_last_value_non_negative
    check (last_value >= 0)
);

comment on table public.occurrence_public_code_yearly_counters is
  'Contador global SS-{YY}-{NNNNNN} por ano civil UTC. Unicidade de public_code é global (docs/database.md §8.2).';

create trigger set_updated_at
  before update on public.occurrence_public_code_yearly_counters
  for each row execute function public.set_updated_at();

alter table public.occurrence_public_code_yearly_counters enable row level security;

-- Sincroniza com o maior sequencial já emitido (ocorrências existentes + contadores legados).
insert into public.occurrence_public_code_yearly_counters (year, last_value)
select
  parsed.year,
  max(parsed.seq)
from (
  select
    (extract(year from timezone('utc', o.created_at))::integer % 100)::smallint as year,
    substring(o.public_code from '-(\d{6})$')::integer as seq
  from public.occurrences o
  where o.public_code ~ '^SS-\d{2}-\d{6}$'

  union all

  select c.year, c.last_value as seq
  from public.occurrence_public_code_counters c
) as parsed
group by parsed.year
on conflict (year) do update
  set last_value = greatest(
    public.occurrence_public_code_yearly_counters.last_value,
    excluded.last_value
  );

comment on table public.occurrence_public_code_counters is
  'Legado A1 (contador por organização). Substituído por occurrence_public_code_yearly_counters — não usar em novas RPCs.';

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
  'Registra Paralisação Preventiva. public_code via contador global por ano (unicidade global SS-{YY}-{NNNNNN}).';
