# Auditoria Global de Convergência UX/UI — SafeStop

**Status:** AUDITORIA SOMENTE — aguarda revisão do PO  
**Data:** 2026-08-25  
**Agente:** ARCHITECT  
**Modo:** diagnóstico. Nenhum código, dependência, banco, teste ou commit foi alterado nesta etapa.  
**Única alteração permitida:** este arquivo.

**Fórmula oficial (não reabrir):**

```
BASE44              = referência de UX / estrutura
REPOSITÓRIO ATUAL   = fonte da verdade funcional
IDENTIDADE SAFESTOP = dark industrial + #F97316
```

Decisões já fechadas e **não reabertas** nesta auditoria: `PO-UX-1` … `PO-UX-7` em [`UX-CONVERGENCE-DECISIONS.md`](./UX-CONVERGENCE-DECISIONS.md).

---

## 1. Executive Summary

A Sprint 3.4 entregou a **arquitetura de navegação** (Sidebar Web, Bottom Nav + FAB Mobile) e iniciou a **adoção seletiva de shadcn/Radix/Lucide/Recharts/Sonner/TanStack Table/@hookform/resolvers**. Isso **desatualiza** a auditoria de stack anterior: essas bibliotecas **já estão instaladas** no Web. O problema restante **não** é “falta de biblioteca”. É **convergência incompleta**.

O produto ainda opera com **dois sistemas visuais no Web**:

1. Primitivas shadcn em `apps/web/src/components/ui/` (login, dashboard CTA, Nova PP, lista, alguns relatórios, parte das notificações).
2. HTML nativo (`<button>`, `<dialog>`, `<input>`, `<select>`) em fluxos operacionais críticos: MDHO, plano de ação, evidências, IMS, timeline/comentários, filtros do dashboard, contatos.

No Mobile, a navegação convergiu; o visual **não**. Quase todo o app ainda usa `StyleSheet` com hex direto. `@safestop/ui` é importado em **apenas 3 arquivos** mobile (tab bar, perfil, Nova PP) e **em nenhum arquivo TypeScript do Web** (o Web espelha tokens via CSS em `globals.css`).

Mesmo ignorando cores, as divergências mais graves são **estruturais**:

- Dashboard Web: densidade e hierarquia diferentes da referência (manter os KPIs reais; reorganizar a composição).
- Listas Web/Mobile: busca só por código IMS; Base44 busca por área/empresa/atividade e tem funil de filtro.
- Detalhe Web: container `max-w-3xl` subutiliza o desktop; decisão da liderança não tem o par de cards grandes da referência.
- Nova PP Web: formulário melhorou (Card + Select + Radio), mas permanece estreito (`max-w-2xl`), em coluna única, sem o callout de “< 60s”.
- Participantes existem no detalhe Mobile e **não** no Web.
- Não existe UI de Platform Admin para gestão de usuários/acessos, apesar de `user.manage` / `organization.manage` na matriz RBAC.

**Veredito:** a navegação está **verde**. O núcleo operacional (lista, dashboard, detalhe, primitivas fragmentadas) está **amarelo a vermelho**. Módulos atuais sem equivalente Base44 (relatórios, MDHO fila, RBAC avançado, contatos) são **preto** — não forçar cópia; desenhar superfície própria.

Esta auditoria **não recomenda remover** MDHO, plano de ação, ciência, relatórios, multi-organização, RBAC, evidências ou IMS.

---

## 2. Repository/UI Reality

Estado **confirmado no repositório** em 2026-08-25. Não assumir a auditoria de stack anterior como vigente.

### Stack Web (`apps/web/package.json`)

| Biblioteca | Estado real |
| --- | --- |
| Next.js 16 + React 19 + Tailwind CSS v4 | Presente |
| `lucide-react` | Instalado; usado na sidebar e em alguns fluxos |
| `recharts` | Instalado; usado em `dashboard-charts.tsx` |
| `sonner` | Instalado; `toaster.tsx` + toasts transientes |
| `@tanstack/react-table` | Instalado; tabelas de relatórios |
| `@hookform/resolvers` | Instalado; Nova PP Web |
| `radix-ui` + `class-variance-authority` + `clsx` + `tailwind-merge` + `tw-animate-css` | Instalados |
| shadcn (`components.json` style `new-york`) | Presente; tema **mapeado** para identidade SafeStop (`html.dark`, `--primary: #f97316`) |
| NativeWind | Ausente (e não se aplica ao Web) |

Primitivas em `apps/web/src/components/ui/`: `button`, `card`, `badge`, `input`, `textarea`, `select`, `radio-group`, `checkbox`, `dialog`, `alert-dialog`, `dropdown-menu`, `popover`, `tooltip`, `skeleton`, `table`, `sheet`, `toaster`, `ui-providers`.

### Stack Mobile (`apps/mobile`)

| Item | Estado real |
| --- | --- |
| Expo 57 + React Native 0.86 | Presente |
| Expo Router (grupos, tabs, stacks) | Presente |
| StyleSheet | Padrão dominante |
| NativeWind | **Não instalado** |
| Lucide / ícones vetoriais | Não consolidado (emoji/texto na tab bar e em várias telas) |
| `@safestop/ui` | Importado só em 3 arquivos (somente `colors`) |

### Tokens (`packages/ui`)

Exporta **apenas tokens**: `colors`, `spacing`, `radius`, `typography`, `componentStates`. Sem componentes React DOM (alinhado a `PO-UX-7`).

Web **não importa** `@safestop/ui` no TypeScript. Consome espelho CSS em `apps/web/src/app/globals.css`. Paralelamente, dezenas de classes `text-gray-*` / `bg-gray-*` / `text-orange-*` coexistem com tokens semânticos (`text-primary`, `text-muted-foreground`).

### Documentação prévia ainda válida como contexto (não como estado de código)

- [`UX-CONVERGENCE-DECISIONS.md`](./UX-CONVERGENCE-DECISIONS.md) — decisões PO fechadas.
- [`UX-CONVERGENCE-UI-SPEC.md`](./UX-CONVERGENCE-UI-SPEC.md) — spec v3.
- [`UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md`](./UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md) — gate 3.4 de navegação. Observação: o trecho que diz que a tab bar **não** consome `@safestop/ui` está **desatualizado**; `app-bottom-tab-bar.tsx` já importa `colors`.

---

## 3. Route Inventory — Web

**18 rotas `page.tsx`.** Destas, **3** são redirects legados. Superfícies aninhadas (seções/dialogs) estão listadas depois.

Dados: queries reais (Supabase). Não há mock de UI nas rotas de produção. Fallbacks: empty/error/forbidden/loading por feature.

### 3.1 Rotas de página

