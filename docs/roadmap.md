# Roadmap de Desenvolvimento

> Planejamento oficial de desenvolvimento do SafeStop.

---

# 1. Objetivo

Este documento define todas as etapas de desenvolvimento do SafeStop.

O roadmap foi organizado seguindo o fluxo operacional real de uma Paralisação Preventiva.

Cada Sprint deverá entregar uma funcionalidade completa, utilizável e testável.

O objetivo é reduzir retrabalho e permitir evolução contínua.

---

# 2. Princípios

Todo Sprint deve:

- entregar valor;
- manter o sistema funcionando;
- possuir testes;
- possuir documentação;
- manter compatibilidade com versões anteriores.

Não iniciar uma Sprint antes da anterior estar concluída.

---

# 3. Tecnologias

Frontend Mobile

- Expo
- React Native
- TypeScript

Frontend Web

- Next.js
- React
- TypeScript

Backend

- Supabase

Banco

- PostgreSQL

Storage

- Supabase Storage

Realtime

- Supabase Realtime

Autenticação

- Supabase Auth

Estado

- TanStack Query

UI

- NativeWind
- shadcn/ui (Web)

---

# Sprint 0

## Fundação

Objetivo

Criar toda a estrutura do projeto.

Entregas

- Workspace
- pnpm
- Monorepo
- Configuração Expo
- Configuração Next
- Supabase
- ESLint
- Prettier
- Husky
- Commitlint
- CI
- Ambiente DEV
- Ambiente PROD

Critério de aceite

Projeto inicial funcionando.

---

# Sprint 1

## Identidade

Objetivo

Criar autenticação e estrutura organizacional.

Entregas

- Login
- Logout
- Recuperação de senha
- Perfil
- Organizações
- Empresas
- Papéis
- Permissões
- Usuários

Critério

Usuário autenticado.

---

# Sprint 2

## Paralisação Preventiva

Objetivo

Registrar uma ocorrência em menos de 60 segundos.

Entregas

- Cadastro
- Fotos
- Geolocalização
- Área
- Empresa
- Atividade
- Criticidade
- Código interno
- Timeline inicial

Critério

Ocorrência registrada.

### Nota — Sub-sprint 2.1 (Stop Work / PP operacional)

A Sprint 2 é entregue de forma incremental. A **sub-sprint 2.1** cobre o fluxo operacional mínimo de Paralisação Preventiva (formulário < 60s, listagem PP, detalhe read-only, cascata contratada→contrato, geolocalização opt-in, rascunho local mobile), **sem** fotos/evidências nem notificações automáticas (estas permanecem nas entregas posteriores da Sprint 2 e na Sprint 3).

Decisões oficiais: `docs/decisions/PREVENTIVE-STOP-DECISIONS.md` (A-R1…A-R10).  
Especificação UI: `docs/decisions/PREVENTIVE-STOP-UI-SPEC.md`.

### Nota — Sub-sprint 2.2 (Evidências de Ocorrência)

A **sub-sprint 2.2** entrega evidências fotográficas **pós-create** (`INITIAL_EVIDENCE` em `occurrence_attachments`), sem obrigar foto na abertura PP e sem notificações. Gate **G0** (PO-1…PO-15) desbloqueia DATABASE/BACKEND.

Decisões oficiais: `docs/decisions/EVIDENCE-DECISIONS.md`.  
Especificação UI: `docs/decisions/EVIDENCE-UI-SPEC.md`.

### Nota — Sub-sprint 2.3 (Comentários e Timeline)

A **sub-sprint 2.3** entrega timeline unificada via RPC (`get_occurrence_timeline`) e comentários `GENERAL` — **sem** tabela `occurrence_timeline`, **sem** notificações/ciência (Sprint 3) e **sem** Realtime. Ordem UI: Evidências → Timeline → Composer *(atualizada na 2.4 com bloco Ver e Agir)*.

Decisões oficiais: `docs/decisions/TIMELINE-DECISIONS.md` (PO-1…PO-15).  
Especificação UI: `docs/decisions/TIMELINE-UI-SPEC.md`.

