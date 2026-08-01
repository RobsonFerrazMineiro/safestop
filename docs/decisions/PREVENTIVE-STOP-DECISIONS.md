# Decisões — Paralisação Preventiva / Stop Work (Sprint 2.1)

**Status:** `APROVADO`  
**Sprint:** 2.1 — Stop Work / Paralisação Preventiva  
**Data:** 2026-07-16  
**Etapa:** 0 — Produto (agente MASTER)  
**Desbloqueia:** Etapas 1 (DATABASE) e 3 (UIUX wireframes) em paralelo

**Arquitetura base:** Sprint 2.1 — Stop Work / Paralisação Preventiva (2026-07-16, aprovada)

**Fundação:** Sprint 2.0 — Occurrences Foundation (`docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md`)

---

## Objetivo

Registrar as decisões de produto **A-R1 a A-R10** da Sprint 2.1 (Stop Work / Paralisação Preventiva) **sem inventar regra de negócio**, usando como fonte primária `docs/workflow.md` §7.1, `docs/database.md` §7–8, `docs/roadmap.md` Sprint 2–3, a arquitetura aprovada e a especificação UI (`PREVENTIVE-STOP-UI-SPEC.md`).

---

## Decisões aprovadas

### A-R1 — Escopo Sprint 2.1 vs Roadmap Sprint 2

| Item | Decisão |
|---|---|
| **Escopo 2.1** | **UX/formulário PP operacional** sobre a fundação `Occurrence` — registro em < 60s, listagem PP, detalhe read-only, rascunho local mobile, geolocalização opt-in |
| **Fotos / evidências** | **Fora da 2.1** — sprint dedicada futura (roadmap Sprint 2 lista fotos; entrega incremental) |
| **Notificações automáticas** | **Fora da 2.1** — Sprint 3 (`docs/roadmap.md`) |
| **Timeline na 2.1** | Apenas `occurrence_status_history` — **1 entrada** na criação (`null → PARALISACAO_PREVENTIVA`); sem eventos de notificação ou comentários |
| **Transição `EM_AVALIACAO`** | **Fora da 2.1** — Sprint 4 via RPC dedicada |
| **Relação com roadmap** | Sprint 2.1 = **sub-entrega operacional** da Sprint 2 do roadmap; fotos e comunicação completa ficam em sprints subsequentes |

**Justificativa:** Preserva Mobile First e simplicidade operacional; evita prometer comunicação antes do módulo de notificações (Sprint 3).

---

### A-R2 — Empresa envolvida na abertura PP (PO)

| Item | Decisão |
|---|---|
| **Campo de produto** | *Empresa envolvida* (`docs/workflow.md` §7.1) — label de UI: **Contratada** |
| **Mapeamento técnico** | **`contractor_organization_id` obrigatório** na criação PP |
| **`contract_id`** | **Opcional** na 2.1 — usuário não é obrigado a selecionar contrato formal |
| **Hierarquia de UI (PO)** | **Contratada → Contrato** (cascata). Seleciona-se primeiro a contratada; o contrato, quando informado, depende dela |
| **UI Contratada** | **Select** de contratada vinculada à organização ativa — **não** texto livre |
| **UI Contrato** | Select/Combobox opcional, habilitado **somente após** contratada; opções filtradas por essa contratada |
| **Fonte de contratadas** | Organizações com contrato ativo (`contracts.is_active`) em que `client_organization_id = organization_id` ativa |
| **Fonte de contratos** | Contratos ativos da org ativa com `contractor_organization_id =` contratada selecionada |
| **Troca de contratada** | Zerar `contract_id`; recarregar opções de contrato |
| **Pré-seleção** | Se a contratada tiver **1** contrato ativo, pré-selecionar (acelera < 60s); se **0**, ocultar/desabilitar contrato; se **N**, listar |
| **Payload** | Sempre enviar `contractor_organization_id`; enviar `contract_id` **somente** se selecionado |
| **Validação de compatibilidade** | Quando `contract_id` for informado, RPC/trigger **rejeita** se o contrato não for compatível com a org ativa e a contratada (`client_organization_id`, `contractor_organization_id`; `unit_id` quando aplicável) |
| **Validação RPC** | Rejeitar create se `contractor_organization_id` nulo; rejeitar contratada sem contrato ativo com a org; rejeitar `contract_id` inconsistente |
| **Seed QA** | DATABASE deve incluir ao menos uma org contratada + contrato por org Alpha/Beta para cenários SW-* |

**Fundamentação:** `docs/workflow.md` §7.1 exige empresa; `docs/database.md` §7.4 prevê vínculo contratual; A3 da fundação 2.0 deixou `contractor_organization_id` opcional — **Sprint 2.1 torna obrigatório para PP**. A hierarquia contratada→contrato e a validação de compatibilidade estão detalhadas em `docs/decisions/PREVENTIVE-STOP-UI-SPEC.md` (seção Cascata).

**Não fazer:** campo texto livre; contrato sem contratada; tabela `stop_work`; integração IMS.

