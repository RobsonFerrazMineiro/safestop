# Spec UI/UX — Interdição Oficial (Sprint 2.5)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 2.5 — Interdição Oficial (até `INTERDICAO_CONFIRMADA`)  
**Agente:** UIUX  
**Data:** 2026-08-02  
**Entregável:** `docs/decisions/INTERDICAO-OFICIAL-UI-SPEC.md`

**PO (fonte oficial):** [`INTERDICAO-OFICIAL-DECISIONS.md`](./INTERDICAO-OFICIAL-DECISIONS.md) — PO-IO-1…PO-IO-12; Gate G0.

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/decisions/INTERDICAO-OFICIAL-DECISIONS.md` | Ramo paralelo, RBAC, RPC, timeline |
| `docs/decisions/VER-E-AGIR-UI-SPEC.md` | Start PP; card VA irmão; context compartilhado |
| `docs/design-system.md` | Destructive, Dialog, Banner, Badge |
| `reference/base44/.../InterdictionDatail.jsx` | Grid 2 cols VA/IO; `OfficialInterdictionCard` pós-IO |

Base44 = composição. PO prevalece. **Sem alteração de código nesta entrega UIUX.**

---

## Objetivo

Spec completa para WEB/MOBILE: ramo **Interdição Oficial** irmão de Ver e Agir em `EM_AVALIACAO`, até summary em `INTERDICAO_CONFIRMADA` — sem MDHO CTA, sem notificações, sem correção/liberação.

---

## Terminologia

| Termo UI | Significado |
|---|---|
| **Decisão da Liderança** | Título da seção com formulários ativos (PO-IO-3) |
| **Decisão** | Título da seção pós-decisão (summary) |
| **Interdição Oficial** | Decisão `INTERDICAO_OFICIAL` + card/badge/CTA |
| **`INTERDICAO_CONFIRMADA`** | Status resultante (não existe status `INTERDIÇÃO_OFICIAL`) |
| **Justificativa técnica** | Label do campo IO (≠ “Justificativa” do VA) — PO-IO-9 |
| **Interdição Oficial confirmada** | Título timeline (PO-IO-11) |

**Inviolável:** IO **não** parte de `VER_E_AGIR`. Só de `EM_AVALIACAO`.

---

## Hierarquia de cores (obrigatória)

| Contexto | Tratamento visual |
|---|---|
| `PARALISACAO_PREVENTIVA` (seção Avaliação / start) | **Neutro** — surface + primary CTA laranja |
| `EM_AVALIACAO` — seção pendente | **Âmbar** — label/borda da seção “Decisão da Liderança” |
| Card **Ver e Agir** (2.4) | **Âmbar** / warning (`amber-*` DS) |
| Card **Interdição Oficial** | **Vermelho destructive** (`#DC2626` / tint red-50 + border red) |
| Badge / header `INTERDICAO_CONFIRMADA` | **Vermelho persistente** — `red-600` (badge + banner) |
| Summary IO | Badge + acentos destructive; body texto foreground normal |

Cor **nunca** é o único indicador: sempre título + ícone (`Lock` no IO; `GitBranch` no VA).

---

## Princípios invioláveis

| Regra | Aplicação |
|---|---|
| Ramo paralelo | VA e IO na mesma seção; uma decisão vigente (PO-IO-4 / PO-IO-10) |
| Permissão distinta | IO = `occurrence.confirm_interdiction`; VA = `occurrence.evaluate` |
| Fiscal | Só card VA — IO **oculto** (nunca disabled) — PO-IO-8 |
| Supervisor / Liderança HSE | Ambos cards se `EM_AVALIACAO && !hasDecision` |
| Após decisão | Só **summary do ramo escolhido** — ocultar ambos forms |
| Dialog IO | Destrutivo dedicado — **não** unificar com dialog VA (PO-IO-12) |
| Server authority | Só RPC `record_occurrence_decision` — sem UPDATE status no cliente |
| Sem MDHO CTA | Hint informativo apenas (PO-IO-2) |
| Sem notificados | Nenhuma copy de responsáveis/alertas |
| Feature folder | `features/interdicao-oficial/` (PO-IO-6) |

