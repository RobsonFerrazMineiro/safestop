# Decisões — Ver e Agir / Avaliação da Liderança (Sprint 2.4)

**Status:** `APROVADO`  
**Sprint:** 2.4 — Ver e Agir (sub-entrega incremental até status `VER_E_AGIR`)  
**Data:** 2026-08-02  
**Etapa:** 0 — Produto (agente MASTER / DOCS)  
**Gate:** **G0 desbloqueado** — libera DATABASE (Etapa 1) e BACKEND (Etapa 2)

**Arquitetura base:** Sprint 2.4 — Ver e Agir (2026-08-02, aprovada)

**Fundação:** Sprint 2.0 (Occurrences) + 2.1 (PP) + 2.2 (Evidências) + 2.3 (Timeline/Comentários)

**Modelo de dados:** `docs/database.md` §8.6, §10.1, §11.1 — **não reescrever**; este documento referencia e complementa.

**Spec UI:** [`VER-E-AGIR-UI-SPEC.md`](./VER-E-AGIR-UI-SPEC.md)

**Relação roadmap:** `docs/roadmap.md` Sprint 4 = avaliação completa (inclui Interdição Oficial). A **sub-sprint 2.4** antecipa apenas o caminho **Ver e Agir** até `VER_E_AGIR`, sem IO, MDHO, IMS, correção ou notificações.

**Relação 2.1:** `PREVENTIVE-STOP-DECISIONS.md` A-R1 cita transição `EM_AVALIACAO` na Sprint 4 — interpretada como entrega incremental via **2.4**, sem alterar decisões da 2.1.

---

## Objetivo

Registrar as decisões de produto **PO-1 a PO-20** da Sprint 2.4 **sem inventar regra de negócio**, usando como fonte primária:

- arquitetura Sprint 2.4;
- `docs/workflow.md` §5–6, §8, §17–18, §19;
- `docs/database.md` §8.6, §10.1, §11.1, §21;
- `docs/decisions/RBAC-MATRIX-APPROVED.md`;
- `docs/decisions/TIMELINE-DECISIONS.md` (timeline derivada de history);
- `docs/decisions/EVIDENCE-DECISIONS.md` (evidências continuam permitidas).

---

## Decisão arquitetural central (não redesenhar)

| Item | Decisão |
|---|---|
| **Operações de domínio** | **Duas RPCs distintas** — iniciar avaliação ≠ registrar decisão |
| **Tabela `occurrence_evaluations`** | **Não criar** — status `EM_AVALIACAO` **é** o estado “em avaliação” |
| **Decisão vigente** | `occurrence_decisions` (1:1 por ocorrência na 2.4 — bloquear segunda decisão) |
| **Histórico imutável** | `occurrence_status_history` — fonte técnica; timeline = projeção via `get_occurrence_timeline` |
| **Escopo decisório 2.4** | Apenas `decision_type = VER_E_AGIR` → status `VER_E_AGIR` |
| **Notificações** | **Proibidas** na 2.4 (Sprint 3) |

### RPCs oficiais (§21 database.md)

| # | Operação | Transição | RPC |
|---|---|---|---|
| 1 | Iniciar avaliação | `PARALISACAO_PREVENTIVA` → `EM_AVALIACAO` | `start_occurrence_evaluation(occurrence_id)` |
| 2 | Registrar decisão Ver e Agir | `EM_AVALIACAO` → `VER_E_AGIR` | `record_occurrence_decision(payload jsonb)` |

**Nunca** combinar as duas operações em uma única RPC na 2.4.

---

## Gate G0

| Item | Estado |
|---|---|
| **G0 — Etapa 0 PO** | **Desbloqueado** (2026-08-02) |
| **Desbloqueia** | DATABASE (RPCs + patch timeline) e BACKEND (corpo RPC + types/validation) |
| **Critério** | PO-1…PO-20 sem ambiguidade; implementação validável contra este documento |
| **Paralelo permitido** | UIUX wireframes após contrato RPC draft |

Ordem oficial: **Etapa 0 DOCS → DATABASE → BACKEND → types/validation → UIUX ∥ → WEB ∥ MOBILE → BUILD → SECURITY → QA → COMMIT**.

---

## Decisões aprovadas

### PO-1 — Quem pode iniciar avaliação?

