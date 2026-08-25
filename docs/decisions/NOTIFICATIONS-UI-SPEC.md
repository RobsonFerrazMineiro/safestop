# Spec UI/UX — Notificações e Responsabilidade Operacional (Sprint 3.1)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 3.1 — Notificações internas + Ciência + Responsáveis  
**Agente:** UIUX  
**Data:** 2026-08-17  
**Entregável:** `docs/decisions/NOTIFICATIONS-UI-SPEC.md`

**PO (fonte oficial):** [`NOTIFICATIONS-DECISIONS.md`](./NOTIFICATIONS-DECISIONS.md) — PO-NOTIF-1…PO-NOTIF-8; Gate G0.

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/notifications.md` §9, §14, §23–24 | Prioridade, ciência ≠ leitura, central, badge dual |
| `docs/design-system.md` | Bell, NotificationCard, Badge, Empty, Dialog |
| `docs/database.md` §7.5, §9.1, §17 | Contatos, participants, notifications |
| `packages/types` `notification.ts` / `organization-contact.ts` | Contratos DTO / helpers |
| `reference/base44` Notifications.jsx / Notification.jsonc | Composição — **não** modelo |

Base44 = composição. PO prevalece. **Sem código apps/packages/supabase nesta entrega UIUX.**  
**Fora 3.1:** Push, e-mail, Realtime, escalonamento visual, `notification_deliveries`.

---

## Objetivo

Especificar sem ambiguidade para WEB/MOBILE:

1. **NOTIF-BELL** — sino header (Web) + badge tab (Mobile): não lidas **e** pendente de ciência
2. **NOTIF-POPOVER** — lista curta (5) + “Ver todas”
3. **NOTIF-CENTER** — Central com filtros oficiais (§23)
4. **NOTIF-ITEM** — card/linha com prioridade, leitura, ciência, CTA ciência
5. **NOTIF-MOBILE** — tela full-width, 1 toque → ocorrência
6. **CONTATO-WEB** — gestão `organization_contacts` (`organization.manage`)
7. **PART-MOBILE** — “Quem está envolvido” (RO) via `occurrence_participants`
8. **PP-FOREMAN** — campo opcional Encarregado (PO-NOTIF-3)
9. Estados vazio / erro / loading / offline + a11y
10. Checklist Base44 + justificativas

---

## Princípios invioláveis

| Regra | Aplicação |
|---|---|
| Fonte oficial | Registro `notifications` no banco — não Push |
| Leitura ≠ ciência | Abrir / `mark_notification_read` **nunca** grava ciência |
| Ciência explícita | Só CTA **Confirmar ciência** → `confirm_notification_awareness` |
| Ciência obrigatória | Só eventos PO-NOTIF-5: `OCCURRENCE_CREATED`, `VER_AND_ACT_REQUIRED`, `INTERDICTION_CONFIRMED` |
| Badge dual | Contador não lidas **separado** de pendente ciência (§24) |
| Deep link | `/stop-work/[occurrenceId]` (canônico 2.9) |
| Sem Push UI | Nenhum toggle de canal push nesta sprint |
| Feature | `features/notifications/` · `features/organization-contacts/` |

---

## Terminologia

| Termo UI | Significado |
|---|---|
| **Notificações** | Nav / título central |
| **Não lida** | `readAt === null` |
| **Pendente de ciência** | `requiresAwareness && awarenessConfirmedAt === null` |
| **Confirmar ciência** | CTA explícito — “Estou ciente” |
| **Responsáveis** | Tela Web de `organization_contacts` |
| **Quem está envolvido** | Lista Mobile RO de `occurrence_participants` |
| **Encarregado da atividade** | `ACTIVITY_FOREMAN` na PP |

**Proibido:** “Marcar como ciente ao abrir”; “Sincronizar”; badges de Push; inventar filtros além de §23.

---

## Guards

```text
canReadNotifications = can("notification.read")

canConfirmAwareness = can("notification.confirm_awareness")

canManageContacts = can("organization.manage") || isPlatformAdmin
  // PO-NOTIF-1 — sem permissão nova
  // Revisado na Sprint 3.4 (QA-B2): Platform Admin passa a ter acesso completo
  // (gestão global), revertendo a exclusão original `&& !isPlatformAdmin`.
