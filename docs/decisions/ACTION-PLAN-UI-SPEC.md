# Spec UI/UX — Plano de Ação (Sprint 3.0)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 3.0 — Plano de Ação (IO até plano `COMPLETED`)  
**Agente:** UIUX  
**Data:** 2026-08-03  
**Entregável:** `docs/decisions/ACTION-PLAN-UI-SPEC.md`

**PO (fonte oficial):** [`ACTION-PLAN-DECISIONS.md`](./ACTION-PLAN-DECISIONS.md) — PO-AP-1…PO-AP-19; Gate G0.

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/decisions/ACTION-PLAN-DECISIONS.md` | RPCs, guards, evidência, segregação |
| `docs/decisions/CONSOLIDATION-UI-SPEC.md` | CON-C03 — **substituído** por esta seção |
| `docs/decisions/IMS-REFERENCE-UI-SPEC.md` | Posição pós-`ImsReferenceSection` |
| `docs/decisions/EVIDENCE-UI-SPEC.md` | Upload / signed URL / limites |
| `docs/decisions/HSE-APPROVAL-UI-SPEC.md` | Padrão painel validate + dialog |
| `docs/database.md` §15 | Campos plano / ação / anexos |
| `docs/workflow.md` §13 | Campos mínimos, etapas, regras |
| `docs/design-system.md` | Card Plano, Badge prioridade, Dialog, Empty |
| `reference/base44/.../Interdiction.jsonc` | `action_plan` monolítico — **não** copiar modelo |

Base44 = composição. PO prevalece. **Sem código apps/packages/supabase nesta entrega UIUX.**

---

## Objetivo

Substituir o dead-end **CON-C03** (“Plano de Ação em versão futura”) por seção operacional **`ActionPlanSection`**:

1. **AP-SECTION** — posição canônica (pós IMS, antes Timeline)
2. **AP-EMPTY** — empty + CTA criar / banner aguardando
3. **AP-HEADER** — progresso N/M + status do plano
4. **AP-ITEM** — card ação (prioridade, prazo, atraso)
5. **AP-SUBMIT** — dialog conclusão + evidência (PO-AP-16)
6. **AP-VALIDATE** — painel HSE aprovar/rejeitar (PO-AP-17)
7. **AP-MOBILE** — ≤3 toques até conclusão pelo responsável
8. Copy **AP-C***; offline; forbidden; checklist Base44

**Fora 3.0:** liberação, notificações, plano em VA, transição `AGUARDANDO_VALIDACAO`, cancelamento de plano inteiro.

---

## Terminologia

| Termo UI | Significado |
|---|---|
| **Plano de Ação** | Título da seção — entidade `action_plans` |
| **Ação** | Item `action_items` — nunca “tarefa” / “ticket” |
| **Criar Plano de Ação** | CTA / RPC `create_action_plan` |
| **Concluir ação** | Dialog submit → `AWAITING_VALIDATION` |
| **Validar ação** | HSE: aprovar → `COMPLETED` / rejeitar → `IN_PROGRESS` |
| **Concluir plano** | RPC `complete_action_plan` — ocorrência **permanece** `EM_TRATATIVA` |
| **Minhas ações** | Filtro mobile: `responsible_member_id` = eu |

**Proibido na copy:** “Liberar”, “Encerrar ocorrência”, “Validar ocorrência”, “Notificar”, “Sincronizar IMS”, “Plano VA”.

---

## Princípios invioláveis

| Regra | Aplicação |
|---|---|
| IO-only | Seção **ausente** se `decision_type ≠ INTERDICAO_OFICIAL` (PO-AP-5) |
| IMS obrigatório | Sem `ims_reference_code` → seção empty/create **bloqueada** (PO-AP-1) |
| CTA explícito | Plano **não** auto-cria (PO-AP-2) |
| Multi-ação | Base44 monolítico → cards N ações (intencional) |
| Evidência | CRITICAL/HIGH ≥1 anexo no submit (PO-AP-16) |
| Segregação | Quem concluiu **não** valida (PO-AP-17) |
| Offline | Mutations bloqueadas — sem optimistic (AP-OFFLINE) |
| Pós-complete plano | Banner informativo — **sem** CTA liberação (PO-AP-12) |
| Feature | `features/action-plan/` |

---

## Integração — substituir CON-C03

| Condição | Comportamento UI |
|---|---|
| `EM_TRATATIVA` + IO + IMS + **sem** plano + `action_plan.create` | **AP-EMPTY** com CTA — **não** exibir CON-BANNER-TRATATIVA / CON-C03 |
| Idem **sem** `action_plan.create` | Banner informativo **AP-C02** (“Aguardando Plano de Ação”) — evolução de CON-C03; **sem** CTA |
| Plano ativo ou `COMPLETED` | **AP-SECTION** funcional — CON-C03 **removido** |
| `VER_E_AGIR` | Seção plano **ausente**; CON-BANNER-VA (CON-C01) permanece |

Atualizar implementação 2.9: gate `shouldShowActionPlanSection` → ocultar `CON-BANNER-TRATATIVA`.

---

## Ordem no detalhe (confirmada)

```text
 1. Header + badges
 2. Banner IO (se aplicável)
 3. Info / condição
 4. Evidências
 5. Decisão VA/IO + summaries
 6. MDHO / HSE
 7. ImsReferenceSection
 8. ActionPlanSection          ← este spec
 9. Timeline
