# Decisões — Referência IMS (Sprint 2.8)

**Status:** `APROVADO`  
**Sprint:** 2.8 — Referência IMS (sub-entrega incremental até status `EM_TRATATIVA`)  
**Data:** 2026-08-02  
**Etapa:** 0 — Produto (agente MASTER / DOCS)  
**Gate:** **G0 desbloqueado** — libera DATABASE (RPCs IMS) e UIUX (spec)

**Arquitetura base:** Sprint 2.8 — Referência IMS (2026-08-02, aprovada)

**Fundação:** Sprint 2.0 (Occurrences) + 2.1 (PP) + 2.2 (Evidências) + 2.3 (Timeline) + 2.4 (Ver e Agir) + 2.5 (Interdição Oficial) + 2.6 (MDHO) + **2.7 (Aprovação HSE)**

**Modelo de dados:** `docs/database.md` §8.3, §20.4, §21 — **não reescrever**; este documento referencia e complementa.

**Decisões herdadas:** [`MDHO-DECISIONS.md`](./MDHO-DECISIONS.md) PO-MDHO-19 (para em `AGUARDANDO_REGISTRO_IMS` na 2.6); [`HSE-APPROVAL-DECISIONS.md`](./HSE-APPROVAL-DECISIONS.md) PO-HSE-13 (hint IMS sem CTA) — **substituído** por `ImsReferenceSection` na 2.8 quando elegível.

**Spec UI:** [`IMS-REFERENCE-UI-SPEC.md`](./IMS-REFERENCE-UI-SPEC.md)

**Relação roadmap:** `docs/roadmap.md` Sprint 6/7 = fluxo IO completo + plano de ação. A **sub-sprint 2.8** antecipa **registro manual da referência IMS** até `EM_TRATATIVA` — **sem** plano de ação, notificações, integração externa ou validação no IMS Hydro.

**Regra IMS inviolável:** SafeStop **não gera, consulta, sincroniza nem valida** existência no IMS externo (`docs/product.md`, `docs/workflow.md` §12.3, `docs/database.md` §20.4).

---

## Objetivo

Registrar as decisões de produto **PO-IMS-1 a PO-IMS-16** da Sprint 2.8 **sem inventar regra de negócio**, usando como fonte primária:

- arquitetura Sprint 2.8;
- `docs/workflow.md` §2.5, §5.7, §12, §17, §19, §22;
- `docs/database.md` §8.3, §20.4, §21;
- `docs/product.md` — Registro do IMS;
- `docs/glossary.md`;
- `docs/decisions/RBAC-MATRIX-APPROVED.md`;
- `docs/decisions/MDHO-DECISIONS.md`;
- `docs/decisions/HSE-APPROVAL-DECISIONS.md`.

---

## Decisão arquitetural central (não redesenhar)

| Item | Decisão |
|---|---|
| **Persistência** | **Campos em `occurrences`** — **sem** tabela auxiliar, **sem** entidade IMS |
| **Campo principal** | `ims_reference_code` (ex.: `BAA-26-0001`) |
| **Metadados** | `ims_reference_registered_by/at`, `ims_reference_updated_by/at` |
| **Permissões** | `ims_reference.register` · `ims_reference.update` |
| **RPCs** | `register_ims_reference(jsonb)` · `update_ims_reference(jsonb)` |
| **Pré-condição register** | Ocorrência **`AGUARDANDO_REGISTRO_IMS`**, ramo **IO**, MDHO **`APPROVED`**, código **NULL** |
| **Pós-register** | Status → **`EM_TRATATIVA`** |
| **Update** | Status **permanece** `EM_TRATATIVA` (ou compatível ≥ tratativa) |
| **Integração externa** | **Proibida** |
| **Feature UI** | **`features/ims-reference/`** web + mobile |
| **Timeline** | Enriquecer `get_occurrence_timeline()` — **sem** kind novo |
| **Notificações** | **Proibidas** na 2.8 (Sprint 3) |

