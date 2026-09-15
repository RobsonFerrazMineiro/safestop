# API

## Objetivo

Este documento define os padrões oficiais para toda a camada de comunicação do SafeStop.

O objetivo não é documentar endpoints específicos, mas estabelecer uma arquitetura consistente para:

- Server Actions;
- Edge Functions;
- Comunicação com Supabase;
- DTOs;
- Requests;
- Responses;
- Erros;
- Uploads;
- Realtime;
- Offline;
- Sincronização.

Toda implementação futura deverá seguir este documento.

---

# Filosofia

O SafeStop utiliza uma arquitetura moderna baseada em:

- Next.js App Router;
- React Server Components;
- React Native (Expo);
- Supabase;
- PostgreSQL;
- Edge Functions;
- Row Level Security (RLS).

A comunicação deve ser:

- simples;
- segura;
- previsível;
- tipada;
- rastreável;
- reutilizável.

---

# Objetivos

A arquitetura da API possui os seguintes objetivos:

- centralizar regras de negócio;
- reduzir duplicação;
- manter consistência;
- facilitar manutenção;
- facilitar testes;
- facilitar auditoria;
- aumentar segurança;
- suportar Mobile e Web;
- suportar operação Offline.

---

# Fonte da Verdade

A API deve respeitar obrigatoriamente:

```text
README.md

↓

product.md

↓

workflow.md

↓

architecture.md

↓

database.md

↓

engineering.md
```

Nunca implementar regras diferentes das definidas nesses documentos.

---

# Arquitetura Geral

A comunicação do SafeStop é baseada em quatro camadas.

```text
Apps

↓

Services

↓

Supabase

↓

PostgreSQL
```

---

## Apps

São os clientes da aplicação.

Exemplos:

```text
apps/mobile

apps/web
```

Esses clientes nunca devem conter regras críticas de negócio.

---

## Services

Responsáveis por:

- comunicação;
- validações;
- chamadas ao backend;
- transformação de DTOs;
- tratamento de erros.

Toda comunicação passa pelos Services.

---

## Supabase

Responsável por:

- Auth;
- Database;
- Storage;
- Realtime;
- Edge Functions.

---

## PostgreSQL

Responsável por:

- persistência;
- integridade;
- constraints;
- índices;
- funções;
- auditoria.

---

# Estratégia de Comunicação

Nem toda operação deve utilizar o mesmo mecanismo.

A escolha depende do tipo de operação.

---

## Server Actions

Utilizar para:

- mutations;
- formulários;
- ações protegidas;
- alterações de dados;
- criação;
- atualização;
- exclusão.

---

## Edge Functions

Utilizar para:

- integrações externas;
- processamento pesado;
- notificações;
- geração de documentos;
- tarefas assíncronas;
- lógica isolada.

---

## Supabase Client

Utilizar para:

- consultas simples;
- leitura;
- realtime;
- autenticação;
- storage.

---

## PostgreSQL RPC

Utilizar quando existir:

- lógica SQL complexa;
- agregações;
- cálculos;
- validações próximas ao banco.

### Catálogo RPC operacional (Sprints 2.0–3.3)

Clientes **não** atualizam `occurrences.status` diretamente. RPCs de liberação/encerramento ocorrência e notificações **não** existem nesta entrega (permissões reservadas — `docs/database.md` §6.2).

| RPC | Sprint | Permissão (típica) | Contrato detalhado |
|---|---|---|---|
| `create_occurrence` | 2.0/2.1 | `occurrence.create` | `OCCURRENCE-FOUNDATION-DECISIONS` / `PREVENTIVE-STOP-DECISIONS` |
| `start_occurrence_evaluation` | 2.4 | `occurrence.evaluate` | `VER-E-AGIR-DECISIONS` |
| `record_occurrence_decision` | 2.4–2.5 | `occurrence.evaluate` / `occurrence.confirm_interdiction` | abaixo + IO decisions |
| `prepare_occurrence_attachment_upload` | 2.2 | `occurrence.create` | `EVIDENCE-DECISIONS` |
| `complete_occurrence_attachment_upload` | 2.2 | `occurrence.create` | `EVIDENCE-DECISIONS` |
| `fail_occurrence_attachment_upload` | 2.2 | `occurrence.create` | `EVIDENCE-DECISIONS` |
| `delete_occurrence_attachment` (soft) | 2.2 | autor + `occurrence.create` | `EVIDENCE-DECISIONS` |
| `get_occurrence_attachment_signed_url` | 2.2 | `occurrence.read` | `EVIDENCE-DECISIONS` |
| `get_occurrence_timeline` | 2.3 | `occurrence.read` | `TIMELINE-DECISIONS` |
| `create_occurrence_comment` | 2.3 | `occurrence.read` + access | `TIMELINE-DECISIONS` |
| `update_occurrence_comment` | 2.3 | autor + janela | `TIMELINE-DECISIONS` |
| `delete_occurrence_comment` | 2.3 | autor ou `occurrence.cancel`\* | `TIMELINE-DECISIONS` |
| `start_mdho_assessment` | 2.6 | `mdho.fill` | abaixo |
| `save_mdho_draft` | 2.6 | `mdho.fill` | abaixo |
| `submit_mdho_assessment` | 2.6 | `mdho.submit` | abaixo |
| `approve_mdho_assessment` | 2.6–2.7 | `mdho.approve` | abaixo |
| `return_mdho_assessment` | 2.6 | `mdho.return` | abaixo |
| `list_mdho_pending_approvals` | 2.7 | `mdho.approve` | abaixo |
| `register_ims_reference` | 2.8 | `ims_reference.register` | abaixo — **manual**, sem integração |
| `update_ims_reference` | 2.8 | `ims_reference.update` | abaixo — **manual**, sem integração |
| `create_action_plan` | 3.0 | `action_plan.create` | abaixo — Plano de Ação |
| `update_action_plan` | 3.0 | `action_plan.create` / `manage` | abaixo |
| `add_action_item` | 3.0 | `action_plan.manage` | abaixo |
| `update_action_item` | 3.0 | `action_plan.manage` | abaixo |
| `start_action_item` | 3.0 | manage **ou** responsável | abaixo |
| `submit_action_item` | 3.0 | manage **ou** responsável | abaixo |
| `validate_action_item` | 3.0 | `action_plan.validate` | abaixo |
| `cancel_action_item` | 3.0 | `action_plan.manage` | abaixo |
| `complete_action_plan` | 3.0 | `action_plan.manage` | abaixo |
| `prepare_action_item_attachment_upload` | 3.0 | manage **ou** responsável | abaixo |
| `complete_action_item_attachment_upload` | 3.0 | idem | abaixo |
| `fail_action_item_attachment_upload` | 3.0 | idem | abaixo |
| `delete_action_item_attachment` | 3.0 | manage **ou** responsável | abaixo |
| `get_action_item_attachment_signed_url` | 3.0 | `occurrence.read` + escopo | abaixo |
| `mark_notification_read` | 3.1 | `notification.read` (destinatário) | abaixo |
| `mark_all_notifications_read` | 3.1 | `notification.read` | abaixo |
| `confirm_notification_awareness` | 3.1 | `notification.confirm_awareness` (destinatário) | abaixo |
| `list_my_notifications` | 3.1 | `notification.read` | abaixo |
| `get_dashboard_kpis` | 3.2 | gates internos (`occurrence.read`, `report.read`, `action_plan.*`, …) | abaixo |
| `list_occurrences_report` | 3.3 | `report.read` + escopo ocorrência | abaixo |
| `list_action_items_report` | 3.3 | `report.read` + escopo plano | abaixo |
| `list_awareness_report` | 3.3 | `report.read` (gate explícito) | abaixo |
| `log_report_export` | 3.3 | `report.read` | abaixo |
| `list_operational_occurrences` | PR-D1 | `occurrence.read` + `can_access_occurrence` | abaixo — lista operacional, **não** relatório |

\*Remoção de comentário por supervisor usa `occurrence.cancel` na matriz RBAC aprovada — a permissão permanece **reservada** para cancelamento formal de ocorrência (PO-CON-20); não implica RPC `cancel_occurrence` na 2.9.

**Escrita de `notification_events` / `notifications`:** somente server-side (`create_occurrence_notification_event` + patches de dispatch) — **sem** RPC client para criar eventos.

