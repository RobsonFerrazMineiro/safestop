-- ============================================================================
-- SafeStop — Sprint 3.1: Notification dispatch patches (auto-generated)
-- ============================================================================

-- Patch: register_ims_reference
create or replace function public.register_ims_reference(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_occurrence_id uuid;
  v_ims_code text;
  v_organization_id uuid;
  v_status text;
  v_decision_type text;
  v_existing_code text;
  v_registered_at timestamptz;
  v_registered_by uuid;
  v_transitioned_at timestamptz;
  v_mdho_approved boolean;
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

  v_occurrence_id := nullif(btrim(p_payload ->> 'occurrence_id'), '')::uuid;
  v_ims_code := nullif(btrim(p_payload ->> 'ims_reference_code'), '');

  if v_occurrence_id is null or v_ims_code is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Campos obrigatórios: occurrence_id, ims_reference_code.'
      )
    );
  end if;

  if v_ims_code !~ '^BAA-[0-9]{2}-[0-9]{4,}$' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Use o formato BAA-XX-0000 (ex.: BAA-26-0001).'
      )
    );
  end if;

  select
    o.organization_id,
    o.status,
    o.decision_type,
    o.ims_reference_code,
    o.ims_reference_registered_at,
    o.ims_reference_registered_by
  into
    v_organization_id,
    v_status,
    v_decision_type,
    v_existing_code,
    v_registered_at,
    v_registered_by
  from public.occurrences o
  where o.id = v_occurrence_id;

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

  if not public.can_access_occurrence(v_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem escopo de acesso à ocorrência.'
      )
    );
  end if;

  if not public.has_permission('ims_reference.register', v_organization_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão ims_reference.register.'
      )
    );
  end if;

  if v_decision_type is distinct from 'INTERDICAO_OFICIAL' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Referência IMS não aplicável ao ramo Ver e Agir.'
      )
    );
  end if;

  if v_status = 'EM_TRATATIVA' and v_existing_code is not null then
    if v_ims_code = v_existing_code then
      return jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
          'occurrence', jsonb_build_object(
            'id', v_occurrence_id,
            'status', 'EM_TRATATIVA',
            'ims_reference_code', v_existing_code,
            'ims_reference_registered_at', v_registered_at,
            'ims_reference_registered_by', v_registered_by
          ),
          'idempotent', true
        )
      );
    end if;

    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'ALREADY_REGISTERED',
        'message', 'Esta ocorrência já possui referência IMS registrada.',
        'imsReferenceCode', v_existing_code
      )
    );
  end if;

  if v_existing_code is not null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'ALREADY_REGISTERED',
        'message', 'Esta ocorrência já possui referência IMS registrada.',
        'imsReferenceCode', v_existing_code
      )
    );
  end if;

  if v_status <> 'AGUARDANDO_REGISTRO_IMS' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'Registro IMS só permitido com ocorrência em AGUARDANDO_REGISTRO_IMS.',
        'currentStatus', v_status
      )
    );
  end if;

  select exists (
    select 1
    from public.mdho_assessments a
    where a.occurrence_id = v_occurrence_id
      and a.status = 'APPROVED'
  )
  into v_mdho_approved;

  if not v_mdho_approved then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'STATUS_MISMATCH',
        'message', 'MDHO deve estar aprovado antes do registro IMS.'
      )
    );
  end if;

  update public.occurrences
  set
    ims_reference_code = v_ims_code,
    ims_reference_registered_at = now(),
    ims_reference_registered_by = v_user_id,
    status = 'EM_TRATATIVA',
    updated_at = now()
  where id = v_occurrence_id
    and status = 'AGUARDANDO_REGISTRO_IMS'
    and ims_reference_code is null;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'CONFLICT',
        'message', 'Conflito ao registrar referência IMS.'
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
    'AGUARDANDO_REGISTRO_IMS',
    'EM_TRATATIVA',
    jsonb_build_object(
      'action', 'register_ims',
      'ims_reference_code', v_ims_code
    ),
    v_user_id
  )
  returning changed_at into v_transitioned_at;

  -- notification dispatch Sprint 3 (sem implementar)

    perform public.create_occurrence_notification_event(
      v_occurrence_id,
      'IMS_REFERENCE_REGISTERED',
      'MEDIUM',
      'Referência IMS registrada',
      coalesce(v_ims_code, 'Referência IMS registrada manualmente.'),
      false,
      public.lookup_organization_member_id(v_user_id, v_organization_id),
      v_user_id,
      jsonb_build_object('ims_reference_code', v_ims_code)
    );

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'occurrence', jsonb_build_object(
        'id', v_occurrence_id,
        'status', 'EM_TRATATIVA',
        'ims_reference_code', v_ims_code,
        'ims_reference_registered_at', v_transitioned_at,
        'ims_reference_registered_by', v_user_id
      )
    )
  );
end;
$$;
