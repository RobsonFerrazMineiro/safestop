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