### Nota — Sub-sprint 2.4 (Ver e Agir / Avaliação)

A **sub-sprint 2.4** antecipa o caminho **Ver e Agir** até o status `VER_E_AGIR`: duas RPCs (`start_occurrence_evaluation` ≠ `record_occurrence_decision`), permissão `occurrence.evaluate`, **sem** Interdição Oficial, MDHO, IMS, correção/liberação nem notificações. Ordem UI: Evidências → Ver e Agir → Timeline → Composer. Roadmap Sprint 4/5 permanece a entrega completa de avaliação/IO e correção.

Decisões oficiais: `docs/decisions/VER-E-AGIR-DECISIONS.md` (PO-1…PO-20).  
Especificação UI: `docs/decisions/VER-E-AGIR-UI-SPEC.md`.

### Nota — Sub-sprint 2.5 (Interdição Oficial)

A **sub-sprint 2.5** habilita o ramo paralelo **Interdição Oficial** a partir de `EM_AVALIACAO` → `INTERDICAO_CONFIRMADA` via extensão de `record_occurrence_decision` (`decision_type = INTERDICAO_OFICIAL`), permissão `occurrence.confirm_interdiction` — **sem** MDHO, IMS, notificações nem correção/liberação. IO **não** parte de `VER_E_AGIR`. Ordem UI: Evidências → Decisão da Liderança (VA+IO) → Summary → Timeline → Composer. Sprint 6 permanece MDHO/fluxo IO completo no roadmap.

Decisões oficiais: `docs/decisions/INTERDICAO-OFICIAL-DECISIONS.md` (PO-IO-1…PO-IO-12).  
Especificação UI: `docs/decisions/INTERDICAO-OFICIAL-UI-SPEC.md`.

### Nota — Sub-sprint 2.6 (Avaliação Técnica MDHO)

A **sub-sprint 2.6** entrega MDHO operacional **somente no ramo IO**: `start_mdho_assessment` → rascunho → submit (Supervisor) → approve/return (Liderança) até `AGUARDANDO_REGISTRO_IMS` — **sem** IMS, plano de ação nem notificações. MDHO **proibido** em Ver e Agir. Ordem UI: Evidências → Decisão VA/IO → InterdicaoSummary → MDHO → Timeline → Composer. Sprint 6/7 do roadmap permanecem IMS e plano de ação.

Decisões oficiais: `docs/decisions/MDHO-DECISIONS.md` (PO-MDHO-1…PO-MDHO-28).  
Especificação UI: `docs/decisions/MDHO-UI-SPEC.md`.

### Nota — Sub-sprint 2.7 (Aprovação HSE)

A **sub-sprint 2.7** operacionaliza a fase **Aprovação HSE** sobre o MDHO 2.6: fila `list_mdho_pending_approvals`, segregação submit≠approve, guard de autoaprovação (`SELF_APPROVAL_FORBIDDEN`), facade `features/hse-approval/` — **sem** nova entidade, **sem** IMS, notificações nem plano de ação. Herda e **não altera** `MDHO-DECISIONS.md` (PO-MDHO-7/12/19/20/27). Verificação: `docs/decisions/VERIFICATION-sprint-2.7-hse-approval.md`.

Decisões oficiais: `docs/decisions/HSE-APPROVAL-DECISIONS.md` (PO-HSE-1…PO-HSE-27).  
Especificação UI: `docs/decisions/HSE-APPROVAL-UI-SPEC.md`.

### Nota — Sub-sprint 2.8 (Referência IMS)

A **sub-sprint 2.8** entrega o **registro manual** do código IMS (`ims_reference_code`, formato BAA) após MDHO aprovado: `register_ims_reference` → `EM_TRATATIVA` e `update_ims_reference` com motivo — **sem** integração, consulta, sincronização ou validação no IMS externo; **sem** plano de ação nem notificações. Seção ausente no ramo Ver e Agir. Verificação: `docs/decisions/VERIFICATION-sprint-2.8-ims-reference.md`.

