# Spec UI/UX — Aprovação HSE (Sprint 2.7)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 2.7 — Aprovação HSE (incremental sobre MDHO 2.6)  
**Agente:** UIUX  
**Data:** 2026-08-02  
**Entregável:** `docs/decisions/HSE-APPROVAL-UI-SPEC.md`

**PO (fonte oficial):** [`HSE-APPROVAL-DECISIONS.md`](./HSE-APPROVAL-DECISIONS.md) — PO-HSE-1…PO-HSE-27; Gate G0.

**Herdado (não alterar regras):** [`MDHO-DECISIONS.md`](./MDHO-DECISIONS.md) · [`MDHO-UI-SPEC.md`](./MDHO-UI-SPEC.md) (MDHO-REVIEW, copy approve/return).

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/decisions/HSE-APPROVAL-DECISIONS.md` | Fila, segregação, autoaprovação, erros |
| `docs/decisions/MDHO-UI-SPEC.md` | Review 5 categorias; dialogs approve/return |
| `docs/design-system.md` | Etapa **Aprovação HSE** no fluxo oficial |
| `reference/base44/.../Interdiction.jsonc` | `mdho_status`: submitted / approved (UX) |

Base44 = composição. PO prevalece. **Sem código apps/packages/supabase nesta entrega.**

---

## Objetivo

Formalizar a fase **Aprovação HSE** para WEB/MOBILE sem ambiguidade:

1. **HSE-QUEUE** — fila operacional (Liderança)
2. **HSE-REVIEW** — painel read-only (5 categorias + metadados submit)
3. **HSE-ACTIONS** — dialogs Aprovar / Devolver (anti-acidente)
4. Estados empty / forbidden / offline / conflict
5. Pós-approve: hint IMS **sem CTA** (PO-HSE-13)

Facade: `features/hse-approval/` sobre services/hooks de `features/mdho/` — **sem duplicar** RPCs (PO-HSE-26/27).

---

## Terminologia

| Termo UI | Significado |
|---|---|
| **Aprovação HSE** | Fase do fluxo (design-system) — revisão do MDHO submetido |
| **Aprovar MDHO** | CTA / RPC `approve_mdho_assessment` (PO-MDHO-20 / PO-HSE-2) |
| **Devolver MDHO** | CTA / RPC `return_mdho_assessment` — **não** “Rejeitar” (PO-HSE-4) |
| **Aguardando aprovação HSE** | Status ocorrência `AGUARDANDO_APROVACAO_HSE` + assessment `SUBMITTED` |
| **Fila** | Lista via `list_mdho_pending_approvals` |

**Proibido inventar:** status `REJECTED`, campo `technical_comment`, tabela `hse_approvals`, permissão `hse.approve`.

---

## Hierarquia de cores (fase decisão)

| Contexto | Tratamento |
|---|---|
| Form MDHO preenchimento (2.6) | Azul informação / neutro técnico |
| **Fase Aprovação HSE (2.7)** | **Âmbar / atenção decisória** — seção e fila com accent warning |
| Card fila pendente | Surface + borda âmbar + badge “Pendente” |
| CTA **Aprovar** | Primary (laranja produto ou success sólido) — **não** vermelho |
| CTA **Devolver** | Secondary outline **ou** destructive suave — sempre com dialog |
| Pós-APPROVED | Badge success + hint IMS neutro |
| Distinto IO | Vermelho IO **não** usado na fase HSE |

Aprovação HSE = **decisão de liderança**, visualmente separada do formulário MDHO azul.

---

## Princípios invioláveis

| Regra | Aplicação |
|---|---|
| Incremental 2.6 | Reutilizar approve/return — não reimplementar domínio MDHO |
| Segregação | Submit ≠ Approve; autoaprovação bloqueada (PO-HSE-7/8) |
| Sem “Rejeitar” | Só **Devolver** com motivo |
| Anti-acidente | Confirm dialog + disable durante mutation |
| Offline | Bloquear approve/return — sem optimistic (PO-HSE-24) |
| Fila | Só `mdho.approve` (PO-HSE-12) |
| Pós-approve | Hint IMS sem CTA; ocorrência **não** encerrada (PO-HSE-13) |

---

## Ordem no detalhe (ocorrência)

```text
… Evidências → Decisão → IO Summary →
[ MDHO form / start — se DRAFT/RETURNED ]
[ HSE-REVIEW — se SUBMITTED / AGUARDANDO_APROVACAO_HSE ]  ← hse-approval
[ MdhoSummary — se APPROVED ]
→ Timeline → Composer
```

Deep link opcional: `?section=mdho-review` (PO-HSE-23).

---

## Guards UI

```text
showHseApprovalQueue =
  can("mdho.approve") && !isPlatformAdmin

