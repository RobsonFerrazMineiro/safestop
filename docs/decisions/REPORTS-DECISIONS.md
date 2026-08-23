# Decisões — Relatórios Gerenciais, Análise Operacional e Exportação (Sprint 3.3)

**Status:** `APROVADO`
**Sprint:** 3.3 — Relatórios Gerenciais, Análise Operacional e Exportação
**Data:** 2026-08-22
**Etapa:** 0 — Produto (agente MASTER / ARCHITECT / DOCS)
**Gate:** **Gate A desbloqueado** — libera DATABASE/BACKEND sobre o catálogo P0 definido abaixo; **Gate D (UIUX) permanece condicionado** à matriz de colunas consolidada (fechada neste documento)

**Arquitetura base:** Relatório arquitetural Sprint 3.3 (2026-08-22, ARCHITECT) — validado contra o repositório real, sem correções factuais necessárias.

**Spec UI:** [`REPORTS-UI-SPEC.md`](./REPORTS-UI-SPEC.md) — Etapa UIUX concluída (2026-08-23); Gate D (spec)

**Fundação:** Sprint 3.2 (Dashboard Operacional — `get_dashboard_kpis`, `dashboard-formulas.ts`, `dashboard-query-keys`) — reutilizada, não redesenhada.

**Regra inviolável mantida:** Gerenciadora (`NOTIFICATIONS-DECISIONS.md` PO-NOTIF-2) segue **não migrada** — nenhum relatório desta sprint usa essa dimensão. Workaround `CUSTOM` não é tratado como Gerenciadora definitiva em nenhuma coluna/filtro novo.

---

## Objetivo

Registrar as decisões de produto **PO-REP-1 a PO-REP-6** (ambiguidades Q1–Q6 da arquitetura), consolidar a matriz de colunas do Relatório de Ocorrências (condição explícita do PO antes de liberar UIUX), e resolver dois achados técnicos gerados pelas próprias decisões (Ciência como P0 exige o mesmo padrão de `SECURITY DEFINER` do Dashboard; auditoria de exportação exige uma tabela nova, ausente hoje).

---

## Tabela de decisões PO-REP-1 a PO-REP-6

| # | Tema | Decisão do PO |
|---|---|---|
| PO-REP-1 | Catálogo P0 | **PP/Ocorrências + Plano de Ação** (Interdições permanece P1) |
| PO-REP-2 | Formato de exportação | **CSV + XLSX** já nesta primeira versão |
| PO-REP-3 | Matriz de colunas (Ocorrências) | **Aprovada com a matriz consolidada abaixo** (mantém §101 como base, sem mudança estrutural, com as garantias de cobertura pedidas) |
| PO-REP-4 | Relatório de Ciência | **Entra nesta sprint como P0** (deixa de ser P1) |
| PO-REP-5 | Mobile | **Não** — Relatórios permanecem exclusivamente Web nesta sprint |
| PO-REP-6 | Auditoria de exportação | **Necessária já nesta sprint** — ver desenho dedicado abaixo |

### Escopo final do P0 (após PO-REP-1 e PO-REP-4)

1. Relatório de Paralisações Preventivas / Ocorrências
2. Relatório de Plano de Ação
3. Relatório de Ciência

Interdições e Relatório Geral Unificado permanecem exatamente como no catálogo original (P1 / Futuro, sem mudança).

---

## PO-REP-3 — Matriz de colunas consolidada (Relatório de Ocorrências, contrato final)

Cobertura confirmada, campo a campo, contra o pedido explícito do PO (identificação, data da PP, área, contrato, contratada, status técnico, família analítica, situação da Interdição Oficial, referência IMS, responsável/contexto, datas/marcos do workflow) e contra o schema real (`occurrences`, migration `20260715220000_create_occurrences_foundation.sql`).

**Regra explícita (mantida do relatório original, §15, agora contratual):** nenhuma coluna desta tabela representa entidade 1:N (`action_items`, `occurrence_participants`, `notifications`). Esses domínios têm relatório próprio (Plano de Ação, Ciência) ou ficam disponíveis via drill-down para `/stop-work/[id]` — nunca como coluna que multiplicaria linhas de ocorrência.

