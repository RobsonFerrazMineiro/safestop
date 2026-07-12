"O SafeStop não substitui os sistemas corporativos da empresa. Ele conecta pessoas, acelera a comunicação e acompanha toda a ocorrência até sua conclusão."

# 🛡️ SafeStop

<p align="center">

**Enterprise HSE Platform for Preventive Work Stoppages and Official Work Interdictions**

Mobile First • Industrial Safety • Enterprise • Resiliência Offline • Real-time • Audit Ready

</p>

---

# Sobre o Projeto

O **SafeStop** é uma plataforma Enterprise desenvolvida para apoiar profissionais de **Segurança do Trabalho (HSE)** na comunicação, gestão e acompanhamento de **Paralisações Preventivas** e **Interdições Oficiais** em ambientes industriais.

O sistema foi concebido para reduzir o tempo entre a identificação de um risco e a comunicação às partes envolvidas, aumentando a rastreabilidade, a padronização dos processos e a velocidade da tomada de decisão.

Ao contrário de sistemas tradicionais focados apenas em registros administrativos, o SafeStop foi projetado para apoiar a operação em campo, respeitando a realidade dos profissionais que atuam em refinarias, mineradoras, indústrias metalúrgicas, fábricas e grandes plantas industriais.

---

# Objetivo

O principal objetivo do SafeStop é permitir que qualquer profissional autorizado consiga registrar uma situação de risco em poucos segundos, comunicar automaticamente as partes envolvidas e conduzir toda a tratativa até a liberação segura da atividade.

O sistema busca:

- reduzir o tempo de comunicação;
- aumentar a rastreabilidade;
- padronizar decisões;
- documentar todo o processo;
- facilitar auditorias;
- apoiar lideranças;
- reduzir retrabalho;
- operar mesmo com conexão limitada;
- oferecer uma experiência moderna e intuitiva.

---

# Filosofia do Produto

O SafeStop foi construído sobre cinco pilares fundamentais.

## 🛡 Segurança

Toda decisão da plataforma deve priorizar a segurança das pessoas.

---

## 📱 Mobile First

O aplicativo mobile é o centro operacional do sistema.

Todo novo recurso é concebido primeiro para smartphones e somente depois adaptado ao painel Web.

---

## ⚡ Simplicidade Operacional

Registrar uma ocorrência deve ser simples.

O sistema deve reduzir:

- tempo;
- toques;
- cliques;
- campos obrigatórios;
- burocracia.

---

## 🔍 Rastreabilidade

Toda ação realizada dentro do sistema deve ser rastreável.

O histórico operacional deve permitir auditorias completas.

---

## 🏭 Ambiente Industrial

Toda a identidade visual, fluxos e funcionalidades foram desenvolvidos considerando a realidade operacional de ambientes industriais.

---

# Principais Funcionalidades

## Comunicação de Paralisações Preventivas

Registro rápido de situações inseguras diretamente pelo dispositivo móvel.

---

## Interdição Oficial

Fluxo completo para formalização de interdições operacionais.

---

## Workflow Inteligente

Fluxo operacional baseado em estados controlados.

```text
Paralisação Preventiva

↓

Em Avaliação

↓

Ver e Agir

ou

Interdição Oficial

↓

MDHO

↓

Aprovação HSE

↓

Registro Manual IMS

↓

Tratativa

↓

Validação

↓

Liberação

↓

Encerramento
```

---

## MDHO

Registro estruturado da análise de desvios utilizando categorias padronizadas.

---

## Plano de Ação

Controle das ações corretivas até a conclusão das tratativas.

---

## Evidências

Suporte ao envio de:

- fotografias;
- documentos;
- anexos relacionados à ocorrência.

---

## Timeline

Histórico completo de toda a vida útil da ocorrência.

---

## Auditoria

Registro detalhado de todas as alterações realizadas no sistema.

---

## Notificações

Envio automático de notificações conforme o Workflow.

---

## Resiliência e Offline

O aplicativo é resiliente a conexões instáveis e preserva localmente os dados digitados para evitar perdas.

O suporte offline completo é uma evolução gradual: a arquitetura é preparada para essa evolução, sem prometer operação offline plena no MVP.

Quando a conexão retornar, os dados são sincronizados de forma segura e transparente.