Decisões oficiais: `docs/decisions/IMS-REFERENCE-DECISIONS.md` (PO-IMS-1…PO-IMS-16).  
Especificação UI: `docs/decisions/IMS-REFERENCE-UI-SPEC.md`.

### Nota — Sub-sprint 2.9 (Consolidação e Hardening)

A **sub-sprint 2.9** **não** entrega domínio novo: consolida o fluxo operacional 2.0–2.8 (smoke IO integrado, detalhe canônico, query-keys, CI Supabase, UX de dead-ends). Dead-ends intencionais: ramo VA em `VER_E_AGIR` (validação/liberação futura) e ramo IO em `EM_TRATATIVA` (Plano de Ação futuro). **Sem** notificações (Sprint 3), plano de ação, liberação ou integração IMS. Contrato de eventos para Notificações futuras: `docs/decisions/CONSOLIDATION-DECISIONS.md` (PO-CON-21).

Decisões oficiais: `docs/decisions/CONSOLIDATION-DECISIONS.md` (PO-CON-1…PO-CON-22).

### Nota — Sub-sprint 3.0 (Plano de Ação)

A **sub-sprint 3.0** antecipa o **Plano de Ação estruturado** no ramo IO (`EM_TRATATIVA` + IMS registrado manualmente): `action_plans` / `action_items`, RPCs create→validate→complete plano — **sem** transição da ocorrência para `AGUARDANDO_VALIDACAO` (PO-AP-12), **sem** liberação/encerramento e **sem** notificações. Após `complete_action_plan`, ocorrência permanece `EM_TRATATIVA` até Sprint Liberação.

**Relação Sprint 7 (roadmap):** Sprint 7 lista Plano de Ação completo (dashboard SLA, filas HSE, offline avançado). A **3.0** entrega o núcleo operacional IO — mesma lógica das sub-sprints 2.6–2.8 ante Sprint 6.

Decisões oficiais: `docs/decisions/ACTION-PLAN-DECISIONS.md` (PO-AP-1…PO-AP-19).  
Especificação UI: `docs/decisions/ACTION-PLAN-UI-SPEC.md`.  
Verificação: `docs/decisions/VERIFICATION-sprint-3.0-action-plan.md`.

### Nota — Sub-sprint 3.1 (Notificações in-app)

A **sub-sprint 3.1** entrega o núcleo de **Comunicação in-app** do roadmap Sprint 3: `notification_events` + `notifications`, dispatch automático nos fluxos 2.0–3.0, central/sino web + mobile, leitura e ciência explícita. **Push**, `notification_deliveries` e `device_tokens` permanecem **fora**. Gestão de `organization_contacts` (web) usa `INSERT`/`UPDATE` RLS — **sem** RPC `upsert_organization_contact`.

Decisões: `docs/decisions/NOTIFICATIONS-DECISIONS.md` · UI: `docs/decisions/NOTIFICATIONS-UI-SPEC.md` · PO-CON-21 fechado em `CONSOLIDATION-DECISIONS.md`.

**Gates:** implementação e contratos documentados; **VERIFICATION-sprint-3.1** (QA G5) ainda **não** registrado — Sprint 3 macro permanece **parcial** até Push e verificação formal, se exigidos pelo critério de gate.

---

# Sprint 3

## Comunicação

Objetivo

Comunicar automaticamente todos os responsáveis.

Entregas

- Notification Events
- Push
- Notificações internas
- Ciência
- Histórico
- Destinatários automáticos

Critério

Todos recebem automaticamente.

**Nota:** sub-sprint **3.1** entrega Notification Events + Notificações internas + Ciência + Histórico + Destinatários automáticos (IN_APP). **Push** permanece pendente na Sprint 3 macro.

### Nota — Sub-sprint 3.2 (Dashboard operacional)

