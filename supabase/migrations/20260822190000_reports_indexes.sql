-- ============================================================================
-- SafeStop — Sprint 3.3: índice de suporte ao Relatório de Ocorrências
-- ============================================================================
-- Referência: docs/decisions/REPORTS-DECISIONS.md (PO-REP-3, handoff DATABASE item 4)
-- Nenhuma alteração em schema/RPC existente (Sprint 3.2 permanece intacta).
-- ============================================================================

-- list_occurrences_report (migration seguinte) filtra sempre por
-- organization_id, frequentemente combinado com contract_id (coluna "Contrato"
-- da matriz de colunas, PO-REP-3, item 4 — filtro habilitado) e ordena por
-- created_at/occurred_at por padrão. O índice composto existente
-- occurrences_organization_id_created_at_idx (organization_id, created_at)
-- não cobre eficientemente o filtro adicional por contract_id: sem este
-- índice, o filtro por contrato exigiria varredura completa do índice por
-- organização com filtro residual em contract_id. Este índice permite que o
-- planner satisfaça organization_id + contract_id diretamente e ainda usar
-- created_at para ordenação/paginação sem sort adicional.
create index occurrences_organization_id_contract_id_created_at_idx
  on public.occurrences (organization_id, contract_id, created_at);

comment on index public.occurrences_organization_id_contract_id_created_at_idx is
  'Suporta list_occurrences_report ao filtrar por contract_id dentro de uma organização (Sprint 3.3, PO-REP-3). Validado com EXPLAIN ANALYZE — ver docs/decisions/REPORTS-DECISIONS.md.';
