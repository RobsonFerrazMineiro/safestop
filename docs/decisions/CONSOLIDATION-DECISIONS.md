# Decisões — Consolidação e Hardening do Fluxo Operacional (Sprint 2.9)

**Status:** `APROVADO`  
**Sprint:** 2.9 — Consolidação e Hardening (pós 2.0–2.8)  
**Data:** 2026-08-03  
**Etapa:** 0 — Produto (agente MASTER / DOCS)  
**Gate:** **G0 desbloqueado** — libera execução T1 por agente

**Arquitetura base:** Sprint 2.9 — Consolidação e Hardening (auditoria 2026-08-03, aprovada)

**Fundação auditada:** Sub-sprints 2.0 (Occurrences) → 2.8 (Referência IMS) — fluxo IO completo até `EM_TRATATIVA`

**Spec UI:** [`CONSOLIDATION-UI-SPEC.md`](./CONSOLIDATION-UI-SPEC.md) — Etapa UIUX concluída (2026-08-03)

**Relação roadmap:** Sprint 3 (Notificações) e Sprint 7 (Plano de Ação) **dependem** de T1 desta sprint. A **2.9 não entrega produto novo** — consolida, endurece e formaliza dead-ends.

**Achados arquiteturais:** prefixo `S29-*` no relatório de auditoria — mapeados abaixo para decisões PO e agentes.

---

## Objetivo

Registrar as decisões de produto **PO-CON-1 a PO-CON-22** da Sprint 2.9 **sem inventar regra de negócio**, usando como fonte primária:

- relatório arquitetural Sprint 2.9 (auditoria read-only);
- `docs/workflow.md`, `docs/product.md`, `docs/database.md`, `docs/engineering.md`;
- `docs/decisions/*` das sub-sprints 2.3–2.8;
- estado real do repositório pós-2.8.

---

## Decisão arquitetural central (não redesenhar)

| Item | Decisão |
|---|---|
| **Escopo** | **Consolidação + hardening** — zero feature de domínio nova |
| **Fluxo IO** | **Completo até `EM_TRATATIVA`** — já entregue 2.0–2.8 |
| **Fluxo VA** | **Para em `VER_E_AGIR`** — liberação/validação **fora** 2.9 |
| **Plano de Ação** | **Fora** 2.9 — Sprint futura |
| **Notificações** | **Fora** 2.9 — Sprint 3 |
| **Tabelas novas** | **Proibidas** (`action_plans`, `notification_events`, `audit_events`) |
| **Regras de negócio** | **Proibido alterar** transições/RPCs existentes **sem** bugfix documentado |
| **Entrega principal** | Smoke integrado + detalhe único + query keys + CI Supabase + UX dead-ends |

---

## Gate G0

| Item | Estado |
|---|---|
| **G0 — Etapa 0 PO** | **Desbloqueado** (2026-08-03) |
| **Desbloqueia** | DATABASE smoke-flow, BUILD CI job, BACKEND query-keys, WEB/MOBILE unificação |
| **Critério** | PO-CON-1…PO-CON-22 sem ambiguidade; T1 aprovado |
| **Paralelo permitido** | UIUX spec ∥ DATABASE smoke ∥ BUILD CI após G0 |

Ordem oficial: **Etapa 0 DOCS → UIUX ∥ (DATABASE + BUILD + SECURITY) → BACKEND → WEB ∥ MOBILE → QA → DOCS → COMMIT**.

---

## Decisões aprovadas

### PO-CON-1 — Escopo da Sprint 2.9

| Item | Decisão |
|---|---|
| **Inclui** | Hardening técnico, regressão integrada, unificação rotas/cache, UX dead-ends, CI Supabase |
| **Exclui** | Plano de Ação, Notificações, Liberação, Cancelamento, IMS externo, novas RPCs de produto |
| **Bugfix RPC** | Permitido **somente** se regressão comprovada + escopo mínimo |

---

### PO-CON-2 — Dead-end ramo Ver e Agir (`VER_E_AGIR`)

