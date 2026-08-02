# Decisões — Comentários e Timeline da Ocorrência (Sprint 2.3)

**Status:** `APROVADO`  
**Sprint:** 2.3 — Comentários e Timeline da Ocorrência  
**Data:** 2026-08-01  
**Etapa:** 0 — Produto (agente MASTER / DOCS)  
**Gate:** **G0 desbloqueado** — libera DATABASE (Etapa 1) e BACKEND (Etapa 2)

**Arquitetura base:** Sprint 2.3 — Comentários e Timeline da Ocorrência (2026-08-01, aprovada)

**Fundação:** Sprint 2.0 (Occurrences) + 2.1 (PP) + 2.2 (Evidências)

**Modelo de dados:** `docs/database.md` §11–12 — **não reescrever**; este documento referencia e complementa.

**Spec UI:** [`TIMELINE-UI-SPEC.md`](./TIMELINE-UI-SPEC.md)

---

## Objetivo

Registrar as decisões de produto **PO-1 a PO-15** da Sprint 2.3 **sem inventar regra de negócio**, usando como fonte primária:

- arquitetura Sprint 2.3;
- `docs/workflow.md` §3.1, §19;
- `docs/database.md` §11.1, §12.1;
- `docs/decisions/EVIDENCE-DECISIONS.md` (evidências derivadas na timeline);
- `docs/roadmap.md` Sprint 3 (notificações **fora** desta sprint).

---

## Decisão arquitetural central (não redesenhar)

| Item | Decisão |
|---|---|
| **Tabela `occurrence_timeline`** | **Não criar** — rejeitada (duplicaria status/comments/evidence) |
| **Fontes persistidas** | `occurrence_status_history`, `occurrence_comments`, `occurrence_attachments`, metadados de `occurrences` |
| **Read model** | RPC **`get_occurrence_timeline(occurrence_id, cursor?, limit?)`** — `UNION ALL` server-side |
| **DTO** | `OccurrenceTimelineItem` normalizado (kind, occurredAt, actor, title, body, metadata) |

---

## Gate G0

| Item | Estado |
|---|---|
| **G0 — Etapa 0 PO** | **Desbloqueado** (2026-08-01) |
| **Desbloqueia** | DATABASE (schema + RLS + RPC timeline draft) e BACKEND (RPCs comentários) |
| **Critério** | PO-1…PO-15 sem ambiguidade; implementação validável contra este documento |
| **Paralelo permitido** | UIUX wireframes após contrato DTO acordado |

Ordem oficial: **Etapa 0 DOCS → DATABASE → BACKEND → types/validation → UIUX ∥ → WEB ∥ MOBILE → BUILD → SECURITY → QA → COMMIT**.

---

## Decisões aprovadas

### PO-1 — Quem pode comentar?

| Item | Decisão |
|---|---|
| **Permissão** | **`occurrence.read`** na organização da ocorrência **+** `can_access_occurrence(occurrence_id)` |
| **Não exigir** | `occurrence.create` — restringiria papéis com read operacional (gestor, fiscal, etc.) |
| **Fonte** | `docs/workflow.md` §3.1 — papéis com escopo de leitura podem acompanhar e comentar conforme matriz RBAC |

---

### PO-2 — Tamanho máximo do conteúdo

| Item | Decisão |
|---|---|
| **Limite** | **2000** caracteres (trim aplicado) |
| **Validação** | Zod client + CHECK/RPC server |
| **Mínimo** | 1 caractere não-branco |

---

### PO-3 — Histórico de edições de comentário

| Item | Decisão |
|---|---|
| **Modelo 2.3** | Colunas **`edited_at`**, **`edited_by`** na mesma linha — **sem** tabela `comment_edits` |
| **UI** | Badge ou indicador **"(editado)"** quando `edited_at IS NOT NULL` |
| **Futuro** | Tabela de auditoria de edições — sprint dedicada se produto exigir |

---

### PO-4 — Comentário removido na timeline

| Item | Decisão |
|---|---|
| **Exibição** | **Mostrar** evento/linha **"Comentário removido"** (auditável) |
| **Conteúdo original** | **Não** exibir texto após soft delete |
| **Metadata** | `isRemoved: true`; autor da remoção quando disponível (`deleted_by`) |
| **Fonte** | `docs/database.md` §12 — exclusão lógica; comentários críticos permanecem no histórico |

---

### PO-5 — Evento separado `COMMENT_EDITED` na timeline

| Item | Decisão |
|---|---|
| **Abordagem** | **Badge "editado"** no item `COMMENT_ADDED` — **não** emitir segundo evento na timeline |
| **Metadata** | `isEdited: true` quando `edited_at IS NOT NULL` |

---

### PO-6 — Comentar em ocorrência encerrada/cancelada

