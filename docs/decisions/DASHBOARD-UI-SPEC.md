# Spec UI/UX — Dashboard Operacional (Sprint 3.2)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 3.2 — Dashboard Operacional e Visão Gerencial  
**Agente:** UIUX  
**Data:** 2026-08-19  
**Entregável:** `docs/decisions/DASHBOARD-UI-SPEC.md`

**PO (fonte oficial):** [`DASHBOARD-DECISIONS.md`](./DASHBOARD-DECISIONS.md) — PO-DASH-1…PO-DASH-4; Gate G0.

**Contratos (não alterar fórmulas):** `packages/types` `dashboard-metrics.ts` / `dashboard-formulas.ts`.

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/design-system.md` ~1720–2400 | Card, Dashboard, KPIs, Gráficos, cores |
| Relatório arquitetural 3.2 §17 / §42 / §53 | Catálogo, hierarquia, matriz de componentes |
| `reference/base44/.../Dashboard.jsx` | Grid 2→4, chart `hidden lg:block`, 6 recentes |
| `NOTIFICATIONS-UI-SPEC.md` | Badge/ciência — deep links |

**Sem código nesta entrega.** **Sem** inventar / alterar fórmulas de métrica.

---

## Objetivo

Especificar grid, ordem, hierarquia visual e tipos de gráfico para WEB/MOBILE implementarem o Dashboard **sem decisão de design pendente**, respeitando 100% das decisões fechadas da sprint.

---

## Decisões fechadas (invioláveis)

| # | Decisão |
|---|---|
| 1 | Gráficos: linha, barra, barra empilhada, área, rosca (moderação). **Proibidos:** radar, pizza muitas categorias, 3D, gauge |
| 2 | Cada card = **uma** pergunta |
| 3 | Ordem: KPIs → Gráfico Principal → Ocorrências Recentes → Ações Vencidas/Próximas → (Ciência pendente se aplicável) |
| 4 | Gráfico principal: `hidden lg:block` |
| 5 | Grid KPIs: **4 → 2** colunas em tela estreita |
| 6 | Mobile: **sem gráficos** — números + listas curtas |
| 7 | Semântica factual: mais PP ≠ “pior”; sem ranking de desempenho |
| 8 | `null` da RPC = **bloco oculto** (nunca exibir como `0`) |
| 9 | Filtro de **período** só em métricas de **fluxo** (`stock: false`) |

---

## Terminologia

| Termo UI | Significado |
|---|---|
| **Dashboard** | Página Web `/` ou `/dashboard` |
| **Início / Home** | Tab Mobile — **não** é clone do Dashboard Web |
| **Estoque** | Contagem atual — ignora período |
| **Fluxo** | Métrica no período selecionado |
| **Família de status** | 7 grupos PO-DASH-4 |

**Proibido na copy:** “pior contratada”, “ranking”, “% de tendência”, “performance”, gauge.

---

# 1. Layout Web — visão geral

```text
┌─ Header: Dashboard · filtros período + filtros locais · [Nova Paralisação] ─┐
│                                                                              │
│  NÍVEL 1 — KPI grid 2×2 (sm) / 1×4 (lg)                                     │
│  NÍVEL 2 — KPI grid estoque complementar (2 cols → 3–4 lg)                   │
│  NÍVEL 3a — Gráfico principal (só lg+)                                       │
│  NÍVEL 3b — Distribuições (só lg+)                                           │
│  Ocorrências Recentes (6)                                                    │
│  Ações Vencidas (≤5) | Ações Próximas (≤5)                                   │
│  [Ciência pendente — se card aplicável]                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Max width:** `max-w-6xl` (paridade Base44).  
**CTA Nova Paralisação:** `hidden lg:flex` no header (Mobile usa FAB/tab Registrar).

---

# 2. Hierarquia de KPIs (Níveis 1–3)

Regra: se valor `null` (sem permissão) → **não renderizar** o card.

## Nível 1 — Atenção imediata (primeira fileira)

Grid: `grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4`

| Ordem | Key | Label UI (catálogo) | Ícone sugerido | Cor surface | Clique / deep link |
|---|---|---|---|---|---|
| 1 | `overdueActionItems` **ou** `myOverdueActions`* | Ações em atraso / Minhas ações atrasadas | `AlertOctagon` | Vermelho/destructive suave | Lista ações / detalhe |
| 2 | `myPendingAwareness` | Minhas ciências pendentes | `BadgeCheck` / Bell | Âmbar | `/notifications?filter=awareness` |
| 3 | `activeOccurrences` | Ocorrências abertas | `ShieldAlert` | Azul info | `/stop-work` filtrado aberto |
| 4 | `mdhoPendingApproval` | MDHO aguardando aprovação | `ClipboardList` | Âmbar HSE | `/approvals/mdho` |

