# Decisões — Avaliação Técnica MDHO (Sprint 2.6)

**Status:** `APROVADO`  
**Sprint:** 2.6 — MDHO (sub-entrega incremental até status `AGUARDANDO_REGISTRO_IMS`)  
**Data:** 2026-08-02  
**Etapa:** 0 — Produto (agente MASTER / DOCS)  
**Gate:** **G0 desbloqueado** — libera DATABASE (Etapa 1) e BACKEND (Etapa 2)

**Arquitetura base:** Sprint 2.6 — MDHO (2026-08-02, aprovada)

**Fundação:** Sprint 2.0 (Occurrences) + 2.1 (PP) + 2.2 (Evidências) + 2.3 (Timeline) + 2.4 (Ver e Agir) + 2.5 (Interdição Oficial)

**Modelo de dados:** `docs/database.md` §14.1–14.5 — **não reescrever**; este documento referencia e complementa.

**Spec UI:** [`MDHO-UI-SPEC.md`](./MDHO-UI-SPEC.md)

**Relação roadmap:** `docs/roadmap.md` Sprint 6 = fluxo IO completo (MDHO + IMS + timeline). A **sub-sprint 2.6** antecipa **MDHO operacional** (início, rascunho, submissão, aprovação, devolução) até `AGUARDANDO_REGISTRO_IMS`, **sem** IMS, plano de ação, notificações ou liberação.

**Relação 2.5:** `INTERDICAO-OFICIAL-DECISIONS.md` PO-IO-2 parou em `INTERDICAO_CONFIRMADA` — a 2.6 **inicia** MDHO explicitamente via `start_mdho_assessment()`.

**Glossário:** MDHO = metodologia de investigação da ocorrência (`docs/glossary.md`) — **sigla não expandida** além disso.

---

## Objetivo

Registrar as decisões de produto **PO-MDHO-1 a PO-MDHO-28** da Sprint 2.6 **sem inventar regra de negócio**, usando como fonte primária:

- arquitetura Sprint 2.6;
- `docs/workflow.md` §2.3, §5.4–5.7, §10.2, §11.1–11.2, §17–19, §22, §25;
- `docs/database.md` §14, §21, §32 Fase 5;
- `docs/product.md`, `docs/glossary.md`;
- `docs/decisions/RBAC-MATRIX-APPROVED.md`;
- `docs/decisions/INTERDICAO-OFICIAL-DECISIONS.md`;
- `docs/decisions/TIMELINE-DECISIONS.md`.

---

## Decisão arquitetural central (não redesenhar)

| Item | Decisão |
|---|---|
| **Entidade** | **`mdho_assessments`** + **`mdho_selections`** + catálogo **`mdho_categories`** / **`mdho_options`** |
| **Vínculo** | Direto à **ocorrência** (`occurrence_id`) — **sem** entidade IO separada |
| **Obrigatoriedade** | MDHO **somente** no ramo **Interdição Oficial** — **proibido** em Ver e Agir |
| **Cardinalidade** | **Uma avaliação ativa** por ocorrência (`database.md` §14.4) |
| **Status assessment** | `DRAFT` · `SUBMITTED` · `APPROVED` · `RETURNED` |
| **RPCs oficiais (§21)** | `submit_mdho_assessment()` · `approve_mdho_assessment()` · `return_mdho_assessment()` |
| **RPCs adicionais 2.6** | `start_mdho_assessment()` · `save_mdho_draft()` — comportamento exigido por §11.2; documentar em `docs/api.md` |
| **Permissões** | `mdho.fill` · `mdho.submit` · `mdho.approve` · `mdho.return` |
| **Leitura** | **`occurrence.read`** — **sem** permissão `mdho.read` |
| **Notificações** | **Proibidas** na 2.6 (Sprint 3) |
| **Timeline** | Enriquecer **`STATUS_CHANGED`** — **sem** kind novo; **sem** evento de autosave rascunho |

### Máquina de transições (Sprint 2.6)