---

## Ordem vertical do detalhe

```text
1. Header — código + status badge (+ badge IO se INTERDICAO_CONFIRMADA)
2. Banner topo — "Atividade formalmente interditada" (só se IO confirmada)
3. Grid info / condição
4. Evidências — EvidenceSection 2.2
5. Decisão da Liderança / Decisão — composição 2.4 + 2.5
     PP:                    StartEvaluationButton (2.4)
     EM_AVALIACAO:          evaluation-context-card
                            + grid dual / stack: VerEAgirPanel | InterdicaoDecisionCard
     VER_E_AGIR:            VerEAgirSummary only
     INTERDICAO_CONFIRMADA: InterdicaoSummary only
6. Linha do Tempo
7. Carregar mais
8. CommentComposer
```

---

## Guards UI

```text
canConfirmInterdiction =
  can("occurrence.confirm_interdiction") &&
  !isPlatformAdmin &&
  status === "EM_AVALIACAO" &&
  !hasDecision

canRecordVerEAgir =
  can("occurrence.evaluate") &&
  !isPlatformAdmin &&
  status === "EM_AVALIACAO" &&
  !hasDecision

hasDecision =
  decision != null
  || decisionType ∈ { VER_E_AGIR, INTERDICAO_OFICIAL }
```

| Papel | VA card | IO card | Pós-decisão |
|---|---|---|---|
| Fiscal (`evaluate` only) | Sim | **Oculto** | Summary do ramo (só VA possível via evaluate) |
| Supervisor / Liderança HSE | Sim | Sim | Summary do ramo escolhido |
| Sem evaluate / confirm | Não | Não | Summary read-only se existir |
| Platform Admin | Não | Não | Read-only |

---

## Componentes

| Componente | Pasta / papel |
|---|---|
| `InterdicaoDecisionCard` | `features/interdicao-oficial/` — form IO |
| `InterdicaoConfirmDialog` | Dialog destrutivo PO-IO-12 |
| `InterdicaoSummary` | Pós `INTERDICAO_CONFIRMADA` (≈ Base44 OfficialInterdictionCard) |
| `InterdicaoBanner` | Banner topo pós-IO |
| `evaluation-context-card` | Compartilhado com 2.4 — não duplicar lógica |
| `VerEAgirPanel` / `VerEAgirSummary` | Permanecem em `ver-e-agir/` |

---

# IO-SECTION — Decisão da Liderança

| Status | Título seção | Conteúdo |
|---|---|---|
| `PARALISACAO_PREVENTIVA` | `Avaliação` (2.4) | Start — sem cards VA/IO |
| `EM_AVALIACAO` && !hasDecision | **Decisão da Liderança** (âmbar) | Context + cards por permissão |
| `VER_E_AGIR` | **Decisão** | Só `VerEAgirSummary` |
| `INTERDICAO_CONFIRMADA` | **Decisão** | Banner + `InterdicaoSummary` |

Intro opcional (Base44): `Avalie a ocorrência e selecione uma das decisões abaixo:` — só se ≥1 card visível.

---

# Layout — grid dual / stack (PO-IO-4)

### Web ≥ `md`

```text
┌─ DECISÃO DA LIDERANÇA (âmbar) ─────────────────────────┐
│ evaluation-context-card (read-only)                    │
│                                                        │
│ ┌─ VA (âmbar) ──────────┐  ┌─ IO (vermelho) ─────────┐ │
│ │ Ver e Agir            │  │ 🔒 Interdição Oficial   │ │
│ │ Resolução imediata…   │  │ Manter formalmente…     │ │
│ │ Justificativa *       │  │ Justificativa técnica * │ │
│ │ [textarea]            │  │ [textarea]              │ │
│ │ [ Registrar VA ]      │  │ [ Confirmar interdição ]│ │
│ └───────────────────────┘  └─────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

- `grid-cols-2 gap-3` (Base44).
- Se só um card (Fiscal): **1 coluna** full-width — não deixar célula vazia IO.

### Mobile (`< md`) — stack

```text
┌─ DECISÃO DA LIDERANÇA ───────────────┐
│ (contexto)                           │
│ ┌─ Ver e Agir (âmbar) ─────────────┐ │  se canRecordVerEAgir
│ └──────────────────────────────────┘ │
│ ┌─ Interdição Oficial (vermelho) ──┐ │  se canConfirmInterdiction
│ │ 🔒 …                             │ │
│ │ [ Confirmar interdição ]         │ │  destructive full-width
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

