# Decisões — Aprovação HSE (Sprint 2.7)

**Status:** `APROVADO`  
**Sprint:** 2.7 — Aprovação HSE (sub-entrega incremental sobre MDHO 2.6)  
**Data:** 2026-08-02  
**Etapa:** 0 — Produto (agente MASTER / DOCS)  
**Gate:** **G0 desbloqueado** — libera DATABASE (patch RPC + fila) e UIUX (spec)

**Arquitetura base:** Sprint 2.7 — Aprovação HSE (2026-08-02, aprovada)

**Fundação:** Sprint 2.0 (Occurrences) + 2.1 (PP) + 2.2 (Evidências) + 2.3 (Timeline) + 2.4 (Ver e Agir) + 2.5 (Interdição Oficial) + **2.6 (MDHO)**

**Modelo de dados:** `docs/database.md` §14.4 — **não reescrever**; este documento referencia e complementa.

**Decisões MDHO herdadas:** [`MDHO-DECISIONS.md`](./MDHO-DECISIONS.md) — PO-MDHO-6, PO-MDHO-7, PO-MDHO-11, PO-MDHO-12, PO-MDHO-19, PO-MDHO-20, PO-MDHO-27 **permanecem vigentes**.

**Spec UI:** [`HSE-APPROVAL-UI-SPEC.md`](./HSE-APPROVAL-UI-SPEC.md)

**Relação roadmap:** `docs/roadmap.md` Sprint 6 = fluxo IO completo. A **sub-sprint 2.7** antecipa a **fase operacional de Aprovação HSE** (fila, segregação, UX dedicada) **sobre** a base MDHO 2.6 — **sem** IMS, notificações, plano de ação ou encerramento.

**Relação 2.6:** `MDHO-DECISIONS.md` entregou `submit_mdho_assessment`, `approve_mdho_assessment`, `return_mdho_assessment` e `MdhoReviewPanel` inline. A 2.7 **formaliza, endurece e operacionaliza** a Aprovação HSE — **não reimplementa** o domínio MDHO.

---

## Objetivo

Registrar as decisões de produto **PO-HSE-1 a PO-HSE-27** da Sprint 2.7 **sem inventar regra de negócio**, usando como fonte primária:

- arquitetura Sprint 2.7;
- `docs/workflow.md` §5.6–5.7, §17, §19, §22, §26;
- `docs/database.md` §14.4, §21;
- `docs/design-system.md` (fluxo PP→…→MDHO→**Aprovação HSE**→IMS);
- `docs/decisions/RBAC-MATRIX-APPROVED.md`;
- `docs/decisions/MDHO-DECISIONS.md`;
- `docs/decisions/MDHO-UI-SPEC.md` (MDHO-REVIEW, copy approve/return).

---

## Decisão arquitetural central (não redesenhar)

| Item | Decisão |
|---|---|
| **Entidade** | **Nenhuma nova** — Aprovação HSE = transição em **`mdho_assessments`** + status da ocorrência |
| **O que é aprovado** | **Avaliação Técnica MDHO** (`mdho_assessments`) |
| **Tabela `hse_approvals`** | **Não criar** |
| **Permissão `hse.approve`** | **Não criar** — usar **`mdho.approve`** / **`mdho.return`** |
| **Rejeição formal** | **Não existe** status `REJECTED` — **devolução** (`RETURNED`) é o caminho de não-aprovação |
| **RPCs existentes (2.6)** | `submit_mdho_assessment()` · `approve_mdho_assessment()` · `return_mdho_assessment()` |
| **RPC nova (2.7)** | `list_mdho_pending_approvals(p_organization_id uuid)` — fila operacional |
| **Patch RPC (2.7)** | `approve_mdho_assessment()` — guard **autoaprovação** (PO-HSE-7) |
| **Feature UI** | **`features/hse-approval/`** — facade sobre `features/mdho/` (web + mobile) |
| **Pós-aprovação** | `AGUARDANDO_REGISTRO_IMS` — **não encerra** a ocorrência |
| **Notificações** | **Proibidas** na 2.7 (Sprint 3) |

### Fase Aprovação HSE (contexto)

