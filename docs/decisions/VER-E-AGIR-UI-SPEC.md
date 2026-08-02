# Spec UI/UX — Ver e Agir (Sprint 2.4)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 2.4 — Ver e Agir (primeira avaliação formal PP)  
**Agente:** UIUX  
**Data:** 2026-08-02  
**Entregável:** `docs/decisions/VER-E-AGIR-UI-SPEC.md`

**PO (fonte oficial):** [`VER-E-AGIR-DECISIONS.md`](./VER-E-AGIR-DECISIONS.md) — PO-1…PO-20; Gate G0.

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/decisions/VER-E-AGIR-DECISIONS.md` | RPCs, guards, erros, PO |
| `docs/decisions/PREVENTIVE-STOP-UI-SPEC.md` | Detalhe PP base |
| `docs/decisions/TIMELINE-UI-SPEC.md` | Ordem seções (atualizada 2.4) |
| `docs/decisions/EVIDENCE-UI-SPEC.md` | Bloco evidências acima — não redesenhar |
| `docs/design-system.md` | Banner, Button, Dialog, Textarea, Badge, Card |
| `reference/base44/.../InterdictionDatail.jsx` (L244–278) | Cards decisão — 2.4: só VA; **2.5** habilita IO (ver abaixo) |
| `apps/web/.../stop-work-detail-container.tsx` | Ponto de inserção inline |
| `docs/decisions/INTERDICAO-OFICIAL-UI-SPEC.md` | Sprint 2.5 — grid dual VA+IO; supersede “Sem IO” em EM_AVALIACAO |

Base44 = composição. PO prevalece. Conflito PO vs UI → **PO vence**.

**Nota Sprint 2.5:** Em `EM_AVALIACAO`, a seção passa a chamar-se **Decisão da Liderança** e pode exibir **ambos** cards (VA + IO) conforme permissões. PO-5/PO-15 da 2.4 (“ocultar IO”) aplicam-se apenas enquanto a 2.5 não estiver entregue; após 2.5, Fiscal continua **sem** card IO (oculto). Spec IO: [`INTERDICAO-OFICIAL-UI-SPEC.md`](./INTERDICAO-OFICIAL-UI-SPEC.md).

---

## Objetivo

Entregar spec mobile-first para WEB/MOBILE implementarem **sem ambiguidade**:

1. **Iniciar avaliação** (`PARALISACAO_PREVENTIVA` → `EM_AVALIACAO`)
2. **Registrar Ver e Agir** (`EM_AVALIACAO` → `VER_E_AGIR`)

Com **dois CTAs distintos**, sem IO, sem “Responsáveis notificados”, sem CTA de correção.

---

## Terminologia

| Termo UI | Significado |
|---|---|
| **Ver e Agir** | Decisão (`decision_type`) + badge + CTA decide |
| **Em Avaliação** | Status `EM_AVALIACAO` |
| **Iniciar avaliação** | CTA / RPC `start_occurrence_evaluation` |
| **Registrar Ver e Agir** | CTA / RPC `record_occurrence_decision` |
| **Avaliação iniciada** | Título timeline PP → EM_AVALIACAO (PO-20) |
| **Decisão: Ver e Agir** | Título timeline EM_AVALIACAO → VER_E_AGIR (PO-20) |

Permissão: **`occurrence.evaluate`** — nunca inventar `occurrence.evaluation`.

---

## Princípios invioláveis

| Regra | Aplicação |
|---|---|
| Dois CTAs | `StartEvaluationButton` ≠ decide — **nunca** um botão único (PO-3) |
| Sem IO | **Ocultar** Interdição Oficial — nem disabled (PO-5 / PO-15) |
| Sem notificados | Nenhuma copy de responsáveis/alertas |
| Inline | Seção no detalhe; rota `/evaluation` não obrigatória (PO-19) |
| Comentário ≠ decisão | Só rascunho opcional (PO-9) |
| Server authority | `STATUS_MISMATCH` / `ALREADY_DECIDED` → refresh |
| Mobile First | CTA full-width; toque ≥ 48px; Safe Area |

---

## Ordem vertical do detalhe (atualiza 2.3; estendida na 2.5)

```text
1. Header — código SS-* + status badge (+ criticidade)
2. Grid info — área, local, atividade, autor, datas
3. Condição insegura (+ medida imediata se no bloco descrição)
4. Evidências — EvidenceSection 2.2
5. Decisão da Liderança — 2.4 + 2.5
     PP:                    StartEvaluationButton (+ banner) — este spec
     EM_AVALIACAO:          context + VerEAgirPanel (+ InterdicaoDecisionCard na 2.5)
     VER_E_AGIR:            VerEAgirSummary
     INTERDICAO_CONFIRMADA: InterdicaoSummary (2.5)
