-- ============================================================================
-- SafeStop — Sprint 2.6: MDHO RPCs + timeline patch
-- ============================================================================
-- Referências: docs/decisions/MDHO-DECISIONS.md; docs/api.md § MDHO RPCs
-- ============================================================================

-- ============================================================================
-- 1. RPC start_mdho_assessment
-- ============================================================================

create function public.start_mdho_assessment(p_occurrence_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_organization_id uuid;
  v_status text;
  v_decision_type text;
  v_assessment_id uuid;
  v_transitioned_at timestamptz;
  v_existing_assessment_id uuid;
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

  if p_occurrence_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'p_occurrence_id é obrigatório.'
      )
    );
  end if;

  select o.organization_id, o.status, o.decision_type
    into v_organization_id, v_status, v_decision_type
  from public.occurrences o
  where o.id = p_occurrence_id;

  if v_organization_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Ocorrência não encontrada.'
      )
    );
  end if;

  if not (v_organization_id in (select public.current_organization_ids())) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem vínculo ativo na organização da ocorrência.'
      )
    );
  end if;

  if not public.can_access_occurrence(p_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  if not public.has_permission('mdho.fill', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão mdho.fill.'
      )
    );
  end if;

  if v_decision_type is distinct from 'INTERDICAO_OFICIAL' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'MDHO não aplicável ao ramo Ver e Agir.'
      )
    );
  end if;

  select a.id
    into v_existing_assessment_id
  from public.mdho_assessments a
  where a.occurrence_id = p_occurrence_id;

  if v_existing_assessment_id is not null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'ALREADY_EXISTS',
        'message', 'Esta ocorrência já possui avaliação MDHO.',
        'assessmentId', v_existing_assessment_id
      )
    );
  end if;

  if v_status <> 'INTERDICAO_CONFIRMADA' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'MDHO só pode ser iniciado com ocorrência em INTERDICAO_CONFIRMADA.',
        'currentStatus', v_status
      )
    );
  end if;

  insert into public.mdho_assessments (
    occurrence_id,
    organization_id,
    status
  )
  values (
    p_occurrence_id,
    v_organization_id,
    'DRAFT'
  )
  returning id into v_assessment_id;

  update public.occurrences
  set
    status = 'MDHO_EM_PREENCHIMENTO',
    updated_at = now()
  where id = p_occurrence_id
    and status = 'INTERDICAO_CONFIRMADA';

  if not found then
    delete from public.mdho_assessments where id = v_assessment_id;

    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao iniciar MDHO — status da ocorrência alterado.'
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
    p_occurrence_id,
    'INTERDICAO_CONFIRMADA',
    'MDHO_EM_PREENCHIMENTO',
    jsonb_build_object(
      'action', 'start_mdho',
      'assessment_id', v_assessment_id
    ),
    v_user_id
  )
  returning changed_at into v_transitioned_at;

  -- notification dispatch Sprint 3 (sem implementar)

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'assessment', jsonb_build_object(
        'id', v_assessment_id,
        'occurrence_id', p_occurrence_id,
        'status', 'DRAFT',
        'created_at', v_transitioned_at
      ),
      'occurrence', jsonb_build_object(
        'id', p_occurrence_id,
        'status', 'MDHO_EM_PREENCHIMENTO'
      )
    )
  );
end;
$$;

comment on function public.start_mdho_assessment(uuid) is
  'INTERDICAO_CONFIRMADA → MDHO_EM_PREENCHIMENTO; INSERT assessment DRAFT (Sprint 2.6).';


-- ============================================================================
-- 2. RPC save_mdho_draft
-- ============================================================================