canApproveHse =
  can("mdho.approve") && !isPlatformAdmin &&
  assessment.status === "SUBMITTED" &&
  assessment.submittedBy !== currentUserId

canReturnHse =
  can("mdho.return") && !isPlatformAdmin &&
  assessment.status === "SUBMITTED"
```

| Situação | UI |
|---|---|
| `submittedBy === self` | **Ocultar** Aprovar; Devolver pode permanecer (PO-HSE-7) |
| Supervisor | Sem fila; detalhe review read-only |
| Fiscal / Admin Empresa | Sem fila; sem CTAs |
| Platform Admin | Sem fila / sem mutations |

---

## Mapeamento Base44 → SafeStop

| Base44 `mdho_status` | Assessment | Ocorrência | UI 2.7 |
|---|---|---|---|
| `submitted` | `SUBMITTED` | `AGUARDANDO_APROVACAO_HSE` | HSE-QUEUE + HSE-REVIEW |
| `approved` | `APPROVED` | `AGUARDANDO_REGISTRO_IMS` | MdhoSummary + hint IMS |
| _(devolução)_ | `RETURNED` | `MDHO_EM_PREENCHIMENTO` | Form MDHO 2.6 + banner |

---

# HSE-QUEUE — Fila de pendências

**Rota web:** `/approvals/mdho`  
**Mobile:** tela dedicada na stack (após Ocorrências / área HSE).  
**RPC:** `list_mdho_pending_approvals(organization_id)`  
**Visível:** só `showHseApprovalQueue`.

### Wireframe web

```text
┌─ Sidebar ─┬────────────────────────────────────────────┐
│ …         │ Aprovação HSE                              │
│ Aprovações│ Aguardando sua aprovação                   │
│           │                                            │
│           │ ┌────────────────────────────────────────┐ │
│           │ │ SS-26-000154 · Alta                    │ │
│           │ │ Área X · Soldagem…                     │ │
│           │ │ Enviado por Ana · há 2 h               │ │
│           │ └────────────────────────────────────────┘ │
│           │ …                                          │
│           │ [ Carregar mais ]                          │
└───────────┴────────────────────────────────────────────┘
```

### Wireframe mobile

```text
┌──────────────────────────────────────┐
│ Aprovação HSE                        │
│ Aguardando sua aprovação             │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ SS-26-000154              Alta   │ │
│ │ Área · resumo atividade          │ │
│ │ Enviado por · relativo           │ │
│ └──────────────────────────────────┘ │
│ …                                    │
└──────────────────────────────────────┘
```

### Card da fila (`MdhoPendingApprovalItem`)

| Campo UI | Fonte |
|---|---|
| Código | ocorrência `public_code` |
| Criticidade | badge |
| Área | `areaName` |
| Resumo | `taskSummary` / title |
| Enviado por / em | `submittedByName` · `submittedAt` |

Tap → detalhe ocorrência com scroll/foco em **HSE-REVIEW**.

Ordenação: `submittedAt DESC`. Paginação cursor. Stale time 30s; invalidar pós approve/return.

### HSE-EMPTY

```text
Nenhuma avaliação aguardando sua aprovação.

