# Decisões — Interdição Oficial (Sprint 2.5)

**Status:** `APROVADO`  
**Sprint:** 2.5 — Interdição Oficial (sub-entrega incremental até status `INTERDICAO_CONFIRMADA`)  
**Data:** 2026-08-02  
**Etapa:** 0 — Produto (agente MASTER / DOCS)  
**Gate:** **G0 desbloqueado** — libera DATABASE (Etapa 1) e BACKEND (Etapa 2)

**Arquitetura base:** Sprint 2.5 — Interdição Oficial (2026-08-02, aprovada)

**Fundação:** Sprint 2.0 (Occurrences) + 2.1 (PP) + 2.2 (Evidências) + 2.3 (Timeline) + 2.4 (Ver e Agir)

**Modelo de dados:** `docs/database.md` §8.6, §10.1, §11.1 — **não reescrever**; este documento referencia e complementa.

**Spec UI:** [`INTERDICAO-OFICIAL-UI-SPEC.md`](./INTERDICAO-OFICIAL-UI-SPEC.md)

**Relação roadmap:** `docs/roadmap.md` Sprint 4 lista avaliação completa (VA + IO). A **sub-sprint 2.5** antecipa o ramo **Interdição Oficial** até `INTERDICAO_CONFIRMADA`, **sem** MDHO, IMS, plano de ação, notificações, liberação ou correção.

**Relação 2.4:** `VER-E-AGIR-DECISIONS.md` PO-4/PO-5 restringiu a 2.4 a `VER_E_AGIR` e **ocultou** IO na UI — a 2.5 **habilita** o ramo irmão a partir de `EM_AVALIACAO`.

---

## Objetivo

Registrar as decisões de produto **PO-IO-1 a PO-IO-12** da Sprint 2.5 **sem inventar regra de negócio**, usando como fonte primária:

- arquitetura Sprint 2.5;
- `docs/workflow.md` §2.3, §5.2, §5.4, §8, §17–19;
- `docs/database.md` §8.6, §10.1, §11.1, §21;
- `docs/product.md`, `docs/glossary.md`;
- `docs/decisions/RBAC-MATRIX-APPROVED.md`;
- `docs/decisions/VER-E-AGIR-DECISIONS.md` (padrão RPC decisão + timeline);
- `docs/decisions/TIMELINE-DECISIONS.md` (enriquecer `STATUS_CHANGED`, sem kind novo).

---

## Decisão arquitetural central (não redesenhar)

| Item | Decisão |
|---|---|
| **IO como entidade** | **Não** — decisão em `occurrence_decisions`, status em `occurrences` |
| **Fluxo** | Ramo **paralelo** a Ver e Agir: `EM_AVALIACAO` → `INTERDICAO_CONFIRMADA` — **não** é evolução de `VER_E_AGIR` |
| **RPC** | **Estender** `record_occurrence_decision()` existente (2.4) — **não** criar RPC separada |
| **`decision_type`** | `INTERDICAO_OFICIAL` |
| **Status resultante** | `INTERDICAO_CONFIRMADA` (não existe status literal `INTERDIÇÃO_OFICIAL`) |
| **Permissão IO** | `occurrence.confirm_interdiction` — **distinta** de `occurrence.evaluate` |
| **Próximo status** | `MDHO_EM_PREENCHIMENTO` — **fora** da 2.5 (Sprint 6) |
| **Notificações** | **Proibidas** na 2.5 (Sprint 3) |
| **Tabela nova** | **Nenhuma** |

### Ramo decisório (workflow §18)

```text
EM_AVALIACAO
  ├─→ record_occurrence_decision(VER_E_AGIR)           [occurrence.evaluate]     → VER_E_AGIR           (2.4 ✓)
  └─→ record_occurrence_decision(INTERDICAO_OFICIAL)   [occurrence.confirm_interdiction] → INTERDICAO_CONFIRMADA (2.5)
```

---

## Gate G0

| Item | Estado |
|---|---|
| **G0 — Etapa 0 PO** | **Desbloqueado** (2026-08-02) |
| **Desbloqueia** | DATABASE (extensão RPC + patch timeline) e BACKEND (types/validation) |
| **Critério** | PO-IO-1…PO-IO-12 sem ambiguidade; implementação validável contra este documento |
| **Paralelo permitido** | UIUX wireframes após contrato RPC draft |

Ordem oficial: **Etapa 0 DOCS → DATABASE → BACKEND → types/validation → UIUX ∥ → WEB ∥ MOBILE → BUILD → SECURITY → QA → COMMIT**.

---

## Decisões aprovadas

### PO-IO-1 — Abrangência da interdição