---

## Painel Web

Interface voltada para:

- gestores;
- supervisores;
- HSE;
- administração;
- auditoria.

---

# Público-Alvo

O SafeStop foi desenvolvido para:

- Técnicos de Segurança do Trabalho;
- Engenheiros de Segurança;
- Supervisores;
- Coordenadores HSE;
- Gestores Industriais;
- Fiscalização;
- Empresas contratadas;
- Grandes plantas industriais.

---

# Arquitetura Geral

O SafeStop utiliza arquitetura moderna baseada em monorepo.

```text
                SafeStop

                    │

        ┌───────────┴───────────┐

        │                       │

   Mobile App              Web Dashboard

        │                       │

        └───────────┬───────────┘

                    │

               Supabase

      Auth • Database • Storage

           Realtime • Edge Functions
```

---

# Stack Oficial

## Frontend Mobile

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind
- React Hook Form
- TanStack Query
- Zustand (opcional, apenas quando necessário)

---

## Frontend Web

- Next.js
- App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query

---

## Backend

- Supabase
- PostgreSQL
- Edge Functions
- Row Level Security
- Storage
- Realtime

---

## Infraestrutura

- pnpm Workspaces
- Turborepo
- GitHub
- Vercel
- Expo Application Services (EAS)

---

# Estrutura do Projeto

```text
SafeStop/

├── apps/
│   ├── mobile/
│   └── web/
│
├── packages/
│   ├── config/
│   ├── types/
│   ├── validation/
│   ├── utils/
│   └── ui/
│
├── docs/
│
├── reference/
│
├── scripts/
│
├── supabase/
│
└── .cursor/
```

---

# Estrutura da Documentação

Toda a documentação oficial encontra-se na pasta:

```text
docs/
```

Documentos principais:

```text
product.md
architecture.md
database.md
workflow.md
engineering.md
notifications.md
design-system.md
roadmap.md
```

---

# Arquitetura de Decisões

As decisões arquiteturais relevantes são registradas em:

```text
docs/decisions/
```

Cada decisão utiliza o padrão ADR (Architecture Decision Record).

Exemplos:

```text
ADR-001
ADR-002
ADR-003
ADR-004
ADR-005
```

---

# Filosofia de Desenvolvimento

Todo desenvolvimento do SafeStop segue alguns princípios fundamentais.

## Mobile First

Toda funcionalidade nasce primeiro para o aplicativo.

---

## Backend como Fonte da Verdade

Toda regra crítica é validada no backend.

O cliente nunca é considerado autoridade.

---

## Simplicidade

Sempre escolher a solução mais simples que resolva corretamente o problema.

---

## Componentização

Componentes reutilizáveis são priorizados em relação a implementações específicas.

---

## Segurança

Segurança é requisito funcional.

Nunca um detalhe opcional.

---

## Escalabilidade

Toda implementação deve considerar crescimento futuro do sistema sem comprometer a manutenção.

---

# Estado Atual do Projeto

O SafeStop encontra-se em desenvolvimento ativo.

As funcionalidades são implementadas conforme o roadmap oficial.

Todo desenvolvimento é guiado por documentação técnica, ADRs, Rules e agentes especializados.

---

# Próximos Passos

Consulte:

```text
docs/roadmap.md
```

para acompanhar a evolução planejada do projeto.

---

---

# Instalação

## Pré-requisitos

Antes de iniciar o desenvolvimento do SafeStop, certifique-se de possuir as seguintes ferramentas instaladas.

## Node.js

Versão recomendada:

```text
>= 22.x
```

---

## pnpm

O projeto utiliza exclusivamente **pnpm** como gerenciador de pacotes.

Versão recomendada:

```text
>= 10.x
```

Caso utilize Corepack:

```bash
corepack enable
```

---

## Git

Versão recomendada:

```text
>= 2.45
```

---

## Expo CLI

Necessário para desenvolvimento Mobile.

```bash
pnpm dlx expo --version
```

---

## Android Studio

Necessário para:

- Android Emulator
- SDK Android
- Debug

---

## Xcode

Necessário apenas para desenvolvimento iOS em macOS.

---

# Clonando o Projeto

```bash
git clone https://github.com/<organization>/safestop.git

cd safestop
```

---

