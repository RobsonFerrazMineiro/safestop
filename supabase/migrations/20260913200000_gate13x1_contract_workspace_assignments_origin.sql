-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.1: schema additive do domínio final
-- ============================================================================
-- Escopo:
--   1) contracts.workspace_id nullable + índice + unique parcial seguro
--   2) contract_assignments (member × contract × role)
--   3) occurrences.origin_organization_id nullable
--   4) comment em workspaces.owner_organization_id (modelo final obrigatório)
--
-- NÃO:
--   - NOT NULL em colunas novas
--   - drop de client/contractor_organization_id
--   - alterar occurrences.organization_id
--   - reescrever create_occurrence / can_access_occurrence
--   - mover areas/units
--   - backfill
--   - permissão nova (escrita assignments = platform admin)
-- ============================================================================


-- ============================================================================
-- 1. Comentário owner_organization_id (sem CHECK NOT NULL — rows NULL ok)
-- ============================================================================

comment on column public.workspaces.owner_organization_id is
  'Empresa contratante administradora do Workspace. Modelo final (13X.0): obrigatório. Gate 13X.1: permanece NULLABLE para não quebrar rows existentes. Sem CHECK que rejeite NULL.';


-- ============================================================================
-- 2. contracts.workspace_id
-- ============================================================================

alter table public.contracts
  add column workspace_id uuid null references public.workspaces (id) on delete restrict;

comment on column public.contracts.workspace_id is
  'Workspace operacional do contrato. Gate 13X.1: NULLABLE (legado sem Workspace). Nos Gates 13X.2/13X.6 tornará NOT NULL; titular = Organization da contratada no Workspace. Não droppar client/contractor_organization_id neste Gate.';

create index contracts_workspace_id_idx
  on public.contracts (workspace_id)
  where workspace_id is not null;

-- Unique parcial seguro: dados locais atuais não têm workspace_id preenchido
-- e contract_number é distinto. Não conflita com
-- contracts_client_org_number_unique (eixo legado cliente × número).
create unique index contracts_workspace_contractor_number_unique
  on public.contracts (workspace_id, contractor_organization_id, contract_number)
  where workspace_id is not null and contract_number is not null;


-- ============================================================================
-- 3. contract_assignments
-- ============================================================================
-- Catálogo inicial assignment_role (13X.0): FISCAL | GERENTE | GESTOR.
-- Não substitui RBAC. N:N member × contract × role.

create table public.contract_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_member_id uuid not null,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  contract_id uuid not null references public.contracts (id) on delete restrict,
  assignment_role text not null,
  is_active boolean not null default true,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_assignments_role_check
    check (assignment_role in ('FISCAL', 'GERENTE', 'GESTOR')),
  constraint contract_assignments_member_contract_role_unique
    unique (organization_member_id, contract_id, assignment_role),
  constraint contract_assignments_revoked_after_granted
    check (revoked_at is null or revoked_at >= granted_at),
  constraint contract_assignments_member_org_consistency
    foreign key (organization_member_id, organization_id)
    references public.organization_members (id, organization_id)
    on delete restrict
);

comment on table public.contract_assignments is
  'Assignment N:N member × contract × role (Gate 13X.1). Não substitui RBAC. Catálogo inicial: FISCAL | GERENTE | GESTOR.';
comment on column public.contract_assignments.organization_id is
  'Denormalizado para FK composta com organization_members e validação de link Workspace.';
comment on column public.contract_assignments.assignment_role is
  'Catálogo inicial 13X.0: FISCAL | GERENTE | GESTOR. Não é papel RBAC.';
comment on column public.contract_assignments.is_active is
  'Soft deactivate. Preferir is_active=false (+ revoked_at) a DELETE físico.';

create index contract_assignments_organization_member_id_idx
  on public.contract_assignments (organization_member_id);
create index contract_assignments_organization_id_idx
  on public.contract_assignments (organization_id);
create index contract_assignments_contract_id_idx
  on public.contract_assignments (contract_id);
create index contract_assignments_is_active_idx
  on public.contract_assignments (is_active);

create trigger set_updated_at
  before update on public.contract_assignments
  for each row execute function public.set_updated_at();


-- Integridade Workspace: assignment só quando contract.workspace_id IS NOT NULL
-- e a Organization do member possui link ativo ao Workspace do contrato.
-- Contratos legado (workspace_id NULL) não aceitam assignment neste Gate.

create or replace function public.validate_contract_assignment_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_workspace_id uuid;
begin
  select c.workspace_id
    into v_workspace_id
  from public.contracts c
  where c.id = new.contract_id;

  if v_workspace_id is null then
    raise exception
      'contract_assignment requer contract.workspace_id preenchido (Gate 13X.1). Contratos legado sem Workspace não aceitam assignment.';
  end if;

  if not exists (
    select 1
    from public.organization_workspace_links owl
    where owl.organization_id = new.organization_id
      and owl.workspace_id = v_workspace_id
      and owl.is_active = true
  ) then
    raise exception
      'organization do member nao participa do workspace do contrato (Gate 13X.1)';
  end if;

  return new;
end;
$$;

comment on function public.validate_contract_assignment_workspace() is
  'Gate 13X.1: assignment somente se contract.workspace_id NOT NULL e link ativo org↔workspace. Sem validação improvisada para contratos legado.';

create trigger validate_contract_assignment_workspace
  before insert or update of organization_id, contract_id
  on public.contract_assignments
  for each row execute function public.validate_contract_assignment_workspace();


-- ============================================================================
-- 4. RLS contract_assignments (alinhado ao Gate 13B — conservador)
-- ============================================================================
-- SELECT: platform admin OU grant próprio ativo (member.profile_id = auth.uid()).
-- INSERT/UPDATE: somente is_platform_admin(). Sem permission nova.
-- Sem DELETE policy (soft deactivate).

alter table public.contract_assignments enable row level security;

create policy contract_assignments_select on public.contract_assignments
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      is_active = true
      and exists (
        select 1
        from public.organization_members om
        where om.id = contract_assignments.organization_member_id
          and om.profile_id = auth.uid()
          and om.is_active = true
      )
    )
  );

comment on policy contract_assignments_select on public.contract_assignments is
  'Gate 13X.1: disclosure restrito aos próprios assignments ativos, ou platform admin. Sem listagem de terceiros da Organization.';

create policy contract_assignments_insert on public.contract_assignments
  for insert to authenticated
  with check (public.is_platform_admin());

create policy contract_assignments_update on public.contract_assignments
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert, update on public.contract_assignments to authenticated;


-- ============================================================================
-- 5. occurrences.origin_organization_id
-- ============================================================================

alter table public.occurrences
  add column origin_organization_id uuid null
    references public.organizations (id) on delete restrict;

comment on column public.occurrences.origin_organization_id is
  'Empresa originadora/registradora (empregador do criador). NULL = ainda não migrado. NÃO usar como tenant no 13X.1. occurrences.organization_id permanece legado (cliente/tenant).';

create index occurrences_origin_organization_id_idx
  on public.occurrences (origin_organization_id)
  where origin_organization_id is not null;