| Item | Decisão |
|---|---|
| **Campo dedicado** | **Não** na 2.5 — schema não define coluna de abrangência |
| **Modelo** | **A — absorver em `decision_reason`** (texto livre) |
| **Contexto read-only** | Área, atividade, local já vêm da PP — exibir no card de contexto |
| **Futuro** | Enum/metadata em history ou colunas — sprint dedicada se produto exigir |

---

### PO-IO-2 — Transição automática para MDHO

| Item | Decisão |
|---|---|
| **2.5** | **Parar em `INTERDICAO_CONFIRMADA`** — mesma RPC **não** transita para `MDHO_EM_PREENCHIMENTO` |
| **UX** | Banner informativo: próximas etapas (MDHO) em versão futura — **sem** CTA MDHO |
| **Fonte** | `docs/workflow.md` §5.4 — MDHO inicia **após** IO confirmada, implementação Sprint 6 |

---

### PO-IO-3 — Nomenclatura da seção UI

| Item | Decisão |
|---|---|
| **Título da seção** | **“Decisão da Liderança”** quando `EM_AVALIACAO` ou formulários ativos |
| **Pós-decisão** | **“Decisão”** (summary read-only) — alinhado ao web 2.4 |
| **Base44** | `InterdictionDatail.jsx` — seção unificada de avaliação |

---

### PO-IO-4 — Usuário com ambas permissões (Supervisor/Liderança HSE)

| Item | Decisão |
|---|---|
| **UI** | **A — mostrar ambos cards** (Ver e Agir + Interdição Oficial) |
| **Layout web** | Grid **2 colunas** ≥ `md`; **stack** mobile |
| **Mutualidade** | Apenas **uma** decisão vigente — após qualquer ramo, ocultar ambos formulários |

---

### PO-IO-5 — Edição/cancelamento pós-IO

| Item | Decisão |
|---|---|
| **2.5** | **Irreversível** — sem editar/excluir decisão |
| **Cancelamento** | `occurrence.cancel` — **fora** escopo 2.5 |
| **Futuro** | Sprint cancelamento / reabertura administrativa |

---

### PO-IO-6 — Feature folder vs refactor evaluation

| Item | Decisão |
|---|---|
| **Estrutura** | **A — `features/interdicao-oficial/`** separado de `ver-e-agir/` |
| **Composição** | Detalhe PP compõe ambas features na mesma seção “Decisão da Liderança” |
| **Proibido** | Refactor amplo `occurrence-evaluation/` na 2.5 (risco regressão 2.4) |

---

### PO-IO-7 — Relação com roadmap Sprint 4/6

| Item | Decisão |
|---|---|
| **Posicionamento** | **2.5 = decisão IO antecipada** (status + decisão + UI + timeline) |
| **Roadmap** | Nota sub-sprint 2.5 em `docs/roadmap.md` — **não** renumerar sprints |
| **Sprint 6** | MDHO + fluxo completo IO permanecem no roadmap original |

---

### PO-IO-8 — Quem pode confirmar IO?

| Item | Decisão |
|---|---|
| **Permissão** | **`occurrence.confirm_interdiction`** + `can_access_occurrence` |
| **Papéis** | **Supervisor HSE**, **Liderança HSE** |
| **Fiscal** | Tem `evaluate` — vê Ver e Agir, **não** vê card IO (ocultar, não disabled) |
| **Platform Admin** | Read cross-org OK; confirm IO **negado** sem membership (`!isPlatformAdmin` no client, RPC valida org) |

---

### PO-IO-9 — Justificativa técnica (`decision_reason`)

| Item | Decisão |
|---|---|
| **Label UI** | **“Justificativa técnica”** (IO) vs “Justificativa” (Ver e Agir) — distinção copy |
| **Limites** | **10–4000** caracteres (trim) — mesmo contrato 2.4 / workflow §8 |
| **Validação** | Zod client + RPC server |

---

### PO-IO-10 — Guard `hasDecision` (mutualidade VA / IO)

| Item | Decisão |
|---|---|
| **Regra** | `hasDecision = occurrence.decision !== null` **ou** `decisionType ∈ { VER_E_AGIR, INTERDICAO_OFICIAL }` |
| **Efeito** | Com decisão vigente: ocultar **ambos** formulários; exibir summary do ramo escolhido |
| **Implementação** | Generalizar helper compartilhado (web + mobile) — **não** limitar a `hasVerEAgirDecision` |

---

### PO-IO-11 — Timeline pós-IO

| Item | Decisão |
|---|---|
| **Kind** | **`STATUS_CHANGED` enriquecido** — sem `DECISION_RECORDED` |
| **Título** | **“Interdição Oficial confirmada”** |
| **Metadata** | `decisionType`, `decisionReason` (truncado ~200), `decisionId`, `decidedByName` |
| **Patch** | Migration estende CASE em `get_occurrence_timeline` (padrão 2.4 VA) |

---

