-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.2.3: visibilidade OPERACIONAL de contracts
-- ============================================================================
-- Técnico com occurrence.create, sem organization.manage, org GERENCIADORA
-- (ou owner) no Workspace, lê contracts daquele Ambiente para registrar PP.
-- 13X.5.2 (governança / organization.manage) permanece. INSERT/UPDATE de
-- contracts inalterados. organizations_select NÃO é ampliado.
-- ============================================================================


-- ============================================================================
-- 1. Helper OPERACIONAL (não substitui 13X.5.2)
-- ============================================================================

create or replace function public.can_read_workspace_contracts_operational(
  p_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_workspace_id is not null
    and public.can_access_workspace(p_workspace_id)
    and exists (
      select 1
      from public.current_organization_ids() as auth_org(id)
      join public.workspaces w on w.id = p_workspace_id
      where public.has_permission('occurrence.create', auth_org.id)
        and (
          (
            w.owner_organization_id is not null
            and w.owner_organization_id = auth_org.id
          )
          or exists (
            select 1
            from public.organization_workspace_links owl
            where owl.organization_id = auth_org.id
              and owl.workspace_id = p_workspace_id
              and owl.is_active = true
              and owl.participation_role = 'GERENCIADORA'
          )
        )
    );
$$;

comment on function public.can_read_workspace_contracts_operational(uuid) is
  'Gate 13X.2.3: LEITURA operacional de contracts do WS. occurrence.create na org atuante que é owner do Ambiente ou GERENCIADORA no vínculo. Sem organization.manage. CONTRATADA não entra. Não autoriza WRITE.';

revoke all on function public.can_read_workspace_contracts_operational(uuid) from public;
grant execute on function public.can_read_workspace_contracts_operational(uuid) to authenticated;


-- ============================================================================
-- 2. contracts_select — eixo 13X.5.2 intacto + eixo operacional
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
    or public.can_read_workspace_contracts_operational(workspace_id)
  );

comment on policy contracts_select on public.contracts is
  'Gate 13X.5.2 governança (organization.manage + owner/GERENCIADORA) e Gate 13X.2.3 operacional (occurrence.create + owner/GERENCIADORA). Client/contractor/admin preservados. CONTRATADA sem SELECT global. INSERT/UPDATE inalterados.';


-- ============================================================================
-- 3. RPC Contract-scoped — nome da executora sem organizations_select amplo
-- ============================================================================

create or replace function public.list_operational_workspace_contracts(
  p_workspace_id uuid
)
returns table (
  id uuid,
  contract_number text,
  name text,
  contractor_organization_id uuid,
  contractor_organization_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED' using errcode = '28000';
  end if;

  if p_workspace_id is null then
    raise exception 'VALIDATION_ERROR: p_workspace_id é obrigatório' using errcode = '22023';
  end if;

  if not public.can_read_workspace_contracts_operational(p_workspace_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    c.contract_number,
    c.name,
    c.contractor_organization_id,
    o.name
  from public.contracts c
  inner join public.organizations o on o.id = c.contractor_organization_id
  where c.workspace_id = p_workspace_id
    and c.is_active = true
  order by o.name, c.contract_number, c.id;
end;
$$;

comment on function public.list_operational_workspace_contracts(uuid) is
  'Gate 13X.2.3: lista contracts ATIVOS do Workspace para Create de PP. SECURITY DEFINER lê só name da executora das rows devolvidas. Mesmo predicado operacional do helper. Sem INSERT/UPDATE. Sem diretório de organizations.';

grant execute on function public.list_operational_workspace_contracts(uuid) to authenticated;
revoke all on function public.list_operational_workspace_contracts(uuid) from public;
