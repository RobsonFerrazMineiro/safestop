# Decisões — Plano de Ação (Sprint 3.0)

**Status:** `APROVADO`  
**Sprint:** 3.0 — Plano de Ação (sub-entrega incremental no ramo IO até plano `COMPLETED`)  
**Data:** 2026-08-03  
**Etapa:** 0 — Produto (agente MASTER / DOCS)  
**Gate:** **G0 desbloqueado** — libera DATABASE (schema + RPCs) e UIUX (spec)

**Arquitetura base:** Sprint 3.0 — Plano de Ação (2026-08-03, aprovada)

**Fundação:** Sprints 2.0–2.8 (fluxo IO até `EM_TRATATIVA`) + **2.9** (consolidação: detalhe canônico, `@safestop/query-keys`, smoke IO)

**Modelo de dados:** `docs/database.md` §15.1–15.3, §32 Fase 6 — **não reescrever**; este documento referencia e complementa.

**Spec UI:** [`ACTION-PLAN-UI-SPEC.md`](./ACTION-PLAN-UI-SPEC.md) — Etapa UIUX concluída (2026-08-03)

**Relação roadmap:** `docs/roadmap.md` lista **Plano de Ação = Sprint 7** e **Notificações = Sprint 3**. A **sub-sprint 3.0** antecipa o Plano de Ação estruturado (IO) — mesma lógica das sub-sprints 2.6–2.8 ante Sprint 6. **Notificações permanecem Sprint 3 do roadmap** e **fora** desta entrega.

**Pré-requisito duro:** Sprint 2.9 T1 (detalhe `/stop-work/[id]`, `@safestop/query-keys`, smoke-flow-io).

**Regra IMS inviolável:** SafeStop **não gera, consulta, sincroniza nem valida** IMS externo. Plano de Ação **não** altera essa regra.

---

## Objetivo

Registrar as decisões de produto **PO-AP-1 a PO-AP-19** (IDs de ambiguidade AP-01…AP-19 da arquitetura) da Sprint 3.0 **sem inventar regra de negócio**, usando como fonte primária:

- arquitetura Sprint 3.0;
- `docs/workflow.md` §5.8, §10, §13, §17–20;
- `docs/database.md` §15, §16, §32 Fase 6, §33, §35;
- `docs/product.md` — Plano de Ação pós-IMS;
- `docs/decisions/RBAC-MATRIX-APPROVED.md`;
- `docs/decisions/EVIDENCE-DECISIONS.md` (padrão upload);
- `docs/decisions/CONSOLIDATION-DECISIONS.md` (dead-end CON-C03 a substituir);
- `docs/decisions/TIMELINE-DECISIONS.md`.

---

## Decisão arquitetural central (não redesenhar)

| Item | Decisão |
|---|---|
| **Entidades** | `action_plans` + `action_items` + `action_item_attachments` |
| **Ramo** | **Somente Interdição Oficial** — VA **fora** (correção simplificada §16) |
| **Pré-condição** | `status = EM_TRATATIVA` + `decision_type = INTERDICAO_OFICIAL` + `ims_reference_code` **preenchido** |
| **Cardinalidade** | **1 plano ativo** por ocorrência (`OPEN` / `IN_PROGRESS` / `AWAITING_VALIDATION`) |
| **Pós-entrega 3.0** | Plano → `COMPLETED` — ocorrência **permanece** `EM_TRATATIVA` |
| **Liberação / encerramento** | **Fora** 3.0 |
| **Notificações** | **Fora** 3.0 |
| **`audit_events`** | **Fora** 3.0 |
| **Feature UI** | `features/action-plan/` web + mobile |
| **Ordem detalhe** | … → IMS → **Plano de Ação** → Timeline |
| **Mutações** | Somente RPC `SECURITY DEFINER` — cliente SELECT-only |

### Fluxo Sprint 3.0

