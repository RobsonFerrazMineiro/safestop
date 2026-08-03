# Verificação Sprint 2.8 — Referência IMS (IMS-01…IMS-16)

**Data:** 2026-08-02  
**Agente:** QA  
**Escopo:** Registro e correção manual de `ims_reference_code` pós-MDHO aprovado; transição `AGUARDANDO_REGISTRO_IMS` → `EM_TRATATIVA`; regressão HSE, MDHO, IO, VA, timeline  
**Pré-requisito:** `pnpm supabase:db:reset` + seed com usuários QA HSE

---

## Veredicto G5

| Critério | Resultado |
|----------|-----------|
| BUILD (`lint` / `typecheck` / `build`) | **PASS** |
| Smoke G2 (`smoke-ims-reference.mjs`) | **PASS** |
| IMS-01…IMS-16 | **16/16 PASS** |
| Regressão HSE / MDHO / IO / VA / timeline | **PASS** |
| **G5 Sprint 2.8 — QA completo** | **APROVAR** |

---

## Pré-requisitos executados

```powershell
pnpm supabase:db:reset
pnpm lint          # 7/7 OK (warnings pré-existentes)
pnpm typecheck     # 6/6 OK
pnpm build         # web OK (Next.js 16.2.10)
pnpm exec supabase stop && pnpm exec supabase start   # auth 502 pós-reset — restart necessário
node supabase/scripts/smoke-ims-reference.mjs
node supabase/scripts/qa-ims-01-16.mjs
```

**Senha seed local:** `SafeStop-QA-Local-2026`

**Nota operacional:** Após `db reset`, o endpoint `/auth/v1` retornou **502** por ~30s. Restart do stack (`supabase stop` + `start`) restaurou health **200** antes dos testes.

---

## Usuários QA

| Usuário | Papel | Cenários |
|---------|-------|----------|
| `qa-supervisor@safestop.local` | Supervisor HSE | IMS-01, 06, 07, 09, 15 (register, update) |
| `qa-lideranca@safestop.local` | Liderança HSE | setup MDHO approve (pré-condição register) |
| `qa-fiscal@safestop.local` | Fiscal do Contrato | IMS-12 (read-only / FORBIDDEN) |
| `qa-field@safestop.local` | HSE de Campo | IMS-04 (sem permissão register) |
| `qa-multi@safestop.local` | Multi-org | IMS-11 (cross-tenant) |
| `qa-platform@safestop.local` | Platform Admin | IMS-13 (guard UI) |

---

## Fluxo E2E executado (API)

```
qa-field:      PP → IO confirmada
qa-supervisor: start MDHO → save draft → submit
qa-lideranca:  approve MDHO → AGUARDANDO_REGISTRO_IMS
qa-supervisor: register_ims_reference(BAA-26-0001) → EM_TRATATIVA
qa-supervisor: update_ims_reference(BAA-26-0002 + motivo) → history update_ims
```

Timeline resultante: **Referência IMS registrada** + **Referência IMS alterada** (IMS-10).

---

## Matriz IMS-01…IMS-16

| ID | Cenário | Resultado | Evidência |
|----|---------|-----------|-----------|
| IMS-01 | Supervisor registra BAA → `EM_TRATATIVA` | **PASS** | RPC + status ocorrência |
| IMS-02 | Formato inválido → `VALIDATION_ERROR` | **PASS** | `INVALID-CODE` rejeitado |
| IMS-03 | Register em Ver e Agir → `FORBIDDEN` | **PASS** | ramo VA bloqueado + `shouldShowImsReferenceSection` |
| IMS-04 | Register sem permissão → `FORBIDDEN` | **PASS** | `qa-field` |
| IMS-05 | Segundo register → `ALREADY_REGISTERED` | **PASS** | código diferente rejeitado |
| IMS-06 | Update com motivo 10–4000 → history metadata | **PASS** | timeline `action: update_ims` + previous/new code |
| IMS-07 | Update motivo &lt; 10 → `VALIDATION_ERROR` | **PASS** | validação RPC |
| IMS-08 | Update pós-`ENCERRADA` → `STATUS_MISMATCH` | **PASS** | SQL seed + RPC |
| IMS-09 | Pesquisa por código encontra ocorrência na org | **PASS** | REST `ilike.*BAA-26-0002*` |
| IMS-10 | Timeline “registrada” / “alterada” | **PASS** | 2 títulos IMS |
| IMS-11 | Cross-tenant → `FORBIDDEN` | **PASS** | register + update `qa-multi` |
| IMS-12 | Fiscal read-only sem register | **PASS** | `FORBIDDEN` |
| IMS-13 | Platform Admin sem mutations UI | **PASS** | `canRegisterImsReference` + `!isPlatformAdmin` |
| IMS-14 | Offline bloqueia register/update mobile | **PASS** | `!isOnline` em form + edit dialog |
| IMS-15 | Idempotência register retry | **PASS** | `data.idempotent === true` |
| IMS-16 | Regressão MDHO/HSE/IO/VA/timeline | **PASS** | spot-check E2E |