| Rota | Arquivo | Finalidade | Persona / permissão | Ações | Componentes relevantes | Visual | Relação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` | `apps/web/src/app/(auth)/login/page.tsx` | Autenticação | Público | Login | `Button` shadcn | shadcn parcial | → `/` |
| `/` | `apps/web/src/app/(app)/page.tsx` | Dashboard operacional | `canAccessDashboard` | Período, escopo, Nova PP, drill-down | `dashboard-page`, Recharts, `Button` | misto (shadcn + `button` nativo nos filtros) | → lista, Nova PP |
| `/stop-work` | `.../stop-work/page.tsx` | Lista de PP | `occurrence.read` | Busca IMS, Nova PP, abrir detalhe, visões de atenção do dashboard | `StopWorkListContainer`, `Button`, `Input` | shadcn no header; cards nativos | → `/stop-work/[id]`, `/stop-work/new` |
| `/stop-work/new` | `.../stop-work/new/page.tsx` | Registrar PP | `occurrence.create` | Submit | `StopWorkCreateContainer`, RHF+Zod+Select+Radio+Card | shadcn | → detalhe após create |
| `/stop-work/[id]` | `.../stop-work/[id]/page.tsx` | Detalhe + workflow | `occurrence.read` + permissões por seção | Ciência, decisão, MDHO, IMS, plano, evidências, timeline | `StopWorkDetailContainer` + seções | Card/Badge shadcn; ações nativas nas seções | núcleo operacional |
| `/notifications` | `.../notifications/page.tsx` | Central | `notification.read` | Filtros, leitura, ciência | `NotificationCenterContainer`, Badge, AlertDialog, sonner | misto | → detalhe via deep link |
| `/profile` | `.../profile/page.tsx` | Perfil + org | autenticado | Editar, trocar org | `profile-page`, `Button` | shadcn parcial | → `/organizations` |
| `/organizations` | `.../organizations/page.tsx` | Seletor multi-org | autenticado (multi) | Selecionar org | `organization-card` nativo | nativo | volta ao app |
| `/organization-contacts` | `.../organization-contacts/page.tsx` | Responsáveis / contatos | `organization.manage` (nav) | CRUD | tabela + `<dialog>` nativo | nativo | isolado |
| `/approvals/mdho` | `.../approvals/mdho/page.tsx` | Fila HSE MDHO | `mdho.approve` / `mdho.return` | Aprovar / devolver | `hse-approval-*` | misto | → detalhe |
| `/reports` | `.../reports/page.tsx` | Hub de relatórios | `report.read` (nav) | Navegar | hub cards | nativo/shadcn misto | → 3 relatórios |
| `/reports/occurrences` | `.../reports/occurrences/page.tsx` | Relatório de PP | mesma | Filtrar, paginar, exportar | TanStack Table + dialogs shadcn | shadcn+table | — |
| `/reports/action-items` | `.../reports/action-items/page.tsx` | Relatório de ações | mesma | idem | TanStack Table | shadcn+table | — |
| `/reports/awareness` | `.../reports/awareness/page.tsx` | Relatório de ciência | mesma | idem | TanStack Table | shadcn+table | — |
| `/forbidden` | `.../forbidden/page.tsx` | Sem permissão | qualquer | Voltar | `authorization-forbidden` | nativo | — |
| `/occurrences` | `.../occurrences/page.tsx` | Legado | — | `redirect("/stop-work")` | — | — | PO-UX-5 |
| `/occurrences/new` | `.../occurrences/new/page.tsx` | Legado | — | redirect Nova PP | — | — | PO-UX-5 |
| `/occurrences/[id]` | `.../occurrences/[id]/page.tsx` | Legado | — | redirect detalhe | — | — | PO-UX-5 |

### 3.2 Superfícies aninhadas (não são rotas, mas UI real)

| Superfície | Onde | Finalidade |
| --- | --- | --- |
| Sidebar / drawer / tooltip | `(app)/layout.tsx` + `app-sidebar.tsx` | Nav, org, logout, badge |
| Offline indicator | layout | Banner de conexão |
| Banner de ciência | detalhe | Ciência explícita ≠ leitura |
| Banner interdição oficial | detalhe | Status crítico |
| Dead-end operacional | detalhe | Status sem próximo passo |
| Decisão da liderança (Ver e Agir / Interdição) | detalhe | Workflow |
| MDHO (iniciar, form, resumo, estados) | detalhe | Avaliação técnica |
| Referência IMS | detalhe | Código manual (não integra IMS) |
| Plano de ação (itens, submit, validar, concluir) | detalhe | Tratativa |
| Evidências (galeria, upload, preview, delete) | detalhe | Anexos |
| Timeline + comentários | detalhe | Auditoria |
| Filtros de período / escopo | dashboard | Recorte operacional |
| KPI cards clicáveis | dashboard | Drill-down para lista |
| Gráficos Recharts | dashboard | Volume |
| Lista de atenção (ações vencidas/próximas) | dashboard + lista | Follow-up |
| Dialogs nativos `<dialog>` | MDHO, IMS, evidência, ação, comentário, contatos, filtros dashboard | Confirmação / formulário |
| AlertDialog / Dialog shadcn | notificações, alguns relatórios | Confirmação |
| Popover do sino | sidebar | Preview de notificações |
| Organization / Authorization gates | layout | Empty org / forbidden |

**Não existe rota Web para:** cadastro, forgot/reset password, Platform Admin de usuários, gestão de memberships, participantes da ocorrência.

---

## 4. Route Inventory — Mobile

**19 arquivos em `apps/mobile/app/`:** 5 layouts + 14 telas (incluindo 3 redirects + 1 index de auth).

### 4.1 Navegação (Expo Router)

- Grupo `(auth)`: login.
- Grupo `(app)`: gate de org/authz.
- Grupo `(app)/(tabs)`: Bottom Nav persistente.
- Stack interno `stop-work/_layout.tsx`: lista / new / `[id]` **dentro das tabs** (barra permanece no detalhe e na criação).
- Fora das tabs: `organizations`, `forbidden`, `approvals/mdho`, redirects `occurrences*`.

### 4.2 Telas

| Rota | Arquivo | Finalidade | Persona | Ações | Visual | Relação |
| --- | --- | --- | --- | --- | --- | --- |
| `/` (root) | `app/index.tsx` | Redirect auth | — | — | — | login ou tabs |
| `/(auth)/login` | `login.tsx` | Autenticação | Público | Login | StyleSheet hex | → tabs |
| `/(app)/(tabs)/` | `index.tsx` | Início operacional | autenticado | Atalhos pendentes, pull-to-refresh, Nova PP | StyleSheet; pouco token | → lista, detalhe, MDHO, notif |
| `/(tabs)/stop-work` | `stop-work/index.tsx` | Lista | `occurrence.read` | IMS search, abrir, Nova PP | StyleSheet | → `[id]`, `new` |
| `/(tabs)/stop-work/new` | `new.tsx` | Registrar PP | `occurrence.create` | Submit; confirma saída de rascunho | tokens parciais (`colors`) | → `[id]` |
| `/(tabs)/stop-work/[id]` | `[id].tsx` | Detalhe + workflow | `occurrence.read` | Mesmo domínio do Web + **participantes** | StyleSheet | núcleo de campo |
| `/(tabs)/notifications` | `notifications/index.tsx` | Central | `notification.read` | Leitura / ciência | StyleSheet | → detalhe |
| `/(tabs)/profile` | `profile.tsx` | Perfil + logout | autenticado | Editar, sair, trocar org | `colors` + hex residual | → organizations |
| `/(app)/organizations` | `organizations.tsx` | Multi-org | multi-org | Selecionar | StyleSheet | volta |
| `/(app)/forbidden` | `forbidden.tsx` | Sem permissão | — | Voltar | StyleSheet | — |
| `/(app)/approvals/mdho` | `approvals/mdho/index.tsx` | Fila MDHO | HSE | Aprovar / devolver | StyleSheet | → detalhe |
| `/(app)/occurrences` `/new` `/[id]` | 3 arquivos | Legado | — | Redirect para stop-work | — | PO-UX-5 |

FAB **Paralisar** na Bottom Nav → `stop-work/new`. Destinos permanentes: Início, Paralisações, Notificações, Perfil (4) + FAB.

### 4.3 Superfícies aninhadas Mobile

Mesmo domínio do detalhe Web (MDHO, evidência, IMS, plano, timeline, ciência) + `OccurrenceParticipantsSection` (somente Mobile) + confirmação de rascunho da Nova PP + estados de loading/error por feature.

**Não existe:** Dashboard KPI como no Base44 mobile; forgot/reset; Register; UI de Platform Admin.

---

## 5. Current Visual Architecture

### Web — como a UI é construída hoje

| Padrão | Como existe hoje | Duplicação |
| --- | --- | --- |
| Button | shadcn `Button` **e** `<button className=...>` em ~50 arquivos | **8+ visualmente distintos** (primary laranja, ghost gray, underline, pills de filtro, icon-only) |
| Card | shadcn `Card` (Nova PP, detalhe, gráficos) **e** `div` bordered (KPI, lista, org, reports hub) | 2–3 famílias |
| Input / Textarea | shadcn na Nova PP e busca IMS **e** nativos em MDHO, IMS, comentários, contatos | alturas/radius mistos |
| Select | shadcn `Select` na Nova PP **e** `<select>` nativo em outros forms | 2 |
| Radio | `RadioGroup` shadcn (criticidade) **e** cards/botões próprios (decisão liderança) | justificado no 2º caso (ação de workflow) |
| Checkbox | primitiva existe; uso pontual | baixo |
| Badge | shadcn no detalhe/notif **e** spans uppercase no resto | 2+ |
| Tabs | **não** há primitiva de tabs de página | N/A |
| Filters | pills nativas (dashboard período/escopo) vs dialogs shadcn (relatórios) vs input IMS (lista) | 3 famílias |
| Search | IMS-only na lista; full-text só como referência Base44 | gap funcional |
| Dialog | Radix `Dialog`/`AlertDialog` **e** `<dialog>` HTML em ≥12 componentes | **crítico** |
| Dropdown | shadcn em export de relatórios / alguns menus | parcial |
| Tooltip | shadcn na sidebar colapsada | ok |
| Table | TanStack + `ui/table` nos relatórios; HTML table no fallback a11y dos charts e em contatos | 2 |
| List | cards clicáveis (lista PP) vs linhas (atenção) vs items notificação | 3 |
| Pagination | controles próprios nos relatórios | 1 |
| Empty / Skeleton / Error | um conjunto **por feature** (`*-states.tsx`, `*-empty.tsx`) | alta duplicação de copy/layout |
| Toast | Sonner para transiente | correto (ciência **não** é toast) |
| Sidebar / Header | Sidebar existe; **não** há top bar de página; **não** há `PageHeader` compartilhado | cada página monta h1+subtitle+CTA |
| Breadcrumb | link “← Voltar” / “Paralisações / código” ad hoc | 2 padrões |
| KPI | `dashboard-kpi-card` próprio (clicável) | 1, mas visual ≠ Base44 (sem ícone, grid denso) |
| Charts | Recharts + tabela acessível em `<details>` | 1 (bom) |
| Forms | RHF+Zod na Nova PP; forms manuais no resto | 2 arquiteturas |
| Section | `CollapsibleSection` no detalhe; cards soltos no resto | 2 |

### Mobile — equivalente

| Padrão | Estado |
| --- | --- |
| Button | `Pressable` + StyleSheet por tela; cores hex ou `colors.primary` pontual |
| Card | `PreventiveStopCard` + cards inline no home/detalhe |
| Input | `TextInput` com placeholder hex `#6B7280` recorrente |
| FAB | integrado na tab bar (não é FAB flutuante sobre conteúdo) |
| Icons | emoji / texto; não Lucide |
| Lists | `FlatList` + card |
| Filters | IMS search; sem funil |
| Dialog | `Alert` nativo para rascunho; demais confirms por tela |
| Empty/Loading/Error | por feature (`OccurrenceError`, `profile-error`, etc.) |
| Tokens | só `colors` em 3 arquivos; spacing/radius/typography **não usados** |

