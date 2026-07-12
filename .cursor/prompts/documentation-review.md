# Documentation Review

## Objetivo

Executar uma auditoria completa da documentação do projeto SafeStop.

Sua missão é garantir que toda a documentação permaneça consistente, padronizada, atualizada e alinhada com a arquitetura oficial do projeto.

Você deve utilizar as responsabilidades definidas no agente **DOCS**.

---

# Escopo

Leia integralmente:

```text
README.md

CONTRIBUTING.md

docs/**/*

.cursor/rules/**/*

.cursor/agents/**/*
```

Caso existam novos documentos, eles também devem ser incluídos na revisão.

---

# Fonte da Verdade

Sempre respeite a seguinte ordem de prioridade:

```text
README.md

↓

docs/product.md

↓

docs/workflow.md

↓

docs/architecture.md

↓

docs/engineering.md

↓

docs/database.md

↓

docs/api.md

↓

docs/design-system.md

↓

docs/roadmap.md

↓

docs/glossary.md

↓

docs/decisions/*
```

Caso exista conflito entre documentos, utilize sempre o documento de maior prioridade como referência.

Nunca altere ADRs para resolver inconsistências.

---

# Auditoria

Execute as verificações abaixo.

---

## 1. Consistência Terminológica

Verifique se toda a documentação utiliza exatamente a mesma terminologia.

Exemplos:

- Paralisação Preventiva
- Interdição Oficial
- Ver e Agir
- MDHO
- Referência IMS
- Organização
- Plano de Ação
- Workflow
- Ocorrência
- Evidência

Não devem existir sinônimos para termos oficiais.

Caso encontre, proponha padronização.

---

## 2. Consistência do Workflow

Compare principalmente:

- workflow.md
- product.md
- architecture.md
- engineering.md
- api.md
- notifications.md

Confirme que:

- status;
- transições;
- responsabilidades;
- notificações;
- permissões;

estão idênticos.

---

## 3. Consistência Arquitetural

Confirme que:

- architecture.md
- engineering.md
- api.md
- database.md

descrevem exatamente a mesma arquitetura.

Validar:

- Supabase
- Server Actions
- Edge Functions
- Services
- DTOs
- TanStack Query
- Offline
- Realtime
- Monorepo
- RLS

---

## 4. Banco de Dados

Verifique:

- entidades
- relacionamentos
- nomenclatura
- tabelas
- campos
- enums

Confirme que database.md está consistente com workflow.md e api.md.

---

## 5. API

Verifique:

- DTOs
- Responses
- Requests
- autenticação
- autorização
- paginação
- uploads
- realtime
- sincronização offline

---

## 6. Design System

Compare:

- design-system.md
- engineering.md
- product.md

Verifique:

- cores
- tipografia
- componentes
- tokens
- Mobile First
- acessibilidade

---

## 7. README

Confirme que:

- todos os documentos importantes estão referenciados;
- a estrutura do projeto está atualizada;
- links internos funcionam.

---

## 8. CONTRIBUTING

Confirme alinhamento com:

- README
- Engineering
- Rules

---

## 9. Glossário

Verifique se todos os termos oficiais utilizados na documentação existem em:

```text
docs/glossary.md
```

Caso algum termo esteja ausente, proponha inclusão.

---

## 10. ADRs

Verifique se algum documento contradiz decisões registradas.

Nunca altere ADRs.

Caso exista conflito:

- informe;
- proponha correção no documento correspondente.

---

## 11. Rules

Verifique se as Rules permanecem compatíveis com a documentação.

---

## 12. Agents

Verifique se as responsabilidades dos agentes continuam coerentes com a documentação atual.

---

## 13. Markdown

Corrija:

- títulos;
- hierarquia;
- listas;
- tabelas;
- blocos de código;
- links;
- espaçamentos;
- formatação.

---

## 14. Português

Corrija:

- ortografia;
- concordância;
- pontuação;
- padronização de linguagem.

---

## 15. Duplicações

Identifique:

- capítulos repetidos;
- informações duplicadas;
- conceitos repetidos.

Sempre que possível, mantenha apenas uma fonte oficial e utilize referências cruzadas.

---

# Restrições

Nunca:

- invente funcionalidades;
- altere regras de negócio;
- altere o Workflow;
- modifique arquitetura sem necessidade;
- altere ADRs;
- altere decisões de produto.

Apenas corrija inconsistências documentais.

---

# Processo de Execução

Antes de modificar qualquer arquivo:

1. Leia toda a documentação.

2. Gere um relatório contendo todas as inconsistências encontradas.

3. Agrupe as inconsistências por documento.

4. Explique cada correção proposta.

5. Aguarde aprovação.

Somente após aprovação:

- aplique todas as correções;
- atualize os documentos necessários;
- mantenha consistência entre eles.

---

# Commit

Após concluir todas as alterações aprovadas, realize apenas um commit utilizando Conventional Commits.

Mensagem:

```text
docs: revisão geral e padronização da documentação
```

Não realize múltiplos commits.

---

# Resultado Esperado

Ao finalizar, entregue:

- resumo executivo da auditoria;
- documentos analisados;
- inconsistências encontradas;
- documentos modificados;
- melhorias realizadas;
- observações importantes;
- riscos identificados (caso existam).

A documentação do SafeStop deve permanecer consistente, rastreável e servir como fonte oficial para o desenvolvimento do projeto.
