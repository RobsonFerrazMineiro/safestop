# Decisões — Fundação Occurrence (Sprint 2.0)

**Status:** `APROVADO`  
**Sprint:** 2.0 — Occurrences Foundation  
**Data:** 2026-07-15  
**Etapa:** 0 — Produto (aplicada pelo agente MASTER)  
**Desbloqueia:** Etapas 1 (DATABASE) e 2 (BACKEND)

**Arquitetura base:** Sprint 2.0 — Occurrences Foundation (2026-07-15)

---

## Objetivo

Resolver as ambiguidades A1–A10 da arquitetura Sprint 2.0 **sem inventar regra de negócio**, usando como fonte primária `docs/database.md`, `docs/workflow.md` e `docs/engineering.md`.

---

## Decisões aprovadas

### A1 — Formato de `public_code`

| Item | Decisão |
|---|---|
| **Formato** | `SS-{YY}-{NNNNNN}` |
| **Exemplo** | `SS-26-000001` (alinhado a `docs/database.md` §8.2 e `docs/design-system.md`) |
| **Prefixo** | `SS` fixo (SafeStop) |
| **Ano `{YY}`** | Dois dígitos do ano civil UTC no momento da criação (`extract(year from now()) % 100`) |
| **Sequência `{NNNNNN}`** | 6 dígitos, zero-padded; **escopo:** `organization_id` + ano |
| **Unicidade** | Global na coluna `public_code` (constraint UNIQUE) |
| **Geração** | Exclusivamente na RPC `create_occurrence()` — nunca no cliente |
| **IMS** | Sem relação com `public_code`; IMS permanece em `ims_reference_code` (Sprint futura) |

**Implementação (orientação DATABASE):** usar contador atômico por `(organization_id, year)` em tabela auxiliar ou `INSERT ... ON CONFLICT` — detalhe técnico na migration, não altera o formato aprovado.

---

### A2 — `area_id` obrigatório na criação?

| Item | Decisão |
|---|---|
| **Obrigatório?** | **Sim** |
| **Fonte** | `docs/workflow.md` §7.1 — área listada em *campos mínimos* |
| **Validação** | Zod + RPC: `area_id` UUID não nulo |
| **RLS** | Área deve pertencer à mesma `organization_id` da ocorrência |

**Consequência para seed QA:** Etapa 1 DATABASE deve incluir ao menos uma `area` ativa por organização de teste (hoje ausente no seed).

---

### A3 — `contract_id` obrigatório?

| Item | Decisão |
|---|---|
| **Obrigatório?** | **Não** (opcional na fundação 2.0) |
| **Fonte** | `docs/database.md` §34 — contratos *podem* entrar no MVP; §35 item 3 ainda pendente para fluxo completo |
| **Validação** | Se informado: UUID válido; FK consistente com `organization_id` |
| **Sprint futura** | Sprint 2 (PP) pode tornar obrigatório conforme escopo contratual do cliente |

**Nota:** `docs/workflow.md` §7.1 exige *empresa envolvida* — na fundação 2.0 isso **não** se resolve via `contract_id` obrigatório. Campo `contractor_organization_id` permanece opcional; refinamento na Sprint 2 (registro PP).

---

### A4 — `unit_id` obrigatório?

| Item | Decisão |
|---|---|
| **Obrigatório?** | **Não** (opcional na fundação 2.0) |
| **Fonte** | `docs/workflow.md` §7.1 não lista unidade nos campos mínimos; área sim |
| **Validação** | Se informado: deve ser consistente com `area.unit_id` quando a área tiver unidade |

---

### A5 — Campo genérico `occurrence_kind`?

| Item | Decisão |
|---|---|
| **Criar nesta sprint?** | **Não** |
| **Classificação** | `status` (12 valores) + `decision_type` (quando aplicável) |
| **Extensão futura** | Reservar enum `occurrence_kind` somente quando produto definir tipos além de PP/IO |

---

### A6 — Rascunho server-side vs local-only?

| Item | Decisão |
|---|---|
| **Modelo** | **Local-only** no dispositivo (mobile) |
| **Status `DRAFT` no banco?** | **Não** — proibido |
| **Estados de sync** | `DRAFT` / `SAVED_LOCALLY` / `WAITING_FOR_CONNECTION` = UI/sync (`docs/engineering.md` §30) |
| **Sprint 2.0** | Projetar `useOccurrenceDraft` + store; **sem** fila de sincronização |
| **Mensagens UI** | Permitido: *Salvo no dispositivo*, *Registrado no servidor* — **proibido** *Alertas enviados* antes do servidor |

---

### A7 — Web: Server Actions vs RPC direto?

| Item | Decisão |
|---|---|
| **Padrão** | **RPC Supabase direto** (`supabase.rpc('create_occurrence', ...)`) |
| **Motivo** | Consistência Web/Mobile; Auth + RLS já no cliente autenticado |
| **Server Actions** | Fora da fundação 2.0 |

---

### A8 — Views `occurrence_summary_view` / `open_occurrences_view`?

| Item | Decisão |
|---|---|
| **Nesta sprint?** | **Não** — adiar para sprint de listagem otimizada |
| **Listagem 2.0** | Query direta em `occurrences` com RLS + paginação |

---

### A9 — `audit_events` na criação?

| Item | Decisão |
|---|---|
| **Incluir na RPC 2.0?** | **Não** |
| **Motivo** | Tabela `audit_events` não existe na migration foundation atual |
| **Substituto** | `occurrence_status_history` na primeira inserção (criação) |
| **Futuro** | Incluir `audit_events` quando tabela for migrada |