6. Linha do Tempo — OccurrenceTimeline
7. Carregar mais (se houver)
8. CommentComposer
```

**Não** fundir decisão com Timeline. Detalhe IO: [`INTERDICAO-OFICIAL-UI-SPEC.md`](./INTERDICAO-OFICIAL-UI-SPEC.md).

---

## Guards UI

```text
canStartEvaluation =
  can("occurrence.evaluate") && status === "PARALISACAO_PREVENTIVA"

canRecordVerEAgir =
  can("occurrence.evaluate") && status === "EM_AVALIACAO" && !hasDecision

canViewEvaluationContext =
  can("occurrence.read")
```

| Situação | UI |
|---|---|
| Sem `occurrence.evaluate` | **FORBIDDEN** — sem CTAs (nem disabled) |
| Platform Admin | Read-only; sem mutations (PO-13) |
| `qa-field` / `qa-gestor` | Sem CTAs evaluate (VA-07 / VA-10) |

---

## Componentes (contrato de implementação)

| Componente | Responsabilidade |
|---|---|
| `StartEvaluationButton` | CTA + confirm dialog → `start_occurrence_evaluation` |
| `evaluation-context-card` | Contexto PP read-only (condição, ação imediata) |
| `VerEAgirPanel` | Card decisão 1 coluna + textarea + CTA decide |
| `VerEAgirSummary` | Badge + justificativa + autor/data + hint |
| `EvaluationConflictCard` | `STATUS_MISMATCH` + botão Atualizar |

---

# Estado A — `PARALISACAO_PREVENTIVA`

### Wireframe mobile

```text
┌──────────────────────────────────────┐
│ … evidências …                       │
│                                      │
│ AVALIAÇÃO                            │  label uppercase DS
│ ┌──────────────────────────────────┐ │
│ │ ℹ Aguardando avaliação da        │ │  banner information
│ │   liderança                      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │     Iniciar avaliação            │ │  primary full-width
│ └──────────────────────────────────┘ │  só se canStartEvaluation
└──────────────────────────────────────┘
```

### StartEvaluationButton

| Prop | Valor |
|---|---|
| Label idle | `Iniciar avaliação` |
| Label loading | `Iniciando…` |
| Variante | `primary` full-width |
| Visível | Somente `canStartEvaluation` |
| RPC | **Somente** `start_occurrence_evaluation(occurrence_id)` |

### Confirm dialog (obrigatório)

```text
Iniciar avaliação desta paralisação?

A ocorrência passará para Em Avaliação
para registro da decisão da liderança.

[ Cancelar ]     [ Iniciar avaliação ]
```

- Ação principal = primary (não destructive).
- Cancelar fecha sem mutation.

### Pós-start

| Resultado | UI |
|---|---|
| Success | Invalidar detail/lists/timeline → render `VerEAgirPanel` |
| Idempotente (mesmo user, já EM_AVALIACAO) | Success silencioso → form (PO-17) |
| `STATUS_MISMATCH` | `EvaluationConflictCard` (VA-16) |
| `FORBIDDEN` | Sem CTA (já oculto) / toast se race |

**Proibido:** abrir form de decisão neste status; merge start+decide.

---

# Estado B — `EM_AVALIACAO`

### Wireframe mobile

```text
┌──────────────────────────────────────┐
│ … evidências …                       │
│                                      │
│ DECISÃO DA LIDERANÇA                 │
│                                      │
│ ┌─ evaluation-context-card ────────┐ │
│ │ Condição insegura                │ │
│ │ {condition_description}          │ │
│ │                                  │ │
│ │ Ação imediata                    │ │
│ │ {immediate_action…} ou —         │ │
│ │                                  │ │
│ │ Avaliador  Nome (se houver)      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ VerEAgirPanel (1 coluna) ───────┐ │
│ │  Ver e Agir                      │ │  card estilo Base44
│ │  Resolução imediata no campo     │ │  SEM card IO
│ └──────────────────────────────────┘ │
│                                      │
│ Justificativa *                      │
│ ┌──────────────────────────────────┐ │
│ │ textarea                         │ │
│ └──────────────────────────────────┘ │
│ 12/4000  (mín. 10)                   │
│                                      │
│ Usar comentário como rascunho        │  link opcional PO-9
│                                      │
│ ┌──────────────────────────────────┐ │
│ │     Registrar Ver e Agir         │ │  primary full-width
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### evaluation-context-card (PO-7)

