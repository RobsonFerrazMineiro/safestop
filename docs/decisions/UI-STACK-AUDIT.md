# UI Stack Audit — Sprint 3.4

**Status:** DECISÕES DO PO REGISTRADAS — handoff **READY_FOR_MASTER**  
**Data:** 2026-08-24 (auditoria) · **Revisão PO:** 2026-08-24  
**Agente:** ARCHITECT (read-only)  
**Subagentes:** nenhum convocado (instrução explícita do Product Owner)  
**Documentos de origem:** `UX-CONVERGENCE-UI-SPEC.md` (v3), `UX-CONVERGENCE-DECISIONS.md`, `docs/design-system.md`, `ADR-002-technology-stack.md`, `packages/ui`, `apps/web`, `apps/mobile`, `reference/base44`

Este documento não altera código, dependências, workflow, schema, RBAC nem domínio. A implementação cabe ao MASTER após este handoff.

---

## 1. Executive Summary

A percepção de “interface crua” observada pelo Product Owner **é consistente com a arquitetura real de apresentação**, não com ausência de produto. O SafeStop já é funcionalmente avançado (workflow, RBAC, notificações, relatórios, plano de ação). A camada visual, porém, é **HTML nativo + classes Tailwind ad hoc (Web)** e **StyleSheet + hex inline (Mobile)**, sem primitivos de Design System e sem biblioteca de visualização de dados.

Achados centrais:

1. **A stack visual documentada em ADR-002 não é a stack instalada.** ADR-002 e `docs/design-system.md` citam shadcn/ui, Lucide e NativeWind. Nenhum desses está em `apps/web/package.json` nem em `apps/mobile/package.json`. Não há `components.json` no produto (só em `reference/base44/`).
2. **`@safestop/ui` existe, mas não é consumido.** Exporta apenas tokens (cores, spacing, radius, tipografia, estados). Não há nenhum `import` de `@safestop/ui` em `apps/web` nem `apps/mobile`. A Web **espelha** as cores em `globals.css`; o restante da UI continua em `gray-*` / `orange-*` do Tailwind default. O Mobile continua com hex inline (`#F97316`, `#111827`, etc.).
3. **Não há Button, Card, Badge, Input, Dialog ou EmptyState compartilhados.** Há dezenas de `<button className="rounded-md bg-orange-500 …">` repetidos no Web e dezenas de `StyleSheet.create` no Mobile.
4. **Gráficos do Dashboard são `div` + percentual CSS**, não Recharts/SVG chart. Tooltip nativo (`title=`), empty textual, tabela em `<details>` para acessibilidade. Relatórios **não têm gráficos** — só tabelas HTML.
5. **Formulários:** React Hook Form + Zod **estão instalados e usados**, mas **desconectados**. RHF valida com `{ required: "…" }` inline; Zod roda no service/mutation (`schema.parse`). Não existe `@hookform/resolvers`.
6. **Dialogs Web:** `<dialog>` nativo + `showModal()` (22 arquivos). Foco é razoável. Visual é o do browser/estilizado ad hoc. Não é Radix.
7. **Ícones:** Web Sidebar usa SVG próprio (`nav-icons.tsx`). Mobile Bottom Nav usa **emoji** (`▦ ☰ 🔔 👤`). Lucide está só no protótipo Base44.
8. **Enterprise ≠ enfeite.** O gap real é hierarquia de primitivos (botão primário vs secundário vs destrutivo), densidade de formulário, gráficos gerenciais e consistência de tokens — não glassmorphism.

Conclusão de handoff (pós-revisão PO): **READY_FOR_MASTER**. As decisões de stack Web/Mobile abaixo estão fechadas. Nenhum bloqueio técnico concreto impede a implementação — há restrições de execução (Tailwind v4 + tema SafeStop, escopo seletivo de primitives, Mobile sem NativeWind) documentadas na seção 17, não impeditivos.

---

## 1.1 Decisões definitivas do Product Owner (revisão Sprint 3.4)

Não reabrir. Substituem as recomendações REJECT/DEFER da auditoria inicial para o Web.

Objetivo da Sprint 3.4 nesta camada: **recuperar a qualidade estrutural de UX/UI da referência Base44**, preservando a identidade SafeStop (dark/grafite, laranja industrial `#F97316`, Enterprise, semântica de status própria). shadcn/ui **não** define a identidade visual.

### Web — ADOPT

| Tecnologia | Uso obrigatório | Limite |
| --- | --- | --- |
| **shadcn/ui** | Base de primitives (código vendored em `apps/web`) | Só os primitives listados; restyle com tokens SafeStop. **Não** copiar visual new-york/light. |
| **Radix UI** | Infraestrutura acessível subjacente aos componentes shadcn aplicáveis | Não instalar Radix “solto” além do que os primitives puxarem. |
| **Lucide React** | Iconografia funcional Web (Sidebar, ações, empty states, charts chrome) | Não adotar `lucide-react-native` nesta Sprint. |
| **Recharts** | Visualização de dados | Substituir gráficos CSS manuais do Dashboard **onde houver gráfico real**. Relatórios continuam tabela-first. |
| **Sonner** | Feedback transitório (toast) | Padrão de toasts. **Não** substitui ciência explícita, confirmações críticas nem banners de estado operacional. |
| **TanStack Table** | Relatórios/tabelas com sorting, filtros, paginação e visibilidade de colunas | Só onde a complexidade justificar (relatórios 3.3). Tabelas simples podem permanecer HTML. |
| **@hookform/resolvers** | Integração RHF + Zod | Não muda regras de domínio. |

