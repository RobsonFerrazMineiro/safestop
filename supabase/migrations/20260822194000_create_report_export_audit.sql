-- ============================================================================
-- SafeStop — Sprint 3.3: report_export_audit
-- ============================================================================
-- Referência: docs/decisions/REPORTS-DECISIONS.md (PO-REP-6, schema completo)
-- Não é AuditLog genérico — escopo estritamente dedicado a exportação de
-- relatórios. Schema copiado exatamente da decisão, sem alteração de nomes.
-- ============================================================================

create table public.report_export_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  exported_by uuid not null references public.profiles (id) on delete restrict,
  report_type text not null,
  export_format text not null,
  filters jsonb not null default '{}'::jsonb,
  row_count integer not null,
  created_at timestamptz not null default now(),

  constraint report_export_audit_report_type_check
    check (report_type in ('OCCURRENCES', 'ACTION_ITEMS', 'AWARENESS')),
  constraint report_export_audit_export_format_check
    check (export_format in ('CSV', 'XLSX')),
  constraint report_export_audit_row_count_check
    check (row_count >= 0)
);

create index report_export_audit_organization_id_created_at_idx
  on public.report_export_audit (organization_id, created_at desc);

comment on table public.report_export_audit is
  'Auditoria de exportações de relatório (Sprint 3.3, PO-REP-6) — não é AuditLog genérico do sistema.';


-- ============================================================================
-- RLS
-- ============================================================================
-- SELECT: apenas report.read (mesma permissão que libera o relatório em si)
-- ou platform admin. INSERT/UPDATE/DELETE diretos por authenticated: não
-- concedidos — escrita exclusiva via log_report_export (SECURITY DEFINER).
-- Sem DELETE nem para SECURITY DEFINER: trilha de auditoria não é apagável
-- nesta sprint (consistente com PO-NOTIF-8, sem exclusão de notificações).

alter table public.report_export_audit enable row level security;

create policy report_export_audit_select on public.report_export_audit
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      organization_id in (select public.current_organization_ids())
      and public.has_permission('report.read', organization_id)
    )
  );

revoke insert, update, delete on public.report_export_audit from authenticated;

grant select on public.report_export_audit to authenticated;


-- ============================================================================
-- log_report_export
-- ============================================================================

create function public.log_report_export(
  p_organization_id uuid,
  p_report_type text,
  p_export_format text,
  p_filters jsonb,
  p_row_count integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_organization_id not in (select public.current_organization_ids())
     and not public.is_platform_admin() then
    raise exception 'ORGANIZATION_NOT_ALLOWED' using errcode = '42501';
  end if;

  if not public.has_permission('report.read', p_organization_id) then
    raise exception 'PERMISSION_DENIED' using errcode = '42501';
  end if;

  insert into public.report_export_audit (
    organization_id, exported_by, report_type, export_format, filters, row_count
  ) values (
    p_organization_id, public.current_profile_id(), p_report_type, p_export_format, p_filters, p_row_count
  );
end;
$$;

comment on function public.log_report_export(uuid, text, text, jsonb, integer) is
  'Registra exportação de relatório (Sprint 3.3, PO-REP-6). Chamado pelo client imediatamente após montar o arquivo com sucesso, antes do download.';

grant execute on function public.log_report_export(uuid, text, text, jsonb, integer) to authenticated;
