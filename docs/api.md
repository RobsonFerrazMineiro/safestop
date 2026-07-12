# API

## Objetivo

Este documento define os padrões oficiais para toda a camada de comunicação do SafeStop.

O objetivo não é documentar endpoints específicos, mas estabelecer uma arquitetura consistente para:

- Server Actions;
- Edge Functions;
- Comunicação com Supabase;
- DTOs;
- Requests;
- Responses;
- Erros;
- Uploads;
- Realtime;
- Offline;
- Sincronização.

Toda implementação futura deverá seguir este documento.

---

# Filosofia

O SafeStop utiliza uma arquitetura moderna baseada em:

- Next.js App Router;
- React Server Components;
- React Native (Expo);
- Supabase;
- PostgreSQL;
- Edge Functions;
- Row Level Security (RLS).

A comunicação deve ser:

- simples;
- segura;
- previsível;
- tipada;
- rastreável;
- reutilizável.

---

# Objetivos

A arquitetura da API possui os seguintes objetivos:

- centralizar regras de negócio;
- reduzir duplicação;
- manter consistência;
- facilitar manutenção;
- facilitar testes;
- facilitar auditoria;
- aumentar segurança;
- suportar Mobile e Web;
- suportar operação Offline.

---

# Fonte da Verdade

A API deve respeitar obrigatoriamente:

```text
README.md

↓

product.md

↓

workflow.md

↓

architecture.md

↓

database.md

↓

engineering.md
```

Nunca implementar regras diferentes das definidas nesses documentos.

---

# Arquitetura Geral

A comunicação do SafeStop é baseada em quatro camadas.

```text
Apps

↓

Services

↓

Supabase

↓

PostgreSQL
```

---

## Apps

São os clientes da aplicação.

Exemplos:

```text
apps/mobile

apps/web
```

Esses clientes nunca devem conter regras críticas de negócio.

---

## Services

Responsáveis por:

- comunicação;
- validações;
- chamadas ao backend;
- transformação de DTOs;
- tratamento de erros.

Toda comunicação passa pelos Services.

---

## Supabase

Responsável por:

- Auth;
- Database;
- Storage;
- Realtime;
- Edge Functions.

---

## PostgreSQL

Responsável por:

- persistência;
- integridade;
- constraints;
- índices;
- funções;
- auditoria.

---

# Estratégia de Comunicação

Nem toda operação deve utilizar o mesmo mecanismo.

A escolha depende do tipo de operação.

---

## Server Actions

Utilizar para:

- mutations;
- formulários;
- ações protegidas;
- alterações de dados;
- criação;
- atualização;
- exclusão.

---

## Edge Functions

Utilizar para:

- integrações externas;
- processamento pesado;
- notificações;
- geração de documentos;
- tarefas assíncronas;
- lógica isolada.

---

## Supabase Client

Utilizar para:

- consultas simples;
- leitura;
- realtime;
- autenticação;
- storage.

---

## PostgreSQL RPC

Utilizar quando existir:

- lógica SQL complexa;
- agregações;
- cálculos;
- validações próximas ao banco.

---

# Comunicação Mobile

O aplicativo Mobile deve comunicar-se utilizando:

```text
TanStack Query

↓

Services

↓

Supabase
```

Nunca acessar o Supabase diretamente pelas telas.

---

# Comunicação Web

O painel Web seguirá exatamente o mesmo padrão.

```text
Component

↓

Hooks

↓

Services

↓

Supabase
```

---

# Arquitetura de Services

Cada domínio possui seu próprio Service.

Exemplo:

```text
OccurrenceService

NotificationService

MDHOService

IMSService

ActionPlanService

UserService
```

Nunca criar um Service genérico contendo toda a aplicação.

---

# Organização dos Services

Exemplo:

```text
services/

occurrence/

notification/

mdho/

ims/

users/

organizations/
```

---

# Responsabilidade dos Services

Um Service deve:

- validar parâmetros;
- chamar Supabase;
- transformar dados;
- lançar erros padronizados;
- retornar DTOs.

Nunca renderizar interface.

Nunca acessar componentes.

---

# Responsabilidade dos Hooks

Os Hooks são responsáveis por:

- estado;
- cache;
- loading;
- retry;
- integração com TanStack Query.

Nunca implementar regra de negócio.

---

# Responsabilidade dos Componentes

Componentes apenas:

- exibem dados;
- recebem eventos;
- chamam Hooks.

Nunca chamar Supabase diretamente.

---

# Fluxo Oficial

```text
Screen

↓

Component

↓

Hook

↓

Service

↓

Supabase

↓

Database
```

Todo novo módulo deve seguir essa estrutura.

---

# Princípios REST

Mesmo utilizando Server Actions e Supabase, toda API deve respeitar princípios REST.

As operações devem ser previsíveis.

---

## Create

Criação de recursos.

---

## Read