```text
submit_mdho_assessment() [mdho.submit — Supervisor HSE]
        ↓
AGUARDANDO_APROVACAO_HSE  (assessment SUBMITTED)    ← entrada Sprint 2.7
        ├─ approve_mdho_assessment() [mdho.approve — Liderança HSE]
        │       ↓
        │  AGUARDANDO_REGISTRO_IMS  (assessment APPROVED)  ← IMS fora 2.7
        │
        └─ return_mdho_assessment() [mdho.return + return_reason]
                ↓
        MDHO_EM_PREENCHIMENTO  (assessment RETURNED)
                → save draft → submit (loop — regressão MDHO-09)
```

---

## Gate G0

| Item | Estado |
|---|---|
| **G0 — Etapa 0 PO** | **Desbloqueado** (2026-08-02) |
| **Desbloqueia** | DATABASE (patch approve + list RPC) e UIUX (`HSE-APPROVAL-UI-SPEC.md`) |
| **Critério** | PO-HSE-1…PO-HSE-27 críticos sem ambiguidade |
| **Paralelo permitido** | UIUX spec ∥ DATABASE após G0 |

Ordem oficial: **Etapa 0 DOCS → UIUX ∥ DATABASE → BACKEND → WEB ∥ MOBILE → BUILD → SECURITY ∥ QA → DOCS → COMMIT**.

---

## Decisões aprovadas

### PO-HSE-1 — Quem submete o MDHO para aprovação?

| Item | Decisão |
|---|---|
| **Permissão** | `mdho.submit` |
| **Papel** | **Supervisor HSE** (`RBAC-MATRIX-APPROVED.md`) |
| **RPC** | `submit_mdho_assessment()` — **já entregue 2.6** |
| **2.7** | Regressão apenas — **não alterar** semântica |

---

### PO-HSE-2 — Quem aprova o MDHO?

| Item | Decisão |
|---|---|
| **Permissão** | `mdho.approve` |
| **Papel** | **Liderança HSE** |
| **RPC** | `approve_mdho_assessment()` — patch segregação na 2.7 |
| **Múltiplos aprovadores** | **Não** no MVP |

---

### PO-HSE-3 — Quem devolve o MDHO?

| Item | Decisão |
|---|---|
| **Permissão** | `mdho.return` |
| **Papel** | **Liderança HSE** |
| **Justificativa** | **Obrigatória** — `return_reason` 10–4000 chars (`workflow.md` §5.6) |

---

### PO-HSE-4 — Existe “rejeição” formal?

| Item | Decisão |
|---|---|
| **Status `REJECTED`** | **Não criar** |
| **Caminho de não-aprovação** | **Devolução** (`RETURNED`) com correção e reenvio |
| **Copy UX** | **“Devolver MDHO”** — **não** “Rejeitar” |

---

### PO-HSE-5 — Rejeição como conceito de produto?

| Item | Decisão |
|---|---|
| **Modelo** | Devolução = “não aprovado **com correção**” |
| **Rejeição permanente** | **Fora** escopo — sem encerramento por MDHO reprovado |

---

### PO-HSE-6 — Aprovação HSE é obrigatória?

| Item | Decisão |
|---|---|
| **Ramo IO** | **Sim** — não avança para IMS sem aprovação (`workflow.md` §5.6–5.7) |
| **Ver e Agir** | **N/A** — MDHO não aplicável |

---

### PO-HSE-7 — Autoaprovação (mesmo usuário submit + approve)?

| Item | Decisão |
|---|---|
| **Bloqueio** | **Sim** — RPC `approve_mdho_assessment` deve rejeitar quando `submitted_by = auth.uid()` |
| **Código erro** | `SELF_APPROVAL_FORBIDDEN` |
| **Mensagem UX** | “Quem enviou o MDHO não pode aprová-lo.” |
| **Gate UI** | Ocultar approve quando `submittedBy === currentUserId` (defesa em profundidade) |
| **Exceção auditável** | **Não** no MVP |

---

### PO-HSE-8 — Segregação de função

| Item | Decisão |
|---|---|
| **Por papel RBAC** | Submit (`mdho.submit`) ≠ Approve/Return (`mdho.approve`/`return`) |
| **Por usuário** | Guard PO-HSE-7 quando mesmo usuário acumula papéis |
| **Liderança preencheu, Supervisor submeteu** | **Permitido** — segregação submit/approve por operação |
| **Liderança tenta submit** | **Bloqueado** — PO-MDHO-27 (sem `mdho.submit` na matriz Liderança) |

---