**Leitura auxiliar (client):** contadores de badge (`unreadCount`, `pendingAwarenessCount`) via `SELECT` head count em `notifications` com RLS — ver `getNotificationBadgeCounts` nos apps.

**Dashboard (3.2):** KPIs agregados **somente** via `get_dashboard_kpis` — drill-down de ações usa listagens client-side filtradas; **sem** RPC `get_dashboard_action_items_attention`.

**Relatórios (3.3):** listagens paginadas via `list_*_report`; exportação CSV/XLSX montada no client + `log_report_export` após sucesso; **sem** RPC de exportação server-side.

**Lista operacional (PR-D1 / PO-UX-10):** `list_operational_occurrences` — gate `occurrence.read` (HSE de Campo lista PP). **Não** é `list_occurrences_report` e **não** exige `report.read`.

**Fora do catálogo operacional 3.3:** `submit_action_plan_for_occurrence_validation`, `submit_correction`, `validate_correction`, `release_occurrence`, `close_occurrence`, `cancel_occurrence`, Push/`notification_deliveries`, `upsert_organization_contact`, `get_dashboard_action_items_attention`, export PDF.

### Fundação / avaliação — referências rápidas

#### `create_occurrence(p_payload jsonb)`

- Permissão: `occurrence.create`
- Cria PP em `PARALISACAO_PREVENTIVA`; gera `public_code` no servidor
- Contrato: `docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md`, `PREVENTIVE-STOP-DECISIONS.md`

#### `start_occurrence_evaluation(p_occurrence_id uuid)`

- Permissão: `occurrence.evaluate`
- `PARALISACAO_PREVENTIVA` → `EM_AVALIACAO`
- Contrato: `docs/decisions/VER-E-AGIR-DECISIONS.md`

#### `get_occurrence_timeline` / comentários / evidências

Ver `docs/decisions/TIMELINE-DECISIONS.md` e `docs/decisions/EVIDENCE-DECISIONS.md` — payloads e erros padronizados nas decisões oficiais.

### `record_occurrence_decision(p_payload jsonb)`

RPC de domínio para registrar a decisão formal da liderança. Clientes **não** atualizam `occurrences.status` diretamente.

**Payload — Ver e Agir (Sprint 2.4):**

```json
{
  "occurrence_id": "uuid",
  "decision_type": "VER_E_AGIR",
  "decision_reason": "string 10-4000"
}
```

- Permissão: `occurrence.evaluate`
- Status exigido: `EM_AVALIACAO`
- Status resultante: `VER_E_AGIR`

**Payload — Interdição Oficial (Sprint 2.5):**

```json
{
  "occurrence_id": "uuid",
  "decision_type": "INTERDICAO_OFICIAL",
  "decision_reason": "string 10-4000"
}
```

- Permissão: `occurrence.confirm_interdiction`
- Status exigido: `EM_AVALIACAO` (ramo **paralelo** a Ver e Agir — **não** a partir de `VER_E_AGIR`)
- Status resultante: `INTERDICAO_CONFIRMADA`

**Erros padronizados:** `UNAUTHORIZED` | `FORBIDDEN` | `NOT_FOUND` | `STATUS_MISMATCH` | `ALREADY_DECIDED` | `VALIDATION_ERROR` | `CONFLICT`.

**Schemas client (`@safestop/validation`) — o cliente envia apenas `occurrenceId` + `decisionReason`; o service injeta `decision_type` no payload RPC:**

| Ramo | Schema Zod | `decision_type` (service) |
|---|---|---|
| Ver e Agir | `recordVerEAgirDecisionSchema` | `VER_E_AGIR` |
| Interdição Oficial | `recordInterdicaoDecisionSchema` | `INTERDICAO_OFICIAL` |

Tipos: `RecordVerEAgirDecisionInput`, `RecordInterdicaoDecisionInput` em `@safestop/types`. Resposta: `RecordOccurrenceDecisionResult` (`decision` + `occurrence`).

Contrato completo: `docs/decisions/VER-E-AGIR-DECISIONS.md`, `docs/decisions/INTERDICAO-OFICIAL-DECISIONS.md`.

### RPCs — Avaliação Técnica MDHO (Sprint 2.6)

MDHO **somente** no ramo Interdição Oficial. Clientes **não** atualizam status via UPDATE direto. Contrato: `docs/decisions/MDHO-DECISIONS.md`.

#### `start_mdho_assessment(p_occurrence_id uuid)`

- Permissão: `mdho.fill`
- Status exigido: `INTERDICAO_CONFIRMADA` + `decision_type = INTERDICAO_OFICIAL`
- Efeitos: assessment `DRAFT`; ocorrência → `MDHO_EM_PREENCHIMENTO`

#### `save_mdho_draft(p_payload jsonb)`

```json
{
  "assessment_id": "uuid",
  "selections": [
    { "category_id": "uuid", "option_id": "uuid", "detail": "string?" }
  ],
  "complement": "string?",
  "expected_updated_at": "timestamptz?"
}
```

- Permissão: `mdho.fill`
- Assessment: `DRAFT` ou `RETURNED`
- Status ocorrência: permanece `MDHO_EM_PREENCHIMENTO`
- **Não** gera evento de timeline

#### `submit_mdho_assessment(p_assessment_id uuid)`

- Permissão: `mdho.submit` (Supervisor HSE — Liderança **não** possui)
- Assessment → `SUBMITTED`; ocorrência → `AGUARDANDO_APROVACAO_HSE`
- Validação: categorias `requires_selection` ≥ 1; `DEVIATION_TYPE` exatamente 1; `OTHER.detail` ≥ 10 chars

#### `approve_mdho_assessment(p_assessment_id uuid)`

- Permissão: `mdho.approve` (Liderança HSE)
- Assessment → `APPROVED`; ocorrência → `AGUARDANDO_REGISTRO_IMS`
- **PO-HSE-7:** rejeita quando `submitted_by = auth.uid()` → `SELF_APPROVAL_FORBIDDEN`
- **PO-HSE-15:** idempotente se já `APPROVED` + ocorrência `AGUARDANDO_REGISTRO_IMS` (`data.idempotent: true`)
- IMS **fora** da 2.6

#### `list_mdho_pending_approvals(p_organization_id uuid, p_cursor jsonb?, p_limit int?)`

Fila operacional HSE (Sprint 2.7 — PO-HSE-12).

- Permissão: `mdho.approve`
- Filtro: `assessment.status = SUBMITTED` AND `occurrence.status = AGUARDANDO_APROVACAO_HSE`
- Ordenação: `submitted_at DESC`, desempate `assessment_id`
- Paginação: cursor `{ submitted_at, assessment_id }`

**Retorno sucesso:**

```json
{
  "success": true,
  "items": [
    {
      "occurrenceId": "uuid",
      "organizationId": "uuid",
      "assessmentId": "uuid",
      "publicCode": "SS-26-000001",
      "title": "string",
      "submittedAt": "timestamptz",
      "submittedBy": "uuid",
      "submittedByName": "string | null",
      "areaName": "string | null",
      "taskSummary": "string",
      "criticality": "LOW | MEDIUM | HIGH | CRITICAL"
    }
  ],
  "nextCursor": { "submitted_at": "timestamptz", "assessment_id": "uuid" }
}
```

Tipos: `MdhoPendingApprovalItem`, `ListMdhoPendingApprovalsResult` em `@safestop/types`. Mapper: `mapListMdhoPendingApprovalsResult`.

#### `return_mdho_assessment(p_payload jsonb)`

```json
{
  "assessment_id": "uuid",
  "return_reason": "string 10-4000"
}
```

- Permissão: `mdho.return` (Liderança HSE)
- Assessment → `RETURNED`; ocorrência → `MDHO_EM_PREENCHIMENTO`

**Erros MDHO:** `UNAUTHORIZED` | `FORBIDDEN` | `NOT_FOUND` | `STATUS_MISMATCH` | `ALREADY_EXISTS` | `ALREADY_SUBMITTED` | `VALIDATION_ERROR` | `CONFLICT` | `SELF_APPROVAL_FORBIDDEN` | `INTERNAL_ERROR`.

**Schemas client (`@safestop/validation`):**