### Fluxo Referência IMS (Sprint 2.8)

```text
AGUARDANDO_REGISTRO_IMS  (MDHO APPROVED — hint/UI 2.6/2.7)
        │ register_ims_reference() [ims_reference.register]
        ↓
EM_TRATATIVA  (código + registered_by/at persistidos)
        │ update_ims_reference() [ims_reference.update + update_reason]
        ↓
EM_TRATATIVA  (código corrigido + updated_by/at + history metadata)
        ↓
Plano de Ação / Tratativa  ← Sprint futura (PO-IMS-15)
```

---

## Gate G0

| Item | Estado |
|---|---|
| **G0 — Etapa 0 PO** | **Desbloqueado** (2026-08-02) |
| **Desbloqueia** | DATABASE (RPCs register/update + timeline) e UIUX (`IMS-REFERENCE-UI-SPEC.md`) |
| **Critério** | PO-IMS-1…PO-IMS-16 críticos sem ambiguidade |
| **Paralelo permitido** | UIUX spec ∥ DATABASE após G0 |

Ordem oficial: **Etapa 0 DOCS → UIUX ∥ DATABASE → BACKEND → WEB ∥ MOBILE → BUILD → SECURITY ∥ QA → DOCS → COMMIT**.

---

## Decisões aprovadas

### PO-IMS-1 — Formato do código BAA

| Item | Decisão |
|---|---|
| **Formato MVP** | **Fixo** — regex `^BAA-\d{2}-\d{4,}$` (`database.md` §20.4) |
| **Exemplo** | `BAA-26-0001` |
| **Validação** | **Servidor (RPC)** + **cliente (Zod)** — formato apenas, **sem** existência no IMS |
| **Configurável por org** | **Fora** MVP |

---

### PO-IMS-2 — Código obrigatório para avançar status?

| Item | Decisão |
|---|---|
| **Transição** | **Sim** — `register_ims_reference()` é o **único** caminho `AGUARDANDO_REGISTRO_IMS` → `EM_TRATATIVA` |
| **Campo nullable** | Permanece nullable no schema até registro |
| **Avanço sem código** | **Fora** MVP — PO-IMS-16 |

---

### PO-IMS-3 — Quem registra / corrige?

| Item | Decisão |
|---|---|
| **Registrar** | `ims_reference.register` — **Supervisor HSE** e **Liderança HSE** |
| **Corrigir** | `ims_reference.update` — **Supervisor HSE** e **Liderança HSE** |
| **Visualizar** | `occurrence.read` + escopo |
| **Fiscal / HSE Campo / Gestor** | **Sem** register/update |

---

### PO-IMS-4 — Aplica ao ramo Ver e Agir?

| Item | Decisão |
|---|---|
| **Ver e Agir** | **Proibido** — `workflow.md` §19 |
| **Guard RPC** | `decision_type = INTERDICAO_OFICIAL` |
| **UI** | Seção IMS **ausente** em ramo VA |

---

### PO-IMS-5 — Justificativa na correção?

| Item | Decisão |
|---|---|
| **Campo** | `update_reason` obrigatório |
| **Tamanho** | **10–4000** caracteres (`workflow.md` §12.2) |
| **Registro inicial** | **Sem** justificativa — apenas código |

---

### PO-IMS-6 — Acompanhamento sem código IMS (`product.md`)

| Item | Decisão |
|---|---|
| **Conflito documental** | `product.md` diz acompanhamento continua; `workflow.md` §5.7 exige transição após registro |
| **Resolução PO** | **Workflow prevalece** para transição de status |
| **Interpretação copy** | Enquanto `AGUARDANDO_REGISTRO_IMS`: leitura, timeline, comentários — **sem** plano de ação (Sprint futura) |
| **UI** | Copy “Aguardando registro do IMS” + formulário register — **não** implica avanço operacional para tratativa |