```text
EM_TRATATIVA (+ IMS registrado)
        │ create_action_plan() [action_plan.create]
        ↓
action_plans.status = OPEN
        │ add_action_item / update / start [action_plan.manage]
        ↓
Items: PENDING → IN_PROGRESS → AWAITING_VALIDATION
        │ submit_action_item (manage OU responsável)
        │ validate_action_item [action_plan.validate]
        │   ├─ COMPLETED
        │   └─ REJECTED → IN_PROGRESS
        ↓
complete_action_plan() [action_plan.manage]
        ↓
plano COMPLETED (+ closed_at)
ocorrência permanece EM_TRATATIVA  ← AGUARDANDO_VALIDACAO fora 3.0
```

---

## Gate G0

| Item | Estado |
|---|---|
| **G0 — Etapa 0 PO** | **Desbloqueado** (2026-08-03) |
| **Desbloqueia** | DATABASE (Fase 6 + RPCs) e UIUX (`ACTION-PLAN-UI-SPEC.md`) |
| **Critério** | PO-AP-1…PO-AP-19 sem ambiguidade |
| **Paralelo permitido** | UIUX spec ∥ DATABASE foundation após G0 |

Ordem oficial: **Etapa 0 DOCS → UIUX ∥ DATABASE → BACKEND → WEB ∥ MOBILE → BUILD → SECURITY ∥ QA → DOCS → COMMIT**.

---

## Decisões aprovadas

### PO-AP-1 (AP-01) — IMS obrigatório antes do plano?

| Item | Decisão |
|---|---|
| **Pré-condição RPC `create_action_plan`** | `ims_reference_code IS NOT NULL` |
| **Status** | `EM_TRATATIVA` |
| **Ramo** | `decision_type = INTERDICAO_OFICIAL` |
| **Sem IMS** | `STATUS_MISMATCH` / `VALIDATION_ERROR` — **não** criar plano |

---

### PO-AP-2 (AP-02) — Plano obrigatório no IO?

| Item | Decisão |
|---|---|
| **Criação** | **Não** auto-criar — CTA explícito |
| **Antes de validação da ocorrência** | Plano com ≥1 ação será exigido em Sprint Liberação — **fora** 3.0 |
| **3.0** | Empty state + CTA “Criar plano” se `action_plan.create` |

---

### PO-AP-3 (AP-03) — Plano em `AGUARDANDO_VALIDACAO`?

| Item | Decisão |
|---|---|
| **3.0** | Ocorrência **não** transita para `AGUARDANDO_VALIDACAO` |
| **Guard UI futuro** | Se status ≥ `AGUARDANDO_VALIDACAO` (sprints futuras): plano **read-only** |
| **Escopo visível 3.0** | `EM_TRATATIVA` (+ leitura se já existir plano em status posteriores) |

---

### PO-AP-4 (AP-04) — Quem cancela ação CRITICAL?

| Item | Decisão |
|---|---|
| **Cancelar ação** | `action_plan.manage` — motivo obrigatório 10–4000 |
| **CRITICAL** | Mesma permissão + **confirmação dialog** reforçada na UI |
| **Liderança HSE** | Cancela via `validate` **não** — usa `manage` (não tem na matriz); HSE **não** cancela no MVP |

---

### PO-AP-5 (AP-05) — VA usa plano estruturado?

| Item | Decisão |
|---|---|
| **MVP 3.0** | **Não** — VA permanece correção simplificada (`database.md` §16) |
| **UI** | Seção plano **ausente** se `decision_type ≠ INTERDICAO_OFICIAL` |
| **RPC** | Guard rejeita create em VA |

---

### PO-AP-6 (AP-06) — Bucket Storage?

| Item | Decisão |
|---|---|
| **Modelo** | **Subpath** no bucket privado de evidências existente |
| **Path** | `org/{organization_id}/action-items/{action_item_id}/{attachment_id}.{ext}` |
| **Bucket novo** | **Não** criar na 3.0 |
| **RPCs** | `prepare/complete/fail/delete_action_item_attachment` + signed URL |

---

### PO-AP-7 (AP-07) — Comentários por ação?