---

## 6. Design Token Audit

### 6.1 O que existe em `@safestop/ui`

| Família | Tokens | Consumo real |
| --- | --- | --- |
| Color | background, surface, surfaceMuted, surfaceElevated, border, foreground, foregroundMuted, primary (+hover/active), destructive, success, warning, info, DISABLED_OPACITY | Mobile: 3 arquivos. Web TS: **zero**. Web CSS: espelho em `:root` |
| Spacing | 4…96 (escala 4) | Não importado nas apps |
| Radius | scale xs–xl + por componente (input/button/card/dialog/drawer/badge/chip) | Não importado nas apps; shadcn usa `--radius` CSS |
| Typography | pageTitle, sectionTitle, cardTitle, body, label, helper, caption, kpi | Não importado nas apps |
| States | default, hover, pressed, focused, disabled, loading, success | Contrato; sem mapeamento visual único |
| Elevation/shadow | **não existe** token | Mobile tab bar usa `shadowColor: "#000"` hardcoded |
| Status / criticality | **não existem** tokens de status de PP nem de criticidade | Cada tela mapeia cores ad hoc (`red-600`, `#FDE68A`, etc.) |
| Sizing (touch, control height) | **não existe** | Web shadcn tem h-9; Mobile alvos irregulares |
| Border width | só via `colors.border` | Tailwind `border` vs hex mobile |

### 6.2 Hardcoded

- **Web:** `text-gray-100`, `text-gray-400`, `bg-gray-900`, `text-orange-400`, hex de charts (`#F97316`, `#9CA3AF`, `#2E3440`, `#2A303B`) mesmo quando o token existe.
- **Mobile:** dezenas de hex em home, perfil, lista, erros (`#0F1115`, `#1F2937`, `#374151`, `#FB923C`, `#FCA5A5`, `#1E3A5F`…).
- **Divergência Web × Mobile:** Web já tem `--primary` semântico; Mobile mistura token `colors.primary` com gray Tailwind-like (`#374151`) que **não** está na paleta oficial (`surface` é `#171A21`).

### 6.3 Tokens que faltam

- Status de workflow (EM_AVALIACAO, VER_E_AGIR, INTERDICAO, EM_TRATATIVA, LIBERADA, ENCERRADA).
- Criticidade (baixa/média/alta/crítica).
- Elevation.
- Control height / touch target (44).
- Overlay/scrim de dialog.
- Banner semântico (info / warning / danger / offline).

### 6.4 Tokens que existem e quase não são consumidos

Spacing, radius, typography, `componentStates`, e no Mobile quase toda a paleta além de `primary`/`background` pontuais.

**Não propor componente React compartilhado Web+Mobile.** Tokens sim; primitivas **por app**.

---

## 7. Primitive/Component Audit — Web

Derivado do produto real (não de uma lista genérica).

| Primitiva | Status | Notas |
| --- | --- | --- |
| Button | **EXISTE MAS FRAGMENTADO** | shadcn + nativos |
| IconButton | **NÃO EXISTE** | ícones em `<button>` soltos (sidebar, evidência, filtros) |
| Card | **EXISTE MAS FRAGMENTADO** | shadcn + divs |
| Badge / StatusBadge | **PRECISA CONSOLIDAR** | Badge shadcn ≠ chips de status da lista |
| Input / Textarea / Select / Checkbox / RadioGroup | **EXISTE** shadcn; **FRAGMENTADO** no consumo | Nova PP ok; MDHO/IMS/ação não |
| SearchField | **NÃO EXISTE** | Input IMS sem ícone/funil |
| Tabs (page-level) | **NÃO EXISTE** | — |
| Dialog / AlertDialog / Sheet | **EXISTE** shadcn; **FRAGMENTADO** vs `<dialog>` | P1 |
| Dropdown / Popover / Tooltip | **EXISTE** | uso limitado |
| Table | **EXISTE** | relatórios |
| PageHeader | **NÃO EXISTE** | cada página reimplementa |
| EmptyState / ErrorState / Skeleton | **EXISTE MAS FRAGMENTADO** | N famílias `*-states` |
| KpiCard | **EXISTE** (feature-local) | não é primitiva de DS |
| Section / CollapsibleSection | **EXISTE** | detalhe |
| OfflineBanner | **EXISTE** | `offline-indicator` |
| FormField (label+control+error) | **NÃO EXISTE** | `FieldError` local na Nova PP |
| Sidebar | **EXISTE** | convergente em arquitetura |
| Toast | **EXISTE** | Sonner |

---

## 8. Primitive/Component Audit — Mobile

| Primitiva | Status | Notas |
| --- | --- | --- |
| Button / PrimaryButton | **NÃO EXISTE** como primitiva | Pressable por tela |
| IconButton | **NÃO EXISTE** | |
| Card / StopWorkCard | **EXISTE** feature-local | lista |
| Badge / StatusBadge | **FRAGMENTADO** | |
| TextField / TextArea / Select | **NÃO EXISTE** DS | TextInput cru |
| FAB / TabBar | **EXISTE** | `app-bottom-tab-bar` |
| SearchField | **NÃO EXISTE** | IMS `TextInput` |
| Empty / Error / Loading | **FRAGMENTADO** | por feature |
| PageHeader | **NÃO EXISTE** | |
| Confirm (rascunho) | **EXISTE** | Nova PP |
| Section | **FRAGMENTADO** | detalhe empilha seções |
| Toast / Banner | **FRAGMENTADO** | ciência/offline por tela |
| Icon set | **NÃO EXISTE** | emoji |