### Web — primitives shadcn a adicionar (somente estes, salvo necessidade pontual da UI Spec v3)

Button, Card, Badge, Input, Textarea, Select, RadioGroup, Checkbox, Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Skeleton, Table, Sheet/Drawer quando necessário no Web responsivo.

Não instalar o catálogo shadcn inteiro (accordion, calendar, carousel, etc.) sem demanda da spec.

### Mobile — KEEP (sem NativeWind)

- React Native primitives + StyleSheet  
- Componentes próprios  
- Tokens SafeStop compartilhados conceitualmente (`@safestop/ui`)  
- Bottom Navigation + Stack conforme UI Spec v3  

Motivo: NativeWind agora provocaria refactor transversal desnecessário.

### `packages/ui`

Permanece **tokens e contratos**, sem React. Primitives shadcn vivem em `apps/web` (tipicamente `src/components/ui`). Mobile não consome esses arquivos DOM.

---

## 2. Current Dependency Map

| Technology | Installed | Package | Actually Used | Usage Level | Evidence |
| --- | --- | --- | --- | --- | --- |
| Tailwind CSS v4 | Sim | `apps/web` `tailwindcss@4.3.2` + `@tailwindcss/postcss` | Sim | Alto (Web) | `globals.css` `@import "tailwindcss"`; PostCSS; milhares de utility classes. **Sem** `tailwind.config.*` e **sem** `@theme` mapeando tokens SafeStop. |
| Next.js / React | Sim | `web` Next 16 / React 19 | Sim | Alto | App Router |
| Expo / React Native | Sim | `mobile` Expo 57 / RN 0.86 | Sim | Alto | Expo Router `(tabs)` |
| TanStack Query | Sim | Web + Mobile `5.84.1` | Sim | Alto | providers, query keys |
| React Hook Form | Sim | Web + Mobile `7.54.2` | Parcial | Médio | Só criação PP, perfil e occurrence legado. MDHO/IMS/filtros/diálogos usam estado local. |
| Zod | Sim | Web + Mobile + `@safestop/validation` `3.24.2` | Sim | Alto (domínio) | Schemas compartilhados. **Não** wired ao RHF. |
| `@safestop/ui` | Sim (workspace) | `packages/ui` | **Não importado** | Tokens só (espelho CSS) | `packages/ui/src/index.ts`; grep `from "@safestop/ui"` = 0 em `apps/`. |
| `@safestop/validation` | Sim | workspace | Sim | Alto | createPreventiveStop, profile, MDHO, action plan, IMS, comments |
| NativeWind | **Não** | — | Não | Documentado, não instalado | Citado em ADR-002, `docs/architecture.md`, `docs/engineering.md`. Ausente do `package.json` mobile e do lockfile. Mobile usa `StyleSheet`. |
| shadcn/ui | **Não** | — | Não | Documentado, não instalado | ADR-002; `components.json` apenas em `reference/base44/`. Sem pasta `components/ui` no produto. |
| Radix UI | Não direto | Transitivo `vaul` → `@radix-ui/react-dialog` no lockfile | **Não usado pelo app** | Zero | Nenhum import `@radix-ui` em `apps/`. |
| Lucide | **Não** (produto) | Só `reference/base44` | Não | Zero no produto | `docs/design-system.md` manda “Sempre utilizar Lucide”. Código: SVG próprio + emoji. |
| Recharts | **Não** | — | Não | Zero | `dashboard-charts.tsx` = divs. |
| Sonner / toast lib | **Não** | — | Não | Zero | Toast local em `notification-bell.tsx` (`useState`). Mobile: `Alert.alert`. |
| TanStack Table | **Não** | — | Não | Zero | Tabelas HTML manuais (reports, contacts). |
| `@hookform/resolvers` | **Não** | — | Não | Zero | RHF sem `zodResolver`. |
| CVA / clsx / tailwind-merge | **Não** (produto) | Só Base44 `lib/utils.js` | Não | Zero | Sem `cn()`. |
| NativeWind / lucide-react-native | Não | — | Não | — | — |
| `write-excel-file` | Sim | Web | Sim (export) | Fora de UI visual | Relatórios |
| `vaul` | Transitivo no lockfile | Não declarado nos apps | Não | Irrelevante | Não importado |

---

## 3. Current UI Architecture

```
                    DOCUMENTADO                         IMPLEMENTADO
Web   ADR-002: Next + Tailwind + shadcn     →  Next + Tailwind v4 utilities + HTML nativo
Mobile ADR-002: Expo + NativeWind           →  Expo + StyleSheet + hex
Shared packages/ui: Button/Card/…           →  tokens TS only, sem componentes, sem imports
```

**Web**