| Item | Decisão |
|---|---|
| **Tabela nova** | **Não** |
| **Mecanismo** | `occurrence_comments` com `comment_type = CORRECTION_UPDATE` (servidor) + metadata timeline `{ actionItemId }` |
| **RPC** | `add_action_item_note(p_payload)` — opcional P1 |
| **Thread dedicado** | **Fora** MVP |

---

### PO-AP-8 (AP-08) — Histórico de status da ação?

| Item | Decisão |
|---|---|
| **MVP** | **Sem** tabela `action_item_status_history` |
| **Mecanismo** | Timeline kinds `ACTION_*` + metadata `previousStatus` / `newStatus` |
| **Futuro** | Tabela dedicada se auditoria por ação exigir |

---

### PO-AP-9 (AP-09) — Campos `approved_by` / `approved_at` no plano?

| Item | Decisão |
|---|---|
| **Schema** | Colunas **existem** em `database.md` §15.1 — migrar como **nullable** |
| **3.0** | **Não preencher** — sem fluxo “aprovar plano” |
| **Uso futuro** | Possível alinhamento a validação da ocorrência |

---

### PO-AP-10 (AP-10) — Quem inicia / conclui ação?

| Item | Decisão |
|---|---|
| **`start_action_item`** | `action_plan.manage` **OU** `responsible_member_id` = membro ativo do `auth.uid()` |
| **`submit_action_item`** | Idem — manage **OU** responsável |
| **`add` / `update` (campos estruturais)** | Somente `action_plan.manage` |
| **Mobile** | Fluxo “Minhas ações” prioriza responsável |

---

### PO-AP-11 (AP-11) — Itens CANCELLED para completar o plano?

| Item | Decisão |
|---|---|
| **Regra** | Plano completa quando **todas** as ações estão em `COMPLETED` **ou** `CANCELLED` |
| **Mínimo** | ≥1 ação **COMPLETED** (não permitir plano só com CANCELLED) |
| **RPC** | `complete_action_plan` valida regra |

---

### PO-AP-12 (AP-12) — Transição → `AGUARDANDO_VALIDACAO` na 3.0?

| Item | Decisão |
|---|---|
| **3.0** | **Não** — RPC `submit_action_plan_for_occurrence_validation` **fora** |
| **Pós-complete** | Ocorrência permanece `EM_TRATATIVA`; UX: “Plano concluído — validação da ocorrência em versão futura” |
| **Sprint Liberação** | Transição ocorrência + liberação |

---

### PO-AP-13 (AP-13) — Prazo obrigatório?

| Item | Decisão |
|---|---|
| **`due_at`** | **NOT NULL** em toda ação — `workflow.md` §13.3 |
| **Exceção LOW** | **Não** — prazo sempre obrigatório |

---

### PO-AP-14 (AP-14) — Catálogo org responsável?

| Item | Decisão |
|---|---|
| **`responsible_member_id`** | Membro **ativo** da mesma `organization_id` da ocorrência |
| **`responsible_organization_id`** | Opcional — default = org da ocorrência; picker pode incluir contratada da PP se existir |
| **Membro de outra org** | **FORBIDDEN** na RPC |

---

### PO-AP-15 (AP-15) — Limites evidência por ação?

| Item | Decisão |
|---|---|
| **Baseline** | Mesmos de `EVIDENCE-DECISIONS.md`: **10 MiB**, **20 ativas** por ação, MIME permitidos |
| **Compressão mobile** | Mesmo padrão evidence 2.2 |

---

### PO-AP-16 (AP-16) — Evidência obrigatória na conclusão?

| Item | Decisão |
|---|---|
| **CRITICAL / HIGH** | **≥1** anexo ativo obrigatório em `submit_action_item` |
| **MEDIUM / LOW** | Evidência **opcional** |
| **Erro** | `VALIDATION_ERROR` — “Anexe ao menos uma evidência para esta prioridade.” |

---

### PO-AP-17 (AP-17) — Segregação executor ≠ validador?