| Item | Decisão |
|---|---|
| **Status** | **Intencional** — próximo passo (validação/liberação) **fora** 2.9 |
| **UX** | Banner informativo **“Aguardando validação e liberação — em versão futura”** |
| **CTA operacional** | **Nenhum** — sem botão fake |
| **Achado** | S29-T-01, S29-UX-03 |

---

### PO-CON-3 — Dead-end ramo IO pós-IMS (`EM_TRATATIVA`)

| Item | Decisão |
|---|---|
| **Status** | **Intencional** — Plano de Ação **fora** 2.9 |
| **UX** | Banner **“Em tratativa — Plano de Ação em versão futura”** |
| **Referência IMS** | Card read-only **mantido** (2.8) |
| **Achado** | S29-T-02, S29-UX-02, S29-WEB-04 |

---

### PO-CON-4 — Resolução conflito product.md vs workflow (acompanhamento sem IMS)

| Item | Decisão |
|---|---|
| **Transição status** | **Workflow prevalece** — register IMS → `EM_TRATATIVA` (PO-IMS-2 mantido) |
| **Copy product.md** | Interpretar “acompanhamento continua” como leitura/timeline/comentários **antes** do registro |
| **Plano de Ação** | **Bloqueado** até sprint dedicada — independente de copy product |

---

### PO-CON-5 — Rota canônica de detalhe operacional

| Item | Decisão |
|---|---|
| **Web canônica** | `/stop-work/[id]` — fluxo completo (evidências, decisão, MDHO, HSE, IMS, timeline) |
| **Mobile canônica** | `/(app)/stop-work/[id]` — idem |
| **Rotas legadas** | `/occurrences/[id]` e mobile equivalente → **redirect** para canônica |
| **Estratégia** | **Redirect** — **não** duplicar componente operacional |
| **Achado** | S29-WEB-01, S29-MOB-01, S29-TL-02, S29-UX-01 |

---

### PO-CON-6 — Rota canônica de criação PP

| Item | Decisão |
|---|---|
| **Canônica** | `/stop-work/new` (web) · rota stop-work new (mobile) |
| **`/occurrences/new`** | **Redirect** ou alias — uma implementação |
| **Prioridade** | **T2** — após detalhe unificado |
| **Achado** | S29-WEB-02 |

---

### PO-CON-7 — Query keys compartilhadas

| Item | Decisão |
|---|---|
| **Local** | Novo módulo **`packages/query-keys`** (pacote workspace) |
| **Escopo MVP 2.9** | `occurrenceQueryKeys`, `hseApprovalQueryKeys`, prefixo `tenant` |
| **API** | **Objeto** (padrão Mobile) — Web migra da função |
| **Achado** | S29-CACHE-01, S29-CACHE-02 |

---

### PO-CON-8 — Guards UI compartilhados (MDHO / IMS)

| Item | Decisão |
|---|---|
| **Local** | `packages/types` — helpers existentes + extensão |
| **Migrar** | `shouldShowMdhoSection` Web local, guards IMS mobile duplicados |
| **Achado** | S29-TYP-01, S29-TYP-02 |

---

### PO-CON-9 — Matriz de invalidação pós-mutation

| Item | Decisão |
|---|---|
| **Entrega** | Documento em `packages/query-keys` + hooks apps usam matriz |
| **Domínios** | decision, mdho, hse, ims, timeline, list |
| **Achado** | S29-CACHE-03 |

---

### PO-CON-10 — Smoke fluxo operacional IO completo

| Item | Decisão |
|---|---|
| **Script** | `supabase/scripts/smoke-flow-operational-io.mjs` |
| **Cadeia** | PP → evidence (opcional mínimo) → start eval → IO → MDHO start/draft/submit → approve → register IMS |
| **Package.json** | Script `supabase:smoke-flow-io` |
| **Gate** | **G2 DATABASE** — bloqueia QA final |
| **Achado** | S29-RPC-03, S29-MIG-02 |

