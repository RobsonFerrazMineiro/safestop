-- ============================================================================
-- SafeStop — Fase 3 / Gate 13C.1: p_workspace_id em list_operational_occurrences
-- ============================================================================
-- Escopo EXTREMAMENTE ESTREITO:
--   Adiciona p_workspace_id uuid DEFAULT NULL (ao final da assinatura).
--   Filtro Workspace na CTE base ANTES de keyset/LIMIT/hasNext/nextCursor.
--
-- Segurança × contexto:
--   can_access_occurrence / RLS / RBAC = autorização
--   p_workspace_id = contexto operacional solicitado (quando NOT NULL)
--
-- NULL / omitido = comportamento legado Organization-scoped (compat Web pré-13C.2,
--   Mobile e demais callers). Consumo Web do parâmetro = Gate 13C.2.
--
-- Não altera Web/Mobile/Dashboard/Reports. Sem Offline. Sem backfill. Sem NOT NULL.
-- ============================================================================

drop function if exists public.list_operational_occurrences(
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer
);

create function public.list_operational_occurrences(
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
    where o.organization_id = p_organization_id
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
  'Lista operacional de PP (PR-D1 / Gate 13C.1). SECURITY INVOKER. Gate: occurrence.read. p_workspace_id DEFAULT NULL: omitido/NULL = legado Organization-scoped autorizado (A+B+legado); NOT NULL = contexto estrito do Workspace (filtro na CTE base antes do keyset; exige can_access_workspace + link ativo org↔ws; não inclui workspace_id NULL). can_access_occurrence permanece barreira de autorização. Consumo Web do parâmetro = Gate 13C.2.';

grant execute on function public.list_operational_occurrences(
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer, uuid
) to authenticated;

revoke all on function public.list_operational_occurrences(
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer, uuid
) from public;
