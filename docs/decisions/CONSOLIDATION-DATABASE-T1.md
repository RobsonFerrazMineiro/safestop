# Consolidação DATABASE — Sprint 2.9 T1

**Referência:** `docs/decisions/CONSOLIDATION-DECISIONS.md` (PO-CON-10, PO-CON-12)  
**Achados:** S29-RPC-03, S29-MIG-02, S29-MIG-01, S29-T-03, S29-HIST-01  
**Gate:** G2 DATABASE — `pnpm supabase:smoke-flow-io` PASS

---

## 1. Smoke integrado fluxo IO

| Item | Valor |
|------|-------|
| Script | `supabase/scripts/smoke-flow-operational-io.mjs` |
| Comando | `pnpm supabase:smoke-flow-io` |
| Cadeia | PP → start eval → IO → MDHO start/draft/submit → approve HSE → register IMS |
| Status final | `EM_TRATATIVA` + `ims_reference_code` |

Usuários QA: `qa-field` (PP), `qa-supervisor` (eval/IO/MDHO/IMS), `qa-lideranca` (approve HSE).

---

## 2. Matriz bloqueio — status terminais (comments vs attachments)

Fonte: migrations `20260802190000_occurrence_comment_rpcs.sql`, `20260801180000_create_occurrence_attachments.sql`, `20260801190000_occurrence_attachment_upload_rpcs.sql`.

| Status ocorrência | Comentários (`create` / `edit` / `delete`) | Evidências (`prepare` / `complete` / `fail` / `delete`) |
|-------------------|--------------------------------------------|--------------------------------------------------------|
| `ENCERRADA` | **Bloqueado** (`STATUS_MISMATCH`) | **Bloqueado** (`FORBIDDEN`) |
| `CANCELADA` | **Bloqueado** (`STATUS_MISMATCH`) | **Bloqueado** (`FORBIDDEN`) |
| `LIBERADA` | **Permitido** | **Bloqueado** (`FORBIDDEN`) |
| Demais status operacionais | Permitido (demais guards) | Permitido (demais guards) |

**Nota S29-HIST-01:** divergência intencional documentada — comentários permanecem editáveis em `LIBERADA`; upload/delete de evidências já bloqueia em `LIBERADA` desde Sprint 2.2. **Não alterar** na 2.9 sem decisão PO (PO-CON-1: zero mudança de regra de negócio).

---

## 3. PO-CON-12 — `get_occurrence_timeline` versão canônica

### Definição

A implementação **canônica** de `public.get_occurrence_timeline(uuid, jsonb, integer)` é a produzida pela migration:

```text
supabase/migrations/20260808180000_ims_reference_rpcs.sql
```

Esta migration contém o `CREATE OR REPLACE` completo acumulando todos os títulos/metadata das sub-sprints 2.3–2.8.

### Histórico de patches (somente referência — não re-aplicar)

| Migration | Conteúdo timeline |
|-----------|-------------------|
| `20260802180000_create_occurrence_comments_and_timeline.sql` | Base UNION ALL (history + comments + attachments) |
| `20260802200000_fix_timeline_platform_admin_bypass.sql` | Bypass read `can_read_occurrence_in_org` |
| `20260803180000_start_occurrence_evaluation_and_decision.sql` | VA: "Avaliação iniciada", "Decisão: Ver e Agir" |
| `20260804180000_extend_record_decision_interdicao_oficial.sql` | IO: "Interdição Oficial confirmada" |
| `20260805190000_mdho_rpcs.sql` | MDHO: iniciado/enviado/aprovado/devolvido |
| `20260808180000_ims_reference_rpcs.sql` | **Canônica** — IMS: registrada/alterada |

### Checklist para novo patch timeline

1. Partir do corpo completo em `20260808180000_ims_reference_rpcs.sql` (não de migration intermediária).
2. Adicionar apenas `CASE`/`metadata` necessários — sem remover títulos existentes.
3. Executar regressão: `pnpm supabase:smoke-timeline`, `pnpm supabase:smoke-flow-io`, smokes 2.4–2.8.
4. Migration consolidadora única (T2) **somente** se diff auditado = zero regressão em todos os smokes acima.

### Títulos STATUS_CHANGED esperados (fluxo IO completo)

```text
Paralisação Preventiva registrada
Avaliação iniciada
Interdição Oficial confirmada
MDHO iniciado
MDHO enviado
MDHO aprovado
Referência IMS registrada
```

---

## 4. Regressão obrigatória pós-T1

```bash
pnpm supabase:db:reset
pnpm supabase:smoke-flow-io
pnpm supabase:smoke-timeline
pnpm supabase:smoke-ver-e-agir
pnpm supabase:smoke-interdicao-oficial
pnpm supabase:smoke-mdho
pnpm supabase:smoke-ims-reference
```

---

## 5. Cenários SQL manuais (fluxo IO)

```sql
-- Após db reset + seed, usar IDs retornados pelo smoke-flow-io ou criar via RPCs encadeadas.

-- Snapshot status + IMS
select id, status, decision_type, ims_reference_code
from public.occurrences
where id = '<occurrence_id>';

-- Timeline
select public.get_occurrence_timeline('<occurrence_id>'::uuid, null, 40);

-- MDHO assessment
select id, status, submitted_by, approved_by
from public.mdho_assessments
where occurrence_id = '<occurrence_id>';
```