Consulta de recursos.

---

## Update

Atualização.

---

## Delete

Remoção lógica sempre que possível.

Evitar exclusões físicas.

---

# Convenções

Toda operação deve possuir:

- nome claro;
- responsabilidade única;
- retorno tipado;
- tratamento de erro;
- documentação.

---

# Convenção de Nomes

Preferir:

```text
createOccurrence()

updateOccurrence()

cancelOccurrence()

approveMDHO()

confirmInterdiction()

registerIMSReference()
```

Evitar:

```text
save()

process()

handle()

execute()

doStuff()
```

---

# Estrutura dos Arquivos

Exemplo:

```text
services/

occurrence/

createOccurrence.ts

updateOccurrence.ts

cancelOccurrence.ts

approveOccurrence.ts

queries.ts

mutations.ts

types.ts
```

---

# Organização por Domínio

Toda implementação deve seguir domínio de negócio.

Exemplo:

```text
occurrence/

notification/

organization/

authentication/

users/

audit/

reports/

dashboard/
```

Nunca organizar por tipo técnico.

---

# Versionamento

A API deve ser evolutiva.

Mudanças incompatíveis devem gerar nova versão.

Exemplo:

```text
v1

v2
```

Evitar quebrar contratos existentes.

---

# Compatibilidade

Novas funcionalidades devem preservar compatibilidade sempre que possível.

Quando houver quebra:

- documentar;
- criar migração;
- atualizar ADR quando necessário.

---

# Idempotência

Operações críticas devem ser idempotentes sempre que possível.

Exemplo:

Confirmar Ciência

↓

duas chamadas

↓

mesmo resultado

---

# Atomicidade

Operações críticas devem ocorrer dentro de transações quando necessário.

Exemplos:

- criação de ocorrência;
- aprovação MDHO;
- liberação;
- encerramento.

Nunca deixar o sistema em estado inconsistente.

---

# Auditoria

Toda operação crítica deve registrar:

- usuário;
- data;
- organização;
- ação;
- recurso;
- alterações realizadas.

A auditoria nunca depende do cliente.

---

# Segurança

Nenhuma regra crítica deve existir apenas no Frontend.

Toda validação importante deve ocorrer:

- Server Action;
- Edge Function;
- PostgreSQL;
- RLS.

---

# Regra Geral

A camada de comunicação do SafeStop deve ser:

- previsível;
- simples;
- tipada;
- reutilizável;
- desacoplada;
- segura;
- documentada.

Ela representa a principal ponte entre a interface e as regras de negócio do sistema.

---

# Autenticação

O SafeStop utiliza o **Supabase Auth** como mecanismo oficial de autenticação.

Nenhuma autenticação paralela deverá ser implementada sem aprovação arquitetural.

Toda autenticação deve ser centralizada no Supabase.

---

# Métodos de Autenticação

O sistema deverá suportar:

- E-mail e senha;
- Magic Link (quando aplicável);
- OAuth (futuramente);
- SSO corporativo (futuramente).

A estratégia inicial será:

```text
Email + Password
```

---

# Sessão

A sessão deve ser gerenciada pelo Supabase.

O Frontend nunca deverá criar ou manipular JWT manualmente.

Sempre utilizar os métodos oficiais do SDK.

---

# Tokens

O cliente nunca deve:

- modificar tokens;
- armazenar tokens manualmente;
- gerar tokens;
- compartilhar tokens.

Toda renovação deverá ocorrer automaticamente pelo Supabase.

---

# Refresh Token

A renovação da sessão deve ocorrer automaticamente.

Nunca solicitar novo login apenas porque o Access Token expirou.

---

# Logout

Ao realizar logout:

- invalidar sessão;
- limpar cache local;
- limpar TanStack Query;
- limpar dados temporários;
- limpar dados Offline quando necessário.

Nunca manter informações sensíveis após logout.

---

# Usuário Autenticado

Após autenticação, o sistema deve recuperar:

- usuário;
- organização ativa;
- permissões;
- funções;
- preferências.

Esses dados serão utilizados durante toda a sessão.

---

# Autorização

Autenticação e autorização são responsabilidades diferentes.

Autenticação responde:

```text
Quem é o usuário?
```

Autorização responde:

```text
O que ele pode fazer?
```

Toda autorização deve ocorrer no backend.

---

# Modelo de Permissões

O SafeStop utiliza:

```text
RBAC
```

(Role-Based Access Control)

As permissões são atribuídas através de papéis (Roles).

---

# Estrutura

```text
Usuário

↓

Role

↓

Permissões
```

Nunca atribuir permissões diretamente ao usuário, salvo exceções justificadas.

---

# Roles

Exemplos:

```text
Administrador

Coordenador HSE

Engenheiro HSE

Supervisor

Técnico de Segurança

Líder

Fiscal

Contratada

Leitor
```

As Roles oficiais encontram-se documentadas em:

```text
docs/database.md
```

---

# Permissões

As permissões devem ser granulares.

Exemplos:

```text
occurrence.create

occurrence.read

occurrence.update

occurrence.cancel

mdho.create

mdho.approve

notification.send

user.manage

organization.manage
```

Nunca utilizar permissões genéricas como:

```text
admin=true
```

---

# Multi-Tenant

O SafeStop é uma aplicação Multi-Tenant.

Cada organização possui isolamento completo.

---

# Organização Ativa

Toda requisição deve conhecer:

```text
organization_id
```

Esse valor define o contexto operacional.

---

# Isolamento

Um usuário nunca deve visualizar dados pertencentes a outra organização.

Esse isolamento deve ser garantido pelo banco de dados.

Nunca apenas pelo Frontend.

---

# Row Level Security (RLS)

Toda tabela operacional deverá possuir políticas RLS.

Exemplos:

- occurrences;
- notifications;
- mdho;
- users;
- organizations;
- action_plans;
- evidences.

Nunca desabilitar RLS.

---

# Fonte da Autorização

A autorização deve seguir a sequência:

```text
JWT

↓

Organization

↓

Role

↓

Permission

↓

RLS
```

Essa sequência nunca deve ser invertida.

---

# Validação de Permissões

Antes de executar qualquer operação crítica verificar:

- usuário autenticado;
- organização ativa;
- role válida;
- permissão necessária.

Caso qualquer validação falhe:

Retornar erro.

---

# Erros de Autorização

Nunca retornar mensagens ambíguas.

Preferir:

```text
Você não possui permissão para aprovar este MDHO.
```

Evitar:

```text
Operação inválida.
```

---

# Recursos Sensíveis

Exigem validação adicional:

- usuários;
- permissões;
- organizações;
- auditoria;
- configurações;
- referência IMS;
- aprovação MDHO;
- liberação;
- interdição.

---

# Referência IMS

O SafeStop NÃO gera códigos IMS.

O código é registrado manualmente.

A API apenas:

- valida formato;
- registra;
- audita;
- disponibiliza para consulta.

Nunca criar integração fictícia.

---

# Auditoria

Toda operação crítica deve gerar registro em auditoria.

Exemplos:

- login;
- logout;
- criação;
- edição;
- aprovação;
- rejeição;
- cancelamento;
- liberação;
- alteração de permissões.

---

# Registro de Auditoria

Toda auditoria deve conter:

- usuário;
- organização;
- data;
- recurso;
- ação;
- identificador;
- IP (quando disponível);
- dispositivo (quando disponível).

---

# Princípio do Menor Privilégio

Todo usuário deve possuir apenas as permissões necessárias.

Nunca conceder acesso superior por conveniência.

---

# Elevação de Privilégio

Quando uma operação exigir privilégios elevados:

- validar Role;
- validar Permissão;
- registrar auditoria;
- registrar data;
- registrar responsável.

---

# Sessões Simultâneas

O sistema deve suportar múltiplas sessões do mesmo usuário.

Cada sessão deve ser controlada independentemente.

---

# Expiração

Caso a sessão expire:

- preservar rascunhos locais;
- solicitar nova autenticação;
- continuar sincronização após novo login.

Nunca perder informações locais.

---

# Proteção contra Acesso Indevido

Toda requisição deve validar:

- autenticação;
- autorização;
- organização;
- recurso.

Jamais confiar em parâmetros enviados pelo cliente.

---

# Segurança das Edge Functions

Toda Edge Function deve validar:

- JWT;
- organização;
- permissões;
- payload;
- origem da requisição.

Nunca assumir que a chamada é confiável.

---

# Segurança das Server Actions

Server Actions devem:

- validar sessão;
- validar usuário;
- validar payload;
- validar permissões;
- validar regras de negócio.

Nunca executar mutações sem validação.

---

# Logs de Segurança

Operações críticas devem gerar logs específicos.

Exemplos:

- tentativa de acesso negado;
- alteração de permissões;
- login suspeito;
- falha de autenticação;
- alteração de organização.

---

# Boas Práticas

Sempre:

- utilizar Auth oficial;
- utilizar RLS;
- validar permissões;
- registrar auditoria;
- tratar erros corretamente;
- manter isolamento entre organizações.

Nunca:

- confiar no Frontend;
- expor Service Role;
- desabilitar RLS;
- armazenar segredos no cliente;
- ignorar permissões.

---

# Regra Geral

Toda autenticação deve ser realizada pelo Supabase.

Toda autorização deve ser garantida pelo backend.

Toda permissão deve ser protegida por RLS.

Toda operação crítica deve ser auditada.

A segurança da API nunca deve depender do comportamento do cliente.

---

# DTOs

Toda comunicação entre o Frontend e o Backend deve utilizar DTOs (Data Transfer Objects).

DTOs garantem:

- consistência;
- tipagem;
- previsibilidade;
- desacoplamento;
- facilidade de manutenção.

Nenhum componente deve consumir diretamente estruturas retornadas pelo banco.

---

# Objetivos dos DTOs

Os DTOs existem para:

- padronizar contratos;
- esconder detalhes internos do banco;
- facilitar versionamento;
- evitar vazamento de informações;
- reduzir acoplamento.

---

# Organização

Os DTOs devem ser organizados por domínio.

Exemplo:

```text
packages/

types/

occurrence/

OccurrenceDTO.ts

CreateOccurrenceDTO.ts

UpdateOccurrenceDTO.ts

OccurrenceDetailsDTO.ts

OccurrenceListDTO.ts
```

---

# Convenções

Todo DTO deve:

- possuir nome claro;
- possuir apenas os campos necessários;
- ser imutável sempre que possível;
- representar um contrato.

---

# Request DTO

Responsável pelos dados enviados para a API.

Exemplo:

```typescript
CreateOccurrenceDTO;
```

---

# Response DTO

Responsável pelos dados retornados ao cliente.

Exemplo:

```typescript
OccurrenceResponseDTO;
```

---

# Nunca Retornar Entidades

Nunca retornar diretamente:

- tabelas;
- models;
- registros crus do PostgreSQL.

Sempre retornar DTOs.

---

# Transformação

Toda transformação deve ocorrer na camada de Services.

Fluxo:

```text
Database

↓

Entity

↓

Mapper

↓

DTO

↓

Frontend
```

---

# Mappers

Toda conversão entre Entity e DTO deve ocorrer através de Mappers.

Nunca espalhar transformações pelo código.

Exemplo:

```text
OccurrenceMapper

NotificationMapper

MDHOMapper

IMSMapper
```

---

# Requests

Toda requisição deve possuir estrutura previsível.

Nunca depender de parâmetros implícitos.

---

# Payload

O payload deve conter apenas informações necessárias.

Evitar:

- campos duplicados;
- objetos enormes;
- estruturas profundas.

---

# Responses

Toda resposta deve ser consistente.

Mesmo tipo de operação.

Mesmo formato.

Sempre.

---

# Estrutura Oficial

Operações bem-sucedidas devem retornar:

```text
status

data

meta (quando necessário)
```

---

Exemplo conceitual:

```json
{
  "status": "success",
  "data": {},
  "meta": {}
}
```

---

# Meta

O objeto meta poderá conter:

- paginação;
- quantidade;
- tempo de processamento;
- cursor;
- informações auxiliares.

---

# Responses Vazias

Operações sem retorno relevante devem responder apenas confirmação de sucesso.

Nunca retornar estruturas desnecessárias.

---

# Error Response

Toda resposta de erro deve seguir o mesmo padrão.

Estrutura:

```text
status

error

message

details

traceId
```

---

Exemplo conceitual:

```json
{
  "status": "error",
  "error": "VALIDATION_ERROR",
  "message": "Empresa obrigatória.",
  "details": {},
  "traceId": "..."
}
```

---

# Mensagens

As mensagens devem ser:

- objetivas;
- compreensíveis;
- consistentes.

Evitar mensagens técnicas.

---

# Códigos de Erro

Padronizar erros.

Exemplos:

```text
VALIDATION_ERROR

UNAUTHORIZED

FORBIDDEN

NOT_FOUND

CONFLICT

BUSINESS_RULE

RATE_LIMIT

SERVER_ERROR
```

Nunca inventar códigos aleatórios.

---

# Trace ID

Toda operação crítica deve possuir Trace ID.

Objetivos:

- auditoria;
- suporte;
- observabilidade.

---

# Validação

Toda entrada deve ser validada antes de qualquer processamento.

A validação deve ocorrer:

- Server Actions;
- Edge Functions;
- PostgreSQL (quando aplicável).

Nunca confiar no Frontend.

---

# Zod

A biblioteca oficial para validação será:

```text
Zod
```

Todos os DTOs devem possuir Schema correspondente.

---

# Sanitização

Antes de persistir dados:

- remover espaços desnecessários;
- normalizar texto;
- validar formatos;
- impedir conteúdo inválido.

---

# Paginação

Toda listagem deverá suportar paginação.

Nunca retornar milhares de registros em uma única requisição.

---

# Estratégia

Utilizar paginação baseada em Cursor sempre que possível.

Fallback:

Offset.

---

# Estrutura da Paginação

A resposta poderá conter:

```text
items

nextCursor

previousCursor

hasNext

total
```

---

# Tamanho da Página

Valores recomendados:

Mobile

20

Web

50

Máximo permitido

100

---

# Ordenação

Toda listagem deverá permitir ordenação.

Campos comuns:

- data;
- atualização;
- criticidade;
- prioridade;
- status.

---

# Direção

Permitir:

```text
ASC

DESC
```

