-- ============================================================================
-- SafeStop — Fase 3: fundação de ocorrências (Sprint 2.0)
-- ============================================================================
-- Tabelas: occurrences, occurrence_status_history, occurrence_participants,
--          occurrence_decisions, occurrence_public_code_counters.
-- Função: can_access_occurrence(occurrence_id).
-- RLS: SELECT com has_permission('occurrence.read', org_id) + escopo;
--      INSERT/UPDATE em occurrences negados no cliente (RPC na Etapa 2).
-- Referências: docs/database.md §8–11, docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md
-- ============================================================================


-- ============================================================================
-- 1. Contador de public_code (A1 — geração exclusiva na RPC create_occurrence)
-- ============================================================================

create table public.occurrence_public_code_counters (
  organization_id uuid not null references public.organizations (id) on delete restrict,
  year smallint not null,
  last_value integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint occurrence_public_code_counters_year_check
    check (year >= 0 and year <= 99),
  constraint occurrence_public_code_counters_last_value_non_negative
    check (last_value >= 0),
  primary key (organization_id, year)
);

comment on table public.occurrence_public_code_counters is
  'Contador atômico SS-{YY}-{NNNNNN} por organização e ano (docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md A1). Uso exclusivo via RPC.';

create trigger set_updated_at
  before update on public.occurrence_public_code_counters
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 2. occurrences (docs/database.md §8.1)
-- ============================================================================

create table public.occurrences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  unit_id uuid,
  area_id uuid not null,
  management_department_id uuid,
  contract_id uuid references public.contracts (id) on delete restrict,
  contractor_organization_id uuid references public.organizations (id) on delete restrict,

  public_code text not null,
  title text not null,
  task_description text not null,
  location_description text not null,
  condition_description text not null,
  immediate_action_description text,

  severity text not null,
  status text not null default 'PARALISACAO_PREVENTIVA',
  decision_type text,

  latitude numeric(9, 6),
  longitude numeric(9, 6),
  location_accuracy numeric(8, 2),

  occurred_at timestamptz not null default now(),
  stopped_at timestamptz,
  evaluated_at timestamptz,
  released_at timestamptz,
  closed_at timestamptz,
  cancelled_at timestamptz,

  created_by uuid not null references public.profiles (id) on delete restrict,
  assigned_evaluator_id uuid references public.profiles (id) on delete set null,

  ims_reference_code text,
  ims_reference_registered_at timestamptz,
  ims_reference_registered_by uuid references public.profiles (id) on delete set null,
  ims_reference_updated_at timestamptz,
  ims_reference_updated_by uuid references public.profiles (id) on delete set null,

  cancellation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint occurrences_public_code_unique unique (public_code),
  constraint occurrences_title_not_blank check (btrim(title) <> ''),
  constraint occurrences_task_description_not_blank check (btrim(task_description) <> ''),
  constraint occurrences_location_description_not_blank check (btrim(location_description) <> ''),
  constraint occurrences_condition_description_not_blank check (btrim(condition_description) <> ''),
  constraint occurrences_severity_check
    check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  constraint occurrences_status_check
    check (status in (
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
    )),
  constraint occurrences_decision_type_check
    check (decision_type is null or decision_type in ('VER_E_AGIR', 'INTERDICAO_OFICIAL')),
  constraint occurrences_area_org_consistency
    foreign key (area_id, organization_id) references public.areas (id, organization_id),
  constraint occurrences_unit_org_consistency
    foreign key (unit_id, organization_id) references public.units (id, organization_id),
  constraint occurrences_management_department_org_consistency
    foreign key (management_department_id, organization_id)
    references public.management_departments (id, organization_id)
);

comment on table public.occurrences is
  'Paralisação Preventiva e acompanhamento até conclusão (docs/database.md §8.1). Status alterado apenas via RPC.';
comment on column public.occurrences.public_code is
  'Código interno SS-{YY}-{NNNNNN}; gerado exclusivamente no backend (docs/database.md §8.2).';
comment on column public.occurrences.area_id is
  'Obrigatório na criação (docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md A2).';
comment on column public.occurrences.status is
  'Status inicial PARALISACAO_PREVENTIVA; transições somente via funções de backend (docs/database.md §8.5).';

