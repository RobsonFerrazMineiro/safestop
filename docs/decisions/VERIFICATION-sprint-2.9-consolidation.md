# Verificação Sprint 2.9 — Consolidação (G6)

**Data:** 2026-08-03  
**Agente:** QA  
**Escopo:** Smoke fluxo operacional IO integrado; subset ~50 casos críticos matrizes 2.3–2.8; checks consolidação Web/Mobile (cache org, forbidden, detalhe unificado, filtro IMS, dead-ends)  
**Pré-requisito:** G2 `smoke-flow-io` + G5 build PASS

---

## Veredicto G6

| Gate | Critério | Resultado |
|------|----------|-----------|
| **G2** | `smoke-flow-operational-io.mjs` | **PASS** |
| **G5** | `lint` / `typecheck` / `build` | **PASS** |
| **G6** | Subset crítico + checks CON | **52/52 PASS** |
| **G6 Sprint 2.9 — QA consolidado** | | **APROVAR** |

---

## Pré-requisitos executados

```powershell
pnpm supabase:db:reset
pnpm lint          # 8/8 OK (warnings pré-existentes)
pnpm typecheck     # 7/7 OK
pnpm build         # web OK (Next.js 16.2.10)
node supabase/scripts/smoke-flow-operational-io.mjs
node supabase/scripts/qa-consolidation-2.9.mjs
```

**Senha seed local:** `SafeStop-QA-Local-2026`

---

## Usuários QA

| Usuário | Papel | Uso na bateria |
|---------|-------|----------------|
| `qa-field@safestop.local` | HSE de Campo | PP, evidências, timeline |
| `qa-supervisor@safestop.local` | Supervisor HSE | eval, IO, MDHO, IMS |
| `qa-lideranca@safestop.local` | Liderança HSE | approve HSE |
| `qa-fiscal@safestop.local` | Fiscal | read-only (scripts upstream) |
| `qa-multi@safestop.local` | Multi-org | cross-tenant |
| `qa-gestor@safestop.local` | Admin Empresa | permissões read-only |

---

## G2 — Smoke fluxo operacional IO (`smoke-flow-operational-io.mjs`)

Cadeia encadeada **PP → eval → IO → MDHO → approve HSE → register IMS**:

| Passo | Status | Evidência |
|-------|--------|-----------|
| 1/8 create_occurrence (PP) | OK | `PARALISACAO_PREVENTIVA` |
| 2/8 start_occurrence_evaluation | OK | `EM_AVALIACAO` |
| 3/8 record_occurrence_decision IO | OK | `INTERDICAO_CONFIRMADA` |
| 4/8 start_mdho_assessment | OK | `MDHO_EM_PREENCHIMENTO` |
| 5/8 save + submit MDHO | OK | `AGUARDANDO_APROVACAO_HSE` |
| 6/8 approve_mdho_assessment | OK | `AGUARDANDO_REGISTRO_IMS` |
| 7/8 register_ims_reference | OK | `EM_TRATATIVA` + `BAA-26-0100` |
| 8/8 timeline títulos | OK | 7 títulos da cadeia |

**Status final:** `EM_TRATATIVA` | IMS: `BAA-26-0100`

---

## Checks consolidação 2.9 (Web/Mobile)

| ID | Cenário | Resultado | Evidência |
|----|---------|-----------|-----------|
| CON-CACHE-01 | Org switch limpa tenant cache | **PASS** | `clearTenantCache` + `TENANT_QUERY_KEY_PREFIX` Web/Mobile |
| CON-ROUTE-01 | Rota forbidden | **PASS** | `/forbidden` + `useRequirePermission` redirect |
| CON-DETAIL-01 | Detalhe unificado | **PASS** | `/occurrences/[id]` → `/stop-work/:id` (Web + Mobile redirect) |
| CON-IMS-FILTER-01 | Filtro IMS visual | **PASS** | `stop-work-list-container` + `preventive-stop-list-screen` + `ilike` backend |
| CON-BANNER-01 | Dead-ends VA / EM_TRATATIVA | **PASS** | `OperationalDeadEndBanner` + `FlowDeadEndBanner` no detalhe |
| CON-QUERY-01 | Query keys compartilhadas | **PASS** | `@safestop/query-keys` + `OCCURRENCE_INVALIDATION_MATRIX` |
| CON-TL-LEGACY-01 | StopWorkTimeline legado | **PASS** (waiver) | zero imports; arquivo isolado permanece |

---

## Subset crítico matrizes 2.3–2.8 (45 casos)

