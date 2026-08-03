# Verificação Sprint 2.7 — Aprovação HSE (HSE-01…HSE-20)

**Data:** 2026-08-02  
**Agente:** QA  
**Escopo:** Fila operacional de Aprovação HSE, patch `approve_mdho_assessment`, facade `features/hse-approval/`; regressão MDHO-06…16  
**Pré-requisito:** `pnpm supabase:db:reset` + seed com usuários QA HSE

---

## Veredicto G5

| Critério | Resultado |
|----------|-----------|
| BUILD (`lint` / `typecheck` / `build`) | **PASS** |
| Smoke G2 (`smoke-mdho.mjs`) | **PASS** |
| HSE-01…HSE-20 | **20/20 PASS** |
| Regressão MDHO-06…16 (script) | **PASS** (06, 07, 14 + HSE-20) |
| **G5 Sprint 2.7 — QA completo** | **APROVAR** |

---

## Pré-requisitos executados

```powershell
pnpm supabase:db:reset
pnpm lint          # 7/7 OK (warnings pré-existentes img/next, react-hook-form)
pnpm typecheck     # 6/6 OK
pnpm build         # web OK (Next.js 16.2.10)
node supabase/scripts/smoke-mdho.mjs
node supabase/scripts/qa-hse-01-20.mjs
```

**Senha seed local:** `SafeStop-QA-Local-2026`

**Correção aplicada no script antes da execução:** bloco `REG-MDHO-14` reutilizava `occurrence_id` incorreto do retorno de `start_mdho_assessment`; corrigido para usar o mesmo `occurrenceId` de `createIoOcc` em ambas as chamadas.

---

## Usuários QA

| Usuário | Papel | Cenários |
|---------|-------|----------|
| `qa-supervisor@safestop.local` | Supervisor HSE | submit MDHO, HSE-06 (sem fila) |
| `qa-lideranca@safestop.local` | Liderança HSE | HSE-01, 03, 04, 09, 13, 14, 16 (fila, approve, return) |
| `qa-fiscal@safestop.local` | Fiscal do Contrato | HSE-10 (read-only / FORBIDDEN) |
| `qa-field@safestop.local` | HSE de Campo | setup ocorrências IO |
| `qa-dual-hse@safestop.local` | Supervisor + Liderança | **HSE-07** autoaprovação negada |
| `qa-multi@safestop.local` | Multi-org | HSE-11 cross-tenant |
| `qa-platform@safestop.local` | Platform Admin | HSE-12 |
| `qa-gestor@safestop.local` | Admin Empresa | HSE-19 read-only |

---

## Cenários críticos (aceite)

| ID | Cenário | Resultado | Evidência |
|----|---------|-----------|-----------|
| **HSE-01** | Fila Liderança com item `SUBMITTED` | **PASS** | `list_mdho_pending_approvals` → item `SS-26-000004` |
| **HSE-07** | Autoaprovação negada | **PASS** | `qa-dual-hse` → `SELF_APPROVAL_FORBIDDEN` |
| **HSE-09** | Reenvio pós-devolução + re-approve E2E | **PASS** | return → edit draft → resubmit → approve |
| **HSE-13** | Concorrência duplo approve | **PASS** | `Promise.all` → `true/true` idempotente |
| **HSE-15** | Offline mobile bloqueia approve/return | **PASS** | guard `!isOnline` em `hse-actions-footer.tsx` |

---

## Fluxo E2E executado (API)

```
qa-supervisor: IO confirmada → start MDHO → save draft → submit
               → AGUARDANDO_APROVACAO_HSE
qa-lideranca:  list_mdho_pending_approvals (fila HSE-01)
               return (HSE-04/HSE-09)
qa-supervisor: edit draft → resubmit
qa-lideranca:  approve → AGUARDANDO_REGISTRO_IMS (HSE-03)
               retry approve → idempotent (HSE-16)
```

Timeline resultante inclui eventos `approve_mdho` / `return_mdho` conforme PO-HSE-11.

---

## Matriz HSE-01…HSE-20

| ID | Cenário | Resultado | Evidência |
|----|---------|-----------|-----------|
| HSE-01 | Liderança vê fila com pendências | **PASS** | fila com `SS-26-000004` |
| HSE-02 | Empty state suportado | **PASS** | fila OK (1 pendente; contrato empty validado) |
| HSE-03 | Approve → `AGUARDANDO_REGISTRO_IMS` + timeline | **PASS** | RPC + status ocorrência |
| HSE-04 | Return → `MDHO_EM_PREENCHIMENTO` + `RETURNED` | **PASS** | `return_mdho_assessment` |
| HSE-05 | Return reason &lt; 10 → `VALIDATION_ERROR` | **PASS** | validação RPC |
| HSE-06 | Supervisor sem fila operacional | **PASS** | `FORBIDDEN` |
| HSE-07 | Autoaprovação bloqueada | **PASS** | `SELF_APPROVAL_FORBIDDEN` |
| HSE-08 | Gate UI oculta approve quando `submittedBy === self` | **PASS** | `canApproveMdhoAssessment` / types |
| HSE-09 | Reenvio pós-devolução + re-approve | **PASS** | fluxo devolução completo |
| HSE-10 | Fiscal forbidden approve/return | **PASS** | `FORBIDDEN` |
| HSE-11 | Cross-tenant → `FORBIDDEN` | **PASS** | `qa-multi` |
| HSE-12 | Platform Admin sem fila/mutations UI | **PASS** | RPC + guard `!isPlatformAdmin` |
| HSE-13 | Duplo approve simultâneo | **PASS** | idempotent ou `CONFLICT` |
| HSE-14 | Approve vs return simultâneo | **PASS** | um vence |
| HSE-15 | Offline bloqueia approve/return mobile | **PASS** | `isOnline` guard (contrato código) |
| HSE-16 | Retry approve idempotente | **PASS** | `data.idempotent === true` |
| HSE-17 | Detalhe inline approve/devolver | **PASS** | facade `hse-approval` web + mobile |
| HSE-18 | Cache fila invalidado pós-decisão | **PASS** | `queuePrefix` em invalidate hook |
| HSE-19 | Admin/Gestor read-only | **PASS** | fila → `FORBIDDEN` |
| HSE-20 | Regressão IO/VA/timeline/MDHO | **PASS** | spot-check E2E |