```
layout (app)
  AppSidebar (Tailwind + CSS vars --primary/--surface-*)
  OfflineIndicator
  pages → features/*/components
            <button> / <input> / <select> / <textarea> / <dialog>
            classes gray-800 / orange-500 repetidas
```

Não existe `apps/web/src/components/ui`. Existem apenas `collapsible-section.tsx` e `offline-indicator.tsx`.

**Mobile**

```
(tabs)/_layout
  AppBottomTabBar (emoji + hex)
  Stack interno por aba
features/*/components → Pressable + TextInput + Modal/Sheet + Alert.alert
StyleSheet.create em ~90 arquivos
```

`apps/mobile/src/components/` contém só `collapsible-section.tsx`.

**Shared**

- Contratos: `@safestop/types`, `@safestop/validation`, `@safestop/query-keys`.
- UI: `@safestop/ui` = tokens. Sem React, sem peerDependencies de React — **correto** para não acoplar DOM ao RN, mas deixa o visual nas apps.

**Causa raiz da aparência crua**

Não é falta de Tailwind. É ausência de **camada de primitivos** (variantes, padding, radius, focus ring, hierarquia de botão) e o uso massivo da paleta default `gray-*` do Tailwind, que **não é** a escala documentada (`#0F1115`, `#171A21`, `#20242D`). Tokens existem; a maior parte das telas não os usa.

---

## 4. Component Inventory

Classificação: **A** biblioteca consolidada · **B** compartilhado próprio · **C** local repetido · **D** HTML/native cru · **E** inexistente.

| Component | Current implementation | Shared? | Duplication | Classification |
| --- | --- | --- | --- | --- |
| Button | `<button className="rounded-md bg-orange-500 px-4 py-2 …">` em ~40+ arquivos Web; `Pressable` + styles por tela no Mobile | Não | Alta (mesma string de classe copiada) | **C + D** |
| Card | `rounded-lg border border-gray-800 bg-gray-900/40 p-4` (KPI, list item, action plan, org card) | Não | Alta | **C** |
| Badge | `rounded-full border …` inline (status, ciência, atraso, ativo) | Não | Média-alta | **C** |
| Input | `<input>` nativo + classes Tailwind; RN `TextInput` | Não | Alta | **D** |
| Textarea | `<textarea min-h-*>` nativo; RN multiline | Não | Média | **D** |
| Select | `<select>` nativo Web (Nova PP, filtros, criticidade); Mobile `OptionSelectList` próprio | Não | Web: D; Mobile: C de domínio | **D / C** |
| Checkbox | poucas ocorrências (relatórios colunas opcionais) | Não | Baixa | **D** |
| Radio | criticidade Web = `<select>`; Mobile = `SeveritySelector` chips | Não | Divergência Web/Mobile | **D / C** |
| Dialog/Modal | Web: `<dialog showModal>` ~22 arquivos; Mobile: sheets/Alert/Modal | Não | Alta (copy-paste de open/close) | **C + D** |
| AlertDialog | mesmo padrão `<dialog>` / `Alert.alert` | Não | Alta | **C** |
| Dropdown | `report-export-menu.tsx` botões; sem menu acessível | Não | Baixa | **D** |
| Popover | `notification-popover.tsx` painel absoluto próprio | Não | Único | **C** |
| Tooltip | atributo HTML `title=` (sidebar colapsada, gráficos) | Não | — | **D** |
| Toast | estado local no sino; Mobile `Alert.alert` | Não | — | **C** |
| Skeleton | `animate-pulse` / `*LoadingSkeleton` por feature | Não | Média (padrão semelhante) | **C** |
| EmptyState | `StopWorkEmpty`, `ReportEmptyState`, `NotificationEmptyState`, `PreventiveStopEmpty`, … | Não | Alta | **C** |
| Table | HTML `<table>` reports + contacts | Não | 4 tabelas Web | **C** |
| Filtros | chips `rounded-full border` (dashboard, notifications, reports) | Não | Média | **C** |
| Paginação | `report-pagination-controls.tsx` cursor | Não | Isolado | **C** |
| Formulários | RHF em 3 telas Web; resto controlled/local + Zod no service | Schema compartilhado | Validação duplicada RHF vs Zod | **A parcial (Zod) + C** |
| Gráficos | `BarChart` CSS em `dashboard-charts.tsx` | Não | Um arquivo | **D** (divs) |
| Loading / error / retry | por feature (`*Error`, `*Loading`) | Não | Alta | **C** |
| Navegação Web | `AppSidebar` + `get-nav-items.ts` | App-level | — | **C** (feature navigation) |
| Navegação Mobile | `AppBottomTabBar` + Expo Tabs | App-level | — | **C** |
| Ícones | SVG local Web; emoji Mobile | Não | — | **C / D** |
| Collapsible | `collapsible-section` Web e Mobile (duplicado entre apps) | Não (cópia) | 2 arquivos paralelos | **C** |

Nenhuma categoria é **A** (biblioteca de UI consolidada), exceto Tailwind como motor de CSS e Zod como contrato de validação.

---

## 5. Web UI Stack

