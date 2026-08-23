-- ============================================================================
-- SafeStop — Sprint 3.3: RPC list_occurrences_report
-- ============================================================================
-- Referência: docs/decisions/REPORTS-DECISIONS.md (PO-REP-3, matriz de colunas)
-- SECURITY INVOKER — RLS existente de occurrences (occurrence.read +
-- can_access_occurrence) já cobre o escopo de leitura da ocorrência.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Achado técnico (mesma disciplina de DASHBOARD-DECISIONS.md): a matriz de
-- colunas PO-REP-3 exige nome de pessoa (created_by, assigned_evaluator_id) e
-- nome da organização contratada (contractor_organization_id, muitas vezes
-- fora da organização do usuário). Sob SECURITY INVOKER, esses joins ficam
-- sujeitos à RLS própria de `profiles` (profiles_select restringe a
-- id = auth.uid()) e de `organizations` (organizations_select restringe a
-- id in current_organization_ids()) — ambos retornariam NULL para nomes de
-- terceiros/organizações fora do vínculo do usuário, mesmo quando a própria
-- ocorrência é legitimamente visível via can_access_occurrence(). Mesma causa
-- raiz do achado técnico que exigiu SECURITY DEFINER em pendingAwarenessOrg
-- (get_dashboard_kpis), mas aqui resolvida de forma mínima: dois helpers
-- SECURITY DEFINER reaproveitáveis, escopo estrito (somente nome de
-- exibição, sem e-mail/telefone/documento), sem alterar RLS de
-- profiles/organizations e sem tornar a RPC inteira SECURITY DEFINER.
-- ----------------------------------------------------------------------------