```

| Papel | Ver notif | Confirmar ciência | Gerir contatos | Ver envolvidos |
|---|---|---|---|---|
| Papéis com `notification.read` | Sim | Se `confirm_awareness` | Se `organization.manage` | Se `occurrence.read` |
| Platform Admin | Conforme permissões efetivas | Conforme wildcard | **Sim** — gestão global (revisado Sprint 3.4, QA-B2) | RO se `occurrence.read` |

---

# 1. NOTIF-BELL — Sino e badges

## Web — header app

```text
[ … nav … ]   🔔 ①₁₂   ②●₃     [avatar]
                 │        │
                 │        └─ Dot/badge âmbar: pendente ciência (só se > 0)
                 └─ Badge numérico: não lidas (só se > 0; 99+)
```

| Elemento | Spec |
|---|---|
| Ícone | `Bell` (design-system) |
| Badge **não lidas** | Círculo primary/laranja ou vermelho suave; número `unreadCount`; `99+` se > 99 |
| Indicador **ciência** | Dot **separado** (âmbar) **ou** segundo mini-badge com `pendingAwarenessCount` — **nunca** somar os dois num único número |
| Clique | Abre **NOTIF-POPOVER** |
| A11y | `aria-label`: `Notificações, {n} não lidas, {m} pendentes de ciência` |
| Sem permissão | Sino oculto |
| Stale | Refetch 30s (`NOTIFICATION_STALE_TIME_MS`) + invalidate pós-mutation |

## Mobile — tab bar / header

| Opção A (preferida) | Tab **Notificações** com badge no ícone |
| Opção B | Sino no header da Home + tab se existir |

| Elemento | Spec |
|---|---|
| Badge não lidas | Número no ícone tab (padrão RN) |
| Ciência | Dot âmbar sobreposto **ou** segundo indicador no canto do ícone — visualmente distinto |
| Toque | Navega para **NOTIF-MOBILE** (tela completa — sem popover) |
| A11y | Mesmo `accessibilityLabel` dual |

## Contagens (BadgeCounts)

```text
unreadCount            = COUNT where readAt IS NULL
pendingAwarenessCount  = COUNT where requiresAwareness AND awarenessConfirmedAt IS NULL
```

**Fonte de dados (3.1):**

1. Preferência: RPC leve `get_my_notification_badge_counts(orgId)` se DATABASE/BACKEND entregar.
2. Fallback: SELECT agregado nas próprias `notifications` (RLS destinatário) ou derivar da primeira página + query dedicada count.

UI **não** inventa contagem misturando leitura e ciência.

---

# 2. NOTIF-POPOVER — Web (lista curta)

```text
┌─ Notificações ─────────────── Marcar todas ─┐
│ ● Item 1 …                                   │
│ ○ Item 2 …                                   │
│ … até 5 itens                                │
│──────────────────────────────────────────────│
│           Ver todas →                        │
└──────────────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| Largura | ~360–400px; alinhado ao sino |
| Itens | **5** mais recentes (ordem `createdAt` desc) |
| Item UI | Mesmo **NOTIF-ITEM** compacto |
| Marcar todas | Link/botão → `mark_all_notifications_read` — **não** confirma ciência |
| Ver todas | → `/notifications` (Central) |
| Empty | Ícone Bell + NOTIF-C10 |
| Esc / click outside | Fecha |
| Focus | Trap leve; setas entre itens |

---

# 3. NOTIF-CENTER — Central de Notificações

## Web — rota

`/notifications`  
Breadcrumb: `Paralisações` não é pai — usar `Notificações` como root de página.

```text
┌─ Notificações ─────────────────────────────┐
│ 12 não lidas · 3 aguardando ciência        │
│ [Marcar todas como lidas]                  │
│                                            │
│ [Todas][Não lidas][Pend. ciência]          │
│ [Críticas][Interdições][Ver e Agir]        │
│                                            │
│  listagem NOTIF-ITEM …                     │
│  [Carregar mais]                           │
└────────────────────────────────────────────┘
```

## Filtros (§23 — obrigatórios)

| Filtro UI | Critério |
|---|---|
| **Todas** | Sem filtro |
| **Não lidas** | `readAt === null` |
| **Pendentes de ciência** | `requiresNotificationAwareness(item)` |
| **Críticas** | `priority === CRITICAL` |
| **Interdições** | `eventType === INTERDICTION_CONFIRMED` |
| **Ver e Agir** | `eventType === VER_AND_ACT_REQUIRED` |