| Operação | Schema | Campos client (camelCase) |
|---|---|---|
| Rascunho | `saveMdhoDraftSchema` | `assessmentId`, `selections?`, `complement?`, `expectedUpdatedAt?` |
| Enviar | `createSubmitMdhoSchema(catalog)` / `submitMdhoSchema` + `validateMdhoSubmitSelections` | `assessmentId`, `selections`, `complement?` |
| Devolver | `returnMdhoSchema` | `assessmentId`, `returnReason` (10–4000) |

Tipos: `@safestop/types` — `MdhoAssessment`, `MdhoCatalog`, `StartMdhoAssessmentResult`, etc. Helpers: `isMdhoEligible`, `canApproveMdhoAssessment`, `HseApprovalContext`.

**Query keys:** `occurrenceQueryKeys.mdho(occurrenceId)`, `occurrenceQueryKeys.mdhoCatalog()`, `occurrenceQueryKeys.hseApprovalQueue(organizationId, cursor?)` (fila Sprint 2.7).

**Categorias do catálogo (seed):** `BEHAVIOR` · `DEVIATION_TYPE` · `PRECONDITIONS` · `ORGANIZATIONAL_ISSUES` · `SUPERVISION_INSPECTION`.

Contrato Aprovação HSE (fila, autoaprovação, idempotência): `docs/decisions/HSE-APPROVAL-DECISIONS.md`. Domínio MDHO base: `docs/decisions/MDHO-DECISIONS.md` — **não contradizer**.

### RPCs — Referência IMS (Sprint 2.8)

Registro **manual** do código emitido em plataforma externa. **Sem** integração IMS. Contrato: `docs/decisions/IMS-REFERENCE-DECISIONS.md`.

#### `register_ims_reference(p_payload jsonb)`

```json
{
  "occurrence_id": "uuid",
  "ims_reference_code": "BAA-26-0001"
}
```

- Permissão: `ims_reference.register`
- Ramo: `decision_type = INTERDICAO_OFICIAL`
- Status exigido: `AGUARDANDO_REGISTRO_IMS` + MDHO `APPROVED`
- Formato: `^BAA-\d{2}-\d{4,}$`
- Efeito: ocorrência → `EM_TRATATIVA`; preenche `ims_reference_*`
- **PO-IMS-12:** retry com mesmo código → sucesso idempotente (`data.idempotent: true`)
- Segundo register com código **diferente** → `ALREADY_REGISTERED`

#### `update_ims_reference(p_payload jsonb)`

```json
{
  "occurrence_id": "uuid",
  "ims_reference_code": "BAA-26-0002",
  "update_reason": "string 10-4000"
}
```

- Permissão: `ims_reference.update`
- Status: `EM_TRATATIVA` ou `AGUARDANDO_VALIDACAO` (não terminal)
- Código já registrado; novo código ≠ anterior; **não** altera status
- History metadata-only (`action: update_ims`)

**Erros IMS:** `UNAUTHORIZED` | `FORBIDDEN` | `NOT_FOUND` | `STATUS_MISMATCH` | `VALIDATION_ERROR` | `ALREADY_REGISTERED` | `CONFLICT` | `INTERNAL_ERROR`.

**Schemas client (`@safestop/validation`):**

| Operação | Schema | Campos client (camelCase) |
|---|---|---|
| Registrar | `registerImsReferenceSchema` | `occurrenceId`, `imsReferenceCode` |
| Corrigir | `updateImsReferenceSchema` | `occurrenceId`, `imsReferenceCode`, `updateReason` |

Tipos: `RegisterImsReferenceResult`, `UpdateImsReferenceResult` em `@safestop/types`. Helper: `isImsRegisterEligible(occurrence)`.

**Listagem:** `OccurrenceListFilters.imsReferenceCode` — filtro contains (PO-IMS-10).

---

### RPCs — Plano de Ação (Sprint 3.0)

Plano estruturado pós-IMS no ramo IO. Contrato: `docs/decisions/ACTION-PLAN-DECISIONS.md`.

#### `create_action_plan(p_payload jsonb)`

```json
{
  "occurrence_id": "uuid",
  "summary": "string opcional, max 4000"
}
```

- Permissão: `action_plan.create`
- Pré-condição: `INTERDICAO_OFICIAL` + `EM_TRATATIVA` + `ims_reference_code` preenchido
- Idempotente se plano ativo existe (`data.idempotent: true`)

#### `update_action_plan(p_payload jsonb)`

```json
{
  "plan_id": "uuid",
  "summary": "string opcional, max 4000"
}
```

- Permissão: `action_plan.create` **ou** `action_plan.manage`
- Plano editável (`OPEN` / `IN_PROGRESS` / `AWAITING_VALIDATION`)

#### `submit_action_item(p_payload jsonb)`

```json
{
  "item_id": "uuid",
  "completion_description": "string opcional, max 4000"
}
```

- Permissão: `action_plan.manage` **ou** responsável da ação
- `PENDING` / `IN_PROGRESS` → `AWAITING_VALIDATION`
- **PO-AP-16:** prioridade `HIGH` / `CRITICAL` exige ≥1 evidência `COMPLETED`

#### `validate_action_item(p_payload jsonb)`

```json
{
  "item_id": "uuid",
  "outcome": "COMPLETED | REJECTED",
  "note": "string opcional; obrigatório 10–4000 se REJECTED"
}
```

- Permissão: `action_plan.validate`
- `COMPLETED` → item `COMPLETED`
- `REJECTED` → item volta `IN_PROGRESS` (não `REJECTED`)
- **PO-AP-17:** `completed_by = auth.uid()` → `SELF_VALIDATION_FORBIDDEN`

#### `cancel_action_item(p_payload jsonb)`

```json
{
  "item_id": "uuid",
  "reason": "string 10–4000"
}
```

- Permissão: `action_plan.manage`
- Item → `CANCELLED`

#### `add_action_item(p_payload jsonb)`

```json
{
  "plan_id": "uuid",
  "title": "string 3–200",
  "description": "string opcional, max 4000",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL",
  "due_at": "ISO 8601",
  "responsible_member_id": "uuid",
  "responsible_organization_id": "uuid opcional"
}
```

- Permissão: `action_plan.manage`
- Plano editável (`OPEN` / `IN_PROGRESS` / `AWAITING_VALIDATION`)
- **PO-AP-13:** `due_at` obrigatório
- **PO-AP-14:** responsável = membro ativo da org da ocorrência

#### `update_action_item(p_payload jsonb)`

```json
{
  "item_id": "uuid",
  "title": "string opcional",
  "description": "string opcional",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL opcional",
  "due_at": "ISO 8601 opcional",
  "responsible_member_id": "uuid opcional",
  "responsible_organization_id": "uuid opcional"
}
```

- Permissão: `action_plan.manage`
- Conforme status do item (não terminal)

#### `start_action_item(p_item_id uuid)`

- Permissão: `action_plan.manage` **ou** responsável da ação
- `PENDING` → `IN_PROGRESS`

#### `complete_action_plan(p_plan_id uuid)`

- Permissão: `action_plan.manage`
- **PO-AP-11:** todas as ações `COMPLETED` ou `CANCELLED`; ≥1 `COMPLETED`
- Plano → `COMPLETED` + `closed_at`
- **PO-AP-12:** ocorrência **permanece** `EM_TRATATIVA` — sem transição para `AGUARDANDO_VALIDACAO`

#### Anexos por ação (espelho evidências 2.2)

| RPC | Permissão | Notas |
|---|---|---|
| `prepare_action_item_attachment_upload` | manage **ou** responsável | Bucket subpath por item |
| `complete_action_item_attachment_upload` | idem | Timeline `ACTION_ITEM_EVIDENCE_ADDED` |
| `fail_action_item_attachment_upload` | idem | |
| `delete_action_item_attachment` | manage **ou** responsável | Soft delete |
| `get_action_item_attachment_signed_url` | `occurrence.read` + escopo | |

Limites: **PO-AP-15** — 10 MiB, 20 ativas, MIME permitidos (`EVIDENCE-DECISIONS`).

**Erros Plano de Ação:** `UNAUTHORIZED` | `FORBIDDEN` | `NOT_FOUND` | `STATUS_MISMATCH` | `VALIDATION_ERROR` | `ALREADY_EXISTS` | `CONFLICT` | `SELF_VALIDATION_FORBIDDEN` | `INTERNAL_ERROR`.

**Fora 3.0:** `submit_action_plan_for_occurrence_validation`, `release_occurrence`, `close_occurrence`, `add_action_item_note` (P1 opcional).