---

### PO-CON-11 — CI Supabase

| Item | Decisão |
|---|---|
| **Job** | `db reset` + `smoke-auth` + `smoke-flow-io` (mínimo) |
| **PR/push** | Falha bloqueia merge |
| **Branch** | Alinhar workflow à branch principal do repo (`master`) |
| **Achado** | S29-BLD-03, S29-MIG-02, S29-SEC-01 |

---

### PO-CON-12 — Timeline SQL `get_occurrence_timeline`

| Item | Decisão |
|---|---|
| **2.9 MVP** | **Documentar** versão canônica + checklist de patches; **não** reescrever histórico de migrations |
| **Entrega opcional T2** | Migration consolidadora **somente** se diff auditado zero regressão |
| **Achado** | S29-MIG-01 |

---

### PO-CON-13 — Remoção `StopWorkTimeline` legado

| Item | Decisão |
|---|---|
| **Ação** | **Remover** `stop-work-timeline.tsx` se zero referências |
| **Substituto** | `OccurrenceTimeline` (já em uso) |
| **Achado** | S29-TL-01, S29-DOC-04 |

---

### PO-CON-14 — Parser erro RPC unificado

| Item | Decisão |
|---|---|
| **Local** | `packages/types` ou `packages/validation` — helper `parseRpcError(jsonb)` |
| **Apps** | Web/Mobile substituem `ims-rpc`, `mdho-rpc`, etc. duplicados |
| **Prioridade** | **T2** |
| **Achado** | S29-SVC-03 |

---

### PO-CON-15 — Hardening upload evidência

| Item | Decisão |
|---|---|
| **Escopo 2.9** | Documentar fluxo prepare→upload→complete; reforçar `fail_occurrence_attachment` em retry |
| **Teste** | Cenário upload abortado no smoke ou qa-ev |
| **EXIF strip** | **T2** — SECURITY revisão |
| **Achado** | S29-EV-01, S29-RPC-01 |

---

### PO-CON-16 — RLS e Storage na CI

| Item | Decisão |
|---|---|
| **RLS** | Executar subset `qa-multi` ou script dedicado no job CI |
| **Storage** | SECURITY sign-off policies `storage.objects` — checklist manual + doc |
| **Achado** | S29-RLS-01, S29-RLS-03, S29-SEC-01 |

---

### PO-CON-17 — Regressão QA consolidada

| Item | Decisão |
|---|---|
| **Documento** | `VERIFICATION-sprint-2.9-consolidation.md` |
| **Subset** | ~50 casos críticos das matrizes 2.3–2.8 + smoke-flow-io |
| **E2E visual** | Ressalva documentada — mínimo: detalhe unificado + filtro IMS |
| **Achado** | S29-DOC-05 |

---

### PO-CON-18 — Platform Admin

| Item | Decisão |
|---|---|
| **Decisão** | **Manter** padrão — sem mutações operacionais UI; leitura conforme política |
| **Teste** | Regressão TL-13 / HSE-12 |

---

### PO-CON-19 — Offline

| Item | Decisão |
|---|---|
| **Decisão** | **Manter** bloqueio mutations offline (2.6–2.8) |
| **PP rascunho/geo** | Documentar limitações — **T2** |
| **Achado** | S29-MOB-04 |

---

### PO-CON-20 — Permissões reservadas no seed

| Item | Decisão |
|---|---|
| **Ação** | Marcar em `docs/database.md` como **reservadas**: `occurrence.release`, `action_plan.*`, etc. |
| **Achado** | S29-RBAC-01 |

---

### PO-CON-21 — Contrato eventos para Notificações

