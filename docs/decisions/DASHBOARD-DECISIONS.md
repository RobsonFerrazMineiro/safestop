# Decisões — Dashboard Operacional e Visão Gerencial (Sprint 3.2)

**Status:** `APROVADO`
**Sprint:** 3.2 — Dashboard Operacional e Visão Gerencial
**Data:** 2026-08-19
**Etapa:** 0 — Produto (agente MASTER / ARCHITECT / DOCS)
**Gate:** **G0 desbloqueado** — libera DATABASE (RPC) e UIUX (spec) em paralelo

**Arquitetura base:** Relatório arquitetural Sprint 3.2 (2026-08-19, ARCHITECT) — validado contra o repositório real.

**Fundação:** Sprints 2.0–3.1 (fluxo operacional completo + Notificações/Responsabilidade Operacional).

**Modelo de dados:** Nenhuma tabela nova. Todas as fontes (`occurrences`, `action_items`, `action_plans`, `mdho_assessments`, `notifications`) já existem — este documento não redesenha schema, apenas a RPC de leitura decidida em PO-DASH-1.

**Spec UI:** [`DASHBOARD-UI-SPEC.md`](./DASHBOARD-UI-SPEC.md) — Etapa UIUX concluída (2026-08-19)

---

## Objetivo

Registrar as decisões de produto **PO-DASH-1 a PO-DASH-4** (ambiguidades A–D da arquitetura), o desenho técnico completo exigido pela decisão A (RPC `get_dashboard_kpis`), uma correção factual e um achado técnico crítico encontrados na validação.

---

## Correção factual ao relatório arquitetural

| Item | Relatório dizia (§22) | Real (`20260809180000_create_action_plan_foundation.sql`) |
|---|---|---|
| `action_plans.status` | `DRAFT, IN_PROGRESS, COMPLETED` | **`OPEN, IN_PROGRESS, AWAITING_VALIDATION, COMPLETED, CANCELLED`** (5 valores) |

**Impacto:** a fórmula do card auxiliar `openActionPlans` deve ser `status NOT IN ('COMPLETED', 'CANCELLED')` (não apenas `!= 'COMPLETED'`), para não contar planos cancelados como "abertos" — mesma convenção já usada para `occurrences` e `action_items` no catálogo original.

---

## Achado técnico crítico — `pendingAwarenessOrg` não é computável sob `SECURITY INVOKER`

O relatório original (§29–32) estabelece que qualquer RPC de dashboard deve ser `SECURITY INVOKER`, nunca `DEFINER`, com a justificativa de que nenhuma condição que exige `DEFINER` em outras RPCs do projeto (recursão de RLS, transação multi-tabela) se aplicaria aqui.

**Isso é falso para exatamente uma métrica: `pendingAwarenessOrg`.**

`notifications_select` (RLS, migration `20260817180000_create_notifications_foundation.sql`, linha 448) restringe leitura **estritamente** a `recipient_member_id` = o próprio usuário autenticado (ou `is_platform_admin()`). Não existe policy que libere leitura ampla para quem tem `report.read`. Uma função `SECURITY INVOKER` rodando sob a sessão de um Gestor **nunca conseguirá** contar notificações de outros destinatários — o `count(*)` sempre retornaria o próprio subconjunto do usuário, resultado tecnicamente incorreto (não um erro, um número silenciosamente errado).

Esta é exatamente a mesma classe de problema que já levou `list_mdho_pending_approvals` (fila que agrega itens de outros usuários) a ser implementada como `SECURITY DEFINER` com checagem explícita de `has_permission(...)` dentro da função — não uma exceção nova, é o padrão já estabelecido no projeto para este tipo de agregação.

### Decisão técnica (não é ambiguidade de produto, é correção de premissa)

A RPC `get_dashboard_kpis` (PO-DASH-1) será **`SECURITY DEFINER`**, seguindo a mesma disciplina já usada em `approve_mdho_assessment`/`list_mdho_pending_approvals`: toda seção que dependeria de RLS para restringir visibilidade passa a ter checagem **explícita** de `has_permission()` dentro da função, replicando o que a RLS faria — nunca expondo dado sem o gate equivalente.

---

## Correção — semântica de `LIBERADA` e dataset canônico de QA

