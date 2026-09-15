-- ============================================================================
-- SafeStop — Fase 3 / Gate 12: Fundação estrutural de Workspace
-- ============================================================================
-- Escopo (somente fundação — sem scoping operacional):
--   workspaces
--   organization_workspace_links
--   workspace_memberships
--
-- Fora de escopo (Gate 13+ / proibido neste Gate):
--   workspace_id em occurrences ou qualquer tabela operacional
--   alteração de can_access_occurrence / RPCs / Dashboard / Reports
--   backfill operacional / seed de produção
--   remodelagem de units / contracts
--
-- Arquitetura aprovada (PO / Gate 11):
--   User → Organization Membership → Organization
--        ↔ Organization Workspace Link → Workspace
--        ← Workspace Membership explícito (organization_member_id)
--        → (futuro) Operational Data
--
-- Princípios:
--   1) Organization Membership ≠ Workspace Membership
--   2) Workspace compartilhado por várias Organizations
--   3) Grant referencia organization_member_id (não user_id solto)
--   4) Sem wildcard de Workspace
--   5) owner_organization_id OPCIONAL
--   6) Unit ≠ Workspace; Contract ≠ Workspace
--   7) is_active explícito
--
-- Convenções: docs/database.md §3; espelho de
--   supabase/migrations/20260713193559_create_foundation_schema.sql
--
-- Rollback: este repositório não versiona down migrations. Reversão manual
--   exigiria DROP das três tabelas (somente se vazias / sem dependências futuras).
-- ============================================================================


-- ============================================================================
-- 1. workspaces
-- ============================================================================

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  owner_organization_id uuid references public.organizations (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_not_blank check (btrim(name) <> ''),
  constraint workspaces_code_not_blank check (code is null or btrim(code) <> '')
);

comment on table public.workspaces is
  'Espaço operacional compartilhado entre uma ou mais Organizations (Gate 12). Não é Unit nem Contract. Sem scoping operacional neste Gate.';
comment on column public.workspaces.owner_organization_id is
  'Organização proprietária OPCIONAL do Workspace. Nula quando o Workspace é compartilhado sem owner explícito.';
comment on column public.workspaces.code is
  'Código opcional legível. Unique parcial quando informado (não substitui o UUID).';
comment on column public.workspaces.is_active is
  'Soft deactivate. Workspace inativo permanece no histórico; sem cascade físico.';

create unique index workspaces_code_unique
  on public.workspaces (code)
  where code is not null;

create index workspaces_is_active_idx on public.workspaces (is_active);
create index workspaces_owner_organization_id_idx
  on public.workspaces (owner_organization_id)
  where owner_organization_id is not null;

create trigger set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 2. organization_workspace_links
-- ============================================================================
-- Participação N:N Organization ↔ Workspace.
-- UNIQUE (organization_id, workspace_id) impede link duplicado.
-- UNIQUE (id, organization_id, workspace_id) prepara FKs compostas filhas.
-- link_role omitido neste Gate: owner opcional já existe em workspaces.owner_organization_id;
--   papel OWNER|PARTICIPANT no link pode ser adicionado em Gate futuro se necessário.

create table public.organization_workspace_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_workspace_links_org_workspace_unique
    unique (organization_id, workspace_id),
  constraint organization_workspace_links_id_org_workspace_unique
    unique (id, organization_id, workspace_id)
);

comment on table public.organization_workspace_links is
  'Vínculo Organization ↔ Workspace (N:N). Permite Hydro, TÜV e Arcadis no mesmo Workspace sem duplicar o Workspace (Gate 12).';
comment on column public.organization_workspace_links.is_active is
  'Soft deactivate do vínculo. Desativar o link não remove Workspace Memberships existentes (integridade estrutural preservada; scoping operacional é Gate 13).';

create index organization_workspace_links_organization_id_idx
  on public.organization_workspace_links (organization_id);
create index organization_workspace_links_workspace_id_idx
  on public.organization_workspace_links (workspace_id);
create index organization_workspace_links_is_active_idx
  on public.organization_workspace_links (is_active);