**Motor:** Tailwind v4 via PostCSS, sem config de tema. Tokens SafeStop em `:root` (`globals.css`) cobrem cor; **não** cobrem spacing/radius/type como utilities (`text-3xl` ≠ token `pageTitle` 32/700 de forma enforced).

**Padrão de construção:** feature-level, classes literais. Exemplo canônico de botão primário repetido:

    rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50

Variantes involuntárias: `bg-orange-600`, `rounded-lg`, `text-base font-semibold`, `text-gray-950` no composer de comentário — **hierarquia de botão inexistente**.

**Sidebar (já P0 da 3.4):** usa CSS vars (`--surface-elevated`, `--primary`) — é o trecho mais alinhado aos tokens. O resto do app ainda fala `gray-800`/`orange-500`.

**Acessibilidade Web:** `role="alert"`/`status` em vários estados; `<dialog>` nativo; Sidebar com labels. Focus ring inconsistente (`outline-none focus:border-orange-500` em inputs; botões sem ring visível padronizado). Tooltip = `title` nativo (ruim em touch).

**O que a Web NÃO tem e o Base44 tinha (referência, não verdade funcional):** shadcn new-york, Lucide, tema claro, radius 10px único, azul primário. Não devem ser copiados visualmente.

---

## 6. Mobile UI Stack

**Motor:** React Native `StyleSheet` + hex. NativeWind **não está instalado**. Instalá-lo agora seria um rewrite de dezenas de telas — fora do espírito “menor mudança” e de PO-UX-7.

**Bottom Nav:** implementada (`app-bottom-tab-bar.tsx`). Ícones emoji; cores `#F97316` / `#C2410C` / `#9CA3AF` **alinhadas semanticamente** aos tokens, mas **não importadas** de `@safestop/ui`. Confirmação de rascunho ao sair da Nova PP: implementada (QA-B4).

**Formulários:** `Controller` + `useForm` na Nova PP e Perfil; validação Zod `safeParse` no submit. `SeveritySelector` (chips) é mais Enterprise que o `<select>` Web — **divergência de composição já registrada na spec seção G**.

**Sheets:** action-plan, evidence, comment, IMS — padrões nativos corretos para campo. Não precisam de Radix.

**Não copiar desktop.** Relatórios/gráficos pesados continuam Web. Mobile não precisa de Recharts nesta sprint.

---

## 7. Forms Architecture

| Tela | Infra | Validação | UI controls |
| --- | --- | --- | --- |
| Nova PP Web | RHF `register` | mensagens `required` no RHF; Zod no hook `createPreventiveStopSchema.parse` | `<select>` / `<textarea>` nativos, coluna única, sem blocos visuais da spec G |
| Nova PP Mobile | RHF `Controller` | Zod `safeParse` no submit | OptionSelectList, SeveritySelector, callout |
| Perfil Web/Mobile | RHF | Zod `profileUpdateSchema.safeParse` | inputs nativos |
| Filtros dashboard/reports | `useState` + `<dialog>` | sem schema de UI | `<select>` nativo |
| MDHO / Ver e Agir / Interdição / IMS / Action plan | estado local + schemas Zod nos services | Zod no submit | mistura de nativo e cards de domínio |
| Occurrence legado Web/Mobile | RHF | schema occurrence | rotas órfãs (PO-UX-5) |

**Infraestrutura de regras:** suficiente (`@safestop/validation`).  
**Infraestrutura visual Enterprise:** insuficiente (sem Input/Select/Field/ErrorText compartilhados; criticidade Web ainda é `<select>`).  
**Não alterar domínio.** O gap é Field wrapping + variantes + chips de criticidade (já P1 na spec), não novos campos.

**`@hookform/resolvers`:** candidato pequeno e justificado (uma única fonte de mensagem de erro: o schema Zod). Não muda regra de negócio.

---

## 8. Charts/Data Visualization Architecture

**Implementação atual** (`apps/web/src/features/dashboard/components/dashboard-charts.tsx`):

- Barras verticais (volume no período) e horizontais (distribuição situação/área/contratada).
- Altura/largura = `%` de `count/max` em `div` com `bg-orange-500/80`.
- Visível só `lg:block` (desktop). Mobile-web: oculto.
- Empty: parágrafo `role="status"`.
- “Tooltip”: atributo `title`.
- Acessibilidade: `role="img"` + `<details>` com tabela de dados.
- Sem eixos, sem grid, sem legenda interativa, sem animação, sem série temporal contínua, sem stacking.

**Relatórios:** sem gráficos. Tabelas + KPIs numéricos (`ReportSummaryKpiCard`).

**Suficiência:**

| Uso | Suficiente hoje? |
| --- | --- |
| Dashboard operacional “atenção agora” | KPI cards sim; gráfico de volume **fraco** para leitura gerencial |
| Distribuição por situação/área/contratada | Barras CSS comunicam ranking; sem comparação de período |
| Relatórios / export | Tabelas são o artefato certo; gráfico não é obrigatório |
| Séries temporais futuras / multi-série | **Não** — CSS bars não escalam |

**Recharts:** **ADOPT** pelo PO (Web Dashboard). Substitui as barras CSS **onde há gráfico real**. Não instalar no Mobile. Relatórios continuam tabela-first (TanStack Table, não gráfico). Manter alternativa textual/acessível junto ao chart.

