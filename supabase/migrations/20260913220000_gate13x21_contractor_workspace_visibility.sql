-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.2.1: visibilidade da contratada no Workspace
-- ============================================================================
-- Corretivo pós-13X.2: SELECT/lista/área no ciclo TÜV × Hydro Alunorte.
-- Não redesenha os dois caminhos de create_occurrence.
-- Não DROP de occurrences.organization_id. Sem NOT NULL. Sem permission nova.
-- ============================================================================


-- ============================================================================
-- 1. RLS occurrences_select
-- ============================================================================

drop policy if exists occurrences_select on public.occurrences;
create policy occurrences_select on public.occurrences
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      public.can_access_occurrence(id)
      and (
        public.has_permission('occurrence.read', organization_id)
        or (
          origin_organization_id is not null
          and public.has_permission('occurrence.read', origin_organization_id)
        )
        or (
          contractor_organization_id is not null
          and public.has_permission('occurrence.read', contractor_organization_id)
        )
      )
    )
  );

comment on policy occurrences_select on public.occurrences is
  'Gate 13X.2.1: leitura exige can_access_occurrence E occurrence.read no tenant, origin ou contractor. Origin não é tenant. Sem leitura só por membership.';


-- ============================================================================
-- 2. RLS areas / units / management_departments SELECT
-- ============================================================================
-- Escrita (INSERT/UPDATE) permanece na org dona da row / platform admin.

drop policy if exists areas_select on public.areas;
create policy areas_select on public.areas
  for select to authenticated
  using (
    public.is_platform_admin()
    or organization_id in (select public.current_organization_ids())
    or (
      workspace_id is not null
      and public.can_access_workspace(workspace_id)
    )
    or (
      workspace_id is null
      and exists (
        select 1
        from public.workspaces w
        where w.owner_organization_id = areas.organization_id
          and w.is_active
          and public.can_access_workspace(w.id)
      )
    )
  );

comment on policy areas_select on public.areas is
  'Gate 13X.2.1: org própria, ou Workspace com acesso efetivo, ou área legado do owner de um WS acessível. Sem ampliar area.manage.';

drop policy if exists units_select on public.units;
create policy units_select on public.units
  for select to authenticated
  using (
    public.is_platform_admin()
    or organization_id in (select public.current_organization_ids())
    or (
      workspace_id is not null
      and public.can_access_workspace(workspace_id)
    )
    or (
      workspace_id is null
      and exists (
        select 1
        from public.workspaces w
        where w.owner_organization_id = units.organization_id
          and w.is_active
          and public.can_access_workspace(w.id)
      )
    )
  );

comment on policy units_select on public.units is
  'Gate 13X.2.1: espelho de areas_select. Escrita inalterada.';

drop policy if exists management_departments_select on public.management_departments;
create policy management_departments_select on public.management_departments
  for select to authenticated
  using (
    public.is_platform_admin()
    or organization_id in (select public.current_organization_ids())
    or (
      workspace_id is not null
      and public.can_access_workspace(workspace_id)
    )
    or (
      workspace_id is null
      and exists (
        select 1
        from public.workspaces w
        where w.owner_organization_id = management_departments.organization_id
          and w.is_active
          and public.can_access_workspace(w.id)
      )
    )
  );

comment on policy management_departments_select on public.management_departments is
  'Gate 13X.2.1: espelho de areas_select. Escrita inalterada.';


-- ============================================================================
-- 3. FK composto location × tenant → trigger dual-read
-- ============================================================================
-- Filhas (action_plans etc.) com (occurrence_id, organization_id) NÃO são alteradas.

alter table public.occurrences
  drop constraint if exists occurrences_area_org_consistency;

alter table public.occurrences
  drop constraint if exists occurrences_unit_org_consistency;

alter table public.occurrences
  drop constraint if exists occurrences_management_department_org_consistency;

create or replace function public.validate_occurrence_location_org_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_area_ws uuid;
  v_area_org uuid;
  v_area_unit uuid;
  v_area_active boolean;
  v_unit_ws uuid;
  v_unit_org uuid;
  v_unit_active boolean;
  v_md_ws uuid;
  v_md_org uuid;
  v_md_active boolean;
