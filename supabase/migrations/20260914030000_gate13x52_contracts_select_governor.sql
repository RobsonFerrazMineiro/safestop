-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.5.2: SELECT de contracts para governança no WS
-- ============================================================================
-- Owner do Ambiente e GERENCIADORA (participation_role naquele WS), com
-- organization.manage na própria org + can_access_workspace, LEEM contratos
-- daquele Workspace. Não amplia INSERT/UPDATE de contracts. Não autoriza
-- WRITE de assignment sobre members de outra Organization (13X.5 intacto).
-- ============================================================================


-- ============================================================================
-- 1. Trigger 13X.1 — ler invariantes sem depender do RLS de contracts
-- ============================================================================
-- SECURITY DEFINER + search_path vazio: somente SELECT de workspace_id e
-- link org↔WS. Não INSERT/UPDATE. Não substitui can_manage_contract_assignment.

create or replace function public.validate_contract_assignment_workspace()
returns trigger
language plpgsql
security definer
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
  'Gate 13X.1/13X.5.2: assignment somente se contract.workspace_id NOT NULL e link ativo da org do MEMBER no WS. SECURITY DEFINER lê invariantes sem RLS de contracts; não autoriza WRITE (RLS INSERT/UPDATE permanece can_manage_contract_assignment).';


-- ============================================================================
-- 2. contracts_select — eixo client/contractor preservado + governança no WS
-- ============================================================================

drop policy if exists contracts_select on public.contracts;
create policy contracts_select on public.contracts
  for select to authenticated
  using (
    client_organization_id in (select public.current_organization_ids())
    or contractor_organization_id in (select public.current_organization_ids())
    or public.is_platform_admin()
    or (
      workspace_id is not null
      and public.can_access_workspace(workspace_id)
      and exists (
        select 1
        from public.current_organization_ids() as auth_org(id)
        join public.workspaces w on w.id = contracts.workspace_id
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
                and owl.workspace_id = contracts.workspace_id
                and owl.is_active = true
                and owl.participation_role = 'GERENCIADORA'
            )
          )
      )
    )
  );

comment on policy contracts_select on public.contracts is
  'Gate 13X.5.2: client OU contractor OU platform admin OU (WS NOT NULL + can_access_workspace + organization.manage na org atuante que é owner do Ambiente ou GERENCIADORA no vínculo). CONTRATADA não ganha SELECT global do WS. INSERT/UPDATE de contracts inalterados. Visibilidade ≠ WRITE.';