create function public.save_mdho_draft(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_assessment_id uuid;
  v_organization_id uuid;
  v_occurrence_id uuid;
  v_assessment_status text;
  v_occurrence_status text;
  v_expected_updated_at timestamptz;
  v_assessment_updated_at timestamptz;
  v_complement text;
  v_selection jsonb;
  v_category_id uuid;
  v_option_id uuid;
  v_detail text;
  v_allows_multiple boolean;
  v_category_counts jsonb := '{}'::jsonb;
  v_category_key text;
  v_current_count integer;
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

  if p_payload is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Payload é obrigatório.'
      )
    );
  end if;

  v_assessment_id := nullif(btrim(p_payload ->> 'assessment_id'), '')::uuid;
  v_complement := nullif(btrim(p_payload ->> 'complement'), '');
  v_expected_updated_at := nullif(btrim(p_payload ->> 'expected_updated_at'), '')::timestamptz;

  if v_assessment_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'assessment_id é obrigatório.'
      )
    );
  end if;

  if v_complement is not null and char_length(v_complement) > 4000 then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'complement deve ter no máximo 4000 caracteres.'
      )
    );
  end if;

  select
    a.organization_id,
    a.occurrence_id,
    a.status,
    o.status,
    a.updated_at
  into
    v_organization_id,
    v_occurrence_id,
    v_assessment_status,
    v_occurrence_status,
    v_assessment_updated_at
  from public.mdho_assessments a
  join public.occurrences o on o.id = a.occurrence_id
  where a.id = v_assessment_id;

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

  if not public.has_permission('mdho.fill', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão mdho.fill.'
      )
    );
  end if;

  if v_assessment_status not in ('DRAFT', 'RETURNED') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Rascunho só pode ser salvo com assessment DRAFT ou RETURNED.',
        'currentStatus', v_assessment_status
      )
    );
  end if;

  if v_occurrence_status <> 'MDHO_EM_PREENCHIMENTO' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Ocorrência deve estar em MDHO_EM_PREENCHIMENTO.',
        'currentStatus', v_occurrence_status
      )
    );
  end if;

  if p_payload ? 'expected_updated_at' and v_expected_updated_at is not null then
    if v_assessment_updated_at is distinct from v_expected_updated_at then
      return jsonb_build_object(
        'success', false,
        'error', jsonb_build_object(
          'code', 'CONFLICT',
          'message', 'Avaliação MDHO foi alterada por outra sessão.'
        )
      );
    end if;
  end if;

  if jsonb_typeof(p_payload -> 'selections') = 'array' then
    for v_selection in
      select value
      from jsonb_array_elements(p_payload -> 'selections')
    loop
      v_category_id := nullif(btrim(v_selection ->> 'category_id'), '')::uuid;
      v_option_id := nullif(btrim(v_selection ->> 'option_id'), '')::uuid;
      v_detail := nullif(btrim(v_selection ->> 'detail'), '');

      if v_category_id is null or v_option_id is null then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'Cada seleção exige category_id e option_id.'
          )
        );
      end if;

      if not exists (
        select 1
        from public.mdho_options mo
        join public.mdho_categories mc on mc.id = mo.category_id
        where mo.id = v_option_id
          and mo.category_id = v_category_id
          and mo.is_active = true
          and mc.is_active = true
          and (mo.organization_id is null or mo.organization_id = v_organization_id)
          and (mc.organization_id is null or mc.organization_id = v_organization_id)
      ) then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'Seleção inválida: opção ou categoria inexistente/inativa.'
          )
        );
      end if;

      select mc.allows_multiple
        into v_allows_multiple
      from public.mdho_categories mc
      where mc.id = v_category_id;

      v_category_key := v_category_id::text;
      v_current_count := coalesce((v_category_counts ->> v_category_key)::integer, 0) + 1;
      v_category_counts := v_category_counts || jsonb_build_object(v_category_key, v_current_count);

      if not v_allows_multiple and v_current_count > 1 then
        return jsonb_build_object(
          'success', false,
          'error', jsonb_build_object(
            'code', 'VALIDATION_ERROR',
            'message', 'Categoria não permite múltiplas seleções.'
          )
        );
      end if;
    end loop;

    delete from public.mdho_selections s
    where s.assessment_id = v_assessment_id;

    for v_selection in
      select value
      from jsonb_array_elements(p_payload -> 'selections')
    loop
      v_category_id := nullif(btrim(v_selection ->> 'category_id'), '')::uuid;
      v_option_id := nullif(btrim(v_selection ->> 'option_id'), '')::uuid;
      v_detail := nullif(btrim(v_selection ->> 'detail'), '');

      insert into public.mdho_selections (
        assessment_id,
        category_id,
        option_id,
        detail,
        created_by
      )
      values (
        v_assessment_id,
        v_category_id,
        v_option_id,
        v_detail,
        v_user_id
      );
    end loop;
  end if;

  update public.mdho_assessments
  set complement = v_complement
  where id = v_assessment_id;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'assessment_id', v_assessment_id,
      'status', v_assessment_status,
      'updated_at', (select a.updated_at from public.mdho_assessments a where a.id = v_assessment_id)
    )
  );
