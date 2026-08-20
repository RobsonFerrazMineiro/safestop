-- ============================================================================
-- SafeStop — Sprint 3.2: índices para métricas do Dashboard (EXPLAIN comprovado)
-- ============================================================================
-- Referência: relatório arquitetural Sprint 3.2 §33; benchmark local 2026-08-19
-- Volume de teste: 8.000 action_items, 12.000 notifications, 5.000 occurrences
-- (seed sintético local — supabase/scripts/_dashboard-explain-*.sql, não migration)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. action_items — overdueActionItems / dueSoonActionItems
-- ----------------------------------------------------------------------------
-- BEFORE (8k rows, org Alpha):
--   overdueActionItems → Seq Scan on action_items
--     Filter: organization_id + due_at + status NOT IN (COMPLETED,CANCELLED)
--     Execution Time: ~0.81 ms
-- AFTER:
--   overdueActionItems → Bitmap Index Scan on action_items_org_due_open_idx
--     Execution Time: ~0.42 ms
--   dueSoonActionItems → Index Only Scan on action_items_org_due_open_idx
--     Execution Time: ~0.07 ms (antes Seq Scan ~0.85 ms)

create index action_items_org_due_open_idx
  on public.action_items (organization_id, due_at)
  where status not in ('COMPLETED', 'CANCELLED');

comment on index public.action_items_org_due_open_idx is
  'Dashboard: overdueActionItems, dueSoonActionItems (Sprint 3.2 — partial, open items only).';


-- ----------------------------------------------------------------------------
-- 2. notifications — pendingAwarenessOrg (RPC/report.read; índice útil em agregação)
-- ----------------------------------------------------------------------------
-- BEFORE (12k rows):
--   pendingAwarenessOrg → Seq Scan on notifications (~9.667 rows filtradas)
--     Execution Time: ~1.26 ms
-- AFTER (planner escolhe índice em volumes maiores; validado com enable_seqscan=off):
--   Index Only Scan on notifications_org_pending_awareness_idx
--     Execution Time: ~0.73 ms, Heap Fetches: 0
-- Nota: myPendingAwareness já usa notifications_recipient_read_created_idx (Bitmap).

create index notifications_org_pending_awareness_idx
  on public.notifications (organization_id, requires_awareness, awareness_confirmed_at)
  where requires_awareness and awareness_confirmed_at is null;

comment on index public.notifications_org_pending_awareness_idx is
  'Dashboard: pendingAwarenessOrg — ciência pendente agregada por organização (Sprint 3.2).';


-- ----------------------------------------------------------------------------
-- 3. Índices NÃO criados (EXPLAIN não justificou)
-- ----------------------------------------------------------------------------
-- action_items (responsible_member_id, status):
--   myPendingActions / myOverdueActions já usavam action_items_responsible_member_idx
--   (Bitmap Index Scan, ~0.47 ms / ~0.53 ms) — sem Seq Scan relevante.
--
-- occurrences (organization_id, status):
--   organization_id_status_idx já existe (20260715220000).
--   activeOccurrences (~5k rows): Seq Scan ~0.77 ms — aceitável; índice composto adicional
--   não traria ganho proporcional ao custo de manutenção nesta escala.
--   pendingEvaluation / activeInterdictions: Bitmap Index Scan em occurrences_status_idx
--   + filtro organization_id (~0.15–0.32 ms).
--
-- action_plans (organization_id, status):
--   action_plans_org_status_idx já existe; openActionPlans Seq Scan ~0.19 ms em 2k rows.
--
-- mdho_assessments (organization_id, status):
--   idx_mdho_assessments_org_status já cobre mdhoPendingApproval (Bitmap, ~0.04 ms).
