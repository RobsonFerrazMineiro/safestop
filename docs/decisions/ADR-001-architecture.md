# ADR-001 — Arquitetura do SafeStop

**Status:** Aprovado

**Data:** 2026-07-11

**Responsáveis:** Equipe SafeStop

---

# Contexto

O SafeStop é uma plataforma voltada para comunicação rápida de Paralisações Preventivas e Interdições de atividades em ambientes industriais.

O principal usuário da aplicação é o profissional de HSE que atua em campo, normalmente utilizando um dispositivo móvel, muitas vezes sob condições de conectividade limitada.

Desde o início do projeto foi definido que o sistema deveria ser:

- Mobile First;
- simples de utilizar;
- rápido para registrar uma ocorrência;
- altamente rastreável;
- seguro;
- preparado para crescimento.

Além disso, a aplicação possuirá também um painel Web para utilização por lideranças, supervisores e gestores.

Era necessário definir uma arquitetura que permitisse evolução contínua sem criar duplicação de regras entre Mobile e Web.

---

# Decisão

Foi adotada uma arquitetura baseada em Monorepo utilizando pnpm Workspaces.

A solução será composta por duas aplicações principais:

- Aplicativo Mobile (Expo + React Native);
- Painel Web (Next.js).

Ambas compartilharão bibliotecas internas sempre que possível.

A lógica de negócio crítica permanecerá centralizada no backend através do Supabase, utilizando:

- PostgreSQL;
- Row Level Security (RLS);
- Authentication;
- Storage;
- Realtime;
- Edge Functions quando realmente necessárias.

O frontend nunca será considerado a fonte oficial das regras de negócio.

Toda validação crítica deverá ocorrer no backend.

---

# Motivação

Esta arquitetura foi escolhida porque oferece:

- compartilhamento de código entre plataformas;
- menor custo de manutenção;
- crescimento organizado;
- alta produtividade;
- boa integração com Supabase;
- excelente suporte ao Expo e Next.js;
- facilidade para futuras integrações.

Também reduz o risco de comportamentos diferentes entre Mobile e Web.

---

# Consequências

## Positivas

- Base única de documentação.
- Compartilhamento de tipos.
- Compartilhamento de validações.
- Compartilhamento de modelos.
- Evolução consistente entre plataformas.
- Menor retrabalho.
- Arquitetura preparada para crescimento.

## Negativas

- Exige maior organização inicial.
- Necessita disciplina na separação das responsabilidades.
- Requer documentação atualizada para evitar divergências.

Esses custos são considerados aceitáveis diante dos benefícios obtidos.

---

# Alternativas Avaliadas

## Repositórios separados

Foi descartado porque aumentaria:

- duplicação;
- manutenção;
- inconsistências;
- retrabalho.

---

## Backend próprio em Node.js

Foi descartado para a primeira versão.

O Supabase atende plenamente às necessidades atuais da aplicação.

Caso futuramente exista necessidade de processamento mais complexo ou integrações específicas, um backend dedicado poderá ser introduzido sem alterar a arquitetura geral.

---

## React Native CLI

Foi descartado em favor do Expo.

O Expo oferece melhor produtividade, excelente suporte ao ecossistema React Native e integração direta com recursos como:

- Push Notifications;
- EAS Build;
- EAS Update;
- Camera;
- Location;
- Secure Storage.

---

# Decisões relacionadas

- ADR-002 — Stack Tecnológica
- ADR-003 — Arquitetura de Comunicação
- ADR-004 — Mobile First
- ADR-005 — Simplicidade Operacional

---

# Resultado

Esta decisão estabelece que o SafeStop utilizará uma arquitetura Mobile First baseada em Monorepo, Expo, Next.js e Supabase, priorizando simplicidade, compartilhamento de código, rastreabilidade e escalabilidade, mantendo todas as regras críticas centralizadas no backend.
