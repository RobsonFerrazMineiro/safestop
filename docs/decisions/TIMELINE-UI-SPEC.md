# Spec UI/UX — Comentários e Timeline (Sprint 2.3)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 2.3 — Comentários e Timeline da Ocorrência  
**Agente:** UIUX  
**Data:** 2026-08-01  
**Entregável:** `docs/decisions/TIMELINE-UI-SPEC.md`

**PO (fonte oficial):** [`TIMELINE-DECISIONS.md`](./TIMELINE-DECISIONS.md) — PO-1…PO-15; Gate G0.  
**Evidências (acima):** [`EVIDENCE-UI-SPEC.md`](./EVIDENCE-UI-SPEC.md) — **não redesenhar**.  
**Decisão / MDHO (entre Evidências e Timeline):** [`VER-E-AGIR-UI-SPEC.md`](./VER-E-AGIR-UI-SPEC.md) (2.4) + [`INTERDICAO-OFICIAL-UI-SPEC.md`](./INTERDICAO-OFICIAL-UI-SPEC.md) (2.5) + [`MDHO-UI-SPEC.md`](./MDHO-UI-SPEC.md) (2.6).

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/decisions/TIMELINE-DECISIONS.md` | Regras PO; kinds; RBAC; paginação |
| `packages/types/src/occurrence-timeline.ts` | DTO `OccurrenceTimelineItem` |
| `reference/base44/src/pages/InterdictionDatail.jsx` | Feed + composer |
| `apps/web/.../stop-work-timeline.tsx` | **Substituído** por `OccurrenceTimeline` |
| `docs/design-system.md` | Timeline, TimelineItem, Dialog, Bottom Sheet, Empty, Skeleton |
| `docs/decisions/EVIDENCE-UI-SPEC.md` | Bloco evidências + preview signed URL |

Base44 = composição. PO + este spec prevalecem. Conflito PO vs UI → **PO vence**.

---

## Objetivo

Entregar wireframes/spec do **detalhe PP** (web + mobile) com timeline unificada e comentários, para WEB e MOBILE implementarem **sem ambiguidade**.

---

## Princípios invioláveis

| Regra | Aplicação |
|---|---|
| Plain text | Conteúdo **escapado**; **sem** markdown/HTML render |
| Sem “Responsáveis notificados” | PO-14 — não inventar kind/evento |
| Sem Realtime indicator | PO-15 — refresh manual / invalidação query |
| Sem thread/reply | Lista plana |
| Sem toggle interno | PO-10 |
| Labels DS | Títulos de seção uppercase pequenas + tracking (padrão Base44 FieldLabel) |
| Read model | Consumir RPC; **não** UNION no cliente |
| Deprecar | `StopWorkTimeline` como feed principal |

---

## DTO (contrato visual)

```text
OccurrenceTimelineItem {
  id: string
  kind: OccurrenceTimelineEventKind
  occurredAt: string          // ISO
  actorId: string | null
  actorName: string | null
  title: string               // server/DTO — UI aplica variantes abaixo
  body: string | null         // plain text; null em COMMENT_REMOVED
  metadata: {
    isEdited?: boolean        // PO-5
    isRemoved?: boolean       // PO-4
    attachmentId?: string     // EVIDENCE_*
    originalFileName?: string
    commentId?: string
    ...
  }
}
```

Paginação: `nextCursor` | `hasNextPage` equivalente; page size default **30**; ordem **`occurredAt DESC`, `id DESC`** (PO-12).

staleTime query: **30s** (PO-15).

---

## Ordem vertical do detalhe (PO-11) — obrigatória

Atualizada pelas Sprints **2.4–2.6** (Decisão da Liderança + MDHO). Specs: [`VER-E-AGIR-UI-SPEC.md`](./VER-E-AGIR-UI-SPEC.md), [`INTERDICAO-OFICIAL-UI-SPEC.md`](./INTERDICAO-OFICIAL-UI-SPEC.md), [`MDHO-UI-SPEC.md`](./MDHO-UI-SPEC.md).

```text
1. Header — código SS-* + status badge (+ criticidade)
2. Grid info — área, local, atividade, autor, datas
3. Condição insegura (+ medida imediata se houver)
4. Evidências — EvidenceSection 2.2 (galeria 80×80) — NÃO redesenhar
5. Decisão da Liderança — 2.4 VA + 2.5 IO (start / forms / summary) — NÃO fundir com timeline
6. Avaliação Técnica (MDHO) — Sprint 2.6 (somente ramo IO) — NÃO fundir com timeline
7. Título seção — "LINHA DO TEMPO" (uppercase pequena)
8. OccurrenceTimeline — lista de itens
9. "Carregar mais" — se hasNextPage / nextCursor
10. CommentComposer — textarea + botão Enviar
```

**Web e mobile:** mesma ordem stack. Composer **não** fica em painel lateral sticky como fluxo primário.

---

# Wireframes

## Mobile — detalhe PP (visão completa)

```text
┌──────────────────────────────────────┐
│ ←  SS-26-000154                      │
│     [Paralisação Preventiva] [Alta]  │  (1) Header
│                                      │
│ ┌─ Info ───────────────────────────┐ │  (2) Grid
│ │ Área / Local / Atividade         │ │
│ │ Autor / Abertura / Parada        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ CONDIÇÃO INSEGURA                    │  (3)
│ Texto plain…                         │
│                                      │
│ EVIDÊNCIAS                     2     │  (4) EvidenceSection 2.2
│ [80][80][+] →                        │
│                                      │
│ DECISÃO DA LIDERANÇA                 │  (5) 2.4 VA + 2.5 IO
│                                      │
│ AVALIAÇÃO TÉCNICA (MDHO)             │  (6) Sprint 2.6 — só ramo IO
│                                      │
│ LINHA DO TEMPO                       │  (7–8)
│                                      │
│ ● Paralisação registrada      18:40  │  DESC
│   Ana Souza                          │
│                                      │
│ 💬 Ana Souza                   18:35 │
│   Texto do comentário…               │
│   18:35 (editado)              [⋮]   │
│                                      │
│ 📷 foto-01.jpg                18:20 │
│   tap → preview 2.2                  │
│                                      │
│ [ Carregar mais ]                    │  (9)
│                                      │
│ (padding para composer fixo)         │
├──────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌──────┐ │  (10) sticky + KAV
│ │ Adicionar comentário... │ │Enviar│ │
│ └─────────────────────────┘ └──────┘ │
│         Safe Area                    │
└──────────────────────────────────────┘
```

Composer mobile: **barra fixa inferior** + `KeyboardAvoidingView` (PO-11).

## Web — detalhe PP

```text
┌─ Sidebar ─┬────────────────────────────────────────────┐
│ …         │ Paralisação Preventiva > SS-26-000154      │
│           │                                            │
│           │ [Header código + badges]                   │
│           │ [Grid info 2 cols]                         │
│           │ [Condição insegura]                        │
│           │ [Evidências — galeria 2.2]                 │
│           │ [Decisão da Liderança — 2.4 VA + 2.5 IO]   │
│           │ [Avaliação Técnica (MDHO) — 2.6 / só IO]   │
│           │                                            │
│           │ LINHA DO TEMPO              [Atualizar]    │
│           │ ● … itens DESC …                           │
│           │ [ Carregar mais ]                          │
│           │                                            │
│           │ ADICIONAR COMENTÁRIO                       │
│           │ ┌────────────────────────────────────────┐ │
│           │ │ textarea                               │ │
│           │ └────────────────────────────────────────┘ │
│           │ 0/2000                          [ Enviar ] │
└───────────┴────────────────────────────────────────────┘
```

Composer web: **abaixo** da timeline, no fluxo do documento (não drawer lateral primário).

---

# TL-ITEM — Variantes por `OccurrenceTimelineEventKind`

Layout comum (todos os kinds):

```text
[ rail / bullet ]  Título principal
                   Body (se houver)
                   Meta: autor · timestamp [badge]
                   Ações (se houver)
