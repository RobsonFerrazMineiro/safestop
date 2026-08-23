-- ============================================================================
-- SafeStop — Sprint 3.3: correção SEC-REP-H01 (auditoria SECURITY)
-- ============================================================================
-- Achado: resolve_profile_display_name / resolve_organization_display_name /
-- resolve_member_display_name (migration 20260822191000) são SECURITY DEFINER
-- com grant execute directo a authenticated, SEM gate de escopo interno —
-- qualquer usuário autenticado podia chamá-las como RPC pública passando
-- qualquer UUID, bypassando profiles_select/organizations_select (RLS).
--
-- Correção: gate de autorização DENTRO de cada função, sem alterar assinatura
-- (list_occurrences_report/list_action_items_report/list_awareness_report
-- continuam chamando normalmente — todo caller legítimo já satisfaz alguma
-- condição abaixo). Fora do escopo legítimo, retorna null (não lança
-- exceção — mesmo padrão de campo opcional já usado no contrato).
--
-- Não editar as migrations já aplicadas desta sprint (011-ai-behavior.mdc —
-- "Migration Aplicada"): correção via CREATE OR REPLACE em nova migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- resolve_profile_display_name: nome só é retornado quando
--   (a) é o próprio profile (p_profile_id = auth.uid()), ou
--   (b) o chamador é platform admin, ou
--   (c) chamador e alvo compartilham vínculo ativo em pelo menos uma
--       organization_members.organization_id.
-- ----------------------------------------------------------------------------
create or replace function public.resolve_profile_display_name(p_profile_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name
  from public.profiles p
  where p.id = p_profile_id
    and (
      p_profile_id = auth.uid()
      or public.is_platform_admin()
      or exists (
        select 1
        from public.organization_members om_self
        join public.organization_members om_target
          on om_target.organization_id = om_self.organization_id
        where om_self.profile_id = auth.uid()
          and om_self.is_active = true
          and om_target.profile_id = p_profile_id
          and om_target.is_active = true
      )
    );
$$;

comment on function public.resolve_profile_display_name(uuid) is
  'Nome de exibição de um profile para uso em relatórios (Sprint 3.3). Gate (SEC-REP-H01): próprio perfil, platform admin, ou vínculo ativo em organização comum — caso contrário retorna null. Escopo estrito: full_name apenas, sem e-mail/telefone (docs/database.md §5.2).';

-- ----------------------------------------------------------------------------
-- resolve_organization_display_name: nome só é retornado quando
--   (a) a organização alvo está em current_organization_ids() do chamador, ou
--   (b) o chamador é platform admin, ou
--   (c) existe contrato entre alguma organização do chamador e o alvo
--       (mesmo padrão de contracts_select) — caso legítimo atual: nome da
--       contratada em list_occurrences_report.
-- ----------------------------------------------------------------------------
create or replace function public.resolve_organization_display_name(p_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select o.name
  from public.organizations o
  where o.id = p_organization_id
    and (
      p_organization_id in (select public.current_organization_ids())
      or public.is_platform_admin()
      or exists (
        select 1
        from public.contracts c
        where (
          c.client_organization_id = p_organization_id
          and c.contractor_organization_id in (select public.current_organization_ids())
        )
        or (
          c.contractor_organization_id = p_organization_id
          and c.client_organization_id in (select public.current_organization_ids())
        )
      )
    );
$$;

comment on function public.resolve_organization_display_name(uuid) is
  'Nome de exibição de uma organização (ex.: contratada cross-tenant) para uso em relatórios (Sprint 3.3). Gate (SEC-REP-H01): organização do chamador, platform admin, ou contrato entre as partes (mesmo padrão de contracts_select) — caso contrário retorna null. Escopo estrito: name apenas.';

-- ----------------------------------------------------------------------------
-- resolve_member_display_name: nome só é retornado quando a organização do
-- organization_member alvo está em current_organization_ids() do chamador,
-- ou o chamador é platform admin.
-- ----------------------------------------------------------------------------
create or replace function public.resolve_member_display_name(p_organization_member_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name
  from public.organization_members om
  join public.profiles p on p.id = om.profile_id
  where om.id = p_organization_member_id
    and (
      om.organization_id in (select public.current_organization_ids())
      or public.is_platform_admin()
    );
$$;

comment on function public.resolve_member_display_name(uuid) is
  'Nome de exibição do profile associado a um organization_member, para relatórios (Sprint 3.3 — Plano de Ação/Ciência). Gate (SEC-REP-H01): organização do member alvo em current_organization_ids() do chamador, ou platform admin — caso contrário retorna null.';