Quando um Supervisor enviar um MDHO, ele aparecerá aqui.
```

Sem CTA obrigatório (opcional: link para Ocorrências).

### HSE-FORBIDDEN (fila)

Usuário sem `mdho.approve`: **não** mostrar item de nav/rota da fila (ou redirect + mensagem).

```text
Você não tem permissão para a fila de Aprovação HSE.
```

---

# HSE-REVIEW — Painel de revisão

Extrai/refina `MdhoReviewPanel` → componentes `hse-approval` (PO-HSE-27).

### Wireframe

```text
┌──────────────────────────────────────┐
│ APROVAÇÃO HSE                        │  accent âmbar
│ Aguardando aprovação HSE             │
│                                      │
│ Enviado por  Nome do Supervisor      │
│ Em           dd/mm/aaaa HH:mm        │
│                                      │
│ ── Avaliação Técnica (MDHO) ─────── │
│ Comportamento          …             │  read-only
│ Tipo de Desvio         Erro|Violação │
│ Pré-condições          …             │
│ Questões Organizacionais …           │
│ Supervisão/Fiscalização …            │
│ Complemento            … ou —        │
│                                      │
│ (evidências da ocorrência: contexto  │
│  read-only acima — sem gate)         │
│                                      │
│ [ações — ver HSE-ACTIONS / footer]   │
└──────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| Modo | **Read-only** — sem editar seleções |
| 5 categorias | Mesmos labels [`MDHO-UI-SPEC`](./MDHO-UI-SPEC.md) MDHO-C07…C11 |
| Metadados | `submitted_by` / `submitted_at` obrigatórios |
| Fill | Bloqueado (PO-MDHO-11) |
| Evidências | Contexto read-only — sem exigir novas (PO-HSE-21) |
| Comentário timeline | **Não** substitui `return_reason` (PO-HSE-22) |
| Supervisor vendo próprio submit | Review read-only; **sem** Aprovar (PO-HSE-7) |

---

# HSE-ACTIONS — Aprovar / Devolver

### Visibilidade

| CTA | Visível quando |
|---|---|
| `Aprovar MDHO` | `canApproveHse` |
| `Devolver MDHO` | `canReturnHse` |

### Anti-acidente (obrigatório)

1. **Dialog de confirmação** antes de qualquer mutation.  
2. Durante mutation: botões **disabled** + busy; anti double-tap.  
3. Sem optimistic UI.  
4. Offline: bloquear abertura útil do dialog ou disable CTAs + toast.

### Dialog Aprovar (PO-HSE-10)

```text
Aprovar Avaliação Técnica (MDHO)?

A avaliação ficará imutável.
A ocorrência seguirá para aguardar o registro da referência IMS.

[ Cancelar ]     [ Aprovar MDHO ]
```

- Sem campo de justificativa de aprovação.
- RPC: `approve_mdho_assessment(assessment_id)`.
- Erro `SELF_APPROVAL_FORBIDDEN` → HSE-C22; ocultar CTA e refetch.

### Dialog Devolver (PO-HSE-3)

```text
Devolver Avaliação Técnica (MDHO)?

Motivo da devolução *
┌────────────────────────────────────┐
│                                    │
└────────────────────────────────────┘
n/4000  (mín. 10)

[ Cancelar ]     [ Devolver MDHO ]
```

- `return_reason` 10–4000 trim.
- RPC: `return_mdho_assessment({ assessment_id, return_reason })`.
- Erro validação inline no textarea.

### Pós-sucesso

| Ação | UI |
|---|---|
| Approve | Invalidar fila + detail + mdho + timeline → **MdhoSummary** + hint IMS (HSE-C20) |
| Return | Invalidar → form MDHO editável + banner devolução (2.6) |

### Idempotência approve (PO-HSE-15)

Retry após success: tratar como sucesso; UI já em summary — sem erro alarmista.

---

# Mobile — footer fixo (HSE-MOBILE-ACTIONS)

Quando `canApproveHse` **ou** `canReturnHse` e assessment `SUBMITTED`:

```text
┌──────────────────────────────────────┐
│ … HSE-REVIEW (scroll) …              │
│ [padding bottom]                     │
├──────────────────────────────────────┤
│ [ Devolver MDHO ]  [ Aprovar MDHO ]  │  sticky + Safe Area
│   secondary          primary         │
└──────────────────────────────────────┘
```

| Botão | Posição | Variante |
|---|---|---|
| Devolver | Esquerda / full half | Secondary |
| Aprovar | Direita / full half | Primary |

Se só `canReturnHse` (autoaprovação bloqueada): Devolver full-width; Aprovar **oculto**.  
KeyboardAvoidingView no dialog de devolução (textarea).

**Web:** CTAs no rodapé do painel HSE-REVIEW (não sticky obrigatório); mesma ordem Devolver | Aprovar.

---

# HSE-POST-APPROVE (PO-HSE-13)

Reutilizar `MdhoSummary` (2.6):

```text
[ Aprovado ]
…
Aguardando registro da referência IMS   ← sem CTA
```

