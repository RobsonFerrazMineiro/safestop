# ADR-003 — Arquitetura de Comunicação

**Status:** Aprovado

**Data:** 2026-07-11

**Responsáveis:** Equipe SafeStop

---

# Contexto

Durante a concepção do SafeStop foi identificado um problema recorrente nas operações industriais.

Quando uma atividade é paralisada preventivamente por um profissional de HSE, a comunicação normalmente ocorre por meio de:

- ligações telefônicas;
- mensagens em aplicativos;
- comunicação verbal;
- grupos informais.

Esse processo gera diversos problemas:

- demora para informar toda a liderança;
- pessoas importantes recebem a informação tarde;
- dificuldade para comprovar quem foi comunicado;
- retrabalho;
- perda de tempo operacional;
- falta de rastreabilidade;
- justificativas como:

> "Eu não estava sabendo."

ou

> "Ninguém me avisou."

Foi decidido que o principal objetivo do SafeStop seria reduzir esse tempo entre a identificação do risco e a comunicação efetiva aos responsáveis.

---

# Decisão

O SafeStop será construído tendo a comunicação operacional como seu principal fluxo de negócio.

O registro da ocorrência será apenas o gatilho inicial.

A partir dele, todo o sistema deverá trabalhar para garantir que a informação chegue rapidamente às pessoas corretas.

A comunicação será automática, rastreável e auditável.

---

# Fluxo oficial

O fluxo principal será:

Profissional HSE

↓

Registra Paralisação Preventiva

↓

Ocorrência criada

↓

Sistema identifica automaticamente os responsáveis

↓

Notificações são geradas

↓

Push Notifications são enviados

↓

Central de Notificações é atualizada

↓

Destinatários recebem o alerta

↓

Liderança realiza a avaliação

↓

Decisão:

• Ver e Agir

ou

• Interdição Oficial

↓

Fluxo continua conforme a decisão tomada.

---

# Fonte oficial da comunicação

A notificação registrada no banco será considerada a fonte oficial da comunicação.

Push Notifications representam apenas um canal de entrega.

Caso um Push falhe, a notificação continuará registrada.

Toda comunicação deverá permanecer auditável.

---

# Leitura e Ciência

Foi decidido separar dois conceitos distintos.

## Leitura

Indica apenas que o usuário abriu a notificação ou acessou a ocorrência.

Não representa concordância nem responsabilidade.

---

## Ciência

Representa a confirmação explícita de que o usuário tomou conhecimento da ocorrência.

A confirmação de ciência deverá ser registrada com:

- usuário;
- data;
- hora;
- dispositivo;
- ocorrência relacionada.

Esse registro poderá ser utilizado para auditoria.

---

# Comunicação automática

O usuário que registra a ocorrência não deverá selecionar manualmente todos os destinatários.

O sistema deverá determinar automaticamente quem deve ser comunicado considerando:

- organização;
- empresa contratada;
- unidade;
- área;
- contrato;
- gerência responsável;
- papéis;
- permissões;
- criticidade da ocorrência.

Isso reduz erros humanos e acelera o processo.

---

# Push Notification

Push Notification será utilizado para reduzir o tempo de resposta.

Entretanto:

Push não é a fonte oficial.

Caso o Push não seja entregue, a notificação permanecerá disponível dentro da aplicação.

---

# Conteúdo das notificações

As notificações deverão ser objetivas.

Exemplo:

Nova Paralisação Preventiva registrada.

Área:
Caldeiraria

Empresa:
ABC Montagens

Criticidade:
Alta

Toque para visualizar.

Informações sensíveis deverão permanecer protegidas dentro da aplicação autenticada.

---

# Escalonamento

Ocorrências críticas poderão gerar escalonamento automático.

Exemplos:

- ausência de leitura;
- ausência de ciência;
- demora na avaliação;
- atraso na validação;
- atraso na liberação.

As regras de escalonamento deverão ser configuráveis.

---

# Motivação

Essa arquitetura foi escolhida para:

- reduzir tempo de resposta;
- eliminar falhas de comunicação;
- reduzir ligações telefônicas;
- reduzir mensagens informais;
- aumentar rastreabilidade;
- aumentar transparência;
- permitir auditoria completa;
- melhorar a resposta operacional.

---

# Alternativas avaliadas

## Comunicação manual

Descartada.

Motivos:

- lenta;
- inconsistente;
- não auditável;
- sujeita a esquecimento.

---

## WhatsApp como canal oficial

Descartado.

Motivos:

- dependência de plataforma externa;
- ausência de auditoria completa;
- impossibilidade de controlar leitura;
- dificuldade para comprovação.

O WhatsApp poderá futuramente atuar apenas como canal complementar.

Nunca como fonte oficial.

---

## E-mail como comunicação principal

Descartado.

Motivos:

- baixa velocidade operacional;
- pouco utilizado em campo;
- resposta lenta.

---

# Consequências

## Positivas

- Comunicação imediata.
- Processo auditável.
- Redução de falhas humanas.
- Melhor resposta operacional.
- Histórico completo.
- Maior responsabilidade dos envolvidos.

## Negativas

- Dependência de configuração correta das responsabilidades.
- Necessidade de manter usuários atualizados.
- Dependência parcial dos serviços de Push para comunicação imediata.

Esses impactos são considerados aceitáveis.

---

# Princípios

Toda funcionalidade do SafeStop deverá responder às seguintes perguntas:

Esta funcionalidade reduz o tempo de comunicação?

Ela reduz a possibilidade de alguém dizer:

> "Eu não sabia."

Ela melhora a rastreabilidade?

Ela simplifica a operação?

Se a resposta for negativa, sua implementação deverá ser reavaliada.

---

# Decisões relacionadas

- ADR-001 — Arquitetura do SafeStop
- ADR-002 — Stack Tecnológica
- ADR-004 — Mobile First
- ADR-005 — Simplicidade Operacional

---

# Resultado

O SafeStop estabelece que sua principal responsabilidade é garantir uma comunicação rápida, automática, rastreável e auditável entre os profissionais de campo e as lideranças responsáveis.

Todas as demais funcionalidades da plataforma existem para apoiar esse objetivo principal.