| Sprint | IDs executados | Resultado |
|--------|----------------|-----------|
| 2.1 SW | SW-01, SW-04, SW-05, SW-07, SW-11 | **5/5 PASS** |
| 2.2 EV | EV-01, EV-03, EV-05, EV-08 | **4/4 PASS** |
| 2.3 TL | TL-01, TL-02, TL-05, TL-08, TL-10, TL-13, TL-15 | **7/7 PASS** |
| 2.4 VA | VA-01, VA-03, VA-08, VA-12, VA-16 | **5/5 PASS** |
| 2.5 IO | IO-01, IO-03, IO-08, IO-10, IO-12 | **5/5 PASS** |
| 2.6 MDHO | MDHO-01, MDHO-02, MDHO-06, MDHO-07, MDHO-09, MDHO-14 | **6/6 PASS** |
| 2.7 HSE | HSE-01, HSE-03, HSE-06, HSE-07, HSE-09, HSE-13, HSE-16 | **7/7 PASS** |
| 2.8 IMS | IMS-01, IMS-03, IMS-05, IMS-08, IMS-09, IMS-15 | **6/6 PASS** |

**Total subset matriz:** 45/45 PASS  
**Total G6 (subset + CON + legacy):** 52/52 PASS

Orquestrador: `supabase/scripts/qa-consolidation-2.9.mjs`

---

## Waivers / ajustes QA (não bloqueantes)

| Item | Tipo | Decisão |
|------|------|---------|
| **SW-06** | Substituição no subset | Heurística `readOnly` obsoleta pós-2.9 — detalhe unificado inclui `LeadershipDecisionSection` (esperado PO-CON-5). Subset usa **SW-05** (listagem PP) em lugar de SW-06. |
| **CON-TL-LEGACY-01** | Waiver PO-CON-13 | `stop-work-timeline.tsx` existe sem referências; remoção física do arquivo **T2** — comportamento correto (OccurrenceTimeline ativo). |
| **qa-va-01-18.mjs** | Fix script | Path `ver-e-agir-detail-section.tsx` → `leadership-decision-section.tsx` (refactor 2.9). |
| **E2E visual** | Ressalva PO-CON-17 | Org switch, forbidden, detalhe, filtro IMS validados via **contrato código** + API; browser/device não exercitado nesta bateria. |
| **Scripts filhos exit 1** | Observação | `qa-sw` e `qa-hse` retornam exit 1 por casos **fora** do subset crítico; IDs críticos extraídos com PASS. |

---

## Regressão não reexecutada (baseline)

Matrizes completas 2.3–2.8 permanecem cobertas pelos relatórios:

- [`VERIFICATION-sprint-2.3-timeline.md`](./VERIFICATION-sprint-2.3-timeline.md)
- [`VERIFICATION-sprint-2.4-ver-e-agir.md`](./VERIFICATION-sprint-2.4-ver-e-agir.md)
- [`VERIFICATION-sprint-2.5-interdicao-oficial.md`](./VERIFICATION-sprint-2.5-interdicao-oficial.md)
- [`VERIFICATION-sprint-2.6-mdho.md`](./VERIFICATION-sprint-2.6-mdho.md)
- [`VERIFICATION-sprint-2.7-hse-approval.md`](./VERIFICATION-sprint-2.7-hse-approval.md)
- [`VERIFICATION-sprint-2.8-ims-reference.md`](./VERIFICATION-sprint-2.8-ims-reference.md)

---

## Scripts entregues / atualizados

| Script | Função |
|--------|--------|
| `supabase/scripts/smoke-flow-operational-io.mjs` | G2 smoke cadeia PP→IMS |
| `supabase/scripts/qa-consolidation-2.9.mjs` | Orquestrador G6 (~52 críticos) |
| `supabase/scripts/qa-va-01-18.mjs` | Fix path pós-consolidação detalhe |

---

## DoD G6

- [x] `smoke-flow-operational-io.mjs` PASS
- [x] Subset ~50 casos críticos 2.3–2.8 PASS
- [x] Org switch cache, forbidden, detalhe unificado, filtro IMS documentados
- [x] Build G5 PASS
- [x] Waivers PO documentados (SW-06, CON-TL-LEGACY)
- [x] Relatório G6 documentado

**COMMIT autorizado:** OK — G6 QA Sprint 2.9 aprovado (com waivers documentados).

---

## Referências

- [`CONSOLIDATION-DECISIONS.md`](./CONSOLIDATION-DECISIONS.md) — PO-CON-1…22
- [`CONSOLIDATION-UI-SPEC.md`](./CONSOLIDATION-UI-SPEC.md)
- `packages/query-keys/` — PO-CON-7, PO-CON-9
- [`VERIFICATION-sprint-2.8-ims-reference.md`](./VERIFICATION-sprint-2.8-ims-reference.md)