| Item | Decisão |
|---|---|
| **Status bloqueados** | **`ENCERRADA`**, **`CANCELADA`** — criar/editar comentário **proibido** na RPC |
| **`LIBERADA`** | Comentar **permitido** na 2.3 (thread operacional ainda ativa) |
| **Validação** | Server-side na RPC — não apenas UI |
| **Paralelo** | Alinhado a bloqueios parciais de evidência (`EVIDENCE-DECISIONS` PO-13) |

---

### PO-7 — Janela de edição do comentário

| Item | Decisão |
|---|---|
| **Regra** | Autor pode editar **até 24 horas** após `created_at` |
| **Após 24h** | RPC `update_occurrence_comment` retorna `FORBIDDEN` |
| **Excluir edição** | Proibida se `deleted_at IS NOT NULL` ou `comment_type != GENERAL` |

---

### PO-8 — Quem pode remover comentário

| Item | Decisão |
|---|---|
| **Autor** | Sim — `author_id = auth.uid()` |
| **Supervisor HSE** | Sim — quem possui **`occurrence.cancel`** na org (matriz RBAC aprovada) |
| **Permissão dedicada** | **Não inventar** `comment.delete` |
| **Status** | Respeitar PO-6 (bloqueio em ENCERRADA/CANCELADA) |

---

### PO-9 — `SYSTEM_NOTE` persistido vs virtual

| Item | Decisão |
|---|---|
| **Sprint 2.3** | Eventos de sistema **derivados virtualmente** na RPC timeline — **sem** INSERT de linhas `SYSTEM_NOTE` |
| **Exceção futura** | Materializar apenas se produto exigir auditoria separada |

---

### PO-10 — Comentários internos (`is_internal`)

| Item | Decisão |
|---|---|
| **Escopo 2.3** | **Fora** — coluna pode existir na migration com default `false`; **sem** filtro RLS por papel |
| **UI** | Não expor toggle "interno" na 2.3 |
| **Futuro** | RLS restritiva a papéis HSE quando produto ativar |

---

### PO-11 — Posição do composer (web)

| Item | Decisão |
|---|---|
| **Layout** | **Abaixo da timeline** — stack vertical mobile-first |
| **Não usar** | Painel lateral sticky desktop como fluxo primário |
| **Mobile** | Barra/composer fixo inferior com `KeyboardAvoidingView` |

---

### PO-12 — Ordenação do feed

| Item | Decisão |
|---|---|
| **Ordem** | **`occurred_at DESC`** — mais recente primeiro (padrão Base44) |
| **Desempate** | `id DESC` |
| **Paginação** | Cursor `(occurred_at, id)`; default **30** itens por página |

---

### PO-13 — Tipos de comentário (`comment_type`)

| Item | Decisão |
|---|---|
| **Sprint 2.3** | Apenas **`GENERAL`** criável pelo usuário |
| **Demais tipos** | Reservados (`CORRECTION_UPDATE`, `HSE_NOTE`, etc.) — sprints workflow futuras |
| **Sistema** | Não editável quando existir (`docs/database.md` §12) |

---

### PO-14 — Notificações na timeline

| Item | Decisão |
|---|---|
| **Escopo** | **Fora da 2.3** — Sprint 3 (`docs/roadmap.md`) |
| **UI** | **Não** exibir eventos "responsáveis notificados" / ciência |

---

### PO-15 — Atualização em tempo real

| Item | Decisão |
|---|---|
| **Realtime Supabase** | **Fora da 2.3** |
| **Refresh** | Manual — pull-to-refresh mobile; botão opcional web; invalidação TanStack Query pós-mutation |
| **Stale time timeline** | **30s** |

---

## Eventos da timeline (DTO — não coluna DB)

| `kind` | Fonte | Condição |
|---|---|---|
| `OCCURRENCE_CREATED` | `occurrence_status_history` | `from_status IS NULL` → `PARALISACAO_PREVENTIVA` (**dedupe:** uma linha apenas) |
| `STATUS_CHANGED` | `occurrence_status_history` | demais transições |
| `COMMENT_ADDED` | `occurrence_comments` | `deleted_at IS NULL` |
| `COMMENT_REMOVED` | `occurrence_comments` | `deleted_at IS NOT NULL` (PO-4) |
| `EVIDENCE_ADDED` | `occurrence_attachments` | `upload_status = COMPLETED` |
| `EVIDENCE_REMOVED` | `occurrence_attachments` | `deleted_at IS NOT NULL` |
| `SYSTEM` | — | Reservado; virtual apenas (PO-9) |

**Retroativo:** evidências Sprint 2.2 aparecem após deploy sem alterar RPCs de upload.

---

## RBAC resumido (Sprint 2.3)

| Ação | Permissão |
|---|---|
| Ver timeline | `occurrence.read` + `can_access_occurrence` |
| Criar comentário | PO-1 (read + access) |
| Editar próprio comentário | PO-1 + autor + PO-7 |
| Remover comentário | PO-8 |
| Mutations diretas SQL | **Negadas** — somente RPC `SECURITY DEFINER` |

**Não inventar:** `occurrence.comment`, `timeline.read`, etc.