A **sub-sprint 3.2** antecipa o núcleo de **Dashboard** do roadmap Sprint 9: RPC `get_dashboard_kpis`, KPIs pessoais/operacionais/gerenciais, gráficos web, home mobile com pendências, drill-down para listagens. **Sem** materialized views, ranking avançado ou RPC dedicada de atenção a ações.

Decisões: `docs/decisions/DASHBOARD-DECISIONS.md` · UI: `docs/decisions/DASHBOARD-UI-SPEC.md`.  
Migrations: `20260820180000_dashboard_indexes.sql` · `20260820182000_create_dashboard_kpis_rpc.sql`.

**Gates:** scripts QA `qa-dashboard-3.2.mjs` / `smoke-dashboard-kpis.mjs` existem; **`VERIFICATION-sprint-3.2`** (DOCS pós-G5) **não** registrado — sub-sprint documentada como **entregue (contratos)**; gate QA formal pendente se exigido pelo fluxo de release.

### Nota — Sub-sprint 3.3 (Relatórios gerenciais) — **concluída**

A **sub-sprint 3.3** entrega três relatórios Web P0 (Ocorrências, Plano de Ação, Ciência): RPCs paginadas, exportação CSV/XLSX, auditoria `report_export_audit`, hub `/reports`. **Mobile fora** (PO-REP-5).

Decisões: [`docs/decisions/REPORTS-DECISIONS.md`](decisions/REPORTS-DECISIONS.md) · UI: [`docs/decisions/REPORTS-UI-SPEC.md`](decisions/REPORTS-UI-SPEC.md).

Migrations: `20260822190000_reports_indexes.sql` · `20260822191000_list_occurrences_report_rpc.sql` · `20260822192000_list_action_items_report_rpc.sql` · `20260822193000_list_awareness_report_rpc.sql` · `20260822194000_create_report_export_audit.sql` · `20260823180000_fix_report_resolve_helpers_authorization.sql` · `20260823200000_fix_report_rpc_require_report_read.sql`.

Validação: smokes `smoke-list-*-report.mjs`, `smoke-report-export-audit.mjs`, `qa-reports-3.3-web.mjs`, E2E `apps/web/e2e/reports.spec.ts`.

**Gate I (DOCS):** contratos documentados em `database.md`, `api.md`, `architecture.md` — liberado para commit da sprint.

### Nota — Sub-sprint 3.4 (UX/UI Convergence + Hardening) — **concluída**

A **sub-sprint 3.4** entrega convergência de navegação e tokens iniciais do design system: **Sidebar Web** (substitui top bar horizontal), **Bottom Navigation Mobile** (4 abas + FAB Nova PP), tokens em `@safestop/ui` (cores, spacing, radius, tipografia, estados) e hardening P0 (logout Web/Mobile, banner ciência no detalhe Web, indicador offline, `isPending` em confirmar ciência, cache tenant ao trocar org).

Decisões: [`docs/decisions/UX-CONVERGENCE-DECISIONS.md`](decisions/UX-CONVERGENCE-DECISIONS.md) · UI: [`docs/decisions/UX-CONVERGENCE-UI-SPEC.md`](decisions/UX-CONVERGENCE-UI-SPEC.md) · Verificação: [`docs/decisions/UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md`](decisions/UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md).

**Fora de escopo 3.4 (P1/P2 — backlog):** componentes visuais compartilhados (`Button`, `NavigationItem`, `Badge`, `Card`, `EmptyState`, `Skeleton`), reorganização visual do Dashboard, chips Nova PP Web, ícones formais Mobile, remoção rotas legadas `/occurrences/*`.

Validação: SECURITY (RBAC + cache F2) aprovado; QA bloqueantes QA-B1…B4 corrigidos; revalidação DOCS 2026-08-24 (`pnpm typecheck`, `pnpm --filter web test`, `qa-hse-01-20.mjs` 20/20).

**Gate I (DOCS):** `docs/design-system.md` atualizado (navegação real + tokens); fechamento em `UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md`.

---

# Sprint 4

## Avaliação

Objetivo

Permitir decisão da liderança.

Entregas