**Schemas client (`@safestop/validation`):**

| Operação | Schema | Campos client (camelCase) |
|---|---|---|
| Criar plano | `createActionPlanSchema` | `occurrenceId`, `summary?` |
| Atualizar plano | `updateActionPlanSchema` | `planId`, `summary?` |
| Concluir ação | `submitActionItemSchema` | `itemId`, `completionDescription?` |
| Validar ação | `validateActionItemSchema` | `itemId`, `outcome`, `note?` |
| Cancelar ação | `cancelActionItemSchema` | `itemId`, `reason` |

Tipos: `ActionPlan`, `ActionItem`, guards em `@safestop/types`. Helper: `shouldShowActionPlanSection(occurrence)`.

**Query keys:** `actionPlanKeys.byOccurrence(orgId, occurrenceId)`, `items`, `item`, `attachments`.

**Timeline kinds:** `ACTION_PLAN_CREATED` · `ACTION_ITEM_CREATED` · `ACTION_ITEM_ASSIGNED` · `ACTION_ITEM_DUE_CHANGED` · `ACTION_ITEM_STATUS_CHANGED` · `ACTION_PLAN_COMPLETED` · `ACTION_ITEM_EVIDENCE_ADDED`.

---

### RPCs — Notificações in-app (Sprint 3.1)

Notificações internas, leitura e ciência. Contrato: `docs/decisions/NOTIFICATIONS-DECISIONS.md`. Eventos gerados server-side — cliente **não** insere em `notification_events`/`notifications`.

#### `mark_notification_read(p_notification_id uuid)`

- Permissão: `notification.read`
- Destinatário: `recipient_member_id` = membro ativo do `auth.uid()`
- Idempotente se já lida
- **Não** grava ciência (leitura ≠ ciência)

#### `mark_all_notifications_read(p_organization_id uuid)`

- Permissão: `notification.read`
- Marca `read_at` em todas não lidas do membro na organização
- **Não** confirma ciência

#### `confirm_notification_awareness(p_notification_id uuid)`

- Permissão: `notification.confirm_awareness`
- Exige `requires_awareness = true`
- Idempotente; também preenche `read_at` se ausente

#### `list_my_notifications(p_organization_id uuid, p_cursor timestamptz default null, p_limit integer default 20)`

- Permissão: `notification.read`
- Paginação cursor (`created_at` desc); `p_limit` 1–100
- Retorno: `{ success, items[], nextCursor }` — itens em camelCase (`eventType`, `occurrenceId`, `requiresAwareness`, …)

**Erros Notificações:** `UNAUTHORIZED` | `FORBIDDEN` | `NOT_FOUND` | `VALIDATION_ERROR` | `INTERNAL_ERROR`.

**Schemas / tipos client:** `@safestop/types` — `NotificationListItem`, `NotificationBadgeCounts`; services em `features/notifications/`.

**Query keys:** `notificationKeys` em `@safestop/query-keys` — list, badge, invalidation matrix.

---

### RPCs — Dashboard (Sprint 3.2)

KPIs agregados de estoque e fluxo. Contrato: `docs/decisions/DASHBOARD-DECISIONS.md` (PO-DASH-1…4). Fórmulas: `@safestop/types` `dashboard-formulas.ts` — **não** duplicar no client.

#### `get_dashboard_kpis(p_organization_id uuid, p_due_soon_days integer default 3, p_period_start timestamptz default null, p_period_end timestamptz default null)`

- Permissão: autenticado + vínculo ativo na organização; gates **internos** por seção (`has_permission`)
- `SECURITY DEFINER` — agregação org-wide em `notifications` exige bypass RLS controlado (`pendingAwarenessOrg` → `report.read`)
- `p_due_soon_days`: 1–30 (default 3) — janela `dueSoonActionItems` e `personal.myDueSoonActions`
- `p_period_start` / `p_period_end`: opcionais — métricas de fluxo retornam `null` quando ausentes (não agregam “todo o histórico”)
- Spoof de org: `ORGANIZATION_NOT_ALLOWED` (`42501`)

**Retorno (jsonb — sucesso):**

```json
{
  "personal": {
    "myPendingActions": 0,
    "myOverdueActions": 0,
    "myDueSoonActions": 0,
    "myPendingAwareness": 0
  },
  "operational": {
    "scopedOpenOccurrences": null,
    "scopedPendingAwareness": null
  },
  "managerial": {
    "activeOccurrences": null,
    "pendingEvaluation": null,
    "activeInterdictions": null,
    "awaitingValidation": null,
    "mdhoPendingApproval": null,
    "overdueActionItems": null,
    "dueSoonActionItems": null,
    "openActionPlans": null,
    "pendingAwarenessOrg": null,
    "newOccurrencesInPeriod": null,
    "avgEvaluationTimeMinutes": null,
    "avgReleaseTimeMinutes": null,
    "actionCompletionRate": null,
    "occurrencesByStatusFamily": null,
    "occurrencesByArea": null
  }
}
```

**Regra de nulidade:** `null` = sem permissão para o indicador; `0` = permissão concedida, valor real zero.

**Erros:** envelope `{ success: false, error: { code, message } }` para `UNAUTHORIZED` / `VALIDATION_ERROR`; exceção SQL `ORGANIZATION_NOT_ALLOWED` para org inválida.

**Schemas / tipos client:** `buildDashboardKpisRpcArgs`, `mapDashboardKpisRpcPayload` em `@safestop/types/dashboard-rpc.ts`.

**Query keys:** `dashboardKeys` em `@safestop/query-keys`.

**Filtros de escopo (área/contrato/contratada):** **client-side** na 3.2 — RPC **não** recebe parâmetros de escopo além de organização e período.

---

### RPCs — Relatórios gerenciais (Sprint 3.3)

Listagens paginadas e auditoria de exportação. Contrato: `docs/decisions/REPORTS-DECISIONS.md` (PO-REP-1…6). Tipos: `@safestop/types/report.ts`.

**Permissão comum:** `report.read` na organização (Gate G — migration `20260823200000_fix_report_rpc_require_report_read.sql`). Escopo de linhas: `can_access_occurrence` (Ocorrências/Plano) ou agregação controlada (Ciência).

**Paginação:** cursor keyset jsonb `{ "sortValue": string, "id": uuid }` — **não** offset. Retorno:

```json
{
  "items": [],
  "nextCursor": { "sortValue": "...", "id": "uuid" } | null,
  "hasNext": false
}
```

**Erros (exceções SQL):** `UNAUTHORIZED` (`28000`) · `VALIDATION_ERROR` (`22023`) · `ORGANIZATION_NOT_ALLOWED` / `PERMISSION_DENIED` (`42501`) · `INVALID_SORT_FIELD` · `INVALID_SORT_DIRECTION`

#### `list_occurrences_report(...)`

| Parâmetro | Tipo | Default | Notas |
|---|---|---|---|
| `p_organization_id` | uuid | — | obrigatório |
| `p_period_start` / `p_period_end` | timestamptz | null | filtra `occurred_at` |
| `p_area_id` / `p_contract_id` / `p_contractor_organization_id` | uuid | null | escopo |
| `p_status` / `p_severity` | text[] | null | arrays |
| `p_has_ims` | boolean | null | true/false/null |
| `p_search` | text | null | contains em `public_code` |
| `p_sort_field` | text | `occurred_at` | allowlist: `public_code`, `occurred_at`, `status`, `severity`, `area` |
| `p_sort_direction` | text | `desc` | `asc` \| `desc` |
| `p_cursor` | jsonb | null | keyset |
| `p_limit` | integer | 20 | 1–100 |

- Modo: `SECURITY INVOKER`
- Item: `OccurrenceReportRow` (camelCase — 19 campos incl. `statusFamily`, `createdByName`, …)

#### `list_action_items_report(...)`

| Parâmetro | Tipo | Default | Notas |
|---|---|---|---|
| `p_organization_id` | uuid | — | obrigatório |
| `p_period_start` / `p_period_end` | timestamptz | null | filtra `due_at` |
| `p_responsible_member_id` | uuid | null | |
| `p_status` | text[] | null | |
| `p_overdue_only` / `p_due_soon_only` | boolean | null | flags |
| `p_due_soon_days` | integer | 3 | 1–30 |
| `p_sort_field` | text | `due_at` | allowlist: `due_at`, `status`, `title` |
| `p_sort_direction` | text | `asc` | |
| `p_cursor` / `p_limit` | jsonb / integer | null / 20 | |