| Item | Decisão |
|---|---|
| **Entrega DOCS (2.9)** | Tabela evento → permissão/papel → timeline kind/metadata |
| **Implementação** | **Implementado — Sprint 3.1** |
| **Migrations** | `20260817180000_create_notifications_foundation.sql` · `20260817190000_notification_rpcs.sql` · `20260817200000_notification_dispatch_occurrence_patch.sql` · `20260817210000_notification_dispatch_mdho_patch.sql` · `20260817220000_notification_dispatch_ims_patch.sql` · `20260817230000_notification_dispatch_action_plan_patch.sql` |
| **Decisões** | `docs/decisions/NOTIFICATIONS-DECISIONS.md` (PO-NOTIF-1…8) |
| **Achado original** | Bloqueador Notificações Sprint 3 |

#### Tabela evento → destinatários (contrato — implementado na 3.1)

Fonte de tipos: `docs/database.md` §17.2 · `docs/notifications.md` §11.  
Timeline: enriquecer `STATUS_CHANGED` / kinds 2.3 — **sem** kind de notificação.  
Push / `notification_deliveries`: **fora** 3.1. **Sem** integração IMS.

| Evento (`notification_events.event_type`) | Gatilho operacional (RPC / status) | Destinatários-alvo (papéis típicos) | Permissão p/ agir após aviso | Timeline (título / metadata) | 3.1 |
|---|---|---|---|---|---|
| `OCCURRENCE_CREATED` | `create_occurrence` → PP | Fiscal, Supervisor HSE, Liderança HSE, responsáveis do escopo | `occurrence.read` / `occurrence.evaluate` | `OCCURRENCE_CREATED` · “Paralisação Preventiva registrada” | ✅ |
| `DECISION_REQUIRED` | `start_occurrence_evaluation` → `EM_AVALIACAO` | Fiscal, Supervisor HSE, Liderança HSE | `occurrence.evaluate` | `STATUS_CHANGED` · “Avaliação iniciada” | ✅ |
| `VER_AND_ACT_REQUIRED` | `record_occurrence_decision(VER_E_AGIR)` | Escopo leitura + quem trata correção | `occurrence.read` | `STATUS_CHANGED` · “Decisão: Ver e Agir” | ✅ |
| `INTERDICTION_CONFIRMED` | `record_occurrence_decision(INTERDICAO_OFICIAL)` | Supervisor HSE, Liderança HSE, Fiscal (ciência) | `mdho.fill` / `occurrence.read` | `STATUS_CHANGED` · “Interdição Oficial confirmada” | ✅ |
| `MDHO_APPROVAL_REQUIRED` | `submit_mdho_assessment` | Liderança HSE | `mdho.approve` / `mdho.return` | `STATUS_CHANGED` · “MDHO enviado” | ✅ |
| `MDHO_RETURNED` | `return_mdho_assessment` | Supervisor HSE (preenchedor) | `mdho.fill` / `mdho.submit` | `STATUS_CHANGED` · “MDHO devolvido” · `returnReason` | ✅ |
| `MDHO_APPROVED` | `approve_mdho_assessment` | Supervisor HSE + quem registra IMS | `ims_reference.register` | `STATUS_CHANGED` · “MDHO aprovado” | ✅ |
| `IMS_REFERENCE_REGISTERED` | `register_ims_reference` | Escopo leitura operacional | `occurrence.read` / `ims_reference.update` | `STATUS_CHANGED` · “Referência IMS registrada” | ✅ |
| `ACTION_PLAN_CREATED` | `create_action_plan` | Supervisor HSE, Liderança HSE | `action_plan.manage` | `ACTION_PLAN_CREATED` | ✅ |
| `ACTION_ITEM_ASSIGNED` | `add_action_item` / update responsável | Responsável da ação | manage ou responsável | `ACTION_ITEM_ASSIGNED` | ✅ |
| `ACTION_ITEM_SUBMITTED` | `submit_action_item` | Liderança HSE (validação) | `action_plan.validate` | `ACTION_ITEM_STATUS_CHANGED` | ✅ |
| `ACTION_ITEM_VALIDATED` | `validate_action_item(COMPLETED)` | Supervisor HSE | `action_plan.manage` | `ACTION_ITEM_STATUS_CHANGED` | ✅ |
| `ACTION_ITEM_RETURNED` | `validate_action_item(REJECTED)` | Responsável da ação | manage ou responsável | `ACTION_ITEM_STATUS_CHANGED` | ✅ |
| `ACTION_PLAN_COMPLETED` | `complete_action_plan` | Fiscal, Supervisor HSE (+ autor PP conforme NOTIF) | `occurrence.read` | `ACTION_PLAN_COMPLETED` | ✅ |
| `OCCURRENCE_ASSIGNED` | Futuro (participantes) | Atribuído | conforme papel | — | ⏳ |
| `ACTION_DUE` | Cron / item vencido (PO-NOTIF-6) | Responsável da ação | manage ou responsável | — | ⏳ |
| `CORRECTION_SUBMITTED` · `RELEASE_REQUIRED` · `OCCURRENCE_RELEASED` | Plano / validação / liberação | Conforme sprint futura | `occurrence.validate_correction` / `occurrence.release` (**reservadas**) | Fora escopo | ⏳ |

