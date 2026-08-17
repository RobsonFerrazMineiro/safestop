# Verificação Sprint 3.0 — Plano de Ação (AP-QA-01…AP-QA-17)

**Data:** 2026-08-07  
**Agente:** QA  
**Escopo:** Plano de Ação pós-IMS em ramo IO (`EM_TRATATIVA`); RPCs `create_action_plan`, itens, validação HSE, evidências CRITICAL; regressão smoke-flow-io + IMS + HSE  
**Pré-requisito:** `pnpm supabase:db:reset` + migrations action plan + seed QA

---

## Veredicto G5

| Critério | Resultado |
|----------|-----------|
| BUILD (`lint` / `typecheck` / `build`) | **PASS** |
| Smoke G2 (`smoke-action-plan.mjs`) | **PASS** |
| Regressão `smoke-flow-operational-io.mjs` | **PASS** |
| Regressão `smoke-mdho.mjs` (HSE) | **PASS** |
| Regressão `smoke-ims-reference.mjs` | **PASS** |
| AP-QA-01…AP-QA-17 | **17/17 PASS** |
| **G5 Sprint 3.0 — QA completo** | **APROVAR** |

---

## Pré-requisitos executados

```powershell
pnpm supabase:db:reset
pnpm lint          # 8/8 OK (warnings pré-existentes)
pnpm typecheck     # 7/7 OK
pnpm build         # web OK (Next.js 16.2.10)
node supabase/scripts/smoke-flow-operational-io.mjs
node supabase/scripts/smoke-mdho.mjs
node supabase/scripts/smoke-ims-reference.mjs
node supabase/scripts/smoke-action-plan.mjs
node supabase/scripts/qa-action-plan-01-17.mjs
```

**Senha seed local:** `SafeStop-QA-Local-2026`

**Migrations aplicadas:** `20260809180000_create_action_plan_foundation.sql`, `20260809190000_action_plan_rpcs.sql`, `20260809200000_action_plan_timeline_patch.sql`

---

## Usuários QA

| Usuário | Papel | Cenários |
|---------|-------|----------|
| `qa-supervisor@safestop.local` | Supervisor HSE | AP-QA-01, 07, 11, 12 (create, CRITICAL, complete) |
| `qa-lideranca@safestop.local` | Liderança HSE | AP-QA-08, 09 (validate/reject) |
| `qa-field@safestop.local` | HSE de Campo | AP-QA-06 (responsável start/submit) |
| `qa-fiscal@safestop.local` | Fiscal do Contrato | AP-QA-05, 15 (read-only) |
| `qa-dual-hse@safestop.local` | Supervisor + Liderança | AP-QA-10 (self-validation) |
| `qa-multi@safestop.local` | Multi-org | AP-QA-14 (cross-tenant) |

---

## Fluxo E2E executado (API)

```
qa-field + qa-supervisor: PP → IO → MDHO submit
qa-lideranca:             approve MDHO → AGUARDANDO_REGISTRO_IMS
qa-supervisor:            register IMS → EM_TRATATIVA
qa-supervisor:            create_action_plan (OPEN)
qa-supervisor:            add_action_item (MEDIUM + CRITICAL + HIGH)
qa-field:                 start + submit MEDIUM → AWAITING_VALIDATION
qa-lideranca:             validate COMPLETED
qa-supervisor:            CRITICAL submit sem evidência → VALIDATION_ERROR → upload → submit
qa-dual-hse:              submit + self-validate → SELF_VALIDATION_FORBIDDEN
qa-lideranca:             validate dual item + CRITICAL
qa-lideranca:             reject item → IN_PROGRESS → cancel
qa-supervisor:            complete_action_plan → plan COMPLETED
                            ocorrência permanece EM_TRATATIVA
```

Timeline: kinds `ACTION_PLAN_CREATED`, `ACTION_ITEM_CREATED`, `ACTION_ITEM_STATUS_CHANGED`, `ACTION_ITEM_EVIDENCE_ADDED`, `ACTION_PLAN_COMPLETED`.

---

## Matriz AP-QA-01…AP-QA-17

| ID | Cenário | Resultado | Evidência |
|----|---------|-----------|-----------|
| AP-QA-01 | Supervisor cria plano EM_TRATATIVA IO com IMS | **PASS** | `create_action_plan` → status `OPEN` |
| AP-QA-02 | Create em VER_E_AGIR → FORBIDDEN | **PASS** | ramo VA bloqueado |
| AP-QA-03 | Create sem IMS → STATUS_MISMATCH | **PASS** | IO sem register IMS |
| AP-QA-04 | Segundo plano ativo → idempotente / CONFLICT | **PASS** | mesmo `plan_id` retornado |
| AP-QA-05 | add_action_item sem manage → FORBIDDEN | **PASS** | `qa-fiscal` |
| AP-QA-06 | Responsável start + submit → AWAITING_VALIDATION | **PASS** | `qa-field` MEDIUM |
| AP-QA-07 | CRITICAL submit sem evidência → VALIDATION_ERROR | **PASS** | evidência obrigatória |
| AP-QA-08 | HSE valida → COMPLETED | **PASS** | `validate_action_item` |
| AP-QA-09 | HSE rejeita com motivo → IN_PROGRESS | **PASS** | outcome `REJECTED` |
| AP-QA-10 | Self-validation → SELF_VALIDATION_FORBIDDEN | **PASS** | `qa-dual-hse` |
| AP-QA-11 | complete_action_plan PO-AP-11 | **PASS** | itens COMPLETED/CANCELLED |
| AP-QA-12 | Ocorrência permanece EM_TRATATIVA após complete | **PASS** | sem transição ocorrência |
| AP-QA-13 | Timeline kinds ACTION_* | **PASS** | 5 kinds; sem STATUS_CHANGED extra |
| AP-QA-14 | Cross-tenant → FORBIDDEN | **PASS** | `qa-multi` |
| AP-QA-15 | Fiscal read-only | **PASS** | create + validate FORBIDDEN |
| AP-QA-16 | Offline bloqueia mutations mobile | **PASS** | `!isOnline` em section + submit sheet |
| AP-QA-17 | Regressão smoke-flow-io + IMS + HSE | **PASS** | cadeia upstream + fila HSE |