| # | Campo | Origem | Classificação | Filtro | Ordenação | Exportação | Sensível? |
|---|---|---|---|---|---|---|---|
| 1 | `public_code` (código) | `occurrences` | Visível por padrão | Busca | Sim | Sim | Não |
| 2 | `occurred_at` (data da PP) | `occurrences` | Visível por padrão | Período (default) | Sim (default, desc) | Sim | Não |
| 3 | Área (nome) | `areas` (join `area_id`) | Visível por padrão | Sim | Sim | Sim | Não |
| 4 | Contrato (número/nome) | `contracts` (join `contract_id`) | Visível por padrão | Sim | Não | Sim | Não |
| 5 | Contratada executante (nome) | `organizations` (join `contractor_organization_id`) | Visível por padrão | Sim | Não | Sim | Não |
| 6 | `status` (técnico) | `occurrences` | Visível por padrão | Sim (técnico, 12 valores) | Sim | Sim | Não |
| 7 | Família analítica do status | Derivado — `DASHBOARD_OCCURRENCE_STATUS_FAMILIES` (`@safestop/types`) | Visível por padrão | Sim (7 famílias) | Não (deriva de `status`) | Sim | Não |
| 8 | `severity` | `occurrences` | Opcional/secundária | Sim | Sim | Sim | Não |
| 9 | `decision_type` (situação da Interdição Oficial) | `occurrences` | Opcional/secundária | Com/sem IO (`= 'INTERDICAO_OFICIAL'`) | Não | Sim | Não |
| 10 | `ims_reference_code` | `occurrences` | Opcional/secundária | Com/sem referência | Não | Sim | Não |
| 11 | Unidade (nome) | `units` (join `unit_id`) | Opcional/secundária | Sim | Não | Sim | Não |
| 12 | Gerência (nome) | `management_departments` (join `management_department_id`) | Export-only | Não (mantém decisão da Sprint 3.2 de não usar gerência como dimensão de gráfico dedicada) | Não | Sim | Não |
| 13 | `stopped_at` | `occurrences` | Export-only | Não | Não | Sim | Não |
| 14 | `evaluated_at` | `occurrences` | Export-only | Não | Não | Sim | Não |
| 15 | `released_at` | `occurrences` | Export-only | Não | Não | Sim | Não |
| 16 | `closed_at` | `occurrences` | Export-only | Não | Não | Sim | Não |
| 17 | `cancelled_at` + `cancellation_reason` | `occurrences` | Export-only (só quando `status = CANCELADA`) | Não | Não | Sim | Não |
| 18 | Registrado por (nome) | `profiles` (join `created_by`) | Export-only | Não | Não | Sim | **Sim** (nome de pessoa) |
| 19 | Avaliador responsável (nome) | `profiles` (join `assigned_evaluator_id`) | Export-only | Não | Não | Sim | **Sim** (nome de pessoa) |