### PO-HSE-9 — Múltiplos níveis de aprovação?

| Item | Decisão |
|---|---|
| **MVP** | **Não** — um nível (Liderança HSE) |
| **Revisor intermediário** | **Fora** — PO-MDHO-6 |

---

### PO-HSE-10 — Justificativa na aprovação?

| Item | Decisão |
|---|---|
| **Campo obrigatório** | **Não** |
| **UX** | Dialog de **confirmação** suficiente (“A avaliação ficará imutável”) |

---

### PO-HSE-11 — Impacto no status da ocorrência?

| Item | Decisão |
|---|---|
| **Approve** | `AGUARDANDO_APROVACAO_HSE` → `AGUARDANDO_REGISTRO_IMS` |
| **Return** | `AGUARDANDO_APROVACAO_HSE` → `MDHO_EM_PREENCHIMENTO` |
| **Implementação** | **Já atômica** nas RPCs 2.6 — regressão na 2.7 |

---

### PO-HSE-12 — Quem vê a fila de pendências?

| Item | Decisão |
|---|---|
| **Permissão fila** | **`mdho.approve`** exclusivamente |
| **RPC `list_mdho_pending_approvals`** | Retorna assessments `SUBMITTED` + ocorrências `AGUARDANDO_APROVACAO_HSE` |
| **Supervisor / Fiscal / Gestor** | **Não** veem fila operacional — podem ver detalhe read-only com `occurrence.read` |
| **Admin Empresa** | Read-only conforme escopo — **sem** approve/return |

---

### PO-HSE-13 — UX pós-aprovação

| Item | Decisão |
|---|---|
| **Status** | `AGUARDANDO_REGISTRO_IMS` |
| **Hint IMS** | Exibir texto informativo — **sem CTA** de registro IMS (PO-MDHO-19) |
| **Encerramento** | **Não** — aprovação **não conclui** ocorrência |

---

### PO-HSE-14 — Reenvio após devolução?

| Item | Decisão |
|---|---|
| **Fluxo** | `RETURNED` → edição → `submit_mdho_assessment()` → novo ciclo SUBMITTED |
| **2.7** | **Regressão** MDHO-09 obrigatória |

---

### PO-HSE-15 — Idempotência do approve?

| Item | Decisão |
|---|---|
| **Retry pós-sucesso** | Se assessment já `APPROVED` pelo mesmo fluxo, retornar **sucesso idempotente** (não `CONFLICT`) |
| **Implementação** | Patch opcional recomendado em `approve_mdho_assessment` |

---

### PO-HSE-16 — Reabertura pós-APPROVED?

| Item | Decisão |
|---|---|
| **Decisão** | **Proibido** — PO-MDHO-12 |
| **Trigger** | `prevent_mdho_assessment_mutation_when_approved` (2.6) — manter |

---

### PO-HSE-17 — Cancelamento durante análise?

| Item | Decisão |
|---|---|
| **2.7** | **Fora** escopo |

---

### PO-HSE-18 — Platform Admin

| Item | Decisão |
|---|---|
| **UI operacional** | **Sem** botões approve/return/fila (`!isPlatformAdmin`) |
| **RPC** | Valida permissões reais — não bypass por ser admin plataforma |

---

### PO-HSE-19 — Admin Empresa

| Item | Decisão |
|---|---|
| **Fila / approve / return** | **Sem** permissões MDHO approve/return na matriz |
| **Leitura** | `occurrence.read` + escopo — detalhe read-only |

---

### PO-HSE-20 — Assinatura digital?

| Item | Decisão |
|---|---|
| **2.7** | **Fora** escopo |

---

### PO-HSE-21 — Evidência obrigatória durante revisão?

| Item | Decisão |
|---|---|
| **2.7** | **Não** exigir novas evidências na revisão |
| **Contexto** | Evidências da ocorrência **read-only** no painel |

---

### PO-HSE-22 — Comentário técnico separado?

| Item | Decisão |
|---|---|
| **Campo adicional** | **Não criar** |
| **Devolução** | Apenas `return_reason` (10–4000) |
| **Comentários timeline** | Módulo existente — **não** substituir `return_reason` |

---

### PO-HSE-23 — Mobile deep link para revisão?

| Item | Decisão |
|---|---|
| **Opcional 2.7** | Query `?section=mdho-review` no detalhe da ocorrência |
| **Obrigatório** | Fila → tap → detalhe com scroll até revisão MDHO |

