# Plano Executivo de Implementação — Convergência UX/UI

**Status:** PLANO EXECUTIVO — sem implementação de código nesta etapa  
**Data:** 2026-08-25  
**Agente:** MASTER  
**Modo:** AUDITAR + PLANEJAR. Nenhum código de produção, banco, dependência, migration ou teste foi alterado.  
**Única alteração permitida nesta etapa:** este arquivo.

**Documento de entrada obrigatório:** [`docs/decisions/UX-UI-GLOBAL-AUDIT.md`](../decisions/UX-UI-GLOBAL-AUDIT.md)

**Fontes obrigatórias cruzadas:**

- [`docs/decisions/UX-CONVERGENCE-DECISIONS.md`](../decisions/UX-CONVERGENCE-DECISIONS.md) — PO-UX-1 … PO-UX-7
- [`docs/decisions/UX-CONVERGENCE-UI-SPEC.md`](../decisions/UX-CONVERGENCE-UI-SPEC.md) — spec v3 (histórico; onde conflitar com PO-UX-8…17, vence a decisão PO mais recente)
- [`docs/decisions/UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md`](../decisions/UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md) — o que a Sprint 3.4 já entregou
- [`docs/decisions/RBAC-MATRIX-APPROVED.md`](../decisions/RBAC-MATRIX-APPROVED.md)
- `docs/product.md`, `docs/workflow.md`, `docs/database.md`, `docs/architecture.md`, `docs/engineering.md`, `docs/notifications.md`, `docs/roadmap.md`
- Pasta `/reference` (research, Base44 páginas JSX, `Exemplo.md`, `Fluxo.md`)
- Código real em `apps/web`, `apps/mobile`, `packages/ui`, `packages/types`, `supabase`

**Fórmula oficial (não reabrir):**

    BASE44              = referência de UX / estrutura
    REPOSITÓRIO ATUAL   = fonte da verdade funcional
    IDENTIDADE SAFESTOP = dark industrial + #F97316

**READY FOR IMPLEMENTATION:** YES

---

## 1. Executive Summary

A Sprint 3.4 encerrou a **arquitetura de navegação** (Sidebar Web, Bottom Nav + FAB Mobile) e a **adoção seletiva** de shadcn/Radix/Lucide/Recharts/Sonner/TanStack Table/@hookform/resolvers. O programa deste plano **não** instala stack nova e **não** refaz o produto.

O trabalho restante é **convergência incompleta**:

1. Chrome Web fragmentado (shadcn + HTML nativo em fluxos críticos).
2. Canvas Web autocentralizado (`max-w-2xl/3xl/4xl/6xl`) em superfícies gerenciais.
3. Lista operacional ainda descobre PP só por código IMS — Base44 busca por área/empresa/atividade; o PO autorizou backend real (PO-UX-10).
4. Detalhe Web subutiliza o desktop e não tem paridade de **participantes** com o Mobile.
5. Mobile consome tokens só em 3 arquivos; primitivas e ícones ainda são ad hoc.
6. Início Mobile permanece operacional (pendências) — **não** copiar o Dashboard Web/Base44 (PO-UX-11).

**Não fazer neste programa:** Platform Admin (PO-UX-13), Register/Forgot/Reset (PO-UX-14), remoção de `/occurrences*` (PO-UX-16), NativeWind, componentes React compartilhados Web+Mobile, mudança de workflow/RBAC/IMS/ciência, reabertura de campos da Nova PP (PO-UX-3).

**Estratégia:** nove blocos verificáveis (0–8), PRs pequenos, DATABASE na busca/filtros **antes** da UI da lista, SECURITY só em contrato de busca e leitura de participantes. Primeiro bloco de implementação: **Bloco 0 (Web Foundation)** em paralelo com o **contrato de dados da busca operacional**.

---

## 2. PO Decisions Applied

### Já fechadas (PO-UX-1 … 7) — não reabrir

| ID | Decisão | Efeito neste plano |
| --- | --- | --- |
| PO-UX-1 | Sidebar Web | Já entregue na 3.4. Bloco 1 só ajusta o **canvas filho**. |
| PO-UX-2 | Bottom Nav + Stack | Já entregue. Bloco 5/6 não redesenham a arquitetura. |
| PO-UX-3 | Não copiar campos Base44 na criação | Nova PP não ganha Motivo/Fotos/Observações. |
| PO-UX-4 | Copy “Paralisação Preventiva” / “PP” | Sweep de copy nas superfícies tocadas; sem rename técnico. |
| PO-UX-5 | `/occurrences*` candidatas | **Superado por PO-UX-16:** manter redirects. |
| PO-UX-6 | Logout na Sidebar | Já entregue. |
| PO-UX-7 | `packages/ui` = tokens + poucos primitivos | Tokens only. Primitivas React **por app**. |

### Fechadas nesta revisão (PO-UX-8 … 17)

| ID | Decisão | Efeito neste plano |
| --- | --- | --- |
| **PO-UX-8** | Migração shadcn incremental: P0 → dialogs críticos → core flow → reutilizáveis. Sem PR monolítico. | Bloco 0 inicia; Blocos 2–4 expandem. Zero “migrar a app inteira”. |
| **PO-UX-9** | Canvas: Dashboard, listas, detalhe operacional, relatórios e gestão usam a largura do shell. Formulários podem ficar controlados. Nova PP **não** vira full-width. | **Sobrescreve** a spec §I (`max-w-3xl` no detalhe). Detalhe Web abre o canvas; Nova PP permanece `max-w-2xl` (ou equivalente). |
| **PO-UX-10** | Busca/filtros da lista: texto, área, empresa/contratada, atividade, status, criticidade. Backend quando necessário. Sem filtro falso no cliente. | DATABASE + BACKEND **antes** da UI da lista (Blocos 2 e 6). |
| **PO-UX-11** | Início Mobile operacional (pendências/ações/atalhos). Não copiar Dashboard gerencial. | Bloco 6 harmoniza visual; **não** adiciona grade de KPI gerencial. |
| **PO-UX-12** | Participantes no detalhe Web, reusando domínio existente. | Bloco 2. Sem segunda tabela/modelo. |
| **PO-UX-13** | Platform Admin no roadmap. **Não implementar agora.** | Fora dos Blocos 0–8. Sem CRUD de usuários. |
| **PO-UX-14** | Register público fora. Reset posterior. Não copiar auth Base44. | Login permanece como está (polish visual só). |
| **PO-UX-15** | Ícones Mobile: planejar no Mobile Foundation; justificar lib; sem NativeWind. | Bloco 5 escolhe vetor **dentro do ecossistema Expo** antes de instalar. |
| **PO-UX-16** | Manter `/occurrences*` como redirects. | Nenhuma remoção. Testes de redirect permanecem. |
| **PO-UX-17** | Callout “preenchimento otimizado para menos de 60 segundos”. Só microcopy. | Bloco 2 (Nova PP Web + Mobile). Sem campos novos. |