- Tela de avaliação
- Comentários
- Evidências
- Ver e Agir
- Interdição Oficial

Critério

Decisão registrada.

---

# Sprint 5

## Ver e Agir

Objetivo

Fluxo simplificado.

Entregas

- Correção
- Evidências
- Validação
- Liberação

Critério

Fluxo completo funcionando.

---

# Sprint 6

## Interdição Oficial

Objetivo

Fluxo completo de Interdição.

Entregas

- MDHO
- Aprovação
- Referência IMS
- Timeline

Critério

Interdição completa.

---

# Sprint 7

## Plano de Ação

Objetivo

Gerenciar ações corretivas.

Entregas

- Plano
- Responsáveis
- Prazo
- Evidências
- Conclusão
- Validação

Critério

Plano funcionando.

**Nota:** núcleo operacional IO (create → itens → validate → complete plano) entregue na **sub-sprint 3.0**. Sprint 7 permanece como entrega ampliada (SLA, dashboard, filas, offline avançado) conforme roadmap macro.

---

# Sprint 8

## Liberação

Objetivo

Permitir retorno seguro da atividade.

Entregas

- Checklist
- Validação
- Liberação
- Encerramento

Critério

Ocorrência encerrada.

---

# Sprint 9

## Dashboard

Objetivo

Criar indicadores.

Entregas

- KPIs
- Gráficos
- Empresas
- Áreas
- Criticidade
- Tempos médios
- Ranking

Critério

Dashboard completo.

**Nota:** núcleo operacional (RPC `get_dashboard_kpis`, KPIs N1–N3, gráficos web, home mobile) entregue na **sub-sprint 3.2**. Sprint 9 permanece como escopo ampliado (ranking, views/materialized, métricas avançadas).

---

# Sprint 10

## Auditoria

Objetivo

Garantir rastreabilidade.

Entregas

- Audit Log
- Histórico
- Timeline
- Alterações
- Exportações

Critério

Auditoria completa.

---

# Sprint 11

## PWA

Objetivo

Melhorar experiência Web.

Entregas

- Instalação
- Push Web
- Cache
- Atualizações

Critério

PWA funcionando.

---

# Sprint 12

## Offline

Objetivo

Permitir operação em campo.

Entregas

- Cadastro offline
- Sincronização
- Cache
- Upload posterior

Critério

Fluxo offline funcional.

---

# Sprint 13

## Produção

Objetivo

Preparação para publicação.

Entregas

- Refino UI
- Performance
- Segurança
- Testes finais
- Correções
- Monitoramento
- Deploy

Critério

Sistema pronto para produção.

---

# 4. Regras

Cada Sprint deverá possuir:

- objetivo;
- backlog;
- critérios de aceite;
- testes;
- documentação.

Nenhum Sprint deve quebrar funcionalidades existentes.

---

# 5. Critérios Gerais de Qualidade

Antes de concluir qualquer Sprint:

- Build sem erros
- TypeScript sem erros
- ESLint limpo
- Testes aprovados
- Documentação atualizada

---

# 6. Ordem Obrigatória

Sprint 0

↓

Sprint 1

↓

Sprint 2

↓

Sprint 3

↓

Sprint 4

↓

Sprint 5

↓

Sprint 6

↓

Sprint 7

↓

Sprint 8

↓

Sprint 9

↓

Sprint 10

↓

Sprint 11

↓

Sprint 12

↓

Sprint 13

Não inverter a ordem sem atualização oficial deste documento.

---

# 7. Meta Final

Ao término do Roadmap o SafeStop deverá ser capaz de:

- registrar Paralisações Preventivas;
- comunicar automaticamente todos os responsáveis;
- controlar Ver e Agir;
- controlar Interdições Oficiais;
- registrar MDHO;
- acompanhar planos de ação;
- registrar referência manual do IMS;
- controlar validações;
- liberar atividades;
- gerar indicadores;
- manter auditoria completa.

O produto deverá priorizar simplicidade, velocidade e segurança operacional.
