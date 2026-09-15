-- ============================================================================
-- SafeStop — Gate 13A: estratégia de backfill LEGADO (HOMOLOGAÇÃO LOCAL ONLY)
-- ============================================================================
-- NÃO é migration versionada.
-- NÃO executar em produção.
-- NÃO torna workspace_id NOT NULL.
--
-- Uso local (homologação / smoke estendido):
--   docker exec -i supabase_db_safestop psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f /path/to/homologate-workspace-legacy-local.sql
--
-- Estratégia-base (futura produção — Gate separado, aprovação PO):
--   Para cada Organization elegível:
--     1) criar/identificar Workspace legado (code sugerido: LEGACY-<org_short>)
--     2) organization_workspace_links ativo
--     3) workspace_memberships para organization_members ativos da org
--     4) update occurrences set workspace_id = <ws> where organization_id = <org>
--        and workspace_id is null
--   Depois: validar can_access_*; só então considerar NOT NULL em Gate futuro.
--
-- Este script aplica a estratégia apenas às orgs de seed local Alpha + Hydro QA.
-- ============================================================================

begin;

-- Alpha
insert into public.workspaces (id, name, code, owner_organization_id, is_active)
values (
  'd13a0000-0000-4000-8000-00000000a001',
  'Legacy Alpha (local homolog)',
  'LEGACY-ALPHA',
  'b0000000-0000-4000-8000-000000000001',
  true
)
on conflict (id) do nothing;

insert into public.organization_workspace_links (organization_id, workspace_id, is_active)
values (
  'b0000000-0000-4000-8000-000000000001',
  'd13a0000-0000-4000-8000-00000000a001',
  true
)
on conflict (organization_id, workspace_id) do update set is_active = true;

insert into public.workspace_memberships (
  organization_member_id, organization_id, workspace_id, is_active
)
select om.id, om.organization_id, 'd13a0000-0000-4000-8000-00000000a001', true
from public.organization_members om
where om.organization_id = 'b0000000-0000-4000-8000-000000000001'
  and om.is_active = true
on conflict (organization_member_id, workspace_id) do update set is_active = true;

-- Hydro QA (se existir)
insert into public.workspaces (id, name, code, owner_organization_id, is_active)
select
  'd13a0000-0000-4000-8000-00000000a002',
  'Legacy Hydro QA (local homolog)',
  'LEGACY-HYDRO',
  'b1000000-0000-4000-8000-000000000001',
  true
where exists (
  select 1 from public.organizations where id = 'b1000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.organization_workspace_links (organization_id, workspace_id, is_active)
select
  'b1000000-0000-4000-8000-000000000001',
  'd13a0000-0000-4000-8000-00000000a002',
  true
where exists (
  select 1 from public.organizations where id = 'b1000000-0000-4000-8000-000000000001'
)
on conflict (organization_id, workspace_id) do update set is_active = true;

insert into public.workspace_memberships (
  organization_member_id, organization_id, workspace_id, is_active
)
select om.id, om.organization_id, 'd13a0000-0000-4000-8000-00000000a002', true
from public.organization_members om
where om.organization_id = 'b1000000-0000-4000-8000-000000000001'
  and om.is_active = true
  and exists (
    select 1 from public.workspaces where id = 'd13a0000-0000-4000-8000-00000000a002'
  )
on conflict (organization_member_id, workspace_id) do update set is_active = true;

-- Associação de occurrences legadas (NULL → legacy WS da org)
update public.occurrences o
set workspace_id = 'd13a0000-0000-4000-8000-00000000a001'
where o.organization_id = 'b0000000-0000-4000-8000-000000000001'
  and o.workspace_id is null;

update public.occurrences o
set workspace_id = 'd13a0000-0000-4000-8000-00000000a002'
where o.organization_id = 'b1000000-0000-4000-8000-000000000001'
  and o.workspace_id is null
  and exists (
    select 1 from public.workspaces where id = 'd13a0000-0000-4000-8000-00000000a002'
  );

commit;

-- Nota: este script NÃO é revertido automaticamente. Para limpar homolog local:
--   update occurrences set workspace_id = null where workspace_id in (...);
--   delete memberships/links/workspaces dos IDs d13a0000-...a001/a002