### Conflitos resolvidos (spec histórica × PO recente)

| Conflito | Vence |
| --- | --- |
| Spec §I: detalhe `max-w-3xl` vs PO-UX-9 canvas amplo | **PO-UX-9** |
| Spec §T/H: busca textual como P2 vs PO-UX-10 | **PO-UX-10** (backend autorizado) |
| Spec §P: Dialog fora do mínimo 3.4 vs PO-UX-8 | **PO-UX-8** (dialogs críticos entram agora, incremental) |
| Spec §C/I vs Base44 `max-w-2xl/3xl` no protótipo | Identidade/gestão SafeStop: canvas amplo nas superfícies gerenciais; formulário Nova PP estreito |
| Base44 `InterdictionList.jsx` filtra 100 itens no cliente | **Não copiar.** Filtro no servidor (PO-UX-10). |
| Base44 Início Mobile = Dashboard KPI | **PO-UX-11** (campo ≠ gestão) |
| Verificação 3.4: tab bar “não consome `@safestop/ui`” | Auditoria 2026-08-25: **já consome `colors`**. Plano parte deste fato. |

### Explicitamente fora

- Platform Admin / convite / ativação / papéis administrativos
- Register, Forgot, Reset
- Fotos/Motivo na criação
- NativeWind
- Remoção de redirects legados
- Alteração de workflow, MDHO, ciência, IMS, evidência, auditoria, multi-org, RBAC existente

---

## 3. Dependency Graph

    DATABASE ── list_operational_occurrences (contrato + RPC + índices)
         │
         ├── GATE D1 ──► Bloco 2 lista Web
         └── GATE D1 ──► Bloco 6 lista Mobile

    Bloco 0  Web Foundation (tokens, primitivas, dialogs P0, PageHeader)
         │
         ├── GATE 0 ──► Bloco 1  Shell + Dashboard
         ├── GATE 0 ──► Bloco 2  Core operacional Web  (também precisa de D1 para a lista)
         └── GATE 0 (tokens status) ──► Bloco 5  Mobile Foundation   [paralelo a 1]

    Bloco 1 ── GATE 1 ──► Bloco 2 (canvas do detalhe/lista herda largura)
    Bloco 2 ── GATE 2 ──► Bloco 3  Secondary Web (seções do detalhe)
    Bloco 5 ── GATE 5 ──► Bloco 6  Core Mobile
    Bloco 3 ── GATE 3 ──► Bloco 4  Reports chrome (visual)
    Bloco 6 ── GATE 6 ──► Bloco 7  Secondary Mobile
    Blocos 1–7 ──► Bloco 8  Visual / Functional QA

**Paralelismo permitido**

| Trilha | Pode iniciar quando |
| --- | --- |
| DATABASE busca operacional | Imediatamente (não espera Bloco 0) |
| Bloco 0 Web Foundation | Imediatamente |
| Bloco 5 Mobile Foundation | Após tokens de status/criticidade definidos no Bloco 0 **ou** no mesmo PR de tokens em `packages/ui` |
| Bloco 1 Dashboard | Após GATE 0 (Button/filtros/PageHeader) |
| Bloco 2 lista | Após GATE 0 **e** GATE D1 |
| Bloco 2 Nova PP / detalhe / participantes / rascunho / callout | Após GATE 0 (não precisa de D1) |
| Bloco 4 reports visuais | Após GATE 0; não precisa de D1 |
| SECURITY | Só nos PRs de RPC de busca e de participantes Web |
| Bloco 8 | Após cada bloco (regressão contínua) + passada final |

**Não paralelizar**

- UI de filtro da lista **antes** da RPC (produz filtro falso).
- Bloco 3 (dialogs MDHO/plano/IMS) **antes** do chrome do Bloco 0 (retrabalho).
- Platform Admin em qualquer trilha.

---

## 4. Blocks 0–8

### Bloco 0 — WEB FOUNDATION

**Objetivo.** Um chrome só no Web: primitivas shadcn como default, tokens semânticos (incluindo status e criticidade), PageHeader, FormField, StatusBadge, e a primeira onda de dialogs críticos (AlertDialog Radix no lugar de `<dialog>` nativo nas confirmações destrutivas P0).

**Escopo.**

- Estender tokens em `packages/ui` (status de workflow, criticidade, elevation, overlay, control/touch height) e espelhar em `apps/web/src/app/globals.css`.
- Convenção documentada: Button, Input, Textarea, Select, Dialog, AlertDialog, Badge vêm de `apps/web/src/components/ui`. Não gerar primitivas shadcn extras sem uso imediato.
- Criar (Web-only): `PageHeader`, `FormField`, `StatusBadge` / `SeverityBadge` (podem viver em `apps/web/src/components/` ou `features/ui`).
- Migrar confirmações destrutivas P0: `evidence-delete-dialog.tsx`, `comment-delete-dialog.tsx`.
- Pilotos: login, forbidden, header da lista `/stop-work`.
- **Não** neste bloco: Dashboard layout, busca da lista, detalhe full-width, MDHO/plano/IMS, Mobile, Platform Admin.
- **Não** migrar todos os `<button>` nativos (PO-UX-8).

**Arquivos / superfícies.**