---

# Filtros

Filtros devem ser independentes.

Exemplos:

- organização;
- empresa;
- área;
- usuário;
- status;
- criticidade;
- período;
- responsável.

---

# Busca

Toda busca textual deve ser:

- insensível a maiúsculas;
- rápida;
- indexada.

Evitar buscas por LIKE sem necessidade.

---

# Pesquisa Global

Sempre que possível utilizar pesquisa unificada.

Exemplo:

Buscar ocorrência por:

- código;
- empresa;
- área;
- descrição.

---

# Upload

Todo upload deve utilizar Supabase Storage.

Nunca salvar arquivos diretamente no banco.

---

# Tipos Aceitos

Exemplos:

Fotografias

PDF

DOCX

XLSX

Vídeos (quando aprovados)

---

# Organização do Storage

Estrutura sugerida:

```text
occurrences/

evidences/

mdho/

documents/

avatars/

reports/
```

---

# Nome dos Arquivos

Nunca utilizar nome enviado pelo usuário.

Sempre gerar identificadores únicos.

---

# Metadados

Todo upload deve registrar:

- autor;
- data;
- organização;
- ocorrência;
- tipo;
- tamanho;
- MIME Type.

---

# Download

Todo download deve respeitar permissões.

Nunca expor URLs públicas de arquivos privados.

Preferir Signed URLs.

---

# Compressão

Sempre que possível:

- comprimir imagens;
- otimizar PDFs;
- reduzir tráfego.

Especialmente no Mobile.

---

# Limites

A API deve definir limites para:

- tamanho de arquivos;
- quantidade de anexos;
- tipos permitidos.

Nunca depender apenas do cliente.

---

# Versionamento dos DTOs

Mudanças incompatíveis devem gerar nova versão.

Evitar quebrar contratos existentes.

---

# Compatibilidade

Sempre priorizar compatibilidade retroativa.

Quando impossível:

- documentar;
- comunicar;
- atualizar documentação.

---

# Boas Práticas

Sempre:

- utilizar DTOs;
- validar payload;
- retornar Responses padronizados;
- utilizar paginação;
- utilizar filtros;
- utilizar upload seguro;
- documentar mudanças.

Nunca:

- retornar entidades diretamente;
- expor estrutura do banco;
- confiar no cliente;
- criar Responses diferentes para a mesma operação.

---

# Regra Geral

Toda comunicação entre Frontend e Backend deve ocorrer através de contratos claros, tipados, versionáveis e documentados.

A consistência dos DTOs e Responses é essencial para manter a previsibilidade e a evolução sustentável da API do SafeStop.

---

# Realtime

O SafeStop utiliza o **Supabase Realtime** para distribuir atualizações em tempo real entre dispositivos conectados.

O objetivo é manter Mobile e Web sincronizados sempre que possível.

O Realtime complementa o sistema de sincronização.

Ele não substitui a persistência do banco de dados.

---

# Objetivos

O Realtime deve ser utilizado para:

- atualização de status;
- novas ocorrências;
- notificações;
- mudanças de responsáveis;
- atualizações do plano de ação;
- conclusão de validações;
- encerramento de ocorrências.

Nunca utilizar Realtime para executar regras de negócio.

---

# Fluxo

```text
Usuário

↓

Server Action

↓

PostgreSQL

↓

Realtime

↓

Clientes conectados
```

Toda informação distribuída em tempo real já deve estar persistida.

---

# Eventos

Os eventos devem representar mudanças de negócio.

Exemplos:

```text
OccurrenceCreated

OccurrenceUpdated

OccurrenceCancelled

OccurrenceReleased

OccurrenceClosed

NotificationCreated

NotificationRead

NotificationAcknowledged

MDHOCreated

MDHOApproved

MDHORejected

ActionPlanCreated

ActionPlanUpdated

EvidenceUploaded

IMSReferenceRegistered
```

Evitar eventos genéricos.

---

# Canais

Sempre utilizar canais organizados por domínio.

Exemplo:

```text
occurrences

notifications

mdho

action-plans

dashboard

audit
```

Nunca utilizar um único canal para toda a aplicação.

---

# Escopo

Os canais devem respeitar a organização ativa.

Exemplo:

```text
organization_id
```

Um usuário nunca deve receber eventos de outra organização.

---

# Eventos Efêmeros

Indicadores temporários podem utilizar Broadcast.

Exemplos:

- usuário digitando;
- usuário conectado;
- indicador temporário.

Nunca utilizar Broadcast para dados permanentes.

---

# Persistência

Toda informação importante deve existir primeiro no banco.

Realtime apenas informa que houve mudança.

---

# Push Notifications

Push Notification não é Realtime.

Cada tecnologia possui responsabilidades diferentes.

---

## Push

Utilizar para:

- usuário ausente;
- aplicativo fechado;
- alerta importante;
- ação pendente;
- ciência necessária.

