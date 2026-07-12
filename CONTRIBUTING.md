# Contributing to SafeStop

Antes de contribuir com o SafeStop, leia este documento por completo.

O objetivo deste guia é garantir que todas as contribuições mantenham os mesmos padrões de arquitetura, qualidade, segurança e documentação definidos para o projeto.

---

# Filosofia

O SafeStop é um software Enterprise voltado para Segurança do Trabalho em ambientes industriais.

Toda contribuição deve preservar os princípios fundamentais do projeto:

- Mobile First;
- Segurança em primeiro lugar;
- Simplicidade operacional;
- Rastreabilidade;
- Escalabilidade;
- Consistência;
- Qualidade de código;
- Documentação como fonte da verdade.

---

# Antes de Desenvolver

Antes de iniciar qualquer implementação, leia obrigatoriamente:

```text
README.md

↓

docs/product.md

↓

docs/workflow.md

↓

docs/architecture.md

↓

docs/database.md

↓

docs/engineering.md

↓

docs/design-system.md

↓

docs/roadmap.md
```

Caso exista conflito entre documentos, siga a ordem acima.

---

# Estrutura do Projeto

O SafeStop utiliza arquitetura baseada em monorepo.

```text
apps/
packages/
supabase/
docs/
research/
.cursor/
```

Cada módulo possui responsabilidades bem definidas.

Evite criar dependências desnecessárias entre módulos.

---

# Desenvolvimento

Toda funcionalidade deve seguir este fluxo:

```text
Requisito

↓

Validação do Product

↓

Workflow

↓

Arquitetura

↓

Implementação

↓

Testes

↓

Documentação

↓

Code Review

↓

Merge
```

Nunca implemente funcionalidades diretamente sem compreender o fluxo de negócio.

---

# Branches

Utilizar a seguinte convenção.

## Feature

```text
feature/nome-da-funcionalidade
```

Exemplo

```text
feature/mdho-approval
```

---

## Correção

```text
fix/nome-do-bug
```

---

## Hotfix

```text
hotfix/nome
```

---

## Refatoração

```text
refactor/nome
```

---

## Documentação

```text
docs/nome
```

---

# Commits

O projeto utiliza Conventional Commits.

Exemplos:

```text
feat: adiciona aprovação do MDHO

fix: corrige sincronização offline

docs: atualiza workflow

refactor: reorganiza módulo de notificações

test: adiciona testes do workflow

chore: atualiza dependências
```

Evite commits genéricos.

Exemplos incorretos:

```text
Update

Teste

Correções

Mudanças
```

---

# Pull Requests

Todo Pull Request deve conter:

- objetivo;
- descrição;
- impacto;
- screenshots quando necessário;
- testes executados;
- documentação atualizada.

---

# Code Review

Antes de solicitar revisão confirme:

- código limpo;
- lint sem erros;
- typecheck aprovado;
- testes executados;
- documentação atualizada.

---

# Documentação

A documentação faz parte do produto.

Sempre que alterar:

- arquitetura;
- workflow;
- banco;
- notificações;
- design system;
- componentes compartilhados;
- regras de negócio;

atualize o documento correspondente.

Nunca deixe código e documentação divergirem.

---

# Regras de Engenharia

Todo código deve seguir obrigatoriamente:

```text
docs/engineering.md
```

---

# Design System

Toda interface deve seguir:

```text
docs/design-system.md
```

Não criar componentes fora do padrão.

Sempre reutilizar componentes existentes.

---

# Workflow

Nenhum status poderá ser criado sem atualização do:

```text
docs/workflow.md
```

O Workflow é a fonte oficial para regras de negócio.

---

# Banco de Dados

Alterações estruturais exigem atualização de:

```text
docs/database.md
```

Sempre considerar:

- índices;
- RLS;
- triggers;
- funções;
- auditoria.

---

# Segurança

Nunca:

- confiar apenas no cliente;
- expor Service Role;
- remover RLS;
- armazenar segredos no repositório;
- desabilitar validações críticas.

