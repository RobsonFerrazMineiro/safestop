# Verificação Sprint 3.4 — UX/UI Convergence + Hardening

**Data:** 2026-08-24 (revalidação pós-correções QA-B1…B4)  
**Agente:** DOCS (consolidação pós-implementação WEB/MOBILE/BUILD; evidências QA e SECURITY)  
**Escopo:** Sidebar Web, Bottom Navigation Mobile, tokens `@safestop/ui`, hardening P0 (logout, ciência, offline, cache tenant)  
**Decisões (histórico — não alterar):** [`UX-CONVERGENCE-DECISIONS.md`](./UX-CONVERGENCE-DECISIONS.md), [`UX-CONVERGENCE-UI-SPEC.md`](./UX-CONVERGENCE-UI-SPEC.md)

---

## Veredicto Gate Sprint 3.4

| Gate | Agente | Resultado |
| --- | --- | --- |
| SECURITY — RBAC Sidebar/Bottom Nav + cache F2 | SECURITY | **APROVADO** |
| BUILD — `lint` / `typecheck` / `build` | BUILD | **PASS** (typecheck revalidado DOCS 2026-08-23) |
| QA — navegação nova + hierarquia detalhe + regressão | QA | **APROVADO** (bloqueantes QA-B1…B4 corrigidos; revalidação DOCS 2026-08-24) |
| **Gate I — DOCS Sprint 3.4** | DOCS | **APROVADO** — documentação alinhada ao código pós-correções |

> A documentação reflete o **código entregue**, não trata P1/P2 como concluídos e **não reescreve** decisões/spec históricas.

---

## O que foi implementado (evidência no código)

### Web — Sidebar

| Item | Implementação |
| --- | --- |
| Componente | `apps/web/src/features/navigation/components/app-sidebar.tsx` |
| Layout | `(app)/layout.tsx` — substitui top bar horizontal |
| Itens / RBAC | `get-nav-items.ts` — lista plana; ocultação por permissão |
| Responsivo | &lt;768 Drawer; 768–1023 colapsada `w-16`; ≥1024 expandida `lg:w-64` |
| Org ativa + Trocar | bloco na sidebar quando multi-org |
| Logout | `SignOutButton` no rodapé |
| Badge notificações | contador quando `unreadCount > 0` |
| Item ativo | pill `rounded-full` + `--surface-elevated` |

### Mobile — Bottom Navigation

| Item | Implementação |
| --- | --- |
| Componente | `app-bottom-tab-bar.tsx` + `(tabs)/_layout.tsx` |
| Abas | Início · Paralisações · Notificações · Perfil + FAB **Paralisar** |
| FAB | navega para `stop-work/new` |
| Persistência barra | visível em listagem, detalhe e criação dentro de `(tabs)` |
| Rascunho Nova PP | `PreventiveStopDraftNavigationProvider` + confirmação; **`flushDraft(getValues())`** antes de sair |
| Logout | `profile-screen.tsx` — botão “Sair” |
| Ícones / tokens | emoji/texto local; cores inline — **não** consome `@safestop/ui` ainda |

### `packages/ui` — tokens

Exportados em `packages/ui/src/index.ts`:

- `colors`, `DISABLED_OPACITY`, `withDisabledOpacity`
- `spacing`, `spacingScale`
- `radius`, `radiusScale`
- `typography`
- `componentStates`

**Não implementado:** Button, NavigationItem, Badge, Card, EmptyState, Skeleton (P1).

**Web:** paleta espelhada em `apps/web/src/app/globals.css` (`--primary`, `--surface-*`, etc.).

### Hardening P0 (parcial / correlato)

| Item | Status | Evidência |
| --- | --- | --- |
| Logout Web na Sidebar | **Implementado** | `SignOutButton` |
| Logout Mobile no Perfil | **Implementado** | `profile-screen.tsx` |
| Banner ciência no detalhe Web | **Implementado** | `NotificationAwarenessBanner` em `stop-work-detail-container.tsx` |
| Indicador offline Web | **Implementado** | `OfflineIndicator` + `use-online-status.ts` |
| F1 — `isPending` em confirmar ciência | **Implementado** | `notification-item.tsx` (`disabled={isConfirming}`) |
| F2 — cache tenant ao trocar org | **Implementado** | `clearTenantCache` em `organization-provider.tsx` (Web e Mobile) |

---