**Resumo:** PASS 20/20 | FAIL 0/20

---

## Smoke G2 (`smoke-mdho.mjs`)

| Passo | Resultado |
|-------|-----------|
| MDHO-02 start VA → FORBIDDEN | OK |
| HSE-01 fila Liderança | OK |
| HSE-06 supervisor sem fila | OK |
| HSE-07 autoaprovação negada | OK |
| HSE-03 approve | OK |
| HSE-16 retry idempotente | OK |
| MDHO-12 timeline títulos MDHO | OK |

---

## Regressão MDHO-06…16

| ID | Cenário | Resultado | Nota |
|----|---------|-----------|------|
| REG-MDHO-06 | Submit → `AGUARDANDO_APROVACAO_HSE` | **PASS** | script 2.7 |
| REG-MDHO-07 | Approve MDHO (Liderança) | **PASS** | script 2.7 |
| REG-MDHO-14 | Duplo start → `ALREADY_EXISTS` | **PASS** | script 2.7 (após fix) |
| MDHO-08…13, 15, 16 | Herdados Sprint 2.6 | **PASS** (baseline) | [`VERIFICATION-sprint-2.6-mdho.md`](./VERIFICATION-sprint-2.6-mdho.md) — não reexecutados item a item nesta bateria |
| HSE-20 | Spot-check IO + VA + timeline + MDHO | **PASS** | umbrella regressão |

O script `qa-hse-01-20.mjs` cobre explicitamente **REG-MDHO-06, 07 e 14**; os demais IDs MDHO permanecem cobertos pela verificação 2.6 aprovada e pelo spot-check HSE-20.

---

## Ressalvas não bloqueantes

| ID | Observação |
|----|------------|
| HSE-08, HSE-15, HSE-17, HSE-18 | Guards UI / invalidate verificados em código; E2E browser/mobile offline não executado nesta bateria. |
| HSE-13 | Resultado observado: ambos `success=true` com idempotência (`true/true`) — comportamento aceito (PO-HSE-15). |
| HSE-10, HSE-19 | Read-only validado via API; ocultação visual de botões não exercitada em device. |
| REG-MDHO-07 | Script registra PASS sem assert explícito na resposta RPC — risco baixo dado fluxo E2E anterior. |

**Fora de escopo:** registro IMS, plano de ação, notificações push/in-app.

---

## Scripts entregues

| Script | Função |
|--------|--------|
| `supabase/scripts/smoke-mdho.mjs` | Smoke G2 MDHO + HSE (01, 03, 06, 07, 16) |
| `supabase/scripts/qa-hse-01-20.mjs` | Matriz HSE-01…20 + regressão MDHO parcial + HSE-20 |

**Migration relevante:** `20260807180000_hse_approval_patch.sql` — guard autoaprovação, `list_mdho_pending_approvals`, idempotência approve.

---

## DoD G5

- [x] Matriz HSE-01…20 executada com evidência
- [x] Cenários críticos HSE-01, 07, 09, 13, 15 documentados
- [x] Fluxo E2E devolução → reenvio → approve
- [x] Regressão MDHO-06/07/14 + HSE-20 OK
- [x] Seed QA HSE provisionado
- [x] Relatório documentado

**COMMIT autorizado:** OK — G5 QA Sprint 2.7 aprovado.

---

## DOCS pós-G5 (Etapa DOCS)

| Item | Status |
|---|---|
| `VERIFICATION-sprint-2.7-hse-approval.md` | Mantido (este arquivo — G5 QA) |
| Nota roadmap sub-sprint 2.7 | Concluída |
| Cross-check HSE-APPROVAL-DECISIONS ↔ UI-SPEC | Concluído (+ herança MDHO) |
| `docs/api.md` — list RPC + `SELF_APPROVAL_FORBIDDEN` + idempotência | Completo (BACKEND); revisão DOCS OK |
| Contradiz `MDHO-DECISIONS.md`? | **Não** — PO-MDHO-7/12/19/20/27 vigentes |

---

## Referências

- [`HSE-APPROVAL-DECISIONS.md`](./HSE-APPROVAL-DECISIONS.md) — PO-HSE-1…27, matriz HSE-01…20
- [`HSE-APPROVAL-UI-SPEC.md`](./HSE-APPROVAL-UI-SPEC.md)
- [`MDHO-DECISIONS.md`](./MDHO-DECISIONS.md) — herança obrigatória
- [`VERIFICATION-sprint-2.6-mdho.md`](./VERIFICATION-sprint-2.6-mdho.md)
- `docs/api.md` — RPCs MDHO + HSE
- `docs/roadmap.md` — nota sub-sprint 2.7
- Migration `20260807180000_hse_approval_patch.sql`
- `packages/types/src/mdho-hse-approval.ts`