Ordem stack: **VA primeiro**, IO abaixo (fluxo menos destrutivo no topo).

Cada card mantém **seu próprio** textarea (não compartilhar estado entre VA e IO).

---

# InterdicaoDecisionCard

| Item | Spec |
|---|---|
| Visual | Tint destructive / red-50 + border red; ícone `Lock` |
| Título | `Interdição Oficial` (IO-C03) |
| Subtítulo | `Manter atividade formalmente interditada` (IO-C04) |
| Label | `Justificativa técnica` (IO-C05) |
| Limites | 10–4000 trim (PO-IO-9) |
| Contador | `{n}/4000` + helper mínimo |
| Abrangência | Texto livre na justificativa — sem enum (PO-IO-1) |
| CTA | `Confirmar interdição` — **destructive** full-width |
| Loading | `Confirmando…` + disabled |
| RPC | `record_occurrence_decision({ occurrence_id, decision_type: "INTERDICAO_OFICIAL", decision_reason })` |
| Pré-submit | `InterdicaoConfirmDialog` **obrigatório** |

**Proibido:** IO disabled para Fiscal; partida de `VER_E_AGIR`; merge com VA num único submit.

---

# InterdicaoConfirmDialog (PO-IO-12)

```text
┌──────────────────────────────────────┐
│ Confirmar Interdição Oficial?        │  IO-C10
│                                      │
│ A atividade permanecerá formalmente  │  IO-C11
│ interditada. Esta decisão não pode   │
│ ser desfeita nesta etapa.            │
│                                      │
│ [ Cancelar ]  [ Confirmar interdição ]│  destructive
└──────────────────────────────────────┘
```

| Prop | Valor |
|---|---|
| Estilo ação | Destructive vermelho + ícone `Lock` opcional |
| Cancelar | Fecha; sem mutation |
| Confirmar | Dispara RPC; busy no botão |
| Unificar com VA | **Não** |

---

# InterdicaoSummary + Banner (pós `INTERDICAO_CONFIRMADA`)

### Banner topo (logo abaixo do header / breadcrumb)

```text
┌──────────────────────────────────────┐
│ ⚠  Atividade formalmente interditada │  IO-C01 banner — red-600
└──────────────────────────────────────┘
```

- Persistente enquanto status = `INTERDICAO_CONFIRMADA` (e enquanto produto não avançar MDHO).
- `role="status"`; ícone + texto.

### Summary (adaptação OfficialInterdictionCard)

