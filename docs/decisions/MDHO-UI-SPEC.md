# Spec UI/UX — Avaliação Técnica MDHO (Sprint 2.6)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 2.6 — MDHO (até `AGUARDANDO_REGISTRO_IMS`)  
**Agente:** UIUX  
**Data:** 2026-08-02  
**Entregável:** `docs/decisions/MDHO-UI-SPEC.md`

**PO (fonte oficial):** [`MDHO-DECISIONS.md`](./MDHO-DECISIONS.md) — PO-MDHO-1…PO-MDHO-28; Gate G0.

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/decisions/MDHO-DECISIONS.md` | RPCs, RBAC, validações, timeline |
| `docs/decisions/INTERDICAO-OFICIAL-UI-SPEC.md` | IO Summary acima; substituir hint “MDHO futuro” |
| `docs/database.md` §14.2–14.3 | 5 categorias + opções |
| `docs/workflow.md` §11 | Fill / submit / approve / return |
| `docs/design-system.md` | Stepper, Checkbox, Radio, Dialog, Banner |
| `packages/types/src/mdho-catalog.ts` | Códigos oficiais |
| `reference/base44/.../InterdictionDatail.jsx` | UX pós-IO — **não** modelo de dados |

Base44 = composição. PO prevalece. **Sem alteração de código nesta entrega UIUX.**

---

## Objetivo

Spec completa para WEB/MOBILE implementarem **sem ambiguidade** o fluxo MDHO **somente no ramo IO**:

1. `MdhoStartCard` → iniciar  
2. Stepper 5 categorias + complemento → rascunho / enviar (Supervisor)  
3. `MdhoReviewPanel` → aprovar / devolver (Liderança)  
4. `MdhoSummary` → pós-APPROVED + hint IMS (sem CTA)

---

## Terminologia

| Termo UI | Significado |
|---|---|
| **Avaliação Técnica (MDHO)** | Rótulo principal (PO-MDHO-1) |
| **MDHO** | Sigla — só via glossário; **não** inventar expansão |
| **Salvar rascunho** | `save_mdho_draft` — sem evento timeline |
| **Enviar MDHO** | `submit_mdho_assessment` — **só Supervisor** |
| **Aprovar MDHO** / **Devolver MDHO** | Liderança HSE (PO-MDHO-20) |
| **Complemento** | Texto opcional do assessment ≠ comentário timeline |

**Inviolável:** MDHO **proibido** em Ver e Agir. Comentário **não** substitui o form.

---

## Hierarquia de cores (distinto do IO)

| Contexto | Tratamento |
|---|---|
| Interdição Oficial (2.5) | Vermelho destructive / `red-600` |
| **Seção MDHO** | **Azul informação / neutro técnico** — token `information` `#2563EB` + surfaces cinza |
| Stepper ativo | Azul/primary info — **não** laranja primary de ação PP, **não** vermelho IO |
| Banner devolução | Âmbar/warning |
| Badge APPROVED / summary | Verde success suave **ou** azul info — preferir **success** `#16A34A` para “Aprovado” |
| CTAs Salvar | Secondary / outline neutro |
| CTA Enviar | Primary **azul técnico** ou primary produto — **evitar** vermelho |
| CTA Devolver | Destructive ou secondary + dialog |
| CTA Aprovar | Primary (não destructive) |

MDHO deve **parecer análise técnica**, não “nova interdição”.

---

## Princípios invioláveis

| Regra | Aplicação |
|---|---|
| IO-only | Seção ausente se `decision_type ≠ INTERDICAO_OFICIAL` |
| Start explícito | `MdhoStartCard` — não auto-start na RPC IO (PO-MDHO-4) |
| Dois atores | Supervisor: fill + **Enviar**; Liderança: fill + approve/return, **Enviar oculto** (PO-MDHO-27) |
| Draft sem timeline | Autosave/rascunho não gera evento (PO-MDHO-10) |
| Server RPCs | 5 RPCs — sem UPDATE status no cliente |
| Offline | Mutations bloqueadas (PO-MDHO-25) |
| Inline | Detalhe ocorrência; rota `/mdho` opcional futura (PO-MDHO-9) |

---

## Ordem no detalhe (PO)