| Campo | Fonte | Editável |
|---|---|---|
| Condição insegura | `condition_description` | Não |
| Ação imediata | `immediate_action_description` | Não — se vazio: `—` ou omitir linha |
| Avaliador atribuído | `assigned_evaluator_id` → nome | Não — omitir se null |

Não exigir preenchimento retroativo da ação imediata para decidir.

### VerEAgirPanel

| Item | Spec |
|---|---|
| Layout | **Grid 1 coluna** — adaptação Base44 (era 2 cols) |
| Card | Único: título `Ver e Agir` + subtítulo `Resolução imediata no campo` |
| Cor card | Âmbar/warning tokens DS (referência Base44 amber) — texto + ícone, não só cor |
| IO | **Ausente** — não renderizar stub |
| Justificativa | `decision_reason` — único campo (PO-8) |
| Min / max | **10** / **4000** trim (PO-6) |
| Contador | `n/4000`; helper `Mínimo 10 caracteres` |
| CTA | `Registrar Ver e Agir` — primary full-width |
| CTA loading | `Registrando…` + disabled; textarea readonly opcional |
| CTA disabled | trim < 10, > 4000, pending, offline |
| RPC | `record_occurrence_decision({ occurrence_id, decision_type: "VER_E_AGIR", decision_reason })` |
| Visível | Somente `canRecordVerEAgir` |

### Confirm dialog decide (recomendado)

```text
Registrar decisão Ver e Agir?

Esta ação não pode ser desfeita nesta etapa.

[ Cancelar ]     [ Registrar Ver e Agir ]
```

### Link “Usar comentário como rascunho” (PO-9)

- Opcional; só se houver ≥1 comentário `GENERAL` ativo.
- Ação: copia texto do comentário escolhido (picker simples / último) para o textarea.
- **Não** submete RPC.
- Se textarea já tiver texto: confirmar sobrescrita ou anexar — preferir **substituir com confirm** curto: `Substituir o texto da justificativa?`

### Erros form

| Código / caso | UI |
|---|---|
| Validação client | Inline: `Informe uma justificativa com pelo menos 10 caracteres.` |
| `VALIDATION_ERROR` | Inline no textarea |
| `STATUS_MISMATCH` | Conflict card |
| `ALREADY_DECIDED` | Info + passar a `VerEAgirSummary` após refresh |
| Offline | CTAs disabled + `Você está offline. Conecte-se para registrar a decisão.` |

---

# Estado C — `VER_E_AGIR` e posteriores (2.4)

### Wireframe — VerEAgirSummary

