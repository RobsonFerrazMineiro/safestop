-- ============================================================================
-- SafeStop — Sprint 3.1: Notification dispatch patches (auto-generated)
-- ============================================================================

-- Patch: submit_mdho_assessment
create or replace function public.submit_mdho_assessment(p_assessment_id uuid)
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

    perform public.create_occurrence_notification_event(
      v_occurrence_id,
      'MDHO_APPROVAL_REQUIRED',
      'HIGH',
      'MDHO enviado para aprovação',
      'Avaliação MDHO aguarda aprovação da Liderança HSE.',
      false,
      public.lookup_organization_member_id(v_user_id, v_organization_id),
      v_user_id,
      jsonb_build_object('assessment_id', p_assessment_id)
    );

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

-- Patch: return_mdho_assessment
create or replace function public.return_mdho_assessment(p_payload jsonb)
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

    perform public.create_occurrence_notification_event(
      v_occurrence_id,
      'MDHO_RETURNED',
      'HIGH',
      'MDHO devolvido',
      left(v_return_reason, 500),
      false,
      public.lookup_organization_member_id(v_user_id, v_organization_id),
      v_user_id,
      jsonb_build_object('assessment_id', v_assessment_id, 'return_reason', v_return_reason),
      jsonb_build_array(
        jsonb_build_object(
          'organization_member_id', public.lookup_organization_member_id(
            (select a.submitted_by from public.mdho_assessments a where a.id = v_assessment_id),
            v_organization_id
          ),
          'participant_type', 'HSE_SUPERVISOR'
        )
      )
    );

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

-- Patch: approve_mdho_assessment
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

    perform public.create_occurrence_notification_event(
      v_occurrence_id,
      'MDHO_APPROVED',
      'HIGH',
      'MDHO aprovado',
      'Avaliação MDHO aprovada pela Liderança HSE.',
      false,
      public.lookup_organization_member_id(v_user_id, v_organization_id),
      v_user_id,
      jsonb_build_object('assessment_id', p_assessment_id)
    );

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