\* Se usuário **sem** métrica managerial de atraso (`overdueActionItems === null`) mas tem pessoal: usar `myOverdueActions` no slot 1. Se ambos existem, **priorizar** `overdueActionItems` no Nível 1 e mover `myOverdueActions` para bloco pessoal colapsável ou Home Mobile.

**Pergunta única por card** (exemplos): “Quantas ações estão atrasadas?” — valor grande + label; **sem** sparkline no KPI.

## Nível 2 — Estoque complementar

Grid: `grid-cols-2 lg:grid-cols-3` (ou 4 se couber sem apertar)

Exibir somente se não-`null`, nesta ordem sugerida:

| Key | Label |
|---|---|
| `pendingEvaluation` | Pendentes de avaliação |
| `activeInterdictions` | Interdições ativas |
| `awaitingValidation` | Aguardando validação |
| `dueSoonActionItems` | Ações próximas do vencimento |
| `openActionPlans` | Planos de ação abertos |
| `scopedOpenOccurrences` | Ocorrências abertas no meu escopo |
| `scopedPendingAwareness` | Ciências pendentes no meu escopo |
| `pendingAwarenessOrg` | Ciências pendentes (organização) — só `report.read` |
| `myPendingActions` | Minhas ações pendentes (se não no N1) |

Cores: Interdições → vermelho suave; pendências → laranja; ciência org → âmbar; neutros → cinza/azul info.  
**Não** pintar “Ocorrências abertas” como vermelho “ruim”.

## Nível 3 — Fluxo + distribuições (gráficos / KPIs de período)

### 3.1 KPIs de fluxo (números — também em `< lg` sem gráfico)

Exibir **somente** com período selecionado; se período ausente, ocultar ou desabilitar com hint DASH-C12.

| Key | Label | Formato |
|---|---|---|
| `newOccurrencesInPeriod` | Novas ocorrências no período | inteiro |
| `avgEvaluationTimeMinutes` | Tempo médio de avaliação | `Xh` / `Xmin` |
| `avgReleaseTimeMinutes` | Tempo médio de liberação | idem |
| `actionCompletionRate` | Taxa de conclusão de ações | `X%` |

### 3.2 Gráfico principal (Web `lg+` only)

| Prop | Spec |
|---|---|
| Tipo | **Barra** vertical (preferência) **ou** **Linha** — volume diário/semanal de novas PP no período |
| Série | Contagem de ocorrências criadas por bucket de tempo no período |
| Título | `Novas paralisações no período` |
| **Proibido** | Percentual de tendência, seta “↑12%”, comparação pejorativa |
| Container | `hidden lg:block mb-8` |
| Empty período | EmptyState DASH-C21 |
| A11y | Tabela de dados sob o gráfico (`sr-only` ou “Ver dados”) |

### 3.3 Distribuições (Web `lg+`)

| Gráfico | Tipo escolhido | Dados | Título factual |
|---|---|---|---|
| Por família de status | **Barra horizontal** (7 famílias) | `occurrencesByStatusFamily` | `Ocorrências por situação` |
| Por área | **Barra** (top N áreas, ex. 8) | `occurrencesByArea` | `Ocorrências por área` |
| Por contratada (opc. 2ª fileira) | **Barra** | `occurrencesByContractor` | `Ocorrências por contratada` |

**Por que não rosca para status?** 7 fatias = limite da “moderação”; barra compara melhor e evita pizza densa.  
**Rosca permitida** só se ≤5 categorias efetivas com valor > 0; senão fallback automático para barra.

Cores famílias (paleta DS):

| Família | Cor |
|---|---|
| OPEN_EVALUATION | Azul |
| VER_E_AGIR | Âmbar |
| INTERDICTED | Vermelho |
| IN_TREATMENT | Laranja |
| AWAITING_VALIDATION | Laranja claro |
| COMPLETED | Verde |
| CANCELLED | Cinza |

---

# 3. Componente DashboardKpiCard

Reutilizar padrão Base44 `KpiCard` + DS “Card de Dashboard”:

```text
┌─────────────────────┐
│ [ícone]   12        │
│ Ações em atraso     │
└─────────────────────┘
```

| Prop | Spec |
|---|---|
| value | Número / tempo / % — nunca misturar 2 valores |
| label | Uma pergunta, truncate |
| null | Não montar |
| loading | Skeleton no lugar do card |
| error parcial | Card com “—” + ícone erro + retry no card |
| Clique | Opcional se deep link definido; cursor pointer + `aria` |