**Achado:** o exemplo de dataset usado no handoff de QA (`activeOccurrences=2` sobre "5 occurrences: 2 abertas, 1 interdição ativa, 2 concluídas") não é computável de forma inequívoca a partir da fórmula canônica e, pior, sugeria implicitamente que `LIBERADA` seria tratada como estado "concluído" para fins de contagem de estoque — o que **nunca foi a decisão real**.

### Esclarecimento obrigatório

`LIBERADA` **não é status terminal** para os KPIs de estoque (`activeOccurrences`, e qualquer outro indicador de "ocorrências abertas"). A fórmula canônica sempre foi e continua sendo:

```sql
activeOccurrences: status NOT IN ('ENCERRADA', 'CANCELADA')
```

Semanticamente: `LIBERADA` significa que a liderança autorizou a retomada da atividade (`docs/workflow.md` §5.10), mas a ocorrência só deixa de existir operacionalmente quando é formalmente `ENCERRADA` (§5.11). Entre `LIBERADA` e `ENCERRADA` a ocorrência ainda está "em quadro" — por isso conta como ativa no KPI de estoque.

Isso **não contradiz** o agrupamento visual definido em PO-DASH-4 (`LIBERADA` + `ENCERRADA` juntas na família de exibição "Concluída" do gráfico de distribuição). São dois artefatos diferentes, com propósitos diferentes:

| Artefato | Propósito | `LIBERADA` conta como |
|---|---|---|
| `activeOccurrences` (KPI de estoque) | "Quantas ocorrências ainda estão em quadro?" | **Ativa** (não é `ENCERRADA`/`CANCELADA`) |
| `occurrencesByStatusFamily` (gráfico de distribuição, PO-DASH-4) | "Como as ocorrências se distribuem visualmente por estágio?" | Agrupada em "Concluída" (junto com `ENCERRADA`), apenas para reduzir 12 status técnicos a 7 famílias legíveis — **não é uma reclassificação do KPI de estoque** |

Um mesmo registro `LIBERADA` aparece, corretamente, em `activeOccurrences` **e** no bucket "Concluída" do gráfico ao mesmo tempo — isso é esperado e não é inconsistência.

### Dataset canônico de QA (substitui o exemplo anterior)

| # | `status` | Ativa? (`activeOccurrences`) | Interditação ativa? | Família (PO-DASH-4) |
|---|---|---|---|---|
| 1 | `PARALISACAO_PREVENTIVA` | Sim | Não | Aberta / Em Avaliação |
| 2 | `PARALISACAO_PREVENTIVA` | Sim | Não | Aberta / Em Avaliação |
| 3 | `INTERDICAO_CONFIRMADA` | Sim | Sim | Interditada |
| 4 | `LIBERADA` | **Sim** | Não | Concluída |
| 5 | `ENCERRADA` | Não | Não | Concluída |

**Resultado esperado (canônico, substitui qualquer valor anterior):**

```text
activeOccurrences          = 4   (registros 1, 2, 3, 4 — exclui apenas 5, ENCERRADA)
activeInterdictions        = 1   (registro 3)
pendingEvaluation          = 0   (nenhum em EM_AVALIACAO neste dataset)
occurrencesByStatusFamily  = { "Aberta / Em Avaliação": 2, "Interditada": 1, "Concluída": 2, demais: 0 }
```

Se, alternativamente, o cenário mínimo for interpretado apenas como "2 abertas + 1 interditada + 2 concluídas" sem distinguir `LIBERADA` de `ENCERRADA` (ou seja, ambas as "concluídas" forem `ENCERRADA`/`CANCELADA`), então `activeOccurrences = 3` (2 abertas + 1 interditada) — nunca `2`. O valor `2` do exemplo original estava incorreto em qualquer interpretação e é descartado.

Esta tabela substitui, para todos os efeitos de teste, o exemplo citado no handoff de QA da Sprint 3.2 e no relatório arquitetural §59.

---

## Tabela de decisões PO-DASH-1 a PO-DASH-4

| # | Tema | Decisão do PO |
|---|---|---|
| PO-DASH-1 | Estratégia de dados | **Criar RPC `get_dashboard_kpis` desde o início** (não queries diretas) — ver desenho completo abaixo |
| PO-DASH-2 | Threshold "próximo do vencimento" | **3 dias** |
| PO-DASH-3 | Visibilidade de ciência pendente organizacional | **`pendingAwarenessOrg`** (organização inteira) restrito a `report.read`; **`scopedPendingAwareness`** (escopo de responsabilidade do usuário) liberado a quem tem `organization_contacts` configurado, como card operacional adicional |
| PO-DASH-4 | Agrupamento do gráfico de distribuição por status | **Agrupar em 7 famílias** — mapeamento abaixo |

