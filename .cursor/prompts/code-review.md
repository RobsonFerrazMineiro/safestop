# Code Review

## Objetivo

Executar uma revisão técnica completa do código alterado no projeto SafeStop.

Sua missão é garantir que toda implementação mantenha os padrões de qualidade, arquitetura, segurança, performance e legibilidade definidos pelo projeto.

Você deve utilizar as responsabilidades definidas no agente **QA**.

---

# Escopo

Analise todas as alterações realizadas nesta branch ou Pull Request.

Considere:

```text
Código

Arquitetura

Documentação

Banco de Dados

Server Actions

Edge Functions

UI

UX

Design System

Workflow

Testes

Performance

Segurança
```

---

# Fonte da Verdade

Sempre respeite:

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

docs/glossary.md

↓

CONTRIBUTING.md

↓

ADRs
```

Caso exista conflito entre implementação e documentação, utilize sempre a documentação oficial como referência.

---

# Revisão

Execute todas as verificações abaixo.

---

## 1. Regras de Negócio

Verifique se a implementação respeita:

- Product;
- Workflow;
- Arquitetura;
- Engenharia.

Nunca permitir implementação diferente das regras oficiais.

---

## 2. Arquitetura

Confirme aderência a:

- Monorepo;
- Organização por Domínio;
- Services;
- DTOs;
- Server Actions;
- Edge Functions;
- TanStack Query.

Identifique violações arquiteturais.

---

## 3. Qualidade do Código

Avalie:

- legibilidade;
- simplicidade;
- modularidade;
- reutilização;
- responsabilidade única;
- clareza dos nomes.

Evite:

- funções longas;
- componentes gigantes;
- duplicação;
- complexidade desnecessária.

---

## 4. Convenções

Verifique aderência às convenções do projeto.

Confirme:

- nomenclatura;
- organização;
- estrutura de pastas;
- padrões definidos em engineering.md.

---

## 5. React

Verifique:

- renderizações desnecessárias;
- dependências incorretas;
- hooks;
- memoização;
- composição.

---

## 6. React Native

Quando aplicável:

Confirme:

- compatibilidade Mobile;
- desempenho;
- acessibilidade;
- operação Offline.

---

## 7. Next.js

Verifique:

- Server Components;
- Client Components;
- Server Actions;
- cache;
- roteamento.

---

## 8. Supabase

Confirme:

- autenticação;
- autorização;
- RLS;
- consultas;
- Storage;
- Realtime.

Nunca permitir acesso inseguro.

---

## 9. Banco de Dados

Quando houver alterações:

Verifique:

- migrations;
- índices;
- constraints;
- relacionamentos;
- enums;
- RLS.

---

## 10. API

Analise:

- DTOs;
- Requests;
- Responses;
- validações;
- tratamento de erros.

---

## 11. Segurança

Verifique:

- autenticação;
- autorização;
- validações;
- variáveis de ambiente;
- exposição de dados.

Nunca permitir:

- secrets;
- Service Role;
- credenciais.

---

## 12. Performance

Analise:

- consultas;
- renders;
- cache;
- bundle;
- lazy loading;
- payload.

Identifique gargalos.

---

## 13. Offline

Quando aplicável:

Confirme:

- sincronização;
- retry;
- fila local;
- resolução de conflitos.

---

## 14. Design System

Compare com:

```text
docs/design-system.md
```

Verifique:

- componentes;
- tokens;
- tipografia;
- cores;
- espaçamentos.

---

## 15. Acessibilidade

Confirme:

- contraste;
- labels;
- foco;
- leitores de tela;
- navegação.

---

## 16. Testes

Verifique:

- cobertura;
- testes ausentes;
- cenários críticos.

---

## 17. Documentação

Caso a alteração modifique:

- Workflow;
- Banco;
- API;
- Arquitetura;
- Design System;

confirme que a documentação foi atualizada.

---

## 18. Código Morto

Identifique:

- arquivos não utilizados;
- imports desnecessários;
- TODO;
- FIXME;
- console.log;
- comentários temporários.

---

## 19. Dependências

Caso novas bibliotecas tenham sido adicionadas:

Analise:

- necessidade;
- manutenção;
- impacto;
- compatibilidade.

---

## 20. Boas Práticas

Confirme:

- funções pequenas;
- componentes reutilizáveis;
- tipagem correta;
- tratamento de erros;
- responsabilidades bem definidas.

---

# Classificação

Ao final, classifique cada problema encontrado.

## 🔴 Crítico

Problemas que impedem merge.

Exemplos:

- vulnerabilidades;
- quebra de arquitetura;
- violação de Workflow;
- perda de dados;
- falhas de autenticação.

---

## 🟠 Alto

Deve ser corrigido antes da próxima release.

---

## 🟡 Médio

Melhoria recomendada.

---

## 🔵 Baixo

Melhoria opcional.

---

## 🟢 Sugestão

Boas práticas ou oportunidades de melhoria.

---

# Relatório

Apresente:

## Resumo Executivo

---

## Pontos Positivos

---

## Problemas Encontrados

Agrupados por criticidade.

---

## Melhorias Recomendadas

---

## Arquivos Afetados

---

## Impacto

Baixo

Médio

Alto

---

## Aderência

Avalie de 0 a 100%.

Critérios:

- Arquitetura
- Engenharia
- Workflow
- Segurança
- Performance
- Design System
- Documentação

---

# Aprovação

Ao final escolha exatamente uma opção.

## ✅ APROVADO

Pode ser integrado sem alterações.

---

## 🟡 APROVADO COM RESSALVAS

Existem melhorias recomendadas, mas não impedem merge.

---

## 🔴 REPROVADO

Existem problemas críticos que impedem integração.

---

# Restrições

Nunca:

- alterar regras de negócio;
- alterar arquitetura;
- alterar Workflow;
- alterar ADRs.

Seu papel é revisar, justificar e recomendar melhorias.

---

# Regra Final

A qualidade do SafeStop é responsabilidade de toda a equipe.

Toda revisão deve ser criteriosa, objetiva, fundamentada e alinhada aos documentos oficiais do projeto.

Nenhuma implementação deve ser aprovada apenas porque funciona.

Ela deve ser:

- correta;
- segura;
- performática;
- consistente;
- documentada;
- fácil de manter.