---

## 9. packages/ui Assessment

Estado real:

- `package.json`: sem `react` / `react-native`. Correto.
- Export: tokens + `withDisabledOpacity` + enum de estados.
- **Nenhum componente.**
- Apps declaram a dependência mas **não importam**.
- Web duplica cores em CSS; Mobile duplica hex.

Regra do monorepo (`012-monorepo.mdc`): componente só entra em `packages/ui` se **Web e Mobile** usarem. Um `Button` React DOM **não** serve ao RN. Colocar Button em `packages/ui` agora criaria um de:

- package web-only disfarçado de shared; ou
- abstração cross-platform prematura (wrapper sem valor).

**Papel correto nesta sprint**

1. Tokens como **fonte única** (já escritos).
2. Apps **importam** tokens (Web: mapear `@theme` Tailwind **ou** usar CSS vars já existentes; Mobile: `colors.primary` no StyleSheet).
3. Primitivos visuais: **`apps/web/src/components/`** (DOM) e, se necessário, **`apps/mobile/src/components/`** (RN), ambos lendo os mesmos tokens. Não um segundo DS.

Isso alinha PO-UX-7 (“não reconstruir biblioteca”, “não segundo DS”) com a regra de compartilhamento real.

---

## 10. Design Tokens Assessment

| Token | Documentado | Em `@safestop/ui` | Em `globals.css` | Uso real nas telas |
| --- | --- | --- | --- | --- |
| background `#0F1115` | Sim | Sim | `--background` | body; muitos fundos ainda `bg-gray-950` / `bg-gray-900` |
| surface / muted / elevated | Sim | Sim | `--surface*` | Sidebar sim; cards em geral não |
| border | Sim | Sim | `--border` | pouco usado vs `border-gray-800` |
| foreground / muted | Sim | Sim | sim | misturado com `text-gray-100/400` |
| primary `#F97316` + hover/active | Sim | Sim | sim | `bg-orange-500` Tailwind ≈ primary, mas não é o token |
| destructive / success / warning / info | Sim | Sim | sim | `red-*` `amber-*` `green-*` `blue-*` ad hoc |
| disabled 40% | Sim | `DISABLED_OPACITY` | `--disabled-opacity` | `opacity-50` / `opacity-60` inconsistente |
| spacing 4–96 | Sim | Sim | **não** como CSS vars | Tailwind default |
| radius por componente | Sim | Sim (`input:8` `card:12` …) | **não** | `rounded-md`/`lg` misturados |
| typography | Sim | Sim | Inter no layout | `text-3xl`/`text-sm` ad hoc |
| shadows | design-system | **Não** | Não | quase ausentes (correto para visual sóbrio) |
| focus ring | design-system | **Não** como token | Não | inconsistente |

Identidade (grafite + laranja industrial, semântica de status) **está preservada na paleta**. O problema é **aplicação irregular**, não paleta errada.

Não introduzir gradientes/glass. Shadows: no máximo elevação mínima em dialog/sidebar; KPI não precisa de sombra.

---

## 11. UX-CONVERGENCE-UI-SPEC Readiness

| Feature | Status | Gap | Recommendation |
| --- | --- | --- | --- |
| Sidebar Web | **READY** (navegação P0) | Tokens parciais; ícones SVG próprios vs Lucide documentado | Não refazer estrutura. Opcional: Lucide se PO adotar. |
| Bottom Navigation Mobile | **READY** (navegação) | Emoji; hex não importado de `@safestop/ui` | Consumir tokens; ícones formais = P1 spec. |
| Nova PP | **PARTIAL** | Organização visual (blocos) e chips de criticidade Web ainda não feitos (P1 spec). Campos de domínio OK. | Implementar composição da spec G **sem** novas libs, com Field/Button locais. |
| Detalhe da PP | **PARTIAL** | Hierarquia P0 em grande parte no código; unificar “Decisão da Liderança” visualmente ainda é composição, não stack. | Sem dependência nova. |
| Dashboard | **PARTIAL** | KPIs ricos; gráficos CSS básicos; títulos de seção P1 | Gráficos: ver decisão Recharts. Hierarquia: CSS. |
| Relatórios | **READY** funcional / **PARTIAL** visual | Tabelas HTML densas, adequado gerencial. Sem DS de Table. | Não TanStack Table agora. Button/Badge/Empty já cobrem o visual. |
| Notificações | **READY** funcional | Distinção leitura×ciência existe. Badges ad hoc. | Badge primitivo Web. |
| Perfil | **READY** | Inputs crus; logout já na Sidebar/Perfil mobile | Input/Button locais. |
| Estados críticos (offline, retry, forbidden) | **PARTIAL** | Offline Web existe (`OfflineIndicator`). Empty/Error repetidos. | EmptyState/ErrorState locais P1. |
| Responsividade | **PARTIAL** | Sidebar drawer/collapse implementados. Grids KPI tablet ainda gap spec Q. | CSS, sem lib. |
| packages/ui tokens | **PARTIAL** | Existem, não consumidos | P0 técnico: **wire tokens**, não criar 15 componentes shared. |
| Design System doc vs código | **REFACTOR_REQUIRED** (doc, na implementação) | ADR-002 já previa shadcn/Lucide; NativeWind permanece documentado mas **não** será adotado nesta Sprint | MASTER/DOCS: alinhar `docs/design-system.md` à stack Web adotada e registrar NativeWind como não adotado no Mobile atual. |