---

## PO-DASH-4 — Mapeamento de famílias de status (final)

Reaproveita exatamente a mesma definição já usada em `activeInterdictions` no catálogo original (§17), sem inventar novo agrupamento:

| Família | `occurrences.status` incluídos |
|---|---|
| Aberta / Em Avaliação | `PARALISACAO_PREVENTIVA`, `EM_AVALIACAO` |
| Ver e Agir | `VER_E_AGIR` |
| Interditada | `INTERDICAO_CONFIRMADA`, `MDHO_EM_PREENCHIMENTO`, `AGUARDANDO_APROVACAO_HSE`, `AGUARDANDO_REGISTRO_IMS` |
| Em Tratativa | `EM_TRATATIVA` |
| Aguardando Validação | `AGUARDANDO_VALIDACAO` |
| Concluída | `LIBERADA`, `ENCERRADA` |
| Cancelada | `CANCELADA` |

Todos os 12 valores do CHECK são cobertos, sem sobreposição e sem omissão.

---

## PO-DASH-1 — Desenho completo da RPC `get_dashboard_kpis`

### Assinatura

```sql
create function public.get_dashboard_kpis(
  p_organization_id uuid,
  p_due_soon_days integer default 3,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$ ... $$;

grant execute on function public.get_dashboard_kpis(uuid, integer, timestamptz, timestamptz) to authenticated;
```

`p_due_soon_days` default **3** (PO-DASH-2). `p_period_start`/`p_period_end` opcionais — quando nulos, métricas de fluxo (`newOccurrencesInPeriod`, `avgEvaluationTime`, `avgReleaseTime`, `actionCompletionRate`) retornam `null`, não um valor calculado sobre "todo o histórico" (evita ambiguidade silenciosa entre "sem filtro" e "filtro vazio").

### Validação de entrada (obrigatória, primeira linha da função)

```sql
if p_organization_id not in (select public.current_organization_ids())
   and not public.is_platform_admin() then
  raise exception 'ORGANIZATION_NOT_ALLOWED' using errcode = '42501';
end if;
```

Mesmo padrão de validação de organização ativa já usado nas demais RPCs `SECURITY DEFINER` do projeto — o parâmetro do client nunca substitui autorização real (princípio já registrado no relatório original, §12, agora aplicado corretamente também dentro da própria RPC, já que `DEFINER` não tem RLS automática).

### Estrutura de retorno (jsonb)

```json
{
  "personal": {
    "myPendingActions": 0,
    "myOverdueActions": 0,
    "myDueSoonActions": 0,
    "myPendingAwareness": 0
  },
  "operational": {
    "scopedOpenOccurrences": null,
    "scopedPendingAwareness": null
  },
  "managerial": {
    "activeOccurrences": null,
    "pendingEvaluation": null,
    "activeInterdictions": null,
    "awaitingValidation": null,
    "mdhoPendingApproval": null,
    "overdueActionItems": null,
    "dueSoonActionItems": null,
    "openActionPlans": null,
    "occurrencesByStatusFamily": null,
    "occurrencesByArea": null,
    "newOccurrencesInPeriod": null,
    "avgEvaluationTimeMinutes": null,
    "avgReleaseTimeMinutes": null,
    "actionCompletionRate": null,
    "pendingAwarenessOrg": null
  }
}
```

**Regra de nulidade:** uma chave em `managerial`/`operational` é `null` quando o usuário **não tem a permissão correspondente** — nunca omitida do jsonb (contrato estável para o client tipar). O client nunca deve inferir "zero" a partir de `null`; `null` significa "sem acesso a este indicador", `0` significa "acesso concedido, valor real é zero".

### Gating por seção (dentro da função, replica o que a RLS faria)

