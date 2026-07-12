# Glossary

## Objetivo

Este documento define a terminologia oficial utilizada no SafeStop.

Seu objetivo é garantir que:

- desenvolvedores;
- analistas;
- designers;
- profissionais de HSE;
- agentes de IA;

utilizem exatamente os mesmos termos durante todo o desenvolvimento do sistema.

Nenhum documento deverá utilizar terminologia diferente da definida neste Glossário.

---

# A

## Ação Corretiva

Atividade executada para eliminar uma causa identificada e impedir a repetição de uma condição insegura.

---

## Ação Imediata

Medida executada logo após a identificação da ocorrência para controlar temporariamente o risco.

---

## Área

Local físico ou setor de uma unidade industrial onde a atividade é executada e onde a ocorrência é registrada.

---

## Auditoria

Registro rastreável de todas as alterações realizadas no sistema.

Inclui:

- usuário;
- data;
- hora;
- ação;
- recurso alterado.

---

# C

## Ciência

Confirmação formal de que um usuário tomou conhecimento de uma ocorrência.

Ciência não significa:

- aprovação;
- concordância;
- encerramento.

Significa apenas que o usuário foi oficialmente comunicado.

---

## Contratada

Empresa terceira responsável pela execução de determinada atividade.

---

## Contrato

Vínculo formal entre a organização e uma empresa contratada, utilizado para definir escopo, responsáveis e limites de atuação dentro do SafeStop.

---

## Correção

Resultado da execução de uma ação corretiva.

Pode conter:

- fotografias;
- observações;
- documentos;
- responsável;
- data.

---

## Criticidade

Classificação utilizada para representar o potencial impacto da ocorrência.

Valores oficiais:

- Baixa
- Média
- Alta
- Crítica

---

# D

## Dashboard

Painel gerencial utilizado para acompanhamento operacional.

---

## DTO

Data Transfer Object.

Objeto utilizado para comunicação entre Frontend e Backend.

Nunca representa diretamente uma tabela do banco.

---

# E

## Edge Function

Função executada no ambiente do Supabase.

Utilizada para:

- integrações;
- notificações;
- processamento assíncrono;
- geração de documentos.

---

## Escalonamento

Encaminhamento automático de uma comunicação a responsáveis de nível superior quando a ciência ou a ação necessária não ocorre dentro do prazo esperado.

---

## Evidência

Arquivo anexado à ocorrência.

Pode ser:

- fotografia;
- documento;
- PDF;
- vídeo (quando suportado futuramente).

---

# F

## Fiscal do Contrato

Papel responsável por acompanhar a execução do contrato e atuar no fluxo da ocorrência conforme as permissões definidas.

---

# G

## Gestor

Usuário responsável pelo acompanhamento e tomada de decisões dentro do fluxo da ocorrência.

---

# H

## HSE

Health, Safety and Environment.

Área responsável pela gestão de Saúde, Segurança e Meio Ambiente.

---

## HSE de Campo

Papel do profissional de HSE que atua diretamente em campo, responsável pelo registro inicial da Paralisação Preventiva.

---

# I

## Idempotência

Propriedade de uma operação que pode ser executada múltiplas vezes produzindo sempre o mesmo resultado, evitando duplicidades.

---

## IMS

Sistema corporativo utilizado para registro oficial da ocorrência.

O SafeStop NÃO gera códigos IMS.

A referência é registrada manualmente pelo usuário.

---

## Interdição Oficial

Estado no qual a atividade permanece formalmente bloqueada até conclusão das tratativas necessárias.

---

# L

## Liberação

Confirmação formal de que a atividade pode ser retomada com segurança.

---

# M

## MDHO

Metodologia utilizada para investigação da ocorrência.

O SafeStop registra e acompanha o preenchimento do MDHO durante o workflow.

---

## Mobile First

Princípio de desenvolvimento onde toda funcionalidade é concebida inicialmente para smartphones.

---

## Multiempresa (Multi-Tenant)

Característica da plataforma que permite atender múltiplas organizações com isolamento completo dos dados.

---

# N

## Não Conformidade

Situação que não atende requisitos técnicos, legais ou procedimentais.

Pode originar uma ocorrência.

---

## Notificação

Mensagem enviada automaticamente pelo sistema para informar uma ação, mudança de status ou necessidade de atuação.

