-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.2.2: leitura de detalhe (origin/contractor)
-- ============================================================================
-- LEITURA apenas. Sem ampliar INSERT/UPDATE/DELETE.
-- can_read_occurrence_in_org(uuid) permanece: permission NESTA Organization.
-- ============================================================================


-- ============================================================================
-- 1. Helper baseado na ROW da occurrence
-- ============================================================================

create or replace function public.can_read_occurrence_record(p_occurrence_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.occurrences o
    where o.id = p_occurrence_id
      and (
        public.is_platform_admin()
        or (
          public.can_access_occurrence(o.id)
          and (
            public.has_permission('occurrence.read', o.organization_id)
            or (
              o.origin_organization_id is not null
              and public.has_permission('occurrence.read', o.origin_organization_id)
            )
            or (
              o.contractor_organization_id is not null
              and public.has_permission('occurrence.read', o.contractor_organization_id)
            )
          )
        )
      )
  );
$$;

comment on function public.can_read_occurrence_record(uuid) is
  'Gate 13X.2.2: leitura de detalhe pela ROW. can_access_occurrence E occurrence.read no tenant OU origin OU contractor. Origin não é tenant. Não autoriza mutação.';

grant execute on function public.can_read_occurrence_record(uuid) to authenticated;


-- ============================================================================
-- 2. occurrences_select — mesmo predicado (DRY)
-- ============================================================================

drop policy if exists occurrences_select on public.occurrences;
create policy occurrences_select on public.occurrences
  for select to authenticated
  using (public.can_read_occurrence_record(id));

comment on policy occurrences_select on public.occurrences is
  'Gate 13X.2.2: SELECT via can_read_occurrence_record. Semântica 13X.2.1 preservada.';


-- ============================================================================
-- 3. Policies SELECT dos filhos / detalhe (INSERT/UPDATE/DELETE intactos)
-- ============================================================================

drop policy if exists occurrence_status_history_select on public.occurrence_status_history;
create policy occurrence_status_history_select on public.occurrence_status_history
  for select to authenticated
  using (public.can_read_occurrence_record(occurrence_id));

drop policy if exists occurrence_participants_select on public.occurrence_participants;
create policy occurrence_participants_select on public.occurrence_participants
  for select to authenticated
  using (public.can_read_occurrence_record(occurrence_id));

drop policy if exists occurrence_decisions_select on public.occurrence_decisions;
create policy occurrence_decisions_select on public.occurrence_decisions
  for select to authenticated
  using (public.can_read_occurrence_record(occurrence_id));

drop policy if exists occurrence_comments_select on public.occurrence_comments;
create policy occurrence_comments_select on public.occurrence_comments
  for select to authenticated
  using (
    deleted_at is null
    and public.can_read_occurrence_record(occurrence_id)
  );

drop policy if exists occurrence_attachments_select on public.occurrence_attachments;
create policy occurrence_attachments_select on public.occurrence_attachments
  for select to authenticated
  using (
    deleted_at is null
    and public.can_read_occurrence_record(occurrence_id)
  );

drop policy if exists action_plans_select on public.action_plans;
create policy action_plans_select on public.action_plans
  for select to authenticated
  using (public.can_read_occurrence_record(occurrence_id));

drop policy if exists action_items_select on public.action_items;
create policy action_items_select on public.action_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.action_plans ap
      where ap.id = action_items.action_plan_id
        and public.can_read_occurrence_record(ap.occurrence_id)
    )
  );

drop policy if exists action_item_attachments_select on public.action_item_attachments;
create policy action_item_attachments_select on public.action_item_attachments
  for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.action_items ai
      join public.action_plans ap on ap.id = ai.action_plan_id
      where ai.id = action_item_attachments.action_item_id
        and public.can_read_occurrence_record(ap.occurrence_id)
    )
  );

drop policy if exists mdho_assessments_select on public.mdho_assessments;
create policy mdho_assessments_select on public.mdho_assessments
  for select to authenticated
  using (public.can_read_occurrence_record(occurrence_id));