```text
INTERDICAO_CONFIRMADA
        │ start_mdho_assessment() [mdho.fill]
        ↓
MDHO_EM_PREENCHIMENTO  (assessment DRAFT)
        │ save_mdho_draft() [mdho.fill]  (loop)
        │ submit_mdho_assessment() [mdho.submit]
        ↓
AGUARDANDO_APROVACAO_HSE  (assessment SUBMITTED)
        ├─ approve_mdho_assessment() [mdho.approve]
        │       ↓
        │  AGUARDANDO_REGISTRO_IMS  (assessment APPROVED)  ← IMS fora 2.6
        │
        └─ return_mdho_assessment() [mdho.return + return_reason]
                ↓
        MDHO_EM_PREENCHIMENTO  (assessment RETURNED)
```

---

## Gate G0

| Item | Estado |
|---|---|
| **G0 — Etapa 0 PO** | **Desbloqueado** (2026-08-02) |
| **Desbloqueia** | DATABASE (Fase 5 migrations + RPCs + seed catálogo) e BACKEND (types/validation) |
| **Critério** | PO-MDHO-1…PO-MDHO-28 críticos sem ambiguidade |
| **Paralelo permitido** | UIUX wireframes após contrato catálogo/RPC draft |

Ordem oficial: **Etapa 0 DOCS → DATABASE → BACKEND → types/validation → UIUX ∥ → WEB ∥ MOBILE → BUILD → SECURITY → QA → COMMIT**.

---

## Decisões aprovadas

### PO-MDHO-1 — Significado expandido da sigla MDHO

| Item | Decisão |
|---|---|
| **Copy oficial** | Metodologia de investigação da ocorrência (`glossary.md`) |
| **Expansão literal** | **Não documentar** além disso |
| **UI** | Usar **“Avaliação Técnica (MDHO)”** como rótulo principal |

---

### PO-MDHO-2 — IO exige MDHO?

| Item | Decisão |
|---|---|
| **Ramo IO** | MDHO **obrigatório** no fluxo oficial (`workflow.md` §10.2, §25) |
| **Ver e Agir** | MDHO **não aplicável** — guards rejeitam |
| **Antes de IO** | **Proibido** iniciar MDHO (`workflow.md` §19) |

---

### PO-MDHO-3 — Vínculo da entidade MDHO

| Item | Decisão |
|---|---|
| **FK** | `mdho_assessments.occurrence_id` → `occurrences.id` |
| **Entidade IO separada** | **Não criar** |
| **Pré-condição** | `decision_type = INTERDICAO_OFICIAL` e status ≥ `INTERDICAO_CONFIRMADA` |

---

### PO-MDHO-4 — Quem/como inicia o MDHO?

| Item | Decisão |
|---|---|
| **Modelo** | **A — botão explícito** “Iniciar Avaliação Técnica (MDHO)” |
| **Status entrada** | `INTERDICAO_CONFIRMADA` |
| **Auto-start na RPC IO** | **Não** — 2.5 já parou em IO confirmada |
| **RPC** | `start_mdho_assessment(p_occurrence_id)` |
| **Permissão** | `mdho.fill` |

---

### PO-MDHO-5 — Quem preenche?