---

### PO-HSE-24 — Offline

| Item | Decisão |
|---|---|
| **Mutations approve/return** | **Bloqueadas** offline (PO-MDHO-25) |
| **Feedback** | Toast “Sem conexão — ação não enviada” — **sem** optimistic |

---

### PO-HSE-25 — SLA / escalonamento?

| Item | Decisão |
|---|---|
| **2.7** | **Fora** escopo |

---

### PO-HSE-26 — Feature separada vs inline em mdho?

| Item | Decisão |
|---|---|
| **Estrutura** | **`features/hse-approval/`** web + mobile — facade sobre `mdho` |
| **Detalhe ocorrência** | Revisão inline — import de componentes `hse-approval` |
| **Duplicação** | **Proibida** — reutilizar services/hooks approve/return de `mdho` |

---

### PO-HSE-27 — Relação com Sprint 2.6

| Item | Decisão |
|---|---|
| **Escopo 2.7** | **Incremental** — fila, segregação, UX, QA |
| **Proibido** | Reimplementar RPCs MDHO, duplicar mappers, criar entidade paralela |
| **MdhoReviewPanel** | Refatorar para consumir `hse-approval` — **não** duplicar lógica |

---

## Dados (existentes — não duplicar)

Campos em `mdho_assessments` (`docs/database.md` §14.4):

```text
submitted_by, submitted_at      — submissão para aprovação HSE
approved_by, approved_at        — aprovação HSE
returned_by, returned_at        — devolução HSE
return_reason                   — justificativa obrigatória na devolução
status                          — SUBMITTED | APPROVED | RETURNED
```

**Não criar:** `reviewed_by`, `decision`, `technical_comment`, `hse_approval_id`.

### Read model fila (consulta — sem persistência)

```typescript
MdhoPendingApprovalItem {
  occurrenceId, organizationId, assessmentId,
  submittedAt, submittedBy, submittedByName,
  areaName?, taskSummary?, criticality?
}
```

---

## RPCs

### Reutilizar (2.6)

| RPC | Escopo 2.7 |
|---|---|
| `submit_mdho_assessment(uuid)` | Regressão |
| `approve_mdho_assessment(uuid)` | **Patch** PO-HSE-7 + PO-HSE-15 |
| `return_mdho_assessment(jsonb)` | Manter; validar `return_reason` 10–4000 |

### Nova (2.7)

#### `list_mdho_pending_approvals(p_organization_id uuid)`

| Item | Regra |
|---|---|
| **Permissão** | `mdho.approve` |
| **Filtro** | `assessment.status = 'SUBMITTED'` AND `occurrence.status = 'AGUARDANDO_APROVACAO_HSE'` |
| **Tenant** | `p_organization_id` ∈ `current_organization_ids()` |
| **Paginação** | Cursor por `submitted_at DESC` (padrão listings) |
| **Retorno** | `{ items: MdhoPendingApprovalItem[], nextCursor?: string }` |

**Não criar:** `submit_mdho_for_approval()`, `start_hse_review()`, `reject_mdho()`.

---

## Erros padronizados

Reutilizar códigos MDHO + adicionar:

```text
SELF_APPROVAL_FORBIDDEN  — submitted_by = auth.uid() no approve (PO-HSE-7)
```

Demais: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `STATUS_MISMATCH`, `CONFLICT`, `VALIDATION_ERROR`.

---

## Cache / invalidação

```typescript
hseApprovalQueue: (organizationId, cursor?) =>
  ["tenant", organizationId, "hse-approval", "queue", cursor] as const,
```

| Mutation | Invalidar |
|---|---|
| approve / return | `hseApprovalQueue`, `mdho`, `occurrence detail`, `timeline`, listagens com filtro status |

**Stale time fila:** 30s operacional. Pós-mutation: refetch imediato (staleTime 0).

---

## Rotas / navegação

| Plataforma | Rota / padrão |
|---|---|
| **Web fila** | `/approvals/mdho` |
| **Web detalhe** | `/stop-work/[id]` — revisão inline via `hse-approval` |
| **Mobile fila** | Tela dedicada na stack de ocorrências |
| **Mobile detalhe** | Detalhe PP + footer approve/return; deep link opcional `?section=mdho-review` |

---

## Guards UI (web + mobile)