```text
┌──────────────────────────────────────┐
│ DECISÃO                              │
│                                      │
│ [ Ver e Agir ]                       │  badge
│                                      │
│ Justificativa                        │
│ {decision_reason}  (plain escaped)   │
│                                      │
│ Decidido por   Nome                  │
│ Em             dd/mm/aaaa HH:mm      │
│                                      │
│ Aguardando correção                  │  hint PO-14 — SEM CTA
└──────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| Modo | **Read-only** |
| Badge | `Ver e Agir` (status header também pode mostrar label oficial) |
| Campos | justificativa, decidido por, decidido em |
| Hint | `Aguardando correção` — próxima etapa Sprint 5 |
| CTAs | **Nenhum** (correção / liberação / reabrir / IO) |
| Start / form | Não reexibir |

Header da ocorrência: status badge oficial `Ver e Agir` (label de status) — coerente com summary.

---

# Erros e estados transversais

## VA-15 — Loading

| Contexto | UI |
|---|---|
| Detail fetch | Skeleton do bloco Avaliação (banner/card + CTA placeholder) |
| Start pending | Dialog fechado ou CTA `Iniciando…`; anti double-tap |
| Decide pending | CTA `Registrando…`; anti double-tap |
| Refresh pós-conflict | Spinner no botão `Atualizar` |

Nunca apresentar sucesso antes da resposta RPC.

## VA-16 — Conflict (`STATUS_MISMATCH`)

### EvaluationConflictCard

```text
┌──────────────────────────────────────┐
│ ⚠ Esta ocorrência já foi atualizada  │
│                                      │
│ Atualize para ver o estado atual     │
│ antes de continuar.                  │
│                                      │
│ [ Atualizar ]                        │
└──────────────────────────────────────┘
```

| Ação | Comportamento |
|---|---|
| `Atualizar` | Refetch detail + decision + timeline (+ lists se necessário) |
| Pós-refetch | Render conforme status real; limpar form sujo se ≠ `EM_AVALIACAO` |

Payload erro pode incluir `currentStatus` — UI não precisa exibir enum cru; basta refresh.

## `ALREADY_DECIDED`

```text
Esta ocorrência já possui uma decisão registrada.
```

+ botão `Atualizar` → `VerEAgirSummary` read-only. Não manter form editável.

## `FORBIDDEN`

- Sem CTAs start/decide.
- Sem banner de “peça permissão” obrigatório.
- Opcional `aria` / sr-only: `Você não tem permissão para avaliar esta ocorrência.`
- Contexto/summary read-only se `occurrence.read`.

## Offline

```text
Você está offline.
```

CTAs disabled. Sem fila offline de avaliação (fora 2.4).

---

# Wireframe web (desktop)

```text
┌─ Sidebar ─┬────────────────────────────────────────┐
│ …         │ SS-* / badges                          │
│           │ [Info] [Condição] [Evidências]         │
│           │                                        │
│           │ AVALIAÇÃO / DECISÃO DA LIDERANÇA       │
│           │ [estado A | B | C conforme status]     │
│           │ CTAs full-width dentro max-w do card   │
│           │                                        │
│           │ LINHA DO TEMPO …                       │
│           │ CommentComposer                        │
└───────────┴────────────────────────────────────────┘
```

Mesma ordem; densidade média; Dialogs nativos web (Radix/shadcn alinhado DS).

---

# Timeline (consumo — PO-20)

UI **não** cria kind novo. Após mutations, esperar:

| Transição | Título |
|---|---|
| PP → EM_AVALIACAO | `Avaliação iniciada` |
| EM_AVALIACAO → VER_E_AGIR | `Decisão: Ver e Agir` |

Justificativa integral no Summary; timeline pode truncar em `body`/metadata.

---

# Copy PT — catálogo

| ID | Contexto | Texto |
|---|---|---|
| VA-C01 | Seção PP | `Avaliação` / label `AVALIAÇÃO` |
| VA-C02 | Seção form | `Decisão da liderança` / `DECISÃO DA LIDERANÇA` |
| VA-C03 | Banner PP | `Aguardando avaliação da liderança` |
| VA-C04 | CTA start | `Iniciar avaliação` |
| VA-C05 | Start loading | `Iniciando…` |
| VA-C06 | Confirm start title | `Iniciar avaliação desta paralisação?` |
| VA-C07 | Confirm start body | `A ocorrência passará para Em Avaliação para registro da decisão da liderança.` |
| VA-C08 | Confirm start action | `Iniciar avaliação` |
| VA-C09 | Cancel | `Cancelar` |
| VA-C10 | Context condição | `Condição insegura` |
| VA-C11 | Context ação | `Ação imediata` |
| VA-C12 | Card título | `Ver e Agir` |
| VA-C13 | Card subtítulo | `Resolução imediata no campo` |
| VA-C14 | Label justificativa | `Justificativa` |
| VA-C15 | Helper min | `Mínimo 10 caracteres` |
| VA-C16 | Contador | `{n}/4000` |
| VA-C17 | CTA decide | `Registrar Ver e Agir` |
| VA-C18 | Decide loading | `Registrando…` |
| VA-C19 | Confirm decide title | `Registrar decisão Ver e Agir?` |
| VA-C20 | Confirm decide body | `Esta ação não pode ser desfeita nesta etapa.` |
| VA-C21 | Confirm decide action | `Registrar Ver e Agir` |
| VA-C22 | Rascunho link | `Usar comentário como rascunho` |
| VA-C23 | Rascunho overwrite | `Substituir o texto da justificativa?` |
| VA-C24 | Erro min chars | `Informe uma justificativa com pelo menos 10 caracteres.` |
| VA-C25 | Erro max chars | `A justificativa deve ter no máximo 4000 caracteres.` |
| VA-C26 | Summary badge | `Ver e Agir` |
| VA-C27 | Summary labels | `Justificativa` / `Decidido por` / `Em` |
| VA-C28 | Hint pós-decisão | `Aguardando correção` |
| VA-C29 | Conflict title | `Esta ocorrência já foi atualizada` |
| VA-C30 | Conflict body | `Atualize para ver o estado atual antes de continuar.` |
| VA-C31 | Conflict CTA | `Atualizar` |
| VA-C32 | Already decided | `Esta ocorrência já possui uma decisão registrada.` |
| VA-C33 | Offline | `Você está offline. Conecte-se para continuar.` |
| VA-C34 | Forbidden a11y | `Você não tem permissão para avaliar esta ocorrência.` |
| VA-C35 | Empty imediata | `—` |

**Proibido (2.4):** “Responsáveis notificados”, “alertas enviados”, “ciência”, CTAs “Corrigir” / “Liberar”.  
**Interdição Oficial:** fora da 2.4; habilitada na **2.5** conforme `INTERDICAO-OFICIAL-UI-SPEC.md` (não disabled para quem não tem permissão — ocultar).

---

# Acessibilidade

| Requisito | Spec |
|---|---|
| Seção | Heading `Avaliação` / `Decisão da liderança` |
| Banner | `role="status"`; não só cor (ícone info + texto) |
| CTAs | Labels explícitos; `accessibilityState.busy` no loading |
| Confirm dialogs | Foco trap; ESC/Cancelar; ação principal nomeada |
| Textarea | `label` associada; erro com `aria-invalid` + `aria-describedby` |
| Contador | Anunciar perto do limite (polite) |
| Conflict card | `role="alert"`; foco no botão Atualizar após erro |
| FORBIDDEN | Sem CTA; não deixar botão cinza clicável |
| Card Ver e Agir | Não usar só cor âmbar — título + subtítulo |
| Contraste | Texto justificativa e hint ≥ DS |
| Toque | CTA full-width ≥ 48px altura |
| Screen reader summary | `Decisão Ver e Agir. Justificativa: …. Decidido por … em …` |

---

# Adaptação Base44 → SafeStop

| Base44 | SafeStop 2.4 |
|---|---|
| Grid 2 cols (Ver e Agir + IO) | **1 coluna** — só Ver e Agir |
| Clique decide direto (merge) | **Start** separado + form em EM_AVALIACAO |
| Sem justificativa no trecho | Textarea 10–4000 obrigatória |
| Sem start explícito | Banner + `Iniciar avaliação` + confirm |
| Sem summary | `VerEAgirSummary` + “Aguardando correção” |
| Botão IO | **Oculto** |

---

# Tokens / componentes DS

| Uso | Token / componente |
|---|---|
| Banner PP | Information callout (`#2563EB` / token information) |
| CTA start / decide | Button `primary` `#F97316` full-width |
| Card Ver e Agir | Surface + border âmbar/warning |
| Badge summary | Badge status/decisão |
| Conflict | Warning/alert surface + Button secondary `Atualizar` |
| Dialogs | Dialog / AlertDialog |
| Labels seção | 12px uppercase tracking (FieldLabel) |