**Resumo:** PASS 17/17 | FAIL 0/17

---

## Smoke G2 (`smoke-action-plan.mjs`)

| Passo | Resultado |
|-------|-----------|
| AP-QA-02 VA FORBIDDEN | OK |
| AP-QA-03 sem IMS | OK |
| AP-QA-01 create plano | OK |
| AP-QA-04 idempotente | OK |
| AP-QA-05 fiscal add | OK |
| AP-QA-06/08 submit + validate | OK |
| AP-QA-07 CRITICAL evidência | OK |
| AP-QA-10 self-validation | OK |
| AP-QA-09 reject | OK |
| AP-QA-11/12 complete | OK |
| AP-QA-13 timeline ACTION_* | OK |
| AP-QA-14 cross-tenant | OK |

---

## Regressão upstream

| Script | Resultado |
|--------|-----------|
| `smoke-flow-operational-io.mjs` | **PASS** — PP→IMS, status `EM_TRATATIVA` |
| `smoke-mdho.mjs` | **PASS** — HSE-01/03/06/07/16, MDHO-12 |
| `smoke-ims-reference.mjs` | **PASS** — IMS-01…11, IMS-08 |

---

## Ressalvas não bloqueantes

| ID | Observação |
|----|------------|
| AP-QA-01 | Status inicial do plano é **`OPEN`** (não `IN_PROGRESS`) — alinhado a `packages/types/src/action-plan.ts`. |
| AP-QA-04 | Implementação retorna **idempotência** (mesmo plano) em vez de `ALREADY_EXISTS` — comportamento aceito (PO-AP-12). |
| AP-QA-16 | Guard offline validado em código; E2E device offline não executado. |
| AP-QA-17 | Spot-check da cadeia upstream; não reexecuta smokes completos dentro do script QA. |

**Fora de escopo:** liberação ocorrência, notificações, dashboard SLA, offline queue persistente.

---

## Scripts entregues / atualizados

| Script | Função |
|--------|--------|
| `supabase/scripts/smoke-action-plan.mjs` | Smoke G2 fluxo feliz AP |
| `supabase/scripts/qa-action-plan-01-17.mjs` | Matriz AP-QA-01…17 + regressão |

---

## DoD G5

- [x] Matriz AP-QA-01…17 executada com evidência
- [x] Fluxo E2E create → itens → validate → complete
- [x] Regressão smoke-flow-io + IMS + HSE PASS
- [x] Seed QA provisionado
- [x] Relatório documentado

**COMMIT autorizado:** OK — G5 QA Sprint 3.0 aprovado.

---

## Verificação DOCS pós-G5 (Etapa 6)

**Data:** 2026-08-17  
**Agente:** DOCS  
**Escopo:** Fechamento documentação Sprint 3.0 após QA G5

| Documento | Atualização | Status |
|-----------|-------------|--------|
| `docs/roadmap.md` | Nota sub-sprint 3.0 vs Sprint 7; núcleo IO na 3.0 | ✅ |
| `docs/workflow.md` §5.8 | Plano operacional 3.0; dead-end pós-`COMPLETED` (PO-AP-12); supersede dead-end 2.9 | ✅ |
| `docs/database.md` §6.2 | `action_plan.*` operacional (3.0) | ✅ |
| `docs/database.md` §35 | Pendências #14–#15 IMS→plano fechadas | ✅ |
| `docs/api.md` | Catálogo 2.0–3.0 + RPCs faltantes (`add`/`start`/`complete` + anexos) | ✅ |
| `docs/decisions/ACTION-PLAN-DECISIONS.md` | Fonte PO-AP-1…19; PO-AP-12 inalterado | ✅ (referência) |
| `docs/decisions/ACTION-PLAN-UI-SPEC.md` | UI alinhada QA AP-QA-16 offline | ✅ (referência) |

**Cross-check PO-AP-12:** documentação oficial confirma — após `complete_action_plan`, ocorrência **não** transita para `AGUARDANDO_VALIDACAO`; RPC `submit_action_plan_for_occurrence_validation` permanece **fora** 3.0.

**IMS:** registro manual obrigatório **antes** do plano (PO-AP-1); **sem** integração, consulta ou validação externa.

**G6 DOCS Sprint 3.0:** **APROVADO** — documentação consistente com decisões e verificação QA.

---

## Referências

- [`ACTION-PLAN-DECISIONS.md`](./ACTION-PLAN-DECISIONS.md) — PO-AP-1…, matriz AP-QA-01…17
- [`ACTION-PLAN-UI-SPEC.md`](./ACTION-PLAN-UI-SPEC.md)
- [`VERIFICATION-sprint-2.9-consolidation.md`](./VERIFICATION-sprint-2.9-consolidation.md)
- Migrations `20260809180000_*`, `20260809190000_*`, `20260809200000_*`
- `packages/types/src/action-plan.ts`
