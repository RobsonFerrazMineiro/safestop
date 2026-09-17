-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.5.4: SELECT de colegas no Workspace
-- ============================================================================
-- Manager com organization.manage na EMPRESA atuante lê workspace_memberships
-- ATIVOS dos colegas dessa mesma Organization no Ambiente com
-- can_access_workspace. Organization-scoped. Sem wildcard por owner nem
-- GERENCIADORA. INSERT/UPDATE permanecem 13B (platform admin).
-- ============================================================================

drop policy if exists workspace_memberships_select on public.workspace_memberships;
create policy workspace_memberships_select on public.workspace_memberships
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      is_active = true
      and exists (
        select 1
        from public.organization_members om
        where om.id = workspace_memberships.organization_member_id
          and om.profile_id = auth.uid()
          and om.is_active = true
      )
    )
    or (
      is_active = true
      and public.can_access_workspace(workspace_id)
      and exists (
        select 1
        from public.current_organization_ids() as auth_org(id)
        where public.has_permission('organization.manage', auth_org.id)
          and workspace_memberships.organization_id = auth_org.id
      )
    )
  );

comment on policy workspace_memberships_select on public.workspace_memberships is
  'Gate 13X.5.4: platform admin OU grant próprio ativo OU colegas ativos da mesma Organization com organization.manage + can_access_workspace. Sem wildcard owner/GERENCIADORA. INSERT/UPDATE permanecem platform admin (13B).';