# Instalando Dependências

```bash
pnpm install
```

---

# Estrutura do Monorepo

O SafeStop utiliza **pnpm Workspaces** para organizar múltiplas aplicações e bibliotecas compartilhadas.

```text
SafeStop/

apps/
packages/
docs/
reference/
scripts/
supabase/
```

Essa estrutura reduz duplicação de código e facilita manutenção.

---

# Configuração do Ambiente

Cada aplicação possui seu próprio arquivo de configuração.

Exemplo:

```text
apps/mobile/.env

apps/web/.env
```

Jamais versionar arquivos contendo segredos.

---

# Variáveis de Ambiente

## Mobile

Exemplo:

```env
EXPO_PUBLIC_SUPABASE_URL=

EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Web

Exemplo:

```env
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Backend

Variáveis privadas devem permanecer apenas no ambiente do Supabase.

Nunca expor:

- Service Role
- Secrets
- Tokens administrativos
- Credenciais privadas

---

# Banco de Dados

O banco oficial do projeto é:

```text
PostgreSQL
```

Hospedado através do:

```text
Supabase
```

Toda estrutura do banco encontra-se documentada em:

```text
docs/database.md
```

---

# Executando o Projeto

## Mobile

```bash
pnpm --filter mobile dev
```

ou

```bash
pnpm --filter mobile start
```

---

## Android

```bash
pnpm --filter mobile android
```

---

## iOS

```bash
pnpm --filter mobile ios
```

---

## Web

```bash
pnpm --filter web dev
```

---

# Build

## Mobile

```bash
pnpm --filter mobile build
```

ou através do EAS.

---

## Web

```bash
pnpm --filter web build
```

---

# Scripts Principais

## Instalar dependências

```bash
pnpm install
```

---

## Atualizar dependências

```bash
pnpm update
```

---

## Lint

```bash
pnpm lint
```

---

## Type Check

```bash
pnpm typecheck
```

---

## Testes

```bash
pnpm test
```

---

## Build Geral

```bash
pnpm build
```

---

## Formatação

```bash
pnpm format
```

---

# Estrutura das Aplicações

## apps/mobile

Aplicativo oficial utilizado em campo.

Responsável por:

- registro de ocorrências;
- comunicação;
- notificações;
- operação offline;
- captura de evidências;
- geolocalização;
- acompanhamento.

---

## apps/web

Painel administrativo.

Responsável por:

- dashboards;
- relatórios;
- avaliações;
- administração;
- auditoria;
- gestão de usuários;
- gestão organizacional.

---

# Estrutura dos Packages

## packages/ui

Componentes compartilhados.

Exemplos:

- Buttons
- Inputs
- Cards
- Badges
- Dialogs

---

## packages/types

Tipos compartilhados.

Interfaces.

Enums.

DTOs.

---

## packages/validation

Schemas Zod compartilhados.

---

## packages/utils

Funções utilitárias independentes de plataforma.

Helpers.

Formatações.

Constantes.

---

## packages/config

Configurações compartilhadas entre aplicações.

---

# Organização da Documentação

Toda documentação oficial está localizada em:

```text
docs/
```

---

## Product

```text
docs/product.md
```

Define:

- visão;
- escopo;
- funcionalidades;
- objetivos.

---

## Workflow

```text
docs/workflow.md
```

Define todo o fluxo operacional.

---

## Architecture

```text
docs/architecture.md
```

Define:

- arquitetura;
- responsabilidades;
- comunicação entre módulos.

---

## Database

```text
docs/database.md
```

Documenta:

- tabelas;
- relações;
- RLS;
- índices;
- funções;
- triggers.

---

## Engineering

```text
docs/engineering.md
```

Define:

- padrões de código;
- organização;
- stack;
- arquitetura técnica.

---

## Notifications

```text
docs/notifications.md
```

Documenta:

- notificações;
- push;
- ciência;
- prioridades.

---

## Design System

```text
docs/design-system.md
```

Fonte oficial para:

- componentes;
- cores;
- tipografia;
- UX;
- UI;
- acessibilidade.

---

## Roadmap

```text
docs/roadmap.md
```

Planejamento oficial do projeto.

---

# Reference

A pasta:

```text
reference/
```

armazena:

- referências;
- estudos;
- materiais Base44;
- benchmarking;
- pesquisas.

Esses materiais servem apenas como apoio.

A documentação oficial sempre prevalece.

---

# Decisions (ADRs)

As decisões arquiteturais ficam em:

```text
docs/decisions/
```

Cada ADR registra:

- contexto;
- decisão;
- consequências;
- alternativas avaliadas.

---

# Cursor

Toda configuração da IA encontra-se em:

```text
.cursor/
```

Organizada em:

```text
rules/

agents/
```

Esses arquivos orientam o comportamento da IA durante o desenvolvimento.

---

# Fonte Oficial

Em caso de conflito entre documentos, a prioridade é:

```text
Product

↓

Workflow

↓

Architecture

↓

Engineering

↓

Database

↓

Design System

↓

Roadmap
```

Essa ordem deve ser respeitada por desenvolvedores e agentes de IA.

---

# Atualização da Documentação

Sempre que uma mudança alterar:

- arquitetura;
- workflow;
- banco;
- regras de negócio;
- design system;
- componentes compartilhados;

a documentação correspondente deve ser atualizada antes do merge.

A documentação faz parte do produto.

Ela nunca deve ficar desatualizada.

---

---

# Fluxo de Desenvolvimento

Todo desenvolvimento do SafeStop deve seguir um processo padronizado para garantir qualidade, rastreabilidade e consistência.

O fluxo oficial é:

```text
Product

↓

Architecture

↓

Database

↓

Workflow

↓

Engineering

↓

Implementação

↓

Testes

↓

Code Review

↓

Merge

↓

Release
```

Nenhuma funcionalidade deve ser implementada sem antes existir uma definição clara no **Product** e no **Workflow**.

---

# Processo de Desenvolvimento

Cada nova funcionalidade deve seguir a seguinte sequência:

1. Definição do requisito.
2. Validação do impacto arquitetural.
3. Atualização da documentação, quando necessário.
4. Implementação.
5. Testes.
6. Revisão de código.
7. Atualização da documentação.
8. Merge.
9. Deploy.

---

# Arquitetura de Decisões (ADR)

Todas as decisões arquiteturais importantes devem ser registradas em:

```text
docs/decisions/
```

Atualmente o projeto possui:

```text
ADR-001
Arquitetura Geral

ADR-002
Stack Tecnológica

ADR-003
Estratégia de Comunicação

ADR-004
Mobile First

ADR-005
Simplicidade Operacional
```

Novas decisões que impactem significativamente o projeto deverão gerar novos ADRs.

---

# Cursor Rules

O comportamento da IA é controlado pelas Rules localizadas em:

```text
.cursor/rules/
```

Rules disponíveis:

```text
000-project.mdc
001-typescript.mdc
002-react-native.mdc
003-nextjs.mdc
004-supabase.mdc
005-ui.mdc
006-security.mdc
007-testing.mdc
008-product.mdc
009-workflow.mdc
010-engineering.mdc
011-ai-behavior.mdc
012-monorepo.mdc
```

Essas Rules garantem que todas as implementações permaneçam alinhadas com os padrões definidos para o SafeStop.

---

# Agentes Especializados

O projeto utiliza agentes especializados para dividir responsabilidades durante o desenvolvimento.

Localização:

```text
.cursor/agents/
```

Agentes disponíveis:

```text
MASTER

ARCHITECT

BACKEND

DATABASE

WEB

MOBILE

QA

UIUX
```

Cada agente possui responsabilidades específicas e documentação própria.

---

# Organização das Branches

Estratégia recomendada:

```text
main
```

Produção.

```text
develop
```

Integração das funcionalidades.

```text
feature/*
```

Novas funcionalidades.

```text
fix/*
```

Correções.

```text
hotfix/*
```

Correções urgentes em produção.

---

# Convenção de Commits

Seguir o padrão Conventional Commits.

Exemplos:

```text
feat: adiciona fluxo de aprovação do MDHO

fix: corrige sincronização offline

refactor: reorganiza estrutura de notificações

docs: atualiza workflow

test: adiciona testes de autenticação

chore: atualiza dependências
```

---

# Pull Requests

Todo Pull Request deve:

- possuir descrição;
- explicar o objetivo;
- listar alterações realizadas;
- informar impactos;
- informar testes executados;
- referenciar issues quando existirem.