```typescript
canApproveHse =
  can("mdho.approve") &&
  !isPlatformAdmin &&
  assessment.status === "SUBMITTED" &&
  assessment.submittedBy !== currentUserId;

canReturnHse =
  can("mdho.return") &&
  !isPlatformAdmin &&
  assessment.status === "SUBMITTED";

showHseApprovalQueue = can("mdho.approve") && !isPlatformAdmin;
```

---

## Seed QA (herdado 2.6 — sem alteração obrigatória)

| Usuário | Papel | Cenários HSE |
|---|---|---|
| `qa-supervisor@safestop.local` | Supervisor HSE | submit (pré-condição fila) |
| `qa-lideranca@safestop.local` | Liderança HSE | fila, approve, return |
| `qa-fiscal@safestop.local` | Fiscal | read-only, sem fila |
| `qa-field@safestop.local` | HSE Campo | negativo |

Senha local: `SafeStop-QA-Local-2026`.

**Pré-condição QA:** ocorrência IO com MDHO `SUBMITTED` / status `AGUARDANDO_APROVACAO_HSE`.

---

## Explicitamente fora da Sprint 2.7

- IMS (`register_ims_reference`, UI)
- Plano de Ação
- Notificações push/in-app (“MDHO pendente”)
- Tabela `hse_approvals` ou entidade `HseApproval`
- Status inventados (`PENDENTE`, `EM_ANALISE`, `REJEITADO`)
- Múltiplos níveis de aprovação, assinatura digital, SLA
- Liberação, encerramento, cancelamento operacional
- Reabertura de MDHO `APPROVED`
- Offline queue persistente
- Service role no cliente

---

## Cross-check com `HSE-APPROVAL-UI-SPEC.md`

| Tema | PO | UI-SPEC | Status |
|---|---|---|---|
| Fila “Aguardando sua aprovação” | PO-HSE-12 | HSE-QUEUE · HSE-C02 | Alinhado |
| Fila só `mdho.approve` / sem Supervisor | PO-HSE-12 | Guards + HSE-FORBIDDEN | Alinhado |
| Revisão read-only 5 categorias | PO-MDHO-11 / 20 | HSE-REVIEW | Alinhado |
| Copy “Aprovar/Devolver MDHO” (não Rejeitar) | PO-HSE-4 · PO-MDHO-20 | HSE-C10/C11 · proibido Rejeitar | Alinhado |
| Dialog approve sem justificativa | PO-HSE-10 | HSE-C12…C14 | Alinhado |
| Dialog devolver + motivo 10–4000 | PO-HSE-3 | HSE-C15…C18 | Alinhado |
| Empty fila | PO-HSE-12 | HSE-EMPTY · HSE-C05/06 | Alinhado |
| Footer mobile approve/return | PO-HSE-23/24 | HSE-MOBILE-ACTIONS | Alinhado |
| Hint IMS pós-approve sem CTA | PO-HSE-13 · PO-MDHO-19 | HSE-POST-APPROVE · HSE-C20 | Alinhado |
| Ocultar approve autoaprovação | PO-HSE-7 | Guards + HSE-C22 | Alinhado |
| Segregação submit ≠ approve | PO-HSE-8 · PO-MDHO-27 | Terminologia + guards | Alinhado |
| APPROVED imutável | PO-HSE-16 · PO-MDHO-12 | Pós-approve / sem reabrir | Alinhado |
| Offline sem optimistic | PO-HSE-24 · PO-MDHO-25 | HSE-OFFLINE · HSE-C21 | Alinhado |
| Facade `hse-approval` sem duplicar MDHO | PO-HSE-26/27 | Objetivo + hand-off | Alinhado |
| Sem evidência gate na revisão | PO-HSE-21 | HSE-REVIEW | Alinhado |
| Comentário ≠ `return_reason` | PO-HSE-22 | HSE-REVIEW | Alinhado |
| Fora: IMS, notificações, `hse_approvals` | Fora de escopo | Princípios + proibidos | Alinhado |

### Herança MDHO (não contradizer)

| MDHO | Vigência na 2.7 |
|---|---|
| PO-MDHO-7 (Liderança approve/return) | Mantido — PO-HSE-2/3 |
| PO-MDHO-12 (APPROVED imutável) | Mantido — PO-HSE-16 |
| PO-MDHO-19 (IMS fora / hint) | Mantido — PO-HSE-13 |
| PO-MDHO-20 (copy Aprovar/Devolver) | Mantido — HSE-C* |
| PO-MDHO-27 (Liderança sem submit) | Mantido — PO-HSE-1/8 |