10. Composer
```

**Mnemônico:** Evidence → Decisão → MDHO → IMS → **Plano** → Timeline → Composer

---

## Guards UI

```text
shouldShowActionPlanSection(o) =
  o.decisionType === "INTERDICAO_OFICIAL" &&
  o.status === "EM_TRATATIVA" &&
  !!o.imsReferenceCode;

canCreatePlan =
  can("action_plan.create") && !isPlatformAdmin && !hasActivePlan;

canManage =
  can("action_plan.manage") && !isPlatformAdmin;

canValidate =
  can("action_plan.validate") && !isPlatformAdmin;

canActAsResponsible =
  isResponsibleMember && !isPlatformAdmin;

canStartOrSubmit(item) =
  (canManage || isResponsibleOf(item)) &&
  item.status ∈ { PENDING, IN_PROGRESS, REJECTED };

canSubmit(item) =
  (canManage || isResponsibleOf(item)) &&
  item.status ∈ { IN_PROGRESS, REJECTED };

// REJECTED: após rejeição, item volta IN_PROGRESS no servidor;
// UI trata REJECTED transitório se ainda refletido no cache até invalidate.
```

| Papel | Create | Manage (add/edit/cancel/complete plan) | Start/Submit | Validate | Ver |
|---|---|---|---|---|---|
| Supervisor HSE | Sim | Sim | Sim | Não* | Sim |
| Liderança HSE | Conforme matriz | Conforme matriz | Sim se resp. | Sim | Sim |
| Responsável (membro) | Não | Não | Sim (suas) | Não | Sim |
| Fiscal / Campo | Não | Não | Não | Não | Sim (RO) |
| Platform Admin | Não | Não | Não | Não | Sim (RO) |
| Ramo VA | Seção ausente | — | — | — | — |

\* Validate só com `action_plan.validate` (matriz).

---

# AP-SECTION — container

**Componente:** `ActionPlanSection`  
**Feature:** `features/action-plan/`

```text
┌─ Plano de Ação ─────────────────────────────┐
│ [AP-EMPTY | AP-HEADER + lista AP-ITEM…]     │
│ [AP-COMPLETE-PLAN CTA se elegível]          │
│ [Banner pós-complete plano — AP-C20]        │
└─────────────────────────────────────────────┘
```

| Estado seção | Conteúdo |
|---|---|
| Loading | Skeleton 2 cards |
| Error load | Inline error + retry |
| Empty (create) | AP-EMPTY |
| Empty (sem create) | Banner AP-C02 |
| Com plano | AP-HEADER + lista itens (+ form add se manage) |
| Plano COMPLETED | Header RO + itens RO + banner AP-C20 |
| Offline + mutation | Toast/banner AP-C30; botões disabled |

**Accent visual:** neutro operacional + badges de prioridade semânticos. **Não** usar vermelho IO nem âmbar HSE-MDHO como cor dominante da seção (evitar colisão de fase).

---

# AP-EMPTY — sem plano

```text
┌────────────────────────────────────────────┐
│ 📋  Nenhum Plano de Ação                   │
│     Defina ações corretivas com            │
│     responsável e prazo.                   │
│                                            │
│     [ Criar Plano de Ação ]                │
└────────────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| Visível | `shouldShow…` && !plan && `canCreatePlan` |
| CTA | Primary — **AP-C03** |
| Confirm | Dialog leve opcional (1 passo) — “Criar plano para esta interdição?” |
| RPC | `create_action_plan` |
| Pós-sucesso | Invalidar keys; mostrar AP-HEADER vazio + CTA “Adicionar ação” |
| Sem create | Só texto AP-C02 — **sem** botão |