---

# O

## Ocorrência

Registro principal do sistema.

Representa uma Paralisação Preventiva ou uma Interdição Oficial.

Todas as informações do workflow estão vinculadas à ocorrência.

---

## Offline

Estado em que o dispositivo não possui conexão com a internet.

Durante esse período o sistema continua operando localmente.

---

## Organização

Empresa ou unidade proprietária dos dados.

O SafeStop é Multi-Tenant.

Cada organização possui isolamento completo.

---

# P

## Paralisação Preventiva

Interrupção temporária de uma atividade devido à identificação de uma condição insegura.

É o estado inicial do workflow do SafeStop.

---

## Permissão

Autorização concedida a um usuário para executar determinada ação.

---

## Plano de Ação

Conjunto de ações destinadas à eliminação ou controle das causas da ocorrência.

---

## Push Notification

Mensagem enviada ao dispositivo móvel mesmo quando o aplicativo não está aberto.

---

# Q

## Query

Operação destinada exclusivamente à consulta de informações.

Nunca modifica dados.

---

# R

## Realtime

Tecnologia utilizada para atualização instantânea entre clientes conectados.

---

## Referência IMS

Código registrado manualmente pelo usuário após criação oficial da ocorrência no sistema IMS.

Exemplo:

```text
BAA-26-000123
```

---

## RLS

Row Level Security.

Mecanismo do PostgreSQL utilizado para garantir isolamento dos dados entre organizações.

---

## Role

Conjunto de permissões atribuídas a um usuário.

Exemplos:

- HSE de Campo
- Liderança da Contratada
- Fiscal do Contrato
- Supervisor HSE
- Liderança HSE
- Gestor
- Administrador da Empresa
- Administrador da Plataforma

---

# S

## SafeStop

Plataforma Enterprise desenvolvida para comunicação, gestão e acompanhamento de Paralisações Preventivas e Interdições Oficiais em ambientes industriais.

---

## Server Action

Função executada no servidor responsável pelas mutações da aplicação.

---

## Service

Camada responsável pela comunicação entre Frontend e Backend.

---

## Sincronização

Processo responsável por enviar dados armazenados localmente para o servidor quando a conexão for restabelecida.

---

## Status

Representa a etapa atual da ocorrência dentro do Workflow.

Os status oficiais encontram-se definidos em:

```text
docs/workflow.md
```

---

# T

## TanStack Query

Biblioteca oficial utilizada para gerenciamento de Server State.

---

## Timeline

Histórico cronológico da ocorrência.

Apresenta todas as ações executadas durante sua vida útil.

---

# U

## Unidade

Instalação ou planta industrial pertencente a uma organização, que agrupa áreas, contratos e atividades.

---

## Upload

Processo de envio de arquivos para o Supabase Storage.

---

## Usuário

Pessoa autenticada no sistema.

Todo usuário pertence obrigatoriamente a uma Organização.

---

# V

## Validação

Processo realizado após execução das ações corretivas para verificar se a atividade pode ser liberada.

---

## Ver e Agir

Decisão operacional indicando que a atividade poderá continuar mediante adoção de medidas imediatas de controle.

Não caracteriza Interdição Oficial.

---

# W

## Workflow

Fluxo oficial da ocorrência.

Define:

- estados;
- transições;
- responsáveis;
- notificações;
- permissões;
- regras de negócio.

Toda alteração no Workflow deve ser documentada em:

```text
docs/workflow.md
```

---

# Convenções

Sempre utilizar exatamente a terminologia definida neste documento.

Evitar sinônimos para termos oficiais.

Exemplo:

Utilizar:

- Paralisação Preventiva

Não utilizar:

- Bloqueio Preventivo
- Interrupção Preventiva
- Parada de Segurança

---

# Fonte da Verdade

Este Glossário é a referência oficial de terminologia do SafeStop.

Sempre que houver conflito entre documentos, os termos definidos neste Glossário prevalecem.

Toda nova funcionalidade que introduzir um novo conceito deverá atualizar este documento.

---

# Regra Final

Uma mesma funcionalidade deve possuir sempre o mesmo nome em:

- código;
- banco de dados;
- API;
- documentação;
- interface;
- notificações;
- mensagens;
- Design System.

A consistência da terminologia é parte fundamental da qualidade do SafeStop.