**Ciência (3.1):** `confirm_notification_awareness` — leitura ≠ ciência (`docs/notifications.md`).  
**Fila HSE:** `list_mdho_pending_approvals` é UX operacional 2.7 — **complementa**, não substitui, notificações in-app.

---

### PO-CON-22 — Critério de commit Sprint 2.9

| Item | Decisão |
|---|---|
| **Commit** | **Somente** após G6 QA PASS ou waivers PO explícitos por T1 |
| **Push** | Somente quando solicitado |
| **Proibido** | Commit parcial T1 sem gate |

---

## Mapa achados S29 → decisão → agente

| Achado | Severidade | Decisão PO | Agente principal |
|--------|------------|------------|------------------|
| S29-WEB-01 / S29-MOB-01 | T1 | PO-CON-5 | WEB + MOBILE |
| S29-CACHE-01 / 02 | T1/T2 | PO-CON-7 | BACKEND |
| S29-RPC-03 | T1 | PO-CON-10 | DATABASE + QA |
| S29-BLD-03 / S29-MIG-02 | T1 | PO-CON-11 | BUILD |
| S29-SEC-01 / S29-RLS-01 | T1 | PO-CON-16 | SECURITY + BUILD |
| S29-UX-02 / 03 | T1 | PO-CON-2 / 3 | UIUX + WEB + MOBILE |
| S29-T-01 / S29-T-02 | T1 | PO-CON-2 / 3 / 4 | DOCS + UIUX |
| S29-TL-01 | T3 | PO-CON-13 | WEB |
| S29-MIG-01 | T1/T2 | PO-CON-12 | DATABASE |
| S29-EV-01 | T1 | PO-CON-15 | BACKEND + MOBILE |
| S29-TYP-01 / 02 | T2 | PO-CON-8 | BACKEND |
| S29-SVC-03 | T2 | PO-CON-14 | BACKEND |

---

## Prioridades T0–T3 (referência)

### T0 — Bloqueante

**Nenhum** bloqueador de segurança/integridade confirmado sem mitigação.

### T1 — Obrigatório Sprint 2.9

PO-CON-5, 7, 10, 11, 2, 3, 16, 17 (+ SECURITY storage review)

### T2 — Backlog 2.9 se sobrar capacidade

PO-CON-6, 12 (consolidação SQL), 14, 15 (EXIF), S29-MOB-02, S29-WEB-02

### T3 — Backlog pós-2.9

S29-SVC-02, S29-TYP-03, S29-BLD-02, S29-PRV-02

---

## Gates de execução

| Gate | Critério |
|------|----------|
| **G1 PO** | PO-CON-1…22 aprovados |
| **G2 DATABASE** | `db reset` + `smoke-flow-io` PASS |
| **G3 SECURITY** | Sign-off RLS/storage |
| **G4 BACKEND** | `@safestop/query-keys` adotado Web/Mobile |
| **G5 WEB/MOBILE** | Detalhe único + banners dead-end + build PASS |
| **G6 QA** | VERIFICATION 2.9 PASS |
| **G7 DOCS** | Roadmap 2.9 + workflow dead-ends |
| **G8 COMMIT** | T1 fechados ou waiver PO |