Ícones: `Info`, `GitBranch` (opcional no card), `AlertTriangle` (conflict), `Loader2`.

---

# Critérios de aceite

1. Ordem: Evidências → **Ver e Agir** → Timeline → Composer.
2. PP + `canStartEvaluation`: banner VA-C03 + CTA `Iniciar avaliação` + confirm VA-C06; RPC só start.
3. EM_AVALIACAO + `canRecordVerEAgir`: `evaluation-context-card` + `VerEAgirPanel` 1 col; justificativa 10–4000; CTA `Registrar Ver e Agir`; sem IO.
4. `VER_E_AGIR+`: `VerEAgirSummary` + hint `Aguardando correção`; sem CTA correção.
5. Dois CTAs distintos — nunca merge.
6. Sem botão IO (nem disabled).
7. Sem copy “Responsáveis notificados”.
8. `STATUS_MISMATCH` → conflict card + `Atualizar` (VA-16).
9. Loading impede duplo submit (VA-15).
10. `ALREADY_DECIDED` → info + summary após refresh.
11. `FORBIDDEN` → sem CTA.
12. Rascunho comentário opcional sem auto-submit (PO-9).
13. Timeline: “Avaliação iniciada” / “Decisão: Ver e Agir” (PO-20).
14. A11y: labels, dialogs, alert conflict, busy state.
15. Inline no detalhe (PO-19).

