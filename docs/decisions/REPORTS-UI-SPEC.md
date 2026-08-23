# Spec UI/UX — Relatórios Gerenciais (Sprint 3.3)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO` (Gate D)  
**Sprint:** 3.3 — Relatórios Gerenciais, Análise Operacional e Exportação  
**Agente:** UIUX  
**Data:** 2026-08-23  
**Entregável:** `docs/decisions/REPORTS-UI-SPEC.md`

**PO (fonte oficial):** [`REPORTS-DECISIONS.md`](./REPORTS-DECISIONS.md) — PO-REP-1…PO-REP-6; matrizes Ocorrências (fechada) + Plano de Ação / Ciência (adendo BACKEND consumido).

**Contratos (não alterar fórmulas):** `packages/types/src/report.ts` — filtros, rows, sort, paginação, `compute*ReportSummary`, export formats.

**Referências de composição:**

| Fonte | Uso |
|---|---|
| `reference/base44/.../Dashboard.jsx` | Header + KPI grid + empty |
| `reference/base44/.../InterdictionList.jsx` | Busca, chips de filtro, contagem, toggle filtros |
| `apps/web/.../dashboard-kpi-card.tsx` | Card KPI dark + laranja |
| `apps/web/.../dashboard-period-filter.tsx` | Presets de período |
| `apps/web/.../dashboard-scope-filters.tsx` | Drawer/dialog de escopo + limpar |
| `apps/web/.../organization-contacts-table.tsx` | Tabela semântica dark |
| `docs/design-system.md` | Dashboard/KPIs/Empty/Skeleton — + extensão Tabelas/Exportação |

**Sem código apps nesta entrega UIUX** (exceto atualização documental em `design-system.md`).  
**Mobile:** fora (PO-REP-5) — apenas Web.

---

## Objetivo

Especificar WEB sem ambiguidade para três relatórios P0:

1. Ocorrências / Paralisações  
2. Plano de Ação  
3. Ciência  

Layout: **resumo → toolbar → tabela → paginação**, com exportação CSV/XLSX, estados, drill-down e a11y — reutilizando Dashboard 3.2 e tabela de contatos, **sem** tema claro/azul Base44.

---

## Princípios

| Regra | Aplicação |
|---|---|
| Dark + laranja `#F97316` | Primary, chips ativos, links de ação |
| Uma pergunta por KPI de resumo | Não clonar Dashboard completo |
| Matriz de colunas = contrato | Visível / opcional / export-only — sem inventar campos |
| Fórmulas | Só consumir `statusFamily`, `isOverdue`, `isDueSoon`, helpers `@safestop/types` |
| Export | Duas ações claras: CSV e XLSX |
| Gate | `report.read` — sem permissão → forbidden |
| Feature | `features/reports/` |

---

# 1. Investigação Base44 (obrigatória)

Arquivos lidos integralmente: `Dashboard.jsx`, `InterdictionList.jsx`.  
(`DashboardChart.jsx` referenciado pelo Dashboard mas **ausente** no tree `reference/base44` — não usado.)

## 1.1 Achados

| Arquivo | Padrão observado |
|---|---|
| **Dashboard** | `max-w-6xl`; título + subtítulo; CTA primary à direita (`hidden lg`); KPI grid `grid-cols-2 lg:grid-cols-4` + segunda fileira; empty com ícone + CTA; loading = spinner fullscreen |
| **InterdictionList** | `max-w-3xl`; busca com ícone Search; botão Filter toggle; chips de status (`rounded-full`); subtítulo `{n} registros`; lista de **cards** (não tabela); empty genérico “Nenhuma ocorrência encontrada”; loading spinner fullscreen; tema claro + azul focus |

## 1.2 Reutilizado (ideia / composição)