end;
$$;

comment on function public.save_mdho_draft(jsonb) is
  'Persiste rascunho MDHO (selections + complement). Sem evento timeline (PO-MDHO-10).';


-- ============================================================================
-- 3. RPC submit_mdho_assessment
-- ============================================================================

create function public.submit_mdho_assessment(p_assessment_id uuid)
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
  v_transitioned_at timestamptz;
  v_missing_category text;
  v_deviation_count integer;
  v_invalid_other_count integer;
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
    o.status
  into
    v_organization_id,
    v_occurrence_id,
    v_assessment_status,
    v_occurrence_status
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

  if not public.has_permission('mdho.submit', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão mdho.submit.'
      )
    );
  end if;

  if v_assessment_status = 'SUBMITTED' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'ALREADY_SUBMITTED',
        'message', 'Avaliação MDHO já foi enviada.'
      )
    );
  end if;

  if v_assessment_status not in ('DRAFT', 'RETURNED') then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Envio só permitido com assessment DRAFT ou RETURNED.',
        'currentStatus', v_assessment_status
      )
    );
  end if;

  if v_occurrence_status <> 'MDHO_EM_PREENCHIMENTO' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Ocorrência deve estar em MDHO_EM_PREENCHIMENTO.',
        'currentStatus', v_occurrence_status
      )
    );
  end if;

  select mc.name
    into v_missing_category
  from public.mdho_categories mc
  where mc.is_active = true
    and mc.requires_selection = true
    and (mc.organization_id is null or mc.organization_id = v_organization_id)
    and not exists (
      select 1
      from public.mdho_selections s
      where s.assessment_id = p_assessment_id
        and s.category_id = mc.id
    )
  order by mc.display_order
  limit 1;

  if v_missing_category is not null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Seleção obrigatória ausente na categoria: ' || v_missing_category || '.'
      )
    );
  end if;

  select count(*)
    into v_deviation_count
  from public.mdho_selections s
  join public.mdho_categories mc on mc.id = s.category_id
  where s.assessment_id = p_assessment_id
    and mc.code = 'DEVIATION_TYPE';

  if v_deviation_count <> 1 then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Tipo de Desvio exige exatamente uma opção selecionada.'
      )
    );
  end if;

  select count(*)
    into v_invalid_other_count
  from public.mdho_selections s
  join public.mdho_options mo on mo.id = s.option_id
  where s.assessment_id = p_assessment_id
    and mo.code = 'OTHER'
    and mo.allows_detail = true
    and (s.detail is null or char_length(btrim(s.detail)) < 10);

  if v_invalid_other_count > 0 then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Opção Outro exige detalhamento com no mínimo 10 caracteres.'
      )
    );
  end if;

  update public.mdho_assessments
  set
    status = 'SUBMITTED',
    submitted_at = now(),
    submitted_by = v_user_id
  where id = p_assessment_id
    and status in ('DRAFT', 'RETURNED');

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao enviar avaliação MDHO.'
      )
    );
  end if;

  update public.occurrences
  set
    status = 'AGUARDANDO_APROVACAO_HSE',
    updated_at = now()
  where id = v_occurrence_id
    and status = 'MDHO_EM_PREENCHIMENTO';

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
    'MDHO_EM_PREENCHIMENTO',
    'AGUARDANDO_APROVACAO_HSE',
    jsonb_build_object(
      'action', 'submit_mdho',
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
        'status', 'SUBMITTED',
        'submitted_at', v_transitioned_at,
        'submitted_by', v_user_id
      ),
      'occurrence', jsonb_build_object(
        'id', v_occurrence_id,
        'status', 'AGUARDANDO_APROVACAO_HSE'
      )
    )
  );
end;
$$;

comment on function public.submit_mdho_assessment(uuid) is
  'MDHO_EM_PREENCHIMENTO → AGUARDANDO_APROVACAO_HSE; assessment SUBMITTED (PO-MDHO-14).';


-- ============================================================================
-- 4. RPC approve_mdho_assessment
-- ============================================================================