| Item | Decisão |
|---|---|
| **Hard block** | `validate_action_item` rejeita se `auth.uid() = completed_by` |
| **Código** | `SELF_VALIDATION_FORBIDDEN` |
| **Mensagem UX** | “Quem concluiu a ação não pode validá-la.” |
| **Config org** | **Fora** MVP — sempre ativo |

---

### PO-AP-18 (AP-18) — Copy pós-IMS sem plano?

| Item | Decisão |
|---|---|
| **Com `action_plan.create`** | Empty state + CTA “Criar Plano de Ação” |
| **Sem create** | Banner informativo (evolução CON-C03): “Aguardando Plano de Ação” |
| **Com plano** | Seção funcional — **remover** banner dead-end CON-C03 |

---

### PO-AP-19 (AP-19) — Numeração roadmap Sprint 3.0 vs Sprint 7?

| Item | Decisão |
|---|---|
| **Nome entrega** | **Sub-sprint 3.0 — Plano de Ação** |
| **Roadmap macro** | Continua listando Sprint 7 = Plano de Ação completo (validação ocorrência / liberação futuras) |
| **Nota** | Atualizar `docs/roadmap.md` — 3.0 antecipa domínio PA estruturado; Sprint 7 permanece liberação/continuidade operacional |
| **Notificações** | Permanecem **Sprint 3** do roadmap — **não** confundir com 3.0 |

---

## Status e enums

### Plano (`action_plans.status`)

```text
OPEN | IN_PROGRESS | AWAITING_VALIDATION | COMPLETED | CANCELLED
```

- `OPEN` → ao criar  
- `IN_PROGRESS` → ao existir ≥1 item não terminal iniciado/submetido (RPC pode promover automaticamente)  
- `AWAITING_VALIDATION` — **reservado** se todas ações aguardam validação (opcional UX)  
- `COMPLETED` — `complete_action_plan`  
- `CANCELLED` — **fora** 3.0 (cancelamento de plano inteiro)

### Ação (`action_items.status`)

```text
PENDING → IN_PROGRESS → AWAITING_VALIDATION → COMPLETED
                ↓                    ↓
           CANCELLED            REJECTED → IN_PROGRESS
```

### Prioridade

```text
LOW | MEDIUM | HIGH | CRITICAL
```

---

## RPCs oficiais (3.0)

| RPC | Permissão | Notas |
|---|---|---|
| `create_action_plan(p_payload jsonb)` | `action_plan.create` | Idempotente se plano ativo existe |
| `update_action_plan(p_payload jsonb)` | `action_plan.create` **ou** `manage` | Summary enquanto editável |
| `add_action_item(p_payload jsonb)` | `action_plan.manage` | responsável + due_at + priority + title |
| `update_action_item(p_payload jsonb)` | `action_plan.manage` | Conforme status |
| `start_action_item(p_item_id uuid)` | manage **ou** responsável | PENDING → IN_PROGRESS |
| `submit_action_item(p_payload jsonb)` | manage **ou** responsável | → AWAITING_VALIDATION; evidência PO-AP-16 |
| `validate_action_item(p_payload jsonb)` | `action_plan.validate` | COMPLETED \| REJECTED + note; PO-AP-17 |
| `cancel_action_item(p_payload jsonb)` | `action_plan.manage` | Motivo 10–4000 |
| `complete_action_plan(p_plan_id uuid)` | `action_plan.manage` | PO-AP-11 |
| `prepare_action_item_attachment_upload` | manage **ou** responsável | Espelho evidence |
| `complete_action_item_attachment_upload` | idem | |
| `fail_action_item_attachment_upload` | idem | |
| `delete_action_item_attachment` | manage **ou** responsável | Soft delete |
| `get_action_item_attachment_signed_url` | `occurrence.read` + escopo | |

**Fora 3.0:** `submit_action_plan_for_occurrence_validation`, `release_occurrence`, `close_occurrence`.

**Opcional P1:** `add_action_item_note`.

---

## Erros padronizados

```text
UNAUTHORIZED | FORBIDDEN | NOT_FOUND | STATUS_MISMATCH | VALIDATION_ERROR |
ALREADY_EXISTS | CONFLICT | SELF_VALIDATION_FORBIDDEN | INTERNAL_ERROR
```