## O que foi validado

### SECURITY (aprovado)

Revisão manual Web com `qa-multi@safestop.local`:

- Sidebar: itens ocultos conforme permissões (HSE Campo vs Gestor).
- Troca de organização: filtros/dados atualizados; sem vazamento cross-tenant observado.
- Bottom Nav Mobile: 4 abas + FAB; sem novos destinos administrativos expostos.
- Cache F2: prefixo `TENANT_QUERY_KEY_PREFIX` + `clearTenantCache` no switch de org e logout.

### QA — itens aprovados (parcial)

Executado conforme relatório QA Sprint 3.4 (2026-08-23):

| Área | Resultado |
| --- | --- |
| `pnpm supabase:db:reset` | PASS |
| `pnpm lint` | PASS (warnings pré-existentes) |
| `pnpm typecheck` | PASS |
| `pnpm --filter web test` | 22/22 PASS |
| E2E Web Reports | 6/6 PASS |
| Dashboard 3.2 | 16/16 PASS |
| Smokes Reports (occurrences, action items, awareness, audit) | PASS |
| Action Plan AP-QA | 17/17 PASS |
| MDHO smoke | 17/17 PASS |
| IMS smoke | 16/16 PASS |
| Sidebar RBAC (papéis seed: HSE Campo, Fiscal, Supervisor, Liderança, Gestor, dual) | PASS |
| Sidebar ativo / logout / drawer mobile-web | PASS |
| F1 dupla confirmação ciência | PASS |
| F2 troca multi-org Web | PASS |

### QA — achados bloqueantes (corrigidos)

| ID | Achado original | Correção aplicada | Revalidação |
| --- | --- | --- | --- |
| **QA-B1** | `HSE-18: invalidate ausente` (19/20) | `use-invalidate-hse-approval-caches.ts` usa `getOccurrenceInvalidationTargets` + `resolveOccurrenceInvalidationKeys`; script `qa-hse-01-20.mjs` alinhado | **20/20 PASS** (DOCS 2026-08-24) |
| **QA-B2** | Platform Admin sem **Responsáveis** na Sidebar | `canManageOrganizationContacts` retorna `true` para `isPlatformAdmin`; Sidebar passa `isPlatformAdmin` ao guard | Código revisado |
| **QA-B3** | Mobile: MDHO/IMS concluídos não colapsavam | `CollapsibleSection` em `mdho-section.tsx` (summary aprovado) e `ims-reference-section.tsx` (código IMS) | Código revisado |
| **QA-B4** | “Salvar e sair” não persistia último input sem `onBlur` | `persistDraftBeforeLeave` → `flushDraft(getValues())`; guard registrado via `persistBeforeLeave` no contexto de navegação | Código revisado |

### Revalidação DOCS (2026-08-24)

```powershell
pnpm typecheck                    # 7/7 PASS
pnpm --filter web test            # 22/22 PASS
node supabase/scripts/qa-hse-01-20.mjs   # 20/20 PASS (incl. HSE-18)
```

Revisão estática adicional: `CollapsibleSection` mobile (MDHO/IMS), `flushDraft` no fluxo “Salvar e sair”, `canManageOrganizationContacts` + Sidebar Platform Admin.

### Ressalvas não bloqueantes (QA original)

- E2E visual Mobile (emulador/Android): indisponível no ambiente QA.
- Expo Web: startup não concluído.
- Papéis sem usuário dedicado no seed (Liderança Contratada, Administrador da Empresa).

---

## Pendências P1 / P2 (não concluídas)

Conforme [`UX-CONVERGENCE-UI-SPEC.md`](./UX-CONVERGENCE-UI-SPEC.md) Seção T — **não tratar como entregue**:

### P1

- Componentes visuais **cross-platform** em `packages/ui` (Button, NavigationItem, Badge, Card, EmptyState, Skeleton) — Web já usa shadcn local em `apps/web/src/components/ui`
- Reorganização visual do Dashboard por títulos de seção
- Nova PP Web: chips de criticidade + reagrupamento de campos
- Listagem PP Web: filtro recolhido (funil) quando busca textual viável
- Harmonizar badges Notificações Web × Mobile
- Responsividade tablet Sidebar + grid intermediário KPIs
- Substituir ícones placeholder Mobile por icon set formal

### P2