| Elemento Base44 | Como entra no SafeStop |
|---|---|
| Título + subtítulo com contagem | Header do relatório + contagem contextual |
| Busca com ícone à esquerda | Toolbar — busca por código (Ocorrências) |
| Toggle / painel de filtros | Adaptado para **dialog/drawer** do Dashboard 3.2 (não painel inline claro) |
| Chips de status selecionáveis | Chips de período + chips de **filtros ativos** (com limpar) |
| Grid KPI 2→4 | Resumo do relatório (2–3 cards, não 7) |
| Empty centralizado em card | Empty / no-results (textos distintos) |

## 1.3 Adaptado

| Base44 | SafeStop 3.3 |
|---|---|
| Cards de ocorrência na listagem | **Tabela** gerencial (contacts-table + DS) — relatórios ≠ operação de campo |
| Azul `#2563eb` / fundo branco | Dark `gray-900/950` + accent laranja |
| Spinner fullscreen | Skeleton estrutural (DS + Dashboard 3.2) |
| Filtro só status em chips | Período (presets Dashboard) + escopo (área/contrato/contratada) + filtros de domínio por relatório |
| Contagem = `filtered.length` client | Página cursor + `hasNext`; resumo KPI honestamente rotulado |
| CTA “Nova Paralisação” no Dashboard | **Ausente** na página de relatório (foco analítico) |

## 1.4 Rejeitado (e por quê)

| Base44 | Motivo da rejeição |
|---|---|
| Tema claro / azul | Paleta oficial SafeStop dark + `#F97316` |
| Lista só cards | Relatório exige densidade tabular + ordenação/export |
| Spinner fullscreen | DS: Skeleton representando estrutura real |
| Empty único genérico | Distinguir **empty** vs **no-results** (aceite) |
| Cálculo KPI no JSX a partir de lista bruta | Fórmulas só via `@safestop/types` / BACKEND |
| Filtros Liberada/Encerrada como foco operacional | Relatório usa status técnico + família analítica oficiais |
| `max-w-3xl` listagem | Relatório usa `max-w-6xl` / full content (paridade Dashboard Web) |

---

# 2. Navegação e rotas (Web only)

| Rota | Tela |
|---|---|
| `/reports` | Hub — 3 cards de entrada (Ocorrências, Plano de Ação, Ciência) |
| `/reports/occurrences` | Relatório de Ocorrências |
| `/reports/action-items` | Relatório de Plano de Ação |
| `/reports/awareness` | Relatório de Ciência |

Sidebar: item **Relatórios** (já previsto no DS) → `/reports`.  
Sem `report.read`: item oculto ou hub → estado **forbidden**.

---

# 3. Layout canônico de página de relatório

```text
┌─ Relatório: {título} ─────────────────────────────────────┐
│ Subtítulo factual · org ativa                             │
│                                                           │
│ [ KPI ] [ KPI ] [ KPI ]     ← resumo do conjunto (ver §4) │
│                                                           │
│ ┌─ Toolbar ─────────────────────────────────────────────┐ │
│ │ Período chips │ [Filtros] │ Busca? │ [Exportar ▾]    │ │
│ │ Chips ativos (n) · Limpar filtros                     │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                           │
│ ┌─ Tabela ──────────────────────────────────────────────┐ │
│ │ thead …                                               │ │
│ │ rows …                                                │ │
│ └───────────────────────────────────────────────────────┘ │
│ [Anterior]  Página · Há mais / Fim          [Próxima]     │
└───────────────────────────────────────────────────────────┘
```

Ordem obrigatória: **Resumo → Toolbar → Tabela → Paginação**.

---

# 4. Resumo (KPIs do conjunto — não Dashboard)

Reutilizar visual de `DashboardKpiCard` (tom dark, borda semântica).  
**Não** trazer gráfico nem grid N1–N3 do Dashboard.

### Honestidade de contagem (paginação cursor)

As RPCs retornam `items` + `hasNext` **sem** `totalCount`. Helpers `compute*ReportSummary(rows)` operam sobre um array.