---

## Realtime

Utilizar para:

- usuários ativos;
- dashboards;
- timeline;
- atualizações instantâneas.

---

# Estratégia

Sempre preferir:

Realtime

↓

Push

↓

Polling

Polling deverá ser utilizado apenas quando necessário.

---

# Offline First

O Mobile deve continuar funcionando sem conexão.

Toda operação deverá ser registrada localmente.

---

# Persistência Local

Durante ausência de conexão:

Os dados permanecem armazenados no dispositivo.

Nenhuma informação deve ser perdida.

---

# Estados Offline

Toda operação deverá possuir um estado.

Exemplo:

```text
Draft

↓

Pending Sync

↓

Syncing

↓

Synced

↓

Sync Error
```

Esses estados não representam o Workflow da ocorrência.

Representam apenas sincronização.

---

# Estratégia de Sincronização

Quando a conexão retornar:

```text
Fila Local

↓

Sincronização

↓

Backend

↓

Confirmação

↓

Atualização Local
```

Nunca apagar um registro antes da confirmação do backend.

---

# Ordem

A fila deve respeitar a ordem cronológica.

Primeiro registro criado.

↓

Primeiro registro enviado.

---

# Retry

Toda sincronização deve possuir mecanismo de retry.

Nunca exigir que o usuário repita manualmente uma operação apenas por falha temporária.

---

# Backoff

Utilizar Exponential Backoff.

Exemplo:

```text
1 segundo

↓

2 segundos

↓

4 segundos

↓

8 segundos

↓

16 segundos
```

Evitar requisições contínuas.

---

# Timeout

Toda operação deve possuir timeout.

Nunca aguardar indefinidamente.

---

## Valores sugeridos

Consultas

```text
15 segundos
```

Uploads

```text
60 segundos
```

Downloads

```text
60 segundos
```

Edge Functions

```text
30 segundos
```

---

# Cancelamento

Toda operação longa deve permitir cancelamento quando possível.

Exemplos:

- upload;
- download;
- geração de relatório.

---

# Sincronização Parcial

Caso apenas parte da fila seja sincronizada:

Os itens restantes permanecem aguardando.

Nunca cancelar toda a fila.

---

# Conflitos

Conflitos podem ocorrer quando dois usuários alteram o mesmo recurso.

---

## Estratégia

Priorizar:

```text
Backend

↓

Última versão persistida

↓

Resolução de conflito
```

Nunca permitir que o cliente sobrescreva dados sem validação.

---

# Tipos de Conflito

Exemplos:

- edição simultânea;
- exclusão concorrente;
- atualização de status;
- alteração de responsável.

---

# Resolução

Quando necessário:

- informar conflito;
- mostrar diferenças;
- permitir nova tentativa.

Nunca ocultar conflitos.

---

# Cache

O SafeStop utiliza TanStack Query como solução oficial de cache.

---

# Objetivos

O cache reduz:

- chamadas ao servidor;
- consumo de banda;
- tempo de carregamento.

---

# Server State

Toda informação proveniente do backend deve ser considerada Server State.

Nunca utilizar Zustand para armazenar Server State.

---

# Client State

Client State inclui:

- modais;
- filtros;
- tema;
- seleção;
- preferências locais.

Esses estados podem utilizar Zustand.

---

# TanStack Query

Responsável por:

- cache;
- refetch;
- retry;
- invalidação;
- sincronização;
- loading;
- optimistic updates.

---

# Query Keys

Toda Query Key deve seguir padrão.

Exemplos:

```text
["occurrences"]

["occurrences", id]

["notifications"]

["dashboard"]

["users"]
```

Nunca utilizar strings soltas.

---

# Invalidação

Após mutations:

Invalidar apenas queries relacionadas.

Evitar:

```text
invalidateQueries()
```

sem filtros.

---

# Refetch

Refetch automático deve ocorrer apenas quando fizer sentido.

Evitar chamadas desnecessárias.

---

# Optimistic Updates

Utilizar apenas quando a operação possuir alta probabilidade de sucesso.

Exemplos:

- marcar notificação como lida;
- confirmar ciência;
- atualizar preferências.

---

# Não utilizar Optimistic Update

Evitar para:

- aprovação MDHO;
- liberação;
- interdição;
- alteração de permissões.

Essas ações dependem da confirmação do backend.

---

# Rollback

Quando utilizar Optimistic Update:

Sempre implementar rollback.

---

# Pré-busca

Utilizar prefetch quando melhorar a experiência.

Exemplos:

- próxima página;
- detalhes da ocorrência;
- dashboard.

---

# Rate Limit

Toda API deve considerar limites de utilização.

Objetivos:

- evitar abuso;
- proteger infraestrutura;
- reduzir ataques.

---

# Estratégias

Aplicar limites principalmente em:

- autenticação;
- uploads;
- Edge Functions;
- notificações.

