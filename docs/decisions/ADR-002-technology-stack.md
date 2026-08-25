# ADR-002 — Stack Tecnológica

**Status:** Aprovado (revisado Sprint 3.4 — 2026-08-25)

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
- React Native `StyleSheet` (estilização oficial)
- TanStack Query
- React Hook Form
- Zod

**NativeWind:** citado em versões anteriores deste ADR, **não adotado** no estado atual do produto. Decisão Sprint 3.4 ([`UI-STACK-AUDIT.md`](./UI-STACK-AUDIT.md) §16–17): manter StyleSheet + tokens `@safestop/ui`; adotar NativeWind exigiria refactor transversal sem ganho proporcional. **Documentado historicamente — rejeitado na implementação 3.4.**

---

## Web

- Next.js
- React
- TypeScript
- Tailwind CSS **v4**
- shadcn/ui — **primitives seletivos** vendored em `apps/web/src/components/ui`, tematizados com tokens SafeStop (`globals.css` + `@safestop/ui`; tema dark/grafite + laranja `#F97316`)
- Radix UI (via primitives shadcn) + `class-variance-authority`, `clsx`, `tailwind-merge`
- Lucide React (iconografia funcional Web — Sidebar, ações, estados)
- Recharts — **somente Dashboard** (`dashboard-charts.tsx`)
- Sonner — feedback **transitório** (ex.: “marcadas como lidas”); **não** substitui confirmação de ciência
- TanStack Table — relatórios gerenciais (sort/filtro/paginação)
- TanStack Query
- React Hook Form + Zod + **`@hookform/resolvers`** (formulários wired: Nova PP Web, Perfil Web)

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
- ui — **tokens e contratos TypeScript apenas** (`colors`, `spacing`, `radius`, `typography`, `componentStates`); primitives shadcn **não** vivem em `packages/ui`
- utils
- config
- query-keys

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

# Revisão — Sprint 3.4 (2026-08-25)

Alinhamento pós-implementação ([`UI-STACK-AUDIT.md`](./UI-STACK-AUDIT.md), [`UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md`](./UX-CONVERGENCE-IMPLEMENTATION-VERIFICATION.md)):

| Plataforma | Decisão 2026-07 | Estado implementado 3.4 |
| --- | --- | --- |
| **Web** | Next + Tailwind + shadcn (genérico) | Next 16 + Tailwind v4 + shadcn **seletivo** + Lucide + Recharts (Dashboard) + Sonner (transitório) + TanStack Table (Relatórios) + RHF/Zod/resolvers |
| **Mobile** | Expo + NativeWind | Expo + **StyleSheet**; **sem** NativeWind; tokens `@safestop/ui` importados onde aplicável (Bottom Nav, Perfil, Nova PP) |
| **`packages/ui`** | “quando aplicável” | **Somente tokens** — sem componentes React compartilhados |

Esta revisão **não** altera backend, workflow, RBAC nem domínio. Catálogo shadcn completo, NativeWind, `lucide-react-native` e avatar editável permanecem **fora** do escopo entregue (P1/P2).

---

# Resultado

O SafeStop adotará uma stack baseada em Expo, Next.js, Supabase e TypeScript, organizada em um Monorepo com pnpm Workspaces.

**Web:** primitives shadcn tematizados + Lucide + bibliotecas pontuais (Recharts, Sonner, TanStack Table) nos módulos que exigem complexidade real.

**Mobile:** StyleSheet nativo + tokens compartilhados — **sem** NativeWind no estado atual.

Essa decisão busca maximizar produtividade, compartilhamento de código, confiabilidade e capacidade de evolução, mantendo a simplicidade como princípio fundamental do projeto.
