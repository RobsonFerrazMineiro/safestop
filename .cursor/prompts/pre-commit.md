# Pre-Commit Review

## Objetivo

Executar uma validação completa antes da criação de qualquer commit no projeto SafeStop.

Sua missão é garantir que nenhum commit seja realizado sem atender aos padrões de qualidade, arquitetura, documentação e convenções oficiais do projeto.

Utilize as responsabilidades do agente responsável pelo contexto da alteração (WEB, MOBILE, DATABASE, BACKEND, ARCHITECT, DOCS, QA ou MASTER).

---

# Escopo

Analise todas as alterações pendentes (staged e unstaged).

Verifique:

```text
Código

Documentação

Banco

Migrations

Configurações

Rules

Agents

Design System

Workflows

Dependências
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

---

# Validações

## 1. Build

Confirme que o projeto continua compilando.

Quando aplicável execute:

```bash
pnpm build
```

---

## 2. TypeScript

Executar:

```bash
pnpm typecheck
```

Nenhum erro é permitido.

---

## 3. Lint

Executar:

```bash
pnpm lint
```

Nenhum erro é permitido.

Warnings devem ser analisados.

---

## 4. Testes

Quando existirem testes relacionados:

Executar:

```bash
pnpm test
```

Todos devem passar.

---

## 5. Arquitetura

Verifique se o código continua aderente a:

- architecture.md
- engineering.md

Identifique:

- violações de arquitetura;
- dependências indevidas;
- acoplamentos.

---

## 6. Workflow

Confirme que nenhuma alteração quebra o Workflow oficial.

Caso altere regras de negócio:

Verifique se:

```text
workflow.md
```

também foi atualizado.

---

## 7. Banco

Caso existam alterações em:

- tabelas;
- migrations;
- enums;
- funções;
- RLS;

Confirme que:

```text
database.md
```

permanece consistente.

---

## 8. API

Caso existam alterações em:

- DTOs;
- Responses;
- Requests;
- Server Actions;
- Edge Functions;

Verifique consistência com:

```text
docs/api.md
```

---

## 9. Documentação

Confirme se a alteração exige atualização de:

- README
- Product
- Workflow
- Database
- API
- Design System
- Glossary
- ADR

Caso necessário, interrompa o commit até que a documentação seja atualizada.

---

## 10. Design System

Verifique:

- componentes reutilizados;
- tokens oficiais;
- tipografia;
- espaçamentos;
- cores.

Nunca permitir componentes fora do padrão.

---

## 11. Segurança

Verifique:

- autenticação;
- autorização;
- RLS;
- secrets;
- credenciais;
- variáveis de ambiente.

Nunca permitir informações sensíveis no commit.

---

## 12. Offline

Caso a alteração envolva funcionalidades Mobile:

Confirme que:

- Offline continua funcionando;
- sincronização permanece consistente.

---

## 13. Código

Identifique:

- código morto;
- TODO esquecidos;
- FIXME;
- console.log;
- comentários temporários;
- arquivos não utilizados.

Remova antes do commit.

---

## 14. Dependências

Caso novas dependências tenham sido adicionadas:

Verifique:

- necessidade;
- manutenção;
- impacto no bundle.

---

## 15. Qualidade

Confirme:

- nomes claros;
- funções pequenas;
- componentes reutilizáveis;
- ausência de duplicação.

---

# Conventional Commits

Todos os commits devem seguir obrigatoriamente o padrão Conventional Commits.

Tipos permitidos:

```text
feat
fix
refactor
docs
style
test
build
ci
perf
chore
revert
```

Exemplos válidos:

```text
feat(auth): adiciona login com Supabase

fix(mobile): corrige sincronização offline

docs(api): atualiza documentação da API

refactor(database): reorganiza consultas

test(workflow): adiciona testes do fluxo de aprovação

perf(web): otimiza carregamento do dashboard

chore(deps): atualiza dependências
```

Nunca utilizar mensagens genéricas.

Exemplos proibidos:

```text
Update

Correções

Mudanças

Teste

Ajustes

Commit

Versão nova
```

---

# Antes do Commit

Apresente um resumo contendo:

- arquivos alterados;
- impacto;
- riscos;
- documentação afetada;
- testes executados;
- validações realizadas.

---

# Restrições

Nunca realizar commit quando existir:

- erro de build;
- erro de lint;
- erro de TypeScript;
- documentação inconsistente;
- Workflow inconsistente;
- arquitetura violada;
- código morto;
- segredos expostos.

---

# Commit

Somente após todas as validações:

1. Gere uma mensagem seguindo Conventional Commits.

2. Explique brevemente o motivo da mensagem.

3. Aguarde aprovação do usuário.

4. Somente após aprovação execute o commit.

Nunca criar commits automaticamente sem confirmação.

---

# Resultado Esperado

Ao finalizar entregue:

- checklist completo;
- problemas encontrados;
- problemas corrigidos;
- arquivos revisados;
- sugestão de mensagem Conventional Commit;
- status final.

O commit somente poderá ser realizado quando todas as verificações forem aprovadas.
