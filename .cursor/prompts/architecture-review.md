# Architecture Review

## Objetivo

Executar uma auditoria completa da arquitetura do projeto SafeStop.

Sua missão é validar se toda a implementação permanece aderente à arquitetura oficial definida pelo projeto.

Você deve utilizar as responsabilidades definidas no agente **ARCHITECT**.

---

# Escopo

Analise:

```text
README.md

docs/architecture.md

docs/engineering.md

docs/database.md

docs/api.md

docs/workflow.md

docs/design-system.md

docs/decisions/*

apps/**

packages/**

supabase/**

.cursor/rules/**

.cursor/agents/**
```

Caso existam novos módulos ou documentos relacionados à arquitetura, eles também deverão ser analisados.

---

# Fonte da Verdade

Utilize a seguinte prioridade:

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

ADRs
```

Quando houver conflito:

- nunca alterar ADRs;
- nunca alterar regras de negócio;
- corrigir apenas implementações ou documentos inconsistentes.

---

# Auditoria

Execute todas as verificações abaixo.

---

## 1. Arquitetura Geral

Verifique se a implementação continua respeitando:

- Monorepo;
- Clean Architecture (quando aplicável);
- Separação por domínios;
- Mobile First;
- Shared Packages.

---

## 2. Estrutura do Projeto

Confirme que a estrutura permanece organizada.

Esperado:

```text
apps/

mobile/

web/

packages/

ui/

shared/

types/

validation/

config/

services/

docs/

supabase/

.cursor/
```

Identifique:

- diretórios desnecessários;
- duplicações;
- módulos mal posicionados.

---

## 3. Organização por Domínio

Verifique se cada domínio permanece isolado.

Exemplo:

```text
occurrences/

notifications/

mdho/

organizations/

users/

dashboard/

audit/
```

Nunca permitir acoplamento desnecessário entre domínios.

---

## 4. Separação de Responsabilidades

Confirme que existe separação adequada entre:

- UI;
- Hooks;
- Services;
- Server Actions;
- Edge Functions;
- Banco de Dados.

Nenhuma camada deve assumir responsabilidades de outra.

---

## 5. Frontend

Verifique se:

- componentes são reutilizáveis;
- telas permanecem enxutas;
- lógica de negócio não está na interface;
- estado local e estado remoto estão corretamente separados.

---

## 6. Backend

Verifique:

- Server Actions;
- Edge Functions;
- Services;
- DTOs;
- validações.

Nunca permitir regras críticas apenas no Frontend.

---

## 7. Banco de Dados

Confirme:

- consistência das entidades;
- relacionamentos;
- enums;
- constraints;
- índices;
- RLS.

---

## 8. API

Verifique:

- contratos;
- DTOs;
- Responses;
- autenticação;
- autorização;
- paginação;
- uploads.

---

## 9. Offline

Confirme que a arquitetura suporta:

- operação Offline;
- sincronização posterior;
- fila local;
- retry;
- resolução de conflitos.

---

## 10. Realtime

Verifique:

- canais;
- organização dos eventos;
- sincronização;
- uso adequado do Supabase Realtime.

---

## 11. Segurança

Confirme:

- autenticação;
- autorização;
- RLS;
- validações;
- isolamento Multi-Tenant.

---

## 12. Performance

Analise:

- renderizações;
- consultas;
- cache;
- TanStack Query;
- payloads;
- reutilização de componentes.

---

## 13. Escalabilidade

Verifique se a arquitetura suporta crescimento.

Identifique:

- dependências circulares;
- módulos excessivamente grandes;
- acoplamentos desnecessários;
- duplicações.

---

## 14. Design System

Confirme aderência ao:

```text
docs/design-system.md
```

Verifique:

- tokens;
- componentes;
- tipografia;
- cores;
- espaçamentos.

---

## 15. Engineering

Confirme aderência ao:

```text
docs/engineering.md
```

Especialmente:

- convenções;
- estrutura;
- nomenclatura;
- organização.

---

## 16. ADRs

Verifique se alguma implementação contradiz decisões arquiteturais.

Nunca alterar ADRs.

Caso exista conflito:

- identificar;
- documentar;
- propor correção.

---

## 17. Rules

Verifique se a implementação continua respeitando todas as Rules do projeto.

---

## 18. Agents

Verifique se a arquitetura continua compatível com as responsabilidades definidas para cada agente.

---

## 19. Código

Identifique:

- duplicações;
- acoplamentos;
- violações arquiteturais;
- código morto;
- abstrações desnecessárias.

---

## 20. Qualidade Geral

Avalie:

- clareza;
- modularidade;
- manutenibilidade;
- reutilização;
- legibilidade;
- simplicidade.

---

# Restrições

Nunca:

- invente arquitetura;
- altere regras de negócio;
- altere Workflow;
- altere Product;
- altere ADRs.

Somente proponha melhorias arquiteturais compatíveis com os documentos oficiais.

---

# Processo

Antes de modificar qualquer arquivo:

1. Analise toda a arquitetura.

2. Gere um relatório contendo:

- inconsistências;
- violações arquiteturais;
- oportunidades de melhoria.

3. Agrupe os resultados por domínio.

4. Explique cada recomendação.

5. Aguarde aprovação.

Somente após aprovação:

- aplique as alterações;
- preserve compatibilidade;
- mantenha consistência documental.

---

# Commit

Após aprovação e conclusão:

Realize apenas um commit.

Mensagem:

```text
refactor: alinhar implementação com a arquitetura oficial
```

Utilize Conventional Commits.

---

# Resultado Esperado

Ao finalizar apresente:

- resumo executivo;
- documentos analisados;
- módulos analisados;
- inconsistências encontradas;
- violações arquiteturais;
- melhorias sugeridas;
- riscos identificados;
- arquivos modificados;
- impacto das alterações.

A arquitetura do SafeStop deve permanecer consistente, escalável, modular, segura e aderente às decisões oficiais do projeto.