---

### A-R3 — `title` vs atividade (`task_description`)

| Item | Decisão |
|---|---|
| **Formulário PP** | Usuário preenche apenas **atividade** (`task_description`) — **sem campo `title` visível** |
| **Geração de `title`** | **Automática no cliente** antes do RPC: primeiros 200 caracteres de `task_description`, trim; se vazio após trim, validação Zod falha (atividade obrigatória) |
| **Padrão de exibição** | Listagem e detalhe usam `title` persistido; cards podem mostrar `taskDescription` como subtítulo quando útil |
| **RPC** | Continua exigindo `title` não nulo — recebe valor já gerado pelo cliente |

**Fundamentação:** Reduz fricção do < 60s; alinha ao padrão Base44 (título derivado de outros campos); mantém compatibilidade com schema 2.0 sem migration.

**Alternativa rejeitada:** Dois campos separados (título + atividade) no formulário PP — burocracia desnecessária na abertura.

---

### A-R4 — `stopped_at` na criação

| Item | Decisão |
|---|---|
| **Popular na RPC?** | **Sim** |
| **Valor** | `stopped_at = occurred_at` (sendo `occurred_at = coalesce(payload.occurred_at, now())`) |
| **Momento semântico** | Registro da parada = momento da ocorrência informado ou automático |
| **Migration** | Não estrutural — apenas alteração na RPC `create_occurrence` (Etapa BACKEND) |

**Fundamentação:** `docs/database.md` §8.1 inclui `stopped_at`; paralisação preventiva implica atividade interrompida no momento do registro.

---

### A-R5 — Filtro da listagem PP

| Item | Decisão |
|---|---|
| **Filtro** | Listagem da Sprint 2.1 exibe **apenas** `status = PARALISACAO_PREVENTIVA` |
| **UI** | Filtro **implícito** — sem chips/seletor de status na 2.1 |
| **Escopo futuro** | Filtros multi-status entram com a evolução do workflow (Sprint 4+) |

**Fundamentação:** A 2.1 entrega o registro e o acompanhamento da PP aberta; demais status pertencem a sprints posteriores.

---

### A-R6 — Motivo vs condição (Base44 `reason`)

| Item | Decisão |
|---|---|
| **Campo `reason` separado** | **Não** incluir na 2.1 |
| **Condição insegura** | Coberta por `condition_description` |
| **Medida imediata** | `immediate_action_description` permanece **opcional** |

**Fundamentação:** Evita duplicar texto livre; `condition_description` já atende ao workflow §7.1.

---

### A-R7 — Evidência mínima “quando viável”

| Item | Decisão |
|---|---|
| **Evidência obrigatória na abertura** | **Fora da 2.1** |
| **Upload / `occurrence_attachments`** | Sprint dedicada futura (roadmap Sprint 2 — entrega incremental de fotos) |

**Fundamentação:** A-R1 exclui fotos da 2.1 para preservar o registro em < 60s.

---

### A-R8 — Rotas

| Item | Decisão |
|---|---|
| **Rota primária de criação** | `/stop-work/new` |
| **Redirect** | `/occurrences/new` → `/stop-work/new` |
| **Listagem / detalhe** | `/stop-work` e `/stop-work/[id]` (mobile e web) |

**Fundamentação:** Separação de navegação operacional PP sem criar entidade de banco distinta.

---

### A-R9 — Módulos `occurrences` vs `stop-work`

| Item | Decisão |
|---|---|
| **`features/occurrences`** | Infra de persistência (RPC, queries, mapeamento `Occurrence`) |
| **`features/stop-work`** | Facade operacional PP (formulário, listagem, detalhe) |
| **Persistência** | Continua em `public.occurrences` — **sem** tabela `stop_work` |

**Fundamentação:** Reutiliza a fundação 2.0; evita duplicação de domínio.

---

### A-R10 — RBAC ressalvas #4 e #7

| Item | Decisão |
|---|---|
| **Fonte** | `docs/decisions/RBAC-MATRIX-APPROVED.md` |
| **Ressalva #4** | Admin Empresa — leitura de ocorrências: mantida proposta (`occurrence.read` apenas) |
| **Ressalva #7** | `occurrence.cancel` no Supervisor HSE: mantida proposta (incluir) |
| **Validação QA** | SW-02 e papéis seed existentes; não reabrir matriz na 2.1 sem decisão PO explícita |

**Fundamentação:** Preserva a matriz aprovada; a 2.1 exige `occurrence.create` / `occurrence.read` nos papéis seed de campo.

---

## Campos obrigatórios na PP (Sprint 2.1)

Alinhamento para DATABASE, BACKEND, VALIDATION, UIUX e formulários:

| Campo | Obrigatório | Origem |
|---|---|---|
| `organization_id` | Sim (server-side) | Contexto ativo + RPC |
| `area_id` | Sim | A2 (fundação 2.0) |
| `contractor_organization_id` | **Sim** | A-R2 |
| `task_description` | Sim | workflow §7.1 |
| `title` | Sim (auto-gerado) | A-R3 |
| `location_description` | Sim | workflow §7.1 |
| `condition_description` | Sim | workflow §7.1 |
| `severity` | Sim | workflow §7.1 |
| `contract_id` | Não | A-R2 |
| `unit_id` | Não | A4 (fundação 2.0) |
| `immediate_action_description` | Não | A-R6 |
| `latitude` / `longitude` / `location_accuracy` | Não | workflow §7.1 (quando autorizada) |
| `occurred_at` | Não (default `now()`) | Automático |
| `stopped_at` | Sim (RPC) | A-R4 (= `occurred_at`) |
| `created_by` | Sim (server-side) | `auth.uid()` |

**Status inicial:** `PARALISACAO_PREVENTIVA` (inalterado).

---

## Explicitamente fora da Sprint 2.1

- Tabela `stop_work`
- Upload de fotos / `occurrence_attachments`
- Notificações push ou internas
- Comentários
- Transição para `EM_AVALIACAO` ou demais status
- Cancelamento (`occurrence.cancel`) e encerramento
- Fila de sincronização offline
- Provider React dedicado
- Banner "Responsáveis notificados" na UI

---

## Dependências registradas

### Etapa 1 — DATABASE (desbloqueada)

1. ~~Seed: org(s) contratada(s) QA + `contracts` vinculados a Alpha/Beta.~~ **Concluído** (2026-07-16).
2. Confirmar `areas` / `units` QA existentes (A2 — já no seed 2.0).
3. `supabase db reset` local OK.

#### IDs QA — Stop Work / PP (seed local)

| Recurso | UUID | Uso |
|---|---|---|
| Org Alpha (CLIENT) | `b0000000-0000-4000-8000-000000000001` | Org ativa SW-01 com `qa-field` |
| Org Beta (CONTRACTOR) | `b0000000-0000-4000-8000-000000000002` | Empresa envolvida na Alpha; org ativa com `qa-multi` |
| Org Epsilon (CONTRACTOR) | `b0000000-0000-4000-8000-000000000006` | Empresa envolvida na Beta |
| Unidade Alpha | `e0000000-0000-4000-8000-000000000001` | Contrato Alpha→Beta |
| Área Alpha | `f0000000-0000-4000-8000-000000000001` | PP na Alpha |
| Unidade Beta | `e0000000-0000-4000-8000-000000000002` | Contrato Beta→Epsilon |
| Área Beta | `f0000000-0000-4000-8000-000000000002` | PP na Beta |
| Contrato Alpha→Beta | `01000000-0000-4000-8000-000000000001` | `contract_id` opcional; `contractor_organization_id` = Beta |
| Contrato Beta→Epsilon | `01000000-0000-4000-8000-000000000002` | `contract_id` opcional; `contractor_organization_id` = Epsilon |

**Payload SW-01 (Alpha):** `organization_id` Alpha, `area_id` Área Alpha, `contractor_organization_id` Beta.

**Payload SW-01 (Beta):** `organization_id` Beta, `area_id` Área Beta, `contractor_organization_id` Epsilon.

### Etapa 2 — BACKEND (após DATABASE)

1. RPC: `contractor_organization_id` obrigatório; `stopped_at = occurred_at`; validação de compatibilidade quando `contract_id` informado (A-R2).
2. `createPreventiveStopSchema` + `PREVENTIVE_STOP_STATUSES` nos packages.
3. Estender `OccurrenceListFilters` para `status[]` (listagem PP usa filtro implícito A-R5).

### Etapas 3–4 — UIUX / MOBILE / WEB

1. Formulário sem campo `title`; cascata **contratada → contrato** (A-R2); sem fotos/notificação.
2. Módulo `features/stop-work/` delegando para `features/occurrences/` (A-R8, A-R9).
3. Listagem apenas `PARALISACAO_PREVENTIVA` (A-R5).

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente MASTER (Tech Lead)
Data: 2026-07-16
Atualização documental A-R2 (PO) + A-R5…A-R10: 2026-08-01 (agente DOCS)
Base documental: docs/workflow.md §7.1; docs/database.md §7–8; docs/roadmap.md Sprint 2–3;
                 arquitetura Sprint 2.1 (2026-07-16); OCCURRENCE-FOUNDATION-DECISIONS.md;
                 PREVENTIVE-STOP-UI-SPEC.md (cascata A-R2); RBAC-MATRIX-APPROVED.md
Status: APROVADO — decisões PO A-R1…A-R10 = documentação oficial
```

---

## Referências

- `docs/workflow.md` §7.1–7.2
- `docs/database.md` §7.4–8.5
- `docs/roadmap.md` Sprint 2–3 (nota sub-sprint 2.1)
- `docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md` (A2, A3, A6, O10)
- `docs/decisions/PREVENTIVE-STOP-UI-SPEC.md` (cascata contratada → contrato)
- `docs/decisions/RBAC-MATRIX-APPROVED.md`
- Arquitetura Sprint 2.1 — Stop Work (2026-07-16)