```text
1. Header + badges
2. Banner IO (se INTERDICAO_CONFIRMADA / pós-IO)
3. Info / condição
4. Evidências — EvidenceSection 2.2
5. Decisão da Liderança — VA + IO (2.4/2.5)
6. InterdicaoSummary — se IO confirmada
7. Avaliação Técnica (MDHO) — Sprint 2.6   ← este spec
8. Linha do Tempo
9. Carregar mais
10. CommentComposer
```

Quando a seção MDHO existir, **remover** do InterdicaoSummary o hint “Próximas etapas (MDHO) em versão futura”.

---

## Guards UI

```text
canStartMdho =
  decisionType === "INTERDICAO_OFICIAL" &&
  status === "INTERDICAO_CONFIRMADA" &&
  !hasMdhoAssessment &&
  can("mdho.fill") && !isPlatformAdmin

canEditMdho =
  can("mdho.fill") && !isPlatformAdmin &&
  assessment.status ∈ { DRAFT, RETURNED }

canSubmitMdho =
  can("mdho.submit") && !isPlatformAdmin &&
  assessment.status ∈ { DRAFT, RETURNED }
  // Liderança: false → Enviar OCULTO

canApproveMdho =
  can("mdho.approve") && !isPlatformAdmin &&
  assessment.status === "SUBMITTED"

canReturnMdho =
  can("mdho.return") && !isPlatformAdmin &&
  assessment.status === "SUBMITTED"
```

| Papel | Start/Fill | Enviar | Aprovar/Devolver |
|---|---|---|---|
| Supervisor HSE | Sim | **Sim** | Não |
| Liderança HSE | Sim | **Oculto** | Sim (SUBMITTED) |
| Fiscal / Campo / Gestor | Não | Não | Não (read-only) |

---

## Componentes

| Componente | Responsabilidade |
|---|---|
| `MdhoStartCard` | CTA start em `INTERDICAO_CONFIRMADA` |
| `MdhoStepper` / `MdhoForm` | 5 categorias + OTHER detail + complemento |
| `MdhoDraftBar` | Sticky footer: Salvar / Enviar |
| `MdhoSubmitDialog` | Confirm antes do submit |
| `MdhoReviewPanel` | Read-only SUBMITTED + Aprovar/Devolver |
| `MdhoReturnDialog` | Motivo devolução 10–4000 |
| `MdhoSummary` | APPROVED + hint IMS |
| `MdhoReturnedBanner` | Motivo ao reabrir RETURNED |

Feature folder: `features/mdho/`.

---

# MdhoStartCard — `INTERDICAO_CONFIRMADA`

```text
┌──────────────────────────────────────┐
│ AVALIAÇÃO TÉCNICA (MDHO)             │  azul/neutro
│                                      │
│ A Interdição Oficial está confirmada.│
│ Inicie a Avaliação Técnica (MDHO)    │
│ para registrar a análise estruturada.│
│                                      │
│ [ Iniciar Avaliação Técnica (MDHO) ] │  full-width
└──────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| Visível | Só `canStartMdho` |
| CTA | MDHO-C04 |
| RPC | `start_mdho_assessment(occurrence_id)` |
| Loading | `Iniciando…` + anti double-tap |
| Sucesso | Abre form DRAFT |
| `ALREADY_EXISTS` | Abrir assessment existente |
| Sem `mdho.fill` | Card ausente (forbidden ocultar) |

---

# MdhoForm / Stepper — 5 categorias

### Ordem fixa

| # | `code` | Label UI | Controle |
|---|---|---|---|
| 1 | `BEHAVIOR` | Comportamento | Checkbox múltipla |
| 2 | `DEVIATION_TYPE` | Tipo de Desvio | **Radio** — exatamente 1 (`ERROR` / `VIOLATION`) |
| 3 | `PRECONDITIONS` | Pré-condições | Checkbox múltipla |
| 4 | `ORGANIZATIONAL_ISSUES` | Questões Organizacionais | Checkbox múltipla |
| 5 | `SUPERVISION_INSPECTION` | Supervisão/Fiscalização | Checkbox múltipla |

Labels de opções: do catálogo seed (`label`).

### OTHER — detail inline

Quando opção `code === OTHER` e `allowsDetail`:

```text
□ Outro
  ┌──────────────────────────────────┐
  │ Descreva…                        │  min 10 se marcado
  └──────────────────────────────────┘
  Mínimo 10 caracteres