---

### PO-IMS-7 — Duplicidade de código entre ocorrências?

| Item | Decisão |
|---|---|
| **MVP 2.8** | **Permitir** — **sem** UNIQUE constraint por org |
| **Índice existente** | `occurrences_ims_reference_code_idx` — lookup apenas |
| **Pesquisa** | Pode retornar **múltiplas** ocorrências com mesmo código |
| **Futuro** | Unique parcial por org se produto exigir — sprint dedicada |

---

### PO-IMS-8 — Editar após encerramento?

| Item | Decisão |
|---|---|
| **Status terminais** | **Proibido** update em `ENCERRADA`, `LIBERADA`, `CANCELADA` |
| **Guard RPC** | Rejeitar com `STATUS_MISMATCH` |

---

### PO-IMS-9 — Histórico de correção

| Item | Decisão |
|---|---|
| **Mecanismo MVP** | `occurrence_status_history` com `from_status = to_status = EM_TRATATIVA` |
| **Metadata update** | `{ action: "update_ims", previous_code, new_code, update_reason }` (truncar reason no excerpt timeline) |
| **Metadata register** | `{ action: "register_ims", ims_reference_code }` via transição de status |
| **`audit_events`** | **Fora** 2.8 — tabela não migrada |

---

### PO-IMS-10 — Pesquisa por código

| Item | Decisão |
|---|---|
| **Tipo** | **Contains** — `ilike '%termo%'` normalizado |
| **Escopo** | Org ativa + RLS existente — **nunca** cross-tenant |
| **Filtro** | Estender `OccurrenceListFilters` + `get-occurrences` |
| **UI** | Campo “Código IMS” na listagem web/mobile |

---

### PO-IMS-11 — Guard MDHO aprovado

| Item | Decisão |
|---|---|
| **Register** | Exigir `mdho_assessments.status = 'APPROVED'` para a ocorrência |
| **Consistência** | Status `AGUARDANDO_REGISTRO_IMS` **e** assessment APPROVED |
| **Defesa** | Rejeitar se MDHO ausente ou não aprovado |

---

### PO-IMS-12 — Idempotência do register

| Item | Decisão |
|---|---|
| **Retry pós-sucesso** | Se código já registrado **e** status já `EM_TRATATIVA`, retornar **sucesso idempotente** (`data.idempotent: true`) |
| **Segundo register diferente** | `ALREADY_REGISTERED` |
| **Concorrência** | Primeiro vence; segundo `ALREADY_REGISTERED` ou `STATUS_MISMATCH` |

---

### PO-IMS-13 — Platform Admin

| Item | Decisão |
|---|---|
| **UI operacional** | **Sem** register/update (`!isPlatformAdmin`) |
| **RPC** | Valida permissões reais |

---

### PO-IMS-14 — Offline

| Item | Decisão |
|---|---|
| **Mutations register/update** | **Bloqueadas** offline (padrão 2.6) |
| **Feedback** | Toast “Sem conexão — ação não enviada” — **sem** optimistic |

---

### PO-IMS-15 — IMS antes do plano de ação