- Avatar editável no Perfil
- **NativeWind** no Mobile (documentado historicamente; **rejeitado** Sprint 3.4 — ver ADR-002)
- Filtros/busca textual que exigem capacidade técnica nova (spec H)
- Catálogo shadcn além da lista seletiva 3.4 (accordion, calendar, carousel, …)
- Remoção rotas legadas `/occurrences/*` (PO-UX-5)
- Refinamentos microinteração / spacing fino
- `lucide-react-native` (iconografia Mobile formal)

---

## Divergências spec × implementação final

| Tema | Spec / decisão | Implementação real | Classificação |
| --- | --- | --- | --- |
| Nomenclatura nav Mobile | “Ocorrências” em wireframes antigos | **“Paralisações”** | Alinhado PO-UX-4 |
| Top bar Web | Referência histórica `app-top-bar` | **Removida** do layout; Sidebar + drawer mobile-web | Conforme PO-UX-1 |
| Ícones Mobile | Icon set harmonizado (aspiracional P1) | Emoji/texto (`▦`, `☰`, `🔔`, `👤`) | Divergência conhecida — **P1** |
| Tokens Mobile nav | Paleta `@safestop/ui` | `colors` de `@safestop/ui` (Bottom Nav, Perfil, Nova PP) | **Resolvido** (onda stack) |
| Lucide Web | Design-system aspiracional | Lucide em Sidebar (`nav-icons.tsx`) e ações Web | **Resolvido** (onda stack) |
| FAB label | “Nova PP” / “Paralisar” na spec | Label **“Paralisar”**; a11y “Nova Paralisação Preventiva” | Aceitável |
| Sidebar aspiracional | Avaliações, Usuários, Configurações (design-system antigo) | Itens **reais** do produto (MDHO, Responsáveis, Relatórios, etc.) | Doc corrigida; spec C previa lista real |
| Platform admin → Responsáveis | Gestão global | Corrigido — `canManageOrganizationContacts` agora concede acesso global ao Platform Admin | Resolvido (QA-B2) |
| Detalhe PP Mobile colapsos | Seção I P0 — MDHO/IMS colapsáveis quando concluídos | `CollapsibleSection` com summary no mobile | **Resolvido** (QA-B3) |
| Rascunho Nova PP | Preservar ao trocar aba | Confirmação + **`flushDraft(getValues())`** antes de navegar | **Resolvido** (QA-B4) |
| `packages/ui` componentes | P1 lista Button, NavigationItem, etc. | **Somente tokens** exportados | Conforme escopo mínimo 3.4 |

---

## Arquivos de implementação inspecionados

**Web:** `app-sidebar.tsx`, `nav-icons.tsx`, `get-nav-items.ts`, `(app)/layout.tsx`, `globals.css`, `components.json`, `components/ui/*`, `dashboard-charts.tsx`, `*-report-table.tsx`, `ui-providers.tsx`, `toaster.tsx`, `offline-indicator.tsx`, `notification-awareness-banner.tsx`, `organization-provider.tsx`, `clear-tenant-cache.ts`

**Mobile:** `app-bottom-tab-bar.tsx`, `(tabs)/_layout.tsx`, `preventive-stop-draft-navigation-context.tsx`, `confirm-preventive-stop-draft-leave.ts`, `preventive-stop-create-screen.tsx`, `use-preventive-stop-draft.ts`, `collapsible-section.tsx`, `mdho-section.tsx`, `ims-reference-section.tsx`, `profile-screen.tsx`, `organization-provider.tsx`

**Shared:** `packages/ui/src/tokens/*.ts`, `packages/ui/src/index.ts`, `packages/types/src/organization-contact.ts` (`canManageOrganizationContacts`)

---

## DoD Sprint 3.4 — status documental

| Critério | Status |
| --- | --- |
| `docs/design-system.md` reflete navegação real | **Concluído** (DOCS 2026-08-23) |
| Tokens `@safestop/ui` documentados; P1 componentes explicitamente futuros | **Concluído** |
| Documento de verificação sem contradição com código | **Concluído** |
| QA Gate aprovado | **Concluído** — bloqueantes QA-B1…B4 corrigidos e revalidados |
| Roadmap Sprint 3.4 marcada concluída | **Concluído** (DOCS 2026-08-24) |
| ADR-002 + design-system alinhados à stack Web/Mobile real | **Concluído** (DOCS 2026-08-25) |