begin
  select a.workspace_id, a.organization_id, a.unit_id, a.is_active
    into v_area_ws, v_area_org, v_area_unit, v_area_active
  from public.areas a
  where a.id = new.area_id;

  if not found or v_area_active is not true then
    raise exception 'area_id inválida ou inativa';
  end if;

  if new.unit_id is not null and new.unit_id is distinct from v_area_unit then
    raise exception 'unit_id deve ser a unidade da área informada';
  end if;

  if new.workspace_id is null then
    if v_area_org is distinct from new.organization_id then
      raise exception 'legado: area.organization_id deve ser occurrence.organization_id';
    end if;
  elsif v_area_ws is not null then
    if v_area_ws is distinct from new.workspace_id then
      raise exception 'area.workspace_id deve ser occurrence.workspace_id';
    end if;
  else
    if v_area_org is distinct from new.organization_id then
      raise exception 'dual-read: área legado deve pertencer ao tenant da occurrence';
    end if;
  end if;

  if new.unit_id is not null then
    select u.workspace_id, u.organization_id, u.is_active
      into v_unit_ws, v_unit_org, v_unit_active
    from public.units u
    where u.id = new.unit_id;

    if not found or v_unit_active is not true then
      raise exception 'unit_id inválida ou inativa';
    end if;

    if new.workspace_id is null then
      if v_unit_org is distinct from new.organization_id then
        raise exception 'legado: unit.organization_id deve ser occurrence.organization_id';
      end if;
    elsif v_unit_ws is not null then
      if v_unit_ws is distinct from new.workspace_id then
        raise exception 'unit.workspace_id deve ser occurrence.workspace_id';
      end if;
    else
      if v_unit_org is distinct from new.organization_id then
        raise exception 'dual-read: unit legado deve pertencer ao tenant da occurrence';
      end if;
    end if;
  end if;

  if new.management_department_id is not null then
    select md.workspace_id, md.organization_id, md.is_active
      into v_md_ws, v_md_org, v_md_active
    from public.management_departments md
    where md.id = new.management_department_id;

    if not found or v_md_active is not true then
      raise exception 'management_department_id inválida ou inativa';
    end if;

    if new.workspace_id is null then
      if v_md_org is distinct from new.organization_id then
        raise exception 'legado: management_department.organization_id deve ser occurrence.organization_id';
      end if;
    elsif v_md_ws is not null then
      if v_md_ws is distinct from new.workspace_id then
        raise exception 'management_department.workspace_id deve ser occurrence.workspace_id';
      end if;
    else
      if v_md_org is distinct from new.organization_id then
        raise exception 'dual-read: management_department legado deve pertencer ao tenant da occurrence';
      end if;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.validate_occurrence_location_org_workspace() is
  'Gate 13X.2.1: substitui FKs compostos area/unit/md × tenant. Caminho WS: WS-estrito se location.workspace_id NOT NULL; fallback org=tenant só se location.workspace_id NULL. Legado: org da location = occurrence.organization_id.';

drop trigger if exists validate_occurrence_location_org_workspace on public.occurrences;
create trigger validate_occurrence_location_org_workspace
  before insert or update of area_id, unit_id, management_department_id, organization_id, workspace_id
  on public.occurrences
  for each row execute function public.validate_occurrence_location_org_workspace();


-- ============================================================================
-- 4. list_operational_occurrences (visível na org atuante quando WS NOT NULL)
-- ============================================================================