| Seção | Condição para calcular (senão `null`) |
|---|---|
| `personal.*` | Sempre — dado do próprio `current_organization_member_id()`, identidade não é RBAC |
| `operational.scopedOpenOccurrences` / `scopedPendingAwareness` | Usuário possui ao menos 1 linha ativa em `organization_contacts` para este `organization_id` (qualquer `contact_type`) |
| `managerial.activeOccurrences`, `pendingEvaluation`, `activeInterdictions`, `awaitingValidation`, `occurrencesByStatusFamily`, `occurrencesByArea`, `newOccurrencesInPeriod`, `avgEvaluationTimeMinutes`, `avgReleaseTimeMinutes` | `has_permission(public.current_profile_id(), p_organization_id, 'occurrence.read')` |
| `managerial.mdhoPendingApproval` | `has_permission(..., 'occurrence.read')` OR `has_permission(..., 'mdho.approve')` OR `has_permission(..., 'mdho.return')` |
| `managerial.overdueActionItems`, `dueSoonActionItems`, `openActionPlans`, `actionCompletionRate` | `has_permission(..., 'occurrence.read')` OR `has_permission(..., 'action_plan.create')` OR `has_permission(..., 'action_plan.manage')` OR `has_permission(..., 'action_plan.validate')` |
| `managerial.pendingAwarenessOrg` | **Exclusivamente** `has_permission(..., 'report.read')` — única seção que existe por causa do achado técnico crítico acima |

### Regras de cálculo (idênticas ao catálogo original §17/§18, sem redefinir fórmula)

Reaproveitar exatamente as condições SQL já documentadas na arquitetura original para cada métrica (`activeOccurrences = status NOT IN ('ENCERRADA','CANCELADA')`, etc.), com a correção de `openActionPlans` (ver seção de correção factual) e o mapeamento de famílias (PO-DASH-4) para `occurrencesByStatusFamily`.

### `scopedPendingAwareness` (PO-DASH-3, novo — não estava no catálogo original)

Contagem de `notifications` com `requires_awareness = true AND awareness_confirmed_at IS NULL`, cujo `notification_event_id` referencia uma `occurrence` cujo `contract_id`/`area_id`/`unit_id` coincide com o escopo do usuário em `organization_contacts` — **dentro da própria função `SECURITY DEFINER`** (não é RLS, é contagem explícita, com o mesmo cuidado de nunca revelar o destinatário individual, apenas o número agregado do escopo).

---

## RBAC e Segurança — atualização

Substitui a premissa de `SECURITY INVOKER` do relatório original **apenas para esta RPC**, pelas razões técnicas descritas. Nenhuma nova permissão é criada — `get_dashboard_kpis` apenas consulta `has_permission()` internamente, exatamente como `approve_mdho_assessment`/`list_mdho_pending_approvals` já fazem.

| Risco adicional | Mitigação |
|---|---|
| `SECURITY DEFINER` usada para ocultar bug de permissão | Toda seção `managerial`/`operational` tem gate explícito nesta tabela — revisão de SECURITY deve conferir 1:1 contra esta tabela, não contra a suposição de `INVOKER` do relatório original |
| Vazamento de `pendingAwarenessOrg` para quem não tem `report.read` | Único ponto de acesso é esta RPC; gate testado isoladamente (usuário sem `report.read` deve receber `null`, nunca `0` nem o valor real) |

---

## Matriz de Segurança — checklist §54 (correção S32-FIN-L02)

Atualização do cenário **7 (RPC privilegiada)** do relatório arquitetural Sprint 3.2 (2026-08-19):

| # | Cenário (relatório original) | Premissa original | Decisão corrigida (PO-DASH-1) | Teste |
|---|---|---|---|---|
| 7 | RPC privilegiada (`get_dashboard_kpis`) | Deve ser `SECURITY INVOKER` — RLS aplicaria automaticamente | **`SECURITY DEFINER`** + gate **`has_permission()`** explícito por seção (mesmo padrão de `list_mdho_pending_approvals`). Motivo: `pendingAwarenessOrg` exige agregação org-wide em `notifications`, impossível sob RLS por destinatário. | Usuário sem `report.read` → `pendingAwarenessOrg: null`; spoof de `p_organization_id` → `ORGANIZATION_NOT_ALLOWED`; usuário sem `occurrence.read` → chaves gerenciais de ocorrência = `null` |

**Nota:** `null` ≠ `0` — ausência de permissão nunca deve ser confundida com valor zero real.

---

## Handoff atualizado por agente

Mantém a estrutura de gates do relatório original; os itens abaixo **substituem** a seção "DATABASE" original (que assumia "sem RPC salvo decisão explícita" — a decisão explícita foi tomada).

### DATABASE