---

## Cenários QA (referência HSE-*)

| ID | Cenário |
|---|---|
| HSE-01 | Liderança vê fila com ocorrências `AGUARDANDO_APROVACAO_HSE` |
| HSE-02 | Fila empty state quando sem pendências |
| HSE-03 | Approve → `AGUARDANDO_REGISTRO_IMS` + timeline `approve_mdho` |
| HSE-04 | Return com reason 10–4000 → `MDHO_EM_PREENCHIMENTO` + `RETURNED` |
| HSE-05 | Return reason < 10 → `VALIDATION_ERROR` |
| HSE-06 | Supervisor **não** vê fila operacional |
| HSE-07 | Autoaprovação bloqueada (`SELF_APPROVAL_FORBIDDEN`) |
| HSE-08 | Gate UI oculta approve quando `submittedBy === self` |
| HSE-09 | Reenvio pós-devolução + re-approve (regressão MDHO-09) |
| HSE-10 | Fiscal forbidden approve/return |
| HSE-11 | Cross-tenant fila/approve → `FORBIDDEN` |
| HSE-12 | Platform Admin sem mutations UI |
| HSE-13 | Duplo approve simultâneo → primeiro OK, segundo `CONFLICT` |
| HSE-14 | Approve vs return simultâneo → um vence |
| HSE-15 | Offline bloqueia approve/return mobile |
| HSE-16 | Idempotência approve retry (PO-HSE-15) |
| HSE-17 | Detalhe inline approve/devolver (regressão MDHO-07/08) |
| HSE-18 | Cache fila invalidado pós-decisão |
| HSE-19 | Admin Empresa read-only |
| HSE-20 | Regressão IO/VA/timeline/MDHO-01…16 |

Regressão: MDHO-06…09, IO-01..12, VA-01..07, TL-01..05.

---

## Dependências registradas

### Etapa 1 — DATABASE (desbloqueada)

1. Migration patch: `approve_mdho_assessment` — guard PO-HSE-7 + idempotência PO-HSE-15
2. RPC `list_mdho_pending_approvals`
3. GRANTs + smoke update (`smoke-mdho.mjs` ou `smoke-hse-approval.mjs`)
4. `supabase db reset` OK

### Etapa 2 — BACKEND

1. `packages/types` — `MdhoPendingApprovalItem`, `ListMdhoPendingApprovalsResult`, `HseApprovalContext`
2. Helper `canApproveMdhoAssessment(assessment, userId, permissions)`
3. ~~`docs/api.md` — list RPC + `SELF_APPROVAL_FORBIDDEN` + idempotência~~ **Concluído**

### Etapas 3–4 — UIUX, WEB, MOBILE

1. ~~`HSE-APPROVAL-UI-SPEC.md`~~ **Concluído** (2026-08-02)
2. `features/hse-approval/` web + mobile
3. Rota web `/approvals/mdho`
4. Refatorar `MdhoReviewPanel` → componentes `hse-approval`

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER / DOCS
Data: 2026-08-02
Base documental: arquitetura Sprint 2.7; docs/workflow.md §5.6; MDHO-DECISIONS.md
Status: APROVADO — liberar DATABASE patch + UIUX (G0 → G1)
```

---

## Referências

- `docs/workflow.md` §5.6–5.7, §17, §19, §22, §26
- `docs/database.md` §14.4, §21
- `docs/design-system.md` — etapa Aprovação HSE no fluxo
- `docs/decisions/RBAC-MATRIX-APPROVED.md`
- `docs/decisions/MDHO-DECISIONS.md`
- `docs/decisions/MDHO-UI-SPEC.md` — MDHO-REVIEW
- `docs/decisions/HSE-APPROVAL-UI-SPEC.md`
- `docs/decisions/VERIFICATION-sprint-2.7-hse-approval.md`
- `docs/api.md` — RPCs MDHO + `list_mdho_pending_approvals` + `SELF_APPROVAL_FORBIDDEN`
- `docs/roadmap.md` — nota sub-sprint 2.7
- `reference/base44/.../Interdiction.jsonc` — `mdho_status` (referência UX)