**Implementação 3.1:** filtros **client-side** sobre páginas carregadas via `list_my_notifications` (cursor). Se filtro ativo e lista vazia mas há mais cursor, auto-fetch até achar itens ou esgotar (com limite de páginas / spinner).  
**Futuro (não bloquear 3.1):** RPC com `filter` server-side.

Chips: um ativo por vez (single-select). Default **Todas**.

## Mobile — NOTIF-MOBILE

Rota: `/(app)/notifications`

| Diferença vs Web | Spec |
|---|---|
| Layout | 1 coluna; chips scroll horizontal |
| Popover | **Ausente** — tab abre direto a central |
| Toque no item | 1 toque → deep link ocorrência (+ mark read) |
| Ciência | Botão no item **ou** sticky no detalhe da ocorrência se ainda pendente |

---

# 4. NOTIF-ITEM — linha / card

```text
┌────────────────────────────────────────────┐
│ 🔴  Paralisação Preventiva registrada      │
│     Área Digestão · SS-26-0042             │
│     há 12 min          ○ Não lida  ⚠ Ciência│
│                         [ Confirmar ciência ]│
└────────────────────────────────────────────┘
```

## Campos

| Campo | Fonte | UI |
|---|---|---|
| Prioridade | `priority` | Cor + ícone (ver tabela) + sr-only label |
| Título | `title` | 1 linha, bold se não lida |
| Resumo | `message` | 1–2 linhas truncate |
| Data | `createdAt` | **Relativa** (`há 5 min`, `ontem`) — tooltip/absolute no hover Web |
| Leitura | `readAt` | Dot preenchido / peso tipográfico; nunca só cor |
| Ciência | `requiresAwareness` / `awarenessConfirmedAt` | Chip `Ciência pendente` / `Ciência confirmada` / ausente se não exige |
| CTA ciência | — | Só se pendente + `canConfirmAwareness` |
| Navegação | `occurrenceId` | Clique corpo → `/stop-work/[id]` |

## Prioridade visual (§9)

| Enum | Label | Cor / ícone |
|---|---|---|
| `CRITICAL` | Crítica | Destructive / AlertOctagon |
| `HIGH` | Alta | Warning / laranja |
| `MEDIUM` | Média | Info / neutro-azul |
| `LOW` | Baixa | Neutro muted |

## Interações

| Ação | Comportamento |
|---|---|
| Abrir ocorrência | `mark_notification_read` (idempotente) **depois** ou em paralelo à navegação; **não** ciência |
| Confirmar ciência | Dialog curto opcional → `confirm_notification_awareness`; toast NOTIF-C20; invalidate list + badge |
| Já ciente | CTA oculto; chip “Ciência confirmada” |
| Sem `requiresAwareness` | Sem chip/CTA ciência |

**Anti-padrão Base44:** clique no card **não** pode ser o único “mark read” sem abrir ocorrência — preferir: abrir ocorrência = read; na central, swipe/botão “Marcar lida” opcional Web.

---

# 5. Ciência — fluxo UX

```text
Recebido (criada)
    → Visualizado / Lida (read_at)     ← abrir ocorrência ou mark read
    → Ciência (awareness_confirmed_at) ← CTA explícito somente
```

| Regra | Spec |
|---|---|
| Dialog confirm | Recomendado para CRITICAL; opcional demais |
| Copy CTA | **NOTIF-C15** `Confirmar ciência` |
| Copy dialog | **NOTIF-C16** |
| Idempotente | Segunda confirmação → sucesso silencioso |
| Forbidden | Toast NOTIF-C31 |
| Offline | Bloquear CTA (Mobile) |

**Onde mostrar CTA ciência pendente após abrir ocorrência:** banner sticky no topo do detalhe `/stop-work/[id]` se existir notificação do usuário para aquela ocorrência ainda pendente — reduz atrito (Mobile First). Mesmo RPC.

---

# 6. CONTATO-WEB — Gestão de responsáveis

**Rota sugerida:** `/settings/responsaveis` ou `/organization/contacts`  
**Nav:** item **Responsáveis** (ou sob Configurações) — só se `canManageContacts`.

```text
┌─ Responsáveis da comunicação ──────────────┐
│ Filtros: [Tipo] [Unidade] [Área] [Contrato]│
│ [ + Novo responsável ]                     │
│                                            │
│ Tabela agrupável por contact_type          │
│ Tipo | Membro | Escopo | Prioridade | Ativo│
└────────────────────────────────────────────┘
```