A spec v3 **não precisa ser reaberta** em navegação, nomenclatura, online-only, RBAC ou hierarquia de detalhe. A revisão do PO (seção 1.1) fecha a stack Web. O MASTER implementa primitives + Recharts/Sonner/Table nos pontos da spec, sem mudar domínio.

---

## 12. Dependency Recommendations

### Tailwind CSS

- **Problem:** —  
- **Current:** já é o motor Web.  
- **Candidate:** KEEP.  
- **Why:** já padroniza spacing/utility; gap é tema/tokens, não a lib.  
- **Trade-off:** default `gray-*` ≠ tokens SafeStop até mapear `@theme`.  
- **Decision: KEEP**

### shadcn/ui

- **Problem:** aparência crua; primitives inexistentes; ADR-002 já previa shadcn.  
- **Current:** HTML nativo + classes Tailwind ad hoc.  
- **Candidate:** primitives vendored (CLI shadcn) em `apps/web`.  
- **Why:** qualidade estrutural (variantes, a11y via Radix, composição) alinhada à referência Base44, **sem** copiar tema light/new-york.  
- **Trade-off:** Tailwind v4 exige `components.json` + mapeamento de CSS variables para tokens SafeStop já em `globals.css`; risco de visual “template” se o tema não for adaptado.  
- **Decision: ADOPT** — primitives **seletivos** (seção 1.1). Identidade = tokens SafeStop, não o tema default shadcn.

### Radix UI

- **Problem:** Select/Dialog/Dropdown nativos limitados em hierarquia e a11y.  
- **Current:** `<dialog showModal>` / `<select>` / menus de botões.  
- **Candidate:** Radix via shadcn (Dialog, AlertDialog, Select, DropdownMenu, Popover, Tooltip, RadioGroup).  
- **Why:** infraestrutura acessível sob os primitives adotados.  
- **Trade-off:** substituir `<dialog>` nativo gradualmente, sem mudar regras de confirmação (ciência CRITICAL continua explícita).  
- **Decision: ADOPT** como dependência dos primitives shadcn aplicáveis.

### Lucide React

- **Problem:** SVG avulso na Sidebar; design-system exige Lucide.  
- **Current:** `nav-icons.tsx`.  
- **Candidate:** `lucide-react` (Web).  
- **Why:** iconografia funcional consistente.  
- **Trade-off:** Mobile permanece sem Lucide nesta Sprint (emoji/SVG próprios = P1 spec).  
- **Decision: ADOPT (Web).** Mobile: **DEFER**.

### Recharts

- **Problem:** gráficos CSS insuficientes para leitura gerencial.  
- **Current:** `dashboard-charts.tsx` (div + %).  
- **Candidate:** `recharts` em `apps/web`.  
- **Why:** eixos, tooltip, resize, séries; substitui visualizações CSS **onde há gráfico real**.  
- **Trade-off:** bundle; theming dark; manter tabela/dados acessíveis (não remover alternativa textual).  
- **Decision: ADOPT (Web Dashboard).** Relatórios: **não** exigir gráfico.

### React Hook Form + Zod + resolvers

- **Problem:** RHF e Zod desconectados.  
- **Current:** `required:` no RHF; `schema.parse` no service.  
- **Candidate:** `@hookform/resolvers` (`zodResolver`).  
- **Why:** uma fonte de mensagens; formulários Enterprise sem mudar domínio.  
- **Decision: ADOPT.** KEEP RHF e Zod.

### Sonner

- **Problem:** feedback transitório fragmentado (toast local no sino, Alert no Mobile).  
- **Current:** `useState` em `notification-bell.tsx`.  
- **Candidate:** `sonner` no Web.  
- **Why:** padrão único de toast.  
- **Trade-off:** uso indevido em ações críticas. Ciência, interdição, MDHO e confirmações **permanecem** dialog/CTA explícito.  
- **Decision: ADOPT** como feedback **transitório** apenas.

### TanStack Table

- **Problem:** tabelas de relatório com sort/colunas/paginação manuais.  
- **Current:** HTML `<table>` em occurrences/action-items/awareness (+ contacts).  
- **Candidate:** `@tanstack/react-table`.  
- **Why:** complexidade já existente nos relatórios 3.3 (sort, colunas opcionais, paginação cursor).  
- **Trade-off:** não reescrever tabelas triviais. Contacts: MASTER avalia se a complexidade justifica; default = reports sim, demais só se necessário.  
- **Decision: ADOPT** nos relatórios/tabelas **onde a complexidade justificar**.

### NativeWind

- **Problem:** doc cita NativeWind.  
- **Current:** StyleSheet.  
- **Why not:** refactor transversal nesta Sprint.  
- **Decision: REJECT** Sprint 3.4 (confirmado pelo PO).

