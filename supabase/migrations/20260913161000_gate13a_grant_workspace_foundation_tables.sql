-- ============================================================================
-- SafeStop — Gate 13A (complemento): GRANT nas tabelas foundation de Workspace
-- ============================================================================
-- Ressalva Gate 12: RLS foi habilitada com policies, mas faltavam GRANTs de
-- tabela para `authenticated` (padrão de organizations/units). Sem GRANT,
-- policies SELECT nunca são avaliáveis via PostgREST — permission denied.
-- Escrita continua restrita a is_platform_admin() pelas policies.
-- ============================================================================

grant select, insert, update on public.workspaces to authenticated;
grant select, insert, update on public.organization_workspace_links to authenticated;
grant select, insert, update on public.workspace_memberships to authenticated;
