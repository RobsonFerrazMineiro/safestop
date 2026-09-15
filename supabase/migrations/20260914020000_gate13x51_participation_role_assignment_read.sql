-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.5.1: participation_role + READ Contract-scoped
-- ============================================================================
-- Papel da Organization NO Workspace (vínculo N:N). Não é RBAC, owner, nem
-- assignment_role. WRITE 13X.5 (can_manage_contract_assignment) intacto.
-- Sem permission nova. Sem NOT NULL. Sem backfill.
-- ============================================================================


-- ============================================================================
-- 1. DDL — organization_workspace_links.participation_role
-- ============================================================================

alter table public.organization_workspace_links
  add column participation_role text null;

alter table public.organization_workspace_links
  add constraint organization_workspace_links_participation_role_check
  check (
    participation_role is null
    or participation_role in ('GERENCIADORA', 'CONTRATADA')
  );

comment on column public.organization_workspace_links.participation_role is
  'Papel da EMPRESA no AMBIENTE (vínculo Organization × Workspace). Catálogo: GERENCIADORA | CONTRATADA. NULL = não classificado; não inferir papel. Owner do Ambiente = workspaces.owner_organization_id (não é valor deste CHECK). Não é RBAC nem assignment_role.';

create index organization_workspace_links_workspace_participation_role_idx
  on public.organization_workspace_links (workspace_id, participation_role)
  where participation_role is not null;


-- ============================================================================
-- 2. Helper de LEITURA (independente do WRITE)
-- ============================================================================
-- READ Contract-scoped ≠ WRITE Organization-scoped.
-- Owner ou GERENCIADORA (no VÍNCULO daquele WS) com organization.manage na
-- própria org + can_access_workspace: VÊ todos os assignments do Contract.
-- Não concede WRITE sobre members de outras Organizations.

create or replace function public.can_read_contract_assignment(
  p_assignment_organization_id uuid,
  p_contract_id uuid,
  p_organization_member_id uuid,
  p_is_active boolean
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
      coalesce(p_is_active, false)
      and exists (
        select 1
        from public.organization_members om
        where om.id = p_organization_member_id
          and om.profile_id = auth.uid()
          and om.is_active = true
      )
    )
    or public.can_manage_contract_assignment(
      p_assignment_organization_id,
      p_contract_id
    )
    or exists (
      select 1
      from public.contracts c
      join public.workspaces w on w.id = c.workspace_id
      where c.id = p_contract_id
        and c.workspace_id is not null
        and public.can_access_workspace(c.workspace_id)
        and exists (
          select 1
          from public.current_organization_ids() as auth_org(id)
          where public.has_permission('organization.manage', auth_org.id)
            and (
              (
                w.owner_organization_id is not null
                and w.owner_organization_id = auth_org.id
              )
              or exists (
                select 1
                from public.organization_workspace_links owl
                where owl.organization_id = auth_org.id
                  and owl.workspace_id = c.workspace_id
                  and owl.is_active = true
                  and owl.participation_role = 'GERENCIADORA'
              )
            )
        )
    );
$$;

comment on function public.can_read_contract_assignment(uuid, uuid, uuid, boolean) is
  'Gate 13X.5.1: LEITURA de assignment. Próprio ativo, can_manage (própria org), ou visão Contract-scoped (owner do WS ou GERENCIADORA no vínculo Organization×Workspace) com organization.manage na org atuante. CONTRATADA e participation_role NULL (não-owner) não ganham visão global. Não autoriza WRITE.';

grant execute on function public.can_read_contract_assignment(uuid, uuid, uuid, boolean) to authenticated;


-- ============================================================================
-- 3. SELECT usa helper de READ. INSERT/UPDATE 13X.5 intactos.
-- ============================================================================

drop policy if exists contract_assignments_select on public.contract_assignments;
create policy contract_assignments_select on public.contract_assignments
  for select to authenticated
  using (
    public.can_read_contract_assignment(
      organization_id,
      contract_id,
      organization_member_id,
      is_active
    )
  );

comment on policy contract_assignments_select on public.contract_assignments is
  'Gate 13X.5.1: SELECT via can_read_contract_assignment (Contract-scoped). INSERT/UPDATE continuam can_manage_contract_assignment (Organization-scoped).';