---

### A10 — Evidência mínima na criação?

| Item | Decisão |
|---|---|
| **Na fundação 2.0?** | **Não** |
| **Fonte** | `docs/workflow.md` §7.1 — *quando viável*; Sprint 2 (feature PP) implementa evidências |
| **Tabela** | `occurrence_attachments` fora do escopo 2.0 |

---

## Campos obrigatórios na RPC `create_occurrence` (fundação)

Alinhamento final para DATABASE, BACKEND, VALIDATION e formulários:

| Campo | Obrigatório | Origem |
|---|---|---|
| `organization_id` | Sim (server-side) | `activeOrganization` validada no RPC |
| `area_id` | Sim | A2 |
| `title` | Sim | Arquitetura 2.0 |
| `task_description` | Sim | workflow §7.1 (atividade) |
| `location_description` | Sim | workflow §7.1 (local) |
| `condition_description` | Sim | workflow §7.1 |
| `severity` | Sim | workflow §7.1 (criticidade) |
| `contract_id` | Não | A3 |
| `unit_id` | Não | A4 |
| `contractor_organization_id` | Não | A3 (empresa envolvida — Sprint 2) |
| `immediate_action_description` | Não | Arquitetura |
| `latitude` / `longitude` / `location_accuracy` | Não | workflow §7.1 (quando autorizada) |
| `occurred_at` | Não (default `now()`) | Automático |
| `created_by` | Sim (server-side) | `auth.uid()` |

**Status inicial:** `PARALISACAO_PREVENTIVA` (`docs/database.md` §8.5, `docs/workflow.md` §4).

---

## Parâmetros de cache (não bloqueantes)

Valores sugeridos para implementação (Etapa 5/6):

| Query | `staleTime` |
|---|---|
| Lista de ocorrências | 30s |
| Detalhe | 60s |
| Histórico de status | 5min |

---

## Dependências registradas para Etapa 1 (DATABASE)

1. **Seed de `areas` (e opcionalmente `units`)** para organizações QA — necessário para O1 (criar ocorrência).
2. **Sem** `occurrence_kind`, **sem** `audit_events`, **sem** views de listagem.
3. **Matriz RBAC** já aprovada — `qa-field` possui `occurrence.create` e `occurrence.read`.

---

## O10 — Platform admin: criar ocorrência em org sem vínculo?

**Data da decisão:** 2026-07-15  
**Contexto QA:** cenário O10 — `qa-platform@safestop.local` com `membership_type = PLATFORM_ADMIN` e papel *Administrador da Plataforma* na org Delta.

### Decisão

| Pergunta | Resposta |
|---|---|
| Platform admin pode **criar** ocorrência em organização **sem vínculo ativo** (`organization_members`)? | **Não** |
| Platform admin pode **ler** ocorrências cross-org? | **Sim** — via `is_platform_admin()` no RLS (comportamento atual) |
| Platform admin pode **criar** na org onde possui vínculo + `occurrence.create`? | **Sim** — ex.: org Delta (seed QA) |

### Fundamentação

1. **Domínio operacional:** Paralisação Preventiva é ação de **campo** por membro da organização (`docs/workflow.md` §7.1). Administrador de plataforma atua em **suporte/gestão da plataforma**, não como operador de campo em tenant alheio.
2. **Rastreabilidade:** `create_occurrence` fixa `created_by = auth.uid()`. Criar em org sem vínculo atribuiria indevidamente a paralisação ao admin da plataforma.
3. **Consistência RBAC:** `has_permission(code, org_id)` exige `organization_members` na org alvo (`docs/database.md` §23.3). Leitura cross-org usa `is_platform_admin()`; escrita operacional **não** deve contornar vínculo.
4. **RPC atual:** `create_occurrence` valida `organization_id ∈ current_organization_ids()` **antes** de `has_permission` — comportamento **correto** e **mantido**.
5. **UI:** `isPlatformAdmin` amplia `can()` na interface, mas **não** substitui vínculo organizacional para mutações. Org ativa continua vindo da lista autorizada do usuário.

### Comportamento esperado no QA (O10 revisado)

| Ação | `qa-platform` na org **Alpha** (sem vínculo) | `qa-platform` na org **Delta** (com vínculo) |
|---|---|---|
| Listar ocorrências | ✅ (RLS `is_platform_admin`) | ✅ |
| Ver detalhe | ✅ | ✅ |
| Criar ocorrência | ❌ `FORBIDDEN` — sem vínculo na org | ✅ se `occurrence.create` efetivo |

### Fora de escopo (sprint futura)

- Criação **em nome de** outro usuário / suporte assistido (“impersonation” ou `on_behalf_of`) — exige fluxo, auditoria e produto dedicados.
- Bypass de `current_organization_ids()` para escrita operacional.

### Impacto em implementação

- **Nenhuma alteração** necessária em RPC, RLS ou apps — decisão confirma o desenho atual.
- Atualizar checklist QA O10 para refletir leitura cross-org + negação de create sem vínculo.

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER (ausência de agente PRODUTO dedicado)
Data: 2026-07-15
Base documental: docs/database.md §8, §34–35; docs/workflow.md §7.1; docs/engineering.md §30
Status: APROVADO — liberar DATABASE e BACKEND
```

---

## Referências

- `docs/database.md` §8.1–8.5, §34–35
- `docs/workflow.md` §7.1–7.2
- `docs/engineering.md` §30
- Sprint 2.0 — Occurrences Foundation (arquitetura 2026-07-15)