## Tabela

| Coluna | Spec |
|---|---|
| Tipo | Label PT (`ORGANIZATION_CONTACT_TYPE_LABELS` + Gerenciadora) |
| Membro | `full_name` via `get_organization_member_profiles` (DIV-06) — **nunca** join quebrado |
| Escopo | Unidade / Área / Contrato (chips; “Org” se todos null) |
| Prioridade | Número `priority` (ordem de resolução — exibir; PO-NOTIF-4: **todos** ativos do mesmo tipo são notificados — UI não sugere “só o 1º”) |
| Ativo | Toggle / badge |
| Ações | Editar · Desativar |

## Formulário criar/editar

| Campo | Obrigatório | Controle |
|---|---|---|
| Tipo de contato | Sim | Select (inclui `MANAGING_COMPANY_SUPERVISOR` se contrato com gerenciadora) |
| Membro | Sim | Combobox membros org (`get_organization_member_profiles`) |
| Unidade | Não | Select |
| Área | Não | Select (filtrada por unidade se houver cascata existente) |
| Contrato | Condicional | Obrigatório se tipo Fiscal / Gerenciadora / Gestor Contrato |
| Prioridade | Não | Number default 100 |
| Ativo | — | Default true (create) |

**PO-NOTIF-2:** ao selecionar tipo Supervisão da Gerenciadora, filtrar membros da org `MANAGING_COMPANY` do contrato — ou exigir `organization_id` do contato = gerenciadora (validação server). UI: se contrato sem gerenciadora, tipo desabilitado + hint.

**PO-NOTIF-4 copy:** helper text — “Todos os contatos ativos deste tipo no escopo recebem a notificação.”

**Sem** tela de cadastro de organização Gerenciadora (fora sprint — seed/backoffice).

## Empty / forbidden

| Estado | UI |
|---|---|
| Sem contatos | Empty + CTA Novo |
| Sem `organization.manage` | 403 page / redirect |
| Offline | Mutations disabled |

---

# 7. PART-MOBILE — Quem está envolvido

**Posição no detalhe** `/stop-work/[id]` (Mobile; Web pode reutilizar RO):

Após grid info / antes ou após condição — preferir **após header info**, antes Evidências (consulta rápida).