---

## 9. Structural UX Audit

Pergunta aplicada em cada superfície: *ignorando cores, a estrutura serve ao SafeStop que queremos construir?*

| Superfície | Hierarquia | Grid / largura | Densidade | Ação principal | Leitura rápida | Consistência |
| --- | --- | --- | --- | --- | --- | --- |
| Shell Web | Boa (sidebar + conteúdo) | Conteúdo **não** usa a largura do flex-1; páginas se autocentralizam | — | Nav + logout ok | — | 🟢 nav / 🟡 canvas |
| Dashboard | Fraca: título + filtros empilhados à direita; ~3 níveis de KPI sem agrupamento visual tipo “status vs tempo” | `max-w-6xl` + `gap-8` — sobra gutter em ultrawide; no laptop fica apertado | Alta (muitos KPIs — **manter dados**, reorganizar) | Nova PP só `hidden lg:inline-flex` | Status visível, mas ícones da referência ausentes | 🔴 vs Base44 |
| Lista Web | Título + 1 campo IMS; sem funil | `max-w-4xl` | Cards ok | Nova PP visível | Código/status no card | 🔴 busca/filtro |
| Nova PP Web | Clara, em cards | `max-w-2xl` coluna única — Área/Local **não** lado a lado | Média | Submit no fim | Ok | 🟡 |
| Detalhe Web | Código → badges → título → banners → cards → seções colapsáveis | `max-w-3xl` **estreito demais** para gestão | Seções longas, scroll vertical único | Decisão/MDHO/ação **dentro** do scroll, não pinadas | Status ok; decisão menos “escolha binária” que a referência | 🟡 |
| Notificações Web | Lista + filtros | Container de página | Ok | Ciência explícita | Badge não lida | 🟡 |
| Perfil Web | Formulário simples | Estreito | Baixa | Salvar / org | Ok | 🟡 |
| Relatórios | Hub + tabelas densas | Melhor uso de largura | Alta (adequado a gestão) | Exportar/filtrar | Depende do relatório | ⚫ |
| Início Mobile | Atalhos pendentes, não KPI | Largura total | Adequado a campo | FAB Paralisar | Pendências > panorama | 🟡 vs Base44 dashboard |
| Lista Mobile | Título + IMS | Full width | Ok | FAB | Sem filtro de status | 🔴 |
| Nova PP Mobile | Fluxo de campo | Full; teclado | Aceitável | Registrar | Sim | 🟡 |
| Detalhe Mobile | Seções empilhadas + participantes | Full | Alta (esperado) | Ações no fluxo | Status no topo | 🟡 |
| Bottom Nav | 4 destinos + FAB | Touch | Boa | Paralisar no centro | Sim | 🟢 |

---

## 10. Base44 Convergence Matrix

Referência visual: `reference/research/*.png`. Referência de composição: `reference/base44/src/pages/*.jsx`. Fluxo narrativo: `reference/Fluxo.md` / `Exemplo.md`.

**Legenda:** 🟢 próximo · 🟡 parcial · 🔴 distante · ⚫ sem equivalente confiável na referência.

Identidade dark vs conteúdo claro do Base44 **não** é classificada como regressão: é decisão de marca (`PO-UX-1`). A matriz avalia **estrutura/experiência**, não paleta.

Ver tabela obrigatória na **seção 23** (inclui Classification). Síntese:

- **🟢 (2):** Sidebar Web (arquitetura); Bottom Nav + FAB Mobile.
- **🟡 (11):** Login W/M; Nova PP W/M; Detalhe W/M; Notificações W/M; Perfil W/M; Início Mobile.
- **🔴 (3):** Dashboard Web; Lista Web; Lista Mobile.
- **⚫ (13):** Relatórios (4); Responsáveis; Aprovações MDHO W/M; Organizações W/M; Forbidden W/M; `/occurrences*` W/M.

Divergências explícitas referência × repo × decisions:

| Tema | Base44 / Fluxo.md | Repo atual | Tipo |
| --- | --- | --- | --- |
| Motivo + fotos na criação | Presentes; “< 60s” | Ausentes na criação; evidência no detalhe | Evolução de domínio + `PO-UX-3` (não copiar campo). **Regressão UX de velocidade percebida** (callout/layout), não de regra. Exige PO só se quiser reabrir campos. |
| Destinatários “5 responsáveis” | Narrativa do protótipo | Destinatários no backend; UI de ciência/notificação diferente | Evolução funcional legítima |
| Dashboard 7 KPIs + gráfico + recentes | Referência | Dashboard com mais indicadores, escopo, atenção de ações, Recharts | Evolução funcional **a preservar**; composição 🔴 |
| Mobile Início = Dashboard KPI | Screenshot | Início = pendências operacionais | Evolução UX de campo (provavelmente melhor); vs referência = 🟡 |
| Primary azul (várias shots) vs laranja | Inconsistência na própria referência | Laranja oficial | Referência obsoleta na cor; identidade atual vence |
| Forgot / Register / Reset | Páginas Base44 | **Não existem** no produto atual | ⚫ + gap de produto se o PO quiser self-service |
| Release.jsx | Página Base44 | Liberação é seção do detalhe | Evolução (não é tela isolada) — ⚫ como rota |
| Copy “Ocorrências” | Base44 | Mix PP / ocorrência (rotas internas, alguns subtítulos) | `PO-UX-4` ainda incompleto na UI |

---

## 11. Dashboard Findings

**Classificação: 🔴 UX/STRUCTURAL** (P1). Categoria extra: VISUAL CONSISTENCY (KPI sem ícone, filtros nativos).

O que está **certo** e deve permanecer:

- Mais KPIs do que o Base44 (níveis 1–3, escopo, atenção de ações). **Não cortar** indicadores.
- Recharts com tabela acessível (“Ver dados do gráfico”).
- Drill-down para lista com query de atenção.
- CTA Nova PP com RBAC.

O que diverge da experiência desejada (mesmo sem cor):

1. Composição: referência = 2 faixas de KPI com ícone + gráfico + “Ocorrências recentes”. Atual = header com filtros empilhados + várias grades de KPI + charts + listas de atenção. Falta agrupamento rotulado (“Status”, “Tempos”, “Atenção”).
2. Largura: `max-w-6xl` centralizado dentro de um shell já com sidebar — no desktop largo o canvas “morre” no meio; não é painel de gestão full-width.
3. Filtros de período/escopo ainda são `<button>` nativos, visualmente desconectados do `Button` shadcn do CTA.
4. CTA Nova PP oculto abaixo de `lg` — tablet/drawer perde a ação primária no header (a sidebar ainda tem o item).
5. KPI cards clicáveis sem aparência de controle (risco a11y — ver §20).
6. Base44 mobile dashboard **não** deve ser copiado para o Início atual sem decisão PO (truncamento de labels já visível na própria referência).

---

## 12. Core Operational Flow Findings

Fluxo oficial (produto): criar PP → comunicar → avaliar (Ver e Agir **ou** Interdição) → MDHO (se interdição) → aprovação HSE → IMS manual → plano de ação → evidências de correção → liberar → encerrar. Timeline audita.

### Criar (Nova PP)

- Web 🟡: cards “Onde e quem” / criticidade em RadioGroup — melhor que o HTML cru anterior. Ainda: coluna única, sem banner de velocidade, sem 2 colunas Área|Local, `max-w-2xl`.
- Mobile 🟡: fluxo de campo existe; confirma rascunho ao sair pelas tabs. **Web não tem equivalente** (`beforeunload` / guarda de sidebar) — P0 de perda de dados.
- Fotos/motivo na criação: **não** implementar (PO-UX-3). Gap de percepção UX, não de domínio.

### Listar

- 🔴 Web e Mobile: busca “por área, empresa, atividade” da referência **não existe**. Só código IMS. Sem funil de status/criticidade/área.
- Cards da lista Web não repetem a hierarquia da referência (badges + título + ícones de local/empresa/relógio + autor + chevron).

### Detalhar e decidir

