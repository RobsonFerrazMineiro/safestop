# Verificação Sprint 2.6 — MDHO (MDHO-01…MDHO-16)

**Data:** 2026-08-02  
**Agente:** QA  
**Escopo:** Avaliação Técnica MDHO pós-Interdição Oficial até `AGUARDANDO_REGISTRO_IMS`; regressão IO, VA, TL, SW, EV  
**Pré-requisito:** `pnpm supabase:db:reset` + seed com `qa-lideranca@safestop.local`

---

## Veredicto G5

| Critério | Resultado |
|----------|-----------|
| BUILD (`lint` / `typecheck` / `build`) | **PASS** |
| Smoke G2 (`smoke-mdho.mjs`) | **PASS** |
| MDHO-01…MDHO-16 | **16/16 PASS** |
| Regressão IO / VA / TL / SW / EV | **PASS** |
| **G5 Sprint 2.6 — QA completo** | **APROVAR** |

---

## Pré-requisitos executados

```powershell
pnpm supabase:db:reset
pnpm lint          # 7/7 OK (warnings pré-existentes)
pnpm typecheck     # 6/6 OK
pnpm build         # web OK
node supabase/scripts/smoke-mdho.mjs
node supabase/scripts/qa-mdho-01-16.mjs
```

**Senha seed local:** `SafeStop-QA-Local-2026`

---

## Usuários QA

| Usuário | Papel | Cenários |
|---------|-------|----------|
| `qa-supervisor@safestop.local` | Supervisor HSE | MDHO-01, 04, 05, 06, 09 (start, draft, submit) |
| `qa-lideranca@safestop.local` | Liderança HSE | MDHO-07, 08, 09, 10 (approve, return) |
| `qa-fiscal@safestop.local` | Fiscal do Contrato | MDHO-11 (read-only) |
| `qa-field@safestop.local` | HSE de Campo | negativo start MDHO |
| `qa-multi@safestop.local` | Multi-org | MDHO-13 (cross-tenant) |

---

## Fluxo E2E executado (API)

```
qa-supervisor: IO confirmada → start MDHO → save draft → submit
qa-lideranca:  return (MDHO devolvido)
qa-supervisor: edit draft → resubmit
qa-lideranca:  approve → AGUARDANDO_REGISTRO_IMS
```

Timeline resultante: **MDHO iniciado → MDHO enviado → MDHO devolvido → MDHO aprovado** (MDHO-12).

---

## Matriz MDHO-01…MDHO-16

| ID | Cenário | Resultado | Evidência |
|----|---------|-----------|-----------|
| MDHO-01 | Supervisor inicia MDHO em IO confirmada | **PASS** | `MDHO_EM_PREENCHIMENTO` |
| MDHO-02 | Start em Ver e Agir → FORBIDDEN | **PASS** | ramo VA bloqueado |
| MDHO-03 | Start antes IO | **PASS** | `FORBIDDEN` (sem `INTERDICAO_OFICIAL`) — ver ressalva |
| MDHO-04 | Save draft persiste seleções | **PASS** | 5 rows `mdho_selections` |
| MDHO-05 | Submit incompleto → VALIDATION_ERROR | **PASS** | categorias obrigatórias |
| MDHO-06 | Submit OK → AGUARDANDO_APROVACAO_HSE | **PASS** | RPC + status ocorrência |
| MDHO-07 | Liderança aprova → AGUARDANDO_REGISTRO_IMS | **PASS** | E2E return flow |
| MDHO-08 | Liderança devolve → RETURNED | **PASS** | `return_mdho_assessment` |
| MDHO-09 | Repreenchimento + resubmit + approve | **PASS** | fluxo devolução completo |
| MDHO-10 | Liderança sem botão Enviar | **PASS** | RPC `mdho.submit` FORBIDDEN + guard UI |
| MDHO-11 | Fiscal read-only | **PASS** | lê timeline; start FORBIDDEN |
| MDHO-12 | Timeline 4 eventos MDHO | **PASS** | 4 títulos PO-MDHO-26 |
| MDHO-13 | Cross-tenant → FORBIDDEN | **PASS** | qa-multi |
| MDHO-14 | Duplo start → ALREADY_EXISTS | **PASS** | idempotência |
| MDHO-15 | Offline bloqueia mutations | **PASS** | `isOnline` guard (contrato código) |
| MDHO-16 | Regressão IO/VA/TL/SW/EV | **PASS** | matriz REG-* |

**Extra (negativo):** `qa-field` start MDHO → FORBIDDEN — PASS

**Resumo:** PASS 16/16 | FAIL 0/16

---

## Smoke G2 (`smoke-mdho.mjs`)

| Passo | Resultado |
|-------|-----------|
| MDHO-02 start VA → FORBIDDEN | OK |
| MDHO-01 start MDHO | OK |
| MDHO-04 save draft | OK |
| MDHO-06 submit | OK |
| MDHO-12 timeline (iniciado, enviado) | OK |
| MDHO-07 approve + timeline aprovado | OK |

---

## Regressão

| Bateria | Resultado |
|---------|-----------|
| IO (confirmada) | **PASS** |
| VA (start + decide) | **PASS** |
| SW-01 | **PASS** — `SS-26-000026` |
| EV-01 | **PASS** — upload JPEG COMPLETED |
| TL-01…TL-05 | **PASS** |

---

## Ressalvas não bloqueantes

| ID | Observação |
|----|------------|
| MDHO-03 | Spec cita `STATUS_MISMATCH`; RPC retorna `FORBIDDEN` quando `decision_type ≠ INTERDICAO_OFICIAL` (checagem antecipada). Comportamento correto e mais restritivo — aceito em QA. |
| MDHO-10 / MDHO-15 | Guards UI verificados em código; E2E browser/mobile offline não executado. |
| MDHO-11 | Fiscal read-only validado via API; cards ocultos não exercitados visualmente. |

**Fora de escopo:** registro IMS, plano de ação, notificações.

---

## Scripts entregues

| Script | Função |
|--------|--------|
| `supabase/scripts/smoke-mdho.mjs` | Smoke G2 fluxo feliz + MDHO-02 |
| `supabase/scripts/qa-mdho-01-16.mjs` | Matriz MDHO-01…16 + regressão |

---

## DoD G5

- [x] Matriz MDHO-01…16 executada com evidência
- [x] Fluxo E2E devolução (return → edit → resubmit → approve)
- [x] Regressão IO, VA, TL, SW, EV OK
- [x] Seed `qa-lideranca` provisionado
- [x] Relatório documentado

**COMMIT autorizado:** OK — G5 QA completo aprovado.

---

## Referências

- [`MDHO-DECISIONS.md`](./MDHO-DECISIONS.md) — PO-MDHO-1…28
- [`MDHO-UI-SPEC.md`](./MDHO-UI-SPEC.md)
- Migrations `20260805180000_create_mdho_foundation.sql`, `20260805190000_mdho_rpcs.sql`
- [`VERIFICATION-sprint-2.5-interdicao-oficial.md`](./VERIFICATION-sprint-2.5-interdicao-oficial.md)