create or replace function public.list_operational_occurrences(
  p_organization_id uuid,
  p_search text default null,
  p_area_id uuid default null,
  p_contractor_organization_id uuid default null,
  p_status text[] default null,
  p_severity text[] default null,
  p_ims_reference_code text default null,
  p_cursor jsonb default null,
  p_limit integer default 20,
  p_workspace_id uuid default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_limit integer;
  v_fetch_limit integer;
  v_search text;
  v_search_pattern text;
  v_ims text;
  v_ims_pattern text;
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

  if not public.is_platform_admin()
     and not public.has_permission('occurrence.read', p_organization_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Gate 13C.1: contexto Workspace (quando solicitado).
  -- can_access_workspace já inclui bypass is_platform_admin().
  if p_workspace_id is not null then
    if not public.can_access_workspace(p_workspace_id) then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;

    if not exists (
      select 1
      from public.organization_workspace_links owl
      where owl.organization_id = p_organization_id
        and owl.workspace_id = p_workspace_id
        and owl.is_active = true
    ) then
      raise exception
        'VALIDATION_ERROR: organization_id não possui link ativo com workspace_id'
        using errcode = '22023';
    end if;
  end if;

  if p_status is not null and array_length(p_status, 1) is not null then
    if exists (
      select 1
      from unnest(p_status) as s(val)
      where s.val not in (
        'PARALISACAO_PREVENTIVA',
        'EM_AVALIACAO',
        'VER_E_AGIR',
        'INTERDICAO_CONFIRMADA',
        'MDHO_EM_PREENCHIMENTO',
        'AGUARDANDO_APROVACAO_HSE',
        'AGUARDANDO_REGISTRO_IMS',
        'EM_TRATATIVA',
        'AGUARDANDO_VALIDACAO',
        'LIBERADA',
        'ENCERRADA',
        'CANCELADA'
      )
    ) then
      raise exception 'VALIDATION_ERROR: p_status contém valor inválido' using errcode = '22023';
    end if;
  end if;

  if p_severity is not null and array_length(p_severity, 1) is not null then
    if exists (
      select 1
      from unnest(p_severity) as s(val)
      where s.val not in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ) then
      raise exception 'VALIDATION_ERROR: p_severity contém valor inválido' using errcode = '22023';
    end if;
  end if;

  v_limit := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_fetch_limit := v_limit + 1;

  v_search := nullif(btrim(coalesce(p_search, '')), '');
  if v_search is not null then
    v_search_pattern :=
      '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  v_ims := nullif(btrim(coalesce(p_ims_reference_code, '')), '');
  if v_ims is not null then
    v_ims_pattern :=
      '%' || replace(replace(replace(v_ims, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  if p_cursor is not null and p_cursor <> 'null'::jsonb then
    v_cursor_sort_value := p_cursor ->> 'sortValue';
    v_cursor_id := nullif(p_cursor ->> 'id', '')::uuid;
  end if;

  with base as (
    select
      o.id,
      o.public_code,
      o.title,
      o.status,
      o.severity,
      ar.name as area_name,
      public.resolve_organization_display_name(o.contractor_organization_id)
        as contractor_organization_name,
      o.created_at,
      public.resolve_profile_display_name(o.created_by) as created_by_name,
      to_char(o.created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US') as sort_value
    from public.occurrences o
    left join public.areas ar on ar.id = o.area_id
    where (
        p_workspace_id is null and o.organization_id = p_organization_id
        or p_workspace_id is not null and (
          o.organization_id = p_organization_id
          or o.origin_organization_id = p_organization_id
          or o.contractor_organization_id = p_organization_id
        )
      )
      and public.can_access_occurrence(o.id)
      -- Gate 13C.1: filtro de contexto Workspace ANTES do keyset/LIMIT.
      -- NOT NULL ⇒ somente o Workspace solicitado (não inclui legado NULL).
      and (p_workspace_id is null or o.workspace_id = p_workspace_id)
      and (p_area_id is null or o.area_id = p_area_id)
      and (
        p_contractor_organization_id is null
        or o.contractor_organization_id = p_contractor_organization_id
      )
      and (p_status is null or array_length(p_status, 1) is null or o.status = any (p_status))
      and (
        p_severity is null
        or array_length(p_severity, 1) is null
        or o.severity = any (p_severity)
      )
      and (
        v_ims is null
        or o.ims_reference_code ilike v_ims_pattern escape '\'
      )
      and (
        v_search is null
        or o.public_code ilike v_search_pattern escape '\'
        or o.task_description ilike v_search_pattern escape '\'
        or o.location_description ilike v_search_pattern escape '\'
        or o.ims_reference_code ilike v_search_pattern escape '\'
        or ar.name ilike v_search_pattern escape '\'
        or public.resolve_organization_display_name(o.contractor_organization_id)
             ilike v_search_pattern escape '\'
      )
  ),
  filtered as (
    select b.*
    from base b
    where v_cursor_sort_value is null
       or (b.sort_value, b.id) < (v_cursor_sort_value, v_cursor_id)
  ),
  numbered as (
    select
      f.*,
      row_number() over (order by f.sort_value desc, f.id desc) as row_num
    from filtered f
  )
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', n.id,
            'publicCode', n.public_code,
            'title', n.title,
            'status', n.status,
            'severity', n.severity,
            'areaName', n.area_name,
            'contractorOrganizationName', n.contractor_organization_name,
            'createdAt', n.created_at,
            'createdByName', n.created_by_name
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

comment on function public.list_operational_occurrences(
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer, uuid
) is
  'Lista operacional (Gate 13X.2.1). p_workspace_id NULL = legado org-scoped (organization_id = p_organization_id). NOT NULL = visibilidade na org atuante (tenant OR origin OR contractor) + workspace_id. Gates 13C.1 preservados.';

grant execute on function public.list_operational_occurrences(
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer, uuid
) to authenticated;

revoke all on function public.list_operational_occurrences(
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer, uuid
) from public;


-- ============================================================================
-- 5. create_occurrence: remove reject extra de area vs tenant no dual-read WS
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
  'Cria PP. Gate 13X.2.1: mesmos dois caminhos. Dual-read WS-estrito não exige area.organization_id = tenant. SECURITY DEFINER; search_path vazio.';