| Abordagem 3.3 | Spec |
|---|---|
| Labels | Prefixo explícito **“Nesta página”** nos KPIs derivados de `items` |
| Página | `limit` default **20** (`REPORT_PAGINATION_DEFAULT_LIMIT`) |
| Complemento | Texto auxiliar: `Há mais resultados` se `hasNext`; senão `Fim dos resultados` |
| Exportação | Conjunto filtrado completo (até `REPORT_EXPORT_MAX_ROWS`) — distinto do resumo da página |
| P1 (fora) | `totalRows` do filtro via RPC summary — não bloquear 3.3 |

### Cards por relatório

| Relatório | KPI 1 | KPI 2 | KPI 3 |
|---|---|---|---|
| Ocorrências | Nesta página: total | Nesta página: interdições ativas (`computeOccurrenceReportSummary`) | — (opcional 3º omitido) |
| Plano de Ação | Nesta página: total | Vencidas | Próximas do vencimento |
| Ciência | Nesta página: total | Pendentes de ciência | — |

Uma pergunta por card. Tons: vencidas = destructive; pendências = warning; neutro = info/default.

---

# 5. Toolbar de filtros

## 5.1 Período

**Reutilizar** `DashboardPeriodFilter` / mesmos presets implementados:

| ID | Label | 3.3 |
|---|---|---|
| `today` | Hoje | **Sim** |
| `7d` | 7 dias | **Sim** |
| `30d` | 30 dias | **Sim** (default recomendado) |
| `month` | Mês atual | **Sim** |
| `previousMonth` | Mês anterior | **P1** — não implementar |
| `custom` | Personalizado | **P1** — não implementar (também ausente no Dashboard Web atual) |

Em relatórios, o período **filtra o conjunto listado** (campo de data do domínio: `occurred_at` / `due_at` / `created_at` conforme RPC) — **não** reutilizar o hint “só indicadores de fluxo” do Dashboard; copy: **REP-C12** `O período filtra os registros deste relatório`.

## 5.2 Escopo / filtros de domínio

**Padrão UI:** botão “Filtros” → `<dialog>` / drawer como `dashboard-scope-filters.tsx` (borda `gray-700`, fundo `gray-900`, accent laranja quando ativo).

### Ocorrências (`OccurrenceReportFilters`)

| Controle | UI |
|---|---|
| Área, Contrato, Contratada | Selects no dialog (mesmo options pattern Dashboard) |
| Status técnico | Multi-select 12 valores (labels PT oficiais) |
| Família | Opcional: multi-select 7 famílias **ou** derivar só via status — se ambos, manter sincronismo BACKEND; preferir filtro `status` na RPC e chips de família como atalho que mapeia para status[] via `DASHBOARD_OCCURRENCE_STATUSES_BY_FAMILY` **no client tipado** (sem reinventar mapa) |
| Criticidade | Multi-select (opcional no dialog) |
| Com/sem IMS | Tri-state: Todos / Com / Sem |
| Busca | Input toolbar — `public_code` (contains) |

### Plano de Ação (`ActionItemReportFilters`)

| Controle | UI |
|---|---|
| Status ação | Multi-select enum |
| Vencidas | Toggle `overdueOnly` |
| Próximas | Toggle `dueSoonOnly` (+ `dueSoonDays` default 3, clamp 1–30) |
| Responsável | Combobox membro (`get_organization_member_profiles`) |
| Busca textual título | **Não** — RPC não expõe (matriz BACKEND) |

### Ciência (`AwarenessReportFilters`)

| Controle | UI |
|---|---|
| Pendente só | Toggle `pendingOnly` |
| Destinatário | Combobox membro |
| Ocorrência | Opcional UUID/código via busca ocorrência se houver service; senão omitir campo na 3.3 se UX cara |
| Tipo de evento | **Não filtrar** — RPC não expõe |

## 5.3 Chips de filtros ativos

Abaixo da toolbar:

```text
[ Período: 30 dias × ] [ Área: Digestão × ] [ Vencidas × ]   Limpar tudo
```

| Regra | Spec |
|---|---|
| Contador | Botão Filtros: `Filtros · {n}` quando n>0 |
| Remover | × no chip remove só aquele filtro |
| Limpar | Remove todos (periodo volta ao default 30d) |
| A11y | Cada chip `aria-label` “Remover filtro {nome}” |

---

# 6. Tabela

## 6.1 Estilo (contacts-table)

| Token | Valor |
|---|---|
| Container | `overflow-x-auto rounded-lg border border-gray-800` |
| Table | `min-w-full divide-y divide-gray-800 text-sm` |
| thead | `bg-gray-950/70 text-xs uppercase tracking-wide text-gray-400` |
| th | `scope="col"` + `px-4 py-3` |
| tbody tr | `bg-gray-900/30` hover `bg-gray-900/60`; cursor pointer se drill-down |
| Links | `text-orange-400 hover:text-orange-300` |

## 6.2 Colunas — Ocorrências (PO-REP-3)

| Classificação | Colunas na UI |
|---|---|
| **Visível default** | Código, Data PP, Área, Contrato, Contratada, Status (+ ícone), Família |
| **Opcional** (toggle simples “Mais colunas”) | Criticidade, Decisão IO, IMS, Unidade |
| **Export-only** | Gerência, stopped/evaluated/released/closed/cancelled+reason, Registrado por, Avaliador — **nunca** colunas fixas na tabela |

## 6.3 Colunas — Plano de Ação

| Classificação | Colunas |
|---|---|
| **Visível** | Título, Prazo, Status (+ ícone), Vencida, Próx. vencimento |
| **Opcional** | Responsável (nome) |
| **Export-only** | occurrence_id, action_plan_id, completed_at, validated_at |

**Nota:** sem `public_code` na RPC — UI **não** inventa coluna de código PP. Correlação amigável = P1 (estender RPC).

## 6.4 Colunas — Ciência

| Classificação | Colunas |
|---|---|
| **Visível** | Data, Tipo evento (label PT), Destinatário, Ciência (pendente/confirmada + data) |
| **Opcional** | Exige ciência?, Leitura (`read_at`) — com hint “Leitura ≠ ciência” |
| **Export-only** | occurrence_id, notification_event_id |

## 6.5 Seletor de colunas configurável (drag/persist)

**Decisão: adiar P1.**

| Critério | Avaliação |
|---|---|
| Padrão reutilizável barato no repo | **Não** existe |
| Matriz já define 3 classificações | Suficiente para 3.3 |
| Custo | Alto (persistência, a11y, regressão) vs benefício |

3.3: toggle único **“Mostrar colunas opcionais”** (boolean session/local) — não column picker avançado.

## 6.6 Ordenação

Clique no `th` ordenável (allowlists `OCCURRENCE_REPORT_SORT_FIELDS` etc.).  
Indicador ↑↓ + `aria-sort`. Defaults: Ocorrências `occurred_at desc`; Ações `due_at asc`; Ciência `created_at desc`.

## 6.7 Responsividade

| Breakpoint | Comportamento |
|---|---|
| Desktop | Todas default + opcionais se ligadas |
| Notebook | Esconder opcionais primeiro |
| Tablet | Manter Código/Título + Data + Status; demais em scroll horizontal controlado (`overflow-x-auto`, sticky primeira coluna opcional) |
| Não | Quebrar em cards Base44 nesta sprint (relatório Web) |

Prioridade de hide: export-only (já ocultas) → opcionais → Contrato/Contratada → Área → manter ID + data + status.

---

# 7. Exportação

Menu botão **Exportar** (não ação única ambígua):

```text
[ Exportar ▾ ]
   · Exportar CSV
   · Exportar XLSX
```