**Nota sobre "situação da Interdição Oficial" (#9):** não é criada nenhuma coluna derivada nova (`interdiction_stage`) — `decision_type` combinado com `status`/família (já colunas 6–7) já responde integralmente "existe IO nesta ocorrência? em que estágio está?", sem inventar campo novo.

Esta matriz é o **contrato final** para BACKEND (contrato de dados/RPC) e UIUX (o que exibir por padrão vs. sob demanda vs. só no CSV/XLSX). Matriz análoga de Plano de Ação e Ciência a detalhar por BACKEND/UIUX no handoff, reaproveitando exatamente o mesmo padrão de 3 classificações (visível / opcional / export-only) e a mesma régua de sensibilidade (nome de pessoa = sensível, sem e-mail/telefone).

---

## PO-REP-2 — Exportação CSV + XLSX

CSV mantém a recomendação técnica original (BOM UTF-8, delimitador `;`, datas `dd/MM/yyyy`, mitigação de CSV injection).

**XLSX é dependência nova — não instalar sem o checklist do projeto:**

1. Necessidade concreta: confirmada por decisão explícita do PO (PO-REP-2), não hipotética.
2. Pesquisa de solução nativa: não há gerador XLSX nativo em Node/browser sem biblioteca — dependência é inevitável.
3. **BACKEND deve avaliar e justificar a biblioteca antes de instalar** (candidata usual para geração server-side/edge sem dependências nativas pesadas: `exceljs`) — critérios: manutenção ativa, sem vulnerabilidades conhecidas, licença compatível, sem dependência nativa que quebre build em CI/edge. Reportar a escolha e a justificativa no handoff de BACKEND, não decidir silenciosamente.
4. Nenhuma outra dependência de export (`jspdf`, geração de PDF) é instalada nesta sprint — PDF permanece fora do catálogo aprovado (§13 original, não reaberto).

---

## PO-REP-4 — Relatório de Ciência promovido a P0

Mantém integralmente o desenho já feito no relatório original (§26–27, linha "Ciência" da Matriz §100): dados de `notifications` + `notification_events`, filtros (período, ocorrência, destinatário, pendente/confirmada), autorização `report.read`, exportação CSV+XLSX (PO-REP-2).

### Achado técnico — mesma restrição de RLS já identificada na Sprint 3.2

`notifications_select` (RLS) restringe leitura estritamente a `recipient_member_id = current_organization_member_id()` (ou `is_platform_admin()`) — **exatamente a mesma razão** pela qual `pendingAwarenessOrg` exigiu `SECURITY DEFINER` em `get_dashboard_kpis` (`DASHBOARD-DECISIONS.md`, achado técnico crítico). Uma RPC `SECURITY INVOKER` para o Relatório de Ciência **nunca** conseguiria listar/agregar notificações de outros destinatários da organização.

**Decisão técnica (não é ambiguidade de produto, é correção de premissa, mesma disciplina já aplicada):** a RPC de Relatório de Ciência (`list_awareness_report`, nome sujeito a confirmação por BACKEND/DATABASE) é **`SECURITY DEFINER`**, com checagem explícita de `has_permission(current_profile_id(), p_organization_id, 'report.read')` logo na primeira linha — sem esse gate, nenhuma linha é retornada. Único relatório do P0 com esse requisito; Ocorrências e Plano de Ação seguem `SECURITY INVOKER` conforme recomendação original (RLS de `occurrence.read`/`can_access_occurrence()` já cobre esses dois).

---

## PO-REP-6 — Auditoria de exportação (desenho completo)

Não existe `AuditLog` genérico no projeto (confirmado). Em vez de criar um sistema de auditoria genérico (fora de escopo, violaria "menor mudança" e "não inventar tabela sem necessidade concreta"), cria-se uma tabela **estritamente dedicada a exportação de relatórios**, escopo mínimo suficiente para responder "quem exportou o quê, quando, com quais filtros, quantas linhas".

### Schema

```sql
create table public.report_export_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  exported_by uuid not null references public.profiles (id) on delete restrict,
  report_type text not null,
  export_format text not null,
  filters jsonb not null default '{}'::jsonb,
  row_count integer not null,
  created_at timestamptz not null default now(),

  constraint report_export_audit_report_type_check
    check (report_type in ('OCCURRENCES', 'ACTION_ITEMS', 'AWARENESS')),
  constraint report_export_audit_export_format_check
    check (export_format in ('CSV', 'XLSX')),
  constraint report_export_audit_row_count_check
    check (row_count >= 0)
);

create index report_export_audit_organization_id_created_at_idx
  on public.report_export_audit (organization_id, created_at desc);

comment on table public.report_export_audit is
  'Auditoria de exportações de relatório (Sprint 3.3, PO-REP-6) — não é AuditLog genérico do sistema.';
```

### RLS

- `SELECT`: apenas quem tem `report.read` na organização (mesma permissão que libera o relatório em si) ou `is_platform_admin()`. Um usuário nunca vê exportações de outra organização.
- `INSERT`/`UPDATE`/`DELETE` direto por `authenticated`: **não concedido** — escrita exclusiva via RPC `SECURITY DEFINER`, mesmo padrão de `occurrence_participants`/`notifications`.
- Sem `DELETE` também para `SECURITY DEFINER` — trilha de auditoria não é apagável nesta sprint (consistente com "sem exclusão" já decidido para notificações em `NOTIFICATIONS-DECISIONS.md` PO-NOTIF-8).

### RPC de registro

```sql
create function public.log_report_export(
  p_organization_id uuid,
  p_report_type text,
  p_export_format text,
  p_filters jsonb,
  p_row_count integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_organization_id not in (select public.current_organization_ids())
     and not public.is_platform_admin() then
    raise exception 'ORGANIZATION_NOT_ALLOWED' using errcode = '42501';
  end if;

  if not public.has_permission(public.current_profile_id(), p_organization_id, 'report.read') then
    raise exception 'PERMISSION_DENIED' using errcode = '42501';
  end if;

  insert into public.report_export_audit (
    organization_id, exported_by, report_type, export_format, filters, row_count
  ) values (
    p_organization_id, public.current_profile_id(), p_report_type, p_export_format, p_filters, p_row_count
  );
end;
$$;

grant execute on function public.log_report_export(uuid, text, text, jsonb, integer) to authenticated;
```

### Contrato de uso (BACKEND/WEB)

O client chama `log_report_export(...)` **imediatamente após** montar o arquivo com sucesso (não antes — se a geração falhar, não há exportação para auditar) e antes de disparar o download no navegador. Falha na chamada de auditoria não deve travar o download já gerado (registrar erro de auditoria separadamente, nunca bloquear a entrega do arquivo ao usuário por uma falha secundária) — mas deve ser logada como inconsistência para investigação, nunca silenciada.

---

## RBAC — sem mudança

Nenhuma permissão nova. `report.read` continua sendo o único gate de todos os três relatórios do P0 (Ocorrências, Plano de Ação, Ciência) e da auditoria de exportação — mesma permissão, mesmo papel de origem (Gestor, Administrador da Empresa, Administrador da Plataforma).

---

## Handoff atualizado por agente

Mantém a estrutura de gates do relatório original (§95, Gate A → I); os itens abaixo são **adições/atualizações**, não substituições integrais.

### DATABASE — itens atualizados

1. RPC `list_occurrences_report` — `SECURITY INVOKER`, paginada, filtros da matriz consolidada acima.
2. RPC `list_action_items_report` — `SECURITY INVOKER`, paginada.
3. **Nova:** RPC `list_awareness_report` — `SECURITY DEFINER`, gate explícito `report.read` (achado técnico PO-REP-4).
4. Índice `(organization_id, contract_id, created_at)` em `occurrences` (confirmado ausente).
5. **Nova:** migration `report_export_audit` (tabela + RLS + `log_report_export`, `SECURITY DEFINER`).
6. Segue proibido: alterar `get_dashboard_kpis`, criar schema de Gerenciadora nesta sprint, alterar RLS existente de `occurrences`/`action_items`/`notifications` sem justificativa nova.

### BACKEND — itens atualizados

1. Contratos de filtros/paginação/sort para os **três** relatórios do P0 (não dois).
2. Avaliar e justificar biblioteca XLSX (ver PO-REP-2) antes de instalar.
3. Gerador CSV com mitigação de injection + gerador XLSX.
4. Chamar `log_report_export` após cada exportação bem-sucedida (CSV ou XLSX), para os três relatórios.
5. Matriz de colunas de Plano de Ação e Ciência, mesmo padrão de 3 classificações da matriz de Ocorrências acima — submeter para validação antes de UIUX consumir.

### SECURITY (estrutural) — item adicional

Revisar especificamente: gate de `report.read` dentro de `list_awareness_report` e `log_report_export` (ambos `SECURITY DEFINER`); RLS de `report_export_audit` (nunca cross-tenant); `log_report_export` nunca é chamável para inflar/falsificar `row_count` de forma a mascarar auditoria (não é um risco de segurança de dados, mas de integridade de trilha — registrar como item de revisão, não bloqueante).

### UIUX, WEB, BUILD, SECURITY (final), QA, DOCUMENTATION

Sem alteração estrutural em relação ao handoff original, exceto:
- UIUX/WEB agora entregam **três** telas de relatório (Ocorrências, Plano de Ação, Ciência), não duas.
- QA adiciona cenário de auditoria de exportação (exportar → conferir linha em `report_export_audit` com `filters`/`row_count` corretos) e cenário de `list_awareness_report` negado para quem não tem `report.read`.
- DOCUMENTATION inclui `report_export_audit` e `log_report_export` em `docs/database.md`/`docs/api.md`.

---

## Adendo BACKEND (2026-08-22) — Matriz de colunas: Plano de Ação e Ciência

**Status:** `CONSUMIDO POR UIUX` (2026-08-23) — matrizes refletidas em [`REPORTS-UI-SPEC.md`](./REPORTS-UI-SPEC.md) §6.3–6.4; segue o mesmo padrão de 3 classificações e a mesma régua de sensibilidade já aprovados para Ocorrências acima.

Derivada diretamente do contrato real das RPCs `list_action_items_report` (migration `20260822192000`) e `list_awareness_report` (migration `20260822193000`) — nenhum campo novo foi inventado; apenas os campos já retornados pelas RPCs foram classificados.

### Relatório de Plano de Ação (`list_action_items_report`)

| # | Campo | Origem | Classificação | Filtro | Ordenação | Exportação | Sensível? |
|---|---|---|---|---|---|---|---|
| 1 | `title` | `action_items` | Visível por padrão | Não (RPC não expõe busca textual) | Sim | Sim | Não |
| 2 | `due_at` (prazo) | `action_items` | Visível por padrão | Período (default) | Sim (default, asc) | Sim | Não |
| 3 | `status` | `action_items` | Visível por padrão | Sim (enum) | Sim | Sim | Não |
| 4 | `isOverdue` (vencida) | Derivado — mesma fórmula de `isOverdueActionItem` (`@safestop/types`) | Visível por padrão | Sim (`overdueOnly`) | Não (deriva de `due_at`/`status`) | Sim | Não |
| 5 | `isDueSoon` (próxima do vencimento) | Derivado — mesma fórmula de `isDueSoonActionItem` (`@safestop/types`) | Visível por padrão | Sim (`dueSoonOnly` + `dueSoonDays`) | Não | Sim | Não |
| 6 | Responsável (nome) | `resolve_member_display_name(responsible_member_id)` | Opcional/secundária | Sim (`responsibleMemberId`) | Não | Sim | **Sim** (nome de pessoa) |
| 7 | `occurrence_id` | `action_plans` (join via `action_plan_id`) | Export-only | Não | Não | Sim | Não |
| 8 | `action_plan_id` | `action_items` | Export-only | Não | Não | Sim | Não |
| 9 | `completed_at` | `action_items` | Export-only | Não | Não | Sim | Não |
| 10 | `validated_at` | `action_items` | Export-only | Não | Não | Sim | Não |

**Limitação conhecida (registrada, não é ambiguidade a decidir agora):** `list_action_items_report` não retorna `public_code` da ocorrência relacionada — apenas `occurrence_id` (uuid). A correlação com o Relatório de Ocorrências no CSV/XLSX é feita pelo uuid (também presente como `id` na linha do Relatório de Ocorrências), não pelo código público. Se UIUX precisar de correlação amigável (ex.: mostrar o código da PP na linha do item de ação), é necessário decisão explícita futura para estender a RPC — fora do escopo desta sprint (menor mudança).

### Relatório de Ciência (`list_awareness_report`)

| # | Campo | Origem | Classificação | Filtro | Ordenação | Exportação | Sensível? |
|---|---|---|---|---|---|---|---|
| 1 | `created_at` | `notifications` | Visível por padrão | Período (default) | Sim (default, desc) | Sim | Não |
| 2 | `event_type` | `notification_events` | Visível por padrão | Não (RPC não expõe filtro por tipo) | Sim | Sim | Não |
| 3 | Destinatário (nome) | `resolve_member_display_name(recipient_member_id)` | Visível por padrão | Sim (`recipientMemberId`) | Não | Sim | **Sim** (nome de pessoa) |
| 4 | `awareness_confirmed_at` (ciência) | `notifications` | Visível por padrão | Sim (`pendingOnly`, composto) | Não | Sim | Não |
| 5 | `requires_awareness` | `notifications` | Opcional/secundária | Indireto (compõe `pendingOnly`) | Não | Sim | Não |
| 6 | `read_at` (leitura) | `notifications` | Opcional/secundária — **leitura ≠ ciência**, nunca tratar como sinônimo (docs/notifications.md) | Não | Não | Sim | Não |
| 7 | `occurrence_id` | `notification_events` | Export-only | Sim (`occurrenceId`) | Não | Sim | Não |
| 8 | `notification_event_id` | `notifications` | Export-only | Não | Não | Sim | Não |

Nenhum e-mail/telefone exposto em nenhum dos dois relatórios (mesma régua de sensibilidade da matriz de Ocorrências) — os únicos campos sensíveis são nomes de pessoa (`responsibleMemberName`, `recipientMemberName`), resolvidos por `resolve_member_display_name` com escopo estrito de `full_name`.

---

## Adendo BACKEND (2026-08-23) — Correção Gate G: paridade Dashboard × Reports (interdições ativas)

**Problema reportado pelo QA:** com filtro de Área A + período de 30 dias no Relatório de Ocorrências, a contagem de "interdições ativas" divergiu do KPI `activeInterdictions` do Dashboard 3.2 (`get_dashboard_kpis`), que não recebe `p_area_id`.

### Decisão técnica

**Escolhida a opção 2: a exigência de paridade numérica é limitada às condições de filtro suportadas por ambos — `get_dashboard_kpis` NÃO foi alterada.**

Motivos (nenhum é uma opinião nova — todos já eram decisões/documentação existentes antes deste adendo):

1. **Proibição explícita já registrada nesta sprint** (linha 202 deste documento, handoff DATABASE item 6): "Segue proibido: alterar `get_dashboard_kpis` [...] nesta sprint." Adicionar `p_area_id`/`p_contract_id`/`p_contractor_organization_id` à RPC violaria essa proibição sem autorização explícita do PO — fora do escopo desta correção de Gate.
2. **`docs/decisions/DASHBOARD-UI-SPEC.md` §6.1–6.2** já documenta que filtros de escopo (área/contrato/contratada) são **client-side** no Dashboard 3.2, e que levar esse escopo para dentro da RPC é explicitamente "Sprint futura" — ou seja, já era um adiamento deliberado, não uma lacuna a preencher agora.
3. **As duas métricas nunca tiveram a mesma semântica**, mesmo antes deste Gate:
   - Dashboard `activeInterdictions` é métrica de **estoque** (`stock: true` em `dashboard-metrics.ts`): nunca aplica filtro de período, e — quando há escopo de área/contrato/contratada ativo na tela — é recomputada no client sobre o **conjunto completo** acessível via `computeScopedManagerialOccurrenceKpis` (`apps/web/src/features/dashboard/utils/compute-scoped-occurrence-kpis.ts`), sempre ignorando período.
   - Reports `activeInterdictionsCount` (`computeOccurrenceReportSummary`, `packages/types/src/report.ts`) é calculada sobre o resultado da RPC `list_occurrences_report`, que **sempre filtra por período** (`occurred_at`, decisão de UX registrada em `REPORTS-UI-SPEC.md` §5.1/REP-C12: "o período filtra os registros deste relatório" — deliberadamente **não** reaproveita a semântica de estoque do Dashboard). Além disso, o card de resumo do Relatório é explicitamente rotulado **"Nesta página"** (`REPORTS-UI-SPEC.md` §4/REP-C13) — soma apenas os itens da página atual (`items`, default 20), nunca o total do conjunto filtrado.

Portanto, comparar o card "Nesta página" do Relatório (com período ativo) contra o KPI de estoque do Dashboard (sem período) sempre poderá divergir por construção — isso não é um bug de contagem, é a mesma fórmula (`isActiveInterdictionOccurrence`) aplicada a dois conjuntos de dados diferentes por decisão de produto já tomada em ambas as specs.

### Paridade válida — condição formal (nova, registrada aqui)

A paridade numérica entre Dashboard e Reports para `activeInterdictions`/`activeInterdictionsCount` **só é uma garantia válida** quando todas as condições abaixo são atendidas simultaneamente:

1. Mesmo filtro de escopo em ambos (`areaId`/`contractId`/`contractorOrganizationId`) — no Dashboard via `filterByDashboardScope`, no Reports via `p_area_id`/`p_contract_id`/`p_contractor_organization_id` da RPC.
2. **Sem filtro de período no lado do Reports** (equivalente ao comportamento do Dashboard, que nunca filtra estoque por período).
3. Comparação sobre o **conjunto completo filtrado** do Reports (todas as páginas, ex. via `fetchAllReportRows`), não sobre o card "Nesta página" da UI.

Fora dessas três condições, os números **podem divergir legitimamente** e isso não caracteriza defeito. O teste de paridade obrigatório (ver abaixo) valida exatamente essas condições, incluindo o caso de uma interdição ativa **fora** da área filtrada (deve ser excluída dos dois lados).

### Teste determinístico adicionado

`apps/web/src/features/reports/services/dashboard-parity.test.ts` — usa as funções reais de produção (não reimplementa fórmula): `filterByDashboardScope` + `computeScopedManagerialOccurrenceKpis` (Dashboard) e `computeOccurrenceReportSummary` (Reports), sobre o mesmo dataset fixo (10 ocorrências, 3 áreas, incluindo 1 interdição ativa fora da área filtrada). Confirma contagem idêntica nas 3 condições acima e exclusão correta da interdição fora de área em ambos os lados.

### Nenhuma alteração de contrato

Nenhum tipo, RPC, service ou schema de validação foi alterado por este adendo — apenas documentação (este adendo) e um teste novo. `packages/types/src/report.ts` recebeu apenas comentário adicional (sem mudança de assinatura) esclarecendo o escopo da garantia de paridade em `OccurrenceReportSummary`.

---

## Critérios de aceite adicionais desta sprint

- [ ] `list_awareness_report` retorna vazio/erro de permissão para quem não tem `report.read`, mesmo com `occurrence.read` amplo.
- [ ] Toda exportação (CSV ou XLSX, qualquer um dos 3 relatórios) gera exatamente 1 linha em `report_export_audit` com `row_count` igual ao número real de linhas exportadas.
- [ ] Matriz de colunas do Relatório de Ocorrências implementada exatamente como a tabela consolidada acima (19 campos, 3 classificações).
- [ ] Nenhuma coluna de `action_items`/`occurrence_participants`/`notifications` aparece diretamente no Relatório de Ocorrências.
- [ ] Biblioteca XLSX escolhida e justificada por BACKEND antes de instalada (não é decisão silenciosa).

---

## Próximo passo

Handoff liberado para **DATABASE** / **BACKEND** (Gate A). **UIUX** — `REPORTS-UI-SPEC.md` entregue (2026-08-23); matrizes de Plano de Ação e Ciência do adendo BACKEND **consumidas** na spec. **WEB** pode implementar as três telas sob Gate D.

---

## Referências

- Relatório arquitetural Sprint 3.3 (2026-08-22)
- `docs/decisions/REPORTS-UI-SPEC.md` — Spec UI (filtros, tabela, exportação, Base44)
- `docs/decisions/DASHBOARD-DECISIONS.md` (precedente do achado técnico `SECURITY DEFINER` para agregação de `notifications`)
- `docs/decisions/NOTIFICATIONS-DECISIONS.md` (PO-NOTIF-2 Gerenciadora, PO-NOTIF-8 sem exclusão)
- `docs/decisions/EVIDENCE-DECISIONS.md` (exclusão de PDF/Office já registrada, não reaberta)
- `packages/types/src/dashboard-formulas.ts`
- `supabase/migrations/20260715220000_create_occurrences_foundation.sql`
- `supabase/migrations/20260817180000_create_notifications_foundation.sql`
- `supabase/migrations/20260820180000_dashboard_indexes.sql`
- `supabase/migrations/20260820182000_create_dashboard_kpis_rpc.sql`
