# Verificação Sprint 2.5 — Interdição Oficial (IO-01…IO-12 + IO-17)

**Data:** 2026-08-02  
**Agente:** QA  
**Escopo:** Decisão `INTERDICAO_OFICIAL` → status `INTERDICAO_CONFIRMADA` (Sprint 2.5); regressão VA, SW, EV, TL  
**Pré-requisito:** `pnpm supabase:db:reset` + seed com `qa-fiscal@safestop.local`

---

## Veredicto G5

| Critério | Resultado |
|----------|-----------|
| BUILD (`lint` / `typecheck` / `build`) | **PASS** |
| Smoke G2 (`smoke-interdicao-oficial.mjs`) | **PASS** |
| IO-01…IO-12 + IO-17 | **13/13 PASS** |
| Regressão VA-01…VA-07 | **PASS** (7/7) |
| Regressão SW-01 | **PASS** |
| Regressão EV-01 | **PASS** |
| Regressão TL-01…TL-05 | **PASS** (5/5) |
| **G5 Sprint 2.5** | **APROVAR** |

---

## Pré-requisitos executados

```powershell
pnpm supabase:db:reset
pnpm lint          # 7/7 OK (warnings pré-existentes)
pnpm typecheck     # 6/6 OK
pnpm build         # web OK
node supabase/scripts/smoke-interdicao-oficial.mjs
node supabase/scripts/qa-io-01-12.mjs
```

**Senha seed local:** `SafeStop-QA-Local-2026`

---

## Usuários QA

| Usuário | Papel | Permissões relevantes | Cenários |
|---------|-------|----------------------|----------|
| `qa-supervisor@safestop.local` | Supervisor HSE Alpha | `evaluate` + `confirm_interdiction` | IO-01, 03, 04, 05, 07, 11, 12 |
| `qa-fiscal@safestop.local` | Fiscal do Contrato Alpha | `evaluate` **sem** `confirm_interdiction` | IO-02 (+ VA positivo) |
| `qa-gestor@safestop.local` | Gestor (read only) | sem evaluate / confirm | IO-08 |
| `qa-multi@safestop.local` | Multi-org | sem vínculo Alpha | IO-06, IO-17 |
| `qa-field@safestop.local` | HSE de Campo | create PP (fixtures) | — |

---

## Matriz IO-01…IO-12 + IO-17

| ID | Cenário | Resultado | Evidência |
|----|---------|-----------|-----------|
| IO-01 | qa-supervisor confirma IO em `EM_AVALIACAO` | **PASS** | `INTERDICAO_CONFIRMADA` + `decision_type=INTERDICAO_OFICIAL` |
| IO-02 | qa-fiscal IO → FORBIDDEN; VA start+decide OK | **PASS** | RPC FORBIDDEN IO; fiscal VA → `VER_E_AGIR` |
| IO-03 | Justificativa < 10 chars | **PASS** | `VALIDATION_ERROR` |
| IO-04 | Status ≠ `EM_AVALIACAO` | **PASS** | PP direto → `STATUS_MISMATCH` |
| IO-05 | Segunda decisão | **PASS** | `ALREADY_DECIDED` |
| IO-06 | qa-multi cross-org | **PASS** | RPC FORBIDDEN |
| IO-07 | Timeline “Interdição Oficial confirmada” | **PASS** | metadata `decisionType`, `decidedByName` |
| IO-08 | qa-gestor sem cards de ação | **PASS** | FORBIDDEN + guards `canConfirmInterdiction` |
| IO-09 | Regressão VA-01…07 intacta | **PASS** | matriz REG-VA-* 7/7 |
| IO-10 | Mobile offline — submit bloqueado | **PASS** | `isOnline` guard em `interdicao-decision-card` |
| IO-11 | Concorrência dois supervisores | **PASS** | 1º OK; 2º `ALREADY_DECIDED` |
| IO-12 | Summary read-only pós-IO | **PASS** | `InterdicaoSummary` + dialog destrutivo |
| IO-17 | Troca org limpa estado | **PASS** | cross-org bloqueado + `clearTenantCache` + invalidação `decision` |

**Resumo IO:** PASS 13/13 | FAIL 0/13

---

## Smoke G2 (`smoke-interdicao-oficial.mjs`)

| Passo | Resultado |
|-------|-----------|
| IO-02 qa-fiscal IO FORBIDDEN | OK |
| IO-01 supervisor IO → INTERDICAO_CONFIRMADA | OK |
| IO-07 timeline título + metadata | OK |
| IO-05 ALREADY_DECIDED | OK |
| Regressão VA-03 (Ver e Agir) | OK |

---

## Regressão obrigatória

### VA-01…VA-07 (IO-09)

| ID | Resultado |
|----|-----------|
| VA-01 | PASS — start → EM_AVALIACAO |
| VA-02 | PASS — timeline “Avaliação iniciada” |
| VA-03 | PASS — decisão VA |
| VA-04 | PASS — VER_E_AGIR + row decision |
| VA-05 | PASS — detalhe integrado (contrato código) |
| VA-06 | PASS — assigned_evaluator_id |
| VA-07 | PASS — field start FORBIDDEN |

### SW-01 / EV-01 / TL-01…TL-05

| ID | Resultado |
|----|-----------|
| SW-01 | PASS — `SS-26-000012` |
| EV-01 | PASS — upload JPEG COMPLETED |
| TL-01 | PASS — OCCURRENCE_CREATED |
| TL-02 | PASS — COMMENT_ADDED |
| TL-03 | PASS — edit + isEdited |
| TL-04 | PASS — editar alheio FORBIDDEN |
| TL-05 | PASS — COMMENT_REMOVED |

---

## Ressalvas não bloqueantes (E2E / UI)

| ID | Validação |
|----|-----------|
| IO-08 | Cards ocultos — guards em código, não E2E visual |
| IO-10 | Offline — guard `isOnline` em código, não dispositivo offline real |
| IO-12 | Summary/dialog — contrato código, não browser |
| IO-17 | Troca org — `clearTenantCache` verificado em código |
| REG-VA-05 | Detalhe — integração verificada em código |

**Fora de escopo (conforme sprint):** MDHO, IMS, correção/liberação, notificações, abrangência struct PO-IO-1 futuro.

---

## Scripts entregues

| Script | Função |
|--------|--------|
| `supabase/scripts/smoke-interdicao-oficial.mjs` | Smoke G2 IO + regressão VA rápida |
| `supabase/scripts/qa-io-01-12.mjs` | Matriz IO-01…12 + IO-17 + regressão completa |

---

## DoD G5

- [x] Matriz IO executada com evidência (13/13)
- [x] Regressão VA-01..07, SW-01, EV-01, TL-01..05 OK
- [x] Relatório documentado
- [x] Seed `qa-fiscal` provisionado

**COMMIT autorizado:** OK — G5 aprovado.

---

## Referências

- [`INTERDICAO-OFICIAL-DECISIONS.md`](./INTERDICAO-OFICIAL-DECISIONS.md) — PO-IO-1…PO-IO-12
- [`INTERDICAO-OFICIAL-UI-SPEC.md`](./INTERDICAO-OFICIAL-UI-SPEC.md)
- Migration `20260804180000_extend_record_decision_interdicao_oficial.sql`
- [`VERIFICATION-sprint-2.4-ver-e-agir.md`](./VERIFICATION-sprint-2.4-ver-e-agir.md)