| Item | Decisão |
|---|---|
| **Permissão** | **`occurrence.evaluate`** na organização da ocorrência **+** `can_access_occurrence(occurrence_id)` |
| **Papéis (matriz aprovada)** | **Fiscal do Contrato**, **Supervisor HSE**, **Liderança HSE** |
| **Não incluir** | HSE de Campo, Gestor, Administrador da Empresa (#4 pendente — só read) |
| **Fonte** | `docs/workflow.md` §17; `RBAC-MATRIX-APPROVED.md` |

---

### PO-2 — Quem pode registrar decisão Ver e Agir?

| Item | Decisão |
|---|---|
| **Permissão** | **`occurrence.evaluate`** — **mesmos papéis** de PO-1 |
| **Status exigido** | `EM_AVALIACAO` |
| **Nota** | Não exigir que `assigned_evaluator_id = auth.uid()` para decidir na 2.4 — qualquer usuário com evaluate no escopo pode registrar (supervisor substituindo fiscal) |

---

### PO-3 — Start e decisão separados?

| Item | Decisão |
|---|---|
| **Modelo** | **A — duas RPCs** (`start_occurrence_evaluation` + `record_occurrence_decision`) |
| **Proibido** | RPC única que pule `EM_AVALIACAO` ou merge start+decide |
| **Fonte** | `docs/workflow.md` §18 — PP → EM_AVALIACAO → VER_E_AGIR |

---

### PO-4 — Decisões nesta sprint

| Item | Decisão |
|---|---|
| **Implementar** | Apenas **`VER_E_AGIR`** |
| **Fora** | `INTERDICAO_OFICIAL` / `confirm_interdiction` — sprint futura (roadmap Sprint 4 IO) |
| **Payload RPC** | Whitelist `decision_type = 'VER_E_AGIR'` — rejeitar outros valores |

---

### PO-5 — Interdição Oficial na mesma tela?

| Item | Decisão |
|---|---|
| **UI 2.4** | **Ocultar** completamente opção IO — não mostrar botão disabled |
| **Motivo** | Evitar confusão operacional; IO fora do escopo |

---

### PO-6 — Justificativa mínima da decisão

| Item | Decisão |
|---|---|
| **Campo** | `decision_reason` em `occurrence_decisions` |
| **Mínimo** | **10** caracteres (trim aplicado) |
| **Máximo** | **4000** caracteres |
| **Validação** | Zod client + RPC server |
| **Fonte** | `docs/workflow.md` §8 — “Não permitir decisão sem justificativa mínima” |

---

### PO-7 — Ação imediata na abertura PP

| Item | Decisão |
|---|---|
| **Campo** | `occurrences.immediate_action_description` |
| **UI 2.4** | **Read-only** no card de contexto (`evaluation-context-card`) |
| **Obrigatoriedade** | **Não** exigir preenchimento retroativo para decidir |

---

### PO-8 — Campo “análise do responsável” separado

| Item | Decisão |
|---|---|
| **Modelo 2.4** | **A — somente `decision_reason`** absorve análise + justificativa formal |
| **Sem migration** | Não criar coluna `analysis_notes` nem JSONB dedicado na 2.4 |
| **History** | `decision_reason` truncado (se necessário) em `occurrence_status_history.reason`; texto integral em `occurrence_decisions` |

---

### PO-9 — Comentário informal como justificativa formal?

| Item | Decisão |
|---|---|
| **Substituição** | Comentário **não substitui** decisão formal |
| **UX opcional** | Link/ação **“Usar como rascunho”** copia texto de comentário para o textarea — **sem** auto-submit |
| **Fonte** | Decisão formal = RPC `record_occurrence_decision` apenas |

---

### PO-10 — Evidência obrigatória para decidir?

| Item | Decisão |
|---|---|
| **Obrigatória?** | **Não** |
| **Evidências em EM_AVALIACAO** | Continuam **permitidas** (regras 2.2 / EVIDENCE-DECISIONS PO-13) |
| **Fonte** | `docs/workflow.md` §7.1 — evidência “quando viável”, não gate hard na decisão |

---

### PO-11 — Reabrir avaliação (reversão)

| Item | Decisão |
|---|---|
| **2.4** | **Fora de escopo** — transições **não reversíveis** |
| **Futuro** | Reabertura administrativa — sprint/PO dedicado |

---

### PO-12 — Segunda decisão na mesma ocorrência

| Item | Decisão |
|---|---|
| **Comportamento** | **Bloquear** — RPC retorna `ALREADY_DECIDED` |
| **Implementação** | Checagem explícita antes de INSERT em `occurrence_decisions` |
| **Nota técnica** | Sem UNIQUE constraint hoje — validação server-side obrigatória |
| **Fonte** | `docs/database.md` §10.1 — uma decisão vigente |

---

### PO-13 — Platform Admin pode decidir sem vínculo?

| Item | Decisão |
|---|---|
| **Mutations** | **Não** — padrão O10 fundação: read cross-org OK; start/decide exige membership + evaluate |
| **Leitura** | Platform admin visualiza timeline/decisão read-only |

---

### PO-14 — UI após status `VER_E_AGIR`

| Item | Decisão |
|---|---|
| **Seção decisão** | **Read-only** (`ver-e-agir-summary`) — badge “Ver e Agir”, justificativa, decidido por/em |
| **CTA** | **Nenhum** de correção/liberação na 2.4 |
| **Copy hint** | **“Aguardando correção”** ou equivalente — próxima etapa Sprint 5 |

---

### PO-15 — Botão IO visível disabled?

| Item | Decisão |
|---|---|
| **Decisão** | **Ocultar** (alinhado a PO-5) |

---

### PO-16 — Solicitar complementação (permanece EM_AVALIACAO)

| Item | Decisão |
|---|---|
| **2.4** | **Fora de escopo** |

---

### PO-17 — Idempotência de `start_occurrence_evaluation`

| Item | Decisão |
|---|---|
| **Já EM_AVALIACAO + `assigned_evaluator_id = auth.uid()`** | Retornar **`success` idempotente** com estado atual |
| **Já EM_AVALIACAO + evaluator diferente** | `STATUS_MISMATCH` + `currentStatus` no payload de erro |
| **Status ≠ PP e ≠ EM_AVALIACAO (idempotente)** | `STATUS_MISMATCH` |
| **Implementação** | `UPDATE ... WHERE status = 'PARALISACAO_PREVENTIVA'` — 0 rows → checar idempotência ou CONFLICT |

---

### PO-18 — INSERT `occurrence_participants` role EVALUATOR no start

| Item | Decisão |
|---|---|
| **2.4** | **Opcional / fora** — não bloquear entrega; participantes sprint futura |
| **Mínimo** | `assigned_evaluator_id` em `occurrences` no start |

---

### PO-19 — Rota dedicada vs seção inline

| Item | Decisão |
|---|---|
| **Navegação 2.4** | **Inline no detalhe** PP (`stop-work-detail-container` / `preventive-stop-detail-screen`) |
| **Rota `/evaluation`** | **Não obrigatória** na 2.4 |

---

### PO-20 — Kind de timeline para decisão

| Item | Decisão |
|---|---|
| **Abordagem** | **Enriquecer `STATUS_CHANGED`** — **não** criar kind `DECISION_RECORDED` |
| **Títulos PT (patch RPC)** | PP → EM_AVALIACAO: **“Avaliação iniciada”**; EM_AVALIACAO → VER_E_AGIR: **“Decisão: Ver e Agir”** |
| **Metadata** | `decisionType`, `decisionReason` (truncado), `evaluatorName` quando aplicável |
| **Fonte técnica** | `occurrence_status_history` — timeline não duplica INSERT |

---

## RBAC resumido (Sprint 2.4)

| Ação | Permissão |
|---|---|
| Visualizar detalhe / contexto / decisão read-only | `occurrence.read` + `can_access_occurrence` |
| Iniciar avaliação | `occurrence.evaluate` + status `PARALISACAO_PREVENTIVA` |
| Registrar Ver e Agir | `occurrence.evaluate` + status `EM_AVALIACAO` + sem decisão vigente |
| Confirmar IO | `occurrence.confirm_interdiction` — **fora 2.4** |
| UPDATE direto `occurrences.status` | **Negado** — somente RPC SECURITY DEFINER |

### Guards UI (derivados de `can()`, nunca papel)

```text
canStartEvaluation =
  can("occurrence.evaluate") && status === "PARALISACAO_PREVENTIVA"

canRecordVerEAgir =
  can("occurrence.evaluate") && status === "EM_AVALIACAO" && !hasDecision

canViewEvaluationContext =
  can("occurrence.read")
```

---

## Integração UI (ordem oficial — atualiza 2.3)

```text
[Header código + status]
[Info / descrição operacional]
[Evidências — EvidenceSection Sprint 2.2]
[Ver e Agir — Sprint 2.4]          ← NOVO bloco
  PP: StartEvaluationButton
  EM_AVALIACAO: VerEAgirPanel (form)
  VER_E_AGIR+: VerEAgirSummary (read-only)
[OccurrenceTimeline — Sprint 2.3]
[CommentComposer — Sprint 2.3]
```

---

## Leitura da decisão (contrato apps)

| Dado | Fonte |
|---|---|
| `decision_type`, `evaluated_at` | Colunas em `occurrences` (já no DETAIL_SELECT) |
| `decision_reason`, `decided_by`, `decided_at` | Join 1:1 `occurrence_decisions` no detalhe **ou** query key `decision` dedicada |
| `assigned_evaluator_id` | Coluna `occurrences` — preenchida no start |
| `hasDecision` | Existência de linha em `occurrence_decisions` **ou** `status >= VER_E_AGIR` com `decision_type` |

**Implementação recomendada:** estender `DETAIL_SELECT` web/mobile com embed `occurrence_decisions(...)` (0..1).

---

## RPCs (contrato de referência)

### `start_occurrence_evaluation(p_occurrence_id uuid) returns jsonb`

**Retorno sucesso:**

```typescript
{
  success: true;
  data: {
    occurrenceId: string;
    previousStatus: "PARALISACAO_PREVENTIVA";
    currentStatus: "EM_AVALIACAO";
    assignedEvaluatorId: string;
    transitionedAt: string;
  };
}
```

**Efeitos:** UPDATE `occurrences` (status, assigned_evaluator_id); INSERT `occurrence_status_history` com `metadata: { "action": "start_evaluation" }`.

### `record_occurrence_decision(p_payload jsonb) returns jsonb`

**Payload whitelist:**

```typescript
{
  occurrence_id: uuid;
  decision_type: "VER_E_AGIR";
  decision_reason: string; // PO-6: 10–4000
}
```

**Retorno sucesso:** decisão + ocorrência atualizada (`OccurrenceDecisionResult`).

**Efeitos:** INSERT `occurrence_decisions`; UPDATE `occurrences` (status, decision_type, evaluated_at); INSERT history com metadata `{ decision_type, decision_id }`.

### Erros padronizados (ambas)

```text
UNAUTHORIZED | FORBIDDEN | NOT_FOUND | STATUS_MISMATCH | ALREADY_DECIDED | VALIDATION_ERROR | CONFLICT
```

---

## Cache / invalidação (TanStack Query)

Estender `occurrenceQueryKeys`:

```typescript
decision: (occurrenceId: string) =>
  [...root, "detail", occurrenceId, "decision"] as const,
```

| Mutation | Invalidar |
|---|---|
| `startEvaluation` | `detail`, `lists`, `timeline`, `statusHistory`, `timelinePrefix` |
| `recordVerEAgir` | idem + `decision` |

---

## Seed QA (dependência DATABASE)

| Item | Decisão |
|---|---|
| **Problema** | Seed atual **não** possui usuário com `occurrence.evaluate` |
| **Ação 2.4** | Adicionar **`qa-supervisor@safestop.local`** (Supervisor HSE na Alpha) **ou** equivalente Fiscal |
| **Negativo** | `qa-field` (sem evaluate), `qa-gestor` (read only) — VA-07, VA-10 |
| **Senha local** | `SafeStop-QA-Local-2026` (padrão seed) |

---

## Explicitamente fora da Sprint 2.4

- Interdição Oficial (`confirm_interdiction`, `INTERDICAO_CONFIRMADA`)
- Correção, validação, liberação, encerramento, cancelamento operacional
- MDHO, IMS, plano de ação
- Notificações, push, e-mail, ciência, escalonamento
- Tabela `occurrence_evaluations`
- Reabertura / reversão de avaliação
- Edição ou exclusão retroativa de decisão
- Assinatura digital, workflow configurável
- `audit_events` (fase 7)
- Realtime
- Fila offline para mutations de avaliação
- Rota web/mobile dedicada obrigatória

---

## Cross-check com `VER-E-AGIR-UI-SPEC.md`

| Tema | PO | UI-SPEC | Status |
|---|---|---|---|
| Start ≠ Decide (duas RPCs) | PO-3 | VA-START / VA-FORM separados | Alinhado |
| IO oculto (não disabled) | PO-5, PO-15 | Escopo + VA-FORM | Alinhado |
| Justificativa 10–4000 | PO-6 | VA-FORM | Alinhado |
| Comentário ≠ decisão formal | PO-9 | Rascunho opcional sem auto-submit | Alinhado |
| Summary + “Aguardando correção” | PO-14 | VA-SUMMARY | Alinhado |
| Inline no detalhe | PO-19 | Posição + princípios | Alinhado |
| Ordem Evidências → VA → Timeline → Composer | Integração UI | Posição no detalhe | Alinhado |
| Permissão `occurrence.evaluate` | PO-1, PO-2 | Guards UI | Alinhado |
| Timeline títulos PT | PO-20 | Seção Timeline | Alinhado |
| PP / EM_AVALIACAO / VER_E_AGIR+ / conflict / forbidden / loading | — | Componentes + estados | Alinhado |
| Fora: IO, notificações, correção | Fora de escopo | Escopo + checklist | Alinhado |

---

## Cenários QA (referência VA-*)

| ID | Cenário |
|---|---|
| VA-01 | Fiscal/Supervisor inicia avaliação PP → EM_AVALIACAO |
| VA-02 | History + timeline “Avaliação iniciada” após start |
| VA-03 | Supervisor registra Ver e Agir com justificativa |
| VA-04 | Status VER_E_AGIR + row decision + decision_type |
| VA-05 | Detalhe web/mobile reflete novo status |
| VA-06 | assigned_evaluator_id = quem iniciou |
| VA-07 | qa-field não vê CTAs evaluate |
| VA-08 | Cross-org start → FORBIDDEN |
| VA-09 | Payload evaluator_id forjado → ignorado |
| VA-10 | qa-gestor visualiza sem CTAs |
| VA-11 | Dois usuários start — um CONFLICT/STATUS_MISMATCH |
| VA-12 | Duplo clique start — idempotente ou CONFLICT |
| VA-13 | Decisão com status já VER_E_AGIR → STATUS_MISMATCH |
| VA-14 | Retry após success → ALREADY_DECIDED |
| VA-15 | Loading states |
| VA-16 | Conflict refresh UI |
| VA-17 | Troca org limpa estado |
| VA-18 | Logout mid-form |

Regressão: SW-01 (criar PP), EV-01 (evidência), TL-01..TL-05 (timeline/comentários).

---

## Dependências registradas

### Etapa 1 — DATABASE (desbloqueada)

1. RPC `start_occurrence_evaluation`
2. RPC `record_occurrence_decision` (whitelist VER_E_AGIR)
3. Patch `get_occurrence_timeline` — títulos PO-20
4. Seed `qa-supervisor` (ou Fiscal) com `occurrence.evaluate`
5. Script smoke `supabase/scripts/smoke-ver-e-agir.mjs`
6. `supabase db reset` OK

### Etapa 2 — BACKEND (+ types/validation)

1. `packages/types` — `OccurrenceDecision`, `OccurrenceTransitionResult`, inputs
2. `packages/validation` — `startEvaluationSchema`, `recordVerEAgirDecisionSchema`
3. Regenerar `database.types.ts`

### Etapas 3–4 — UIUX, WEB, MOBILE

1. ~~`docs/decisions/VER-E-AGIR-UI-SPEC.md`~~ **Concluído**
2. `features/ver-e-agir/` web + mobile
3. Integração detalhe PP; ordem UI PO-19

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER / DOCS
Data: 2026-08-02
Base documental: arquitetura Sprint 2.4; docs/workflow.md §5–6, §8, §17–18; docs/database.md §10–11, §21
Status: APROVADO — liberar DATABASE e BACKEND (G0 → G1)
```

---

## Referências

- `docs/workflow.md` §5–6, §8, §17–18, §19
- `docs/database.md` §8.6, §10.1, §11.1, §21
- `docs/decisions/RBAC-MATRIX-APPROVED.md`
- `docs/decisions/PREVENTIVE-STOP-DECISIONS.md` (A-R1)
- `docs/decisions/TIMELINE-DECISIONS.md` (PO-20 alinhado)
- `docs/decisions/EVIDENCE-DECISIONS.md`
- `docs/decisions/VER-E-AGIR-UI-SPEC.md`
- `docs/decisions/TIMELINE-UI-SPEC.md` (ordem seções — atualizada pela 2.4)
- `reference/base44/src/pages/InterdictionDatail.jsx` (referência visual — **não** copiar merge start+decide)
