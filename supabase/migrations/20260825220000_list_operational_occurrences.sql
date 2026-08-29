-- ============================================================================
-- SafeStop — PR-D1 / D1.1: RPC list_operational_occurrences
-- ============================================================================
-- Referência: docs/ux/UX-CONVERGENCE-EXECUTION-PLAN.md §§6.1–6.6 e 20.1
--             (PO-UX-10 — busca/filtros no servidor, sem filtro falso no cliente)
--
-- SECURITY INVOKER — RLS de occurrences (occurrence.read + can_access_occurrence)
-- já restringe as linhas. Nomes de terceiros/contratada usam helpers DEFINER
-- existentes (resolve_profile_display_name, resolve_organization_display_name)
-- sem recriar e sem ampliar PII.
--
-- NÃO exigir report.read — HSE de Campo lista PP e não possui essa permissão.
-- NÃO alterar list_occurrences_report.
--
-- Rollback:
--   drop function public.list_operational_occurrences(
--     uuid, text, uuid, uuid, text[], text[], text, jsonb, integer
--   );
-- Não dropar helpers de relatório (resolve_*_display_name).
-- ============================================================================

create function public.list_operational_occurrences(
  p_organization_id uuid,
  p_search text default null,
  p_area_id uuid default null,
  p_contractor_organization_id uuid default null,
  p_status text[] default null,
  p_severity text[] default null,
  p_ims_reference_code text default null,
  p_cursor jsonb default null,
  p_limit integer default 20
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

  -- Mesmo padrão de membership da RPC de reports (is_platform_admin OR
  -- has_permission na org alvo). Sem bypass extra de RLS: INVOKER +
  -- can_access_occurrence. Permissão operacional: occurrence.read, NÃO report.read.
  if not public.is_platform_admin()
     and not public.has_permission('occurrence.read', p_organization_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
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
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer
) is
  'Lista operacional de Paralisações Preventivas (PR-D1 / PO-UX-10). SECURITY INVOKER. Gate SQL: occurrence.read (NÃO report.read). Paginação keyset created_at desc + id desc. Busca textual contains em public_code, task_description, location_description, ims_reference_code, areas.name e nome da contratada (helper). Diferente de list_occurrences_report (persona de relatório, gate report.read, 19 colunas, p_search só public_code). Rollback: DROP FUNCTION public.list_operational_occurrences(uuid, text, uuid, uuid, text[], text[], text, jsonb, integer).';

grant execute on function public.list_operational_occurrences(
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer
) to authenticated;

revoke all on function public.list_operational_occurrences(
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer
) from public;