| Item | Decisão |
|---|---|
| **Permissão** | `mdho.fill` |
| **Papéis** | **Supervisor HSE** e **Liderança HSE** (`RBAC-MATRIX-APPROVED.md` decisão #3) |
| **Fiscal / HSE Campo / Gestor** | **Sem** fill |

---

### PO-MDHO-6 — Papel de “revisor” separado?

| Item | Decisão |
|---|---|
| **MVP 2.6** | **A — só fluxo approve/return** da Liderança HSE |
| **Revisor intermediário** | **Fora** escopo |

---

### PO-MDHO-7 — Quem aprova/devolve?

| Item | Decisão |
|---|---|
| **Aprovar** | `mdho.approve` — **Liderança HSE** |
| **Devolver** | `mdho.return` — **Liderança HSE** |
| **Supervisor HSE** | **Não** aprova nem devolve |

---

### PO-MDHO-8 — Catálogo global vs por organização

| Item | Decisão |
|---|---|
| **Seed MVP** | **Catálogo global** — `organization_id` **NULL** nas categorias/opções seed |
| **Leitura** | Membro da org ativa vê catálogo global + opções ativas |
| **UI admin config** | **Fora** 2.6 |
| **Alteração retroativa** | **Proibida** em assessments finalizados (`workflow.md` §11.2) |

---

### PO-MDHO-9 — Rota dedicada vs inline

| Item | Decisão |
|---|---|
| **Web** | **Inline** no detalhe da ocorrência (padrão SafeStop) |
| **Mobile** | **Inline** com formulário **seccionado** (stepper) |
| **Rota `/occurrences/[id]/mdho`** | **Opcional futura** — não obrigatória na 2.6 |

---

### PO-MDHO-10 — Salvamento rascunho

| Item | Decisão |
|---|---|
| **Obrigatório** | Sim (`workflow.md` §11.2) |
| **RPC** | `save_mdho_draft(p_payload jsonb)` |
| **Permissão** | `mdho.fill` |
| **Status assessment** | Permanece `DRAFT` ou `RETURNED` |
| **Status ocorrência** | Permanece `MDHO_EM_PREENCHIMENTO` |
| **Timeline** | **Não** registrar autosave |

---

### PO-MDHO-11 — Editar após submit

| Item | Decisão |
|---|---|
| **Direto pós-submit** | **Não** — assessment `SUBMITTED` é read-only para fill |
| **Correção** | Somente via **`return_mdho_assessment`** → `RETURNED` |

---

### PO-MDHO-12 — Reabrir MDHO aprovado

| Item | Decisão |
|---|---|
| **2.6** | **Proibido** — `APPROVED` **imutável** |
| **Selections em APPROVED** | UPDATE/DELETE **negados** |

---

### PO-MDHO-13 — Múltiplos MDHO por ocorrência

| Item | Decisão |
|---|---|
| **Regra** | **Uma avaliação ativa** por ocorrência |
| **Implementação** | UNIQUE lógica / índice parcial + RPC `ALREADY_EXISTS` |
| **Segundo start** | Erro idempotente ou `ALREADY_EXISTS` |

---

### PO-MDHO-14 — Validação mínima de seleções no submit

| Item | Decisão |
|---|---|
| **Categorias `requires_selection`** | **≥ 1** opção selecionada |
| **`DEVIATION_TYPE`** | **Exatamente 1** opção (`ERROR` ou `VIOLATION`) |
| **Múltiplas permitidas** | **≥ 1** opção quando categoria exige seleção |
| **`OTHER`** | `detail` obrigatório — **min 10** caracteres (trim) |
| **`complement`** | **Opcional** na 2.6; max **4000** chars se preenchido |

---

### PO-MDHO-15 — Evidência obrigatória no MDHO?

| Item | Decisão |
|---|---|
| **Gate submit** | **Não** — evidências da ocorrência são **contexto read-only** |
| **Upload MDHO-specific** | **Fora** 2.6 |

---

### PO-MDHO-16 — Assinatura digital

| Item | Decisão |
|---|---|
| **2.6** | **Fora** escopo |

---

### PO-MDHO-17 — Status do assessment

| Item | Decisão |
|---|---|
| **Valores** | `DRAFT` · `SUBMITTED` · `APPROVED` · `RETURNED` — conforme §14.4 |
| **Inventar status** | **Proibido** |

---

### PO-MDHO-18 — Sincronismo status ocorrência ↔ assessment

| Item | Decisão |
|---|---|
| **Regra** | Toda transição de domínio atualiza **ambos** quando aplicável + `occurrence_status_history` |
| **Referência** | Tabela de transições na seção arquitetural central |

---

### PO-MDHO-19 — Pós-aprovação (IMS)

| Item | Decisão |
|---|---|
| **Status final 2.6** | `AGUARDANDO_REGISTRO_IMS` |
| **UI IMS** | **Fora** — hint informativo apenas |
| **RPC IMS** | **Fora** |

---

### PO-MDHO-20 — Copy aprovação HSE

| Item | Decisão |
|---|---|
| **Termo UI** | **“Aprovar MDHO”** / **“Devolver MDHO”** |
| **Alinhamento** | `workflow.md` §5.6 — Liderança HSE |

---

### PO-MDHO-21 — IMS

| Item | Decisão |
|---|---|
| **2.6** | **Fora** escopo |

---

### PO-MDHO-22 — Plano de Ação

| Item | Decisão |
|---|---|
| **2.6** | **Fora** escopo (Sprint 7) |

---

### PO-MDHO-23 — Platform Admin

| Item | Decisão |
|---|---|
| **Mutations MDHO** | **Negadas** no client (`!isPlatformAdmin`) — padrão 2.4/2.5 |
| **Leitura cross-org** | Conforme política existente |

---

### PO-MDHO-24 — Administrador da Empresa

| Item | Decisão |
|---|---|
| **Default** | **Sem** `mdho.*` — leitura via `occurrence.read` se tiver escopo |

---

### PO-MDHO-25 — Offline

| Item | Decisão |
|---|---|
| **Mutations** | **Bloqueadas** sem rede (start, draft, submit, approve, return) |
| **Copy** | “Conecte-se para continuar a Avaliação Técnica (MDHO)” |
| **Fila offline persistente** | **Fora** 2.6 |

---

### PO-MDHO-26 — Timeline kinds MDHO

| Item | Decisão |
|---|---|
| **Abordagem** | Enriquecer **`STATUS_CHANGED`** |
| **Títulos sugeridos** | “MDHO iniciado” · “MDHO enviado” · “MDHO aprovado” · “MDHO devolvido” |
| **Metadata** | `action`, `returnReason` (truncado), `assessmentId`, nomes atores |
| **Kind `MDHO_*` separado** | **Não** na 2.6 |

---

### PO-MDHO-27 — Liderança HSE: fill sem submit

| Item | Decisão |
|---|---|
| **Matriz** | Liderança: `mdho.fill` + approve/return — **sem** `mdho.submit` |
| **UI Liderança** | Formulário de preenchimento **sim**; botão **Enviar oculto** |
| **UI Supervisor** | Fill + **Enviar** visível |
| **RPC submit** | `FORBIDDEN` sem `mdho.submit` |

---

### PO-MDHO-28 — Cancelamento ocorrência com MDHO em draft

| Item | Decisão |
|---|---|
| **2.6** | **Fora** escopo — `occurrence.cancel` operacional não implementado |
| **Comportamento** | Não definir nesta sprint; assessment permanece até sprint cancelamento |

---

## RBAC resumido (Sprint 2.6)

| Ação | Permissão | Supervisor HSE | Liderança HSE |
|---|---|:---:|:---:|
| Iniciar MDHO | `mdho.fill` | ✓ | ✓ |
| Salvar rascunho | `mdho.fill` | ✓ | ✓ |
| Enviar MDHO | `mdho.submit` | ✓ | ✗ |
| Aprovar MDHO | `mdho.approve` | ✗ | ✓ |
| Devolver MDHO | `mdho.return` | ✗ | ✓ |
| Visualizar | `occurrence.read` | ✓ | ✓ |

### Guards UI

```typescript
canStartMdho =
  isInterdicaoBranch(occurrence) &&
  status === "INTERDICAO_CONFIRMADA" &&
  !hasMdhoAssessment &&
  can("mdho.fill") &&
  !isPlatformAdmin;

canEditMdho =
  can("mdho.fill") &&
  !isPlatformAdmin &&
  assessment?.status in ("DRAFT", "RETURNED");

canSubmitMdho =
  can("mdho.submit") &&
  !isPlatformAdmin &&
  assessment?.status in ("DRAFT", "RETURNED");

canApproveMdho =
  can("mdho.approve") &&
  !isPlatformAdmin &&
  assessment?.status === "SUBMITTED";

canReturnMdho =
  can("mdho.return") &&
  !isPlatformAdmin &&
  assessment?.status === "SUBMITTED";
```

---

## Integração UI (ordem oficial)

```text
[Header + badge status]
[Banner IO se INTERDICAO_CONFIRMADA / pós-IO]
[Evidências — EvidenceSection 2.2]
[Decisão da Liderança — VA + IO 2.4/2.5]
[InterdicaoSummary — se IO confirmada]
[MDHO Section — Sprint 2.6]          ← NOVO
   ├─ MdhoStartCard (INTERDICAO_CONFIRMADA)
   ├─ MdhoForm stepper (DRAFT/RETURNED)
   ├─ MdhoReviewPanel (AGUARDANDO_APROVACAO_HSE)
   └─ MdhoSummary (APPROVED / AGUARDANDO_REGISTRO_IMS)
[OccurrenceTimeline — 2.3]
[CommentComposer — 2.3]
```

**Substituir** copy “Próximas etapas (MDHO) em versão futura” em `interdicao-summary` quando seção MDHO existir.

---

## RPCs (contrato de referência)

| RPC | Permissão | Transição ocorrência | Assessment |
|---|---|---|---|
| `start_mdho_assessment(uuid)` | `mdho.fill` | → `MDHO_EM_PREENCHIMENTO` | INSERT `DRAFT` |
| `save_mdho_draft(jsonb)` | `mdho.fill` | (igual) | UPSERT selections + complement |
| `submit_mdho_assessment(uuid)` | `mdho.submit` | → `AGUARDANDO_APROVACAO_HSE` | → `SUBMITTED` |
| `approve_mdho_assessment(uuid)` | `mdho.approve` | → `AGUARDANDO_REGISTRO_IMS` | → `APPROVED` |
| `return_mdho_assessment(jsonb)` | `mdho.return` | → `MDHO_EM_PREENCHIMENTO` | → `RETURNED` + reason |

**Payload draft (whitelist):**

```json
{
  "assessment_id": "uuid",
  "selections": [{ "category_id": "uuid", "option_id": "uuid", "detail": "string?" }],
  "complement": "string?",
  "expected_updated_at": "timestamptz?"
}
```

**Payload return:**

```json
{
  "assessment_id": "uuid",
  "return_reason": "string 10-4000"
}
```

### Erros padronizados

```text
UNAUTHORIZED | FORBIDDEN | NOT_FOUND | STATUS_MISMATCH | ALREADY_EXISTS |
ALREADY_SUBMITTED | VALIDATION_ERROR | CONFLICT | INTERNAL_ERROR
```

---

## Cache / invalidação

```typescript
mdho: (occurrenceId) => [...root, "detail", occurrenceId, "mdho"] as const,
mdhoCatalog: (organizationId) => [...root, "mdho", "catalog"] as const,
```

| Mutation | Invalidar |
|---|---|
| Qualquer RPC MDHO | `detail`, `mdho`, `timelinePrefix`, `lists` |

---

## Seed QA (dependência DATABASE)

| Usuário | Papel | Cenários MDHO |
|---|---|---|
| `qa-supervisor@safestop.local` | Supervisor HSE | fill + submit (MDHO-01…) |
| **`qa-lideranca@safestop.local`** _(novo)_ | Liderança HSE | approve + return (MDHO-07…) |
| `qa-fiscal@safestop.local` | Fiscal | read-only, sem MDHO |
| `qa-field@safestop.local` | HSE Campo | negativo |

Senha local: `SafeStop-QA-Local-2026`.

**Pré-requisito QA:** ocorrência em ramo IO (`INTERDICAO_CONFIRMADA` ou posterior) — criar via fluxo IO com `qa-supervisor`.

---

## Explicitamente fora da Sprint 2.6

- IMS (`register_ims_reference`, UI)
- Plano de Ação
- Notificações push/in-app
- Dashboard, analytics, materialized views
- Configuração UI de catálogo MDHO
- Assinatura digital, workflow configurável
- Liberação, encerramento, cancelamento operacional
- Entidade `official_interdiction`
- MDHO em ramo Ver e Agir
- Offline queue persistente
- `audit_events` (fase 7)
- Realtime
- Service role no cliente

---

## Cross-check com `MDHO-UI-SPEC.md`

| Tema | PO | UI-SPEC | Status |
|---|---|---|---|
| Rótulo “Avaliação Técnica (MDHO)” | PO-MDHO-1 | Terminologia + MDHO-C01 | Alinhado |
| Start explícito pós-IO | PO-MDHO-4 | MDHO-START | Alinhado |
| Stepper 5 categorias | — / §14.2 | MDHO-STEPPER | Alinhado |
| Validação seleções / OTHER / desvio | PO-MDHO-14 | Regras form + erros | Alinhado |
| Draft sem timeline | PO-MDHO-10 | MDHO-DRAFT | Alinhado |
| Liderança fill sem Enviar | PO-MDHO-27 | Guards + MDHO-SUBMIT | Alinhado |
| Approve / Return copy | PO-MDHO-20 | MDHO-REVIEW | Alinhado |
| Hint IMS sem CTA | PO-MDHO-19 | MDHO-SUMMARY | Alinhado |
| Timeline 4 títulos | PO-MDHO-26 | Timeline + MDHO-C42…45 | Alinhado |
| Offline bloqueia | PO-MDHO-25 | Estados + MDHO-C37 | Alinhado |
| Proibido em VA | PO-MDHO-2 | Escopo + critérios | Alinhado |
| Fora: IMS, plano, notificações | Fora de escopo | Escopo + checklist | Alinhado |
| Copy MDHO-C* | — | Catálogo | Alinhado |

---

## Cenários QA (referência MDHO-*)

| ID | Cenário |
|---|---|
| MDHO-01 | Supervisor inicia MDHO em IO confirmada |
| MDHO-02 | start em Ver e Agir → FORBIDDEN |
| MDHO-03 | start antes IO → STATUS_MISMATCH |
| MDHO-04 | save draft persiste seleções |
| MDHO-05 | submit incompleto → VALIDATION_ERROR |
| MDHO-06 | submit OK → AGUARDANDO_APROVACAO_HSE |
| MDHO-07 | Liderança aprova → AGUARDANDO_REGISTRO_IMS |
| MDHO-08 | Liderança devolve com reason → RETURNED |
| MDHO-09 | Repreenchimento + resubmit + approve |
| MDHO-10 | Liderança não vê botão Enviar (PO-MDHO-27) |
| MDHO-11 | Fiscal read-only |
| MDHO-12 | Timeline 4 eventos MDHO |
| MDHO-13 | Cross-tenant → FORBIDDEN |
| MDHO-14 | Duplo start → ALREADY_EXISTS |
| MDHO-15 | Offline bloqueia mutations |
| MDHO-16 | Regressão IO/VA/timeline |

Regressão: IO-01..IO-12, VA-01..VA-07, TL-01..TL-05, SW-01, EV-01.

---

## Dependências registradas

### Etapa 1 — DATABASE (desbloqueada)

1. Migration Fase 5: `mdho_categories`, `mdho_options`, `mdho_assessments`, `mdho_selections`
2. RLS + negar mutations cliente
3. Seed catálogo §14.2–14.3 (IDs determinísticos)
4. 5 RPCs SECURITY DEFINER
5. Patch `get_occurrence_timeline` títulos PO-MDHO-26
6. Seed `qa-lideranca@safestop.local`
7. `supabase/scripts/smoke-mdho.mjs`
8. `supabase db reset` OK

### Etapa 2 — BACKEND

1. `packages/types` — MdhoAssessment, MdhoCatalog, inputs/results
2. `packages/validation` — draft/submit/return schemas
3. `docs/api.md` — payloads RPC
4. Helper `isMdhoEligible(occurrence)`

### Etapas 3–4 — UIUX, WEB, MOBILE

1. ~~`MDHO-UI-SPEC.md`~~ **Concluído**
2. `features/mdho/` web + mobile
3. Integração detalhe ocorrência IO

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER / DOCS
Data: 2026-08-02
Base documental: arquitetura Sprint 2.6; docs/workflow.md §11; docs/database.md §14
Status: APROVADO — liberar DATABASE e BACKEND (G0 → G1)
```

---

## Referências

- `docs/workflow.md` §5.4–5.7, §10.2, §11.1–11.2, §17–19, §22, §25
- `docs/database.md` §14.1–14.5, §21, §32 Fase 5
- `docs/glossary.md` — MDHO
- `docs/decisions/RBAC-MATRIX-APPROVED.md`
- `docs/decisions/INTERDICAO-OFICIAL-DECISIONS.md`
- `docs/decisions/MDHO-UI-SPEC.md`
- `docs/api.md` — 5 RPCs MDHO + payloads
- `reference/base44/src/pages/InterdictionDatail.jsx` (referência UX — **não** modelo de dados)
