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