create function public.approve_mdho_assessment(p_assessment_id uuid)
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
    o.status
  into
    v_organization_id,
    v_occurrence_id,
    v_assessment_status,
    v_occurrence_status
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
  'AGUARDANDO_APROVACAO_HSE → AGUARDANDO_REGISTRO_IMS; assessment APPROVED (Sprint 2.6).';


-- ============================================================================
-- 5. RPC return_mdho_assessment
-- ============================================================================

create function public.return_mdho_assessment(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_assessment_id uuid;
  v_return_reason text;
  v_organization_id uuid;
  v_occurrence_id uuid;
  v_assessment_status text;
  v_occurrence_status text;
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

  if p_payload is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Payload é obrigatório.'
      )
    );
  end if;

  v_assessment_id := nullif(btrim(p_payload ->> 'assessment_id'), '')::uuid;
  v_return_reason := nullif(btrim(p_payload ->> 'return_reason'), '');

  if v_assessment_id is null or v_return_reason is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Campos obrigatórios: assessment_id, return_reason.'
      )
    );
  end if;

  if char_length(v_return_reason) < 10 or char_length(v_return_reason) > 4000 then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'return_reason deve ter entre 10 e 4000 caracteres.'
      )
    );
  end if;

  select
    a.organization_id,
    a.occurrence_id,
    a.status,
    o.status
  into
    v_organization_id,
    v_occurrence_id,
    v_assessment_status,
    v_occurrence_status
  from public.mdho_assessments a
  join public.occurrences o on o.id = a.occurrence_id
  where a.id = v_assessment_id;

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

  if not public.has_permission('mdho.return', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão mdho.return.'
      )
    );
  end if;

  if v_assessment_status <> 'SUBMITTED' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Devolução só permitida com assessment SUBMITTED.',
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
    status = 'RETURNED',
    returned_at = now(),
    returned_by = v_user_id,
    return_reason = v_return_reason
  where id = v_assessment_id
    and status = 'SUBMITTED';

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao devolver avaliação MDHO.'
      )
    );
  end if;

  update public.occurrences
  set
    status = 'MDHO_EM_PREENCHIMENTO',
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
    reason,
    metadata,
    changed_by
  )
  values (
    v_occurrence_id,
    'AGUARDANDO_APROVACAO_HSE',
    'MDHO_EM_PREENCHIMENTO',
    left(v_return_reason, 500),
    jsonb_build_object(
      'action', 'return_mdho',
      'assessment_id', v_assessment_id,
      'return_reason', left(v_return_reason, 200)
    ),
    v_user_id
  )
  returning changed_at into v_transitioned_at;

  -- notification dispatch Sprint 3 (sem implementar)

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'assessment', jsonb_build_object(
        'id', v_assessment_id,
        'status', 'RETURNED',
        'returned_at', v_transitioned_at,
        'returned_by', v_user_id,
        'return_reason', v_return_reason
      ),
      'occurrence', jsonb_build_object(
        'id', v_occurrence_id,
        'status', 'MDHO_EM_PREENCHIMENTO'
      )
    )
  );
end;
$$;

comment on function public.return_mdho_assessment(jsonb) is
  'AGUARDANDO_APROVACAO_HSE → MDHO_EM_PREENCHIMENTO; assessment RETURNED (Sprint 2.6).';


-- ============================================================================
-- 6. Grants
-- ============================================================================

grant execute on function public.start_mdho_assessment(uuid) to authenticated;
grant execute on function public.save_mdho_draft(jsonb) to authenticated;
grant execute on function public.submit_mdho_assessment(uuid) to authenticated;
grant execute on function public.approve_mdho_assessment(uuid) to authenticated;
grant execute on function public.return_mdho_assessment(jsonb) to authenticated;


-- ============================================================================
-- 7. Patch get_occurrence_timeline — títulos PO-MDHO-26
-- ============================================================================