- Web 🟡: informação completa de domínio (mais rica que Base44). Estrutura de **escolha da liderança** não replica os dois cards grandes “Ver e Agir” vs “Interdição Oficial”.
- `max-w-3xl` impede layout de gestão (timeline + contexto lado a lado em desktop).
- Participantes: **só Mobile** — assimetria de produto visível (FUNCTIONAL + UX).
- Ciência no detalhe Web: banner — correto (não é toast).

### MDHO / aprovação / IMS / plano / evidência

- ⚫ vs Base44 como páginas; no `Fluxo.md` existem como **etapas**. No repo são seções densas com UI artesanal (botões nativos, `<dialog>`).
- Risco: ações destrutivas/críticas com primitiva diferente da do restante do app.

---

## 13. Secondary Flow Findings

| Fluxo | Achado | Cat. | Pri. |
| --- | --- | --- | --- |
| Relatórios | Melhor candidato a “Web corporativo”: tabelas, filtros em dialog shadcn, export. Visual ainda misto com `text-gray-*`. Sem referência Base44. | VISUAL + UX | P2 |
| Responsáveis | Tabela + dialog nativo; parece admin legado ao lado do restante shadcn. | VISUAL + UX | P2 |
| Fila MDHO | Existe W/M; fora das tabs no Mobile (correto). Lista operacional sem o mesmo card da lista de PP. | UX | P2 |
| Organizações | Tela de troca; cards nativos. Necessária ao multi-org. | VISUAL | P3 |
| Timeline/comentários | Funcional e auditável; dialogs nativos; composer próprio. | VISUAL | P2 |
| Evidências | Preview/delete em `<dialog>`; galeria com botões nativos. | VISUAL + a11y | P1 |
| Offline Web | `OfflineIndicator` no shell — bom. | — | — |
| `/occurrences*` | Redirects vivos. Copy/bookmarks. | PRODUCT | P2 (PO-UX-5) |
| Forgot/Register/Reset | Só na referência. | PRODUCT GAP | PO |

---

## 14. Admin/RBAC Findings

- Nav já **oculta** itens por permissão (`get-nav-items.ts`): MDHO, contatos, relatórios, criar PP.
- Gates de org e authorization no layout.
- `/forbidden` existe W/M.
- **FUNCTIONAL/PRODUCT GAP:** não há superfície de Platform Admin para convidar/ativar/desativar usuários, papéis, memberships — apesar de `user.manage` / `organization.manage` em `docs/decisions/RBAC-MATRIX-APPROVED.md`.
- Contatos de organização ≠ gestão de usuários do Auth.
- Relatórios e fila MDHO são “admin operacional”, não admin de plataforma.

Não tratar ausência de tela de usuários como problema só visual.

---

## 15. Profile Findings

- Web e Mobile: 🟡. Dados reais, edição, atalho de org, logout (Mobile no perfil; Web na sidebar — `PO-UX-6` atendido).
- Visual: Web caminha para shadcn; Mobile ainda hex (`#374151` vs token `surface`).
- Base44 perfil é card claro simples; atual é mais rico (org, permissões implícitas). Não remover capacidade.
- Copy e hierarquia “quem sou / em qual org / sair” estão compreensíveis.

---

## 16. Notifications Findings

- Fonte oficial = registro no banco; push é canal — **respeitado**.
- Ciência ≠ leitura — **respeitado** (banner + AlertDialog; `isPending` no hardening 3.4).
- Web: sininho na sidebar + página + popover. Base44 era lista simples. Extra é evolução.
- Filtros ainda com botões nativos (`notification-filters.tsx`).
- Mobile: aba dedicada; badge na tab.
- Toasts Sonner **não** substituem ciência — manter essa fronteira.

---

## 17. Form UX Findings

| Form | Padrão | Problema |
| --- | --- | --- |
| Nova PP Web | RHF + Zod + `zodResolver` + shadcn | Melhor form do produto; layout 1 col; sem `FormField` reutilizável |
| Nova PP Mobile | RHF local + StyleSheet | Tokens só em cor; labels/erros inconsistentes com Web |
| MDHO | Form próprio + `<select>`/`<button>` | Não reutiliza Select/Button; validação visual diferente |
| IMS | Dialog nativo | Idem |
| Plano de ação (criar item / submit / validar / concluir) | Vários dialogs nativos | 4+ modais com chrome diferente |
| Contatos | Dialog nativo | Idem |
| Comentários | Composer + edit + delete nativos | Idem |
| Relatórios (filtros) | Dialog shadcn | Mais próximo do alvo |
| Login | Campos + Button shadcn | Sem “esqueci senha” |

Guarda de rascunho: **só Mobile Nova PP**. Web: sair pela sidebar descarta o formulário sem confirmação.

---

## 18. State UX Findings

| Estado | Diagnóstico |
| --- | --- |
| Loading | Spinners/skeletons por feature; Skeleton shadcn pouco usado fora de ui/ |
| Empty | Copy irregular; alguns bons (`StopWorkEmpty`, dashboard empty profile); lista sem “0 registros” no estilo Base44 |
| Success | Pouco padrão (redirect pós-create; toast pontual) |
| Error | `OccurrenceError` / `StopWorkError` / `*-states`; retry nem sempre presente |
| Disabled | Token `DISABLED_OPACITY` quase não aplicado; shadcn usa opacity própria |
| Pending (mutação) | Ciência `isPending` ok; MDHO/ação misturam disabled nativo |
| Permission denied | `/forbidden` + `Can` + gates; empty de permissão em alguns widgets |
| Destructive | Confirm nativo **ou** AlertDialog — inconsistente |
| Confirmation | Idem |
| Offline | Web banner; Mobile: avisos pontuais (ex. Ver e Agir `OfflineNotice`) |
| Retry | Dashboard KPIs sim; outras telas não |
| Validation | Nova PP com `FieldError`; outros forms: mensagem solta |
| Unsaved | Mobile Nova PP sim; Web não; detalhe/MDHO não |

Uma lista vazia **não** pode parecer bug. Hoje o empty da lista é aceitável, mas o empty do dashboard (sem perfil de KPI) e o empty de filtros IMS (“nenhum código”) têm vozes diferentes.

---

## 19. Responsive Findings

**Web ≠ Mobile Expo.** Avaliação só do Next.

| Largura | Achado |
| --- | --- |
| `<768` | Sidebar vira drawer; conteúdo full; Dashboard CTA Nova PP some (`hidden lg:inline-flex`); filtros de escopo empilham; risco de overflow em tabelas de relatório |
| `768–1023` | Sidebar `w-16` + tooltips; canvas ainda limitado por `max-w-*` das páginas |
| `≥1024` | Sidebar `w-64`; páginas **não** expandem — `max-w-2xl/3xl/4xl/6xl` criam “faixa” central e laterais vazias. Relatórios usam melhor a largura |
| Charts | `ResponsiveContainer` — adequado |
| Dialogs nativos | Sem garantia de `max-h` / scroll em viewport baixa |
| Tables | Relatórios: risco de scroll horizontal; sem padrão de card-stack em mobile web |

Não foi feita medição em browser nesta auditoria (modo somente leitura / sem sessão). Os `max-w-*` estão no código e são evidência suficiente de subuso do desktop.

---

## 20. Accessibility Findings

Somente diagnóstico.

| Tema | Achado |
| --- | --- |
| Labels | Nova PP Web: `htmlFor` + ids. MDHO/IMS/comentários: irregular |
| aria | Charts têm tabela alternativa (bom). KPI clicável: verificar se é `button` com nome acessível (hoje mistura card/`button`) |
| Focus | Radix Dialog/AlertDialog/Sheet tratam focus trap. `<dialog>` nativo **não** padroniza restore/focus |
| Keyboard | Sidebar itens são `Link`/`button` — ok. Filtros nativos: tab order ok, mas sem `aria-pressed` consistente |
| Contraste | Tema dark + laranja tende a passar; `text-gray-400` em `#0F1115` precisa QA de contraste. Criticidade amarela em dark é frágil |
| Semantic HTML | Muitos `div` clicáveis vs `button`/`nav` (breadcrumb é `nav` no detalhe — bom) |
| Disabled | Falta padrão de `aria-disabled` vs `disabled` |
| Error association | `FieldError` na Nova PP não está claramente `aria-describedby` em todos os campos |
| Modal focus | Gap nos `<dialog>` nativos |
| Touch Mobile | FAB central ok; alguns links de texto no home podem ficar < 44px |
| Icon-only | Sidebar colapsada depende de Tooltip — ok em pointer; teclado precisa do tooltip no focus (verificar) |