- Modo: `SECURITY INVOKER`
- Item: `ActionItemReportRow` — **sem** `publicCode` da ocorrência (apenas `occurrenceId`)

#### `list_awareness_report(...)`

| Parâmetro | Tipo | Default | Notas |
|---|---|---|---|
| `p_organization_id` | uuid | — | obrigatório |
| `p_period_start` / `p_period_end` | timestamptz | null | filtra `created_at` |
| `p_occurrence_id` / `p_recipient_member_id` | uuid | null | |
| `p_pending_only` | boolean | null | ciência pendente |
| `p_sort_field` | text | `created_at` | allowlist: `created_at`, `event_type` |
| `p_sort_direction` | text | `desc` | |
| `p_cursor` / `p_limit` | jsonb / integer | null / 20 | |

- Modo: `SECURITY DEFINER` — gate `report.read` na **primeira** linha
- Item: `AwarenessReportRow` — leitura (`readAt`) ≠ ciência (`awarenessConfirmedAt`)

#### `log_report_export(p_organization_id uuid, p_report_type text, p_export_format text, p_filters jsonb, p_row_count integer)`

- Permissão: `report.read`
- Modo: `SECURITY DEFINER`
- Retorno: `void` (sucesso silencioso)
- `p_report_type`: `OCCURRENCES` \| `ACTION_ITEMS` \| `AWARENESS`
- `p_export_format`: `CSV` \| `XLSX`
- Chamada **após** montar arquivo; falha de log **não** bloqueia download (PO-REP-6)

**Exportação client:** `REPORT_EXPORT_MAX_ROWS` = 10.000 — acima disso, erro tratado na UI.

**Schemas client:** `buildListOccurrencesReportRpcArgs`, `buildListActionItemsReportRpcArgs`, `buildListAwarenessReportRpcArgs`, `buildLogReportExportRpcArgs` em `@safestop/types/report.ts`.

**Query keys:** `reportKeys` em `@safestop/query-keys`.

**Rotas Web:** `/reports`, `/reports/occurrences`, `/reports/action-items`, `/reports/awareness` — feature `features/reports/`.

---

### RPCs — Lista operacional de Paralisações Preventivas (PR-D1 / PO-UX-10)

RPC **distinta** de `list_occurrences_report`. Não reutilizar filtros, permissão nem colunas de relatório.

Contrato: `docs/database.md` §25.4 · migration `20260825220000_list_operational_occurrences.sql` · tipos: `@safestop/types/operational-occurrence-list.ts`.

#### `list_operational_occurrences(...)`

| Parâmetro | Tipo | Default | Notas |
|---|---|---|---|
| `p_organization_id` | uuid | — | obrigatório |
| `p_search` | text | null | trim; vazio = sem filtro. `ilike` contains em `public_code`, `task_description`, `location_description`, `ims_reference_code`, `areas.name`, nome da contratada (`resolve_organization_display_name`) |
| `p_area_id` | uuid | null | `occurrences.area_id` |
| `p_contractor_organization_id` | uuid | null | `occurrences.contractor_organization_id` |
| `p_status` | text[] | null | enum `OccurrenceStatus` existente |
| `p_severity` | text[] | null | `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` — a UI envia criticidade única; o builder serializa array de 1 |
| `p_ims_reference_code` | text | null | contains (`ilike`), mesmo espírito de PO-IMS-10 |
| `p_cursor` | jsonb | null | keyset `{ "sortValue": string, "id": uuid }` |
| `p_limit` | integer | 20 | clamp 1–100 |

- Permissão: `occurrence.read` na org alvo (`is_platform_admin()` segue o padrão de membership). **Não** exige `report.read`.
- Escopo de linha: `organization_id = p_organization_id` + `can_access_occurrence` + RLS (`SECURITY INVOKER`, `search_path = ''`).
- Ordenação: **fixa** `created_at desc, id desc`. Sem `p_sort_field`. Sem OFFSET.
- Paginação: keyset. Busca `limit+1`; `hasNext` / `nextCursor` no último item da página.
- Retorno:

```json
{
  "items": [ OccurrenceSummary ],
  "nextCursor": { "sortValue": "YYYY-MM-DD HH24:MI:SS.US", "id": "uuid" },
  "hasNext": false
}
```

- Item (`OccurrenceSummary`, camelCase): `id`, `publicCode`, `title`, `status`, `severity`, `areaName`, `contractorOrganizationName`, `createdAt`, `createdByName`. Sem colunas 1:N. Sem `statusFamily`.
- Erros (exceções SQL): `UNAUTHORIZED` (`28000`) · `VALIDATION_ERROR` (`22023`) · `ORGANIZATION_NOT_ALLOWED` / `FORBIDDEN` (`42501`). `FORBIDDEN` = sem `occurrence.read` (não usar o código `PERMISSION_DENIED` dos relatórios).
- GRANT: `EXECUTE` para `authenticated`. Sem grant para `anon`.
- Atividade não é FK: entra em `p_search` via `task_description`.

**Diferença vs `list_occurrences_report`:**

| | `list_operational_occurrences` | `list_occurrences_report` |
|---|---|---|
| Persona | Lista de cards (Campo / HSE) | Relatório gerencial (Web) |
| Permissão | `occurrence.read` | `report.read` |
| Busca `p_search` | vários campos (código, atividade, local, IMS, área, contratada) | só `public_code` |
| Colunas | 9 (`OccurrenceSummary`) | 19 (`OccurrenceReportRow`) |
| Ordenação | fixa `created_at` + `id` | allowlist `p_sort_field` |
| Período / contrato / `hasIms` / `statusFamily` | não | sim |

**Schemas client:** `buildListOperationalOccurrencesRpcArgs`, `mapListOperationalOccurrencesResult`, `mapOccurrenceSummary` em `@safestop/types`. Filtros de UI: `OccurrenceListFilters` (não `OccurrenceReportFilters`).

---

# Comunicação Mobile

O aplicativo Mobile deve comunicar-se utilizando:

```text
TanStack Query

↓

Services

↓

Supabase
```

Nunca acessar o Supabase diretamente pelas telas.

---

# Comunicação Web

O painel Web seguirá exatamente o mesmo padrão.

```text
Component

↓

Hooks

↓

Services

↓

Supabase
```

---

# Arquitetura de Services

Cada domínio possui seu próprio Service.

Exemplo:

```text
OccurrenceService

NotificationService

MDHOService

IMSService

ActionPlanService

UserService
```

Nunca criar um Service genérico contendo toda a aplicação.

---

# Organização dos Services

Exemplo:

```text
services/

occurrence/

notification/

mdho/

ims/

users/

organizations/
```

---

# Responsabilidade dos Services

Um Service deve:

- validar parâmetros;
- chamar Supabase;
- transformar dados;
- lançar erros padronizados;
- retornar DTOs.

Nunca renderizar interface.

Nunca acessar componentes.

---

# Responsabilidade dos Hooks

Os Hooks são responsáveis por:

- estado;
- cache;
- loading;
- retry;
- integração com TanStack Query.

Nunca implementar regra de negócio.

---

# Responsabilidade dos Componentes

Componentes apenas:

- exibem dados;
- recebem eventos;
- chamam Hooks.

Nunca chamar Supabase diretamente.

---

# Fluxo Oficial

```text
Screen

↓

Component

↓

Hook

↓

Service

↓

Supabase

↓

Database
```

Todo novo módulo deve seguir essa estrutura.

---

# Princípios REST

Mesmo utilizando Server Actions e Supabase, toda API deve respeitar princípios REST.

As operações devem ser previsíveis.

---

## Create

Criação de recursos.

---

## Read

Consulta de recursos.

---

## Update

Atualização.

---

## Delete

Remoção lógica sempre que possível.

Evitar exclusões físicas.

---

# Convenções

Toda operação deve possuir:

- nome claro;
- responsabilidade única;
- retorno tipado;
- tratamento de erro;
- documentação.

---

# Convenção de Nomes

Preferir:

```text
createOccurrence()

updateOccurrence()

cancelOccurrence()

approveMDHO()

confirmInterdiction()

registerIMSReference()
```

Evitar:

```text
save()

process()

handle()

execute()

doStuff()
```

---

# Estrutura dos Arquivos

Exemplo:

```text
services/

occurrence/

createOccurrence.ts

updateOccurrence.ts

cancelOccurrence.ts

approveOccurrence.ts

queries.ts

mutations.ts

types.ts
```

---

# Organização por Domínio

Toda implementação deve seguir domínio de negócio.

Exemplo:

```text
occurrence/

notification/

organization/

authentication/

users/

audit/

reports/

dashboard/
```

Nunca organizar por tipo técnico.

---

# Versionamento

A API deve ser evolutiva.

Mudanças incompatíveis devem gerar nova versão.

Exemplo:

```text
v1

v2
```

Evitar quebrar contratos existentes.

---

# Compatibilidade

Novas funcionalidades devem preservar compatibilidade sempre que possível.

Quando houver quebra:

- documentar;
- criar migração;
- atualizar ADR quando necessário.

---

# Idempotência

Operações críticas devem ser idempotentes sempre que possível.

Exemplo:

Confirmar Ciência

↓

duas chamadas

↓

mesmo resultado

---

# Atomicidade

Operações críticas devem ocorrer dentro de transações quando necessário.

Exemplos:

- criação de ocorrência;
- aprovação MDHO;
- liberação;
- encerramento.

Nunca deixar o sistema em estado inconsistente.

---

# Auditoria

Toda operação crítica deve registrar:

- usuário;
- data;
- organização;
- ação;
- recurso;
- alterações realizadas.

A auditoria nunca depende do cliente.

---

# Segurança

Nenhuma regra crítica deve existir apenas no Frontend.

Toda validação importante deve ocorrer:

- Server Action;
- Edge Function;
- PostgreSQL;
- RLS.

---

# Regra Geral

A camada de comunicação do SafeStop deve ser:

- previsível;
- simples;
- tipada;
- reutilizável;
- desacoplada;
- segura;
- documentada.

Ela representa a principal ponte entre a interface e as regras de negócio do sistema.

---

# Autenticação

O SafeStop utiliza o **Supabase Auth** como mecanismo oficial de autenticação.

Nenhuma autenticação paralela deverá ser implementada sem aprovação arquitetural.

Toda autenticação deve ser centralizada no Supabase.

---

# Métodos de Autenticação

O sistema deverá suportar:

- E-mail e senha;
- Magic Link (quando aplicável);
- OAuth (futuramente);
- SSO corporativo (futuramente).

A estratégia inicial será:

```text
Email + Password
```

---

# Sessão

A sessão deve ser gerenciada pelo Supabase.

O Frontend nunca deverá criar ou manipular JWT manualmente.

Sempre utilizar os métodos oficiais do SDK.

---

# Tokens

O cliente nunca deve:

- modificar tokens;
- armazenar tokens manualmente;
- gerar tokens;
- compartilhar tokens.

Toda renovação deverá ocorrer automaticamente pelo Supabase.

---

# Refresh Token

A renovação da sessão deve ocorrer automaticamente.

Nunca solicitar novo login apenas porque o Access Token expirou.

---

# Logout

Ao realizar logout:

- invalidar sessão;
- limpar cache local;
- limpar TanStack Query;
- limpar dados temporários;
- limpar dados Offline quando necessário.

Nunca manter informações sensíveis após logout.

---

# Usuário Autenticado

Após autenticação, o sistema deve recuperar:

- usuário;
- organização ativa;
- permissões;
- funções;
- preferências.

Esses dados serão utilizados durante toda a sessão.

---

# Autorização

Autenticação e autorização são responsabilidades diferentes.

Autenticação responde:

```text
Quem é o usuário?
```

Autorização responde:

```text
O que ele pode fazer?
```

Toda autorização deve ocorrer no backend.

---

# Modelo de Permissões

O SafeStop utiliza:

```text
RBAC
```

(Role-Based Access Control)

As permissões são atribuídas através de papéis (Roles).

---

# Estrutura

```text
Usuário

↓

Role

↓

Permissões
```

Nunca atribuir permissões diretamente ao usuário, salvo exceções justificadas.

---

# Roles

Papéis oficiais:

```text
HSE de Campo

Liderança da Contratada

Fiscal do Contrato

Supervisor HSE

Liderança HSE

Gestor

Administrador da Empresa

Administrador da Plataforma
```

As Roles oficiais encontram-se documentadas em:

```text
docs/database.md
```

---

# Permissões

As permissões devem ser granulares.

Exemplos:

```text
occurrence.create

occurrence.read

occurrence.evaluate

occurrence.validate_correction

occurrence.cancel

mdho.fill

mdho.approve

notification.read

notification.confirm_awareness

user.manage

organization.manage
```

Nunca utilizar permissões genéricas como:

```text
admin=true
```

---

# Multi-Tenant

O SafeStop é uma aplicação Multi-Tenant.

Cada organização possui isolamento completo.

---

# Organização Ativa

Toda requisição deve conhecer:

```text
organization_id
```

Esse valor define o contexto operacional.

---

# Isolamento

Um usuário nunca deve visualizar dados pertencentes a outra organização.

Esse isolamento deve ser garantido pelo banco de dados.

Nunca apenas pelo Frontend.

---

# Row Level Security (RLS)

Toda tabela operacional deverá possuir políticas RLS.

Exemplos:

- occurrences;
- notifications;
- mdho;
- users;
- organizations;
- action_plans;
- evidences.

Nunca desabilitar RLS.

---

# Fonte da Autorização

A autorização deve seguir a sequência:

```text
JWT

↓

Organization

↓

Role

↓

Permission

↓

RLS
```

Essa sequência nunca deve ser invertida.

---

# Validação de Permissões

Antes de executar qualquer operação crítica verificar:

- usuário autenticado;
- organização ativa;
- role válida;
- permissão necessária.

Caso qualquer validação falhe:

Retornar erro.

---

# Erros de Autorização

Nunca retornar mensagens ambíguas.

Preferir:

```text
Você não possui permissão para aprovar este MDHO.
```

Evitar:

```text
Operação inválida.
```

---

# Recursos Sensíveis

Exigem validação adicional:

- usuários;
- permissões;
- organizações;
- auditoria;
- configurações;
- referência IMS;
- aprovação MDHO;
- liberação;
- interdição.

---

# Referência IMS

O SafeStop NÃO gera códigos IMS.

O código é registrado manualmente.

A API apenas:

- valida formato;
- registra;
- audita;
- disponibiliza para consulta.

Nunca criar integração fictícia.

---

# Auditoria

Toda operação crítica deve gerar registro em auditoria.

Exemplos:

- login;
- logout;
- criação;
- edição;
- aprovação;
- rejeição;
- cancelamento;
- liberação;
- alteração de permissões.

---

# Registro de Auditoria

Toda auditoria deve conter:

- usuário;
- organização;
- data;
- recurso;
- ação;
- identificador;
- IP (quando disponível);
- dispositivo (quando disponível).

---

# Princípio do Menor Privilégio

Todo usuário deve possuir apenas as permissões necessárias.

Nunca conceder acesso superior por conveniência.

---

# Elevação de Privilégio

Quando uma operação exigir privilégios elevados:

- validar Role;
- validar Permissão;
- registrar auditoria;
- registrar data;
- registrar responsável.

---

# Sessões Simultâneas

O sistema deve suportar múltiplas sessões do mesmo usuário.

Cada sessão deve ser controlada independentemente.

---

# Expiração

Caso a sessão expire:

- preservar rascunhos locais;
- solicitar nova autenticação;
- continuar sincronização após novo login.

Nunca perder informações locais.

---

# Proteção contra Acesso Indevido

Toda requisição deve validar:

- autenticação;
- autorização;
- organização;
- recurso.

Jamais confiar em parâmetros enviados pelo cliente.

---

# Segurança das Edge Functions

Toda Edge Function deve validar:

- JWT;
- organização;
- permissões;
- payload;
- origem da requisição.

Nunca assumir que a chamada é confiável.

---

# Segurança das Server Actions

Server Actions devem:

- validar sessão;
- validar usuário;
- validar payload;
- validar permissões;
- validar regras de negócio.

Nunca executar mutações sem validação.

---

# Logs de Segurança

Operações críticas devem gerar logs específicos.

Exemplos:

- tentativa de acesso negado;
- alteração de permissões;
- login suspeito;
- falha de autenticação;
- alteração de organização.

---

# Boas Práticas

Sempre:

- utilizar Auth oficial;
- utilizar RLS;
- validar permissões;
- registrar auditoria;
- tratar erros corretamente;
- manter isolamento entre organizações.

Nunca:

- confiar no Frontend;
- expor Service Role;
- desabilitar RLS;
- armazenar segredos no cliente;
- ignorar permissões.

---

# Regra Geral

Toda autenticação deve ser realizada pelo Supabase.

Toda autorização deve ser garantida pelo backend.

Toda permissão deve ser protegida por RLS.

Toda operação crítica deve ser auditada.

A segurança da API nunca deve depender do comportamento do cliente.

---

# DTOs

Toda comunicação entre o Frontend e o Backend deve utilizar DTOs (Data Transfer Objects).

DTOs garantem:

- consistência;
- tipagem;
- previsibilidade;
- desacoplamento;
- facilidade de manutenção.

Nenhum componente deve consumir diretamente estruturas retornadas pelo banco.

---

# Objetivos dos DTOs

Os DTOs existem para:

- padronizar contratos;
- esconder detalhes internos do banco;
- facilitar versionamento;
- evitar vazamento de informações;
- reduzir acoplamento.

---

# Organização

Os DTOs devem ser organizados por domínio.

Exemplo:

```text
packages/

types/

occurrence/

OccurrenceDTO.ts

CreateOccurrenceDTO.ts

UpdateOccurrenceDTO.ts

OccurrenceDetailsDTO.ts

OccurrenceListDTO.ts
```

---

# Convenções

Todo DTO deve:

- possuir nome claro;
- possuir apenas os campos necessários;
- ser imutável sempre que possível;
- representar um contrato.

---

# Request DTO

Responsável pelos dados enviados para a API.

Exemplo:

```typescript
CreateOccurrenceDTO;
```

---

# Response DTO

Responsável pelos dados retornados ao cliente.

Exemplo:

```typescript
OccurrenceResponseDTO;
```

---

# Nunca Retornar Entidades

Nunca retornar diretamente:

- tabelas;
- models;
- registros crus do PostgreSQL.

Sempre retornar DTOs.

---

# Transformação

Toda transformação deve ocorrer na camada de Services.

Fluxo:

```text
Database

↓

Entity

↓

Mapper

↓

DTO

↓

Frontend
```

---

# Mappers

Toda conversão entre Entity e DTO deve ocorrer através de Mappers.

Nunca espalhar transformações pelo código.

Exemplo:

```text
OccurrenceMapper

NotificationMapper

MDHOMapper

IMSMapper
```

---

# Requests

Toda requisição deve possuir estrutura previsível.

Nunca depender de parâmetros implícitos.

---

# Payload

O payload deve conter apenas informações necessárias.

Evitar:

- campos duplicados;
- objetos enormes;
- estruturas profundas.

---

# Responses

Toda resposta deve ser consistente.

Mesmo tipo de operação.

Mesmo formato.

Sempre.

---

# Estrutura Oficial

Operações bem-sucedidas devem retornar:

```text
status

data

meta (quando necessário)
```

---

Exemplo conceitual:

```json
{
  "status": "success",
  "data": {},
  "meta": {}
}
```

---

# Meta

O objeto meta poderá conter:

- paginação;
- quantidade;
- tempo de processamento;
- cursor;
- informações auxiliares.

---

# Responses Vazias

Operações sem retorno relevante devem responder apenas confirmação de sucesso.

Nunca retornar estruturas desnecessárias.

---

# Error Response

Toda resposta de erro deve seguir o mesmo padrão.

Estrutura:

```text
status

error

message

details

traceId
```

---

Exemplo conceitual:

```json
{
  "status": "error",
  "error": "VALIDATION_ERROR",
  "message": "Empresa obrigatória.",
  "details": {},
  "traceId": "..."
}
```

---

# Mensagens

As mensagens devem ser:

- objetivas;
- compreensíveis;
- consistentes.

Evitar mensagens técnicas.

---

# Códigos de Erro

Padronizar erros.

Exemplos:

```text
VALIDATION_ERROR

UNAUTHORIZED

FORBIDDEN

NOT_FOUND

CONFLICT

BUSINESS_RULE

RATE_LIMIT

SERVER_ERROR
```

Nunca inventar códigos aleatórios.

---

# Trace ID

Toda operação crítica deve possuir Trace ID.

Objetivos:

- auditoria;
- suporte;
- observabilidade.

---

# Validação

Toda entrada deve ser validada antes de qualquer processamento.

A validação deve ocorrer:

- Server Actions;
- Edge Functions;
- PostgreSQL (quando aplicável).

Nunca confiar no Frontend.

---

# Zod

A biblioteca oficial para validação será:

```text
Zod
```

Todos os DTOs devem possuir Schema correspondente.

---

# Sanitização

Antes de persistir dados:

- remover espaços desnecessários;
- normalizar texto;
- validar formatos;
- impedir conteúdo inválido.

---

# Paginação

Toda listagem deverá suportar paginação.

Nunca retornar milhares de registros em uma única requisição.

---

# Estratégia

Utilizar paginação baseada em Cursor sempre que possível.

Fallback:

Offset.

---

# Estrutura da Paginação

A resposta poderá conter:

```text
items

nextCursor

previousCursor

hasNext

total
```

---

# Tamanho da Página

Valores recomendados:

Mobile

20

Web

50

Máximo permitido

100

---

# Ordenação

Toda listagem deverá permitir ordenação.

Campos comuns:

- data;
- atualização;
- criticidade;
- prioridade;
- status.

---

# Direção

Permitir:

```text
ASC

DESC
```

---

# Filtros

Filtros devem ser independentes.

Exemplos:

- organização;
- empresa;
- área;
- usuário;
- status;
- criticidade;
- período;
- responsável.

---

# Busca

Toda busca textual deve ser:

- insensível a maiúsculas;
- rápida;
- indexada.

Evitar buscas por LIKE sem necessidade.

---

# Pesquisa Global

Sempre que possível utilizar pesquisa unificada.

Exemplo:

Buscar ocorrência por:

- código;
- empresa;
- área;
- descrição.

---

# Upload

Todo upload deve utilizar Supabase Storage.

Nunca salvar arquivos diretamente no banco.

---

# Tipos Aceitos

Exemplos:

Fotografias

PDF

DOCX

XLSX

Vídeos (quando aprovados)

---

# Organização do Storage

Estrutura sugerida:

```text
occurrences/

evidences/

mdho/

documents/

avatars/

reports/
```

---

# Nome dos Arquivos

Nunca utilizar nome enviado pelo usuário.

Sempre gerar identificadores únicos.

---

# Metadados

Todo upload deve registrar:

- autor;
- data;
- organização;
- ocorrência;
- tipo;
- tamanho;
- MIME Type.

---

# Download

Todo download deve respeitar permissões.

Nunca expor URLs públicas de arquivos privados.

Preferir Signed URLs.

---

# Compressão

Sempre que possível:

- comprimir imagens;
- otimizar PDFs;
- reduzir tráfego.

Especialmente no Mobile.

---

# Limites

A API deve definir limites para:

- tamanho de arquivos;
- quantidade de anexos;
- tipos permitidos.

Nunca depender apenas do cliente.

---

# Versionamento dos DTOs

Mudanças incompatíveis devem gerar nova versão.

Evitar quebrar contratos existentes.

---

# Compatibilidade

Sempre priorizar compatibilidade retroativa.

Quando impossível:

- documentar;
- comunicar;
- atualizar documentação.

---

# Boas Práticas

Sempre:

- utilizar DTOs;
- validar payload;
- retornar Responses padronizados;
- utilizar paginação;
- utilizar filtros;
- utilizar upload seguro;
- documentar mudanças.

Nunca:

- retornar entidades diretamente;
- expor estrutura do banco;
- confiar no cliente;
- criar Responses diferentes para a mesma operação.

---

# Regra Geral

Toda comunicação entre Frontend e Backend deve ocorrer através de contratos claros, tipados, versionáveis e documentados.

A consistência dos DTOs e Responses é essencial para manter a previsibilidade e a evolução sustentável da API do SafeStop.

---

# Realtime

O SafeStop utiliza o **Supabase Realtime** para distribuir atualizações em tempo real entre dispositivos conectados.

O objetivo é manter Mobile e Web sincronizados sempre que possível.

O Realtime complementa o sistema de sincronização.