```

| kind | Ícone | Título (UI) | Body | Cor da linha / rail | Interação |
|---|---|---|---|---|---|
| `OCCURRENCE_CREATED` | ● (dot filled) | **Paralisação registrada** | — | **Laranja** SafeStop `#F97316` | Nenhuma |
| `STATUS_CHANGED` | ● | **Label do status** (`title` DTO / `formatOccurrenceStatus`) | `body` se motivo | **Laranja** `#F97316` | Nenhuma |
| `COMMENT_ADDED` | MessageSquare / 💬 | **Nome do autor** (`actorName` ou “Usuário”) | Texto plain `body` (escaped) | **Cinza** rail `#4B5563` / border muted | Menu Editar / Remover se permitido |
| `COMMENT_REMOVED` | Trash / 🗑 | **Comentário removido** | **Não exibir** texto original | **Muted** `#6B7280` | Nenhuma ação de edição |
| `EVIDENCE_ADDED` | Camera / 📷 | **Nome do arquivo** (`metadata.originalFileName` ou `title`) | caption opcional | Cinza / informação | **Tap → preview** fluxo 2.2 |
| `EVIDENCE_REMOVED` | Camera / 📷 + **strikethrough** no título | **Evidência removida** | nome arquivo muted opcional | **Muted** | Sem preview obrigatório |
| `SYSTEM` | — | Reservado | — | — | **Não renderizar** na 2.3 se aparecer vazio |

