# ADR-002 — Stack Tecnológica

**Status:** Aprovado

**Data:** 2026-07-11

**Responsáveis:** Equipe SafeStop

---

# Contexto

O SafeStop é uma aplicação operacional voltada para uso em campo, onde velocidade, simplicidade e confiabilidade são fatores críticos.

A aplicação deverá possuir duas interfaces:

- Aplicativo Mobile para profissionais de campo;
- Painel Web para supervisores, gestores e administradores.

Era necessário selecionar uma stack moderna, produtiva e com excelente suporte a aplicações multiplataforma, minimizando a duplicação de código e reduzindo custos de manutenção.

Além disso, a solução deveria ser compatível com uma arquitetura baseada em Monorepo.

---

# Decisão

Foi definida a seguinte stack oficial para o SafeStop.

## Monorepo

- pnpm Workspaces

Responsável pelo gerenciamento do monorepo, compartilhamento de pacotes e organização do projeto.

---

## Mobile

- Expo
- React Native
- TypeScript
- Expo Router
- NativeWind
- TanStack Query
- React Hook Form
- Zod

---

## Web

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

---

## Backend

- Supabase

Utilizando:

- PostgreSQL
- Authentication
- Storage
- Realtime
- Row Level Security
- Edge Functions (quando necessário)

---

## Compartilhamento

Pacotes compartilhados entre Mobile e Web:

- types
- validation
- ui (quando aplicável)
- utils
- config

---

## Ferramentas

- Git
- GitHub
- Cursor
- Codex
- VS Code
- EAS Build
- Vercel

---

# Motivação

A stack foi escolhida pelos seguintes motivos:

- alta produtividade;
- excelente documentação;
- grande comunidade;
- manutenção simplificada;
- tipagem forte;
- compartilhamento entre plataformas;
- integração direta com Supabase;
- suporte oficial do Expo;
- facilidade para crescimento futuro.

---

# Tecnologias Avaliadas

## React Native CLI

Foi descartado.

Motivos:

- maior complexidade de configuração;
- manutenção nativa mais trabalhosa;
- menor produtividade para uma equipe pequena;
- maior custo de atualização.

O Expo atende completamente às necessidades atuais do projeto.

---

## Flutter

Foi avaliado.

Motivos para não adoção:

- duplicação de conhecimento entre Web e Mobile;
- menor reaproveitamento de código;
- necessidade de manter duas stacks distintas;
- equipe já possui experiência em React.

---

## Backend Node.js

Foi avaliado.

Foi decidido não criar um backend dedicado na primeira versão.

O Supabase oferece todos os recursos necessários para:

- autenticação;
- banco de dados;
- autorização;
- armazenamento;
- comunicação em tempo real;
- processamento server-side.

Um backend dedicado poderá ser incorporado futuramente caso exista necessidade operacional.

---

## Firebase

Foi avaliado.

Foi descartado devido a:

- preferência por PostgreSQL relacional;
- maior aderência do Supabase ao ecossistema SQL;
- facilidade de modelagem relacional;
- Row Level Security nativa;
- melhor integração com TypeScript.

---

## Zustand

Foi avaliado.

Foi decidido não utilizá-lo inicialmente.

Grande parte do estado da aplicação será:

- Server State (TanStack Query);
- Estado de formulário (React Hook Form);
- Estado local do React.

Uma biblioteca adicional de gerenciamento global será adicionada apenas se surgir necessidade real.

---

# Consequências

## Positivas

- Arquitetura moderna.
- Código compartilhado.
- Excelente experiência de desenvolvimento.
- Facilidade de contratação de desenvolvedores.
- Redução de duplicidade.
- Crescimento organizado.
- Menor custo de manutenção.

## Negativas

- Dependência do ecossistema Supabase.
- Necessidade de organização do Monorepo.
- Curva inicial de configuração maior.

Esses impactos são considerados aceitáveis.

---

# Princípios

A escolha da stack segue os seguintes princípios:

- simplicidade acima da complexidade;
- produtividade acima da burocracia;
- tipagem forte;
- compartilhamento de código;
- documentação como fonte da verdade;
- Mobile First;
- segurança por padrão.

---

# Revisão futura

A stack somente deverá ser alterada quando existir um benefício técnico claramente demonstrado.

Mudanças por preferência pessoal ou tendência de mercado não justificam substituições.

Toda alteração estrutural deverá gerar um novo ADR.

---

# Decisões relacionadas

- ADR-001 — Arquitetura do SafeStop
- ADR-003 — Arquitetura de Comunicação
- ADR-004 — Mobile First
- ADR-005 — Simplicidade Operacional

---

# Resultado

O SafeStop adotará uma stack baseada em Expo, Next.js, Supabase e TypeScript, organizada em um Monorepo com pnpm Workspaces.

Essa decisão busca maximizar produtividade, compartilhamento de código, confiabilidade e capacidade de evolução, mantendo a simplicidade como princípio fundamental do projeto.