```

Detail **inline sob a opção** — não em modal separado.

### Complemento (após as 5 categorias)

| Item | Spec |
|---|---|
| Label | `Complemento da avaliação` |
| Obrigatório | **Não** (PO-MDHO-14) |
| Max | **4000** |
| Posição | Final do form / passo 6 lógico |

### Validação submit (PO-MDHO-14) — inline

| Regra | Copy erro |
|---|---|
| Categoria `requires_selection` sem opção | MDHO-C17 |
| `DEVIATION_TYPE` ≠ 1 | MDHO-C18 |
| OTHER sem detail ≥10 | MDHO-C19 |
| Complemento > 4000 | Truncar bloqueio client |

Após submit inválido: ir ao **primeiro** erro (step/scroll).

### RETURNED

Banner âmbar: `MDHO devolvido — corrija e reenvie.` + exibir `return_reason` read-only.

---

# Mobile — layout e footer

### Opção A (preferida) — stepper full-screen

```text
┌──────────────────────────────────────┐
│ ← Passo 2 de 5 · Tipo de Desvio       │
│ ○ ○ ● ○ ○                            │
│ … opções …                           │
│                                      │
│ [padding para footer]                │
├──────────────────────────────────────┤
│ [ Salvar rascunho ] [ Enviar MDHO ]  │  sticky + Safe Area
│         KeyboardAvoidingView         │  Enviar só canSubmit
└──────────────────────────────────────┘
```

- `Voltar` / `Próximo` no header ou acima do footer.
- Enviar pode ficar só no **último passo** + sempre acessível no footer se validação global.

### Opção B — seções colapsáveis (accordion)

Uma tela com 5 accordions + complemento; mesma sticky footer.

**Web:** seções empilhadas ou nav lateral de categorias (mesmo contrato de campos).

### Sticky footer

| Botão | Visível quando | Variante |
|---|---|---|
| `Salvar rascunho` | `canEditMdho` | Secondary |
| `Enviar MDHO` | `canSubmitMdho` | Primary azul/técnico |

Liderança: **apenas** Salvar rascunho no footer (Enviar oculto).

KeyboardAvoidingView (RN) obrigatório no mobile.

---

# Salvar rascunho / Enviar

### Salvar rascunho

| Item | Spec |
|---|---|
| RPC | `save_mdho_draft` |
| Feedback | Toast/inline `Rascunho salvo` |
| Timeline | **Não** |
| Offline | Disabled + MDHO-C16 |

### Enviar MDHO (Supervisor)

Dialog obrigatório:

```text
Enviar Avaliação Técnica (MDHO)?

Após o envio, a edição só será possível
se a liderança devolver.