---

# 4. Ocorrências Recentes

| Item | Spec |
|---|---|
| Limite | **6** (`DASHBOARD_RECENT_OCCURRENCES_LIMIT`) |
| Grid | `grid-cols-1 lg:grid-cols-2 gap-3` |
| Card | **Card de Ocorrência** (DS): código, status, criticidade, empresa, área, data, tempo decorrido, ação pendente |
| Fonte | Lista recente org — **não** recalcular KPI no card |
| Link item | `/stop-work/[id]` |
| Ver todas | → `/stop-work` (label Paralisações) |
| Empty | Ver § Estados |

Campos mínimos do DTO (`DashboardRecentOccurrenceItem`) + enriquecer empresa/tempo/ação pendente se o service já entregar; se não, omitir campo sem inventar.

---

# 5. Listas de ações — Vencidas e Próximas

Duas colunas em `lg` (`grid-cols-1 lg:grid-cols-2`); empilhadas no mobile Web.

| Lista | Limite | Campos linha |
|---|---|---|
| **Ações vencidas** | ≤5 | título, prazo (`dueAt`) destacado, responsável* , status, link ocorrência |
| **Ações próximas do vencimento** | ≤5 | idem; chip “Em X dias” (threshold **3 dias** PO-DASH-2) |

\* Responsável: exibir nome via `get_organization_member_profiles` **quando** o payload incluir `responsibleMemberId` e o usuário puder ver; senão ocultar coluna (não mostrar UUID).

| Clique | → `/stop-work/[occurrenceId]` (âncora plano se existir) |
| Contagem header | Usar `overdueCount` / `dueSoonCount` do attention DTO |
| Sem acesso | Seção inteira oculta (`null` counts) |

---

# 6. Filtros

## 6.1 Período (fluxo apenas)

Presets:

| ID | Label | Intervalo |
|---|---|---|
| `today` | Hoje | início→fim do dia local |
| `7d` | 7 dias | agora − 7d → agora |
| `30d` | 30 dias | agora − 30d → agora |
| `month` | Mês atual | 1º dia do mês → agora |
| `custom` | Personalizado | date range picker |

Default recomendado: **`30d`** (gráficos de fluxo úteis sem ambiguidade).

**Regra crítica:** ao mudar período, refetch **somente** métricas `stock: false` + séries do gráfico principal. KPIs de estoque (N1/N2) **não** mudam.

UI: chip/select no header; indicar “Afeta apenas indicadores do período” (DASH-C12).

## 6.2 Filtros locais (escopo) — escopo congelado 3.2

### Decisão UIUX (2026-08-20) — obrigatória para WEB

A RPC `get_dashboard_kpis` **não** recebe filtros de escopo (só `organization_id` + `due_soon_days` + período). Filtros locais na 3.2 são **UI client-side**, sem estender a RPC.

| Filtro | Sprint 3.2 | Sprint futura |
|---|---|---|
| **Período** (presets §6.1) | **Sim** — contrato oficial da RPC / `DashboardKpiFilters.period` | — |
| **Área** (`areaId`) | **Sim** — Web drawer/painel | — |
| **Contrato** (`contractId`) | **Sim** | — |
| **Contratada** (`contractorOrganizationId`) | **Sim** | — |
| **Status** / família de status | **Não** | Sim — quando houver parâmetro de RPC ou listagem dedicada; na 3.2 a distribuição por família já cobre a pergunta visual |

**Não implementar na 3.2:** filtro de status no Dashboard (nem família, nem status técnico). Evita divergência com KPIs de estoque e com o contrato tipado `DashboardScopeFilters` (só os 3 campos acima).

### O que os filtros locais 3.2 afetam

| Superfície | Com escopo ativo |
|---|---|
| Ocorrências recentes | Filtrar client-side |
| Listas ações vencidas / próximas | Filtrar via ocorrência vinculada no escopo |
| Gráfico volume + distribuições área/contratada/família | Recalcular / filtrar no subconjunto |
| KPIs managerial derivados de ocorrência (`activeOccurrences`, `pendingEvaluation`, `activeInterdictions`, `awaitingValidation`, `newOccurrencesInPeriod`) | Podem refletir subconjunto **somente** se a implementação Web já compõe display a partir das ocorrências filtradas — **não** alterar fórmulas em `packages/types` |
| KPIs pessoais (`my*`) | **Não** aplicar área/contrato/contratada |
| `pendingAwarenessOrg` / métricas só-RPC sem recorte | Manter valor org-wide ou ocultar hint “escopo não aplicado” — **não** fingir filtro |