Não encerrar ocorrência. Não abrir IMS.

---

# Estados transversais

## HSE-EMPTY

Ver fila — copy HSE-C05 / HSE-C06.

## HSE-FORBIDDEN

| Contexto | UI |
|---|---|
| Fila sem `mdho.approve` | Nav oculta / mensagem HSE-C07 |
| CTAs approve/return | **Ocultos** — nunca disabled “Rejeitar” |
| Autoaprovação | Aprovar oculto + opcional info HSE-C22 |

## HSE-OFFLINE

```text
Sem conexão — ação não enviada
```

CTAs disabled. Toast se tentar (PO-HSE-24).

## Conflict / STATUS_MISMATCH

```text
Esta avaliação foi atualizada. Atualize para continuar.
[ Atualizar ]
```

Refetch detail + fila.

## Loading

- Fila: skeleton 3 cards.  
- Review: skeleton painel.  
- Mutation: busy nos CTAs/dialogs.

---

# Copy PT — HSE-C01…C30

| ID | Contexto | Texto |
|---|---|---|
| **HSE-C01** | Nav / título fila | `Aprovação HSE` |
| **HSE-C02** | Subtítulo fila | `Aguardando sua aprovação` |
| **HSE-C03** | Seção review | `Aprovação HSE` |
| **HSE-C04** | Status review | `Aguardando aprovação HSE` |
| **HSE-C05** | Empty título | `Nenhuma avaliação aguardando sua aprovação` |
| **HSE-C06** | Empty corpo | `Quando um Supervisor enviar um MDHO, ele aparecerá aqui.` |
| **HSE-C07** | Forbidden fila | `Você não tem permissão para a fila de Aprovação HSE.` |
| **HSE-C08** | Meta enviado | `Enviado por` |
| **HSE-C09** | Meta em | `Em` |
| **HSE-C10** | CTA aprovar | `Aprovar MDHO` |
| **HSE-C11** | CTA devolver | `Devolver MDHO` |
| **HSE-C12** | Dialog approve título | `Aprovar Avaliação Técnica (MDHO)?` |
| **HSE-C13** | Dialog approve corpo | `A avaliação ficará imutável. A ocorrência seguirá para aguardar o registro da referência IMS.` |
| **HSE-C14** | Dialog approve ação | `Aprovar MDHO` |
| **HSE-C15** | Dialog return título | `Devolver Avaliação Técnica (MDHO)?` |
| **HSE-C16** | Motivo label | `Motivo da devolução` |
| **HSE-C17** | Motivo helper | `Mínimo 10 caracteres` |
| **HSE-C18** | Dialog return ação | `Devolver MDHO` |
| **HSE-C19** | Cancelar | `Cancelar` |
| **HSE-C20** | Hint IMS pós-approve | `Aguardando registro da referência IMS` |
| **HSE-C21** | Offline toast | `Sem conexão — ação não enviada` |
| **HSE-C22** | Autoaprovação | `Quem enviou o MDHO não pode aprová-lo.` |
| **HSE-C23** | Conflict | `Esta avaliação foi atualizada. Atualize para continuar.` |
| **HSE-C24** | Conflict CTA | `Atualizar` |
| **HSE-C25** | Erro motivo curto | `Informe um motivo com pelo menos 10 caracteres.` |
| **HSE-C26** | Erro motivo longo | `O motivo deve ter no máximo 4000 caracteres.` |
| **HSE-C27** | Loading approve | `Aprovando…` |
| **HSE-C28** | Loading return | `Devolvendo…` |
| **HSE-C29** | Card fila · enviado | `Enviado por {nome} · {relativo}` |
| **HSE-C30** | Forbidden a11y CTAs | `Você não tem permissão para aprovar ou devolver este MDHO.` |

**Proibido:** “Rejeitar”, “MDHO rejeitado”, “Responsáveis notificados”, CTA “Registrar IMS”, campo “comentário técnico” separado.

Alinhar com MDHO-C24/C27 (Aprovar/Devolver) e MDHO-C33 (hint IMS) quando reutilizar strings — preferir **HSE-C\*** na facade 2.7 para a fase Aprovação HSE.

---

# Acessibilidade

