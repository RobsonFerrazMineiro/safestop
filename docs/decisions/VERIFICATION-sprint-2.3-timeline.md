# Verificação Sprint 2.3 — Timeline (TL-01…TL-20)

**Data:** 2026-08-01 (revalidação TL-19: 2026-08-01)  
**Agente:** QA  
**Escopo:** Timeline + comentários (Sprint 2.3); regressão SW-01 e EV-01  
**Pré-requisito:** `pnpm supabase:db:reset` + usuários seed provisionados

---

## Veredicto G4

| Critério | Resultado |
|----------|-----------|
| BUILD (`lint` / `typecheck` / `build`) | **PASS** |
| Smoke G2 (`smoke-timeline.mjs`) | **PASS** |
| TL-01…TL-20 | **20/20 PASS** |
| Regressão SW-01 (TL-15 + matriz SW) | **PASS** (12/12) |
| Regressão EV-01 (TL-16 + matriz EV) | **PASS** (20/20) |
| **G4 Sprint 2.3** | **APROVAR** |

**Correção TL-19:** migration `20260802200000_fix_timeline_platform_admin_bypass.sql` — helper `can_read_occurrence_in_org()` com bypass `is_platform_admin()` aplicado em `get_occurrence_timeline` e RPCs de comentário.

---

## Pré-requisitos executados

```powershell
pnpm supabase:db:reset
pnpm lint          # 7/7 OK (warnings pré-existentes mobile/web)
pnpm typecheck     # 6/6 OK
pnpm build         # web OK
node supabase/scripts/smoke-timeline.mjs
node supabase/scripts/qa-tl-01-20.mjs
node supabase/scripts/qa-sw-01-12.mjs
node supabase/scripts/qa-ev-01-20.mjs
```

**Senha seed local:** `SafeStop-QA-Local-2026`

---

## Matriz TL-01…TL-20

| ID | Cenário | Resultado | Evidência |
|----|---------|-----------|-----------|
| TL-01 | qa-field abre timeline → OCCURRENCE_CREATED (PP) | **PASS** | `get_occurrence_timeline` — título "Paralisação Preventiva registrada", dedupe 1 evento |
| TL-02 | Criar comentário → topo do feed DESC | **PASS** | `COMMENT_ADDED` em `items[0]` |
| TL-03 | Editar próprio → conteúdo + isEdited / "(editado)" | **PASS** | `update_occurrence_comment` + `editedAt` |
| TL-04 | Editar comentário alheio → FORBIDDEN | **PASS** | RPC `error.code = FORBIDDEN` |
| TL-05 | Remover próprio → "Comentário removido" | **PASS** | `COMMENT_REMOVED` título correto |
| TL-06 | qa-gestor comenta (PO-1: `occurrence.read`) | **PASS** | `create_occurrence_comment` OK |
| TL-07 | Sem `occurrence.read` → composer oculto + RPC FORBIDDEN | **PASS** | `qa-noperm` bloqueado |
| TL-08 | qa-multi ID outra org → FORBIDDEN | **PASS** | cross-org bloqueado |
| TL-09 | Upload evidência → EVIDENCE_ADDED | **PASS** | retroativo Sprint 2.2 na timeline |
| TL-10 | Delete evidência → EVIDENCE_REMOVED | **PASS** | evento após soft delete |
| TL-11 | Ocorrência ENCERRADA → comentar bloqueado | **PASS** | `create_occurrence_comment` FORBIDDEN |
| TL-12 | >30 eventos → load more (`nextCursor`) | **PASS** | page1=30, page2=5 |
| TL-13 | Troca org qa-multi → sem vazamento | **PASS** | cross-org bloqueado; `clearTenantCache` (contrato código) |
| TL-14 | Logout → cache limpo | **PASS** | `auth-provider` / `clearTenantCache` (contrato código) |
| TL-15 | Regressão SW-01 criar PP | **PASS** | `SS-26-000006` |
| TL-16 | Regressão EV-01 upload JPEG | **PASS** | `COMPLETED` |
| TL-17 | Conteúdo vazio → VALIDATION_ERROR | **PASS** | RPC rejeita |
| TL-18 | >2000 chars → VALIDATION_ERROR | **PASS** | RPC rejeita |
| TL-19 | qa-platform read cross-org | **PASS** | 3 itens na timeline Alpha (revalidado pós-fix) |
| TL-20 | Refresh → dados consistentes | **PASS** | 2 chamadas idênticas (length + topo) |

**Resumo:** PASS 20/20 | FAIL 0/20

---

## TL-19 — qa-platform read cross-org (revalidado)

### Histórico

**1ª bateria (pré-fix):** FAIL — RPC retornava `FORBIDDEN` sem bypass platform admin.

**Correção (BACKEND):** `20260802200000_fix_timeline_platform_admin_bypass.sql`

- Nova função `can_read_occurrence_in_org(org_id)` → `is_platform_admin() OR has_permission('occurrence.read', org_id)`
- Aplicada em `get_occurrence_timeline`, `create_occurrence_comment`, `update_occurrence_comment`

**2ª bateria (pós-fix, após `db reset`):**

```
PASS TL-19: qa-platform read cross-org (3 itens)
```

Alinhado a `OCCURRENCE-FOUNDATION-DECISIONS.md` § O10 e consistente com EV-19 (RLS cross-org read).

---

## Smoke G2 (`smoke-timeline.mjs`)

| Passo | Resultado |
|-------|-----------|
| TL-01 OCCURRENCE_CREATED deduplicado | OK |
| create_occurrence_comment | OK |
| update_occurrence_comment (PO-7) | OK |
| EVIDENCE_ADDED retroativo | OK |
| delete + COMMENT_REMOVED (3 eventos DESC) | OK |
| qa-gestor lê e comenta (PO-1) | OK |
| cross-org qa-multi FORBIDDEN | OK |
| INSERT direto negado (403) | OK |

---

## Regressões

### SW-01 / TL-15

| Script | Resultado |
|--------|-----------|
| `qa-tl-01-20.mjs` TL-15 | PASS — `SS-26-000006` |
| `qa-sw-01-12.mjs` matriz completa | **12/12 PASS** |

### EV-01 / TL-16

| Script | Resultado |
|--------|-----------|
| `qa-tl-01-20.mjs` TL-16 | PASS — upload JPEG COMPLETED |
| `qa-ev-01-20.mjs` matriz completa | **20/20 PASS** |

---

## Ressalvas não bloqueantes (E2E / UI)

Cenários validados por **contrato de código** + API (sem browser/dispositivo nesta bateria):

| ID | Validação |
|----|-----------|
| TL-07 | Composer oculto — hook/UI (`can('occurrence.read')`) não exercitado em browser |
| TL-13 | Troca org — `clearTenantCache` verificado em código, não E2E mobile/web |
| TL-14 | Logout — idem TL-13 |

---

## Dependências

| Dependência | Status |
|-------------|--------|
| SECURITY G3 sign-off | Assumido conforme contexto da sprint (sem bloqueio adicional reportado nesta bateria) |
| Seed QA (field, gestor, multi, platform, noperm) | OK após `db reset` |
| COMMIT autorizado | **OK** — G4 aprovado (20/20 TL) |

---

## DoD Sprint 2.3

- [x] G4: TL-01…TL-20 pass (20/20)
- [x] SW-01 + EV-01 regressão OK
- [x] Relatório pass/fail documentado
- [x] TL-19 corrigido e revalidado