### UI

Drawer Web (“Filtros”) com Área + Contrato + Contratada + Limpar.  
Home Mobile: **sem** filtros locais na 3.2.

**Não** usar filtro de período como se fosse estoque.

---

# 7. Home Mobile — não duplicar Dashboard Web

```text
┌─ Início ───────────────────────────────────┐
│ Olá, {nome}                                │
│                                            │
│ ── Minhas pendências ──                    │
│ [ Minhas ações atrasadas     N ]           │
│ [ Minhas ciências pendentes  N ]           │
│ [ Minhas ações pendentes     N ]           │
│                                            │
│ ── Atalhos ──                              │
│ [ Nova Paralisação ]                       │
│ [ Paralisações ]                           │
│ [ Notificações ]                           │
│ [ Aprovação HSE ] (se permissão)           │
│                                            │
│ (sem gráficos · sem grid managerial completo)│
└────────────────────────────────────────────┘
```

| Regra | Spec |
|---|---|
| Gráficos | **Proibidos** |
| Cards | Texto + número; toque → lista filtrada / central / detalhe |
| Estoque pessoal | Sempre (identidade) |
| Managerial | **Não** espelhar Nível 2/3 Web no Home |
| Acesso gestão | Opcional link “Painel completo” **somente** se existir WebView/rota — preferir não; gestores usam Web |

---

# 8. Estados

| Estado | Comportamento |
|---|---|
| **Loading** | Skeleton: 4 KPI + (lg) chart block + 2 cards lista — espelhar estrutura real |
| **Empty A** — sem ocorrências na org | DASH-C20 + CTA Nova Paralisação |
| **Empty B** — sem ocorrências **no período** | DASH-C21 — KPIs estoque podem ter valores; só bloco fluxo/gráfico vazio |
| **Empty C** — sem acesso (quase tudo `null`) | DASH-C22 — “Sem indicadores para o seu perfil”; mostrar só `personal.*` se houver |
| **Error** global | Banner + Tentar novamente (refetch KPIs) |
| **Forbidden** org | Mensagem org não permitida / redirect login |
| **Partial failure** | Card/seção com estado erro local; resto da página permanece; toast opcional |

---

# 9. Acessibilidade

| Item | Spec |
|---|---|
| Gráficos | Alternativa textual (tabela) + `aria-label` no container |
| Contraste | Valores e labels AA; não só cor para atraso |
| Teclado | Tab nos KPI clicáveis, filtros, listas; Esc fecha drawer |
| Screen reader | `null` oculto = não anunciado; `0` anunciado como zero |
| Foco | Visível em cards e chips de período |

---

# 10. Matriz de componentes (UI)

| Componente | Onde | DS / reuso |
|---|---|---|
| `DashboardKpiCard` | N1–N3 números | Card de Dashboard |
| `DashboardPeriodFilter` | Header Web | Chip / Select |
| `DashboardScopeFilters` | Drawer | Filtros |
| `DashboardMainChart` | N3a lg+ | Barra/Linha + tabela a11y |
| `DashboardDistributionChart` | N3b lg+ | Barra horizontal |
| `DashboardRecentOccurrences` | Lista 6 | Card de Ocorrência |
| `DashboardActionAttentionList` | Vencidas / Próximas | Lista compacta |
| `MobileHomePendingSection` | Home Mobile | Action cards texto |
| `EmptyState` / `Skeleton` | Estados | DS |

Feature: `features/dashboard/`.

---

# Copy PT — DASH-C*

| ID | Texto |
|---|---|
| **DASH-C01** | `Dashboard` |
| **DASH-C02** | `Visão operacional da organização ativa` |
| **DASH-C03** | `Nova Paralisação` |
| **DASH-C04** | `Ocorrências recentes` |
| **DASH-C05** | `Ver todas` |
| **DASH-C06** | `Ações vencidas` |
| **DASH-C07** | `Ações próximas do vencimento` |
| **DASH-C08** | `Minhas pendências` |
| **DASH-C09** | `Novas paralisações no período` |
| **DASH-C10** | `Ocorrências por situação` |
| **DASH-C11** | `Ocorrências por área` |
| **DASH-C12** | `O período afeta apenas indicadores de fluxo` |
| **DASH-C13** | `Ocorrências por contratada` |
| **DASH-C20** | `Nenhuma ocorrência registrada` |
| **DASH-C21** | `Nenhuma ocorrência neste período` |
| **DASH-C22** | `Não há indicadores disponíveis para o seu perfil` |
| **DASH-C30** | `Não foi possível carregar este indicador` |
| **DASH-C31** | `Tentar novamente` |
| **DASH-C40** | `Ver dados do gráfico` |