---

## Critérios de aceite Sprint 2.9

### Funcionais

- [ ] Smoke encadeado PP→IMS PASS (`smoke-flow-operational-io.mjs`)
- [ ] Detalhe operacional único Web/Mobile (redirect)
- [ ] Banners `VER_E_AGIR` e `EM_TRATATIVA` visíveis
- [ ] Zero regressão nos smokes 2.3–2.8 existentes

### Técnicos

- [ ] `@safestop/query-keys` — Web e Mobile sem divergência occurrence/HSE
- [ ] CI executa db reset + smoke mínimo
- [ ] `StopWorkTimeline` removido ou zero refs
- [ ] Sem tabelas/RPCs de produto novo

### Segurança

- [ ] RLS cross-tenant validado (CI ou qa-multi)
- [ ] Storage policies revisadas com evidência
- [ ] Nenhum T1 SECURITY aberto

### Documentação

- [x] Nota roadmap 2.9
- [ ] `VERIFICATION-sprint-2.9-consolidation.md` _(QA)_
- [x] Workflow § dead-ends VA/IO atualizado
- [x] `database.md` §6.2 — permissões reservadas (PO-CON-20)
- [x] `api.md` — catálogo RPC operacional
- [x] Tabela evento → notificação futura (PO-CON-21)

---

## Explicitamente fora da Sprint 2.9

- Plano de Ação (`action_plans`)
- Notificações (`notification_events`, push)
- Liberação, validação, cancelamento formal
- Integração/consulta IMS
- Novas transições de status
- Refatoração `@safestop/api-client` completa (T3)
- `audit_events` migration
- E2E browser/mobile automatizado completo

---

## Dependências registradas

### Etapa 1 — DATABASE + BUILD + SECURITY (paralelo)

1. `smoke-flow-operational-io.mjs` + script package.json
2. Job CI Supabase
3. Checklist RLS/storage SECURITY

### Etapa 2 — BACKEND

1. Pacote `packages/query-keys`
2. Migrar Web/Mobile occurrence + HSE keys
3. Guards MDHO/IMS em `packages/types`
4. Matriz invalidação documentada

### Etapa 3 — UIUX ✅

1. `CONSOLIDATION-UI-SPEC.md` — banners CON-BANNER-VA/TRATATIVA, nav Paralisações, hierarquia detalhe, checklist Base44 (entregue)

### Etapas 4–5 — WEB + MOBILE

1. Redirect detalhe legado
2. Banners dead-end
3. Adotar query-keys
4. Remover StopWorkTimeline

### Etapa 6 — QA + DOCS

1. VERIFICATION 2.9 _(QA)_
2. ~~Roadmap nota 2.9~~ **Concluído**
3. ~~api.md catálogo RPC~~ **Concluído**
4. ~~Mapa eventos → notificações (PO-CON-21)~~ **Implementado — Sprint 3.1**
5. ~~workflow dead-ends + database permissões reservadas~~ **Concluído**

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER / DOCS
Data: 2026-08-03
Base documental: auditoria Sprint 2.9; sub-sprints 2.0–2.8 mergeadas
Status: APROVADO — liberar onda T1 (G0 → G1)
```

---

## Referências

- Relatório arquitetural Sprint 2.9 (auditoria 2026-08-03)
- `docs/workflow.md` §5.3 / §5.8 — dead-ends VA/IO
- `docs/database.md` §6.2 — permissões reservadas (PO-CON-20)
- `docs/api.md` — catálogo RPC operacional
- `docs/notifications.md` — ponteiro PO-CON-21
- `docs/roadmap.md` — nota sub-sprint 2.9
- `docs/decisions/VERIFICATION-sprint-2.3` … `2.8`
- `docs/decisions/TIMELINE-DECISIONS.md` — deprecação StopWorkTimeline
- `.github/workflows/ci.yml`