### Detalhes por kind

#### OCCURRENCE_CREATED
- Preferir copy curta **Paralisação registrada** (contrato visual).
- Se DTO enviar `Paralisação Preventiva registrada`, aceitar — não duplicar com `STATUS_CHANGED`.
- Meta: `actorName` · `occurredAt`.

#### STATUS_CHANGED
- Título = label oficial do status de destino (nunca enum cru).
- Rail laranja igual ao create (continuidade operacional).

#### COMMENT_ADDED
- Título = autor; body = conteúdo.
- **PO-5:** se `metadata.isEdited === true` → badge **`(editado)`** ao lado do **timestamp** — **nunca** segundo item na lista.
- Exemplo meta: `01/08/2026 18:35 (editado)`.

#### COMMENT_REMOVED (PO-4)
- Título fixo: `Comentário removido`.
- Body oculto.
- Meta: quem removeu (`deleted_by` / actor) · quando, se disponível.
- Estilo visual reduzido (opacidade / muted).

#### EVIDENCE_ADDED
- Thumb opcional 40–48px **ou** só ícone + nome arquivo (mobile-first: ícone + nome ok; thumb se barato).
- Tap: abrir **mesmo** preview da EvidenceSection (`useEvidenceSignedUrl` / EV-PREVIEW 2.2) com `attachmentId`.
- Não baixar URL pública; signed URL sob demanda.

#### EVIDENCE_REMOVED
- Título strikethrough ou label `Evidência removida` + nome arquivo muted.
- Sem abrir preview se arquivo soft-deleted sem URL.

---

# CommentComposer

## Campos

| Prop | Valor |
|---|---|
| Controle | Textarea (web e mobile) — não input single-line no web |
| Placeholder | `Adicionar comentário...` |
| CTA | `Enviar` (primary; mobile pode ser ícone Send + `accessibilityLabel="Enviar"`) |
| Contador | `n/2000` (web obrigatório; mobile recomendado perto do limite) |
| Máx. | **2000** (PO-2); trim; mínimo 1 não-branco |
| Tipo | Sempre `GENERAL` — sem seletor (PO-13) |
| Interno | Sem toggle (PO-10) |

## Disabled / oculto

Composer **desabilitado** (não enviar) quando:

| Condição | Copy auxiliar (abaixo ou aria) |
|---|---|
| Sem `occurrence.read` / sem access | Composer oculto |
| Status `ENCERRADA` ou `CANCELADA` (PO-6) | `Não é possível comentar em ocorrência encerrada ou cancelada.` |
| Offline (mobile) | `Você está offline. Conecte-se para comentar.` |
| Mutation pending | CTA `Enviando...`; anti double-submit |
| Texto vazio / só espaços | CTA disabled (sem mensagem) |

`LIBERADA`: composer **habilitado**.

Rascunho: memória de sessão ok; **sem** fila offline persistente (fora 2.3).

## Layout

| Plataforma | Comportamento |
|---|---|
| **Mobile** | Barra fixa inferior; `KeyboardAvoidingView`; padding bottom na lista |
| **Web** | Bloco abaixo do load more; label seção `ADICIONAR COMENTÁRIO` (uppercase pequena) |