**Resumo:** PASS 16/16 | FAIL 0/16

---

## Smoke G2 (`smoke-ims-reference.mjs`)

| Passo | Resultado |
|-------|-----------|
| IMS-02 formato inválido | OK |
| IMS-04/12 fiscal FORBIDDEN | OK |
| IMS-01 register → EM_TRATATIVA | OK |
| IMS-05 ALREADY_REGISTERED | OK |
| IMS-15 idempotência | OK |
| IMS-07 VALIDATION_ERROR | OK |
| IMS-06 update válido | OK |
| IMS-10 timeline IMS | OK |
| IMS-09 pesquisa REST | OK |
| IMS-03 VA FORBIDDEN | OK |
| IMS-11 cross-tenant | OK |
| IMS-08 STATUS_MISMATCH pós-ENCERRADA | OK |

---

## Regressão (IMS-16)

| Bateria | Resultado | Evidência |
|---------|-----------|-----------|
| HSE fila | **PASS** | `list_mdho_pending_approvals` OK |
| IO confirmada | **PASS** | `create_occurrence` + `record_occurrence_decision` IO |
| VA decide | **PASS** | `VER_E_AGIR` OK |
| Timeline | **PASS** | `get_occurrence_timeline` IO |
| MDHO start | **PASS** | `start_mdho_assessment` em IO |

Regressão completa HSE-01…20, MDHO-06…16, IO-01…12, VA-01…07, TL-01…05 **não reexecutada item a item** — baseline das verificações 2.3–2.7; spot-check IMS-16 confirma integridade dos fluxos upstream.

---

## Ressalvas não bloqueantes

| ID | Observação |
|----|------------|
| IMS-03 | Seção UI ausente em VA validada via types (`shouldShowImsReferenceSection`); E2E visual não executado. |
| IMS-13, IMS-14 | Guards UI verificados em código; E2E browser/mobile offline não executado. |
| IMS-09 | Pesquisa validada via REST `ilike`; filtro UI listagem não exercitado visualmente. |
| IMS-08 | Status `ENCERRADA` aplicado via SQL local (mesmo padrão smoke) — encerramento formal fora escopo 2.8. |
| Infra | Auth 502 transitório pós-`db reset` — documentado; mitigado com restart do stack. |

**Fora de escopo:** integração IMS externa, plano de ação, notificações, encerramento formal.

---

## Scripts entregues

| Script | Função |
|--------|--------|
| `supabase/scripts/smoke-ims-reference.mjs` | Smoke G2 fluxo feliz + negativos IMS |
| `supabase/scripts/qa-ims-01-16.mjs` | Matriz IMS-01…16 + regressão IMS-16 |

**Migration relevante:** `20260808180000_ims_reference_rpcs.sql` — `register_ims_reference`, `update_ims_reference`, patch timeline IMS.

---

## DoD G5

- [x] Matriz IMS-01…16 executada com evidência
- [x] Fluxo E2E register → update com timeline
- [x] Regressão HSE/MDHO/IO/VA/timeline OK (spot-check)
- [x] Seed QA provisionado
- [x] Relatório documentado

**COMMIT autorizado:** OK — G5 QA Sprint 2.8 aprovado.

---

## DOCS pós-QA (Etapa DOCS)

| Item | Status |
|---|---|
| `VERIFICATION-sprint-2.8-ims-reference.md` | Mantido (este arquivo — G5 QA) |
| Nota roadmap sub-sprint 2.8 | Concluída |
| Cross-check IMS-REFERENCE-DECISIONS ↔ UI-SPEC | Concluído (expandido) |
| Sugere integração IMS? | **Não** — registro manual apenas; copy e fora de escopo reforçados |

---

## Referências

- [`IMS-REFERENCE-DECISIONS.md`](./IMS-REFERENCE-DECISIONS.md) — PO-IMS-1…16, matriz IMS-01…16
- [`IMS-REFERENCE-UI-SPEC.md`](./IMS-REFERENCE-UI-SPEC.md)
- [`VERIFICATION-sprint-2.7-hse-approval.md`](./VERIFICATION-sprint-2.7-hse-approval.md)
- `docs/api.md` — `register_ims_reference` / `update_ims_reference` (sem integração)
- `docs/roadmap.md` — nota sub-sprint 2.8
- `packages/types/src/ims-reference.ts`
- Migration `20260808180000_ims_reference_rpcs.sql`
