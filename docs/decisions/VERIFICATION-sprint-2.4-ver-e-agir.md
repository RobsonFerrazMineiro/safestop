# Verificação Sprint 2.4 — Ver e Agir (VA-01…VA-18)

**Data:** 2026-08-02  
**Agente:** QA  
**Escopo:** Avaliação da liderança até `VER_E_AGIR` (sub-sprint 2.4); regressão SW-01, EV-01, TL-01…TL-05  
**Pré-requisito:** `pnpm supabase:db:reset` + seed com `qa-supervisor@safestop.local`

---

## Veredicto G4

| Critério | Resultado |
|----------|-----------|
| BUILD (`lint` / `typecheck` / `build`) | **PASS** |
| Smoke G2 (`smoke-ver-e-agir.mjs`) | **PASS** |
| VA-01…VA-18 | **18/18 PASS** |
| Regressão SW-01 | **PASS** |
| Regressão EV-01 | **PASS** |
| Regressão TL-01…TL-05 | **PASS** |
| **G4 Sprint 2.4** | **APROVAR** |

---

## Pré-requisitos executados

```powershell
pnpm supabase:db:reset
pnpm lint          # 7/7 OK (warnings pré-existentes)
pnpm typecheck     # 6/6 OK
pnpm build         # web OK
node supabase/scripts/smoke-ver-e-agir.mjs
node supabase/scripts/qa-va-01-18.mjs
```

**Senha seed local:** `SafeStop-QA-Local-2026`

---

## Usuários QA

| Usuário | Papel | Cenários |
|---------|-------|----------|
| `qa-supervisor@safestop.local` | Supervisor HSE Alpha (`occurrence.evaluate`) | VA-01, 03, 04, 06, 09, 11, 12, 14 |
| `qa-field@safestop.local` | HSE de Campo (sem evaluate) | VA-07 |
| `qa-gestor@safestop.local` | Gestor (read only) | VA-10 |
| `qa-multi@safestop.local` | Multi-org | VA-08, VA-17 |
| `qa-dualrole@safestop.local` | 2º evaluator (Supervisor HSE temporário no script) | VA-11 |

---

## Matriz VA-01…VA-18

| ID | Cenário | Resultado | Evidência |
|----|---------|-----------|-----------|
| VA-01 | qa-supervisor start PP → `EM_AVALIACAO` | **PASS** | `start_occurrence_evaluation` |
| VA-02 | Timeline “Avaliação iniciada” / “Decisão: Ver e Agir” | **PASS** | `get_occurrence_timeline` títulos PO-20 |
| VA-03 | Registrar Ver e Agir com justificativa | **PASS** | `record_occurrence_decision` |
| VA-04 | Status `VER_E_AGIR` + row `occurrence_decisions` | **PASS** | REST + RPC retorno |
| VA-05 | Detalhe web/mobile reflete status | **PASS** | REST + `VerEAgirSummary` / `EvaluationSection` |
| VA-06 | `assigned_evaluator_id` = quem iniciou | **PASS** | `a0000000-0000-4000-8000-000000000009` |
| VA-07 | qa-field sem CTAs evaluate | **PASS** | RPC FORBIDDEN + `canStartEvaluation` |
| VA-08 | qa-multi cross-org start → FORBIDDEN | **PASS** | sem vínculo Alpha |
| VA-09 | Payload `evaluator_id` forjado ignorado | **PASS** | `decided_by = auth.uid()` |
| VA-10 | qa-gestor lê; start FORBIDDEN | **PASS** | timeline OK; evaluate negado |
| VA-11 | 2º usuário start → `STATUS_MISMATCH` | **PASS** | race supervisor vs dualrole |
| VA-12 | Duplo start mesmo evaluator → idempotente | **PASS** | 2ª chamada `success: true` |
| VA-13 | Decisão com status `VER_E_AGIR` → `STATUS_MISMATCH` | **PASS** | fixture SQL |
| VA-14 | Retry após sucesso → `ALREADY_DECIDED` | **PASS** | smoke + matriz |
| VA-15 | Loading states | **PASS** | `isPending` + “Iniciando…” / “Registrando…” (contrato código) |
| VA-16 | Conflict refresh UI | **PASS** | `EvaluationConflictCard` + `isConflict()` (contrato código) |
| VA-17 | Troca org limpa estado | **PASS** | `clearTenantCache` + invalidação `decision` |
| VA-18 | Logout mid-form | **PASS** | `auth-provider` + `clearTenantCache` (contrato código) |

**Resumo:** PASS 18/18 | FAIL 0/18

---

## Smoke G2 (`smoke-ver-e-agir.mjs`)

| Passo | Resultado |
|-------|-----------|
| VA-07 qa-field start FORBIDDEN | OK |
| VA-01 start → EM_AVALIACAO | OK |
| VA-02 timeline “Avaliação iniciada” | OK |
| VA-03/04 record → VER_E_AGIR | OK |
| Timeline “Decisão: Ver e Agir” + metadata | OK |
| VA-14 ALREADY_DECIDED | OK |

---

## Regressão

| ID | Cenário | Resultado |
|----|---------|-----------|
| SW-01 | Criar PP | **PASS** — `SS-26-000018` |
| EV-01 | Upload JPEG | **PASS** — COMPLETED |
| TL-01 | OCCURRENCE_CREATED | **PASS** |
| TL-02 | Comentário topo feed | **PASS** |
| TL-03 | Editar próprio + isEdited | **PASS** |
| TL-04 | Editar alheio FORBIDDEN | **PASS** |
| TL-05 | COMMENT_REMOVED | **PASS** |

---

## Ressalvas não bloqueantes (E2E / UI)

Cenários validados por **API + contrato de código** (sem browser/dispositivo nesta bateria):

| ID | Validação |
|----|-----------|
| VA-05 | Status via REST; UI não exercitada em browser/mobile real |
| VA-07 / VA-10 | CTAs evaluate — guards em código, não E2E visual |
| VA-15 | Loading — `isPending` verificado em código |
| VA-16 | Conflict card — strings/handler verificados em código |
| VA-17 / VA-18 | Cache org/logout — contrato código, não E2E troca org |

**Fora de escopo (conforme sprint):** Interdição Oficial, MDHO, IMS, notificações, correção/liberação.

---

## Scripts entregues

| Script | Função |
|--------|--------|
| `supabase/scripts/smoke-ver-e-agir.mjs` | Smoke G2 fluxo feliz + VA-07, 01, 02, 03/04, 14 |
| `supabase/scripts/qa-va-01-18.mjs` | Matriz completa VA-01…18 + regressão |

---

## DoD Sprint 2.4

- [x] G4: VA-01…VA-18 pass (18/18)
- [x] Regressão SW-01 + EV-01 + TL-01…05 OK
- [x] Relatório pass/fail documentado
- [x] Seed `qa-supervisor` provisionado

**COMMIT autorizado:** OK — G4 aprovado.

---

## Referências

- [`VER-E-AGIR-DECISIONS.md`](./VER-E-AGIR-DECISIONS.md) — PO-1…PO-20
- [`VER-E-AGIR-UI-SPEC.md`](./VER-E-AGIR-UI-SPEC.md) — wireframes e copy VA-C*
- Migration `20260803180000_start_occurrence_evaluation_and_decision.sql`
- Migration `20260803181000_fix_record_decision_conflict_response.sql`