Enter no web: **não** enviar no Enter puro em textarea — usar botão `Enviar` (evita acidentes). Mobile: botão Enviar.

Pós-sucesso: limpar campo; invalidar query timeline; item novo aparece no topo (DESC). **Sem** optimistic update (fora de escopo). Toast opcional curto `Comentário enviado`.

---

# Edição de comentário (PO-5 / PO-7)

| Item | Spec |
|---|---|
| Entrada | Menu ⋮ / “Editar” no item `COMMENT_ADDED` |
| Visível se | Autor + ≤24h desde `created_at` + não removido + status ≠ ENCERRADA/CANCELADA |
| UI | Inline expand no item **ou** sheet/dialog com textarea pré-preenchida |
| Limite | 2000; mesmos placeholders de validação |
| Cancelar | Descarta alterações |
| Salvar | CTA `Salvar`; loading `Salvando...` |
| Sucesso | Fecha editor; badge `(editado)` no **mesmo** item |
| Erro janela | `O prazo para editar este comentário expirou.` |

**Não** criar evento `COMMENT_EDITED` na lista.

---

# Remoção de comentário (PO-4 / PO-8)

## Quem vê a ação

- Autor **ou** usuário com `occurrence.cancel` na org.
- Bloqueado em ENCERRADA/CANCELADA.

## Confirmação

| Plataforma | Padrão |
|---|---|
| **Web** | Dialog / AlertDialog |
| **Mobile** | ActionSheet ou Alert nativo |

### Copy

```text
Remover comentário?

O texto deixará de ser exibido. A timeline mostrará
"Comentário removido" para manter a rastreabilidade.

[ Cancelar ]     [ Remover ]
```

- `Remover` = variante **destructive**.
- Após sucesso: item vira variante `COMMENT_REMOVED` (ou some o body e aplica kind removido conforme RPC refetch).

---

# Estados da seção Timeline

## Loading (inicial)

Skeleton **3** linhas (altura ~56–64px cada), rail + barra de título + meta — espelhar estrutura real (DS Skeleton).

**Não** deixar tela vazia só com spinner sem estrutura.

Copy acessível (sr-only / status):

```text
Carregando linha do tempo…
```

## Empty

Lista vazia da RPC (raro — costuma haver create):

```text
Nenhum evento na linha do tempo ainda.
```

Composer permanece se PO-6 permitir.

## Error

```text
Não foi possível carregar a linha do tempo.

Verifique sua conexão e tente novamente.

[ Tentar novamente ]
```

## Load more

| Estado | UI |
|---|---|
| `hasNextPage` | Botão full-width ou centrado: `Carregar mais` |
| Loading next | Botão disabled + spinner; **não** limpar itens já carregados |
| Sem next | Ocultar botão |
| Erro next | Toast/inline: `Não foi possível carregar mais eventos.` + retry no botão |

## Offline (seção)

Banner discreto opcional:

```text
Você está offline. A timeline pode estar desatualizada.
```

Composer disabled (copy acima). Pull-to-refresh quando voltar online.

## Refresh (PO-15)

| Plataforma | Ação |
|---|---|
| Mobile | Pull-to-refresh no detalhe |
| Web | Botão opcional `Atualizar` no header da seção |
| Pós create/edit/delete comment | Invalidar `occurrenceQueryKeys.timeline(...)` |
| Realtime badge | **Proibido** |

---

# Copy PT — catálogo completo