### PO-IO-12 — Confirmação destrutiva antes do submit

| Item | Decisão |
|---|---|
| **UX** | Dialog/Alert explícito: “A atividade permanecerá formalmente interditada” |
| **Estilo** | Botão primário **destrutivo** vermelho; ícone cadeado (`Lock`) |
| **Ver e Agir** | Manter confirmação 2.4 — **não** unificar dialogs na 2.5 |

---

## RBAC resumido (Sprint 2.5)

| Ação | Permissão | Papéis típicos |
|---|---|---|
| Iniciar avaliação | `occurrence.evaluate` | Fiscal, Supervisor HSE, Liderança HSE |
| Registrar Ver e Agir | `occurrence.evaluate` | Idem |
| **Confirmar IO** | **`occurrence.confirm_interdiction`** | **Supervisor HSE, Liderança HSE** |
| Visualizar | `occurrence.read` | Matriz |
| UPDATE status cliente | **Negado** | — |

### Guards UI

```typescript
canConfirmInterdiction =
  can("occurrence.confirm_interdiction") &&
  !isPlatformAdmin &&
  status === "EM_AVALIACAO" &&
  !hasDecision;

canRecordVerEAgir =
  can("occurrence.evaluate") &&
  !isPlatformAdmin &&
  status === "EM_AVALIACAO" &&
  !hasDecision;
```

---

## Integração UI (ordem oficial)

```text
[Header código + status + badge IO se INTERDICAO_CONFIRMADA]
[Banner “Atividade formalmente interditada” — se IO confirmada]
[Info / descrição operacional]
[Evidências — EvidenceSection 2.2]
[Decisão da Liderança — seção composta 2.4 + 2.5]
   ├─ evaluation-context-card (read-only)
   ├─ Grid dual (web) / stack (mobile):
   │    ├─ VerEAgirPanel (se canRecordVerEAgir)
   │    └─ InterdicaoDecisionCard (se canConfirmInterdiction)
   ├─ VerEAgirSummary (se VER_E_AGIR)
   └─ InterdicaoSummary (se INTERDICAO_CONFIRMADA)
[OccurrenceTimeline — 2.3]
[CommentComposer — 2.3]
```

---

## RPC estendida (contrato)

### `record_occurrence_decision(p_payload jsonb)`

**Payload IO (whitelist):**

```json
{
  "occurrence_id": "uuid",
  "decision_type": "INTERDICAO_OFICIAL",
  "decision_reason": "string 10-4000"
}
```

**Branch IO — validações:**

1. `auth.uid()` → `UNAUTHORIZED`
2. Ocorrência + org + `can_access_occurrence`
3. **`has_permission('occurrence.confirm_interdiction', organization_id)`** → senão `FORBIDDEN`
4. `status = 'EM_AVALIACAO'`
5. Sem decisão vigente → senão `ALREADY_DECIDED`
6. `decision_type = 'INTERDICAO_OFICIAL'`
7. `decision_reason` 10–4000 chars

**Efeitos (transação):**

- INSERT `occurrence_decisions`
- UPDATE `occurrences`: `status = INTERDICAO_CONFIRMADA`, `decision_type = INTERDICAO_OFICIAL`, `evaluated_at = now()`
- INSERT `occurrence_status_history` (`EM_AVALIACAO` → `INTERDICAO_CONFIRMADA`, metadata `{ decision_type, decision_id }`)

**Branch `VER_E_AGIR`:** manter lógica 2.4 intacta (`occurrence.evaluate` → `VER_E_AGIR`).

### Erros padronizados

```text
UNAUTHORIZED | FORBIDDEN | NOT_FOUND | STATUS_MISMATCH | ALREADY_DECIDED | VALIDATION_ERROR | CONFLICT
```

---

## Cache / invalidação

Reutilizar `use-invalidate-ver-e-agir-caches` ou extrair hook genérico `use-invalidate-occurrence-decision-caches`:

| Mutation | Invalidar |
|---|---|
| `recordInterdicao` | `detail`, `lists`, `timelinePrefix`, `statusHistory`, `decision` |

---

## Seed QA (dependência DATABASE)

| Usuário | Papel | Cenários |
|---|---|---|
| `qa-supervisor@safestop.local` | Supervisor HSE | IO-01 happy path (já existe — 2.4) |
| **`qa-fiscal@safestop.local`** _(novo)_ | Fiscal do Contrato | IO-02 — `evaluate` sim, `confirm_interdiction` **não** |
| `qa-gestor@safestop.local` | Gestor | IO-08 — read only, sem cards |
| `qa-field@safestop.local` | HSE Campo | Negativo CTAs |

Senha local: `SafeStop-QA-Local-2026`.

---

## Explicitamente fora da Sprint 2.5