### CVA + clsx + tailwind-merge

- **Problem:** variantes de Button/Badge.  
- **Current:** strings copiadas.  
- **Candidate:** já vêm com shadcn (`cn()`, CVA).  
- **Decision: ADOPT** como utilitários do setup shadcn no Web.

### `@safestop/ui` tokens

- **Problem:** DS paralelo (CSS vars vs hex vs gray-*).  
- **Current:** tokens escritos, pouco consumidos.  
- **Decision: KEEP** — fonte da identidade. shadcn **mapeia** para esses tokens; não criar paleta shadcn paralela.

---

## 13. packages/ui Proposed Scope

### P0 — shared (sem React no package)

- Tokens (`colors`, `spacing`, `radius`, `typography`, `componentStates`) como fonte da identidade.
- Mapear tokens para CSS variables / `@theme` Tailwind **usadas pelo shadcn** (primary = `#F97316`, background grafite, radius por componente SafeStop — não `--radius: 0.625rem` do Base44).
- Mobile: importar `colors` na Bottom Nav e CTAs (sem NativeWind).

### P0 — Web (`apps/web`, shadcn seletivo)

Adicionar e tematizar: Button, Card, Badge, Input, Textarea, Select, RadioGroup, Checkbox, Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, Skeleton, Table, Sheet/Drawer (Web responsivo, se o drawer atual da Sidebar for substituído ou encapsulado).

EmptyState / feedback de página: composição SafeStop **sobre** Card + Button + Lucide — não precisa de primitive shadcn “Empty” se não existir no set mínimo.

### P1 — aplicação nas telas da UI Spec v3

- Nova PP: Field + Select/RadioGroup (chips de criticidade).  
- Dashboard: Recharts no lugar das barras CSS; Card/KPI.  
- Relatórios: TanStack Table + shadcn Table onde justificar.  
- Notificações: Badge + Dialog/AlertDialog; Sonner só para “marcado como lida” e equivalentes transitórios.  
- Sidebar: Lucide no lugar de `nav-icons.tsx`; **não** trocar a arquitetura da Sidebar da spec C por um bloco shadcn Sidebar genérico, salvo equivalência comprovada.

### P2

- Lucide no Mobile.  
- NativeWind.  
- Catálogo shadcn além da lista 1.1.  
- NavigationItem em `packages/ui`.

---

## 14. Migration Strategy

Incremental. Sem big-bang. Sem NativeWind.

1. **Tema SafeStop no Web:** `components.json` + CSS variables mapeadas aos tokens `@safestop/ui` / `globals.css`; `html` sempre dark (sem tema claro).  
2. **Adicionar primitives seletivos** (lista 1.1), já restylados (laranja industrial, radius SafeStop, superfícies grafite).  
3. **Toaster (Sonner)** no layout Web — uso só para feedback transitório.  
4. **Substituir CTAs e campos** nas telas da UI Spec (login, Nova PP, Perfil, listas, dialogs de ação) por Button/Input/Select/Dialog.  
5. **Dashboard:** Recharts nos gráficos reais; manter KPI cards; tabela acessível de dados do gráfico.  
6. **Relatórios:** TanStack Table nas três telas de relatório (e contacts só se MASTER justificar).  
7. **Lucide** na Sidebar e ícones funcionais Web.  
8. **`zodResolver`** nos formulários RHF existentes.  
9. **Mobile:** apenas consumo de tokens; Bottom Nav intacta em arquitetura.  
10. **DOCS:** design-system/ADR — shadcn+Lucide adotados no Web; NativeWind explicitamente não adotado no Mobile atual.

Proibido: instalar todos os componentes shadcn; copiar tema new-york/light; usar toast no lugar de ciência; Recharts em Relatórios sem necessidade; refatorar Mobile para NativeWind.

---

## 15. Risks

| Risco | Detalhe |
| --- | --- |
| Regressão visual | Troca de `<dialog>`/`<button>` por Radix/shadcn pode quebrar E2E e fluxos de confirmação. Migrar tela a tela; preservar copy e RBAC. |
| Segundo Design System | Mitigado: shadcn **tematizado** com tokens SafeStop; proibido manter paleta default new-york. |
| Tailwind v4 | shadcn precisa de setup compatível com `@import "tailwindcss"` e variáveis já existentes. Não é bloqueio: é restrição de implementação (MASTER deve validar `components.json` + CSS). |
| Bundle | Recharts + Radix + TanStack Table + Lucide aumentam o JS Web. Aceito pelo PO; não levar Recharts/Table ao Mobile. |
| Sonner vs ciência | Toast nunca confirma ciência nem ações destrutivas. |
| Divergência Web/Mobile | Intencional nesta Sprint (sem NativeWind). Tokens conceitualmente iguais. |
| Abstração excessiva | Não mover shadcn para `packages/ui`. |
| Testes | Playwright: atualizar seletores após primitives; manter `data-testid` existentes no login. |
| Sidebar | Não substituir a arquitetura da spec C por `Sidebar` shadcn genérico sem equivalência (RBAC, org ativa, logout no rodapé, lista plana). |

---