- `packages/ui/src/tokens/*`, `packages/ui/src/index.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/ui/*` (consumo, não catálogo novo)
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(app)/forbidden/page.tsx`
- `apps/web/src/features/stop-work/components/stop-work-list-container.tsx` (header apenas)
- `apps/web/src/features/evidence/components/evidence-delete-dialog.tsx`
- `apps/web/src/features/timeline/components/comments/comment-delete-dialog.tsx`
- `docs/design-system.md` (tokens novos + regra “Dialog = Radix”)

**Dependências.** Nenhuma lib nova. Nenhuma migration.

**Riscos.** PR inchado se puxar MDHO. Mitigação: só deletes P0 + fundação. Hex `gray-*` só nas superfícies tocadas.

**Agentes.** UIUX (tokens/contraste) → WEB → QA. ARCHITECT só se o contrato de tokens exigir ADR. SECURITY: não.

**Ordem interna.**

1. Tokens `packages/ui` + CSS
2. PageHeader / FormField / StatusBadge
3. Pilotos login / forbidden / header lista
4. AlertDialog nos dois deletes
5. Atualizar design-system.md

**Critérios de aceite.**

- Tokens de status e criticidade existem e são a fonte para badges nas superfícies tocadas.
- Login, forbidden e header da lista usam Button/Input/PageHeader shadcn.
- `evidence-delete-dialog` e `comment-delete-dialog` usam AlertDialog Radix (focus trap).
- Grep: esses dois arquivos **não** contêm `<dialog`.
- Ciência continua **sem** toast.
- `pnpm lint` + `pnpm typecheck` + testes Web existentes passam.

**Testes obrigatórios.** `pnpm --filter web test`; smoke manual de delete evidência/comentário (focus + Esc + confirmação). Não exigir E2E novo neste bloco.

**Gate antes do próximo.** GATE 0: UIUX confirma tokens; WEB confirma primitivas default; QA confirma os dois dialogs e ausência de regressão de login.

---

### Bloco 1 — WEB SHELL + DASHBOARD

**Objetivo.** O canvas usa a largura do shell. Dashboard com hierarquia rotulada **sem remover KPIs**. Filtros no mesmo DS. CTA Nova PP visível em tablet. KPI clicável acessível.

**Escopo.**

- Remover `max-w-6xl` autocentrado do dashboard (PO-UX-9). Conteúdo preenche `flex-1` com padding do shell.
- Preservar as 3 seções já existentes (`Atenção imediata`, `Situação operacional`, `Desempenho no período`) e o catálogo de KPIs.
- Trocar pills nativas de período/escopo por Button/Toggle shadcn (o `<dialog>` de escopo em `dashboard-scope-filters.tsx` migra para Dialog Radix neste bloco).
- CTA Nova PP: não usar `hidden lg:inline-flex` sem substituto (visível no header a partir de tablet; mobile-web já tem Sidebar/drawer).
- KPI card: elemento `button` (ou equivalente) com nome acessível; teclado; não só cor.
- Recharts permanece só no Dashboard. Relatórios: 0 Recharts (regressão 3.4).

**Arquivos.**

- `apps/web/src/app/(app)/layout.tsx` (apenas se o canvas filho precisar de constraint de padding — preferir não mexer na Sidebar)
- `apps/web/src/features/dashboard/components/dashboard-page.tsx`
- `dashboard-kpi-grid.tsx`, `dashboard-kpi-card` (se existir), `dashboard-period-filter.tsx`, `dashboard-scope-filters.tsx`, `dashboard-charts.tsx`, `dashboard-states.tsx`

**Dependências.** GATE 0.

**Riscos.** Parecer que “sumiu KPI”. Mitigação: checklist do catálogo (18 chaves; slot pessoal vs org). Não alterar RPCs `get_dashboard_kpis`.

**Agentes.** UIUX → WEB → QA. SECURITY: não.

**Critérios de aceite.**

- Dashboard ocupa a largura do shell em ≥1280px (sem faixa central morta).
- Mesmos KPIs visíveis por papel que hoje (não cortar indicadores).
- Filtros de período/escopo no DS.
- CTA Nova PP visível em viewport tablet.
- 4 Recharts + “Ver dados do gráfico”; Relatórios continuam sem Recharts.
- Drill-down para lista inalterado.

**Testes.** Script `qa-dashboard-3.2` / 16 casos existentes; `pnpm --filter web test`; verificação visual 768 / 1280 / 1536.

**Gate.** GATE 1: QA confirma KPIs + charts + drill-down + RBAC do CTA.

---

### Bloco 2 — WEB CORE OPERATIONAL FLOW

**Objetivo.** Lista + Nova PP + detalhe como um produto só: descoberta operacional real, formulário com callout e guarda de rascunho, detalhe de gestão com decisão da liderança clara e participantes.

**Escopo.**

1. **Lista `/stop-work`** — só após GATE D1.
   - Campo de busca textual sempre visível (placeholder no espírito Base44: área, empresa, atividade — copy em “Paralisação Preventiva”).
   - Funil recolhido: status, criticidade, área, contratada; atividade via texto (não há catálogo de atividade — `task_description`).
   - Manter busca IMS (não remover).
   - Cards: hierarquia tipo Base44 (badges + título + local/empresa + autor) **sem** virar tabela (tabela = Relatórios).
   - Canvas: largura do shell (PO-UX-9). Sem `max-w-4xl`.
   - Empty honesto quando a RPC não retornar linhas. Nunca filtrar no cliente um page incompleto.

2. **Nova PP `/stop-work/new`**
   - Manter `max-w-2xl` (PO-UX-9).
   - Callout PO-UX-17 (microcopy de velocidade). Sem campos novos.
   - Grid Área | Local em desktop, 1 coluna no mobile-web (composição Base44; campos já existem).
   - Guarda de rascunho Web: sair pela Sidebar/rota com campos preenchidos exige confirmação; persistir rascunho local (espelhar o padrão Mobile `flushDraft(getValues())`). `beforeunload` quando houver conteúdo.
   - Continuar RHF + `zodResolver(createPreventiveStopSchema)`.

3. **Detalhe `/stop-work/[id]`**
   - Remover `max-w-3xl`. Canvas de gestão (PO-UX-9). Ordem de blocos da spec §I **preservada**.
   - “Decisão da liderança”: dois cards lado a lado no desktop, pilha no mobile-web. **Zero** mudança de permissão/transição.
   - Participantes: seção RO equivalente à Mobile (`occurrence_participants`). Mesmos tipos/labels. Sem CRUD novo.

**Arquivos.**

- Lista: `stop-work-list-container.tsx`, `stop-work-list-item.tsx`, `use-stop-work-list-view.ts`, `dashboard-list-params.ts`, `apps/web/src/features/occurrences/services/get-occurrences.ts`, `packages/types/src/occurrence.ts`
- Nova PP: `stop-work-create-container.tsx`; novo store/guard de rascunho Web (espelhar Mobile, **não** compartilhar React)
- Detalhe: `stop-work-detail-container.tsx`, `LeadershipDecisionSection` (ou equivalente)
- Participantes Web: nova feature `apps/web/src/features/occurrence-participants/` portando o **serviço** Mobile (não o JSX RN)

**Dependências.** GATE 0; lista depende de GATE D1; participantes dependem de revisão SECURITY (leitura RLS existente).

**Riscos.** Reusar `list_occurrences_report` (exige `report.read` — Campo não lista). Filtro cliente. Inflar Nova PP. Inventar modelo de participantes.

**Agentes.** DATABASE/BACKEND (já no GATE D1) → WEB → UIUX (composição) → SECURITY (participantes + query keys tenant) → QA.

**Critérios de aceite.**

- Usuário com `occurrence.read` encontra PP por texto/área/contratada/status/criticidade **sem** saber IMS.
- Campo **sem** `report.read` continua podendo listar (RPC operacional ≠ relatório).
- Nova PP: callout visível; rascunho confirmado ao navegar pela Sidebar; Zod inalterado.
- Detalhe: decisão em dois cards; participantes visíveis quando houver rows; workflow intacto.
- Redirects `/occurrences*` intactos.

**Testes.** Unidade do mapper de filtros; teste de serviço da RPC (não UI fake); E2E lista (busca + funil + empty); E2E rascunho Nova PP (navegar Sidebar); detalhe decisão + participantes; regressão ciência (não toast); scripts AP/MDHO/IMS inalterados.

**Gate.** GATE 2: QA + SECURITY (RPC + participantes). Sem GATE 2, Bloco 3 não começa.

---

### Bloco 3 — WEB SECONDARY FLOWS

**Objetivo.** Mesmo chrome nas seções densas do detalhe e nas telas satélite: MDHO, IMS, plano, evidências, timeline, fila HSE, contatos.

**Escopo.**

- Substituir `<dialog>` restante: `mdho-form.tsx`, `ims-reference-form.tsx`, `ims-reference-edit-dialog.tsx`, `action-plan-*-dialog.tsx`, `action-plan-validate-panel.tsx`, `action-plan-empty.tsx`, `evidence-preview-modal.tsx`, `organization-contact-form-dialog.tsx`.
- Forms longos: RHF + resolver **somente** quando já existir schema Zod. Não inventar schema de domínio.
- Fila `/approvals/mdho`: PageHeader + cards no DS. Sem mudar RPCs de aprovação.
- Contatos: tabela + Dialog shadcn. Permissão `organization.manage` inalterada.
- Notificações: filtros nativos → Button/chips shadcn. Ciência = AlertDialog (já). Sem Sonner em ciência.

**Arquivos.** Features `mdho`, `ims-reference`, `action-plan`, `evidence`, `timeline`, `approvals`, `organization-contacts`, `notifications` (filtros).

**Dependências.** GATE 2 (grid do detalhe estável).

**Riscos.** Mexer em transição. Mitigação: UI only; mutations existentes.

**Agentes.** WEB → UIUX → QA. SECURITY só se algum dialog passar a chamar endpoint diferente (não deve).

**Critérios de aceite.** Grep `<dialog` = 0 em `apps/web/src`. Forms críticos com loading/disabled. Workflow MDHO/IMS/plano/liberação inalterado. Relatórios não entram neste bloco.

**Testes.** Scripts AP 17, MDHO 17, IMS 16, HSE 01–20; E2E reports 6/6 (não quebrar); smoke de um dialog por família (foco/Esc).

**Gate.** GATE 3.

---

### Bloco 4 — WEB ADMIN / RBAC / REPORTS

**Objetivo.** Relatórios e chrome administrativo **visual** no DS. **Sem** Platform Admin.

**Escopo.**

- Hub `/reports` e 3 tabelas: PageHeader, tokens (eliminar `text-gray-*` nas superfícies tocadas), Button/Dialog já shadcn.
- Preservar TanStack Table, export CSV/XLSX, auditoria, `report.read`.
- Organizações (seletor): cards no DS.
- **Fora:** CRUD usuários, memberships, convite, `user.manage` UI.

**Dependências.** GATE 0 (pode avançar após GATE 3 para consistência de PageHeader, mas não bloqueia dados).

**Riscos.** Inventar admin. Quebrar export.

**Agentes.** WEB → QA. SECURITY: não (nenhuma permissão nova).

**Critérios de aceite.** E2E reports 6/6; smokes OC/AI/AW/audit; Sidebar continua ocultando Relatórios sem `report.read`.

**Gate.** GATE 4.

---

### Bloco 5 — MOBILE FOUNDATION

**Objetivo.** Kit visual Mobile local (StyleSheet) consumindo `colors`, `spacing`, `radius`, `typography` de `@safestop/ui`. Primitivas **locais**: Button, Card, TextField, StatusBadge. Decisão de ícones vetoriais justificando (ou não) dependência.

**Escopo.**

- Telas-piloto: tab bar, lista, Nova PP, perfil, login.
- Touch target 44.
- Hex residual só com justificativa (ex. sombra nativa).
- **Ícones (PO-UX-15):** inventário dos emojis (`▦ ☰ 🔔 👤` e FAB). Antes de instalar: verificar `@expo/vector-icons` já transitivo no Expo 57 vs `lucide-react-native`. Preferir o que já existe no ecossistema Expo. Se instalar, um único set, tematizado com tokens. Sem NativeWind.
- Não redesenhar Bottom Nav (arquitetura 3.4).

**Arquivos.** `app-bottom-tab-bar.tsx`, `preventive-stop-list-screen.tsx`, `preventive-stop-create-screen.tsx`, `profile-screen.tsx`, `apps/mobile/app/(auth)/login.tsx`, novo `apps/mobile/src/components/ui/` (Button, Card, TextField, StatusBadge).

**Dependências.** Tokens de status do Bloco 0 (`packages/ui`). GATE 0 tokens, não GATE 0 Web inteiro.

**Riscos.** Refator estética. Lib de ícone sem justificativa.

**Agentes.** UIUX → MOBILE → QA. ARCHITECT se a escolha de ícone exigir ADR curto.

**Critérios de aceite.** Pilotos sem hex de paleta; tab bar tokens; typecheck mobile; decisão de ícones **registrada** neste programa (implementada neste bloco ou explicitamente adiada ao Bloco 6 com motivo).

**Testes.** `pnpm --filter mobile typecheck`; smoke manual tab bar / lista / Nova PP / perfil. Device real se disponível; se não, declarar limitação.

**Gate.** GATE 5.

---

### Bloco 6 — MOBILE CORE OPERATIONAL FLOW

**Objetivo.** Lista com a **mesma RPC** do Web; detalhe escaneável com uma mão; Início operacional (PO-UX-11); paridade visual de ciência.

**Escopo.**

- Lista: SearchField + funil (status/criticidade/área/contratada) falando com GATE D1. Manter IMS.
- Detalhe: hierarquia spec §I Mobile; decisão unificada visualmente; participantes **já existem** — só visual.
- Início: pendências, atalhos, pull-to-refresh. **Não** grade KPI Base44.
- Callout 60s na Nova PP (PO-UX-17). Rascunho QA-B4 permanece (`flushDraft`).
- Ciência: copy/badge alinhados ao Web; sem toast como ciência.

**Arquivos.** Lista/detalhe/home/notifications mobile; `get-occurrences.ts` mobile; hooks de lista.

**Dependências.** GATE 5 + GATE D1.

**Riscos.** Dashboard gerencial no Início. Filtro local.

**Agentes.** MOBILE → UIUX → QA. SECURITY: a RPC já revisada no GATE D1.

**Critérios de aceite.** Campo encontra PP sem IMS; Início sem KPI gerencial; FAB/tabs intactos; ciência explícita.

**Testes.** Typecheck; regressão rascunho Nova PP; se emulador disponível, fluxo lista→detalhe→ciência.

**Gate.** GATE 6.

---

### Bloco 7 — MOBILE SECONDARY FLOWS

**Objetivo.** Fila MDHO, evidência, plano, orgs, forbidden no kit do Bloco 5. Sem mudança de regra.

**Arquivos.** `approvals/mdho`, seções de detalhe (MDHO/IMS/plano/evidência), `organizations.tsx`, `forbidden.tsx`.

**Dependências.** GATE 6.

**Agentes.** MOBILE → QA.

**Critérios de aceite.** Visual unificado; HSE/MDHO/IMS scripts ainda passam se executados; Bottom Nav continua fora da fila MDHO.

**Gate.** GATE 7.

---

### Bloco 8 — VISUAL / FUNCTIONAL QA

**Objetivo.** Passada transversal: contraste, teclado, focus trap, empty/error, RBAC, viewports, uma mão, regressão 3.4.

**Escopo.** Checklist (seções 10–14). Sem feature nova. Bugs P0 encontrados **voltam** ao bloco dono; não “corrigir tudo no 8”.

**Agentes.** QA (lidera) → WEB/MOBILE (fix) → SECURITY se RBAC. UIUX no contraste.

**Critérios de aceite.** Nenhum P0 da lista de aceite deste plano aberto. Relatório QA assinado.

**Gate.** GATE 8 = fim do programa de convergência (não da Sprint de produto seguinte).

---

## 5. Agent Ownership Matrix

| Bloco / tema | ARCHITECT | DATABASE | BACKEND | WEB | MOBILE | UIUX | SECURITY | QA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tokens `packages/ui` | consulta | — | — | consome CSS | consome JS | **lidera contrato** | — | valida contraste |
| shadcn incremental | — | — | — | **lidera** | — | review | — | a11y dialogs |
| Canvas / Dashboard | — | — | — | **lidera** | — | composição | — | KPIs/regressão |
| RPC busca operacional | contrato | **lidera** | RPC/grants | consome | consome | copy do funil | **RLS/perm** | smokes |
| Lista W/M | — | — | — | Web | Mobile | cards/funil | — | E2E + empty |
| Nova PP callout + rascunho Web | — | — | — | **rascunho Web** | rascunho já existe | microcopy | — | perda de dados |
| Detalhe + decisão visual | — | — | — | Web | Mobile | hierarquia | — | workflow |
| Participantes Web | — | — | serviço existente | **lidera UI** | referência | — | **leitura RLS** | paridade |
| Dialogs MDHO/IMS/plano | — | — | — | **lidera** | kit visual | — | — | scripts domínio |
| Relatórios chrome | — | — | — | **lidera** | — | — | — | E2E 6/6 |
| Platform Admin | — | — | — | **proibido** | — | — | futuro spec | — |
| Ícones Mobile | se ADR | — | — | — | **lidera** | review | — | tab bar |
| Bloco 8 | — | — | — | fix | fix | contraste | RBAC se regressão | **lidera** |

**Regra:** nenhum agente executa a convergência sozinho. DATABASE não some depois da RPC: índices e EXPLAIN entram no GATE D1. SECURITY não participa de polish visual.

---

## 6. Backend/Data Requirements

### 6.1 Problema

`OccurrenceListFilters` hoje:

    status?: OccurrenceStatus[]
    severity?: OccurrenceSeverity
    imsReferenceCode?: string

`getOccurrences` (Web e Mobile) aplica esses filtros no PostgREST e **carrega a lista sem paginação**. A UI da lista operacional só expõe IMS. Área/contratada existem no SELECT (`areas.name`, `contractor_organizations.name`) mas **não** são filtro. Atividade é `task_description` (texto livre, sem catálogo).

`list_occurrences_report` **não** serve:

- exige `report.read` (HSE Campo lista PP e **não** tem essa permissão na matriz aprovada);
- `search` atual é só `public_code`;
- colunas e paginação são de relatório, não de cards operacionais.

Filtrar no cliente sobre o array já carregado **viola PO-UX-10** (e hoje a lista já pode ser grande). O Base44 faz `useMemo` sobre 100 entidades — referência de UX, não de backend.

O drill-down do Dashboard (`dashboardFilter` / escopo operacional) já mistura filtros de status com pós-filtro cliente (`filterOccurrencesByOperationalScope`). A busca nova **não** deve reutilizar esse pós-filtro para texto. Escopo de dashboard permanece como está até um follow-up explícito.

### 6.2 Contrato proposto — `list_operational_occurrences`

Nova RPC. Não reabrir `list_occurrences_report`.

**Permissão:** `has_permission('occurrence.read', p_organization_id)`  
**Escopo de linha:** mesmo `can_access_occurrence` das políticas atuais (SECURITY INVOKER + RLS; se precisar DEFINER, SECURITY revisa e documenta o motivo — preferir INVOKER).  
**Não** exigir `report.read`.

**Parâmetros (rascunho para DATABASE fechar):**

| Param | Origem PO-UX-10 | Mapeamento real |
| --- | --- | --- |
| `p_search` | texto | `ilike` em `public_code`, `task_description`, `location_description`, `ims_reference_code`, `areas.name`, nome da contratada |
| `p_area_id` | área | `occurrences.area_id` |
| `p_contractor_organization_id` | empresa/contratada | `occurrences.contractor_organization_id` |
| `p_status` | status | array do enum existente (não inventar status) |
| `p_severity` | criticidade | enum `severity` existente |
| `p_ims_reference_code` | IMS atual | manter comportamento contains |
| paginação | anti-filtro-falso | keyset (`created_at`, `id`) + limit (default 20, max 100) — mesmo espírito dos reports |

Atividade **não** é FK: entra em `p_search` (e, se DATABASE quiser, `p_search` já cobre `task_description`). Não criar tabela de atividades.

**Retorno:** DTO compatível com `OccurrenceSummary` (id, publicCode, title, status, severity, areaName, contractorOrganizationName, createdAt, createdByName). Sem colunas 1:N.

**Índices:** DATABASE avalia `pg_trgm` vs `ilike` prefix; não criar índice sem EXPLAIN. Reusar `occurrences_organization_id_status_idx` para status.

**Tipos:** estender `OccurrenceListFilters` em `packages/types` (search, areaId, contractorOrganizationId, pagination). Web e Mobile passam a chamar a RPC, não o `select` unbounded, na tela de lista. Detalhe continua `getOccurrence`.

**Dashboard drill-down:** pode continuar usando filtros de status via a mesma RPC (`p_status` / `p_severity`) para eliminar o load unbounded. Fora do caminho crítico do Bloco 0; DATABASE deve prever esses params.

### 6.3 Participantes Web

Tabela `occurrence_participants` já existe. Mobile já lê via Supabase client + join de nomes em `organization_members`/`profiles`.

Web: **mesmo SELECT**, feature própria em `apps/web`. Sem INSERT/UPDATE na UI. Sem novo `participant_type`. Sem segundo modelo.

SECURITY: confirmar RLS de SELECT na org da ocorrência; nenhum grant novo.

### 6.4 Rascunho Nova PP Web

Somente cliente (localStorage), como o Mobile. Sem tabela nova. Sem sucesso simulado de servidor.

### 6.5 Explicitamente sem migration de produto

- Sem tabela nova de usuários/admin
- Sem coluna nova em `occurrences` para Motivo/Fotos
- Sem mudança de enum de status
- Sem RLS relaxada

### 6.6 GATE D1 (obrigatório antes da UI da lista)

1. DATABASE publica migration + comentário + `docs/database.md` / `docs/api.md`.
2. BACKEND/types: cliente tipado, sem `any`.
3. SECURITY: permissão `occurrence.read`, isolamento org, Campo consegue listar, Gestor também, usuário sem `occurrence.read` não.
4. Smoke SQL/script: busca por área nome, contratada, trecho de atividade, status, severity; empty; paginação (página 2 **não** é filtro cliente da página 1).
5. Rollback: `drop function` da RPC; tipos revertidos.

---

## 7. Web Implementation Plan

Ordem de superfícies (após tokens):

1. Foundation (Bloco 0)
2. Dashboard canvas (Bloco 1)
3. Nova PP callout + rascunho + 2 colunas Área/Local (Bloco 2, independente de D1)
4. Detalhe canvas + decisão + participantes (Bloco 2)
5. Lista busca/funil (Bloco 2, **D1**)
6. Secondary dialogs (Bloco 3)
7. Reports/org chrome (Bloco 4)

**Regras WEB.**

- Importar de `@/components/ui/*`, não reinventar Button.
- Não compartilhar componentes com Mobile.
- Copy: “Paralisação Preventiva”; “Ocorrência” só onde o domínio técnico exigir (relatórios internos, código). Sweep nas superfícies tocadas (PO-UX-4).
- Sonner: transiente apenas. Ciência = AlertDialog / banner.
- `data-testid` de login (`login-email`, `login-password`, `login-submit`) **não** remover (regressão 3.4).
- Redirects `/occurrences*` permanecem.

**Larguras (PO-UX-9).**

| Superfície | Largura |
| --- | --- |
| Dashboard `/` | shell (`w-full` no `flex-1`) |
| Lista `/stop-work` | shell |
| Detalhe `/stop-work/[id]` | shell; textos longos com `max-w` **interno** no bloco de descrição, não na página inteira |
| Relatórios | shell (já melhor) |
| Nova PP | controlada (`max-w-2xl`) |
| Login / perfil | controlada |

---

## 8. Mobile Implementation Plan

Ordem:

1. Tokens + primitivas locais + decisão de ícones (Bloco 5)
2. Lista RPC + funil (Bloco 6, D1)
3. Início operacional polish (Bloco 6) — **não** Dashboard KPI
4. Detalhe hierarquia / ciência visual (Bloco 6)
5. Callout 60s Nova PP (Bloco 6)
6. Secondary (Bloco 7)

**Regras MOBILE.**

- StyleSheet. Sem NativeWind.
- Primitivas em `apps/mobile/src/components/ui`, não em `packages/ui`.
- Rascunho: manter `persistBeforeLeave` + `flushDraft(getValues())` (QA-B4).
- Bottom Nav sempre visível em lista/new/detalhe (já 3.4).
- Ícones: ver Bloco 5; Expo 57 **não** declara `lucide-react-native` nem `@expo/vector-icons` no `package.json` do app — inventário no GATE 5 antes de `pnpm add`.
- Campo ≠ gestão (PO-UX-11).

---

## 9. Design System Migration Strategy

**Já pago (não reinstalar):** shadcn new-york tematizado, Radix, Lucide Web, Recharts, Sonner, TanStack Table, RHF resolvers, tokens `@safestop/ui`.

**Estratégia PO-UX-8 (ondas, não big-bang).**

| Onda | Bloco | O quê |
| --- | --- | --- |
| 1 | 0 | Tokens status/criticidade; PageHeader; FormField; StatusBadge; AlertDialog deletes |
| 2 | 1 | Filtros dashboard; Dialog de escopo |
| 3 | 2 | Lista SearchField + funil; cards; rascunho AlertDialog; decisão liderança (cards, não Radio de domínio) |
| 4 | 3 | Restante `<dialog>`; forms longos com schema existente |
| 5 | 4 | Reports hub tokens |
| 6 | 5–7 | Kit Mobile paralelo (não shadcn) |

**Não gerar** accordion/calendar/carousel “por se”.

**Tokens novos (Bloco 0) — proposta para UIUX fechar valores:**

- Status: mapear enums oficiais → `success` / `warning` / `destructive` / `info` / `primary` (sem hex solto).
- Criticidade: BAIXA/MÉDIA/ALTA/CRÍTICA → border/foreground semânticos (âmbar crítico em dark precisa QA de contraste).
- Elevation, overlay/scrim, control height 36 Web / 44 Mobile.

**Hex:** eliminar `text-gray-*` / `bg-gray-*` / `text-orange-*` **somente** nos arquivos do PR. Sem rewrite da app.

**Ciência ≠ toast:** regra permanente no design-system.md (já implícita; reforçar na onda 0).

---

## 10. Testing Strategy

| Camada | Quando |
| --- | --- |
| Unit types/filters | GATE D1 + Bloco 2 |
| RPC smoke (SQL/node) | GATE D1 |
| `pnpm --filter web test` | todo PR Web |
| `pnpm --filter web test:e2e` | Blocos 1, 2, 4, 8 (login + reports) |
| Dashboard 16 | Bloco 1 e 8 |
| Reports smokes + E2E 6/6 | Bloco 4 e 8 |
| AP / MDHO / IMS / HSE | Bloco 3 e 8 |
| Playwright login testids | todo PR que toque auth/layout |
| Mobile typecheck | todo PR Mobile |
| Device/emulador | Blocos 5–7 se o ambiente permitir; senão limitação explícita |
| Contraste | Bloco 0 tokens + Bloco 8 |

**Não aceitar:** teste que só clica filtro no cliente mockando 3 rows como se fosse o servidor.

---

## 11. Accessibility Gates

Obrigatório por PR de UI:

- Confirmação destrutiva: AlertDialog Radix (focus trap, Esc, restore).
- KPI clicável: `button` + nome acessível.
- SearchField: `label` visível ou `aria-label`.
- Funil: `aria-expanded` no ícone; chips com `aria-pressed` se toggle.
- FormField: erro associado (`aria-describedby`).
- Não depender só de cor em status/criticidade (badge + texto).
- Login testids preservados.
- Sidebar colapsada: tooltip no **focus** teclado, não só hover.
- Touch Mobile ≥ 44px nas primitivas novas.

---

## 12. Responsive Gates

**Web (Next), viewports:** 375, 768, 1024, 1280, 1536.

| Viewport | Expectativa |
| --- | --- |
| 375 | Drawer; Nova PP 1 coluna; decisão empilhada; lista full; sem CTA dashboard `hidden` sem substituto de nav |
| 768 | Sidebar ícones; Dashboard CTA visível; KPI grid intermediário |
| ≥1024 | Sidebar 256; canvas shell nas superfícies PO-UX-9 |
| Relatórios 375 | scroll horizontal aceitável; não quebrar shell |

**Mobile nativo:** Bottom Nav persistente; uma mão no FAB; teclado na Nova PP não cobre o CTA de forma irrecuperável (já é risco conhecido — não piorar).

---

## 13. Regression Gates

Herdados da regressão Sprint 3.4 (não reabrir aceite):

1. Ciência via toast **não ocorre**.
2. KPI **não some**.
3. Export CSV/XLSX **não quebra**.
4. Sidebar **não mostra** item sem permissão.
5. Login E2E **não quebra** por testid.
6. Bottom Nav 5 + FAB; rascunho QA-B4 Mobile.
7. Redirects `/occurrences*` vivos.
8. Relatórios: 0 Recharts.
9. Campo: Nova PP visível; Relatórios e MDHO ocultos quando a matriz assim define.

Qualquer PR que falhe um desses itens **não** mergeia.

---

## 14. RBAC/Workflow Protection Gates

Checklist em todo PR:

- Nenhuma transição de status no cliente.
- Nenhuma permissão nova sem decisão PO (este programa **não** cria permissão).
- RPC de lista: só `occurrence.read` + `can_access_occurrence`.
- Participantes Web: SELECT only.
- `user.manage` / `organization.manage` **não** ganham tela de Platform Admin.
- Ciência: mutação existente; AlertDialog CRITICAL; `isPending` / `isConfirming`.
- IMS: digitação manual; sem integração.
- Multi-org: `TENANT_QUERY_KEY_PREFIX` + `clearTenantCache` intactos (F2).
- Contatos vs participantes: não misturar `organization_contacts` com `occurrence_participants`.

SECURITY entra **somente** em: migration/RPC de busca; feature de participantes Web; qualquer mudança acidental de grants.

---

## 15. Risks

| Risco | Mitigação |
| --- | --- |
| Tratar o programa como “instalar lib” | Libs já estão no Web. |
| Um PR “convergir tudo” | PO-UX-8 + decomposição §18. |
| Remover KPIs/MDHO/relatórios/ciência porque Base44 não tem | Proibido. |
| Copiar tema light / azul Base44 | Identidade SafeStop. |
| Filtro fake / reuso de `list_occurrences_report` | GATE D1 + permissão `occurrence.read`. |
| Componentes React Web+Mobile | Tokens only. |
| NativeWind | Proibido. |
| Toast = ciência | Gate de regressão. |
| Reabrir campos Nova PP | PO-UX-3 + PO-UX-17 só copy. |
| Platform Admin “já que estamos no Bloco 4” | PO-UX-13. |
| Spec §I `max-w-3xl` vs PO-UX-9 | PO-UX-9 vence; documentado na §2. |
| Seed Alpha sem contratada ativa (Nova PP disabled) | Fora deste plano; não é bloqueante de convergência; Zod exercitado em teste, não só UI Alpha. |
| Expo Web / Metro preso | QA Mobile declara limitação; não bloquear Web. |
| Paginação da lista muda UX (hoje “carrega tudo”) | Empty + “carregar mais”; não fingir que o funil rodou no conjunto completo. |
| Pós-filtro de escopo operacional no cliente | Não usar para a busca nova; follow-up separado se for unificar. |

---

## 16. Rollback Strategy

| Tipo de PR | Rollback |
| --- | --- |
| Tokens CSS / primitivas | Reverter o PR; shadcn permanece (já 3.4). |
| Canvas `max-w-*` | Restaurar classes anteriores; Sidebar intocada. |
| RPC busca | `DROP FUNCTION`; clientes voltam ao `getOccurrences` PostgREST; UI da lista esconde funil se a RPC não existir (feature flag **não** é necessária se o PR da UI só merge depois de D1). |
| Participantes Web | Remover a seção; tabela intacta. |
| Dialog Radix | Voltar ao `<dialog>` só em hotfix; preferir revert do PR. |
| Ícones Mobile | Reverter ao emoji; remover a dep se tiver sido adicionada. |
| Callout / copy | Reverter strings. |

Nunca rollback via “desligar RLS” ou migration destrutiva em `occurrences`.

---

## 17. Definition of Done por bloco

Além dos critérios da §4, todo bloco só fecha quando:

- [ ] Escopo do bloco (e só ele) entregue
- [ ] Documentação tocada (`design-system.md`, `database.md`/`api.md` se D1)
- [ ] Sem permissão/status/IMS novos
- [ ] Regressão §13 executada no que o bloco pode quebrar
- [ ] QA registrou o que **não** rodou (emulador, Alpha seed, etc.)
- [ ] Sem afirmação de sucesso sem evidência

---

## 18. Recommended PR decomposition

PRs **pequenos, reversíveis, um objetivo**. Nomes ilustrativos:

| PR | Conteúdo | Agentes | Merge após |
| --- | --- | --- | --- |
| **PR-D1** | Migration RPC + types `OccurrenceListFilters` + smoke | DATABASE, BACKEND, SECURITY, QA | GATE D1 |
| **PR-0a** | Tokens status/criticidade `packages/ui` + `globals.css` + design-system | UIUX, WEB, MOBILE (reexport) | GATE 0 parcial |
| **PR-0b** | PageHeader, FormField, StatusBadge + login/forbidden/header lista | WEB, UIUX, QA | GATE 0 |
| **PR-0c** | AlertDialog evidence-delete + comment-delete | WEB, QA | GATE 0 |
| **PR-1** | Dashboard canvas + filtros DS + a11y KPI + CTA tablet | WEB, UIUX, QA | GATE 1 |
| **PR-2a** | Nova PP callout + Área/Local 2 col + guarda rascunho Web | WEB, UIUX, QA | parte GATE 2 |
| **PR-2b** | Detalhe canvas + decisão 2 cards | WEB, UIUX, QA | parte GATE 2 |
| **PR-2c** | Participantes Web RO | WEB, SECURITY, QA | parte GATE 2 |
| **PR-2d** | Lista Web SearchField + funil + cards (consome PR-D1) | WEB, UIUX, QA | GATE 2 |
| **PR-3a** | Dialogs plano/IMS/evidência preview | WEB, QA | |
| **PR-3b** | Dialogs MDHO + fila HSE chrome | WEB, QA | |
| **PR-3c** | Contatos + filtros notificações | WEB, QA | GATE 3 |
| **PR-4** | Reports hub tokens + org cards | WEB, QA | GATE 4 |
| **PR-5a** | Primitivas Mobile + tokens nas telas-piloto | MOBILE, UIUX | |
| **PR-5b** | Ícones vetoriais (se a escolha do 5a autorizar dep) | MOBILE | GATE 5 |
| **PR-6a** | Lista Mobile RPC + funil | MOBILE, QA | |
| **PR-6b** | Início + detalhe + callout + ciência visual | MOBILE, UIUX, QA | GATE 6 |
| **PR-7** | Secondary Mobile | MOBILE, QA | GATE 7 |
| **PR-8** | Só fixes do relatório QA | WEB/MOBILE | GATE 8 |

Não agrupar PR-D1 com PR-2d no mesmo commit inicial: a RPC deve poder ser revertida sem desfazer o Dashboard.

---

## 19. Recommended execution order

    Semana lógica 1
      ├── PR-D1 (DATABASE/SECURITY)          ║
      └── PR-0a → PR-0b → PR-0c (WEB)        ║  paralelo

    Semana lógica 2
      ├── PR-1 Dashboard                     ║
      └── PR-5a Mobile Foundation            ║  paralelo (tokens já em 0a)

    Semana lógica 3
      ├── PR-2a Nova PP + rascunho
      ├── PR-2b Detalhe canvas + decisão
      └── PR-2c Participantes

    Semana lógica 4
      ├── PR-2d Lista Web                    (exige D1 mergeado)
      └── PR-5b ícones (se aprovado)

    Semana lógica 5
      ├── PR-3a/3b/3c Secondary Web
      └── PR-6a/6b Core Mobile               (exige D1 + GATE 5)

    Semana lógica 6
      ├── PR-4 Reports chrome
      ├── PR-7 Secondary Mobile
      └── PR-8 QA final

Calendário real depende de capacidade; a **ordem de gates** não. Não transformar isto numa única Sprint/PR. Não iniciar Platform Admin “no vazio” da semana 6.

---

## 20. First implementation handoff

**READY FOR IMPLEMENTATION: YES**

Não há blocker de produto: PO-UX-8…17 fecharam a §26 da auditoria. O primeiro código autorizado é o **Bloco 0** em paralelo com **PR-D1** (contrato de busca). Nenhum dos dois espera o outro para **começar**; a UI da lista espera D1 para **merge**.

### 20.1 Handoff A — DATABASE + BACKEND + SECURITY (PR-D1)

**Objetivo.** RPC `list_operational_occurrences` (nome final a cargo do DATABASE) com o contrato da §6.2.

**Fazer.**

- Migration + grants + comentário SQL
- Estender `OccurrenceListFilters` + testes de mapeamento em `packages/types`
- Documentar em `docs/database.md` e `docs/api.md`
- Smoke: texto (área/contratada/atividade/`public_code`), filtros id/status/severity, paginação, empty
- SECURITY: `occurrence.read` apenas; RLS/org; Campo lista; sem `report.read`

**Não fazer.** UI. Não alterar `list_occurrences_report`. Não filtrar no cliente.

**Done.** GATE D1 da §6.6.

### 20.2 Handoff B — UIUX + WEB + QA (Bloco 0 / PR-0a–0c)

**Objetivo.** Foundation Web: tokens + primitivas de composição + dois dialogs destrutivos P0.

**Fazer.**

1. UIUX: valores de token de status, criticidade, overlay, control height; contraste AA em dark + laranja `#F97316`.
2. WEB: espelhar em `globals.css`; PageHeader; FormField; StatusBadge; aplicar em login, forbidden, header `/stop-work`.
3. WEB: `evidence-delete-dialog` e `comment-delete-dialog` → AlertDialog shadcn.
4. QA: typecheck/lint/test Web; login testids; focus nos dois dialogs; ciência **não** tocada.

**Não fazer.** Dashboard layout, funil da lista, detalhe `max-w`, MDHO, Mobile além de reexport de tokens, libs novas, NativeWind.

**Arquivos iniciais (Web).** Ver Bloco 0 §4.

**Done.** GATE 0.

### 20.3 Handoff C — não começar ainda

- Lista com busca visual
- Platform Admin
- Ícones Mobile (espera GATE 0 tokens + PR-5a)
- Remoção de `/occurrences*`

### 20.4 Prompt operacional para o próximo ciclo

    Destinatários: DATABASE (PR-D1) e WEB/UIUX (PR-0a) em paralelo.
    Entrada: este plano + UX-UI-GLOBAL-AUDIT.md + PO-UX-8…17.
    Saída: dois PRs pequenos, cada um com gate próprio.
    Proibido: implementar Bloco 2 lista, Platform Admin, NativeWind, campos Base44 na Nova PP.

---

## Referência `/reference` usada neste plano

Inspecionada de forma recursiva. Nenhum arquivo dela foi alterado.

| Fonte | Uso no plano |
| --- | --- |
| `reference/Fluxo.md` | Sequência operacional; “< 60s”; 5 destinatários = backend, não UI de seleção |
| `reference/Exemplo.md` | Narrativa PP-0003; MDHO/IMS como etapas, não telas isoladas |
| `reference/base44/src/pages/Dashboard.jsx` | KPI+ícone+chart+recentes — **composição**; KPIs SafeStop permanecem |
| `reference/base44/src/pages/InterdictionList.jsx` | Search visível + funil recolhido; **não** copiar filtro cliente de 100 itens |
| `reference/base44/src/pages/NewInterdiction.jsx` | Callout, 2 col Área/Local, chips de criticidade; **não** Motivo/Fotos |
| `reference/base44/src/pages/InterdictionDatail.jsx` | Dois caminhos de decisão; Base44 ainda faz `update` de status no cliente — **proibido** no SafeStop |
| `Login.jsx` / `Register.jsx` / `ForgotPassword.jsx` / `RestPassword.jsx` | Auth self-service fora (PO-UX-14) |
| `Release.jsx` | Liberação continua seção do detalhe, não rota nova |
| `reference/research/*.png` | Hierarquia visual; identidade dark vence o tema claro das shots |
| `apps/web` + `apps/mobile` | Verdade funcional (18 rotas Web, tabs Mobile, 13 `<dialog>` nativos, 3 imports `@safestop/ui` no Mobile) |

---

## Critério de sucesso deste documento (MASTER)

1. Blocos 0–8 viraram unidades executáveis com aceite, testes e gates.  
2. PO-UX-8…17 aplicados; conflitos com spec 3.4 resolvidos explicitamente.  
3. Contrato de busca identificado **antes** da UI (não é filtro fake).  
4. Trabalho distribuído entre agentes; SECURITY e DATABASE nos pontos certos.  
5. Nenhum código de produção alterado nesta etapa.  
6. First handoff = Bloco 0 + PR-D1.  
7. READY FOR IMPLEMENTATION: **YES**.

---

*Fim do plano executivo. Nenhuma implementação associada.*