drop policy if exists mdho_selections_select on public.mdho_selections;
create policy mdho_selections_select on public.mdho_selections
  for select to authenticated
  using (
    exists (
      select 1
      from public.mdho_assessments a
      where a.id = mdho_selections.assessment_id
        and public.can_read_occurrence_record(a.occurrence_id)
    )
  );

drop policy if exists occurrence_evidence_storage_select on storage.objects;
create policy occurrence_evidence_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'occurrence-evidence'
    and (
      exists (
        select 1
        from public.occurrence_attachments a
        where a.storage_bucket = storage.objects.bucket_id
          and a.storage_path = storage.objects.name
          and a.upload_status = 'COMPLETED'
          and a.deleted_at is null
          and public.can_read_occurrence_record(a.occurrence_id)
      )
      or exists (
        select 1
        from public.action_item_attachments a
        join public.action_items ai on ai.id = a.action_item_id
        join public.action_plans ap on ap.id = ai.action_plan_id
        where a.storage_bucket = storage.objects.bucket_id
          and a.storage_path = storage.objects.name
          and a.upload_status = 'COMPLETED'
          and a.deleted_at is null
          and public.can_read_occurrence_record(ap.occurrence_id)
      )
    )
  );


-- ============================================================================
-- 4. get_occurrence_timeline — gate de LEITURA pela row
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

  if not public.can_read_occurrence_record(p_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.read.'
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
        when nullif(h.metadata ->> 'timeline_kind', '') is not null then h.metadata ->> 'timeline_kind'
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
        when h.from_status = 'AGUARDANDO_REGISTRO_IMS' and h.to_status = 'EM_TRATATIVA'
          then 'Referência IMS registrada'
        when h.from_status = 'EM_TRATATIVA' and h.to_status = 'EM_TRATATIVA'
          and coalesce(h.metadata ->> 'action', '') = 'update_ims'
          then 'Referência IMS alterada'
        when nullif(h.metadata ->> 'timeline_kind', '') = 'ACTION_PLAN_CREATED'
          then 'Plano de Ação criado'
        when nullif(h.metadata ->> 'timeline_kind', '') = 'ACTION_ITEM_CREATED'
          then 'Ação corretiva adicionada'
        when nullif(h.metadata ->> 'timeline_kind', '') = 'ACTION_ITEM_ASSIGNED'
          then 'Responsável da ação alterado'
        when nullif(h.metadata ->> 'timeline_kind', '') = 'ACTION_ITEM_DUE_CHANGED'
          then 'Prazo da ação alterado'
        when nullif(h.metadata ->> 'timeline_kind', '') = 'ACTION_PLAN_COMPLETED'
          then 'Plano de Ação concluído'
        when nullif(h.metadata ->> 'timeline_kind', '') = 'ACTION_ITEM_STATUS_CHANGED' then
          case coalesce(h.metadata ->> 'sub_action', '')
            when 'start' then 'Ação iniciada'
            when 'submit' then 'Ação enviada para validação'
            when 'validate_completed' then 'Ação validada'
            when 'validate_rejected' then 'Ação devolvida para correção'
            when 'cancel' then 'Ação cancelada'
            else 'Status da ação alterado'
          end
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
        when h.from_status = 'AGUARDANDO_REGISTRO_IMS' and h.to_status = 'EM_TRATATIVA' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', coalesce(h.metadata ->> 'action', 'register_ims'),
          'imsReferenceCode', h.metadata ->> 'ims_reference_code',
          'actorName', pr_eval.full_name
        )
        when h.from_status = 'EM_TRATATIVA' and h.to_status = 'EM_TRATATIVA'
          and coalesce(h.metadata ->> 'action', '') = 'update_ims' then jsonb_build_object(
          'fromStatus', h.from_status,
          'toStatus', h.to_status,
          'historyId', h.id,
          'action', 'update_ims',
          'previousCode', h.metadata ->> 'previous_code',
          'newCode', h.metadata ->> 'new_code',
          'updateReason', left(coalesce(h.metadata ->> 'update_reason', h.reason), 200),
          'actorName', pr_eval.full_name
        )
        when nullif(h.metadata ->> 'timeline_kind', '') is not null then
          h.metadata || jsonb_build_object('historyId', h.id, 'actorName', pr_eval.full_name)
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

    union all

    select
      att.id,
      'ACTION_ITEM_EVIDENCE_ADDED',
      coalesce(att.updated_at, att.created_at),
      att.uploaded_by,
      'Evidência da ação adicionada',
      nullif(btrim(att.caption), ''),
      jsonb_build_object(
        'attachmentId', att.id,
        'actionItemId', att.action_item_id,
        'mimeType', att.mime_type,
        'originalFileName', att.original_file_name,
        'fileSize', att.file_size,
        'caption', att.caption
      )
    from public.action_item_attachments att
    join public.action_items ai on ai.id = att.action_item_id
    join public.action_plans ap on ap.id = ai.action_plan_id
    where ap.occurrence_id = p_occurrence_id
      and att.upload_status = 'COMPLETED'
      and att.deleted_at is null
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
  'Feed timeline unificado. Gate 13X.2.2: leitura via can_read_occurrence_record (tenant/origin/contractor).';