create function public.resolve_profile_display_name(p_profile_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name
  from public.profiles p
  where p.id = p_profile_id;
$$;

comment on function public.resolve_profile_display_name(uuid) is
  'Nome de exibição de um profile para uso em relatórios (Sprint 3.3). Escopo estrito: full_name apenas, sem e-mail/telefone (docs/database.md §5.2).';

create function public.resolve_organization_display_name(p_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select o.name
  from public.organizations o
  where o.id = p_organization_id;
$$;

comment on function public.resolve_organization_display_name(uuid) is
  'Nome de exibição de uma organização (ex.: contratada cross-tenant) para uso em relatórios (Sprint 3.3). Escopo estrito: name apenas.';

create function public.resolve_member_display_name(p_organization_member_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name
  from public.organization_members om
  join public.profiles p on p.id = om.profile_id
  where om.id = p_organization_member_id;
$$;

comment on function public.resolve_member_display_name(uuid) is
  'Nome de exibição do profile associado a um organization_member, para relatórios (Sprint 3.3 — Plano de Ação/Ciência).';

grant execute on function public.resolve_profile_display_name(uuid) to authenticated;
grant execute on function public.resolve_organization_display_name(uuid) to authenticated;
grant execute on function public.resolve_member_display_name(uuid) to authenticated;


-- ============================================================================
-- list_occurrences_report
-- ============================================================================
-- Paginação: cursor keyset (sortValue + id), não offset — evita "page drift"
-- quando novas ocorrências são criadas durante a navegação (relatório
-- operacional consultado ao vivo). nextCursor é o par (sortValue, id) do
-- último item retornado na página atual; a próxima chamada usa comparação de
-- tupla estrita (<, >) para excluir itens já vistos, sem duplicar nem pular
-- linhas mesmo com inserts concorrentes.
create function public.list_occurrences_report(
  p_organization_id uuid,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null,
  p_area_id uuid default null,
  p_contract_id uuid default null,
  p_contractor_organization_id uuid default null,
  p_status text[] default null,
  p_severity text[] default null,
  p_has_ims boolean default null,
  p_search text default null,
  p_sort_field text default 'occurred_at',
  p_sort_direction text default 'desc',
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
  v_sort_field text;
  v_sort_direction text;
  v_limit integer;
  v_fetch_limit integer;
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

  -- Allowlist interna de ordenação — nunca interpolar p_sort_field em SQL.
  v_sort_field := coalesce(p_sort_field, 'occurred_at');
  if v_sort_field not in ('public_code', 'occurred_at', 'status', 'severity', 'area') then
    raise exception 'INVALID_SORT_FIELD' using errcode = '22023';
  end if;

  v_sort_direction := lower(coalesce(p_sort_direction, 'desc'));
  if v_sort_direction not in ('asc', 'desc') then
    raise exception 'INVALID_SORT_DIRECTION' using errcode = '22023';
  end if;

  v_limit := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_fetch_limit := v_limit + 1;

  if p_cursor is not null and p_cursor <> 'null'::jsonb then
    v_cursor_sort_value := p_cursor ->> 'sortValue';
    v_cursor_id := nullif(p_cursor ->> 'id', '')::uuid;
  end if;

  with base as (
    select
      o.id,
      o.public_code,
      o.occurred_at,
      o.area_id,
      ar.name as area_name,
      o.contract_id,
      c.contract_number,
      c.name as contract_name,
      o.contractor_organization_id,
      public.resolve_organization_display_name(o.contractor_organization_id) as contractor_organization_name,
      o.status,
      case o.status
        when 'PARALISACAO_PREVENTIVA' then 'OPEN_EVALUATION'
        when 'EM_AVALIACAO' then 'OPEN_EVALUATION'
        when 'VER_E_AGIR' then 'VER_E_AGIR'
        when 'INTERDICAO_CONFIRMADA' then 'INTERDICTED'
        when 'MDHO_EM_PREENCHIMENTO' then 'INTERDICTED'
        when 'AGUARDANDO_APROVACAO_HSE' then 'INTERDICTED'
        when 'AGUARDANDO_REGISTRO_IMS' then 'INTERDICTED'
        when 'EM_TRATATIVA' then 'IN_TREATMENT'
        when 'AGUARDANDO_VALIDACAO' then 'AWAITING_VALIDATION'
        when 'LIBERADA' then 'COMPLETED'
        when 'ENCERRADA' then 'COMPLETED'
        when 'CANCELADA' then 'CANCELLED'
      end as status_family,
      o.severity,
      o.decision_type,
      o.ims_reference_code,
      o.unit_id,
      u.name as unit_name,
      o.management_department_id,
      md.name as management_department_name,
      o.stopped_at,
      o.evaluated_at,
      o.released_at,
      o.closed_at,
      o.cancelled_at,
      o.cancellation_reason,
      public.resolve_profile_display_name(o.created_by) as created_by_name,
      public.resolve_profile_display_name(o.assigned_evaluator_id) as assigned_evaluator_name,
      case v_sort_field
        when 'public_code' then o.public_code
        when 'status' then o.status
        when 'severity' then o.severity
        when 'area' then coalesce(ar.name, '')
        else to_char(o.occurred_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US')
      end as sort_value
    from public.occurrences o
    left join public.areas ar on ar.id = o.area_id
    left join public.contracts c on c.id = o.contract_id
    left join public.units u on u.id = o.unit_id
    left join public.management_departments md on md.id = o.management_department_id
    where o.organization_id = p_organization_id
      and public.can_access_occurrence(o.id)
      and (p_period_start is null or o.occurred_at >= p_period_start)
      and (p_period_end is null or o.occurred_at <= p_period_end)
      and (p_area_id is null or o.area_id = p_area_id)
      and (p_contract_id is null or o.contract_id = p_contract_id)
      and (p_contractor_organization_id is null or o.contractor_organization_id = p_contractor_organization_id)
      and (p_status is null or array_length(p_status, 1) is null or o.status = any (p_status))
      and (p_severity is null or array_length(p_severity, 1) is null or o.severity = any (p_severity))
      and (
        p_has_ims is null
        or (p_has_ims = true and o.ims_reference_code is not null)
        or (p_has_ims = false and o.ims_reference_code is null)
      )
      and (
        p_search is null
        or btrim(p_search) = ''
        or position(upper(p_search) in upper(o.public_code)) > 0
      )
  ),
  filtered as (
    select b.*
    from base b
    where v_cursor_sort_value is null
       or (v_sort_direction = 'desc' and (b.sort_value, b.id) < (v_cursor_sort_value, v_cursor_id))
       or (v_sort_direction = 'asc' and (b.sort_value, b.id) > (v_cursor_sort_value, v_cursor_id))
  ),
  numbered as (
    select
      f.*,
      row_number() over (
        order by
          (case when v_sort_direction = 'asc' then f.sort_value end) asc,
          (case when v_sort_direction = 'desc' then f.sort_value end) desc,
          (case when v_sort_direction = 'asc' then f.id end) asc,
          (case when v_sort_direction = 'desc' then f.id end) desc
      ) as row_num
    from filtered f
  )
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', n.id,
            'publicCode', n.public_code,
            'occurredAt', n.occurred_at,
            'areaId', n.area_id,
            'areaName', n.area_name,
            'contractId', n.contract_id,
            'contractNumber', n.contract_number,
            'contractName', n.contract_name,
            'contractorOrganizationId', n.contractor_organization_id,
            'contractorOrganizationName', n.contractor_organization_name,
            'status', n.status,
            'statusFamily', n.status_family,
            'severity', n.severity,
            'decisionType', n.decision_type,
            'imsReferenceCode', n.ims_reference_code,
            'unitId', n.unit_id,
            'unitName', n.unit_name,
            'managementDepartmentId', n.management_department_id,
            'managementDepartmentName', n.management_department_name,
            'stoppedAt', n.stopped_at,
            'evaluatedAt', n.evaluated_at,
            'releasedAt', n.released_at,
            'closedAt', n.closed_at,
            'cancelledAt', n.cancelled_at,
            'cancellationReason', n.cancellation_reason,
            'createdByName', n.created_by_name,
            'assignedEvaluatorName', n.assigned_evaluator_name
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

comment on function public.list_occurrences_report(
  uuid, timestamptz, timestamptz, uuid, uuid, uuid, text[], text[], boolean, text, text, text, jsonb, integer
) is
  'Relatório de Ocorrências (Sprint 3.3, PO-REP-3). SECURITY INVOKER — RLS de occurrences cobre occurrence.read + can_access_occurrence. 19 campos da matriz de colunas, sem multiplicar linhas por action_items/participants/notifications.';

grant execute on function public.list_occurrences_report(
  uuid, timestamptz, timestamptz, uuid, uuid, uuid, text[], text[], boolean, text, text, text, jsonb, integer
) to authenticated;
