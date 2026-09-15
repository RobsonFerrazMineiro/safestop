-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.5: administração de contract_assignments
-- ============================================================================
-- Assignment = responsabilidade da pessoa NO CONTRATO (não RBAC, não membership,
-- não acesso a Workspace, não destinatário de notificação neste Gate).
-- Sem permission nova: organization.manage na Organization do MEMBER.
-- ============================================================================


-- ============================================================================
-- 1. Trigger 13X.1 — comment de domínio (sem mudar a regra)
-- ============================================================================
-- Já permite member.organization_id <> contractor_organization_id desde que
-- a Organization do member tenha link ativo no Workspace do contrato.
-- Ex.: Fiscal Hydro → Contract TÜV no Workspace Hydro Alunorte.

comment on function public.validate_contract_assignment_workspace() is
  'Gate 13X.1/13X.5: assignment só se contract.workspace_id NOT NULL e link ativo da Organization do MEMBER no Workspace. member.organization_id NÃO precisa ser contractor_organization_id (Fiscal Hydro em contrato TÜV). Contratos legado sem WS rejeitados.';


-- ============================================================================
-- 2. Helper — administrar assignment no contexto Workspace + org do member
-- ============================================================================
-- Pode gerir o vínculo da pessoa P no contrato C se:
--   - C.workspace_id NOT NULL
--   - can_access_workspace(C.workspace)
--   - Organization de P tem link ativo nesse Workspace
--   - has_permission('organization.manage', organization de P)
-- Assim:
--   Hydro manager (manage Hydro) atribui Fiscal Hydro ao contrato TÜV = SIM
--   TÜV manager (manage TÜV) atribui membro TÜV ao próprio contrato = SIM
--   TÜV manager atribui membro Hydro = NÃO (não tem manage na org Hydro)
--   can_access_workspace sozinho NÃO autoriza escrita.

create or replace function public.can_manage_contract_assignment(
  p_member_organization_id uuid,
  p_contract_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_platform_admin()
    or (
      p_member_organization_id is not null
      and p_contract_id is not null
      and public.has_permission('organization.manage', p_member_organization_id)
      and exists (
        select 1
        from public.contracts c
        where c.id = p_contract_id
          and c.workspace_id is not null
          and public.can_access_workspace(c.workspace_id)
          and exists (
            select 1
            from public.organization_workspace_links owl
            where owl.organization_id = p_member_organization_id
              and owl.workspace_id = c.workspace_id
              and owl.is_active = true
          )
      )
    );
$$;

comment on function public.can_manage_contract_assignment(uuid, uuid) is
  'Gate 13X.5: admin de assignment. organization.manage na Organization do MEMBER + can_access_workspace do contrato + link org↔WS. Não exige member.organization_id = contractor. Não concede Workspace. Não é RBAC novo.';

grant execute on function public.can_manage_contract_assignment(uuid, uuid) to authenticated;


-- ============================================================================
-- 3. RLS — SELECT / INSERT / UPDATE (sem DELETE)
-- ============================================================================

drop policy if exists contract_assignments_select on public.contract_assignments;
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
    or public.can_manage_contract_assignment(
      contract_assignments.organization_id,
      contract_assignments.contract_id
    )
  );

comment on policy contract_assignments_select on public.contract_assignments is
  'Gate 13X.5: próprio assignment ativo, platform admin, ou organization.manage na org do member com acesso ao Workspace do contrato.';

drop policy if exists contract_assignments_insert on public.contract_assignments;
create policy contract_assignments_insert on public.contract_assignments
  for insert to authenticated
  with check (
    public.can_manage_contract_assignment(organization_id, contract_id)
  );

comment on policy contract_assignments_insert on public.contract_assignments is
  'Gate 13X.5: platform admin (via helper) ou manager da Organization do MEMBER com WS+link. Sem permission nova.';

drop policy if exists contract_assignments_update on public.contract_assignments;
create policy contract_assignments_update on public.contract_assignments
  for update to authenticated
  using (
    public.can_manage_contract_assignment(organization_id, contract_id)
  )
  with check (
    public.can_manage_contract_assignment(organization_id, contract_id)
  );

comment on policy contract_assignments_update on public.contract_assignments is
  'Gate 13X.5: soft revoke (is_active/revoked_at) pelo mesmo contexto administrativo do INSERT. Sem DELETE.';