---

## 21. Functional/Product Gaps

Não são “só UI”:

1. **Platform Admin — gestão de usuários/acessos:** capacidade RBAC sem tela.
2. **Busca textual e filtros de lista** (área, empresa, atividade, status, criticidade): UI da referência **e** necessidade operacional; provavelmente exige contrato de query/backend. Não é só componente.
3. **Participantes no detalhe Web:** dados/feature no Mobile; ausente no Web.
4. **Forgot / Register / Reset password:** páginas na referência; fluxo atual é login direto.
5. **Guarda de rascunho Web** na Nova PP.
6. **Self-service de membership** além do seletor de org.
7. Rotas `/occurrences*` ainda necessárias como redirect até análise `PO-UX-5`.
8. Campos Motivo/Fotos na **criação**: só reabrir com PO (`PO-UX-3`).

Itens 1–3 e 5 são os que mais “parecem UI” mas quebram paridade de produto.

---

## 22. Library Decision Matrix

Reavaliação **com o estado atual do lockfile**. Não instalar nada nesta etapa.

| Biblioteca | Problema que resolve | Onde | Benefício | Custo | Risco | Impacto | Recomendação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lucide | Ícones inconsistentes (emoji mobile, mix web) | Sidebar já; resto Web + futuro Mobile se o PO aceitar vetor nativo | Consistência, a11y de ícone | Baixo no Web (já está); Mobile = lib nativa extra | Visual “genérico” se não tematizar | Médio | **ADOPT NOW** no Web (consolidar). Mobile: **ADOPT LATER** (não bloquear foundation de tokens) |
| Recharts | Gráficos artesanais | Dashboard (já) | Qualidade, responsive, a11y table já feita | Já pago | Não usar em KPI simples | Baixo | **ADOPT NOW** — restringir a visualizações reais |
| `@hookform/resolvers` | Ponte Zod↔RHF | Nova PP já; MDHO/ação/contatos ainda não | Validação alinhada ao domínio | Baixo | Super-aplicar em forms de 1 campo | Médio | **ADOPT NOW** — estender aos forms longos |
| shadcn/ui | Chrome inconsistente | Primitivas já geradas; consumo ~30% das superfícies | Consistência, a11y Radix, manutenção | Migração de dezenas de `<button>`/`<dialog>` | Copiar tema light new-york (já evitado via CSS) | Alto se feito num Sprint só | **ADOPT NOW** — consolidar; **não** gerar primitivas extras sem uso |
| Radix | Focus trap, dialog, select | Via shadcn | A11y | Acoplado ao shadcn | Bundle | Alto nos modais restantes | **ADOPT NOW** — substituir `<dialog>` nativo |
| Sonner | Feedback transiente | Já | Padrão único de toast | Já pago | Confundir com ciência | Baixo | **ADOPT NOW** — regra: nunca ciência/sucesso de workflow crítico |
| TanStack Table | Relatórios densos | Já nas 3 páginas | Sort/filter/pagination reais | Já pago | Não usar na lista operacional de PP (cards são melhores) | Médio | **ADOPT NOW** em relatórios; **NOT NEEDED** na lista de campo |
| NativeWind | Unificar Tailwind no RN | Todo Mobile | Ilusão de DS único | Alta (metro, classes, divergência RN) | Quebra de campo, débito, conflita com decisão KEEP StyleSheet | Alto | **DO NOT ADOPT** nesta convergência |

Nenhuma biblioteca nova além das já adotadas é **ADOPT NOW**.

---

## 23. Prioritized Issues

### Matriz obrigatória

| Surface | Platform | Route | Classification | Category | Priority | Effort | Main Issue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sidebar / shell | Web | `(app)/layout` | 🟢 | UX/STRUCTURAL | P2 | LOW | Arquitetura ok; canvas filho ainda se autocentraliza |
| Bottom Nav + FAB | Mobile | `(tabs)` | 🟢 | UX/STRUCTURAL | P2 | LOW | Ícones emoji; tokens parciais |
| Login | Web | `/login` | 🟡 | VISUAL CONSISTENCY | P3 | LOW | Sem forgot; ok funcional |
| Login | Mobile | `/(auth)/login` | 🟡 | VISUAL CONSISTENCY | P3 | LOW | StyleSheet hex |
| Dashboard | Web | `/` | 🔴 | UX/STRUCTURAL | P1 | HIGH | Hierarquia/KPI/filtros/largura ≠ referência; preservar indicadores |
| Início | Mobile | `/(tabs)` | 🟡 | UX/STRUCTURAL | P1 | MEDIUM | Pendências vs dashboard KPI da referência; atalhos hex |
| Lista PP | Web | `/stop-work` | 🔴 | UX/STRUCTURAL + PRODUCT | P1 | HIGH | Sem busca textual/funil; card ≠ referência |
| Lista PP | Mobile | `/(tabs)/stop-work` | 🔴 | UX/STRUCTURAL + PRODUCT | P1 | HIGH | Mesmo gap de busca/filtro |
| Nova PP | Web | `/stop-work/new` | 🟡 | UX/STRUCTURAL | P0 | MEDIUM | Sem guarda de rascunho; layout 1 col / `max-w-2xl` |
| Nova PP | Mobile | `/(tabs)/stop-work/new` | 🟡 | UX/STRUCTURAL | P2 | MEDIUM | Tokens parciais; fluxo de campo ok |
| Detalhe PP | Web | `/stop-work/[id]` | 🟡 | UX/STRUCTURAL | P1 | HIGH | `max-w-3xl`; decisão liderança; seções nativas; sem participantes |
| Detalhe PP | Mobile | `/(tabs)/stop-work/[id]` | 🟡 | UX/STRUCTURAL | P2 | MEDIUM | Densidade de campo ok; visual fragmentado |
| Notificações | Web | `/notifications` | 🟡 | VISUAL CONSISTENCY | P2 | MEDIUM | Filtros nativos; modelo de ciência correto |
| Notificações | Mobile | `/(tabs)/notifications` | 🟡 | VISUAL CONSISTENCY | P2 | MEDIUM | StyleSheet; paridade de ciência |
| Perfil | Web | `/profile` | 🟡 | VISUAL CONSISTENCY | P3 | LOW | Quase ok |
| Perfil | Mobile | `/(tabs)/profile` | 🟡 | VISUAL CONSISTENCY | P2 | LOW | Hex residual apesar de `colors` |
| Relatórios hub | Web | `/reports` | ⚫ | VISUAL CONSISTENCY | P2 | MEDIUM | Sem referência; hub genérico |
| Relatório ocorrências | Web | `/reports/occurrences` | ⚫ | VISUAL CONSISTENCY | P2 | LOW | Table ok; chrome misto |
| Relatório ações | Web | `/reports/action-items` | ⚫ | VISUAL CONSISTENCY | P2 | LOW | Idem |
| Relatório ciência | Web | `/reports/awareness` | ⚫ | VISUAL CONSISTENCY | P2 | LOW | Idem |
| Responsáveis | Web | `/organization-contacts` | ⚫ | VISUAL + UX | P2 | MEDIUM | Dialog/tabela nativos |
| Aprovações MDHO | Web | `/approvals/mdho` | ⚫ | UX/STRUCTURAL | P2 | MEDIUM | Lista operacional sem DS |
| Aprovações MDHO | Mobile | `/(app)/approvals/mdho` | ⚫ | UX/STRUCTURAL | P2 | MEDIUM | Fora das tabs (ok); visual cru |
| Organizações | Web | `/organizations` | ⚫ | VISUAL CONSISTENCY | P3 | LOW | Cards nativos |
| Organizações | Mobile | `/(app)/organizations` | ⚫ | VISUAL CONSISTENCY | P3 | LOW | Idem |
| Forbidden | Web | `/forbidden` | ⚫ | STATE UX | P3 | LOW | Padrão de empty/forbidden não unificado |
| Forbidden | Mobile | `/(app)/forbidden` | ⚫ | STATE UX | P3 | LOW | Idem |
| Redirects legado | Web | `/occurrences*` | ⚫ | PRODUCT | P2 | LOW | Manter até análise PO-UX-5 |
| Redirects legado | Mobile | `/(app)/occurrences*` | ⚫ | PRODUCT | P2 | LOW | Idem |
| MDHO / plano / evidência / IMS (seções) | Web | detalhe | ⚫ | VISUAL + a11y | P1 | HIGH | `<dialog>` e `<button>` nativos em fluxo crítico |
| Participantes | Web | — | ⚫ | FUNCTIONAL/PRODUCT GAP | P1 | MEDIUM | Existe só no Mobile |
| Platform Admin usuários | Web | — | ⚫ | FUNCTIONAL/PRODUCT GAP | P1 | HIGH | RBAC sem UI |