```text
┌─ Quem está envolvido ──────────────────────┐
│ ● Relator — Maria Silva                    │
│ ● Encarregado da atividade — João Costa    │
│ ● Fiscal do Contrato — …                   │
│ …                                          │
└────────────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| Fonte | `occurrence_participants` + nomes via `get_organization_member_profiles` / payload enriquecido |
| Modo | **Somente leitura** — sem editar participantes na 3.1 |
| Tipos | Labels PT para todos os `participant_type` incl. **ACTIVITY_FOREMAN** → `Encarregado da atividade` |
| Empty | Ocultar seção se lista vazia (improvável — sempre há REPORTER) |
| Web | Opcional mesma seção RO no detalhe |

**Não** confundir com tela de `organization_contacts` (configuração viva ≠ snapshot).

---

# 8. PP-FOREMAN — Encarregado na criação (PO-NOTIF-3)

Inserir em `PREVENTIVE-STOP` form **após Contratada** (e após Contrato se visível):

| Campo | Spec |
|---|---|
| Label | `Encarregado da atividade (opcional)` |
| Controle | Combobox membros da **contratada selecionada** |
| Payload | `activityForemanMemberId` |
| Sem contratada | Campo disabled |
| Não bloqueia | PP &lt;60s — opcional |
| Mobile First | Priorizar no app; Web se formulário PP existir |

---

# 9. Estados

| Estado | Sino / Popover | Central | Contatos | Envolvidos |
|---|---|---|---|---|
| **Loading** | Skeleton ícone / 3 linhas | Skeleton lista 5 | Skeleton tabela | Skeleton 3 rows |
| **Empty** | NOTIF-C10 | Empty Bell + NOTIF-C10 | CONTATO-C10 | Ocultar ou “Sem participantes” |
| **Erro** | Toast + retry no popover | Inline error + Tentar novamente | Idem | Idem |
| **Offline (Mobile)** | Badge stale OK | Lista cached RO; mutations ciência/read **disabled** + NOTIF-C40 | N/A manage | RO OK |
| **Forbidden** | Sino oculto | Página sem acesso | Redirect | Seção ocultar se sem read |

---

# 10. Acessibilidade

| Item | Spec |
|---|---|
| Contraste | Badges prioridade + texto — WCAG AA; não só cor para não-lida/ciência |
| `aria-label` sino | Dual count (acima) |
| Filtros | `role="tablist"` / `aria-selected` nos chips |
| Item | `article` ou listitem; título como heading nível adequado |
| CTA ciência | Botão nomeado; foco após dialog |
| Teclado Web | Tab sino → popover; Enter abre; Esc fecha; setas na lista |
| Touch | Alvos ≥ 44px |

---

# Copy PT — NOTIF-C* / CONTATO-C* / PART-C*

| ID | Contexto | Texto |
|---|---|---|
| **NOTIF-C01** | Título central | `Notificações` |
| **NOTIF-C02** | Subtítulo contagens | `{n} não lidas · {m} aguardando ciência` |
| **NOTIF-C03** | Filtro | `Todas` |
| **NOTIF-C04** | Filtro | `Não lidas` |
| **NOTIF-C05** | Filtro | `Pendentes de ciência` |
| **NOTIF-C06** | Filtro | `Críticas` |
| **NOTIF-C07** | Filtro | `Interdições` |
| **NOTIF-C08** | Filtro | `Ver e Agir` |
| **NOTIF-C09** | Popover link | `Ver todas` |
| **NOTIF-C10** | Empty | `Nenhuma notificação.` |
| **NOTIF-C11** | Marcar todas | `Marcar todas como lidas` |
| **NOTIF-C12** | Chip não lida | `Não lida` |
| **NOTIF-C13** | Chip ciência pendente | `Ciência pendente` |
| **NOTIF-C14** | Chip ciência ok | `Ciência confirmada` |
| **NOTIF-C15** | CTA | `Confirmar ciência` |
| **NOTIF-C16** | Dialog | `Confirma que está ciente desta ocorrência?` |
| **NOTIF-C17** | Banner detalhe | `Confirme ciência desta ocorrência` |
| **NOTIF-C18** | Prioridade sr | `Prioridade {label}` |
| **NOTIF-C19** | Aria sino | `Notificações, {n} não lidas, {m} pendentes de ciência` |
| **NOTIF-C20** | Toast ok ciência | `Ciência confirmada.` |
| **NOTIF-C21** | Toast ok read | `Marcada como lida.` |
| **NOTIF-C30** | Erro genérico | `Não foi possível carregar as notificações.` |
| **NOTIF-C31** | Forbidden | `Você não tem permissão para confirmar ciência.` |
| **NOTIF-C40** | Offline | `Sem conexão. Reconecte para atualizar ou confirmar ciência.` |
| **CONTATO-C01** | Título | `Responsáveis da comunicação` |
| **CONTATO-C02** | CTA novo | `Novo responsável` |
| **CONTATO-C03** | Helper PO-4 | `Todos os contatos ativos deste tipo no escopo recebem a notificação.` |
| **CONTATO-C04** | Tipo Gerenciadora | `Supervisão da Gerenciadora` |
| **CONTATO-C10** | Empty | `Nenhum responsável cadastrado.` |
| **PART-C01** | Título seção | `Quem está envolvido` |
| **PART-C02** | Label foreman | `Encarregado da atividade` |
| **PP-C-FOREMAN** | Label form PP | `Encarregado da atividade (opcional)` |

Títulos de evento (se não vierem prontos do servidor) — preferir `title`/`message` gerados no backend; UI não inventa catálogo paralelo.

---

# 11. Componentes design-system a reutilizar

| Componente | Uso |
|---|---|
| `Bell` icon | Sino / empty |
| Badge / Chip | Prioridade, filtros, ciência |
| NotificationCard (DS) | Base do NOTIF-ITEM |
| Empty | Centrals vazias |
| Dialog / AlertDialog | Confirmar ciência |
| Skeleton | Loading |
| Table (Web) | Contatos |
| Combobox / Select | Membros, filtros |
| Banner | Ciência no detalhe |

---

# 12. Cross-check Base44 vs SafeStop

| Base44 | SafeStop 3.1 | Justificativa |
|---|---|---|
| Lista simples sem filtros | Filtros §23 oficiais | `notifications.md` é fonte |
| Só `read` boolean; clique marca lida | `read_at` + ciência separada | §14 — leitura ≠ ciência |
| Sem indicador ciência | Chip + CTA + badge dual | PO-NOTIF-5 + §24 |
| Prioridade PT enum no entity | Enum `CRITICAL\|HIGH\|…` + label UI | Alinhado database |
| Link `/interdiction/:id` | `/stop-work/[id]` | Rotas canônicas 2.9 |
| Sem popover / sino no Dashboard | Sino header + popover 5 itens | DS + mobile-first operacional |
| Sem gestão de contatos | Tela CONTATO-WEB | Responsabilidade operacional real |
| Notificação criada no client no create/release | Só servidor SECURITY DEFINER | Atomicidade arquitetural |
| Data absoluta `DD/MM/YYYY HH:mm` | Relativa + absolute acessível | Campo / mobile |
| Sem empty a11y rico | Empty + aria dual badge | Aceite a11y |
| “Ver” link separado | Corpo clicável + CTA ciência | Menos toques |

---

# 13. Critérios de aceite

1. Web: sino com contagem não lidas **e** indicador separado de ciência.
2. Mobile: badge dual no tab/header; tela central 1 coluna.
3. Popover ≤5 itens + Ver todas + Marcar todas (**sem** ciência em massa).
4. Central com os 6 filtros de §23.
5. Item: prioridade, título, resumo, data relativa, leitura, ciência, CTA quando aplicável.
6. Confirmar ciência nunca dispara só por abrir/ler.
7. Deep link para `/stop-work/[id]`.
8. Web: CRUD contatos com membro via `get_organization_member_profiles`; tipo Gerenciadora quando aplicável.
9. Mobile: seção RO “Quem está envolvido” com Encarregado se existir.
10. PP: campo opcional Encarregado pós-contratada.
11. Empty / erro / loading / offline especificados.
12. A11y: aria-labels, teclado popover, contraste.
13. Divergências Base44 documentadas e justificadas.
14. WEB/MOBILE implementáveis **sem** decisões de design pendentes.

---

# Checklist implementação

### Notificações
- [ ] NOTIF-BELL Web + Mobile  
- [ ] BadgeCounts dual  
- [ ] NOTIF-POPOVER (5 + ver todas)  
- [ ] NOTIF-CENTER + 6 filtros  
- [ ] NOTIF-ITEM + CTA ciência  
- [ ] Banner ciência no detalhe  
- [ ] Offline bloqueia mutations  

### Responsabilidade
- [ ] CONTATO-WEB tabela + form  
- [ ] PART-MOBILE envolvidos  
- [ ] PP-FOREMAN opcional  

### Proibido
- [ ] Sem Push UI  
- [ ] Sem auto-ciência  
- [ ] Sem liberação/escalonamento visual  

---

## Cross-check PO

| Tema | PO / Doc | Spec | Status |
|---|---|---|---|
| Ciência 3 eventos | PO-NOTIF-5 | CTA só se `requiresAwareness` | Alinhado |
| Contatos = `organization.manage` | PO-NOTIF-1 | CONTATO-WEB guards | Alinhado |
| Gerenciadora tipo contato | PO-NOTIF-2 | CONTATO-C04 + form | Alinhado |
| Encarregado PP | PO-NOTIF-3 | PP-FOREMAN + PART | Alinhado |
| Todos contatos ativos | PO-NOTIF-4 | CONTATO-C03 | Alinhado |
| ACTION_DUE | PO-NOTIF-6 | Item lista quando existir evento (sem ciência) | Alinhado UX |
| Sem retenção UI | PO-NOTIF-8 | Sem filtro “expiradas” | Alinhado |
| Central / badge | notifications §23–24 | NOTIF-CENTER / BELL | Alinhado |

---

## Hand-off

| De | Para |
|---|---|
| UIUX | WEB — sino, popover, central, contatos, banner ciência |
| UIUX | MOBILE — tab/badge, central, envolvidos, PP foreman |
| UIUX | DOCS — patch PREVENTIVE-STOP-UI-SPEC (campo foreman) na mesma sprint se desejado |
| QA | Badge dual, ciência ≠ read, filtros, offline, Base44 gaps |

```text
UIUX — NOTIFICATIONS-UI-SPEC.md
Sprint 3.1
Data: 2026-08-17
Status: PRONTO PARA IMPLEMENTAÇÃO
DoD: bell/badge dual + central + ciência + contatos Web + envolvidos Mobile + Base44
```