Antes do merge verificar:

- documentação atualizada;
- testes aprovados;
- lint aprovado;
- typecheck aprovado;
- build aprovado.

---

# Qualidade

Antes de concluir qualquer funcionalidade verificar:

- funcionamento;
- segurança;
- responsividade;
- acessibilidade;
- performance;
- consistência visual;
- workflow;
- auditoria;
- notificações;
- sincronização.

---

# Testes

O projeto utiliza múltiplos níveis de testes.

## Testes Unitários

Responsáveis por validar:

- funções;
- componentes;
- utilitários.

---

## Testes de Integração

Validam comunicação entre módulos.

---

## Testes End-to-End

Validam os principais fluxos operacionais.

---

## Testes Manuais

Toda funcionalidade crítica deve ser validada manualmente.

Especialmente:

- autenticação;
- notificações;
- workflow;
- offline;
- sincronização;
- uploads;
- permissões.

---

# Segurança

A segurança é um requisito funcional do SafeStop.

Todo desenvolvimento deve respeitar:

- autenticação;
- autorização;
- RLS;
- isolamento por organização;
- auditoria;
- proteção de dados sensíveis.

Nunca confiar em validações realizadas apenas no cliente.

---

# Mobile First

Toda nova funcionalidade deve considerar inicialmente o aplicativo Mobile.

O painel Web complementa a operação.

Ele não substitui o fluxo operacional de campo.

---

# Filosofia Enterprise

O SafeStop foi desenvolvido para ambientes industriais críticos.

Toda implementação deve priorizar:

- robustez;
- previsibilidade;
- simplicidade;
- rastreabilidade;
- facilidade de auditoria;
- manutenção.

Evitar soluções excessivamente complexas.

---

# Documentação

A documentação faz parte do produto.

Sempre que uma alteração modificar:

- regras de negócio;
- banco de dados;
- arquitetura;
- workflow;
- componentes compartilhados;
- design system;

o documento correspondente deve ser atualizado.

Código e documentação devem evoluir juntos.

---

# Contribuindo

Antes de iniciar uma nova implementação:

1. Leia o README.
2. Consulte o Product.
3. Consulte o Workflow.
4. Consulte a Architecture.
5. Consulte a Engineering.
6. Consulte as Rules.
7. Consulte os ADRs.

Não implemente funcionalidades apenas com base em suposições.

---

# Roadmap

A evolução do projeto é documentada em:

```text
docs/roadmap.md
```

O roadmap representa o planejamento oficial do SafeStop e deve orientar a priorização das funcionalidades.

---

# Licença

A licença do projeto será definida conforme a estratégia de distribuição do SafeStop.

Até definição formal, todos os direitos permanecem reservados ao projeto.

---

# Agradecimentos

Este projeto é resultado da integração entre conhecimento em:

- Segurança do Trabalho;
- Engenharia;
- Desenvolvimento de Software;
- Arquitetura de Sistemas;
- Experiência do Usuário;
- Inteligência Artificial.

A documentação foi estruturada para servir como fonte única de verdade para toda a equipe de desenvolvimento e para agentes de IA utilizados durante a evolução do produto.

---

# Fonte da Verdade

Sempre que houver dúvida, a prioridade de consulta é:

```text
README

↓

Product

↓

Workflow

↓

Architecture

↓

Database

↓

Engineering

↓

Design System

↓

Roadmap

↓

ADRs

↓

Rules

↓

Agents
```

Essa ordem garante que decisões técnicas permaneçam alinhadas aos objetivos do produto.

---

# Visão de Futuro

O SafeStop foi concebido para evoluir de uma plataforma de comunicação de Paralisações Preventivas para um ecossistema completo de gestão operacional em Segurança do Trabalho, mantendo como princípios permanentes:

- 🛡 Segurança em primeiro lugar;
- 📱 Mobile First;
- 🏭 Foco na indústria;
- ⚡ Simplicidade operacional;
- 📋 Rastreabilidade completa;
- 🤝 Colaboração entre equipes;
- 🚀 Evolução contínua.

---

<p align="center">

**SafeStop**

_Enterprise HSE Platform_

**Built with ❤️ for Industrial Safety**

</p>