---

## Timeline — kinds novos

| kind | Gatilho |
|---|---|
| `ACTION_PLAN_CREATED` | create_action_plan |
| `ACTION_ITEM_CREATED` | add_action_item |
| `ACTION_ITEM_ASSIGNED` | alteração responsável |
| `ACTION_ITEM_DUE_CHANGED` | alteração prazo |
| `ACTION_ITEM_STATUS_CHANGED` | start / submit / validate / cancel / reject |
| `ACTION_PLAN_COMPLETED` | complete_action_plan |
| `ACTION_ITEM_EVIDENCE_ADDED` | complete attachment (se alinhado a EVIDENCE_* pattern) |

Patch incremental em `get_occurrence_timeline` — **não** reescrever histórico de migrations (PO-CON-12).

**Sem** kind novo para autosave. **Sem** duplicar `STATUS_CHANGED` da ocorrência no complete do plano (ocorrência não muda status).

---

## Cache / invalidação

Estender `@safestop/query-keys`:

```typescript
actionPlanKeys.byOccurrence(orgId, occurrenceId)
actionPlanKeys.items(orgId, planId)
actionPlanKeys.item(orgId, itemId)
actionPlanKeys.attachments(orgId, itemId)
```

| Mutation | Invalidar |
|---|---|
| Qualquer RPC plano/ação | plan + items + occurrence detail + timeline |
| Evidência | attachments + item + timeline |

**Stale time:** 30s operacional (paridade HSE/list).

---

## Guards UI

```typescript
shouldShowActionPlanSection(o) =
  o.decisionType === "INTERDICAO_OFICIAL" &&
  o.status === "EM_TRATATIVA" && // 3.0
  !!o.imsReferenceCode;

canCreatePlan = can("action_plan.create") && !isPlatformAdmin && !hasActivePlan;
canManage = can("action_plan.manage") && !isPlatformAdmin;
canValidate = can("action_plan.validate") && !isPlatformAdmin;
canActAsResponsible = isResponsibleMember && !isPlatformAdmin;
```

---

## Seed QA

| Usuário | Papel | Cenários |
|---|---|---|
| `qa-supervisor@safestop.local` | Supervisor HSE | create, manage, complete plan |
| `qa-lideranca@safestop.local` | Liderança HSE | validate / reject |
| `qa-fiscal@safestop.local` | Fiscal | read-only |
| `qa-field@safestop.local` | HSE Campo | negativo |

**Pré-condição:** ocorrência IO com IMS registrado (`EM_TRATATIVA`) — via smoke-flow-io + register IMS.

Senha: `SafeStop-QA-Local-2026`.

**Nota:** Liderança da Contratada tem `action_plan.manage` na matriz — seed QA pode reutilizar perfil contratada se existir; senão documentar gap.

---

## Explicitamente fora da Sprint 3.0

- Notificações / push / ciência
- `notification_events`, `audit_events`
- Transição ocorrência → `AGUARDANDO_VALIDACAO`
- Liberação, encerramento, cancelamento de ocorrência
- Plano estruturado em Ver e Agir
- Múltiplos planos ativos
- Cancelamento de plano inteiro
- Dashboard / relatórios / SLA
- Offline queue persistente
- Fila dedicada “minhas validações” HSE
- Integração IMS
- Service role no cliente

---

## Cross-check com `ACTION-PLAN-UI-SPEC.md`

| Tema | PO | UI-SPEC | Status |
|---|---|---|---|
| Seção pós-IMS | Ordem UI | AP-SECTION | Alinhado |
| Empty + CTA create | PO-AP-18 | AP-EMPTY | Alinhado |
| Remover CON-C03 | PO-AP-18 | Integração + AP-C02 | Alinhado |
| Card ação + prioridade/atraso | — | AP-ITEM | Alinhado |
| Dialog conclusão + evidência | PO-AP-16 | AP-SUBMIT | Alinhado |
| Painel validate/reject | PO-AP-17 | AP-VALIDATE | Alinhado |
| Mobile ≤3 toques conclusão | PO-AP-10 | AP-MOBILE | Alinhado |
| Offline bloqueia | — | AP-OFFLINE | Alinhado |