| Estado | UI |
|---|---|
| Idle | Menu habilitado se `report.read` |
| **export-loading** | Botão disabled + texto `Gerando arquivo…` / spinner no botão (não fullscreen) |
| Sucesso | Download browser; toast curto opcional |
| **export-error** | Toast/banner `Não foi possível exportar.` + retry |
| Limite 10k | Mensagem específica (BACKEND) — UI exibe message sem inventar regra |
| Auditoria | WEB chama `log_report_export` após sucesso (PO-REP-6); falha de log **não** bloqueia download |

Formatos: labels **CSV** e **XLSX** explícitos (PO-REP-2).

---

# 8. Paginação

Cursor keyset (`ReportCursor`):

| Controle | Spec |
|---|---|
| Próxima | Enabled se `hasNext`; envia `nextCursor` |
| Anterior | Stack de cursores no client **ou** disable se sem histórico — documentar stack simples na implementação |
| Tamanho | Fixo 20 na 3.3 (sem seletor 50/100 na UI — P1) |
| Copy | `Mostrando {items.length} · {hasNext ? "Há mais" : "Fim"}` |

---

# 9. Drill-down

| Relatório | Clique na linha |
|---|---|
| Ocorrências | → `/stop-work/[id]` (`row.id`) |
| Plano de Ação | Se `occurrenceId` → `/stop-work/[occurrenceId]`; senão linha sem navegação (só texto) |
| Ciência | Se `occurrenceId` → `/stop-work/[occurrenceId]`; senão sem link |

Respeitar autorização existente da rota de detalhe (sem bypass).  
Teclado: Enter na linha focável = mesmo href.  
Não abrir em modal.

---

# 10. Estados obrigatórios

| Estado | UI |
|---|---|
| **loading** | Skeleton: 3 KPI + barra toolbar + 5 linhas tabela (não spinner fullscreen) |
| **empty** | Sem registros na org / sem nenhum dado base: `Nenhum registro no sistema.` + sem CTA de criar (relatório não é operação) |
| **no-results** | Há filtros ativos e zero itens: `Nenhum registro corresponde aos filtros selecionados.` + botão Limpar filtros |
| **error** | Banner + Tentar novamente (refetch lista) |
| **forbidden** | Sem `report.read`: `Você não tem permissão para visualizar relatórios.` |
| **export-loading** | §7 |
| **export-error** | §7 |

**Proibido:** empty genérico “0” / “Nenhuma ocorrência encontrada” sem distinguir empty vs no-results.

---

# 11. Status sem depender só de cor

| Domínio | Complemento |
|---|---|
| Status ocorrência / família | Badge texto PT + ícone (Alert/Clock/Check) |
| Vencida | Ícone alerta + texto `Vencida` (não só vermelho) |
| Ciência pendente | Chip `Pendente` / `Confirmada` + data se houver |
| Ativo contacts-like | Padrão já usado: texto + borda |

---

# 12. Acessibilidade

| Item | Spec |
|---|---|
| Tabela | `<table>`, `<thead>`, `<th scope="col">` |
| Caption | `<caption class="sr-only">` com nome do relatório |
| Filtros | Labels visíveis; dialog `aria-labelledby` |
| Período | `role="tablist"` como Dashboard |
| Export menu | `aria-haspopup`, itens nomeados CSV/XLSX |
| Teclado | Tab toolbar → tabela; setas opcionais entre rows; Enter abre |
| Contraste | AA em dark; não só cor para status |

---

# 13. Mapeamento de componentes

| Componente | Origem |
|---|---|
| `ReportsHubPage` | Novo |
| `ReportPageLayout` | Shell resumo+toolbar+table+pager |
| `ReportSummaryKpis` | Adapta `DashboardKpiCard` |
| `ReportPeriodFilter` | Reusa presets `dashboard-period-filter` (copy REP-C12) |
| `ReportFiltersDialog` | Adapta `dashboard-scope-filters` dialog |
| `ReportActiveFilterChips` | Novo (padrão chips Dashboard) |
| `ReportSearchInput` | Adapta busca InterdictionList → dark |
| `ReportExportMenu` | Novo |
| `ReportDataTable` | Adapta `organization-contacts-table` |
| `ReportPagination` | Novo |
| `ReportState*` | Adapta `dashboard-states` empty/error |