create index occurrences_organization_id_idx on public.occurrences (organization_id);
create index occurrences_status_idx on public.occurrences (status);
create index occurrences_severity_idx on public.occurrences (severity);
create index occurrences_unit_id_idx on public.occurrences (unit_id);
create index occurrences_area_id_idx on public.occurrences (area_id);
create index occurrences_contractor_organization_id_idx on public.occurrences (contractor_organization_id);
create index occurrences_created_at_idx on public.occurrences (created_at);
create index occurrences_occurred_at_idx on public.occurrences (occurred_at);
create index occurrences_assigned_evaluator_id_idx on public.occurrences (assigned_evaluator_id);
create index occurrences_ims_reference_code_idx on public.occurrences (ims_reference_code) where ims_reference_code is not null;
create index occurrences_organization_id_status_idx on public.occurrences (organization_id, status);
create index occurrences_organization_id_created_at_idx on public.occurrences (organization_id, created_at);
create index occurrences_organization_id_area_id_created_at_idx on public.occurrences (organization_id, area_id, created_at);
create index occurrences_organization_id_contractor_created_at_idx
  on public.occurrences (organization_id, contractor_organization_id, created_at);

create trigger set_updated_at
  before update on public.occurrences
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 3. occurrence_status_history (docs/database.md §11.1)
-- ============================================================================

create table public.occurrence_status_history (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.occurrences (id) on delete restrict,
  from_status text,
  to_status text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_by uuid not null references public.profiles (id) on delete restrict,
  changed_at timestamptz not null default now(),
  constraint occurrence_status_history_from_status_check
    check (from_status is null or from_status in (
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
    )),
  constraint occurrence_status_history_to_status_check
    check (to_status in (
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
    ))
);

comment on table public.occurrence_status_history is
  'Histórico imutável de mudanças de status (docs/database.md §11.1). Primeira entrada na RPC create_occurrence (A9).';

create index occurrence_status_history_occurrence_id_idx on public.occurrence_status_history (occurrence_id);
create index occurrence_status_history_occurrence_id_changed_at_idx
  on public.occurrence_status_history (occurrence_id, changed_at);


-- ============================================================================
-- 4. occurrence_participants (docs/database.md §9.1 — estrutura only)
-- ============================================================================