---

## Cenários QA (referência AP-*)

| ID | Cenário |
|---|---|
| AP-QA-01 | Supervisor cria plano em EM_TRATATIVA IO com IMS |
| AP-QA-02 | Create em VER_E_AGIR → FORBIDDEN |
| AP-QA-03 | Create sem IMS → STATUS_MISMATCH |
| AP-QA-04 | Segundo plano ativo → ALREADY_EXISTS / CONFLICT |
| AP-QA-05 | add_action_item sem manage → FORBIDDEN |
| AP-QA-06 | Responsável start + submit → AWAITING_VALIDATION |
| AP-QA-07 | CRITICAL submit sem evidência → VALIDATION_ERROR |
| AP-QA-08 | HSE valida → COMPLETED |
| AP-QA-09 | HSE rejeita com motivo → IN_PROGRESS |
| AP-QA-10 | Self-validation → SELF_VALIDATION_FORBIDDEN |
| AP-QA-11 | complete_action_plan com regras PO-AP-11 |
| AP-QA-12 | Ocorrência permanece EM_TRATATIVA após complete |
| AP-QA-13 | Timeline kinds ACTION_* sem duplicar STATUS_CHANGED ocorrência |
| AP-QA-14 | Cross-tenant → FORBIDDEN |
| AP-QA-15 | Fiscal read-only |
| AP-QA-16 | Offline bloqueia mutations mobile |
| AP-QA-17 | Regressão smoke-flow-io + IMS |

---

## Dependências registradas

### Etapa 1 — DATABASE

1. Migration foundation: `action_plans`, `action_items`, `action_item_attachments`
2. UNIQUE parcial 1 plano ativo
3. RLS SELECT-only + Storage policies subpath
4. RPCs § acima + GRANTs
5. Patch `get_occurrence_timeline`
6. `smoke-action-plan.mjs` + `qa-ap-*.mjs`
7. `supabase db reset` OK

### Etapa 2 — BACKEND

1. `packages/types` — enums, kinds, guards, errors
2. `packages/validation` — schemas
3. `@safestop/query-keys` — `actionPlanKeys` + invalidation matrix
4. `docs/api.md` — catálogo RPC

### Etapas 3–4 — UIUX, WEB, MOBILE

1. `ACTION-PLAN-UI-SPEC.md` ✅ (UIUX 2026-08-03)
2. `features/action-plan/` web + mobile
3. Integração pós-`ImsReferenceSection`; remover CON-C03 quando aplicável

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER / DOCS
Data: 2026-08-03
Base documental: arquitetura Sprint 3.0; docs/database.md §15; docs/workflow.md §10/§13
Status: APROVADO — liberar DATABASE e UIUX (G0 → G1)

Etapa 6 (DOCS pós-G5) aplicada por: agente DOCS
Data: 2026-08-17
Atualizações: roadmap 3.0 vs Sprint 7; workflow §5.8; database §6.2/§35; api.md catálogo 3.0
Status: G6 DOCS APROVADO — ver VERIFICATION-sprint-3.0-action-plan.md
```

---

## Referências

- `docs/workflow.md` §5.8, §10, §13, §17–20
- `docs/database.md` §15.1–15.3, §16, §32 Fase 6, §33, §35
- `docs/product.md` — Plano de Ação
- `docs/glossary.md` — Plano de ação
- `docs/decisions/RBAC-MATRIX-APPROVED.md`
- `docs/decisions/EVIDENCE-DECISIONS.md`
- `docs/decisions/CONSOLIDATION-DECISIONS.md` / `CONSOLIDATION-UI-SPEC.md`
- `docs/decisions/TIMELINE-DECISIONS.md`
- `docs/roadmap.md` — Sprint 7 vs sub-sprint 3.0