```text
┌──────────────────────────────────────┐
│ DECISÃO                              │
│                                      │
│ [ Interdição Oficial ]               │  badge red-600
│                                      │
│ Justificativa técnica                │
│ {decision_reason}  plain escaped     │
│                                      │
│ Decidido por   Nome                  │
│ Em             dd/mm/aaaa HH:mm      │
│                                      │
│ Próximas etapas (MDHO) em versão     │  hint — SEM CTA
│ futura.                              │
└──────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| Modo | Read-only |
| Badge | `Interdição Oficial` — **red-600** persistente |
| Header status | Label oficial `Interdição Oficial` / `INTERDICAO_CONFIRMADA` formatada |
| Hint MDHO | IO-C08 — informativo; **zero** botão MDHO/IMS |
| Forms VA/IO | Ocultos |
| VerEAgirSummary | Não exibir |

---

# Estados transversais

## Loading

| Contexto | UI |
|---|---|
| Submit IO | CTA + dialog confirm `busy`; anti double-tap |
| Detail fetch | Skeleton seção Decisão (2 cards ou 1) |
| Refresh conflict | Spinner no `Atualizar` |

## Forbidden (ocultar)

- Sem `confirm_interdiction` → **não renderizar** `InterdicaoDecisionCard`.
- Nunca botão cinza/disabled “Interdição Oficial”.
- A11y opcional sr-only: IO-C12.

## Conflict (`STATUS_MISMATCH`)

```text
Esta ocorrência já foi atualizada
Atualize para ver o estado atual antes de continuar.
[ Atualizar ]
```

Refetch detail + decision + timeline; limpar forms se status mudou.

## Already decided (`ALREADY_DECIDED`)

```text
Esta ocorrência já possui uma decisão registrada.
[ Atualizar ]
```

→ Summary do ramo vigente (VA ou IO). Forms ocultos.

## Offline

```text
Você está offline. Conecte-se para continuar.
```

CTAs disabled; sem fila offline de decisão.

---

# Timeline (PO-IO-11)

| Transição | Título UI |
|---|---|
| EM_AVALIACAO → INTERDICAO_CONFIRMADA | `Interdição Oficial confirmada` |

Kind: `STATUS_CHANGED` enriquecido. Metadata: `decisionType`, `decisionReason` (~200), `decisionId`, `decidedByName`.

---

# Copy PT — catálogo IO-C01…IO-C12 (contrato mínimo)

| ID | Contexto | Texto |
|---|---|---|
| **IO-C01** | Banner pós-IO | `Atividade formalmente interditada` |
| **IO-C02** | Seção form | `Decisão da Liderança` |
| **IO-C03** | Card título | `Interdição Oficial` |
| **IO-C04** | Card subtítulo | `Manter atividade formalmente interditada` |
| **IO-C05** | Label campo | `Justificativa técnica` |
| **IO-C06** | CTA card / dialog action | `Confirmar interdição` |
| **IO-C07** | Dialog título | `Confirmar Interdição Oficial?` |
| **IO-C08** | Hint MDHO | `Próximas etapas (MDHO) em versão futura.` |
| **IO-C09** | Conflict | `Esta ocorrência já foi atualizada` |
| **IO-C10** | Already decided | `Esta ocorrência já possui uma decisão registrada.` |
| **IO-C11** | Offline | `Você está offline. Conecte-se para continuar.` |
| **IO-C12** | Forbidden a11y | `Você não tem permissão para confirmar Interdição Oficial.` |

### Copy complementar (implementação)

| ID | Texto |
|---|---|
| IO-C13 | Seção summary: `Decisão` |
| IO-C14 | Dialog corpo: `A atividade permanecerá formalmente interditada. Esta decisão não pode ser desfeita nesta etapa.` |
| IO-C15 | Cancelar |
| IO-C16 | Loading: `Confirmando…` |
| IO-C17 | Helper: `Mínimo 10 caracteres` / contador `{n}/4000` |
| IO-C18 | Erro min: `Informe uma justificativa técnica com pelo menos 10 caracteres.` |
| IO-C19 | Erro max: `A justificativa técnica deve ter no máximo 4000 caracteres.` |
| IO-C20 | Conflict body: `Atualize para ver o estado atual antes de continuar.` |
| IO-C21 | Conflict CTA: `Atualizar` |
| IO-C22 | Summary labels: `Justificativa técnica` / `Decidido por` / `Em` |
| IO-C23 | Badge summary: `Interdição Oficial` |
| IO-C24 | Timeline: `Interdição Oficial confirmada` |
| IO-C25 | Intro seção (opc.): `Avalie a ocorrência e selecione uma das decisões abaixo:` |

**Proibido:** “Responsáveis notificados”; CTAs MDHO/IMS/Corrigir/Liberar; copy sugerindo IO a partir de Ver e Agir.

---

# Acessibilidade

| Requisito | Spec |
|---|---|
| Seção | Heading `Decisão da Liderança` / `Decisão` |
| Cards | Nome acessível inclui tipo de decisão |
| IO card | Não só vermelho — `Lock` + título |
| Textareas | Labels distintas (Justificativa vs Justificativa técnica) |
| Dialog | Foco trap; ESC = Cancelar; ação destrutiva anunciada |
| Banner | `role="status"` |
| Conflict | `role="alert"` |
| Forbidden | Card ausente — sem controle disabled enganoso |
| Toque | CTA ≥ 48px; full-width mobile |
| Contraste | Texto em tint red sobre surface legível (DS) |

---

# Adaptação Base44 → SafeStop

| Base44 | SafeStop 2.5 |
|---|---|
| Grid 2 botões clique imediato | Cards com textarea + permissão + RPC |
| IO sempre visível | Fiscal: IO oculto |
| Sem dialog destrutivo dedicado | `InterdicaoConfirmDialog` obrigatório |
| `OfficialInterdictionCard` | `InterdicaoSummary` + banner + hint MDHO |
| UPDATE client possível | **Somente** RPC |
| Sem mutualidade clara | `hasDecision` oculta ambos forms |

---

# Tokens DS

| Uso | Token |
|---|---|
| Seção EM_AVALIACAO | Âmbar / warning |
| Card VA | Âmbar (2.4) |
| Card IO / CTA / dialog | `destructive` `#DC2626` |
| Badge / banner IO | `red-600` |
| Ícone IO | `Lock` |
| Campo | Textarea + contador |