---

# Checklist MASTER / DoD

- [ ] Spec cobre VA-15 (loading)  
- [ ] Spec cobre VA-16 (conflict refresh)  
- [ ] StartEvaluationButton + confirm  
- [ ] VerEAgirPanel + evaluation-context-card  
- [ ] VerEAgirSummary + hint  
- [ ] Copy PT completa (VA-C01…C35)  
- [ ] Mobile-first + a11y  
- [ ] WEB/MOBILE sem ambiguidade  
- [ ] Sem alteração de código nesta entrega UIUX  

---

# Checklist implementação WEB / MOBILE

### PP
- [ ] Banner “Aguardando avaliação da liderança”  
- [ ] StartEvaluationButton full-width  
- [ ] Confirm dialog VA-C06  
- [ ] Loading / idempotência / conflict  

### EM_AVALIACAO
- [ ] evaluation-context-card read-only  
- [ ] VerEAgirPanel 1 coluna (sem IO)  
- [ ] Textarea 10–4000 + contador  
- [ ] CTA Registrar Ver e Agir  
- [ ] Confirm decide  
- [ ] Link rascunho comentário (opc.)  

### VER_E_AGIR+
- [ ] VerEAgirSummary  
- [ ] Hint Aguardando correção  
- [ ] Sem form/start/correção  

### Transversal
- [ ] Ordem seções  
- [ ] Conflict card + Atualizar  
- [ ] FORBIDDEN sem CTA  
- [ ] Offline disabled  
- [ ] Invalidação query pós-mutation  
- [ ] A11y  

### Fora de escopo
- [ ] Interdição Oficial  
- [ ] Notificações / ciência  
- [ ] Correção / liberação / reabrir  
- [ ] Merge start+decide  
- [ ] Optimistic updates obrigatórios  

---

## Riscos

| Risco | Mitigação |
|---|---|
| Usuário espera IO (Base44) | Ocultar; um card só |
| Confunde comentário com decisão | CTA formal separado; rascunho explícito |
| Duplo toque | Loading VA-15 + conflict VA-16 |
| Badge decisão vs status header | Ambos “Ver e Agir”; summary deixa claro que é decisão |

---

## Hand-off

| De | Para |
|---|---|
| UIUX (este doc) | MASTER revisão |
| Entrada | G0 + draft RPC |
| Saída | Spec aprovada → WEB ∥ MOBILE (`features/ver-e-agir/` no detalhe) |
| QA | VA-01…VA-18 |

```text
UIUX — VER-E-AGIR-UI-SPEC.md
Sprint 2.4
Data: 2026-08-02
Status: PRONTO PARA REVISÃO MASTER → WEB ∥ MOBILE
DoD: spec completa; VA-15/VA-16; sem alteração de código
```