1. Criar migration com a função `get_dashboard_kpis` conforme desenho acima (assinatura, jsonb, gating, `SECURITY DEFINER`).
2. Avaliar `EXPLAIN` das queries internas com dados de QA; criar apenas os índices do §33 do relatório original que o `EXPLAIN` confirmar necessários (nenhum índice especulativo).
3. `grant execute ... to authenticated`.
4. Testar manualmente: usuário sem `report.read` recebe `pendingAwarenessOrg: null`; usuário sem `occurrence.read` recebe todas as chaves `managerial.*` (exceto `pendingAwarenessOrg`, que segue sua própria regra) como `null`; `openActionPlans` exclui `CANCELLED`.

### BACKEND / TYPES

1. Um único service (`get-dashboard-kpis.ts`, Web e Mobile) chamando a RPC — nenhuma lógica de cálculo duplicada no client, apenas leitura do jsonb.
2. Tipo `DashboardKpis` em `packages/types` refletindo exatamente a estrutura jsonb (com `null` explícito nos campos gateados).

### UIUX

Pode iniciar em paralelo a DATABASE (não depende da RPC estar pronta, já tem catálogo + `docs/design-system.md`). Deve tratar `null` como "bloco oculto" (não "bloco com zero") na hierarquia de informação.

### WEB / MOBILE, BUILD, SECURITY (final), QA, DOCUMENTATION

Sem alteração em relação ao handoff do relatório original, exceto que QA deve testar explicitamente a tabela de gating acima (usuário com e sem cada permissão) em vez de "RLS já audita" (já que a proteção agora é `has_permission()` explícito dentro de `SECURITY DEFINER`, não RLS automática).

---

## Critérios de aceite adicionais desta sprint

- [ ] `get_dashboard_kpis` retorna `null` (não `0`, não erro) para toda seção sem permissão.
- [ ] `openActionPlans` exclui `CANCELLED` além de `COMPLETED`.
- [ ] `occurrencesByStatusFamily` cobre os 12 status reais em exatamente 7 famílias, sem sobreposição.
- [ ] `dueSoonActionItems` usa `p_due_soon_days = 3` como default.
- [ ] `pendingAwarenessOrg` inacessível (retorna `null`) para qualquer papel sem `report.read`, mesmo com `occurrence.read` amplo.
- [ ] `activeOccurrences` conta `LIBERADA` como ativa (fórmula `NOT IN ('ENCERRADA','CANCELADA')`) — validado contra o dataset canônico de QA (`activeOccurrences=4`, seção "Correção — semântica de LIBERADA" acima), nunca contra o exemplo antigo (`=2`).
- [ ] `occurrencesByStatusFamily` agrupa `LIBERADA` em "Concluída" **sem** que isso afete o cálculo de `activeOccurrences` — os dois artefatos são independentes.

---

## Próximo passo

Handoff liberado para **DATABASE** (criar `get_dashboard_kpis`) e **UIUX** — `DASHBOARD-UI-SPEC.md` entregue (2026-08-19); WEB/MOBILE podem implementar UI em paralelo.

---

## Registro de correção

```text
Correção aplicada por: agente ARCHITECT / DOCS
Data: 2026-08-19
Motivo: exemplo de dataset de QA inconsistente com a fórmula canônica de
activeOccurrences (LIBERADA tratada implicitamente como não-ativa).
Escopo da correção: apenas documentação (este arquivo). Nenhuma fórmula,
schema, RPC ou código foi alterado — a fórmula sempre foi
`status NOT IN ('ENCERRADA','CANCELADA')`; apenas o exemplo estava errado.
```

---

## Referências

- Relatório arquitetural Sprint 3.2 (2026-08-19)
- `docs/decisions/DASHBOARD-UI-SPEC.md` — Spec UI (grid, gráficos, Home Mobile)
- `docs/design-system.md` (seção Dashboard, linhas 2283–2408)
- `reference/base44/src/pages/Dashboard.jsx`
- `supabase/migrations/20260715220000_create_occurrences_foundation.sql`
- `supabase/migrations/20260805180000_create_mdho_foundation.sql`
- `supabase/migrations/20260809180000_create_action_plan_foundation.sql`
- `supabase/migrations/20260817180000_create_notifications_foundation.sql`
- `supabase/migrations/20260807180000_hse_approval_patch.sql` (`list_mdho_pending_approvals`, precedente de `SECURITY DEFINER` para fila agregada)
- `docs/decisions/NOTIFICATIONS-DECISIONS.md`
