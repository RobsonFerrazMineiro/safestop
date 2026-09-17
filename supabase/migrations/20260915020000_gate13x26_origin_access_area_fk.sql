-- ============================================================================
-- SafeStop — Fase 3 / Gate 13X.2.6: origin lê a PP + FK simples area
-- ============================================================================
-- Quem originou a PP (origin_organization_id) acessa a row via
-- can_access_occurrence (mesmo estilo contractor). Sem wildcard GERENCIADORA.
-- can_read_occurrence_record inalterado (can_access AND read tenant|origin|contractor).
-- FK occurrences.area_id → areas(id) RESTRICT para embed PostgREST.
-- NÃO recria o composto area×tenant. Trigger 13X.2.1 permanece.
-- ============================================================================


-- ============================================================================
-- 1. can_access_occurrence — eixo origin additive
-- ============================================================================

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
              o.origin_organization_id is not null
              and o.origin_organization_id in (select public.current_organization_ids())
            )
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
  'Escopo de acesso à ocorrência (Gate 13A / 13X.2.6). Legado: org/contratada/contrato/participante. 13X.2.6: origin_organization_id na org atuante (mesmo estilo contractor). Com Workspace: AND can_access_workspace. Sem organization.manage. Sem wildcard GERENCIADORA sobre origin de terceiros. Platform Admin via is_platform_admin().';


-- ============================================================================
-- 2. FK simples occurrences.area_id → areas(id)
-- ============================================================================

alter table public.occurrences
  add constraint occurrences_area_id_fkey
  foreign key (area_id) references public.areas (id) on delete restrict;

comment on constraint occurrences_area_id_fkey on public.occurrences is
  'Gate 13X.2.6: vínculo PostgREST occurrences → areas. Consistência org/WS permanece no trigger validate_occurrence_location_org_workspace (13X.2.1). Sem FK composto tenant.';