[ Cancelar ]     [ Enviar MDHO ]
```

RPC: `submit_mdho_assessment(assessment_id)`.  
Liderança: botão **ausente** (não disabled).

---

# MdhoReviewPanel — `SUBMITTED` / `AGUARDANDO_APROVACAO_HSE`

```text
┌──────────────────────────────────────┐
│ AVALIAÇÃO TÉCNICA (MDHO)             │
│ Aguardando aprovação HSE             │
│                                      │
│ Comportamento: …                     │  read-only
│ Tipo de Desvio: Erro / Violação      │
│ … demais categorias …                │
│ Complemento: …                       │
│ Enviado por / em                     │
│                                      │
│ [ Devolver MDHO ]  [ Aprovar MDHO ]  │  só Liderança
└──────────────────────────────────────┘
```

| Quem | UI |
|---|---|
| Liderança | Review + CTAs |
| Supervisor / outros | Review **read-only** — sem Aprovar/Devolver |
| Fill | Bloqueado (PO-MDHO-11) |

### Aprovar

Dialog: `Aprovar Avaliação Técnica (MDHO)?` / `A avaliação ficará imutável.` → `approve_mdho_assessment`.

### Devolver

Dialog + textarea `Motivo da devolução` (10–4000) → `return_mdho_assessment`.

---

# MdhoSummary — `APPROVED` / `AGUARDANDO_REGISTRO_IMS`

```text
┌──────────────────────────────────────┐
│ AVALIAÇÃO TÉCNICA (MDHO)             │
│ [ Aprovado ]                         │  success
│                                      │
│ Resumo 5 categorias (read-only)      │
│ Aprovado por / em                    │
│                                      │
│ Aguardando registro da referência IMS│  hint — SEM CTA
└──────────────────────────────────────┘
```

Sem editar; sem reabrir (PO-MDHO-12). Sem botão IMS.

---

# Estados transversais

| Estado | UI |
|---|---|
| **Loading** | Skeleton seção; CTAs `busy` |
| **Forbidden** | Seção/CTAs **ocultos** (não disabled enganoso) |
| **Conflict** | MDHO-C15 + `Atualizar` → refetch |
| **Offline** | CTAs disabled; MDHO-C16 |
| **Validation inline** | Erro sob categoria/OTHER; scroll ao primeiro |
| **VA branch** | Seção MDHO **não renderiza** |

---

# Timeline (PO-MDHO-26)

| Evento | Título |
|---|---|
| start | `MDHO iniciado` |
| submit | `MDHO enviado` |
| approve | `MDHO aprovado` |
| return | `MDHO devolvido` |

Kind: `STATUS_CHANGED`. Autosave **não** aparece.

---

# Copy PT — MDHO-C01…C20 (contrato mínimo)

| ID | Contexto | Texto |
|---|---|---|
| **MDHO-C01** | Seção | `Avaliação Técnica (MDHO)` |
| **MDHO-C02** | CTA start | `Iniciar Avaliação Técnica (MDHO)` |
| **MDHO-C03** | Step | `Passo {n} de 5` |
| **MDHO-C04** | Cat. 1 | `Comportamento` |
| **MDHO-C05** | Cat. 2 | `Tipo de Desvio` |
| **MDHO-C06** | Cat. 3 | `Pré-condições` |
| **MDHO-C07** | Cat. 4 | `Questões Organizacionais` |
| **MDHO-C08** | Cat. 5 | `Supervisão/Fiscalização` |
| **MDHO-C09** | Complemento | `Complemento da avaliação` |
| **MDHO-C10** | CTA draft | `Salvar rascunho` |
| **MDHO-C11** | CTA submit | `Enviar MDHO` |
| **MDHO-C12** | Dialog submit | `Enviar Avaliação Técnica (MDHO)?` |
| **MDHO-C13** | CTA approve | `Aprovar MDHO` |
| **MDHO-C14** | CTA return | `Devolver MDHO` |
| **MDHO-C15** | Conflict | `Esta avaliação foi atualizada. Atualize para continuar.` |
| **MDHO-C16** | Offline | `Conecte-se para continuar a Avaliação Técnica (MDHO)` |
| **MDHO-C17** | Erro seleção | `Selecione ao menos uma opção nesta categoria.` |
| **MDHO-C18** | Erro desvio | `Selecione exatamente um tipo de desvio.` |
| **MDHO-C19** | Erro OTHER | `Descreva a opção Outro com pelo menos 10 caracteres.` |
| **MDHO-C20** | Hint IMS | `Aguardando registro da referência IMS` |

### Complementar (implementação)

| ID | Texto |
|---|---|
| MDHO-C21 | Label uppercase: `AVALIAÇÃO TÉCNICA (MDHO)` |
| MDHO-C22 | Intro start: `Inicie a Avaliação Técnica (MDHO) para registrar a análise estruturada.` |
| MDHO-C23 | Start loading: `Iniciando…` |
| MDHO-C24 | ERROR / VIOLATION: `Erro` / `Violação` |
| MDHO-C25 | OTHER label: `Descreva` · helper `Mínimo 10 caracteres` |
| MDHO-C26 | Complemento helper: `Opcional · máximo 4000 caracteres` |
| MDHO-C27 | Draft ok: `Rascunho salvo` |
| MDHO-C28 | Submit body: `Após o envio, a edição só será possível se a liderança devolver.` |
| MDHO-C29 | Approve dialog: `Aprovar Avaliação Técnica (MDHO)?` / `A avaliação ficará imutável.` |
| MDHO-C30 | Return reason: `Motivo da devolução` |
| MDHO-C31 | Return dialog: `Devolver Avaliação Técnica (MDHO)?` |
| MDHO-C32 | Banner RETURNED: `MDHO devolvido — corrija e reenvie.` |
| MDHO-C33 | Review status: `Aguardando aprovação HSE` |
| MDHO-C34 | Summary badge: `Aprovado` |
| MDHO-C35 | Conflict CTA: `Atualizar` |
| MDHO-C36 | Cancelar / Próximo / Voltar |
| MDHO-C37 | Forbidden a11y: `Você não tem permissão para esta ação no MDHO.` |
| MDHO-C38…41 | Timeline: iniciado / enviado / aprovado / devolvido |

**Proibido:** expansão inventada de MDHO; CTA IMS/plano/notificação; “Responsáveis notificados”.

---

# Acessibilidade

| Requisito | Spec |
|---|---|
| Seção | Heading `Avaliação Técnica (MDHO)` |
| Stepper | Anunciar `Passo n de 5` + nome categoria |
| Checkbox/Radio | Labels associadas; grupo com `radiogroup` / list |
| OTHER | `aria-required` no detail quando marcado |
| Erros | `aria-invalid` + describe; foco no primeiro erro |
| Footer sticky | Não cobrir conteúdo; Safe Area |
| Dialogs | Foco trap; ESC = Cancelar |
| Enviar oculto (Liderança) | Não deixar botão disabled — **omitir** |
| Contraste | Azul info + texto ≥ DS |
| Cor | Não só cor para estado (badge + label) |

---

# Adaptação Base44 → SafeStop

| Base44 | SafeStop 2.6 |
|---|---|
| `mdho_status` no client | Assessment + RPCs |
| Pós-IO implícito | `MdhoStartCard` explícito |
| Sem dualidade papéis | Supervisor vs Liderança (PO-MDHO-27) |
| Sem stepper | 5 categorias + OTHER inline + complemento |
| Vermelho IO | MDHO **azul/neutro** separado |

---

# Critérios de aceite

1. Ordem: Evidências → Decisão → IO Summary → **MDHO** → Timeline → Composer.
2. Seção ausente em Ver e Agir.
3. `MdhoStartCard` só em `INTERDICAO_CONFIRMADA` + `mdho.fill`.
4. Stepper/seções: 5 categorias; radio desvio; OTHER detail ≥10; complemento opcional.
5. Sticky footer mobile: Salvar + Enviar (Enviar só Supervisor) + KAV.
6. Dialog confirm submit.
7. `MdhoReviewPanel` + Aprovar/Devolver (Liderança); Supervisor read-only no review.
8. `MdhoSummary` + hint IMS (MDHO-C20) sem CTA.
9. Cores MDHO azul/neutro — distinto vermelho IO.
10. Estados: loading, forbidden ocultar, conflict, offline, validation inline.
11. Copy MDHO-C01…C20.
12. Timeline 4 títulos; draft sem evento.
13. Offline bloqueia mutations.

---

# Checklist WEB / MOBILE

### Form
- [ ] MdhoStartCard  
- [ ] 5 categorias + OTHER inline  
- [ ] Complemento final  
- [ ] Salvar rascunho  
- [ ] Enviar + dialog (só Supervisor)  
- [ ] Liderança: Enviar oculto  
- [ ] Mobile: stepper ou accordion + sticky footer + KAV  
- [ ] Banner RETURNED  

### Review / Summary
- [ ] MdhoReviewPanel  
- [ ] Aprovar / Devolver + dialogs  
- [ ] MdhoSummary + hint IMS  

### Transversal
- [ ] Ordem seções  
- [ ] Cores azul/neutro  
- [ ] Loading / forbidden / conflict / offline / validation  
- [ ] Timeline 4 títulos  
- [ ] Copy C01…C20  

### Fora de escopo
- [ ] IMS / plano / notificações  
- [ ] MDHO em VA  
- [ ] Expansão inventada da sigla  

---

## Hand-off

| De | Para |
|---|---|
| UIUX (este doc) | MASTER → WEB ∥ MOBILE |
| Implementação | `features/mdho/` no detalhe IO |
| QA | MDHO-01…MDHO-16 |

```text
UIUX — MDHO-UI-SPEC.md
Sprint 2.6
Data: 2026-08-02
Status: PRONTO PARA REVISÃO MASTER → WEB ∥ MOBILE
DoD: spec completa; MDHO-C01…C20; sem alteração de código
```