---

# Critérios de aceite

1. Seção **Decisão da Liderança** em EM_AVALIACAO (PO-IO-3); pós-decisão **Decisão**.
2. Grid dual web ≥ `md`; stack mobile (PO-IO-4); VA primeiro no stack.
3. Card IO vermelho + CTA destrutivo + dialog PO-IO-12.
4. Fiscal: só VA; Supervisor: ambos se `EM_AVALIACAO && !hasDecision`.
5. Após decisão: só summary do ramo escolhido.
6. `INTERDICAO_CONFIRMADA`: banner IO-C01 + `InterdicaoSummary` badge red-600 + hint IO-C08 sem CTA.
7. Hierarquia de cores conforme tabela.
8. Estados: loading, forbidden (ocultar), conflict IO-C09, offline IO-C11, already decided IO-C10.
9. Copy mínima IO-C01…IO-C12 presente.
10. Timeline: `Interdição Oficial confirmada`.
11. Feature `interdicao-oficial/`; regressão VA intacta.
12. Sem MDHO/IMS/notificações/correção/liberação.

---

# Checklist WEB / MOBILE

### EM_AVALIACAO
- [ ] Título Decisão da Liderança (âmbar)
- [ ] Context card compartilhado
- [ ] Grid 2 cols ≥ md; stack mobile
- [ ] VA âmbar + IO vermelho
- [ ] Fiscal: IO oculto
- [ ] Supervisor: ambos
- [ ] Justificativa técnica 10–4000
- [ ] Dialog destrutivo IO-C07 / IO-C14 / IO-C06
- [ ] Loading / conflict / offline

### INTERDICAO_CONFIRMADA
- [ ] Banner IO-C01
- [ ] InterdicaoSummary + badge red-600
- [ ] Hint MDHO sem CTA
- [ ] Forms ocultos; sem VerEAgirSummary

### Transversal
- [ ] hasDecision mutualidade
- [ ] Não parte de VER_E_AGIR
- [ ] Invalidação caches
- [ ] A11y
- [ ] Copy IO-C01…IO-C12

### Fora de escopo
- [ ] MDHO / IMS / notificações
- [ ] Correção / liberação / cancelamento
- [ ] Entidade IO nova
- [ ] Refactor `occurrence-evaluation/`

---

## Riscos

| Risco | Mitigação |
|---|---|
| Fiscal vê IO disabled | Ocultar card |
| Usuário preenche VA e IO juntos | Textareas independentes; primeira RPC vence; conflict no perdedor |
| Confunde status vs decisão | Badge “Interdição Oficial” + status formatado |
| Espera MDHO imediato | Hint IO-C08 sem CTA |

---

## Hand-off

| De | Para |
|---|---|
| UIUX (este doc) | MASTER → WEB ∥ MOBILE |
| WEB/MOBILE | `features/interdicao-oficial/` + composição detalhe PP |
| QA | IO-01…IO-12; regressão VA |

```text
UIUX — INTERDICAO-OFICIAL-UI-SPEC.md
Sprint 2.5
Data: 2026-08-02
Status: PRONTO PARA REVISÃO MASTER → WEB ∥ MOBILE
DoD: spec completa; IO-C01…IO-C12; sem alteração de código
```