| ID | Contexto | Texto |
|---|---|---|
| C01 | Seção | `Linha do Tempo` (UI display); label uppercase `LINHA DO TEMPO` |
| C02 | Composer label | `Adicionar comentário` |
| C03 | Placeholder | `Adicionar comentário...` |
| C04 | CTA enviar | `Enviar` |
| C05 | CTA enviando | `Enviando...` |
| C06 | Editado | `(editado)` |
| C07 | Removido título | `Comentário removido` |
| C08 | Create título | `Paralisação registrada` |
| C09 | Evidence removed | `Evidência removida` |
| C10 | Confirm title | `Remover comentário?` |
| C11 | Confirm body | `O texto deixará de ser exibido. A timeline mostrará "Comentário removido" para manter a rastreabilidade.` |
| C12 | Confirm action | `Remover` |
| C13 | Confirm cancel | `Cancelar` |
| C14 | Load more | `Carregar mais` |
| C15 | Loading a11y | `Carregando linha do tempo…` |
| C16 | Empty | `Nenhum evento na linha do tempo ainda.` |
| C17 | Error | `Não foi possível carregar a linha do tempo.` |
| C18 | Error hint | `Verifique sua conexão e tente novamente.` |
| C19 | Retry | `Tentar novamente` |
| C20 | Offline composer | `Você está offline. Conecte-se para comentar.` |
| C21 | Offline banner | `Você está offline. A timeline pode estar desatualizada.` |
| C22 | Status block | `Não é possível comentar em ocorrência encerrada ou cancelada.` |
| C23 | Edit expired | `O prazo para editar este comentário expirou.` |
| C24 | Delete forbidden | `Você não tem permissão para remover este comentário.` |
| C25 | Max length | `Máximo de 2000 caracteres.` |
| C26 | Load more error | `Não foi possível carregar mais eventos.` |
| C27 | Edit action | `Editar` |
| C28 | Delete action | `Remover` |
| C29 | Save edit | `Salvar` |
| C30 | Saving | `Salvando...` |
| C31 | Refresh web | `Atualizar` |
| C32 | Toast ok (opc.) | `Comentário enviado` |

**Proibido:** qualquer copy com “Responsáveis notificados”, “ciência confirmada”, “alertas enviados” na timeline.

---

# Acessibilidade

| Requisito | Implementação |
|---|---|
| Seção | `accessibilityRole="summary"` / heading `Linha do Tempo` |
| Lista | `list` / `listitem` (web: `ul`/`li`; RN: anunciar contagem) |
| Item | Label: `{título}, {autor}, {data}, {estado editado/removido}` |
| Comentário body | Texto selecionável; plain |
| Badge editado | Não só cor — texto `(editado)` |
| Removido | Não só opacidade — título explícito |
| Composer | `label` / `accessibilityLabel` no textarea; CTA com nome |
| Disabled | `accessibilityState.disabled`; copy de motivo visível ou `accessibilityHint` |
| Dialog remoção | Foco no dialog; ESC/Cancelar devolve foco; botão destrutivo anunciado |
| ActionSheet mobile | Opções com labels claras |
| Contraste | Texto body e meta ≥ contraste DS; rail laranja + texto não é único indicador de kind |
| Toque | Ações Editar/Remover ≥ 44×44 |
| Evidência | Tile/linha `Evidência {nome do arquivo}, tocar para ampliar` |
| Load more | Botão com estado busy anunciado |
| Redução de movimento | Skeleton sem flash agressivo |

Cor **nunca** é o único diferenciador entre kinds (ícone + título + rail).

---

# Tokens / componentes DS

| Uso | Token / componente |
|---|---|
| Rail status/create | `primary` `#F97316` |
| Rail comentário | gray 500/600 |
| Removido / muted | gray 500 + opacity |
| Seção label | Caption/Badge 12px weight 600 uppercase tracking |
| Dialog remoção | Alert Dialog destructive |
| Sheet mobile ações comentário | Bottom Sheet / ActionSheet |
| Skeleton | 3 placeholders |
| Empty / Error | EmptyState + Button secondary |
| Ícones lucide | `MessageSquare`, `Camera`, `Trash2`, `Send`, `MoreVertical`, `Clock3` |

---

# Adaptação Base44 → SafeStop

| Base44 | SafeStop 2.3 |
|---|---|
| Events genéricos + comentários mistos | Kinds tipados + RPC unificada |
| Input + ícone enviar | Textarea + `Enviar` + 2000 |
| Composer no card após timeline | Mantém ordem; mobile sticky + KAV |
| Sem edit badge | `(editado)` no timestamp |
| Hard feel de delete | Soft → `Comentário removido` |
| Sem evidências no feed | `EVIDENCE_*` derivados + preview 2.2 |
| Sem load more | Cursor + `Carregar mais` |
| Notified events | **Omitidos** (PO-14) |

**Substituir:** `StopWorkTimeline` (só status history).

---

# Preview evidência na timeline (AC)

Tap em `EVIDENCE_ADDED` → **mesmo fluxo** de [`EVIDENCE-UI-SPEC.md`](./EVIDENCE-UI-SPEC.md) § EV-PREVIEW:

1. Resolver `attachmentId` no metadata.
2. Obter signed URL (hook/serviço 2.2).
3. Abrir modal/fullscreen preview.
4. Não persistir URL; não usar path público.

---

# Critérios de aceite

1. **PO-11 (+ 2.4):** ordem Header → Info → Condição → Evidências → Ver e Agir → Linha do Tempo → Load more → Composer.
2. **PO-12:** feed DESC; load more 30; botão só com next page.
3. **PO-4:** removido mostra `Comentário removido` **sem** body original.
4. **PO-5:** editado = badge `(editado)` no timestamp; **sem** segundo evento.
5. Variantes visuais por kind conforme tabela (ícone, título, cor rail).
6. Composer: placeholder `Adicionar comentário...`; disabled sem read / ENCERRADA|CANCELADA / offline; mobile sticky + KAV.
7. Confirmação remoção: Dialog web / ActionSheet mobile; copy C10–C13; ação destrutiva.
8. Estados: empty, loading skeleton **3**, error+retry, load more — copy PT do catálogo.
9. Plain text escaped; sem markdown/HTML.
10. Sem eventos notificados; sem Realtime indicator; sem threads.
11. Preview evidência reutiliza fluxo 2.2.
12. A11y: labels, disabled state, contraste, toque.
13. `LIBERADA` permite comentar; `ENCERRADA`/`CANCELADA` não.
14. Editar ≤24h autor; remover autor ou `occurrence.cancel`.

---

# Checklist MASTER (revisão pré WEB/MOBILE)

- [ ] PO-4 removido — linha auditável sem texto original  
- [ ] PO-5 editado — badge, sem 2º evento  
- [ ] PO-11 ordem vertical completa (9 passos; inclui Ver e Agir 2.4)  
- [ ] PO-12 DESC + load more  
- [ ] PO-14 sem notificados  
- [ ] PO-15 sem Realtime  
- [ ] Evidências 2.2 acima; Ver e Agir 2.4; não redesenhar esses blocos  
- [ ] Copy PT completa  
- [ ] A11y coberta  
- [ ] WEB/MOBILE sem ambiguidade de campos/estados  

---

# Checklist implementação

### Timeline
- [ ] Seção após EvidenceSection  
- [ ] Skeleton 3  
- [ ] Empty / error / retry  
- [ ] Load more  
- [ ] Variantes por kind  
- [ ] Badge (editado)  
- [ ] COMMENT_REMOVED  
- [ ] EVIDENCE_ADDED → preview 2.2  
- [ ] Pull-to-refresh / Atualizar  

### Composer
- [ ] Placeholder C03  
- [ ] Contador 2000  
- [ ] Disabled rules + copy  
- [ ] Mobile sticky + KeyboardAvoidingView  
- [ ] Web abaixo da lista  

### Comentário ações
- [ ] Editar (24h)  
- [ ] Remover + confirm destrutiva  
- [ ] Invalidação query  

### Fora de escopo (não fazer)
- [ ] Markdown/HTML  
- [ ] Threads / reply  
- [ ] Toggle interno  
- [ ] Notificações na timeline  
- [ ] Realtime indicator  
- [ ] Código fora desta spec (UIUX não altera apps)  

---

## Riscos

| Risco | Mitigação |
|---|---|
| Título DTO ≠ “Paralisação registrada” | Mapear kind `OCCURRENCE_CREATED` na UI para C08 |
| COMMENT_ADDED com title genérico do server | Preferir `actorName` como título visual |
| Usuário espera chat | Sem UI de reply; lista plana |
| Preview evidência divergente | Reutilizar exclusivamente fluxo 2.2 |

---

## Hand-off

| De | Para |
|---|---|
| UIUX (este doc) | MASTER revisão |
| MASTER aprova | WEB ∥ MOBILE |
| Entrada | G0 + DTO `OccurrenceTimelineItem` |
| Saída | Spec aprovada → implementação `features/timeline/` |

```text
UIUX — TIMELINE-UI-SPEC.md
Sprint 2.3
Data: 2026-08-01
Status: PRONTO PARA REVISÃO MASTER → WEB ∥ MOBILE
DoD: spec completa; sem alteração de código
```