---

# Debounce

Utilizar debounce para:

- pesquisa;
- autocomplete;
- filtros.

Evitar múltiplas chamadas consecutivas.

---

# Throttle

Utilizar throttle quando necessário.

Exemplo:

Atualização contínua de mapas.

---

# Observabilidade

Toda comunicação importante deve produzir logs.

Exemplos:

- início;
- sucesso;
- falha;
- timeout;
- retry;
- cancelamento.

---

# Métricas

Monitorar:

- tempo médio de resposta;
- tempo de sincronização;
- falhas;
- retries;
- uploads;
- downloads.

---

# Boas Práticas

Sempre:

- utilizar cache;
- utilizar retry;
- utilizar timeout;
- tratar conflitos;
- registrar logs;
- sincronizar em segundo plano;
- manter operação Offline.

Nunca:

- bloquear operação por falta de internet;
- perder dados locais;
- ignorar conflitos;
- criar polling excessivo;
- utilizar cache sem invalidação.

---

# Regra Geral

A camada de comunicação do SafeStop deve priorizar a continuidade operacional.

Mesmo sem conexão, o usuário deve conseguir trabalhar normalmente.

Quando a conectividade retornar, o sistema deverá sincronizar os dados de forma segura, previsível, auditável e transparente para o usuário.

---

# Realtime

O SafeStop utiliza o **Supabase Realtime** para distribuir atualizações em tempo real entre dispositivos conectados.

O objetivo é manter Mobile e Web sincronizados sempre que possível.

O Realtime complementa o sistema de sincronização.

Ele não substitui a persistência do banco de dados.

---

# Objetivos

O Realtime deve ser utilizado para:

- atualização de status;
- novas ocorrências;
- notificações;
- mudanças de responsáveis;
- atualizações do plano de ação;
- conclusão de validações;
- encerramento de ocorrências.

Nunca utilizar Realtime para executar regras de negócio.

---

# Fluxo

```text
Usuário

↓

Server Action

↓

PostgreSQL

↓

Realtime

↓

Clientes conectados
```

Toda informação distribuída em tempo real já deve estar persistida.

---

# Eventos

Os eventos devem representar mudanças de negócio.

Exemplos:

```text
OccurrenceCreated

OccurrenceUpdated

OccurrenceCancelled

OccurrenceReleased

OccurrenceClosed

NotificationCreated

NotificationRead

NotificationAcknowledged

MDHOCreated

MDHOApproved

MDHORejected

ActionPlanCreated

ActionPlanUpdated

EvidenceUploaded

IMSReferenceRegistered
```

Evitar eventos genéricos.

---

# Canais

Sempre utilizar canais organizados por domínio.

Exemplo:

```text
occurrences

notifications

mdho

action-plans

dashboard

audit
```

Nunca utilizar um único canal para toda a aplicação.

---

# Escopo

Os canais devem respeitar a organização ativa.

Exemplo:

```text
organization_id
```

Um usuário nunca deve receber eventos de outra organização.

---

# Eventos Efêmeros

Indicadores temporários podem utilizar Broadcast.

Exemplos:

- usuário digitando;
- usuário conectado;
- indicador temporário.

Nunca utilizar Broadcast para dados permanentes.

---

# Persistência

Toda informação importante deve existir primeiro no banco.

Realtime apenas informa que houve mudança.

---

# Push Notifications

Push Notification não é Realtime.

Cada tecnologia possui responsabilidades diferentes.

---

## Push

Utilizar para:

- usuário ausente;
- aplicativo fechado;
- alerta importante;
- ação pendente;
- ciência necessária.

---

## Realtime

Utilizar para:

- usuários ativos;
- dashboards;
- timeline;
- atualizações instantâneas.

---

# Estratégia

Sempre preferir:

Realtime

↓

Push

↓

Polling

Polling deverá ser utilizado apenas quando necessário.

---

# Offline First

O Mobile deve continuar funcionando sem conexão.

Toda operação deverá ser registrada localmente.

---

# Persistência Local

Durante ausência de conexão:

Os dados permanecem armazenados no dispositivo.

Nenhuma informação deve ser perdida.

---

# Estados Offline

Toda operação deverá possuir um estado.

Exemplo:

```text
Draft

↓

Pending Sync

↓

Syncing

↓

Synced

↓

Sync Error
```

Esses estados não representam o Workflow da ocorrência.

Representam apenas sincronização.

---

# Estratégia de Sincronização

Quando a conexão retornar:

```text
Fila Local

↓

Sincronização

↓

Backend

↓

Confirmação

↓

Atualização Local
```

Nunca apagar um registro antes da confirmação do backend.

---

# Ordem

A fila deve respeitar a ordem cronológica.

Primeiro registro criado.

↓

Primeiro registro enviado.

---

# Retry

Toda sincronização deve possuir mecanismo de retry.