---

# AP-HEADER — progresso

```text
┌─ Plano de Ação · Em andamento ─────────────┐
│  Progresso  2/5  ████░░░░░░                │
│  Resumo (opcional, editável se manage)     │
│  [ + Adicionar ação ]                      │
└────────────────────────────────────────────┘
```

| Elemento | Spec |
|---|---|
| Título | **AP-C01** `Plano de Ação` |
| Badge status plano | OPEN → `Aberto`; IN_PROGRESS → `Em andamento`; AWAITING_VALIDATION → `Aguardando validação`; COMPLETED → `Concluído` |
| Progresso N/M | N = itens `COMPLETED`; M = itens **não** `CANCELLED` (ou M = todos se product preferir total — **default:** M = count onde status ≠ CANCELLED; CANCELLED exibidos mas fora do denominador) |
| Barra | Visual simples; a11y: `aria-valuenow/min/max` |
| Summary | Textarea curta; save via `update_action_plan` se create\|manage e plano editável |
| CTA add | Visível se `canManage` && plano ∈ {OPEN, IN_PROGRESS, AWAITING_VALIDATION} |
| CTA concluir plano | Visível se `canManage` && elegível PO-AP-11; dialog confirm |

**Elegibilidade complete plan (UI):** todas ações ∈ {COMPLETED, CANCELLED} **e** ≥1 COMPLETED.

---

# AP-ITEM — card da ação

```text
┌────────────────────────────────────────────┐
│ ● Crítica          Pendente     ⚠ Atrasada │
│ Título da ação                             │
│ Responsável · Org                          │
│ Prazo  03/08/2026 14:00                    │
│                                            │
│ [ Iniciar ]  [ … ]                         │
└────────────────────────────────────────────┘
```

## Campos visíveis (lista)

| Campo | UI |
|---|---|
| `priority` | Badge: Baixa / Média / Alta / Crítica |
| `status` | Badge status ação |
| Atraso | Chip **Atrasada** se `due_at < now` && status ∉ {COMPLETED, CANCELLED} |
| `title` | 1–2 linhas, truncate |
| Responsável | Nome display + org (se diferente) |
| `due_at` | Data+hora local — **sempre** (PO-AP-13) |

## Cores prioridade (labels PT)

| Enum | Label | Tratamento |
|---|---|---|
| `LOW` | Baixa | Neutro |
| `MEDIUM` | Média | Info |
| `HIGH` | Alta | Warning / laranja |
| `CRITICAL` | Crítica | Destructive |

## Status ação — labels

| Enum | Label |
|---|---|
| `PENDING` | Pendente |
| `IN_PROGRESS` | Em andamento |
| `AWAITING_VALIDATION` | Aguardando validação |
| `COMPLETED` | Concluída |
| `REJECTED` | Rejeitada (se refletido) |
| `CANCELLED` | Cancelada |

## Ações por estado (CTAs)

| Status | Responsável / manage | Validate | Manage extra |
|---|---|---|---|
| `PENDING` | **Iniciar** | — | Editar · Cancelar* |
| `IN_PROGRESS` | **Concluir** | — | Editar (limitado) · Cancelar* |
| `AWAITING_VALIDATION` | — (RO para executor) | **Validar** / **Rejeitar** | — |
| `COMPLETED` | RO | — | — |
| `CANCELLED` | RO | — | — |

\* Cancelar: `action_plan.manage` + motivo 10–4000; **CRITICAL** → dialog reforçado (PO-AP-4). HSE validate **não** cancela.

## Form adicionar / editar (sheet ou dialog)

Campos obrigatórios:

| Campo | Controle | Regra |
|---|---|---|
| Título | Input | Obrigatório |
| Descrição | Textarea | Obrigatório (mín. razoável — validação package) |
| Responsável | Picker membro ativo org | Obrigatório (PO-AP-14) |
| Org responsável | Picker opcional | Default org ocorrência |
| Prazo | DateTime | **Obrigatório sempre** (PO-AP-13) |
| Prioridade | Select 4 níveis | Default `MEDIUM` |

Web: dialog/side sheet. Mobile: full-screen sheet.

