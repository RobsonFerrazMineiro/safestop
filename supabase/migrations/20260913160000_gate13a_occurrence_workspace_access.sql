-- ============================================================================
-- SafeStop — Fase 3 / Gate 13A: Workspace operacional mínimo + autorização efetiva
-- ============================================================================
-- Escopo:
--   1) occurrences.workspace_id uuid NULL (FK workspaces, ON DELETE RESTRICT)
--   2) can_access_workspace(uuid) — acesso efetivo (ONDE)
--   3) current_workspace_ids() — setof uuid (espelho de current_organization_ids)
--   4) can_access_occurrence — coexistência legado (NULL) × Workspace (NOT NULL)
--
-- Fora de escopo:
--   NOT NULL em workspace_id; cutover Web/Mobile; Switcher; Dashboard/Reports;
--   workspace_id em tabelas filhas; Offline/outbox/sync; Gate 13B completo;
--   remodelagem Contacts/Notifications; wildcard; units/contracts.
--
-- ONLINE-only: SafeStop não possui modo offline. Sem outbox, sync ou drafts offline.
--
-- Não edita 20260913140000_create_workspace_foundation.sql.
-- ============================================================================


-- ============================================================================
-- 1. occurrences.workspace_id (nullable — coexistência legada)
-- ============================================================================
-- NULL = occurrence histórica / fluxo atual sem Workspace obrigatório.
-- NOT NULL somente após backfill completo + homologação (Gate futuro).
-- Filhos (status history, participants, decisions, comments, attachments,
-- action plans/items, MDHO, etc.) herdam Workspace pela occurrence — sem
-- espalhar workspace_id nestas tabelas neste Gate.

alter table public.occurrences
  add column workspace_id uuid references public.workspaces (id) on delete restrict;

comment on column public.occurrences.workspace_id is
  'Workspace operacional da occurrence (raiz Workspace-scoped). NULLABLE no Gate 13A para coexistência com dados legados. NULL = autorização legado (sem filtro Workspace). NOT NULL exige can_access_workspace. Filhos herdam via occurrence_id — não duplicar workspace_id. NOT NULL somente após backfill + homologação.';

-- Índice simples: lookup / filtro por Workspace (parcial — maioria ainda NULL).
create index occurrences_workspace_id_idx
  on public.occurrences (workspace_id)
  where workspace_id is not null;

-- Índice composto: listas operacionais já são org-scoped (organization_id + created_at
-- etc.); futuras queries org+workspace reutilizam o prefixo organization_id.
create index occurrences_organization_id_workspace_id_idx
  on public.occurrences (organization_id, workspace_id)
  where workspace_id is not null;


-- ============================================================================
-- 2. can_access_workspace — acesso efetivo (ONDE)
-- ============================================================================
-- Condições (usuário comum) — TODAS necessárias:
--   1) Workspace existe
--   2) Workspace is_active
--   3) organization_workspace_links ativo
--   4) workspace_memberships ativo
--   5) organization_members ativo
--   6) organization_member.profile_id = auth.uid()
--   7) Organization da membership = Organization do link ao Workspace
-- Platform Admin: bypass centralizado via is_platform_admin() (não espalhar em policies).
-- p_workspace_id NULL → false.

create or replace function public.can_access_workspace(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when p_workspace_id is null then false
      when public.is_platform_admin() then true
      else exists (
        select 1
        from public.workspaces w
        join public.organization_workspace_links owl
          on owl.workspace_id = w.id
         and owl.is_active = true
        join public.workspace_memberships wm
          on wm.workspace_id = w.id
         and wm.organization_id = owl.organization_id
         and wm.is_active = true
        join public.organization_members om
          on om.id = wm.organization_member_id
         and om.organization_id = wm.organization_id
         and om.is_active = true
        where w.id = p_workspace_id
          and w.is_active = true
          and om.profile_id = auth.uid()
      )
    end;
$$;

comment on function public.can_access_workspace(uuid) is
  'Acesso efetivo a Workspace (Gate 13A). ONDE o usuário pode atuar. Exige Workspace ativo + link ativo + workspace_membership ativa + organization_member ativo com profile_id = auth.uid() e mesma Organization do link. Platform Admin via is_platform_admin(). Organization Membership sozinha NÃO basta. RBAC (O QUE) permanece em has_permission.';

grant execute on function public.can_access_workspace(uuid) to authenticated;


-- ============================================================================
-- 3. current_workspace_ids — Workspaces efetivamente acessíveis
-- ============================================================================
-- Espelha current_organization_ids(). NÃO inclui todos os Workspaces para
-- Platform Admin (bypass fica em can_access_workspace / is_platform_admin).
-- NÃO retorna Workspace só porque a Organization tem link.

create or replace function public.current_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct w.id
  from public.workspaces w
  join public.organization_workspace_links owl
    on owl.workspace_id = w.id
   and owl.is_active = true
  join public.workspace_memberships wm
    on wm.workspace_id = w.id
   and wm.organization_id = owl.organization_id
   and wm.is_active = true
  join public.organization_members om
    on om.id = wm.organization_member_id
   and om.organization_id = wm.organization_id
   and om.is_active = true
  where w.is_active = true
    and om.profile_id = auth.uid();
$$;

comment on function public.current_workspace_ids() is
  'Retorna Workspaces com acesso efetivo do usuário autenticado (Gate 13A): Workspace ativo + link ativo + membership ativa + organization_member ativo. Não lista Workspaces apenas por link da Organization. Platform Admin não recebe set universal aqui — usar is_platform_admin()/can_access_workspace.';

grant execute on function public.current_workspace_ids() to authenticated;


-- ============================================================================
-- 4. can_access_occurrence — coexistência legado × Workspace
-- ============================================================================
-- Composição adotada (menor mudança segura):
--   A) is_platform_admin() → true (bypass centralizado, já existia)
--   B) regras legado de escopo (org / contratada / contrato / participante)
--      AND (
--        workspace_id IS NULL  → comportamento atual preservado
--        OR can_access_workspace(workspace_id) → exige ONDE efetivo
--      )
-- Occurrence com Workspace: RBAC (O QUE) continua nas policies/RPCs via
-- has_permission; este helper adiciona o eixo ONDE sem substituir o legado.
-- Occurrence legada (NULL): nenhum filtro Workspace — dados existentes permanecem.

create or replace function public.can_access_occurrence(target_occurrence_id uuid)
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
        or (
          (
            o.organization_id in (select public.current_organization_ids())
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
          and (
            o.workspace_id is null
            or public.can_access_workspace(o.workspace_id)
          )
        )
      )
  );
$$;

comment on function public.can_access_occurrence(uuid) is
  'Escopo de acesso à ocorrência (Gate 13A). Legado: workspace_id NULL → regras org/contrato/participante inalteradas. Com Workspace: mesmas regras AND can_access_workspace. Platform Admin via is_platform_admin(). RBAC (has_permission) permanece nas policies/RPCs. Filhos herdam via occurrence.';