- MDHO (`MDHO_EM_PREENCHIMENTO`, `mdho.fill`, etc.)
- IMS, plano de ação
- Notificações, push, e-mail, ciência
- Liberação, correção, validação, encerramento, cancelamento formal
- Tabela `official_interdictions` ou entidade IO separada
- Transição PP → IO (pulo de `EM_AVALIACAO`)
- Segunda decisão / substituição de decisão
- Campo struct “abrangência” (PO-IO-1 futuro)
- Realtime, offline queue persistente
- Refactor monolítico `occurrence-evaluation/`

---

## Cross-check com `INTERDICAO-OFICIAL-UI-SPEC.md`

| Tema | PO | UI-SPEC | Status |
|---|---|---|---|
| Seção “Decisão da Liderança” / “Decisão” | PO-IO-3 | IO-SECTION + IO-C01/IO-C02 | Alinhado |
| Grid dual VA+IO (web) / stack mobile | PO-IO-4 | IO-CARD wireframes | Alinhado |
| Fiscal oculta IO | PO-IO-8 | Guards + checklist | Alinhado |
| Justificativa técnica 10–4000 | PO-IO-9 | IO-CARD + IO-C05 | Alinhado |
| Dialog destrutivo | PO-IO-12 | IO-CONFIRM | Alinhado |
| Summary vermelho + hint MDHO sem CTA | PO-IO-2 | IO-SUMMARY | Alinhado |
| Timeline “Interdição Oficial confirmada” | PO-IO-11 | Timeline + IO-C26 | Alinhado |
| Mutualidade `hasDecision` | PO-IO-10 | Guards | Alinhado |
| Feature `interdicao-oficial/` | PO-IO-6 | Regras card | Alinhado |
| Fora: MDHO, notificações, IMS | Fora de escopo | Escopo + checklist | Alinhado |
| Copy IO-C* | — | Catálogo | Alinhado |

---

## Cenários QA (referência IO-*)

| ID | Cenário |
|---|---|
| IO-01 | Supervisor HSE confirma IO em EM_AVALIACAO |
| IO-02 | Fiscal tenta IO → FORBIDDEN / card oculto |
| IO-03 | Justificativa < 10 chars → VALIDATION_ERROR |
| IO-04 | Status ≠ EM_AVALIACAO → STATUS_MISMATCH |
| IO-05 | Segunda decisão → ALREADY_DECIDED |
| IO-06 | Cross-org → FORBIDDEN |
| IO-07 | Timeline “Interdição Oficial confirmada” |
| IO-08 | qa-gestor — sem cards de ação |
| IO-09 | Regressão VA-01..VA-07 intacta |
| IO-10 | Mobile offline — submit bloqueado |
| IO-11 | Concorrência dois supervisores — um vence |
| IO-12 | Summary read-only após INTERDICAO_CONFIRMADA |

Regressão: SW-01, EV-01, TL-01..TL-05, VA-01..VA-07.

---

## Dependências registradas

### Etapa 1 — DATABASE (desbloqueada)

1. Migration `CREATE OR REPLACE record_occurrence_decision` — branch IO
2. Patch `get_occurrence_timeline` — título PO-IO-11
3. Seed `qa-fiscal@safestop.local`
4. Script `supabase/scripts/smoke-interdicao-oficial.mjs`
5. `supabase db reset` OK

### Etapa 2 — BACKEND (+ types/validation)

1. `recordInterdicaoDecisionSchema` ou schema unificado
2. Tipos input/result IO (reutilizar `OccurrenceDecision`)
3. Smoke VA + IO no mesmo script ou scripts irmãos

### Etapas 3–4 — UIUX, WEB, MOBILE

1. ~~`INTERDICAO-OFICIAL-UI-SPEC.md`~~ **Concluído**
2. `features/interdicao-oficial/` web + mobile
3. Composição no detalhe PP; helper `hasDecision` genérico

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER / DOCS
Data: 2026-08-02
Base documental: arquitetura Sprint 2.5; docs/workflow.md §2.3, §5.4, §18; docs/database.md §10.1
Status: APROVADO — liberar DATABASE e BACKEND (G0 → G1)
```

---

## Referências

- `docs/workflow.md` §2.3, §5.2, §5.4, §8, §17–19
- `docs/database.md` §8.6, §10.1, §11.1, §21
- `docs/decisions/RBAC-MATRIX-APPROVED.md`
- `docs/decisions/VER-E-AGIR-DECISIONS.md`
- `docs/decisions/VER-E-AGIR-UI-SPEC.md`
- `docs/decisions/INTERDICAO-OFICIAL-UI-SPEC.md`
- `docs/decisions/TIMELINE-DECISIONS.md`
- `docs/api.md` — payload `INTERDICAO_OFICIAL` em `record_occurrence_decision`
- `reference/base44/src/pages/InterdictionDatail.jsx`