## 16. Final Architecture Recommendation

### WEB

- Next.js + Tailwind v4 (**KEEP**)  
- Tokens `@safestop/ui` + CSS variables = **identidade**  
- **shadcn/ui** (primitives seletivos) + **Radix** (a11y) + **CVA/cn**  
- **Lucide React** (ícones)  
- **Recharts** (gráficos reais do Dashboard)  
- **Sonner** (toasts transitórios)  
- **TanStack Table** (relatórios com complexidade real)  
- Forms: RHF + Zod + **`@hookform/resolvers`**  
- Tema: dark/grafite + laranja industrial — **nunca** new-york/light  

### MOBILE

- Expo + StyleSheet (**KEEP**)  
- Tokens `@safestop/ui` no StyleSheet  
- Sheets/Alert nativos (**KEEP**)  
- Bottom Nav + Stack (UI Spec)  
- **Não:** NativeWind, shadcn, Recharts, TanStack Table, Sonner nesta Sprint  

### SHARED

- `@safestop/ui`: tokens e contratos (sem React)  
- `@safestop/validation` + types + query-keys: inalterados  

Fórmula (inalterada):

    UX/estrutura Base44  +  funcionalidade SafeStop  +  identidade grafite/laranja

Infraestrutura visual Web:

    tokens SafeStop  +  shadcn tematizado  +  Recharts/Sonner/Table nos pontos justificados

---

## 17. Handoff Recommendation

**READY_FOR_MASTER**

As decisões do Product Owner (seção 1.1) fecharam a stack. **Não há bloqueio técnico concreto** que impeça o início da implementação.

Restrições de execução (não são “não fazer”; são “fazer assim”):

1. Tailwind v4 já está no Web — o setup shadcn deve ser compatível (`components.json`, CSS variables mapeadas aos tokens existentes em `globals.css` / `@safestop/ui`). Forçar `dark`; não introduzir tema claro.  
2. Instalar **somente** os primitives da lista 1.1 (+ utilitários `cn`/CVA que o shadcn exigir).  
3. shadcn/Radix = estrutura e a11y; tokens SafeStop = aparência.  
4. Sonner ≠ ciência.  
5. TanStack Table só em tabelas com sort/filtros/paginação/colunas (relatórios).  
6. Recharts só onde hoje há gráfico real (Dashboard).  
7. Não NativeWind. Não mover primitives DOM para `packages/ui`. Não substituir a Sidebar da spec C por um template genérico.  
8. Não alterar workflow, schema, RLS, RBAC, domínio.

PO-UX-1 a PO-UX-7 e a UI Spec v3 permanecem a verdade de navegação e composição. Este arquivo é a verdade da **stack de apresentação Web**.

O MASTER pode distribuir implementação (WEB primeiro; MOBILE só tokens/nav já especificados; BUILD/QA/DOCS em seguida).

---

## 18. Conclusão UIUX (ARCHITECT, sem subagente)

Atualizado após a revisão do PO. Subagente UIUX não foi convocado.

1. **A stack agora adotada (shadcn tematizado + Radix + Lucide + Recharts + Sonner + TanStack Table no Web) sustenta a visão visual aprovada?**  
   Sim, **desde que** o tema shadcn seja o da identidade SafeStop (não new-york/light) e o Mobile permaneça StyleSheet. Isso recupera a qualidade estrutural da referência Base44 sem reabrir navegação, workflow ou nomenclatura da spec v3.

2. **Lacunas técnicas que impediriam a convergência?**  
   Nenhuma bloqueante. A única restrição concreta é o **encaixe shadcn + Tailwind v4 + CSS variables já definidas** — resolvível na implementação, não um veto.

3. **O que comprometeria a UX aprovada se feito errado?**  
   Copiar o visual default shadcn; NativeWind no Mobile; toast no lugar de ciência; Sidebar genérica no lugar da spec C; Recharts/tabelas no Mobile.

4. **Dependência desnecessária nesta decisão do PO?**  
   O catálogo shadcn **completo** e NativeWind. A lista seletiva da seção 1.1 é o teto.

---

## Evidência de arquivos consultados

`package.json` (raiz), `apps/web/package.json`, `apps/mobile/package.json`, `packages/ui/package.json`, `packages/config/package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` (radix/vaul transitivo, sem recharts/lucide/nativewind no produto), `apps/web/postcss.config.mjs`, `apps/web/src/app/globals.css`, `packages/ui/src/index.ts` + `tokens/*`, `apps/web/src/features/dashboard/components/dashboard-charts.tsx`, `dashboard-kpi-card.tsx`, `stop-work-create-container.tsx`, `app-sidebar.tsx`, `nav-icons.tsx`, `apps/mobile/src/features/navigation/components/app-bottom-tab-bar.tsx`, `docs/design-system.md`, `docs/decisions/ADR-002-technology-stack.md`, `UX-CONVERGENCE-UI-SPEC.md`, `UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md`, `reference/base44/components.json` e `package.json` (não são o produto).

Nenhum código foi alterado nesta revisão documental. Nenhuma dependência foi instalada. Nenhum commit foi feito. Handoff: **READY_FOR_MASTER**.
