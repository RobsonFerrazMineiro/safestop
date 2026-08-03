-- ============================================================================
-- SafeStop — Sprint 2.7: Aprovação HSE (patch approve + fila pendências)
-- ============================================================================
-- Referências: docs/decisions/HSE-APPROVAL-DECISIONS.md (PO-HSE-7, PO-HSE-12, PO-HSE-15)
-- Sem tabelas novas; incremental sobre 20260805190000_mdho_rpcs.sql
-- ============================================================================

-- ============================================================================
-- 1. Patch approve_mdho_assessment — autoaprovação + idempotência
-- ============================================================================

create or replace function public.approve_mdho_assessment(p_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_organization_id uuid;
  v_occurrence_id uuid;
  v_assessment_status text;
  v_occurrence_status text;
  v_submitted_by uuid;
  v_approved_at timestamptz;
  v_approved_by uuid;
  v_transitioned_at timestamptz;
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

  if p_assessment_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'p_assessment_id é obrigatório.'
      )
    );
  end if;

  select
    a.organization_id,
    a.occurrence_id,
    a.status,
    o.status,
    a.submitted_by,
    a.approved_at,
    a.approved_by
  into
    v_organization_id,
    v_occurrence_id,
    v_assessment_status,
    v_occurrence_status,
    v_submitted_by,
    v_approved_at,
    v_approved_by
  from public.mdho_assessments a
  join public.occurrences o on o.id = a.occurrence_id
  where a.id = p_assessment_id;

  if v_organization_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Avaliação MDHO não encontrada.'
      )
    );
  end if;

  if not (v_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem vínculo ativo na organização.'
      )
    );
  end if;

  if not public.can_access_occurrence(v_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  if not public.has_permission('mdho.approve', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão mdho.approve.'
      )
    );
  end if;

  if v_assessment_status = 'APPROVED' and v_occurrence_status = 'AGUARDANDO_REGISTRO_IMS' then
    return jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'assessment', jsonb_build_object(
          'id', p_assessment_id,
          'status', 'APPROVED',
          'approved_at', v_approved_at,
          'approved_by', v_approved_by
        ),
        'occurrence', jsonb_build_object(
          'id', v_occurrence_id,
          'status', 'AGUARDANDO_REGISTRO_IMS'
        ),
        'idempotent', true
      )
    );
  end if;

  if v_submitted_by = v_user_id then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'SELF_APPROVAL_FORBIDDEN',
        'message', 'Quem enviou o MDHO não pode aprová-lo.'
      )
    );
  end if;

  if v_assessment_status <> 'SUBMITTED' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Aprovação só permitida com assessment SUBMITTED.',
        'currentStatus', v_assessment_status
      )
    );
  end if;

  if v_occurrence_status <> 'AGUARDANDO_APROVACAO_HSE' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Ocorrência deve estar em AGUARDANDO_APROVACAO_HSE.',
        'currentStatus', v_occurrence_status
      )
    );
  end if;

  update public.mdho_assessments
  set
    status = 'APPROVED',
    approved_at = now(),
    approved_by = v_user_id
  where id = p_assessment_id
    and status = 'SUBMITTED';

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao aprovar avaliação MDHO.'
      )
    );
  end if;

  update public.occurrences
  set
    status = 'AGUARDANDO_REGISTRO_IMS',
    updated_at = now()
  where id = v_occurrence_id
    and status = 'AGUARDANDO_APROVACAO_HSE';

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao atualizar status da ocorrência.'
      )
    );
  end if;

  insert into public.occurrence_status_history (
    occurrence_id,
    from_status,
    to_status,
    metadata,
    changed_by
  )
  values (
    v_occurrence_id,
    'AGUARDANDO_APROVACAO_HSE',
    'AGUARDANDO_REGISTRO_IMS',
    jsonb_build_object(
      'action', 'approve_mdho',
      'assessment_id', p_assessment_id
    ),
    v_user_id
  )
  returning changed_at into v_transitioned_at;

  -- notification dispatch Sprint 3 (sem implementar)

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'assessment', jsonb_build_object(
        'id', p_assessment_id,
        'status', 'APPROVED',
        'approved_at', v_transitioned_at,
        'approved_by', v_user_id
      ),
      'occurrence', jsonb_build_object(
        'id', v_occurrence_id,
        'status', 'AGUARDANDO_REGISTRO_IMS'
      )
    )
  );