**Sprint 3.4 (escopo P0 + navegação + tokens + stack Web):** implementação e gates SECURITY/QA/DOCS **aprovados**. Itens **P1/P2** permanecem backlog explícito (Seção T da spec + adendo stack abaixo).

---

## Adendo — Onda stack Web/Mobile (2026-08-25)

Complemento pós-QA; **não reescreve** entregas P0 de navegação/token acima. Fonte: [`UI-STACK-AUDIT.md`](./UI-STACK-AUDIT.md) §16–17, código em `apps/web` / `apps/mobile`.

### Entregue nesta onda

| Item | Evidência |
| --- | --- |
| shadcn/ui seletivo tematizado | `apps/web/components.json`; `src/components/ui/*`; `globals.css` mapeia tokens SafeStop + variáveis shadcn |
| Lucide Web (Sidebar spec C) | `nav-icons.tsx` → `lucide-react` |
| Recharts | **Somente** `dashboard-charts.tsx` |
| Sonner (transitório) | `toaster.tsx`, `ui-providers.tsx`; usos em notificações (ex.: marcar lidas) — **não** ciência |
| TanStack Table | `occurrences-report-table.tsx`, `action-items-report-table.tsx`, `awareness-report-table.tsx` |
| RHF + `@hookform/resolvers` | Nova PP Web, Perfil Web |
| Radix + CVA + cn | Transitivo do setup shadcn (`radix-ui`, `class-variance-authority`, `tailwind-merge`) |
| Tokens Mobile | `@safestop/ui` em Bottom Nav, Perfil, Nova PP |
| NativeWind | **Explicitamente não adotado** — Mobile permanece StyleSheet |

### Permanece P1 / P2 (não marcar como feito)

| Prioridade | Item |
| --- | --- |
| **P1** | Ícones formais Mobile (`lucide-react-native` ou equivalente); reorganização Dashboard; chips Nova PP Web; filtro funil listagem; badges Notificações harmonizados; componentes **cross-platform** em `packages/ui` (Button, NavigationItem, EmptyState, …) |
| **P2** | **NativeWind** no Mobile; avatar editável; busca textual/filtros com capacidade técnica nova (spec H); catálogo shadcn além da lista seletiva (accordion, calendar, …); remoção `/occurrences/*`; refinamentos microinteração |

### Divergências stack (atualização)

| Tema | Antes (audit) | Agora | Status |
| --- | --- | --- | --- |
| shadcn Web | Documentado, ausente | Instalado seletivo | **Resolvido** |
| Lucide Web | SVG próprio | Lucide em Sidebar/ações | **Resolvido** |
| Recharts | Divs placeholder | Gráficos reais Dashboard | **Resolvido** |
| Sonner | Toast local | Sonner global; ciência separada | **Resolvido** |
| TanStack Table | HTML manual | Table + sort nos relatórios | **Resolvido** |
| Tokens Mobile nav | Hex inline | `@safestop/ui` | **Resolvido** |
| Ícones Mobile | Emoji | Emoji (placeholders) | **P1** |
| NativeWind | Só na doc | Rejeitado; StyleSheet oficial | **Decisão fechada P2** |

**Validação DOCS 2026-08-25:** revisão estática de `package.json` Web/Mobile, `components/ui`, `nav-icons.tsx`, imports Recharts/Sonner/Table; `pnpm typecheck` PASS.

---

## Referências

- [`UX-CONVERGENCE-DECISIONS.md`](./UX-CONVERGENCE-DECISIONS.md) — PO-UX-1…PO-UX-*
- [`UX-CONVERGENCE-UI-SPEC.md`](./UX-CONVERGENCE-UI-SPEC.md) — Seções C, D, I, O, P, T
- [`RBAC-MATRIX-APPROVED.md`](./RBAC-MATRIX-APPROVED.md)
- [`docs/design-system.md`](../design-system.md) — Navegação, tokens e stack de apresentação Sprint 3.4
- [`ADR-002-technology-stack.md`](./ADR-002-technology-stack.md) — revisão stack 2026-08-25
- [`UI-STACK-AUDIT.md`](./UI-STACK-AUDIT.md) — §16–17
- Relatório QA Sprint 3.4 (agente QA, 2026-08-23) — bloqueantes corrigidos; revalidação DOCS 2026-08-24
- Relatório SECURITY Sprint 3.4 (agente SECURITY, 2026-08-23) — status **APROVADO**