| Requisito | Spec |
|---|---|
| Fila | Lista com labels `Ocorrência {código}, enviada por {nome}` |
| Review | Heading `Aprovação HSE`; categorias como lista de definição |
| Footer mobile | Ordem foco: Devolver → Aprovar |
| Dialogs | Foco trap; ESC = Cancelar; busy anunciado |
| Autoaprovação | Sem botão Aprovar — não disabled cinza |
| Contraste | Âmbar seção + texto legível |
| Offline | `aria` + toast |

---

# Tokens / componentes DS

| Uso | Componente |
|---|---|
| Fila | List / cards + badge warning |
| Review | Card surface âmbar accent |
| Aprovar | Button primary |
| Devolver | Button secondary / outline |
| Dialogs | AlertDialog |
| Empty | EmptyState |
| Hint IMS | Text muted / information |

---

# Critérios de aceite

1. Fila `/approvals/mdho` (web) + tela mobile só com `mdho.approve`.
2. Card fila → detalhe com HSE-REVIEW.
3. Review read-only: 5 categorias + enviado por/em.
4. Dialogs approve (imutável) e devolver (motivo 10–4000).
5. Copy **não** usa “Rejeitar”.
6. Autoaprovação: CTA Aprovar oculto + erro `SELF_APPROVAL_FORBIDDEN` tratado.
7. Mobile: footer fixo Devolver (sec.) + Aprovar (prim.); disable durante mutation.
8. Empty / forbidden / offline / conflict cobertos.
9. Pós-approve: hint IMS sem CTA (PO-HSE-13).
10. Cores fase decisão (âmbar) distintas do form MDHO azul.
11. Feature `hse-approval/` facade — sem duplicar RPCs MDHO.
12. Sem REJECTED / technical_comment / hse_approvals.
13. Copy HSE-C01…C30.

---

# Checklist WEB / MOBILE

### Fila
- [ ] HSE-QUEUE + empty  
- [ ] Forbidden sem approve  
- [ ] Tap → review  
- [ ] Invalidação pós-mutation  

### Review / Actions
- [ ] HSE-REVIEW 5 cats + metadados  
- [ ] Dialogs approve / devolver  
- [ ] Autoaprovação oculta Aprovar  
- [ ] Loading busy  
- [ ] Offline bloqueia  

### Mobile
- [ ] Footer Devolver + Aprovar  
- [ ] Safe Area + KAV no return dialog  

### Pós
- [ ] Hint IMS sem CTA  
- [ ] Regressão MDHO-07/08/09  

### Fora de escopo
- [ ] IMS / notificações / rejeição / SLA  

---

## Cross-check PO → UI (preenchível)

| Tema | PO | Componente / copy | Status |
|---|---|---|---|
| Fila “Aguardando sua aprovação” | PO-HSE-12 | HSE-QUEUE · HSE-C02 | Alinhado |
| Revisão read-only 5 categorias | PO-MDHO-20 | HSE-REVIEW | Alinhado |
| Dialog approve imutável | PO-HSE-10 | HSE-C12…C14 | Alinhado |
| Dialog devolver + motivo | PO-HSE-3 | HSE-C15…C18 | Alinhado |
| Empty fila | PO-HSE-12 | HSE-EMPTY · HSE-C05/06 | Alinhado |
| Footer mobile approve/return | PO-HSE-24 | HSE-MOBILE-ACTIONS | Alinhado |
| Hint IMS pós-approve | PO-HSE-13 | HSE-C20 | Alinhado |
| Ocultar approve autoaprovação | PO-HSE-7 | Guards + HSE-C22 | Alinhado |
| Sem “Rejeitar” | PO-HSE-4 | HSE-C11 | Alinhado |
| Offline sem optimistic | PO-HSE-24 | HSE-OFFLINE · HSE-C21 | Alinhado |
| Facade hse-approval | PO-HSE-26/27 | Feature folder | Alinhado |

---

## Hand-off

| De | Para |
|---|---|
| UIUX (este doc) | MASTER → WEB ∥ MOBILE |
| WEB | `/approvals/mdho` + review inline |
| MOBILE | Fila + detalhe footer |
| QA | HSE-01…HSE-20 |

```text
UIUX — HSE-APPROVAL-UI-SPEC.md
Sprint 2.7
Data: 2026-08-02
Status: PRONTO PARA REVISÃO MASTER → WEB ∥ MOBILE
DoD: spec completa; HSE-C01…C30; sem código apps/packages/supabase
```
