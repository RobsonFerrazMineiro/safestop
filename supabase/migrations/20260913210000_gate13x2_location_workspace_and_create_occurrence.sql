-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.2: areas/units/md workspace_id + create_occurrence
-- ============================================================================
-- Additive. Sem NOT NULL. Sem DROP de occurrences.organization_id.
-- Sem backfill. Sem permission nova. Sem organization_contacts.
-- Caminho legado (workspace_id NULL) permanece intacto.
-- ============================================================================


-- ============================================================================
-- 1. units / areas / management_departments.workspace_id
-- ============================================================================

alter table public.units
  add column workspace_id uuid null references public.workspaces (id) on delete restrict;

alter table public.areas
  add column workspace_id uuid null references public.workspaces (id) on delete restrict;

alter table public.management_departments
  add column workspace_id uuid null references public.workspaces (id) on delete restrict;

comment on column public.units.workspace_id is
  'Destino Workspace-scoped (AndCheck OperationalArea.workspaceId). NULL = ainda Organization-scoped (legado). Sem backfill 13X.2.';
comment on column public.areas.workspace_id is
  'Destino Workspace-scoped. NULL = legado Organization-scoped. Sem backfill 13X.2.';
comment on column public.management_departments.workspace_id is
  'Destino Workspace-scoped. NULL = legado Organization-scoped. Sem backfill 13X.2.';

create index units_workspace_id_idx
  on public.units (workspace_id)
  where workspace_id is not null;

create index areas_workspace_id_idx
  on public.areas (workspace_id)
  where workspace_id is not null;

create index management_departments_workspace_id_idx
  on public.management_departments (workspace_id)
  where workspace_id is not null;

create unique index units_workspace_code_unique
  on public.units (workspace_id, code)
  where workspace_id is not null and code is not null;

create unique index areas_workspace_code_unique
  on public.areas (workspace_id, code)
  where workspace_id is not null and code is not null;

create unique index management_departments_workspace_code_unique
  on public.management_departments (workspace_id, code)
  where workspace_id is not null and code is not null;

-- Unique legado (organization_id, code) permanece.


-- ============================================================================
-- 2. Integridade area/md × unit quando ambos têm workspace_id
-- ============================================================================

create or replace function public.validate_location_workspace_alignment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_unit_workspace_id uuid;
begin
  if tg_table_name = 'units' then
    if new.workspace_id is not null then
      if exists (
        select 1
        from public.areas a
        where a.unit_id = new.id
          and a.workspace_id is not null
          and a.workspace_id is distinct from new.workspace_id
      ) then
        raise exception
          'unit.workspace_id diverge de areas.workspace_id (Gate 13X.2)';
      end if;

      if exists (
        select 1
        from public.management_departments md
        where md.unit_id = new.id
          and md.workspace_id is not null
          and md.workspace_id is distinct from new.workspace_id
      ) then
        raise exception
          'unit.workspace_id diverge de management_departments.workspace_id (Gate 13X.2)';
      end if;
    end if;

    return new;
  end if;

  select u.workspace_id
    into v_unit_workspace_id
  from public.units u
  where u.id = new.unit_id;

  if new.workspace_id is not null
     and v_unit_workspace_id is not null
     and new.workspace_id is distinct from v_unit_workspace_id then
    raise exception
      'workspace_id do filho deve ser igual ao da unit quando ambos NOT NULL (Gate 13X.2)';
  end if;

  return new;
end;
$$;

comment on function public.validate_location_workspace_alignment() is
  'Gate 13X.2: se area/md.workspace_id e unit.workspace_id forem NOT NULL, devem ser iguais. Sem exigir WS em rows legado.';

create trigger validate_unit_workspace_alignment
  before update of workspace_id on public.units
  for each row execute function public.validate_location_workspace_alignment();

create trigger validate_area_workspace_alignment
  before insert or update of workspace_id, unit_id on public.areas
  for each row execute function public.validate_location_workspace_alignment();

create trigger validate_management_department_workspace_alignment
  before insert or update of workspace_id, unit_id on public.management_departments
  for each row execute function public.validate_location_workspace_alignment();