-- ============================================================================
-- 5. Signed URL de LEITURA — evidência da occurrence / action item
-- ============================================================================

create or replace function public.get_occurrence_attachment_signed_url(target_attachment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_attachment public.occurrence_attachments%rowtype;
  v_signed_url_ttl_seconds constant integer := 3600;
  v_expires_at timestamptz;
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

  if target_attachment_id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'target_attachment_id é obrigatório.'
      )
    );
  end if;

  select a.*
    into v_attachment
  from public.occurrence_attachments a
  where a.id = target_attachment_id
    and a.deleted_at is null;

  if v_attachment.id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Anexo não encontrado.'
      )
    );
  end if;

  if v_attachment.upload_status <> 'COMPLETED' then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'VALIDATION_ERROR',
        'message', 'Somente anexos COMPLETED possuem URL assinada.'
      )
    );
  end if;

  if not public.can_read_occurrence_record(v_attachment.occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão occurrence.read.'
      )
    );
  end if;

  if not exists (
    select 1
    from storage.objects so
    where so.bucket_id = v_attachment.storage_bucket
      and so.name = v_attachment.storage_path
  ) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Arquivo não encontrado no Storage.'
      )
    );
  end if;

  v_expires_at := now() + make_interval(secs => v_signed_url_ttl_seconds);

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'attachment_id', v_attachment.id,
      'bucket', v_attachment.storage_bucket,
      'storage_path', v_attachment.storage_path,
      'expires_in_seconds', v_signed_url_ttl_seconds,
      'expires_at', v_expires_at,
      'signed_url', null
    )
  );
end;
$$;

comment on function public.get_occurrence_attachment_signed_url(uuid) is
  'Autoriza download (TTL 3600s). Gate 13X.2.2: can_read_occurrence_record. Cliente gera signed_url via Storage.';

create or replace function public.get_action_item_attachment_signed_url(target_attachment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_attachment public.action_item_attachments%rowtype;
  v_occurrence_id uuid;
  v_signed_url_ttl_seconds constant integer := 3600;
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

  select a.* into v_attachment
  from public.action_item_attachments a
  where a.id = target_attachment_id
    and a.deleted_at is null
    and a.upload_status = 'COMPLETED';

  if v_attachment.id is null then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Anexo não encontrado.'
      )
    );
  end if;

  select ap.occurrence_id into v_occurrence_id
  from public.action_items ai
  join public.action_plans ap on ap.id = ai.action_plan_id
  where ai.id = v_attachment.action_item_id;

  if v_occurrence_id is null
     or not public.can_read_occurrence_record(v_occurrence_id) then
    return jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Usuário sem permissão.'
      )
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'attachment_id', v_attachment.id,
      'bucket', v_attachment.storage_bucket,
      'storage_path', v_attachment.storage_path,
      'expires_in_seconds', v_signed_url_ttl_seconds,
      'signed_url', null
    )
  );
end;
$$;

comment on function public.get_action_item_attachment_signed_url(uuid) is
  'Autoriza download de evidência de action item. Gate 13X.2.2: can_read_occurrence_record.';