### Contagem da matriz (linhas de superfície)

- 🟢 **2**
- 🟡 **11**
- 🔴 **3**
- ⚫ **16** (inclui seções/gaps sem rota)

### Issues priorizadas (lista de trabalho)

**P0 (2)**

1. Web Nova PP — saída pela Sidebar/rota sem confirmação de rascunho (perda de registro de campo). Effort: MEDIUM. A+B.
2. Confirmações destrutivas/críticas em `<dialog>` nativo (evidência, comentário, plano, IMS) sem o contrato a11y do Radix. Effort: MEDIUM. A+C (risco operacional).

**P1 (14)**

3. Dashboard — composição, agrupamento, largura, filtros nativos. HIGH. B  
4. Lista Web — busca/funil. HIGH. B+C  
5. Lista Mobile — idem. HIGH. B+C  
6. Detalhe Web — `max-w-3xl` + hierarquia da decisão. HIGH. B  
7. Dual system Button/Card/Input. HIGH. A  
8. Migrar forms MDHO/ação/IMS/contatos para primitivas + RHF onde couber. HIGH. A+B  
9. Tokens não consumidos; hex Mobile; `gray-*` Web. MEDIUM. A  
10. StatusBadge único (workflow + criticidade). MEDIUM. A  
11. PageHeader + EmptyState consolidados. MEDIUM. A+B  
12. Participantes no detalhe Web. MEDIUM. C  
13. Platform Admin usuários (produto). HIGH. C  
14. KPI clicável / a11y dashboard. MEDIUM. A+L  
15. Início Mobile — decisão estrutural (pendências vs KPIs). MEDIUM. B  
16. Copy “Ocorrência” vs “Paralisação Preventiva” (`PO-UX-4`). LOW. A  

**P2 (12)** — notificações filtros; relatórios chrome; fila MDHO visual; tab bar ícones; perfil mobile hex; timeline dialogs; offline mobile unificado; `/occurrences*` análise; reports hub; responsáveis; empty/error voz única; CTA dashboard hidden lg.

**P3 (8)** — login polish; forbidden unificado; org cards; tooltip/focus nit; chart hex → CSS vars; radius token no RN; shadow token; microcopy banner 60s (sem novo campo).

**Totais de issues:** P0 **2** · P1 **14** · P2 **12** · P3 **8** (36). Esforço: 2 HIGH de P0/P1 estrutural (dashboard + listas + detalhe + migração de dialogs) concentram o valor.

---

## 24. Proposed Convergence Plan

Não é uma Sprint única. **Não implementar agora.** Divisão derivada do estado real (nav já feita; stack já instalada; primitives fragmentadas).

### Bloco 0 — FOUNDATION (Web primitives + tokens)

- **Objetivo:** um chrome só. Button, Input, Textarea, Select, Dialog, AlertDialog, Badge/StatusBadge, PageHeader, EmptyState, FormField. Tokens CSS = única fonte Web; eliminar `gray-*`/`orange-*` soltos nas superfícies tocadas.
- **Superfícies:** `components/ui` + 3–4 telas-piloto (login, lista header, Nova PP já quase lá, forbidden).
- **Dependências:** nenhuma lib nova. Decisão PO sobre amplitude da migração de `<dialog>` (todo fluxo crítico neste bloco vs no bloco 2).
- **Riscos:** PR gigante se atacar MDHO+ação juntos; mitigar por família (dialogs primeiro).
- **Done:** grep de `<dialog` = 0 nos fluxos P0; `Button` shadcn é o default documentado; tokens de status definidos (mesmo que só CSS).

### Bloco 1 — WEB SHELL + DASHBOARD

- **Objetivo:** o canvas usa a largura do shell; Dashboard com hierarquia (grupos de KPI + charts + recentes/atenção) **sem remover indicadores**.
- **Superfícies:** layout, `dashboard-page`, filtros, KPI, charts.
- **Dependências:** Bloco 0 (Button/filtros).
- **Riscos:** compactar demais e parecer que “sumiu KPI”.
- **Done:** agrupamento rotulado; filtros no mesmo DS; CTA visível em tablet; a11y dos cards clicáveis.

### Bloco 2 — WEB CORE OPERATIONAL FLOW

- **Objetivo:** lista + Nova PP + detalhe como um produto só.
- **Superfícies:** `/stop-work`, `/new`, `/[id]`, decisão liderança, banners, guarda de rascunho Web.
- **Dependências:** Bloco 0; **PO/backend** para busca/filtro da lista (se não houver API, a UI não pode fingir).
- **Riscos:** desenhar filtros sem query; inflar Nova PP com campos Base44.
- **Done:** lista com busca/filtro acordados **ou** decisão PO de adiar backend com empty honesto; detalhe com largura de gestão; decisão liderança com hierarquia clara; rascunho Web protegido; participantes Web (ou decisão explícita de não ter).

### Bloco 3 — WEB SECONDARY FLOWS

- **Objetivo:** MDHO seção, evidência, IMS, plano, timeline, fila `/approvals/mdho`, contatos — mesmo chrome.
- **Dependências:** Bloco 0–2 (detalhe já no grid novo).
- **Riscos:** mexer em workflow. UI only; sem mudar transições.
- **Done:** zero `<dialog>` nativo nesses módulos; forms longos com RHF+resolver quando já houver schema.

### Bloco 4 — WEB ADMIN / RBAC / REPORTS

- **Objetivo:** relatórios no DS; **se PO autorizar**, primeira fatia de Platform Admin (escopo a definir).
- **Dependências:** decisão PO do gap de usuários. Relatórios já têm TanStack — só visual.
- **Riscos:** inventar CRUD de users sem spec de segurança.
- **Done:** reports visuais alinhados; admin só com spec.

### Bloco 5 — MOBILE FOUNDATION

- **Objetivo:** consumir `colors`/`spacing`/`radius`/`typography` nas telas-piloto; primitiva Button/Card/TextField **locais**; ícones: decisão PO (emoji → vetor depois).
- **Superfícies:** tab bar, lista, Nova PP, perfil.
- **Dependências:** não NativeWind.
- **Riscos:** refator estética sem ganho de campo.
- **Done:** hex residual só em casos justificados; touch 44.

### Bloco 6 — MOBILE CORE OPERATIONAL FLOW

- **Objetivo:** lista (filtros se API), detalhe hierarquia, Início conforme decisão PO, paridade de ciência.
- **Dependências:** mesma API de filtros do Bloco 2; PO sobre Início.
- **Done:** encontrar PP em campo sem saber o código IMS (se API existir); detalhe escaneável com uma mão.

### Bloco 7 — MOBILE SECONDARY FLOWS

- **Objetivo:** MDHO fila, evidência, plano, orgs, forbidden — mesmo kit do bloco 5.
- **Done:** visual unificado; sem mudança de regra.

### Bloco 8 — VISUAL QA

- **Objetivo:** contraste, teclado, focus trap, empty/error, regressão RBAC, Web 375/768/1280/1536, Mobile one-hand.
- **Done:** checklist QA assinado; sem P0 aberto.