create trigger set_updated_at
  before update on public.organization_workspace_links
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 3. workspace_memberships
-- ============================================================================
-- Grant explícito por organization_member (não por user_id solto).
-- Invariante estrutural via FKs compostas:
--   (organization_member_id, organization_id) → organization_members (id, organization_id)
--   (organization_id, workspace_id) → organization_workspace_links (organization_id, workspace_id)
-- Assim: impossível conceder membership se a Organization do member não participa do Workspace.

create table public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_member_id uuid not null,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  is_active boolean not null default true,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_memberships_member_workspace_unique
    unique (organization_member_id, workspace_id),
  constraint workspace_memberships_revoked_after_granted
    check (revoked_at is null or revoked_at >= granted_at),
  constraint workspace_memberships_member_org_consistency
    foreign key (organization_member_id, organization_id)
    references public.organization_members (id, organization_id)
    on delete restrict,
  constraint workspace_memberships_org_workspace_link_consistency
    foreign key (organization_id, workspace_id)
    references public.organization_workspace_links (organization_id, workspace_id)
    on delete restrict
);

comment on table public.workspace_memberships is
  'Grant explícito de acesso a um Workspace via organization_member_id (Gate 12). Organization Membership ≠ Workspace Membership. Sem wildcard.';
comment on column public.workspace_memberships.organization_id is
  'Denormalizado para integridade multi-tenant e FK composta com organization_workspace_links.';
comment on column public.workspace_memberships.organization_member_id is
  'Fonte de verdade do grant. Não usar user_id solto.';
comment on column public.workspace_memberships.is_active is
  'Soft deactivate do grant. Preferir is_active=false (+ revoked_at) a DELETE físico.';
comment on column public.workspace_memberships.granted_at is
  'Momento do grant. Distinto de created_at apenas se houver reativação futura; neste Gate alinhado ao insert.';
comment on column public.workspace_memberships.revoked_at is
  'Momento opcional de revogação. Nulo enquanto o grant estiver vigente.';

create index workspace_memberships_organization_member_id_idx
  on public.workspace_memberships (organization_member_id);
create index workspace_memberships_organization_id_idx
  on public.workspace_memberships (organization_id);
create index workspace_memberships_workspace_id_idx
  on public.workspace_memberships (workspace_id);
create index workspace_memberships_is_active_idx
  on public.workspace_memberships (is_active);

create trigger set_updated_at
  before update on public.workspace_memberships
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 4. RLS — somente tabelas foundation deste Gate
-- ============================================================================
-- Estratégia (conservadora — Gate 12 sem permission dedicada workspace.*):
--   SELECT: platform admin OU organização do usuário em current_organization_ids()
--           (workspaces via existência de link da org)
--   INSERT/UPDATE: somente is_platform_admin()
--   Sem DELETE policy (soft deactivate via UPDATE)
-- Não altera policies de occurrences, action plans, notifications, etc.
-- Não altera current_organization_ids / has_permission / can_access_occurrence.

alter table public.workspaces enable row level security;
alter table public.organization_workspace_links enable row level security;
alter table public.workspace_memberships enable row level security;

-- workspaces
create policy workspaces_select on public.workspaces
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.organization_workspace_links owl
      where owl.workspace_id = workspaces.id
        and owl.organization_id in (select public.current_organization_ids())
    )
  );

create policy workspaces_insert on public.workspaces
  for insert to authenticated
  with check (public.is_platform_admin());

create policy workspaces_update on public.workspaces
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- organization_workspace_links
create policy organization_workspace_links_select on public.organization_workspace_links
  for select to authenticated
  using (
    public.is_platform_admin()
    or organization_id in (select public.current_organization_ids())
  );

create policy organization_workspace_links_insert on public.organization_workspace_links
  for insert to authenticated
  with check (public.is_platform_admin());

create policy organization_workspace_links_update on public.organization_workspace_links
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- workspace_memberships
create policy workspace_memberships_select on public.workspace_memberships
  for select to authenticated
  using (
    public.is_platform_admin()
    or organization_id in (select public.current_organization_ids())
  );

create policy workspace_memberships_insert on public.workspace_memberships
  for insert to authenticated
  with check (public.is_platform_admin());

create policy workspace_memberships_update on public.workspace_memberships
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