| Item | Decisão |
|---|---|
| **2.8** | Entrega register até `EM_TRATATIVA` |
| **Plano de Ação** | **Sprint futura** (`database.md` §35 #14) |
| **UI pós-register** | Badge/status `EM_TRATATIVA` — **sem** CTA plano de ação |

---

### PO-IMS-16 — Avanço sem código IMS

| Item | Decisão |
|---|---|
| **MVP** | **Fora** — `workflow.md` §5.7 nota futura |
| **Futuro** | Exceção explícita e auditável — decisão formal de produto |

---

## Dados (existentes — não duplicar)

```text
occurrences
  ims_reference_code              text nullable
  ims_reference_registered_at     timestamptz
  ims_reference_registered_by     uuid → profiles
  ims_reference_updated_at        timestamptz
  ims_reference_updated_by        uuid → profiles
```

**Não criar:** tabela `ims_references`, entidade `ImsReference`, campos de dados do IMS externo.

**Distinção:** `public_code` (SafeStop `SS-26-…`) ≠ `ims_reference_code` (BAA externo).

---

## RPCs

### `register_ims_reference(p_payload jsonb)`

**Permissão:** `ims_reference.register`

**Payload:**

```json
{
  "occurrence_id": "uuid",
  "ims_reference_code": "BAA-26-0001"
}
```

**Guards:**

- `auth.uid()` autenticado
- Org ativa + `can_access_occurrence`
- `has_permission('ims_reference.register')`
- `decision_type = INTERDICAO_OFICIAL`
- Status = `AGUARDANDO_REGISTRO_IMS`
- `ims_reference_code` IS NULL (primeiro registro)
- MDHO assessment `APPROVED`
- Formato regex PO-IMS-1

**Efeitos atômicos:**

1. UPDATE `occurrences`: code + `registered_by/at := auth.uid()/now()`
2. UPDATE status → `EM_TRATATIVA`
3. INSERT `occurrence_status_history` (`AGUARDANDO_REGISTRO_IMS` → `EM_TRATATIVA`, metadata `register_ims`)
4. RETURN snapshot JSON

### `update_ims_reference(p_payload jsonb)`

**Permissão:** `ims_reference.update`

**Payload:**

```json
{
  "occurrence_id": "uuid",
  "ims_reference_code": "BAA-26-0002",
  "update_reason": "string 10-4000"
}
```

**Guards:**

- Código já registrado
- Status compatível (≥ `EM_TRATATIVA`, não terminal PO-IMS-8)
- `update_reason` obrigatório 10–4000
- Novo código ≠ anterior; formato regex
- **Não** alterar status da ocorrência

**Efeitos:**

1. UPDATE occurrences (code, `updated_by/at`)
2. INSERT history metadata-only (update)
3. RETURN snapshot

---

## Erros padronizados

```text
UNAUTHORIZED | FORBIDDEN | NOT_FOUND | STATUS_MISMATCH | VALIDATION_ERROR |
ALREADY_REGISTERED | CONFLICT | INTERNAL_ERROR
```

Mensagem formato inválido: “Use o formato BAA-XX-0000 (ex.: BAA-26-0001).”

---

## Timeline

| Evento | Mecanismo |
|---|---|
| Referência IMS registrada | `STATUS_CHANGED` → `EM_TRATATIVA` · metadata `register_ims` · título **“Referência IMS registrada”** |
| Referência IMS alterada | History metadata · título **“Referência IMS alterada”** · excerpt reason truncado |

**Sem** kind novo. **Sem** evento por keystroke no form.

---

## Cache / invalidação

```typescript
// Reutilizar occurrence detail + timeline + list
["tenant", organizationId, "occurrences", occurrenceId]
["tenant", organizationId, "occurrences", occurrenceId, "timeline"]
["tenant", organizationId, "occurrences", listParams] // + imsReferenceCode
```

| Mutation | Invalidar |
|---|---|
| register / update | detail, timeline, listagens |

---

## Posicionamento UI (ordem detalhe IO)

```text
1. Header + badges
2. Banner IO
3. Info / condição
4. Evidências
5. Decisão VA/IO
6. InterdicaoSummary
7. MdhoSummary (hint IMS removido quando ImsReferenceSection ativo)
8. ImsReferenceSection          ← Sprint 2.8
9. Timeline
10. Composer
```

---

## Guards UI (web + mobile)

```typescript
canRegisterIms =
  can("ims_reference.register") &&
  !isPlatformAdmin &&
  occurrence.decisionType === "INTERDICAO_OFICIAL" &&
  occurrence.status === "AGUARDANDO_REGISTRO_IMS" &&
  !occurrence.imsReferenceCode;

canUpdateIms =
  can("ims_reference.update") &&
  !isPlatformAdmin &&
  !!occurrence.imsReferenceCode &&
  !isTerminalStatus(occurrence.status);

canViewIms = can("occurrence.read");
```

---

## Copy oficial (referência UIUX)

| Elemento | Texto |
|---|---|
| Título seção | **Referência IMS** |
| Helper | “Informe o código gerado no sistema IMS da Hydro. O SafeStop não consulta o IMS.” |
| Placeholder | `BAA-26-0001` |
| Sucesso register | “Código registrado — ocorrência em tratativa” |
| **Proibido** | “Criar IMS”, “Sincronizar”, “Validar no IMS” |

---

## Seed QA (herdado — sem alteração obrigatória)

| Usuário | Papel | Cenários IMS |
|---|---|---|
| `qa-supervisor@safestop.local` | Supervisor HSE | register, update |
| `qa-lideranca@safestop.local` | Liderança HSE | register, update |
| `qa-fiscal@safestop.local` | Fiscal | read-only, sem register |
| `qa-field@safestop.local` | HSE Campo | negativo |

Senha local: `SafeStop-QA-Local-2026`.

**Pré-condição QA:** ocorrência IO com MDHO `APPROVED` / status `AGUARDANDO_REGISTRO_IMS` — criar via fluxo MDHO+HSE ou seed dedicado.

---

## Explicitamente fora da Sprint 2.8

- Integração/API/sync com IMS Hydro
- Geração ou validação de existência do código no IMS externo
- Plano de Ação / tratativa operacional
- Notificações
- Tabela auxiliar `ims_references`
- Avanço sem código IMS (PO-IMS-16)
- `audit_events` (fase futura)
- UNIQUE global código IMS (PO-IMS-7 adiado)
- Service role no cliente
- IMS em ramo Ver e Agir

---

## Cross-check com `IMS-REFERENCE-UI-SPEC.md`

| Tema | PO | UI-SPEC | Status |
|---|---|---|---|
| Formato BAA `^BAA-\d{2}-\d{4,}$` | PO-IMS-1 | IMS-FORM regex · IMS-C12 | Alinhado |
| Register único caminho → `EM_TRATATIVA` | PO-IMS-2 | IMS-FORM + pós-sucesso | Alinhado |
| Card read-only pós-registro | PO-IMS-2 | IMS-CARD | Alinhado |
| RBAC register/update (Supervisor/Liderança) | PO-IMS-3 | Guards | Alinhado |
| Seção ausente em Ver e Agir | PO-IMS-4 | Princípios + guards | Alinhado |
| Dialog update + motivo 10–4000 | PO-IMS-5 | IMS-EDIT · IMS-C15…C20 | Alinhado |
| Copy: não consulta / não valida IMS | PO-IMS-6 | IMS-C04/C09 · proibidos | Alinhado |
| Duplicidade código permitida | PO-IMS-7 | IMS-SEARCH | Alinhado |
| Update bloqueado em status terminal | PO-IMS-8 | `canUpdateIms` | Alinhado |
| Timeline registrada / alterada | PO-IMS-9 | IMS-C30 | Alinhado |
| Filtro listagem contains | PO-IMS-10 | IMS-SEARCH · IMS-C24/C25 | Alinhado |
| Guard MDHO APPROVED (server) | PO-IMS-11 | Pré-condição form (status) | Alinhado |
| Idempotência register | PO-IMS-12 | IMS-FORM idempotência | Alinhado |
| Platform Admin sem mutations | PO-IMS-13 | Guards | Alinhado |
| Offline bloqueia | PO-IMS-14 | IMS-STATES · IMS-C21 | Alinhado |
| Sem CTA plano de ação | PO-IMS-15 | Princípios + fora de escopo | Alinhado |
| Sem avanço sem código | PO-IMS-16 | Fora de escopo | Alinhado |
| Substituir hint MdhoSummary/HSE | PO-IMS-6 · PO-HSE-13 | Ordem detalhe | Alinhado |
| Confirm register | — | IMS-FORM confirm | Alinhado |
| **Sem integração IMS** | Regra inviolável | Princípios + copy proibida | Alinhado |

---

## Cenários QA (referência IMS-*)

| ID | Cenário |
|---|---|
| IMS-01 | Supervisor registra BAA em `AGUARDANDO_REGISTRO_IMS` → `EM_TRATATIVA` |
| IMS-02 | Formato inválido → `VALIDATION_ERROR` |
| IMS-03 | Register em Ver e Agir → `FORBIDDEN` / seção ausente |
| IMS-04 | Register sem permissão → `FORBIDDEN` |
| IMS-05 | Segundo register → `ALREADY_REGISTERED` |
| IMS-06 | Update com motivo 10–4000 → history metadata |
| IMS-07 | Update motivo < 10 → `VALIDATION_ERROR` |
| IMS-08 | Update pós-`ENCERRADA` → `STATUS_MISMATCH` |
| IMS-09 | Pesquisa por código encontra ocorrência na org |
| IMS-10 | Timeline “Referência IMS registrada” / “alterada” |
| IMS-11 | Cross-tenant → `FORBIDDEN` |
| IMS-12 | Fiscal read-only sem register |
| IMS-13 | Platform Admin sem mutations UI |
| IMS-14 | Offline bloqueia register/update mobile |
| IMS-15 | Idempotência register retry (PO-IMS-12) |
| IMS-16 | Regressão MDHO/HSE/IO/VA/timeline |

Regressão: HSE-01…20, MDHO-06…16, IO-01..12, VA-01..07, TL-01..05.

---

## Dependências registradas

### Etapa 1 — DATABASE (desbloqueada)

1. Migration: `register_ims_reference(jsonb)` + `update_ims_reference(jsonb)`
2. Patch `get_occurrence_timeline` títulos IMS
3. GRANTs authenticated
4. `supabase/scripts/smoke-ims-reference.mjs`
5. `supabase db reset` OK

### Etapa 2 — BACKEND

1. `packages/types` — inputs/results IMS, estender `OccurrenceListFilters`
2. `packages/validation` — register/update schemas + regex shared
3. ~~`docs/api.md` — payloads RPC~~ **Concluído**
4. Helper `isImsRegisterEligible(occurrence)`

### Etapas 3–4 — UIUX, WEB, MOBILE

1. ~~`IMS-REFERENCE-UI-SPEC.md`~~ **Concluído** (2026-08-02)
2. `features/ims-reference/` web + mobile
3. Filtro listagem + section no detalhe IO
4. Remover/substituir hint estático em `MdhoSummary`

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER / DOCS
Data: 2026-08-02
Base documental: arquitetura Sprint 2.8; docs/workflow.md §12; docs/database.md §8.3, §20.4
Status: APROVADO — liberar DATABASE RPCs e UIUX (G0 → G1)
```

---

## Referências

- `docs/workflow.md` §2.5, §5.7, §12, §17, §19, §22
- `docs/database.md` §8.3, §20.4, §21
- `docs/product.md` — Registro do IMS
- `docs/glossary.md`
- `docs/decisions/RBAC-MATRIX-APPROVED.md`
- `docs/decisions/MDHO-DECISIONS.md`
- `docs/decisions/HSE-APPROVAL-DECISIONS.md`
- `docs/decisions/MDHO-UI-SPEC.md` — ordem detalhe IO
- `docs/decisions/IMS-REFERENCE-UI-SPEC.md`
- `docs/decisions/VERIFICATION-sprint-2.8-ims-reference.md`
- `docs/api.md` — RPCs register/update (manual; sem integração)
- `docs/roadmap.md` — nota sub-sprint 2.8
- `reference/base44/.../Interdiction.jsonc` — `ims_code` (referência UX)