create or replace function public.get_occurrence_timeline(
  p_occurrence_id uuid,
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
  v_organization_id uuid;
  v_limit integer;
  v_fetch_limit integer;
  v_cursor_occurred_at timestamptz;
  v_cursor_id uuid;
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

  if p_occurrence_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'p_occurrence_id é obrigatório.'
      )
    );
  end if;

  select o.organization_id
    into v_organization_id
  from public.occurrences o
  where o.id = p_occurrence_id;

  if v_organization_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Ocorrência não encontrada.'
      )
    );
  end if;

  if not public.can_read_occurrence_in_org(v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.read.'
      )
    );
  end if;

  if not public.can_access_occurrence(p_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  v_limit := least(greatest(coalesce(p_limit, 30), 1), 100);
  v_fetch_limit := v_limit + 1;

  if p_cursor is not null and p_cursor <> 'null'::jsonb then
    v_cursor_occurred_at := nullif(p_cursor ->> 'occurred_at', '')::timestamptz;
    v_cursor_id := nullif(p_cursor ->> 'id', '')::uuid;
  end if;

  with timeline_source as (
    select
      h.id as source_id,
      case
        when h.from_status is null then 'OCCURRENCE_CREATED'
        else 'STATUS_CHANGED'
      end as kind,
      h.changed_at as occurred_at,
      h.changed_by as actor_id,
      case
        when h.from_status is null then 'Paralisação Preventiva registrada'
        when h.from_status = 'PARALISACAO_PREVENTIVA' and h.to_status = 'EM_AVALIACAO'
          then 'Avaliação iniciada'
        when h.from_status = 'EM_AVALIACAO' and h.to_status = 'VER_E_AGIR'
          then 'Decisão: Ver e Agir'
        when h.from_status = 'EM_AVALIACAO' and h.to_status = 'INTERDICAO_CONFIRMADA'
          then 'Interdição Oficial confirmada'
        when h.from_status = 'INTERDICAO_CONFIRMADA' and h.to_status = 'MDHO_EM_PREENCHIMENTO'
          then 'MDHO iniciado'
        when h.from_status = 'MDHO_EM_PREENCHIMENTO' and h.to_status = 'AGUARDANDO_APROVACAO_HSE'
          then 'MDHO enviado'
        when h.from_status = 'AGUARDANDO_APROVACAO_HSE' and h.to_status = 'AGUARDANDO_REGISTRO_IMS'
          then 'MDHO aprovado'
        when h.from_status = 'AGUARDANDO_APROVACAO_HSE' and h.to_status = 'MDHO_EM_PREENCHIMENTO'
          then 'MDHO devolvido'
        else 'Alterado para ' || public.format_occurrence_status_label(h.to_status)
      end as title,
      nullif(btrim(h.reason), '') as body,
      case
        when h.from_status is null then jsonb_build_object(
          'toStatus', h.to_status,
          'historyId', h.id
        )
        when h.from_status = 'PARALISACAO_PREVENTIVA' and h.to_status = 'EM_AVALIACAO' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'start_evaluation'),
          'evaluatorName', pr_eval.full_name
        )
        when h.from_status = 'EM_AVALIACAO' and h.to_status = 'VER_E_AGIR' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'decisionType', coalesce(od.decision_type, h.metadata ->> 'decision_type'),
          'decisionReason', left(coalesce(od.decision_reason, h.reason), 200),
          'decisionId', od.id,
          'evaluatorName', pr_eval.full_name
        )
        when h.from_status = 'EM_AVALIACAO' and h.to_status = 'INTERDICAO_CONFIRMADA' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'decisionType', coalesce(od.decision_type, h.metadata ->> 'decision_type'),
          'decisionReason', left(coalesce(od.decision_reason, h.reason), 200),
          'decisionId', od.id,
          'decidedByName', pr_eval.full_name
        )
        when h.from_status = 'INTERDICAO_CONFIRMADA' and h.to_status = 'MDHO_EM_PREENCHIMENTO' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'start_mdho'),
          'assessmentId', h.metadata ->> 'assessment_id',
          'actorName', pr_eval.full_name
        )
        when h.from_status = 'MDHO_EM_PREENCHIMENTO' and h.to_status = 'AGUARDANDO_APROVACAO_HSE' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'submit_mdho'),
          'assessmentId', h.metadata ->> 'assessment_id',
          'actorName', pr_eval.full_name
        )
        when h.from_status = 'AGUARDANDO_APROVACAO_HSE' and h.to_status = 'AGUARDANDO_REGISTRO_IMS' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'approve_mdho'),
          'assessmentId', h.metadata ->> 'assessment_id',
          'actorName', pr_eval.full_name
        )
        when h.from_status = 'AGUARDANDO_APROVACAO_HSE' and h.to_status = 'MDHO_EM_PREENCHIMENTO' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'return_mdho'),
          'assessmentId', h.metadata ->> 'assessment_id',
          'returnReason', left(coalesce(h.metadata ->> 'return_reason', h.reason), 200),
          'actorName', pr_eval.full_name
        )
        else jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'fromStatusLabel', public.format_occurrence_status_label(h.from_status),
          'toStatusLabel', public.format_occurrence_status_label(h.to_status),
          'historyId', h.id,
          'reason', h.reason
        )
      end as metadata
    from public.occurrence_status_history h
    left join public.occurrence_decisions od
      on od.id = nullif(h.metadata ->> 'decision_id', '')::uuid
    left join public.profiles pr_eval on pr_eval.id = h.changed_by
    where h.occurrence_id = p_occurrence_id
      and (
        h.from_status is not null
        or h.id = (
          select h2.id
          from public.occurrence_status_history h2
          where h2.occurrence_id = p_occurrence_id
            and h2.from_status is null
          order by h2.changed_at asc, h2.id asc
          limit 1
        )
      )

    union all

    select
      c.id,
      'COMMENT_ADDED',
      c.created_at,
      c.author_id,
      'Comentário adicionado',
      c.content,
      jsonb_build_object(
        'commentId', c.id,
        'commentType', c.comment_type,
        'isEdited', c.edited_at is not null,
        'isInternal', c.is_internal,
        'editedAt', c.edited_at,
        'editedBy', c.edited_by
      )
    from public.occurrence_comments c
    where c.occurrence_id = p_occurrence_id
      and c.deleted_at is null

    union all

    select
      c.id,
      'COMMENT_REMOVED',
      c.deleted_at,
      coalesce(c.deleted_by, c.author_id),
      'Comentário removido',
      null::text,
      jsonb_build_object(
        'commentId', c.id,
        'commentType', c.comment_type,
        'isRemoved', true,
        'deletedBy', c.deleted_by
      )
    from public.occurrence_comments c
    where c.occurrence_id = p_occurrence_id
      and c.deleted_at is not null

    union all

    select
      a.id,
      'EVIDENCE_ADDED',
      coalesce(a.updated_at, a.created_at),
      a.uploaded_by,
      'Evidência adicionada',
      nullif(btrim(a.caption), ''),
      jsonb_build_object(
        'attachmentId', a.id,
        'attachmentType', a.attachment_type,
        'mimeType', a.mime_type,
        'originalFileName', a.original_file_name,
        'fileSize', a.file_size,
        'caption', a.caption
      )
    from public.occurrence_attachments a
    where a.occurrence_id = p_occurrence_id
      and a.upload_status = 'COMPLETED'
      and a.deleted_at is null

    union all

    select
      a.id,
      'EVIDENCE_REMOVED',
      a.deleted_at,
      coalesce(a.deleted_by, a.uploaded_by),
      'Evidência removida',
      null::text,
      jsonb_build_object(
        'attachmentId', a.id,
        'attachmentType', a.attachment_type,
        'isRemoved', true,
        'deletedBy', a.deleted_by,
        'originalFileName', a.original_file_name
      )
    from public.occurrence_attachments a
    where a.occurrence_id = p_occurrence_id
      and a.deleted_at is not null
  ),
  filtered as (
    select ts.*
    from timeline_source ts
    where v_cursor_occurred_at is null
       or v_cursor_id is null
       or (ts.occurred_at, ts.source_id) < (v_cursor_occurred_at, v_cursor_id)
    order by ts.occurred_at desc, ts.source_id desc
    limit v_fetch_limit
  ),
  numbered as (
    select
      f.*,
      row_number() over (order by f.occurred_at desc, f.source_id desc) as row_num
    from filtered f
  ),
  page_items as (
    select
      jsonb_build_object(
        'id', n.source_id,
        'kind', n.kind,
        'occurredAt', n.occurred_at,
        'actorId', n.actor_id,
        'actorName', pr.full_name,
        'title', n.title,
        'body', n.body,
        'metadata', n.metadata
      ) as item,
      n.row_num,
      n.occurred_at,
      n.source_id
    from numbered n
    left join public.profiles pr on pr.id = n.actor_id
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
        'occurred_at', pi.occurred_at,
        'id', pi.source_id
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

comment on function public.get_occurrence_timeline(uuid, jsonb, integer) is
  'Feed timeline unificado; títulos VA (2.4) + IO (2.5) + MDHO (2.6 PO-MDHO-26).';