Nunca exigir que o usuário repita manualmente uma operação apenas por falha temporária.

---

# Backoff

Utilizar Exponential Backoff.

Exemplo:

```text
1 segundo

↓

2 segundos

↓

4 segundos

↓

8 segundos

↓

16 segundos
```

Evitar requisições contínuas.

---

# Timeout

Toda operação deve possuir timeout.

Nunca aguardar indefinidamente.

---

## Valores sugeridos

Consultas

```text
15 segundos
```

Uploads

```text
60 segundos
```

Downloads

```text
60 segundos
```

Edge Functions

```text
30 segundos
```

---

# Cancelamento

Toda operação longa deve permitir cancelamento quando possível.

Exemplos:

- upload;
- download;
- geração de relatório.

---

# Sincronização Parcial

Caso apenas parte da fila seja sincronizada:

Os itens restantes permanecem aguardando.

Nunca cancelar toda a fila.

---

# Conflitos

Conflitos podem ocorrer quando dois usuários alteram o mesmo recurso.

---

## Estratégia

Priorizar:

```text
Backend

↓

Última versão persistida

↓

Resolução de conflito
```

Nunca permitir que o cliente sobrescreva dados sem validação.

---

# Tipos de Conflito

Exemplos:

- edição simultânea;
- exclusão concorrente;
- atualização de status;
- alteração de responsável.

---

# Resolução

Quando necessário:

- informar conflito;
- mostrar diferenças;
- permitir nova tentativa.

Nunca ocultar conflitos.

---

# Cache

O SafeStop utiliza TanStack Query como solução oficial de cache.

---

# Objetivos

O cache reduz:

- chamadas ao servidor;
- consumo de banda;
- tempo de carregamento.

---

# Server State

Toda informação proveniente do backend deve ser considerada Server State.

Nunca utilizar Zustand para armazenar Server State.

---

# Client State

Client State inclui:

- modais;
- filtros;
- tema;
- seleção;
- preferências locais.

Esses estados podem utilizar Zustand.

---

# TanStack Query

Responsável por:

- cache;
- refetch;
- retry;
- invalidação;
- sincronização;
- loading;
- optimistic updates.

---

# Query Keys

Toda Query Key deve seguir padrão.

Exemplos:

```text
["occurrences"]

["occurrences", id]

["notifications"]

["dashboard"]

["users"]
```

Nunca utilizar strings soltas.

---

# Invalidação

Após mutations:

Invalidar apenas queries relacionadas.

Evitar:

```text
invalidateQueries()
```

sem filtros.

---

# Refetch

Refetch automático deve ocorrer apenas quando fizer sentido.

Evitar chamadas desnecessárias.

---

# Optimistic Updates

Utilizar apenas quando a operação possuir alta probabilidade de sucesso.

Exemplos:

- marcar notificação como lida;
- confirmar ciência;
- atualizar preferências.

---

# Não utilizar Optimistic Update

Evitar para:

- aprovação MDHO;
- liberação;
- interdição;
- alteração de permissões.

Essas ações dependem da confirmação do backend.

---

# Rollback

Quando utilizar Optimistic Update:

Sempre implementar rollback.

---

# Pré-busca

Utilizar prefetch quando melhorar a experiência.

Exemplos:

- próxima página;
- detalhes da ocorrência;
- dashboard.

---

# Rate Limit

Toda API deve considerar limites de utilização.

Objetivos:

- evitar abuso;
- proteger infraestrutura;
- reduzir ataques.

---

# Estratégias

Aplicar limites principalmente em:

- autenticação;
- uploads;
- Edge Functions;
- notificações.

---

# Debounce

Utilizar debounce para:

- pesquisa;
- autocomplete;
- filtros.

Evitar múltiplas chamadas consecutivas.

---

# Throttle

Utilizar throttle quando necessário.

Exemplo:

Atualização contínua de mapas.

---

# Observabilidade

Toda comunicação importante deve produzir logs.

Exemplos:

- início;
- sucesso;
- falha;
- timeout;
- retry;
- cancelamento.

---

# Métricas

Monitorar:

- tempo médio de resposta;
- tempo de sincronização;
- falhas;
- retries;
- uploads;
- downloads.

---

# Boas Práticas

Sempre:

- utilizar cache;
- utilizar retry;
- utilizar timeout;
- tratar conflitos;
- registrar logs;
- sincronizar em segundo plano;
- manter operação Offline.

Nunca:

- bloquear operação por falta de internet;
- perder dados locais;
- ignorar conflitos;
- criar polling excessivo;
- utilizar cache sem invalidação.

---

# Regra Geral

A camada de comunicação do SafeStop deve priorizar a continuidade operacional.

Mesmo sem conexão, o usuário deve conseguir trabalhar normalmente.

Quando a conectividade retornar, o sistema deverá sincronizar os dados de forma segura, previsível, auditável e transparente para o usuário.