---

# AP-SUBMIT — dialog conclusão + evidência

**Gatilho:** CTA **Concluir** em item `IN_PROGRESS` (manage ou responsável).

```text
┌─ Concluir ação ────────────────────────────┐
│ Título (RO)                                │
│                                            │
│ Descrição da conclusão *                   │
│ ┌────────────────────────────────────────┐ │
│ │ …                                      │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Evidências                                 │
│ [+] [thumb] [thumb]   (0/20)               │
│ ⚠ Obrigatório para Alta e Crítica          │
│                                            │
│ [ Cancelar ]              [ Enviar ]       │
└────────────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| RPC | `submit_action_item` |
| `completion_description` | Obrigatório |
| Evidência HIGH/CRITICAL | ≥1 anexo ativo — senão disable Enviar + AP-C15 |
| Evidência MEDIUM/LOW | Opcional |
| Upload | Reutilizar padrão EVIDENCE-UI (sheet câmera/galeria; 10 MiB; 20 ativas; MIME imagem) |
| Path | Subpath `…/action-items/{id}/…` (PO-AP-6) — UX idêntica, RPC attachment dedicada |
| Offline | Bloquear Enviar + anexos |
| Pós-sucesso | Fecha dialog; item → Aguardando validação; timeline |

**Não** chamar validate no mesmo fluxo.

---

# AP-VALIDATE — painel HSE

**Quando:** item `AWAITING_VALIDATION` && `canValidate` && `auth.uid() ≠ completed_by`.

```text
┌─ Validar ação ─────────────────────────────┐
│ Título · Prioridade · Responsável          │
│ Concluída por · em · descrição conclusão   │
│ Galeria evidências (signed URL)            │
│                                            │
│ [ Rejeitar ]              [ Aprovar ]      │
└────────────────────────────────────────────┘
```

### Dialog Aprovar

| Item | Spec |
|---|---|
| Nota | Opcional |
| CTA | **Aprovar** → `validate_action_item` decision COMPLETED |
| Copy | AP-C16 / AP-C17 |

### Dialog Rejeitar

| Item | Spec |
|---|---|
| Motivo | **Obrigatório** (validation_note) |
| CTA | **Rejeitar** → REJECTED → item volta `IN_PROGRESS` |
| Copy | AP-C18 / AP-C19 |

### Self-validation

| Item | Spec |
|---|---|
| UI | Esconder CTAs validate se `currentUser === completed_by` |
| Fallback RPC | `SELF_VALIDATION_FORBIDDEN` → toast AP-C21 |

**Sem** fila dedicada “minhas validações” na 3.0 — validação no detalhe da ocorrência (PO fora).

---

# AP-MOBILE — ≤3 toques (responsável)

Fluxo mínimo para **concluir** ação já existente em `IN_PROGRESS` (responsável):

| Toque | Ação |
|---|---|
| 1 | Abrir detalhe ocorrência (deep link / Minhas ações → item) **ou** expandir card |
| 2 | **Concluir** |
| 3 | **Enviar** no dialog (após preencher descrição; evidência se exigida conta como passos de conteúdo, não CTAs extras de navegação) |

**Meta:** ≤3 toques de **navegação/CTA** até submit — preenchimento de texto/foto não conta como “toque de navegação”.

### Minhas ações (mobile)

| Item | Spec |
|---|---|
| Entrada | Filtro/aba no detalhe **ou** lista compacta “Minhas ações” filtrando `responsible_member_id = me` |
| Card | Mesmo AP-ITEM; CTA primário Iniciar/Concluir |
| Start | 1 toque **Iniciar** em PENDING |
| Offline | CTAs disabled + AP-C30 |

Web: mesmos fluxos; densidade maior (lista + painel).

---

# AP-COMPLETE-PLAN

| Item | Spec |
|---|---|
| CTA | **Concluir plano** — só `canManage` + elegível |
| Dialog | Confirma AP-C22 |
| RPC | `complete_action_plan` |
| Pós | Badge Concluído + **AP-C20** (validação ocorrência futura) |
| Ocorrência | Status badge permanece **Em tratativa** — **não** mudar |

---

# AP-OFFLINE

| Mutation | Offline |
|---|---|
| create / add / update / start / submit / validate / cancel / complete plan | **Bloqueada** |
| Upload anexo | **Bloqueado** |
| Leitura cached | Permitida (stale) |
| Feedback | Banner/toast AP-C30; botões `disabled` |

Sem fila persistente (fora 3.0).

---

# Timeline (integração)

Kinds novos aparecem na `OccurrenceTimeline` (já patch BACKEND). UI **não** precisa composer especial.

| kind | Copy sugerida (linha) |
|---|---|
| `ACTION_PLAN_CREATED` | Plano de Ação criado |
| `ACTION_ITEM_CREATED` | Ação adicionada: {title} |
| `ACTION_ITEM_STATUS_CHANGED` | Ação {title}: {from} → {to} |
| `ACTION_PLAN_COMPLETED` | Plano de Ação concluído |
| `ACTION_ITEM_EVIDENCE_ADDED` | Evidência anexada à ação |

**Não** emitir `STATUS_CHANGED` da ocorrência no complete do plano.

---

# Copy PT — AP-C*

| ID | Contexto | Texto |
|---|---|---|
| **AP-C01** | Título seção | `Plano de Ação` |
| **AP-C02** | Sem create (evolução CON-C03) | `Aguardando Plano de Ação` |
| **AP-C03** | CTA create | `Criar Plano de Ação` |
| **AP-C04** | Empty body | `Defina ações corretivas com responsável e prazo.` |
| **AP-C05** | CTA add | `Adicionar ação` |
| **AP-C06** | Progresso | `{n} de {m} concluídas` |
| **AP-C07** | Chip atraso | `Atrasada` |
| **AP-C08** | CTA start | `Iniciar` |
| **AP-C09** | CTA submit open | `Concluir` |
| **AP-C10** | Dialog submit título | `Concluir ação` |
| **AP-C11** | Label conclusão | `Descrição da conclusão` |
| **AP-C12** | Label evidências | `Evidências` |
| **AP-C13** | Hint evidência opcional | `Opcional para esta prioridade` |
| **AP-C14** | Hint evidência obrigatória | `Obrigatório para prioridade Alta ou Crítica` |
| **AP-C15** | Erro evidência | `Anexe ao menos uma evidência para esta prioridade.` |
| **AP-C16** | CTA approve | `Aprovar` |
| **AP-C17** | Dialog approve | `Confirmar aprovação desta ação?` |
| **AP-C18** | CTA reject | `Rejeitar` |
| **AP-C19** | Dialog reject | `Informe o motivo da rejeição.` |
| **AP-C20** | Pós complete plan | `Plano concluído — validação da ocorrência em versão futura` |
| **AP-C21** | Self-validation | `Quem concluiu a ação não pode validá-la.` |
| **AP-C22** | Confirm complete plan | `Concluir o Plano de Ação? Todas as ações elegíveis foram encerradas.` |
| **AP-C23** | CTA complete plan | `Concluir plano` |
| **AP-C24** | Cancel item título | `Cancelar ação` |
| **AP-C25** | Cancel CRITICAL | `Esta ação é Crítica. Confirme o cancelamento e informe o motivo.` |
| **AP-C26** | Motivo cancel | `Motivo do cancelamento` |
| **AP-C27** | Forbidden | `Você não tem permissão para esta ação.` |
| **AP-C28** | Conflict / status | `O estado da ação mudou. Atualize e tente novamente.` |
| **AP-C29** | Loading | `Carregando plano…` |
| **AP-C30** | Offline | `Sem conexão. Reconecte para alterar o Plano de Ação.` |
| **AP-C31** | Success create | `Plano de Ação criado.` |
| **AP-C32** | Success submit | `Ação enviada para validação.` |
| **AP-C33** | Success validate | `Ação validada.` |
| **AP-C34** | Success reject | `Ação rejeitada — retornou para correção.` |
| **AP-C35** | Placeholder título | `O que precisa ser feito?` |
| **AP-C36** | Label prazo | `Prazo` |
| **AP-C37** | Label prioridade | `Prioridade` |
| **AP-C38** | Label responsável | `Responsável` |
| **AP-C39** | Confirm create | `Criar Plano de Ação para esta interdição?` |
| **AP-C40** | Minhas ações | `Minhas ações` |

**Proibido:** CTAs Liberar / Encerrar / Notificar / “Abrir no IMS”.

---

# Acessibilidade

| Item | Spec |
|---|---|
| Progresso | `role="progressbar"` + texto AP-C06 |
| Atraso | Não só cor — chip textual AP-C07 |
| Prioridade | Badge com label PT |
| Dialogs | Focus trap; Esc fecha; CTA destrutivo explícito |
| Touch | Alvos ≥ 44px (mobile) |

---

# Cross-check Base44 vs SafeStop

| Base44 | SafeStop 3.0 | Decisão |
|---|---|---|
| Campo texto único `action_plan` | Entidade `action_plans` + N `action_items` | **Multi-ação intencional** — não regressar a textarea |
| `deadline` único | `due_at` **por ação** | Por item |
| `action_responsible` string | `responsible_member_id` picker | Membro ativo org |
| Sem validação segregada | Submit ≠ Validate + hard block self | Manter PO-AP-17 |
| Sem evidência por ação | Anexos por item (HIGH/CRITICAL) | Manter PO-AP-16 |
| Sem progresso N/M | AP-HEADER | Novo |
| Liberação no mesmo fluxo | **Fora** 3.0 | Não copiar Release.jsx aqui |

---

# Critérios de aceite

1. Em `EM_TRATATIVA` IO+IMS com create: AP-EMPTY + CTA; **sem** CON-C03.
2. Sem create: banner AP-C02; sem CTA fake.
3. Com plano: seção pós-IMS, antes Timeline; progresso N/M.
4. Card ação: prioridade, prazo, chip Atrasada quando aplicável.
5. Submit HIGH/CRITICAL bloqueia sem evidência (AP-C15).
6. Validate/Reject no painel; self-validation bloqueada (AP-C21).
7. Mobile responsável: ≤3 toques de CTA até Enviar.
8. Offline bloqueia mutations (AP-C30).
9. Complete plan → AP-C20; ocorrência permanece Em tratativa.
10. Seção ausente em VA / sem IMS / status ≠ EM_TRATATIVA (3.0).
11. WEB e MOBILE implementáveis sem ambiguidade de copy/posição/guards.

---

# Checklist implementação WEB / MOBILE

### Seção
- [ ] `ActionPlanSection` após `ImsReferenceSection`
- [ ] Remover CON-BANNER-TRATATIVA quando seção plano ativa
- [ ] Guards `shouldShowActionPlanSection`

### Empty / Header / Item
- [ ] AP-EMPTY + AP-C03
- [ ] AP-HEADER progresso N/M
- [ ] AP-ITEM prioridade / prazo / atraso
- [ ] Form add/edit + cancel CRITICAL

### Submit / Validate
- [ ] AP-SUBMIT + evidência PO-AP-16
- [ ] AP-VALIDATE approve/reject + self-block
- [ ] AP-COMPLETE-PLAN + AP-C20

### Mobile / Offline
- [ ] AP-MOBILE ≤3 toques
- [ ] AP-C40 Minhas ações
- [ ] AP-OFFLINE

### Forbidden
- [ ] Sem Liberação / Notificações / plano VA

---

## Cross-check PO

| Tema | PO | Spec | Status |
|---|---|---|---|
| Seção pós-IMS | Ordem UI | AP-SECTION | Alinhado |
| Empty + CTA create | PO-AP-18 | AP-EMPTY | Alinhado |
| Remover CON-C03 | PO-AP-18 | Integração | Alinhado |
| Card + prioridade/atraso | workflow §13 | AP-ITEM | Alinhado |
| Dialog + evidência | PO-AP-16 | AP-SUBMIT | Alinhado |
| Validate / self-block | PO-AP-17 | AP-VALIDATE | Alinhado |
| Mobile ≤3 toques | PO-AP-10 | AP-MOBILE | Alinhado |
| Offline | — | AP-OFFLINE | Alinhado |
| Pós-complete sem liberação | PO-AP-12 | AP-C20 | Alinhado |
| VA sem seção | PO-AP-5 | Guards | Alinhado |

---

## Hand-off

| De | Para |
|---|---|
| UIUX | WEB ∥ MOBILE — `features/action-plan/` |
| UIUX | DOCS — nota CONSOLIDATION-UI-SPEC (CON-C03 superseded) |
| QA | AP-QA-01…17 (+ UX mobile ≤3 toques, offline) |

```text
UIUX — ACTION-PLAN-UI-SPEC.md
Sprint 3.0
Data: 2026-08-03
Status: PRONTO PARA IMPLEMENTAÇÃO
DoD: AP-SECTION…AP-MOBILE + AP-C* + Base44 multi-ação + CON-C03 substituído
```