---

## Integração UI (ordem oficial)

Atualizada pela Sprint **2.4** — ver `VER-E-AGIR-DECISIONS.md` / `VER-E-AGIR-UI-SPEC.md`.

```text
[Header código + status]
[Info / descrição]
[Evidências — EvidenceSection Sprint 2.2]
[Decisão da Liderança — Sprint 2.4 VA + 2.5 IO]
[OccurrenceTimeline — Sprint 2.3]
[CommentComposer — Sprint 2.3]
```

**Deprecar:** `StopWorkTimeline` + leitura direta isolada de status history na UI (hook pode permanecer interno até remoção).

**Preview evidência na timeline:** reutilizar `useEvidenceSignedUrl` / fluxo 2.2 (AC-U04).

---

## RPCs (contrato de referência)

| RPC | Responsabilidade |
|---|---|
| `get_occurrence_timeline(uuid, jsonb cursor?, int limit?)` | Feed unificado |
| `create_occurrence_comment(uuid occurrence_id, text content)` | INSERT `GENERAL` |
| `update_occurrence_comment(uuid comment_id, text content)` | Edição autor + PO-7 |
| `delete_occurrence_comment(uuid comment_id)` | Soft delete PO-8 |

**Erros padronizados:** `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`.

---

## Explicitamente fora da Sprint 2.3

- Tabela `occurrence_timeline`
- Chat, threads, respostas aninhadas, menções @usuário
- Markdown / HTML renderizado (escape plain text)
- Anexos em comentários
- Notificações push, ciência, eventos `notified`
- Realtime / WebSocket timeline
- Optimistic updates na UI
- Comentários offline persistentes (design-only: rascunho memória)
- `comment_type` além de `GENERAL` (usuário)
- `is_internal` operacional (PO-10)
- Integração MDHO / IMS / plano de ação / transições workflow Sprint 4+

---

## Cross-check com `TIMELINE-UI-SPEC.md`

| Tema | PO | UI-SPEC | Status |
|---|---|---|---|
| Ordem Evidências → Ver e Agir → Timeline → Composer | PO-11 (+ 2.4) | Posição no detalhe | Alinhado |
| Comentário removido (sem body) | PO-4 | TL-ITEM `COMMENT_REMOVED` | Alinhado |
| Badge “(editado)” sem 2º evento | PO-5 | TL-ITEM + TL-EDIT | Alinhado |
| Bloqueio ENCERRADA/CANCELADA; LIBERADA ok | PO-6 | Composer disabled + copy | Alinhado |
| Limite 2000 / GENERAL only | PO-2, PO-13 | Composer regras | Alinhado |
| Janela edição 24h / remoção PO-8 | PO-7, PO-8 | Ações do item | Alinhado |
| Ordem DESC + load more 30 | PO-12 | TL-BLOCK / Load more | Alinhado |
| Sem notificações / Realtime | PO-14, PO-15 | Princípios + fora de escopo | Alinhado |
| Sem permissão `occurrence.comment` | RBAC | Usuário e permissão | Alinhado |
| Evidências derivadas (não status_history 2.2) | — | Cross-check EVIDENCE PO-12 | Alinhado |
| Empty / loading / error / editado / removido / load more | — | Estados da seção | Alinhado |

---

## Dependências registradas

### Etapa 1 — DATABASE (desbloqueada)

1. Migration `occurrence_comments` + colunas `edited_at`, `edited_by`, `deleted_by`
2. RLS SELECT; negar INSERT/UPDATE/DELETE direto
3. RPC `get_occurrence_timeline` (UNION)
4. Trigger consistência `organization_id`
5. `supabase db reset` OK

### Etapa 2 — BACKEND

1. RPCs create/update/delete comment
2. Validação status ocorrência (PO-6)
3. Regenerar `database.types.ts`

### Etapas 3–4 — types/validation, UIUX, WEB, MOBILE

1. `packages/types` — `OccurrenceTimelineItem`, kinds
2. `packages/validation` — comment schemas
3. `features/timeline/` web + mobile
4. Query key `occurrenceQueryKeys.timeline(orgId, occurrenceId, cursor?)`

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER / DOCS
Data: 2026-08-01
Base documental: arquitetura Sprint 2.3; docs/database.md §11–12; docs/workflow.md §3.1, §19
Status: APROVADO — liberar DATABASE e BACKEND (G0 → G1)
```

---

## Referências

- `docs/database.md` §11.1, §12.1
- `docs/workflow.md` §3.1, §19
- `docs/roadmap.md` Sprint 3 (comunicação)
- `docs/decisions/EVIDENCE-DECISIONS.md`
- `docs/decisions/TIMELINE-UI-SPEC.md`
- `docs/decisions/PREVENTIVE-STOP-DECISIONS.md`
- `docs/decisions/RBAC-MATRIX-APPROVED.md`
- Arquitetura Sprint 2.3 — Comentários e Timeline (2026-08-01)