-- ============================================================================
-- 3. create_occurrence — caminho legado × caminho Workspace
-- ============================================================================

create or replace function public.create_occurrence(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_acting_organization_id uuid;
  v_tenant_organization_id uuid;
  v_origin_organization_id uuid;
  v_workspace_id uuid;
  v_workspace_owner_id uuid;
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
  v_area_org_id uuid;
  v_area_workspace_id uuid;
  v_year smallint;
  v_sequence integer;
  v_public_code text;
  v_occurrence_id uuid;
  v_result jsonb;
  v_contract_workspace_id uuid;
  v_contract_contractor_id uuid;
  v_contract_active boolean;
begin
  -- Campos ignorados do payload cliente: created_by, status, public_code,
  -- stopped_at, origin_organization_id (servidor deriva origin no caminho WS).
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

  v_acting_organization_id := nullif(btrim(payload ->> 'organization_id'), '')::uuid;
  v_workspace_id := nullif(btrim(payload ->> 'workspace_id'), '')::uuid;
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

  if v_acting_organization_id is null
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

  -- Organization atuante: deve pertencer ao usuário. origin NÃO vem do cliente.
  if not (v_acting_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem vínculo ativo na organização informada.'
      )
    );
  end if;

  if not public.has_permission('occurrence.create', v_acting_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.create na organização informada.'
      )
    );
  end if;

  -- ------------------------------------------------------------------------
  -- Caminho Workspace (payload.workspace_id NOT NULL)
  -- ------------------------------------------------------------------------
  if v_workspace_id is not null then
    if not public.can_access_workspace(v_workspace_id) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'FORBIDDEN',
          'message', 'Usuário sem acesso efetivo ao Workspace informado.'
        )
      );
    end if;

    if not exists (
      select 1
      from public.organization_workspace_links owl
      where owl.organization_id = v_acting_organization_id
        and owl.workspace_id = v_workspace_id
        and owl.is_active = true
    ) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'VALIDATION_ERROR',
          'message', 'organization_id não possui link ativo com workspace_id.'
        )
      );
    end if;

    select w.owner_organization_id
      into v_workspace_owner_id
    from public.workspaces w
    where w.id = v_workspace_id;

    -- Tenant legado: owner do ambiente. Fallback = org atuante (dívida até 13X.6).
    v_tenant_organization_id := coalesce(v_workspace_owner_id, v_acting_organization_id);
    v_origin_organization_id := v_acting_organization_id;

    if (v_contract_id is null) <> (v_contractor_organization_id is null) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'VALIDATION_ERROR',
          'message', 'No Workspace, contract_id e contractor_organization_id devem ser informados juntos ou ambos omitidos (equipe própria).'
        )
      );
    end if;

    if v_contract_id is null and v_contractor_organization_id is null then
      -- Equipe própria: só o owner/contratante do Workspace.
      if v_workspace_owner_id is null then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'Equipe própria exige workspaces.owner_organization_id preenchido.'
          )
        );
      end if;

      if v_acting_organization_id is distinct from v_workspace_owner_id then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'Equipe própria só é permitida à Organization owner/contratante do Workspace.'
          )
        );
      end if;
    else
      select c.workspace_id, c.contractor_organization_id, c.is_active
        into v_contract_workspace_id, v_contract_contractor_id, v_contract_active
      from public.contracts c
      where c.id = v_contract_id;

      if v_contract_workspace_id is null
         or v_contract_workspace_id is distinct from v_workspace_id then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'contract_id deve pertencer ao Workspace informado.'
          )
        );
      end if;

      if v_contract_active is not true then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'contract_id deve ser um contrato ativo no Workspace informado.'
          )
        );
      end if;

      if v_contract_contractor_id is distinct from v_contractor_organization_id then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'contractor_organization_id deve ser a titular (contratada) do contrato no Workspace.'
          )
        );
      end if;

      if not exists (
        select 1
        from public.organization_workspace_links owl
        where owl.organization_id = v_contractor_organization_id
          and owl.workspace_id = v_workspace_id
          and owl.is_active = true
      ) then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'A Organization titular do contrato não possui link ativo no Workspace.'
          )
        );
      end if;
    end if;

    -- Dual-read de área: WS estrito se preenchido; fallback org=tenant só se WS NULL.
    -- FK occurrences (area_id, organization_id) ainda exige area.organization_id = tenant.
    select a.unit_id, a.organization_id, a.workspace_id
      into v_area_unit_id, v_area_org_id, v_area_workspace_id
    from public.areas a
    where a.id = v_area_id
      and a.is_active = true
      and (
        (a.workspace_id is not null and a.workspace_id = v_workspace_id)
        or (a.workspace_id is null and a.organization_id = v_tenant_organization_id)
      );

    if v_area_unit_id is null then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'VALIDATION_ERROR',
          'message', 'area_id inválida, inativa ou incompatível com o Workspace/tenant.'
        )
      );
    end if;

    if v_area_org_id is distinct from v_tenant_organization_id then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'VALIDATION_ERROR',
          'message', 'area_id ainda precisa pertencer ao tenant legado (occurrences.organization_id) até o cutover do FK composto (13X.6).'
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

    if not exists (
      select 1
      from public.units u
      where u.id = v_unit_id
        and u.is_active = true
        and (
          (u.workspace_id is not null and u.workspace_id = v_workspace_id)
          or (u.workspace_id is null and u.organization_id = v_tenant_organization_id)
        )
    ) then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'VALIDATION_ERROR',
          'message', 'unit_id inválida, inativa ou incompatível com o Workspace/tenant.'
        )
      );
    end if;

    if v_management_department_id is not null then
      if not exists (
        select 1
        from public.management_departments md
        where md.id = v_management_department_id
          and md.is_active = true
          and (
            (md.workspace_id is not null and md.workspace_id = v_workspace_id)
            or (md.workspace_id is null and md.organization_id = v_tenant_organization_id)
          )
      ) then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'management_department_id inválida ou incompatível com o Workspace/tenant.'
          )
        );
      end if;
    end if;

  -- ------------------------------------------------------------------------
  -- Caminho legado (workspace_id ausente / NULL) — comportamento atual
  -- ------------------------------------------------------------------------
  else
    v_tenant_organization_id := v_acting_organization_id;
    v_origin_organization_id := null;

    if v_contractor_organization_id is null then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'VALIDATION_ERROR',
          'message', 'Campos obrigatórios ausentes: organization_id, area_id, contractor_organization_id, title, task_description, location_description, condition_description, severity.'
        )
      );
    end if;

    if not exists (
      select 1
      from public.contracts c
      where c.client_organization_id = v_acting_organization_id
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
          and c.client_organization_id = v_acting_organization_id
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
      and a.organization_id = v_acting_organization_id
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
          and md.organization_id = v_acting_organization_id
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
    origin_organization_id,
    workspace_id,
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
    v_tenant_organization_id,
    v_origin_organization_id,
    v_workspace_id,
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
    'origin_organization_id', o.origin_organization_id,
    'workspace_id', o.workspace_id,
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

  -- Lookup do member na org ATUANTE (origin), não no tenant legado.
  perform public.create_occurrence_notification_event(
    v_occurrence_id,
    'OCCURRENCE_CREATED',
    'CRITICAL',
    'Paralisação Preventiva registrada',
    coalesce(v_title, 'Nova Paralisação Preventiva'),
    true,
    public.lookup_organization_member_id(v_user_id, v_acting_organization_id),
    v_user_id,
    jsonb_build_object('public_code', v_public_code)
  );

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
  when check_violation then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Combinação organization_id/workspace_id inválida ou Workspace inativo.'
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
  'Cria PP. Gate 13X.2: dois caminhos. workspace_id NULL = legado (contratada obrigatória, client=org atuante, origin NULL). workspace_id NOT NULL = origin=org atuante; tenant legado=owner (fallback atuante); contrato no WS ou equipe própria só do owner. Sem origin arbitrário do cliente. SECURITY DEFINER; search_path vazio.';