**Sequência recomendada:** 0 → 1 → 2 (paralelo 5 assim que 0 definir tokens de status) → 3 → 6 → 7 → 4 (admin só após PO) → 8.

---

## 25. Risks

- Tratar esta auditoria como “instalar mais lib” — as libs **já estão lá**.
- Uma Sprint “convergir tudo”.
- Remover KPIs, MDHO, relatórios, ciência, plano ou multi-org porque não estão no Base44.
- Copiar tema light / primary azul dos screenshots.
- Fingir busca full-text só no cliente.
- Compartilhar componentes React Web+Mobile.
- NativeWind “para unificar”.
- Confundir toast com ciência.
- Reabrir `PO-UX-3` via UI (fotos na criação).
- Admin de usuários sem SECURITY spec.

---

## 26. Open PO Decisions

Já fechado (não reabrir): Sidebar, Bottom Nav, campos da Nova PP, copy PP, redirects, logout, tokens-only em `@safestop/ui`.

**Abertas para o PO:**

1. **Amplitude da migração shadcn** neste ciclo: só P0 dialogs + core flow, ou 100% dos `<button>` nativos?
2. **Largura do canvas Web:** páginas operacionais full-width do shell vs container estreito só na Nova PP?
3. **Lista:** autorizar trabalho de **backend** para busca/filtros (área, empresa, atividade, status) ou adiar e manter IMS-only com empty honesto?
4. **Início Mobile:** manter pendências operacionais (recomendação de campo) ou aproximar do dashboard KPI da referência?
5. **Participantes no Web:** paridade com Mobile nesta convergência?
6. **Platform Admin de usuários:** entra no plano (Bloco 4) ou fica como gap explícito fora desta convergência UX?
7. **Auth self-service** (forgot/register/reset): fora de escopo?
8. **Ícones Mobile:** permanecer emoji até um ADOPT LATER de Lucide-react-native, ou puxar vetor no Bloco 5?
9. **Remoção `/occurrences*`:** autorizar análise+remoção neste programa de convergência (`PO-UX-5`)?
10. **Banner “< 60 segundos”** na Nova PP: só copy/layout (sem novos campos)?

---

## 27. Recommended Next Handoff

**Não abrir MASTER até o PO revisar este documento.**

Handoff sugerido **depois** da revisão:

- Destinatário: **MASTER**
- Entrada: este arquivo + `UX-CONVERGENCE-DECISIONS.md` + `UX-CONVERGENCE-UI-SPEC.md` + decisões PO da §26
- Saída esperada: plano executivo **por bloco** (0→8), prompts WEB / MOBILE / UIUX / QA, **sem** nova lib, **sem** NativeWind, **sem** alterar workflow/RBAC/IMS
- Primeiro bloco de implementação: **FOUNDATION Web** (dialogs Radix + Button único + guarda de rascunho Nova PP) **ou**, se o PO priorizar operação visível, Bloco 1 Dashboard em paralelo a um subset do Bloco 0
- SECURITY só entra se o PO autorizar Platform Admin (item 6)

---

## Reference Material Reviewed

Pasta `/reference` inspecionada de forma recursiva. Nenhum arquivo dela foi alterado.

### Markdown e texto

| Item | Finalidade | Superfícies comparadas |
| --- | --- | --- |
| `reference/Exemplo.md` | Narrativa PP-0003 (campos, MDHO, IMS, próximos passos) | Nova PP, detalhe, MDHO, IMS, plano |
| `reference/Fluxo.md` | Fluxo de 7 etapas + “< 60s” + 5 destinatários | Fluxo operacional completo vs seções atuais |
| `reference/base44/README.md` | Contexto do export Base44 | — |
| `reference/base44/CLAUDE.md` | Notas do export | — |
| `reference/base44/AGENTS.md` | Notas do export | — |

### Páginas Base44 (`reference/base44/src/pages/`)

| Arquivo | Uso na auditoria |
| --- | --- |
| `Dashboard.jsx` | Composição KPI / chart / recentes |
| `InterdictionList.jsx` | Busca, funil, cards |
| `NewInterdiction.jsx` | Form 2 col, criticidade, fotos, motivo |
| `InterdictionDatail.jsx` (nome original) | Header PP, metadados com ícone, decisão binária, timeline |
| `Notifications.jsx` | Lista simples de alertas |
| `Profile.jsx` | Perfil mínimo |
| `Login.jsx` | Auth |
| `Register.jsx` / `ForgotPassword.jsx` / `RestPassword.jsx` | Gaps de auth (não existem no repo) |
| `Release.jsx` | Liberação como página isolada vs seção atual |

Componentes `.jsx` do Base44 referenciados pelas páginas **não foram todos reabertos linha a linha** quando o screenshot + a página já evidenciavam a composição. Limitação: o export Base44 está incompleto (imports de componentes que não estão todos no tree); a verdade visual veio sobretudo de `reference/research/`.

### Screenshots (`reference/research/` — 23 PNG)

| Pasta / arquivo | Comparado com |
| --- | --- |
| `Inicio/tela inicial web.png` | `/` Dashboard Web |
| `Inicio/tela inicial mobile.png` + `mobile2.png` | `/(tabs)` Início + Bottom Nav (referência = dashboard KPI) |
| `new/nova paralizacao web.png` + `2 web.png` | `/stop-work/new` |
| `new/nova paralizacao mobile.png` + `2` + `3` | Mobile Nova PP |
| `interdictions/interdicoes web.png` + `mobile.png` | Listas `/stop-work` |
| `interdiction-id/interdicao ID web.png` + `web2.png` | Detalhe Web |
| `interdiction-id/interdicao ID mobile.png` + `mobile2.png` | Detalhe Mobile |
| `notifications/notificacao web.png` + `mobile.png` | Centrais de notificação |
| `profile/perfil web.png` + `perfil mobile.png` + `perfil 2 mobile.png` | Perfil |
| `forgot-password/tela de login web.png` + `mobile.png` | Login atual (referência mistura login/forgot) |
| `reset-password/reset password web.png` + `mobile.png` | Gap: rotas inexistentes |

### Cruzamento das três fontes

| Fonte | Papel |
| --- | --- |
| `/reference` + Base44 | Intenção UX/estrutura |
| `apps/web` + `apps/mobile` + `packages/ui` | Implementação e verdade funcional |
| `docs/decisions/UX-CONVERGENCE-*` + RBAC + workflow | Decisões já tomadas; identidade dark; não copiar campos |

Onde divergem, o tipo está na §10 (evolução vs regressão UX vs incompleto vs referência obsoleta vs PO).

### Limitações desta auditoria

- Sem sessão autenticada / sem browser E2E — responsivo inferido do CSS (`max-w-*`, breakpoints da sidebar).
- Sem abrir o app Mobile em device — touch targets inferidos do StyleSheet.
- Imagens lidas via inspeção visual assistida; 23/23 arquivos da pasta research foram enumerados; comparação estrutural aprofundada nas telas núcleo (Dashboard, Lista, Nova PP, Detalhe, Nav).
- `reference/base44` contém páginas JSX de protótipo, não o SafeStop atual.

---

## Critério de sucesso (PO)

1. Web: **18** rotas de página (15 ativas + 3 redirects) + superfícies aninhadas documentadas na §3.  
2. Mobile: **14** telas em `app/` + **5** layouts (tabs/stack/gates).  
3. Mais distantes: **Dashboard Web**, **Listas W/M**.  
4. O problema é **misto**: A (primitives/tokens), B (composição), C (admin, busca, participantes, rascunho Web).  
5. Primitivas fragmentadas: Button, Dialog, Card, Badge, Empty/Error, forms.  
6. ADOPT NOW: as libs **já no Web** — consolidar; NativeWind = DO NOT ADOPT.  
7. Primeiro: Foundation (dialogs + rascunho Web) e/ou Dashboard, conforme PO.  
8. Plano em 9 blocos (§24), não uma Sprint.  
9. Decisões PO: §26.  
10. Handoff: MASTER **após** revisão PO — §27.

---

*Fim da auditoria. Nenhuma implementação associada.*