Toda validação importante deve ocorrer no backend.

---

# Mobile First

Antes de considerar uma funcionalidade concluída, verificar:

- funciona em smartphone;
- funciona offline;
- funciona com conexão instável;
- funciona com apenas uma mão;
- possui feedback adequado.

---

# Responsividade

Toda interface deve funcionar em:

- smartphone;
- tablet;
- notebook;
- desktop.

---

# Acessibilidade

Todo componente deve possuir:

- labels;
- contraste;
- foco visível;
- navegação por teclado (Web);
- suporte a leitores de tela.

---

# Qualidade

Antes do merge executar:

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm test
```

```bash
pnpm build
```

Nenhum Pull Request deve ser aprovado com falhas.

---

# Testes

Priorizar:

- testes unitários;
- integração;
- E2E;
- testes manuais dos fluxos críticos.

Especial atenção para:

- autenticação;
- notificações;
- workflow;
- sincronização;
- offline;
- uploads.

---

# IA

O SafeStop utiliza agentes especializados.

Localização:

```text
.cursor/agents/
```

As Rules estão em:

```text
.cursor/rules/
```

Nunca ignore as Rules durante o desenvolvimento.

---

# ADRs

Mudanças arquiteturais relevantes devem gerar um novo ADR.

Localização:

```text
docs/decisions/
```

Toda decisão deve registrar:

- contexto;
- problema;
- alternativas;
- decisão;
- consequências.

---

# Dependências

Antes de adicionar uma nova dependência, verificar:

- já existe solução interna?
- existe biblioteca compartilhada?
- a dependência possui manutenção ativa?
- é realmente necessária?
- aumenta significativamente o bundle?

Evitar dependências desnecessárias.

---

# Performance

Sempre considerar:

- lazy loading;
- memoização quando necessária;
- cache;
- queries eficientes;
- redução de re-renderizações.

Nunca otimizar prematuramente.

---

# Boas Práticas

Sempre:

- escrever código legível;
- manter funções pequenas;
- reutilizar componentes;
- documentar decisões importantes;
- remover código morto;
- utilizar nomes claros.

Evitar:

- comentários desnecessários;
- duplicação;
- lógica espalhada;
- componentes gigantes;
- funções longas.

---

# Checklist Antes do Commit

- [ ] Código funcionando.
- [ ] Sem erros de TypeScript.
- [ ] Sem erros de lint.
- [ ] Componentes reutilizados.
- [ ] Design System respeitado.
- [ ] Workflow respeitado.
- [ ] Banco consistente.
- [ ] Documentação atualizada.

---

# Checklist Antes do Pull Request

- [ ] Build aprovado.
- [ ] Testes executados.
- [ ] Documentação revisada.
- [ ] Sem código comentado.
- [ ] Sem logs de debug.
- [ ] Sem arquivos temporários.
- [ ] Sem dependências desnecessárias.

---

# Checklist Antes do Merge

- [ ] Review aprovado.
- [ ] CI aprovado.
- [ ] ADR atualizado (quando necessário).
- [ ] Product atualizado (quando necessário).
- [ ] Workflow atualizado (quando necessário).
- [ ] Database atualizado (quando necessário).

---

# Regra Final

Toda contribuição deve responder positivamente às seguintes perguntas:

- Resolve um problema real?
- Está alinhada ao Product?
- Respeita o Workflow?
- Mantém a arquitetura?
- Segue o Engineering?
- Utiliza o Design System?
- Funciona em Mobile?
- Funciona em Web?
- Funciona offline quando necessário?
- Está documentada?
- É segura?
- É simples?
- É fácil de manter?

Se qualquer resposta for negativa, a implementação deve ser revisada antes do merge.

---

**Obrigado por contribuir com o SafeStop.**

Nossa prioridade é construir uma plataforma moderna, robusta e confiável para apoiar profissionais de Segurança do Trabalho em ambientes industriais.