Ele não substitui a persistência do banco de dados.

---

# Objetivos

O Realtime deve ser utilizado para:

- atualização de status;
- novas ocorrências;
- notificações;
- mudanças de responsáveis;
- atualizações do plano de ação;
- conclusão de validações;
- encerramento de ocorrências.

Nunca utilizar Realtime para executar regras de negócio.

---

# Fluxo

```text
Usuário

↓

Server Action

↓

PostgreSQL

↓

Realtime

↓

Clientes conectados
```

Toda informação distribuída em tempo real já deve estar persistida.

---

# Eventos

Os eventos devem representar mudanças de negócio.

Exemplos:

```text
OccurrenceCreated

OccurrenceUpdated

OccurrenceCancelled

OccurrenceReleased

OccurrenceClosed

NotificationCreated

NotificationRead

NotificationAcknowledged

MDHOCreated

MDHOApproved

MDHORejected

ActionPlanCreated

ActionPlanUpdated

EvidenceUploaded

IMSReferenceRegistered
```

Evitar eventos genéricos.

---

# Canais

Sempre utilizar canais organizados por domínio.

Exemplo:

```text
occurrences

notifications

mdho

action-plans

dashboard

audit
```

Nunca utilizar um único canal para toda a aplicação.

---

# Escopo

Os canais devem respeitar a organização ativa.

Exemplo:

```text
organization_id
```

Um usuário nunca deve receber eventos de outra organização.

---

# Eventos Efêmeros

Indicadores temporários podem utilizar Broadcast.

Exemplos:

- usuário digitando;
- usuário conectado;
- indicador temporário.

Nunca utilizar Broadcast para dados permanentes.

---

# Persistência

Toda informação importante deve existir primeiro no banco.

Realtime apenas informa que houve mudança.

---

# Push Notifications

Push Notification não é Realtime.

Cada tecnologia possui responsabilidades diferentes.

---

## Push

Utilizar para:

- usuário ausente;
- aplicativo fechado;
- alerta importante;
- ação pendente;
- ciência necessária.

---

## Realtime

Utilizar para:

- usuários ativos;
- dashboards;
- timeline;
- atualizações instantâneas.

---

# Estratégia

Sempre preferir:

Realtime

↓

Push

↓

Polling

Polling deverá ser utilizado apenas quando necessário.

---

# Resiliência e Offline

O Mobile deve ser resiliente a conexões instáveis.

Os dados digitados devem ser preservados localmente para evitar perdas.

O suporte offline completo é uma evolução futura, e a arquitetura deve estar preparada para essa evolução gradual.

---

# Persistência Local

Durante ausência de conexão:

Os dados permanecem armazenados no dispositivo.

Nenhuma informação deve ser perdida.

---

# Estados Offline

Toda operação deverá possuir um estado.

Exemplo:

```text
Draft

↓

Pending Sync

↓

Syncing

↓

Synced

↓

Sync Error
```

Esses estados não representam o Workflow da ocorrência.

Representam apenas sincronização.

---

# Estratégia de Sincronização

Quando a conexão retornar:

```text
Fila Local

↓

Sincronização

↓

Backend

↓

Confirmação

↓

Atualização Local
```

Nunca apagar um registro antes da confirmação do backend.

---

# Ordem

A fila deve respeitar a ordem cronológica.

Primeiro registro criado.

↓

Primeiro registro enviado.

---

# Retry

Toda sincronização deve possuir mecanismo de retry.

Nunca exigir que o usuário repita manualmente uma operação apenas por falha temporária.

---

# Backoff

Utilizar Exponential Backoff.

Exemplo:

```text
1 segundo

↓

2 segundos

↓

4 segundos

↓

8 segundos

↓

16 segundos
```

Evitar requisições contínuas.

---

# Timeout

Toda operação deve possuir timeout.

Nunca aguardar indefinidamente.

---

## Valores sugeridos

Consultas

```text
15 segundos
```

Uploads

```text
60 segundos
```

Downloads

```text
60 segundos
```

Edge Functions

```text
30 segundos
```

---

# Cancelamento

Toda operação longa deve permitir cancelamento quando possível.

Exemplos:

- upload;
- download;
- geração de relatório.

---

# Sincronização Parcial

Caso apenas parte da fila seja sincronizada:

Os itens restantes permanecem aguardando.

Nunca cancelar toda a fila.

---

# Conflitos

Conflitos podem ocorrer quando dois usuários alteram o mesmo recurso.

---

## Estratégia

Priorizar:

```text
Backend

↓

Última versão persistida

↓

Resolução de conflito
```

Nunca permitir que o cliente sobrescreva dados sem validação.

---

# Tipos de Conflito

Exemplos:

- edição simultânea;
- exclusão concorrente;
- atualização de status;
- alteração de responsável.

---

# Resolução

Quando necessário:

- informar conflito;
- mostrar diferenças;
- permitir nova tentativa.

Nunca ocultar conflitos.

---

# Cache

O SafeStop utiliza TanStack Query como solução oficial de cache.

---

# Objetivos

O cache reduz:

- chamadas ao servidor;
- consumo de banda;
- tempo de carregamento.

---

# Server State

Toda informação proveniente do backend deve ser considerada Server State.

Nunca utilizar Zustand para armazenar Server State.

---

# Client State

Client State inclui:

- modais;
- filtros;
- tema;
- seleção;
- preferências locais.

Esses estados podem utilizar Zustand.

---

# TanStack Query

Responsável por:

- cache;
- refetch;
- retry;
- invalidação;
- sincronização;
- loading;
- optimistic updates.

---

# Query Keys

Toda Query Key deve seguir padrão.

Exemplos:

```text
["occurrences"]

["occurrences", id]

["notifications"]

["dashboard"]

["users"]
```

Nunca utilizar strings soltas.

---

# Invalidação

Após mutations:

Invalidar apenas queries relacionadas.

Evitar:

```text
invalidateQueries()
```

sem filtros.

---

# Refetch

Refetch automático deve ocorrer apenas quando fizer sentido.

Evitar chamadas desnecessárias.

---

# Optimistic Updates

Utilizar apenas quando a operação possuir alta probabilidade de sucesso.

Exemplos:

- marcar notificação como lida;
- confirmar ciência;
- atualizar preferências.

---

# Não utilizar Optimistic Update

Evitar para:

- aprovação MDHO;
- liberação;
- interdição;
- alteração de permissões.

Essas ações dependem da confirmação do backend.

---

# Rollback

Quando utilizar Optimistic Update:

Sempre implementar rollback.

---

# Pré-busca

Utilizar prefetch quando melhorar a experiência.

Exemplos:

- próxima página;
- detalhes da ocorrência;
- dashboard.

---

# Rate Limit

Toda API deve considerar limites de utilização.

Objetivos:

- evitar abuso;
- proteger infraestrutura;
- reduzir ataques.

---

# Estratégias

Aplicar limites principalmente em:

- autenticação;
- uploads;
- Edge Functions;
- notificações.

---

# Debounce

Utilizar debounce para:

- pesquisa;
- autocomplete;
- filtros.

Evitar múltiplas chamadas consecutivas.

---

# Throttle

Utilizar throttle quando necessário.

Exemplo:

Atualização contínua de mapas.

---

# Observabilidade

Toda comunicação importante deve produzir logs.

Exemplos:

- início;
- sucesso;
- falha;
- timeout;
- retry;
- cancelamento.

---

# Métricas

Monitorar:

- tempo médio de resposta;
- tempo de sincronização;
- falhas;
- retries;
- uploads;
- downloads.

---

# Boas Práticas

Sempre:

- utilizar cache;
- utilizar retry;
- utilizar timeout;
- tratar conflitos;
- registrar logs;
- sincronizar em segundo plano;
- manter operação Offline.

Nunca:

- bloquear operação por falta de internet;
- perder dados locais;
- ignorar conflitos;
- criar polling excessivo;
- utilizar cache sem invalidação.

---

# Regra Geral

A camada de comunicação do SafeStop deve priorizar a continuidade operacional e a resiliência em conexões instáveis.

No MVP, o foco é preservar os dados digitados, evitar perdas e sinalizar claramente o estado da comunicação, sem prometer suporte offline completo.

O suporte offline completo é uma evolução futura. Quando a conectividade retornar, o sistema deverá sincronizar os dados de forma segura, previsível, auditável e transparente para o usuário.