---

# 14. Copy PT — REP-C*

| ID | Texto |
|---|---|
| **REP-C01** | `Relatórios` |
| **REP-C02** | `Ocorrências` |
| **REP-C03** | `Plano de Ação` |
| **REP-C04** | `Ciência` |
| **REP-C05** | `Exportar` |
| **REP-C06** | `Exportar CSV` |
| **REP-C07** | `Exportar XLSX` |
| **REP-C08** | `Gerando arquivo…` |
| **REP-C09** | `Filtros` |
| **REP-C10** | `Limpar filtros` |
| **REP-C11** | `Mostrar colunas opcionais` |
| **REP-C12** | `O período filtra os registros deste relatório` |
| **REP-C13** | `Nesta página` |
| **REP-C14** | `Há mais resultados` |
| **REP-C15** | `Fim dos resultados` |
| **REP-C20** | `Nenhum registro no sistema.` |
| **REP-C21** | `Nenhum registro corresponde aos filtros selecionados.` |
| **REP-C22** | `Você não tem permissão para visualizar relatórios.` |
| **REP-C30** | `Não foi possível carregar o relatório.` |
| **REP-C31** | `Não foi possível exportar.` |
| **REP-C32** | `Tentar novamente` |
| **REP-C40** | `Leitura não é confirmação de ciência` |
| **REP-C41** | `Buscar por código` |

Labels de status/família/evento: reutilizar labels oficiais já usadas no produto (`DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS`, badges de ocorrência, etc.) — não inventar.

---

# 15. Critérios de aceite (Gate D)

1. Investigação Base44 documentada (§1) com reusado/adaptado/rejeitado.  
2. Três rotas Web + hub; Mobile fora.  
3. Layout resumo → toolbar → tabela → paginação.  
4. Período = 4 presets Dashboard; custom/mês anterior = P1.  
5. Chips ativos + limpar; dialog de filtros padrão Dashboard.  
6. Colunas conforme matrizes (visível/opcional/export-only); column picker avançado = P1.  
7. Export CSV e XLSX como duas opções; loading/error explícitos.  
8. Estados empty ≠ no-results ≠ forbidden ≠ error.  
9. Drill-down `/stop-work/[id]` com auth existente.  
10. Tabela semântica + teclado + status com texto/ícone.  
11. Responsividade: hide progressivo + scroll horizontal.  
12. Design system estendido (Tabelas / Exportação).  
13. Nenhuma fórmula de negócio inventada na UI.

---

## Cross-check PO

| Tema | PO | Spec | Status |
|---|---|---|---|
| 3 relatórios P0 | PO-REP-1/4 | Hub + 3 páginas | Alinhado |
| CSV + XLSX | PO-REP-2 | Menu dual | Alinhado |
| Matriz ocorrências | PO-REP-3 | §6.2 | Alinhado |
| Matrizes PA/Ciência | Adendo BACKEND | §6.3–6.4 | Consumido |
| Web only | PO-REP-5 | Sem Mobile | Alinhado |
| Auditoria export | PO-REP-6 | Pós-sucesso | Alinhado |

---

## Hand-off

| De | Para |
|---|---|
| UIUX | WEB — `features/reports/` |
| UIUX | DOCUMENTATION — confirmar sync `design-system.md` (extensão feita nesta entrega) |
| QA | empty vs no-results, export dual, forbidden, drill-down, a11y tabela |

```text
UIUX — REPORTS-UI-SPEC.md
Sprint 3.3
Data: 2026-08-23
Status: PRONTO PARA IMPLEMENTAÇÃO — Gate D
DoD: Base44 investigation + 3 reports + export + states + DS tables/export
```