create table public.occurrence_participants (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.occurrences (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  organization_member_id uuid not null references public.organization_members (id) on delete restrict,
  participant_type text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  constraint occurrence_participants_participant_type_check
    check (participant_type in (
      'REPORTER',
      'EVALUATOR',
      'CONTRACTOR_LEADER',
      'CONTRACT_INSPECTOR',
      'HSE_SUPERVISOR',
      'HSE_APPROVER',
      'AREA_MANAGER',
      'ACTION_OWNER',
      'RELEASE_APPROVER',
      'OBSERVER'
    )),
  constraint occurrence_participants_member_org_consistency
    foreign key (organization_member_id, organization_id)
    references public.organization_members (id, organization_id)
);

comment on table public.occurrence_participants is
  'Participantes da ocorrência (docs/database.md §9.1). Lógica de atribuição na Etapa 2+.';

create index occurrence_participants_occurrence_id_idx on public.occurrence_participants (occurrence_id);
create index occurrence_participants_organization_member_id_idx on public.occurrence_participants (organization_member_id);


-- ============================================================================
-- 5. occurrence_decisions (docs/database.md §10.1 — estrutura only)
-- ============================================================================

create table public.occurrence_decisions (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.occurrences (id) on delete restrict,
  decision_type text not null,
  decision_reason text,
  decided_by uuid not null references public.profiles (id) on delete restrict,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint occurrence_decisions_decision_type_check
    check (decision_type in ('VER_E_AGIR', 'INTERDICAO_OFICIAL'))
);

comment on table public.occurrence_decisions is
  'Decisão da liderança (docs/database.md §10.1). Registro via RPC na Etapa 2+.';

create index occurrence_decisions_occurrence_id_idx on public.occurrence_decisions (occurrence_id);


-- ============================================================================
-- 6. Triggers de consistência multi-tenant
-- ============================================================================

create function public.validate_occurrence_contract_org()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_client_organization_id uuid;
  v_contractor_organization_id uuid;
begin
  if new.contract_id is null then
    return new;
  end if;

  select c.client_organization_id, c.contractor_organization_id
    into v_client_organization_id, v_contractor_organization_id
  from public.contracts c
  where c.id = new.contract_id;

  if v_client_organization_id is null then
    raise exception 'contract_id % não corresponde a um contrato válido', new.contract_id;
  end if;

  if new.organization_id <> v_client_organization_id then
    raise exception
      'organization_id (%) da ocorrência deve ser a organização cliente do contrato (%)',
      new.organization_id, new.contract_id;
  end if;

  if new.contractor_organization_id is not null
     and new.contractor_organization_id <> v_contractor_organization_id then
    raise exception
      'contractor_organization_id (%) deve corresponder à contratada do contrato (%)',
      new.contractor_organization_id, new.contract_id;
  end if;

  return new;
end;
$$;

comment on function public.validate_occurrence_contract_org() is
  'Garante que contract_id e contractor_organization_id são consistentes com organization_id da ocorrência.';

create trigger validate_occurrence_contract_org
  before insert or update on public.occurrences
  for each row execute function public.validate_occurrence_contract_org();


-- ============================================================================
-- 7. can_access_occurrence (docs/database.md §23.3)
-- ============================================================================
-- Escopo mínimo documentado: vínculo na organização da ocorrência, contratada
-- relacionada, contrato vinculado ou participação explícita.

create function public.can_access_occurrence(target_occurrence_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.occurrences o
    where o.id = target_occurrence_id
      and (
        public.is_platform_admin()
        or o.organization_id in (select public.current_organization_ids())
        or (
          o.contractor_organization_id is not null
          and o.contractor_organization_id in (select public.current_organization_ids())
        )
        or (
          o.contract_id is not null
          and exists (
            select 1
            from public.contracts c
            where c.id = o.contract_id
              and c.is_active = true
              and (
                c.client_organization_id in (select public.current_organization_ids())
                or c.contractor_organization_id in (select public.current_organization_ids())
              )
          )
        )
        or exists (
          select 1
          from public.occurrence_participants op
          join public.organization_members om on om.id = op.organization_member_id
          where op.occurrence_id = o.id
            and om.profile_id = auth.uid()
            and om.is_active = true
        )
      )
  );
$$;

comment on function public.can_access_occurrence(uuid) is
  'Verifica escopo organizacional/contratual/participação para acesso à ocorrência (docs/database.md §23.3).';


-- ============================================================================
-- 8. Row Level Security
-- ============================================================================

alter table public.occurrences enable row level security;
alter table public.occurrence_status_history enable row level security;
alter table public.occurrence_participants enable row level security;
alter table public.occurrence_decisions enable row level security;
alter table public.occurrence_public_code_counters enable row level security;

-- occurrences: SELECT com permissão + escopo; sem INSERT/UPDATE/DELETE no cliente.
create policy occurrences_select on public.occurrences
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      public.has_permission('occurrence.read', organization_id)
      and public.can_access_occurrence(id)
    )
  );

-- occurrence_status_history: leitura alinhada à ocorrência pai.
create policy occurrence_status_history_select on public.occurrence_status_history
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      exists (
        select 1
        from public.occurrences o
        where o.id = occurrence_status_history.occurrence_id
          and public.has_permission('occurrence.read', o.organization_id)
          and public.can_access_occurrence(o.id)
      )
    )
  );

-- occurrence_participants: leitura alinhada à ocorrência pai.
create policy occurrence_participants_select on public.occurrence_participants
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      exists (
        select 1
        from public.occurrences o
        where o.id = occurrence_participants.occurrence_id
          and public.has_permission('occurrence.read', o.organization_id)
          and public.can_access_occurrence(o.id)
      )
    )
  );

-- occurrence_decisions: leitura alinhada à ocorrência pai.
create policy occurrence_decisions_select on public.occurrence_decisions
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      exists (
        select 1
        from public.occurrences o
        where o.id = occurrence_decisions.occurrence_id
          and public.has_permission('occurrence.read', o.organization_id)
          and public.can_access_occurrence(o.id)
      )
    )
  );

-- occurrence_public_code_counters: sem policy para authenticated (uso interno RPC).


-- ============================================================================
-- 9. Concessões Data API
-- ============================================================================

grant select on public.occurrences to authenticated;
grant select on public.occurrence_status_history to authenticated;
grant select on public.occurrence_participants to authenticated;
grant select on public.occurrence_decisions to authenticated;

grant execute on function public.can_access_occurrence(uuid) to authenticated;
