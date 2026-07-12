# Database Review

## Objetivo

Executar uma auditoria completa da camada de banco de dados do projeto SafeStop.

Sua missão é garantir que toda a modelagem permaneça consistente, segura, performática e aderente às regras de negócio definidas pelo projeto.

Você deve utilizar as responsabilidades definidas no agente **DATABASE**.

---

# Escopo

Analise integralmente:

```text
docs/database.md

docs/workflow.md

docs/api.md

docs/engineering.md

docs/architecture.md

docs/product.md

supabase/**

migrations/**

seed/**

packages/types/**

packages/validation/**
```

Caso existam novos módulos relacionados ao banco de dados, eles também deverão ser analisados.

---

# Fonte da Verdade

Sempre respeite a seguinte ordem:

```text
README.md

↓

docs/product.md

↓

docs/workflow.md

↓

docs/database.md

↓

docs/architecture.md

↓

docs/engineering.md

↓

docs/api.md

↓

ADRs
```

Nunca altere regras de negócio para adequar o banco.

O banco deve refletir exatamente o domínio definido pela documentação.

---

# Auditoria

Execute todas as verificações abaixo.

---

## 1. Modelagem

Verifique:

- entidades;
- relacionamentos;
- cardinalidade;
- tabelas;
- consistência do domínio.

Identifique:

- tabelas desnecessárias;
- entidades duplicadas;
- relacionamentos incorretos.

---

## 2. Convenção de Nomes

Confirme padronização de:

- tabelas;
- colunas;
- índices;
- constraints;
- foreign keys;
- enums.

Preferir:

```text
snake_case
```

Evitar abreviações desnecessárias.

---

## 3. Chaves Primárias

Verifique:

- UUID;
- identidade;
- consistência.

Confirme que todas as tabelas possuem chave primária.

---

## 4. Chaves Estrangeiras

Verifique:

- integridade referencial;
- cascatas;
- relacionamentos.

Nunca permitir registros órfãos sem justificativa.

---

## 5. Constraints

Confirme utilização adequada de:

- NOT NULL
- UNIQUE
- CHECK
- FOREIGN KEY
- DEFAULT

Evite regras implementadas apenas na aplicação.

---

## 6. Índices

Analise:

- índices existentes;
- índices ausentes;
- índices duplicados.

Verifique principalmente campos utilizados em:

- filtros;
- pesquisas;
- joins;
- ordenação.

---

## 7. Performance

Identifique:

- consultas lentas;
- joins excessivos;
- tabelas muito grandes;
- falta de índices;
- N+1 Query.

Proponha melhorias quando necessário.

---

## 8. Normalização

Verifique se o banco encontra-se adequadamente normalizado.

Evite:

- duplicação de dados;
- colunas redundantes;
- dependências indevidas.

---

## 9. Desnormalização

Quando existir desnormalização:

Confirme que ela está documentada e possui justificativa técnica.

---

## 10. Enums

Confirme que todos os enums:

- possuem nomenclatura consistente;
- refletem o Workflow;
- permanecem sincronizados com a documentação.

---

## 11. Workflow

Compare:

```text
docs/workflow.md
```

com:

- enums;
- tabelas;
- transições;
- estados.

Confirme que não existem estados inexistentes no banco.

---

## 12. Auditoria

Verifique:

- tabelas de auditoria;
- logs;
- rastreabilidade;
- histórico.

Confirme que todas as operações críticas permanecem auditáveis.

---

## 13. Soft Delete

Confirme utilização correta quando aplicável.

Verifique:

- deleted_at;
- deleted_by;
- filtros automáticos.

Evite exclusões físicas sem necessidade.

---

## 14. Multi-Tenant

Confirme isolamento completo entre organizações.

Verifique:

- organization_id;
- relacionamentos;
- filtros;
- RLS.

Nenhum dado pode ficar acessível entre organizações.

---

## 15. Row Level Security

Analise todas as políticas.

Confirme:

- leitura;
- escrita;
- atualização;
- exclusão.

Identifique:

- políticas ausentes;
- políticas excessivamente permissivas.

---

## 16. Segurança

Verifique:

- exposição de dados;
- tabelas sensíveis;
- credenciais;
- secrets;
- permissões.

Confirme aderência às boas práticas do Supabase.

---

## 17. Storage

Analise:

- buckets;
- organização;
- políticas;
- permissões;
- nomenclatura.

Confirme aderência ao documento:

```text
docs/api.md
```

---

## 18. Functions

Analise:

- PostgreSQL Functions;
- RPC;
- Triggers.

Verifique:

- responsabilidade;
- desempenho;
- reutilização.

---

## 19. Triggers

Confirme utilização apenas quando realmente necessária.

Evite lógica excessiva em triggers.

---

## 20. Migrations

Verifique:

- ordem;
- consistência;
- nomenclatura;
- rollback;
- dependências.

Confirme que todas as migrations podem ser executadas em sequência.

---

## 21. Seeds

Analise:

- dados iniciais;
- consistência;
- repetibilidade;
- idempotência.

Confirme que o ambiente pode ser recriado corretamente.

---

## 22. Tipagem

Verifique sincronização entre:

- Prisma (caso utilizado);
- Supabase Types;
- DTOs;
- Types compartilhados.

---

## 23. API

Confirme aderência entre:

- banco;
- DTOs;
- Responses;
- Requests.

Nunca permitir divergência entre documentação e implementação.

---

## 24. Offline

Verifique se o banco suporta corretamente:

- sincronização;
- versionamento;
- resolução de conflitos.

---

## 25. Escalabilidade

Analise:

- crescimento esperado;
- particionamento futuro;
- volume de dados;
- índices compostos.

Identifique possíveis gargalos.

---

## 26. Qualidade Geral

Avalie:

- organização;
- legibilidade;
- consistência;
- simplicidade;
- manutenibilidade.

---

# Restrições

Nunca:

- alterar regras de negócio;
- alterar Workflow;
- alterar Product;
- modificar ADRs.

Somente proponha melhorias técnicas compatíveis com a arquitetura oficial.

---

# Processo

Antes de modificar qualquer arquivo:

1. Analise toda a modelagem.

2. Gere um relatório contendo:

- inconsistências;
- riscos;
- violações;
- melhorias.

3. Agrupe os resultados por categoria.

4. Explique cada recomendação.

5. Aguarde aprovação.

Somente após aprovação:

- aplique as alterações;
- preserve compatibilidade;
- mantenha consistência documental.

---

# Commit

Após aprovação:

Realize apenas um commit.

Mensagem:

```text
refactor: revisar modelagem e consistência do banco de dados
```

Utilize Conventional Commits.

---

# Resultado Esperado

Ao finalizar apresente:

- resumo executivo;
- tabelas analisadas;
- relacionamentos revisados;
- índices avaliados;
- políticas RLS verificadas;
- migrations analisadas;
- inconsistências encontradas;
- melhorias sugeridas;
- riscos identificados;
- arquivos modificados.

O banco de dados do SafeStop deve permanecer consistente, seguro, performático, escalável e totalmente aderente à arquitetura e às regras de negócio oficiais do projeto.