end;
$$;

comment on function public.approve_mdho_assessment(uuid) is
  'Aprovação HSE: guard autoaprovação PO-HSE-7; idempotência PO-HSE-15 (Sprint 2.7).';


-- ============================================================================
-- 2. RPC list_mdho_pending_approvals
-- ============================================================================

create function public.list_mdho_pending_approvals(
  p_organization_id uuid,
  p_cursor jsonb default null,
  p_limit integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_limit integer;
  v_fetch_limit integer;
  v_cursor_submitted_at timestamptz;
  v_cursor_assessment_id uuid;
  v_items jsonb;
  v_next_cursor jsonb;
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

  if p_organization_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'p_organization_id é obrigatório.'
      )
    );
  end if;

  if not (p_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem vínculo ativo na organização.'
      )
    );
  end if;

  if not public.has_permission('mdho.approve', p_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão mdho.approve.'
      )
    );
  end if;

  v_limit := least(greatest(coalesce(p_limit, 30), 1), 100);
  v_fetch_limit := v_limit + 1;

  if p_cursor is not null and p_cursor <> 'null'::jsonb then
    v_cursor_submitted_at := nullif(p_cursor ->> 'submitted_at', '')::timestamptz;
    v_cursor_assessment_id := nullif(p_cursor ->> 'assessment_id', '')::uuid;
  end if;

  with queue_source as (
    select
      a.id as assessment_id,
      a.occurrence_id,
      a.organization_id,
      a.submitted_at,
      a.submitted_by,
      o.public_code,
      o.title,
      o.task_description,
      o.severity,
      ar.name as area_name,
      pr.full_name as submitted_by_name
    from public.mdho_assessments a
    join public.occurrences o on o.id = a.occurrence_id
    left join public.areas ar on ar.id = o.area_id
    left join public.profiles pr on pr.id = a.submitted_by
    where a.organization_id = p_organization_id
      and a.status = 'SUBMITTED'
      and o.status = 'AGUARDANDO_APROVACAO_HSE'
      and public.can_access_occurrence(a.occurrence_id)
  ),
  filtered as (
    select qs.*
    from queue_source qs
    where v_cursor_submitted_at is null
       or v_cursor_assessment_id is null
       or (qs.submitted_at, qs.assessment_id) < (v_cursor_submitted_at, v_cursor_assessment_id)
    order by qs.submitted_at desc, qs.assessment_id desc
    limit v_fetch_limit
  ),
  numbered as (
    select
      f.*,
      row_number() over (order by f.submitted_at desc, f.assessment_id desc) as row_num
    from filtered f
  ),
  page_items as (
    select
      jsonb_build_object(
        'occurrenceId', n.occurrence_id,
        'organizationId', n.organization_id,
        'assessmentId', n.assessment_id,
        'publicCode', n.public_code,
        'title', n.title,
        'submittedAt', n.submitted_at,
        'submittedBy', n.submitted_by,
        'submittedByName', n.submitted_by_name,
        'areaName', n.area_name,
        'taskSummary', n.task_description,
        'criticality', n.severity
      ) as item,
      n.row_num,
      n.submitted_at,
      n.assessment_id
    from numbered n
  )
  select
    coalesce(
      (
        select jsonb_agg(pi.item order by pi.row_num)
        from page_items pi
        where pi.row_num <= v_limit
      ),
      '[]'::jsonb
    ),
    (
      select jsonb_build_object(
        'submitted_at', pi.submitted_at,
        'assessment_id', pi.assessment_id
      )
      from page_items pi
      where pi.row_num = v_limit + 1
    )
  into v_items, v_next_cursor
  from (select 1) as _dummy;

  return jsonb_build_object(
    'success', true,
    'items', coalesce(v_items, '[]'::jsonb),
    'nextCursor', v_next_cursor
  );
end;
$$;

comment on function public.list_mdho_pending_approvals(uuid, jsonb, integer) is
  'Fila operacional MDHO SUBMITTED / AGUARDANDO_APROVACAO_HSE (PO-HSE-12, Sprint 2.7).';


-- ============================================================================
-- 3. Grants
-- ============================================================================

grant execute on function public.list_mdho_pending_approvals(uuid, jsonb, integer) to authenticated;