Labels de KPI: usar `DASHBOARD_METRIC_CATALOG[key].label` (fonte única).  
Labels famílias: `DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS`.

---

# 11. Cross-check Base44 vs SafeStop

| Base44 | SafeStop 3.2 | Justificativa |
|---|---|---|
| KPIs: PP / Em Avaliação / VA / IO + Liberadas hoje + tempos | Nível 1 atenção (atraso, ciência, abertas, MDHO) + Nível 2 estoque catálogo | Hierarquia §42 — ação antes de estoque genérico |
| Cálculo client-side no JSX | RPC / catálogo tipado — UI só exibe | PO-DASH-1; UIUX não redefine fórmula |
| Chart sempre com dataset local | Chart fluxo no período; `hidden lg:block` **mantido** | Decisão fechada #4 + Base44 |
| Grid 2→4 KPIs | **Mantido** | Decisão #5 |
| Sem filtros período/área | Presets + filtros locais; estoque×fluxo | §19 arquitetura |
| Sem listas de ações | Ações vencidas / próximas (≤5) | Catálogo + Plano 3.0 |
| Sem ciência | Cards + deep link notificações | Sprint 3.1 |
| Mobile = mesma página | Home ≠ Dashboard Web | Decisão #6 Mobile First |
| Azul primary CTA | Primary produto laranja `#F97316` onde DS SafeStop | Design system oficial |
| “Liberadas hoje” | Fora N1; liberação pode estar em fluxo futuro / métrica se catálogo tiver — **não** inventar se não estiver no catálogo operacional 3.2 | Sem inventar métrica |
| InterdictionCard | Card Ocorrência DS + `/stop-work` | Rotas 2.9 |
| Sem partial failure | Card-level error | Robustez operacional |
| Sem a11y de gráfico | Tabela alternativa | Aceite a11y |

---

# 12. Critérios de aceite

1. Grid N1 2 cols / 4 lg; cards uma pergunta; `null` oculto.
2. Ordem: KPIs → gráfico principal → recentes → ações → ciência (se houver).
3. Gráfico principal só `lg+`; tipo barra ou linha sem % tendência.
4. Distribuição status = barra horizontal (7 famílias); área/contratada = barra factual.
5. Recentes = 6 cards compactos DS.
6. Ações vencidas / próximas ≤5 com prazo (+ responsável se autorizado).
7. Período com presets; **nunca** aplica a KPI estoque. Filtros locais 3.2 = **área + contrato + contratada** apenas; **status fora**.
8. Home Mobile = Minhas pendências + atalhos; zero gráficos; sem filtros locais.
9. Empty A/B/C + error + forbidden + partial failure especificados.
10. A11y: texto alternativo gráfico, contraste, teclado.
11. Divergências Base44 documentadas.
12. Nenhuma fórmula de métrica alterada por esta spec.

---

# Checklist WEB / MOBILE

### Web
- [ ] N1–N3 conforme hierarquia  
- [ ] `hidden lg:block` gráficos  
- [ ] Filtros período vs estoque  
- [ ] Filtros locais: área + contrato + contratada (**sem** status)  
- [ ] Recentes + ações  
- [ ] Partial failure  

### Mobile
- [ ] Home pendências  
- [ ] Sem gráficos  
- [ ] Deep links  

### Proibido
- [ ] Radar / pizza densa / 3D / gauge  
- [ ] Ranking pejorativo  
- [ ] Misturar 2 indicadores num card  

---

## Cross-check PO

| Tema | PO / Doc | Spec | Status |
|---|---|---|---|
| `null` = sem acesso | PO-DASH-1 | Ocultar card | Alinhado |
| due soon 3 dias | PO-DASH-2 | Lista próximas | Alinhado |
| Ciência org vs scoped | PO-DASH-3 | N2 cards condicionais | Alinhado |
| 7 famílias | PO-DASH-4 | Barras distribuição | Alinhado |
| Catálogo labels | `DASHBOARD_METRIC_CATALOG` | Copy KPI | Alinhado |

---

## Hand-off

| De | Para |
|---|---|
| UIUX | WEB — `features/dashboard/` página completa |
| UIUX | MOBILE — Home “Minhas pendências” |
| QA | Hierarquia, estoque×fluxo, null≠0, Base44 gaps, a11y gráficos |

```text
UIUX — DASHBOARD-UI-SPEC.md
Sprint 3.2
Data: 2026-08-19
Status: PRONTO PARA IMPLEMENTAÇÃO
DoD: grid N1–N3 + gráficos + listas + filtros + Home Mobile + Base44
```
