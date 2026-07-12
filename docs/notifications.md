# Notificações do SafeStop

> Documento de referência para toda a estratégia de comunicação, notificações, confirmação de ciência, escalonamento, auditoria e rastreabilidade do SafeStop.

---

# 1. Objetivo

O SafeStop foi criado para resolver um problema recorrente nas operações industriais:

> "Eu não sabia."

ou

> "Ninguém me avisou."

O sistema existe para garantir que a comunicação aconteça de forma rápida, automática, rastreável e confiável.

As notificações são o principal mecanismo para reduzir o tempo entre a identificação de uma condição insegura e a tomada de decisão.

Elas não servem apenas para informar.

Elas servem para garantir que as pessoas corretas sejam comunicadas no menor tempo possível.

---

# 2. Princípios

Toda comunicação do SafeStop deve seguir os princípios abaixo.

## Comunicação imediata

Primeiro comunicar.

Depois documentar.

Jamais esperar o preenchimento completo da ocorrência para iniciar a comunicação.

---

## Comunicação automática

O usuário nunca deverá escolher manualmente todos os destinatários.

O sistema deverá identificar automaticamente quem deve ser comunicado.

---

## Comunicação rastreável

Toda comunicação deverá responder:

Quem recebeu?

Quem visualizou?

Quem confirmou ciência?

Quem ainda não respondeu?

Quando isso aconteceu?

---

## Comunicação escalável

Uma mesma ocorrência poderá gerar diversas notificações ao longo do seu ciclo de vida.

---

## Comunicação inteligente

Cada evento deverá comunicar apenas as pessoas realmente envolvidas.

Evitar excesso de notificações.

---

# 3. Filosofia

O SafeStop NÃO é um aplicativo de Push Notification.

Ele é um sistema de comunicação operacional.

Toda notificação representa um evento operacional importante.

As notificações fazem parte do fluxo da ocorrência.

---

# 4. Arquitetura

A comunicação será dividida em quatro camadas.

```
Evento
        ↓
Determinação dos destinatários
        ↓
Geração das notificações
        ↓
Entrega pelos canais disponíveis
```

Cada camada possui responsabilidade própria.

---

# 5. Evento

Um evento representa algo que aconteceu no sistema.

Exemplos:

- Paralisação criada
- Avaliação iniciada
- Interdição confirmada
- MDHO enviado
- MDHO aprovado
- Referência IMS registrada
- Plano de ação criado
- Correção enviada
- Atividade liberada

O evento não conhece usuários.

Ele apenas informa que algo aconteceu.

---

# 6. Descoberta automática dos destinatários

Após o evento ser criado, o sistema identifica quem deve ser comunicado.

Essa identificação poderá considerar:

- organização;
- empresa contratada;
- unidade;
- área;
- contrato;
- gerência;
- papel do usuário;
- responsáveis cadastrados;
- criticidade da ocorrência.

O usuário de campo não deverá perder tempo escolhendo destinatários.

---

# 7. Geração das notificações

Após identificar os destinatários, o sistema cria uma notificação individual para cada usuário.

Cada usuário possui sua própria notificação.

Isso permite controlar:

- leitura;
- ciência;
- histórico;
- falhas;
- auditoria.

---

# 8. Entrega

Cada notificação poderá ser entregue por um ou mais canais.

No MVP:

- Push
- Notificação interna

Futuro:

- Email
- WhatsApp
- Microsoft Teams

A entrega é independente do evento.

---

# 9. Prioridades

Todas as notificações possuirão prioridade.

## CRITICAL

Situações com risco imediato.

Exemplos:

- Paralisação Preventiva
- Interdição Oficial

Comportamento:

- Push imediato
- Destaque máximo
- Ciência obrigatória quando configurado

---

## HIGH

Exemplos:

- Avaliação pendente
- MDHO aguardando aprovação
- Correção aguardando validação

---

## MEDIUM

Exemplos:

- Plano de ação criado
- Comentário importante
- Nova evidência

---

## LOW

Exemplos:

- Atualizações informativas
- Encerramento
- Histórico

---

# 10. Canais

## Push

Principal canal do aplicativo.

Características:

- rápido
- silencioso ou sonoro conforme prioridade
- abre diretamente a ocorrência

---

## Notificação interna

Sempre armazenada no banco.

Mesmo que o Push falhe.

Nunca deve depender do Push.

---

## Email

Futuro.

Utilizado principalmente para liderança.

---

## WhatsApp

Futuro.

Nunca substituirá o Push.

Será complementar.

---

# 11. Tipos de Evento

## Ocorrência criada

Quando uma Paralisação Preventiva é registrada.

Prioridade:

CRITICAL

Destinatários:

- Liderança da contratada
- Fiscal
- Supervisor HSE
- Responsáveis cadastrados

---

## Avaliação pendente

Quando a liderança deve analisar a ocorrência.

Prioridade:

HIGH

---

## Ver e Agir

Quando a liderança decide por correção imediata.

Prioridade:

HIGH

---

## Interdição Oficial

Quando a atividade permanece interditada.

Prioridade:

CRITICAL

---

## MDHO aguardando preenchimento

Prioridade:

HIGH

---

## MDHO enviado

Prioridade:

HIGH

---

## MDHO devolvido

Prioridade:

HIGH

---

## MDHO aprovado

Prioridade:

HIGH

---

## Referência IMS registrada

Prioridade:

MEDIUM

Importante:

O SafeStop apenas comunica que o código foi registrado.

Ele não consulta o IMS.

---

## Plano de ação criado

Prioridade:

MEDIUM

---

## Ação atrasada

Prioridade:

HIGH

---

## Correção enviada

Prioridade:

HIGH

---

## Correção rejeitada

Prioridade:

HIGH

---

## Atividade liberada

Prioridade:

MEDIUM

---

## Ocorrência encerrada

Prioridade:

LOW

---

# 12. Fluxo das Notificações

```
Evento
      ↓
Selecionar destinatários
      ↓
Criar Notification Event
      ↓
Criar Notifications
      ↓
Entregar Push
      ↓
Registrar entrega
      ↓
Registrar leitura
      ↓
Registrar ciência
```

Todo o fluxo deve ser auditável.

---

# 13. Destinatários

O sistema poderá comunicar:

- Autor
- Liderança da contratada
- Fiscal
- Supervisor HSE
- Liderança HSE
- Gestor
- Área responsável
- Empresa responsável

Nunca utilizar listas fixas no código.

Tudo deve ser configurável.

---

# 14. Confirmação de Ciência

Receber não significa visualizar.

Visualizar não significa confirmar ciência.

São três eventos diferentes.

## Recebido

A notificação foi criada.

---

## Visualizado

O usuário abriu a ocorrência.

---

## Ciência

O usuário confirma:

"Estou ciente desta ocorrência."

Somente nesse momento o sistema registra ciência.

---

# 15. Registro da Ciência

O sistema deverá armazenar:

- usuário
- ocorrência
- data
- hora
- dispositivo
- canal

A ciência nunca deve ser sobrescrita.

Ela faz parte da auditoria.

---

# 16. Push Notification

O Push deverá conter apenas informações suficientes para chamar atenção.

Exemplo:

🚨 Paralisação Preventiva

Área Digestão

Toque para visualizar.

Jamais enviar descrições enormes.

O detalhe ficará na ocorrência.

---

# 17. Notificações Internas

Toda notificação deverá existir dentro do SafeStop.

Mesmo que:

- Push falhe
- Internet oscile
- Usuário esteja offline

O histórico permanecerá disponível.

---

# 18. Histórico

Cada notificação deverá registrar:

- Evento
- Usuário
- Canal
- Data de criação
- Data de entrega
- Data de leitura
- Data de ciência
- Status
- Tentativas
- Falhas

Nenhum desses registros deve ser apagado.

# 19. Escalonamento Automático

Nem toda notificação exige apenas um envio.

Ocorrências críticas poderão utilizar regras de escalonamento.

O objetivo não é gerar spam.

O objetivo é garantir que pessoas críticas realmente tomem conhecimento.

---

## 19.1 Exemplo

Paralisação Preventiva criada

↓

Supervisor recebe Push

↓

15 minutos

↓

Sem confirmação de ciência

↓

Novo Push

↓

30 minutos

↓

Ainda sem ciência

↓

Notificar Liderança HSE

↓

60 minutos

↓

Ainda sem ciência

↓

Notificar Gerência

↓

Registrar toda a sequência na auditoria.

---

## 19.2 Regras

Cada organização poderá configurar:

- tempo até primeiro reforço;
- tempo até segundo reforço;
- quantidade máxima de tentativas;
- perfis envolvidos no escalonamento;
- criticidades que utilizam escalonamento.

---

# 20. Falhas de Entrega

O SafeStop deve diferenciar claramente:

## Enviado

A notificação foi enviada ao provedor.

---

## Entregue

O provedor confirmou a entrega.

---

## Visualizada

O usuário abriu a notificação ou a ocorrência.

---

## Ciência

O usuário confirmou que tomou conhecimento.

---

## Falhou

O envio não ocorreu.

A falha deve registrar:

- motivo;
- data;
- canal;
- tentativa.

---

# 21. Retentativas

O sistema poderá tentar reenviar automaticamente notificações críticas.

Exemplo:

Tentativa 1

↓

Falhou

↓

Aguardar

↓

Tentativa 2

↓

Falhou

↓

Tentativa 3

↓

Registrar falha definitiva.

O número de tentativas deverá ser configurável.

---

# 22. Templates

Os templates devem ser curtos.

A notificação serve para chamar atenção.

O detalhe permanece na ocorrência.

---

## Paralisação Preventiva

🚨 PARALISAÇÃO PREVENTIVA

Empresa

Área

Atividade interrompida.

Toque para visualizar.

---

## Avaliação pendente

📋 Avaliação necessária

Existe uma ocorrência aguardando sua decisão.

---

## Ver e Agir

🟡 Correção imediata necessária.

A atividade aguarda tratativa.

---

## Interdição Oficial

⛔ INTERDIÇÃO OFICIAL

A atividade permanece interditada.

Avaliação obrigatória.

---

## MDHO aguardando

📄 MDHO aguardando preenchimento.

---

## MDHO devolvido

⚠️ O MDHO foi devolvido para correção.

---

## MDHO aprovado

✅ MDHO aprovado.

Prosseguir com o fluxo.

---

## Referência IMS registrada

📝 Referência IMS registrada.

Código:

BAA-26-0001

---

## Plano de ação

📋 Novo plano de ação disponível.

---

## Ação atrasada

⏰ Ação corretiva em atraso.

---

## Correção enviada

📷 Correção enviada.

Aguardando validação.

---

## Correção rejeitada

❌ Correção rejeitada.

Nova ação necessária.

---

## Atividade liberada

✅ Atividade liberada.

---

## Ocorrência encerrada

✔️ Ocorrência encerrada.

---

# 23. Central de Notificações

O aplicativo deverá possuir uma Central de Notificações.

Cada item deverá apresentar:

- prioridade;
- ícone;
- título;
- resumo;
- data;
- status;
- indicador de leitura;
- indicador de ciência.

Filtros:

- Todas
- Não lidas
- Pendentes de ciência
- Críticas
- Interdições
- Ver e Agir

---

# 24. Badge da Aplicação

O aplicativo poderá exibir:

Quantidade de notificações não lidas.

Separadamente poderá existir:

Quantidade pendente de ciência.

Exemplo:

12 notificações

3 aguardando ciência

---

# 25. Indicadores

O módulo de notificações deverá permitir calcular:

- notificações enviadas;
- notificações entregues;
- notificações lidas;
- confirmações de ciência;
- tempo médio até leitura;
- tempo médio até ciência;
- usuários sem ciência;
- falhas de entrega;
- notificações por prioridade;
- notificações por empresa;
- notificações por área;
- notificações por canal.

---

# 26. Offline

O comportamento offline deve seguir regras claras.

---

## Ocorrência criada offline

Registrar localmente.

Quando houver conexão:

↓

Enviar ao servidor.

↓

Somente após confirmação do servidor:

↓

Gerar notificações.

Nunca gerar Push enquanto a ocorrência existir apenas localmente.

---

## Notificações

Caso o dispositivo fique offline:

As notificações já existentes permanecem disponíveis.

Novas notificações serão sincronizadas quando houver conexão.

---

# 27. Segurança

As notificações nunca devem conter informações sensíveis em excesso.

Evitar:

- descrições longas;
- dados pessoais desnecessários;
- informações sigilosas.

O Push deve apenas chamar atenção.

Os detalhes ficam protegidos dentro do aplicativo.

---

# 28. Auditoria

Toda comunicação deverá gerar auditoria.

Eventos mínimos:

- notificação criada;
- tentativa de envio;
- entrega;
- leitura;
- confirmação de ciência;
- falha;
- retentativa;
- escalonamento.

Esses registros não devem ser removidos.

---

# 29. Regras Operacionais

O sistema não deve permitir:

- marcar ciência automaticamente;
- marcar leitura automaticamente;
- considerar Push entregue como ciência;
- considerar Push enviado como leitura;
- remover notificações críticas sem autorização;
- apagar histórico de comunicação.

---

# 30. Fluxos por Evento

## Paralisação Preventiva

Criar evento

↓

Descobrir destinatários

↓

Criar notificações

↓

Enviar Push

↓

Registrar entrega

↓

Aguardar leitura

↓

Aguardar ciência

---

## Interdição Oficial

Criar evento

↓

Notificar todos os responsáveis

↓

Registrar ciência

↓

Escalonar quando necessário

---

## MDHO

Criar evento

↓

Notificar responsável

↓

Aguardar envio

↓

Notificar liderança

↓

Aguardar aprovação

---

## Plano de ação

Criar evento

↓

Notificar responsáveis

↓

Controlar prazo

↓

Gerar alerta quando atrasado

---

## Liberação

Criar evento

↓

Comunicar todos os envolvidos

↓

Registrar encerramento da comunicação

---

# 31. Integrações Futuras

O modelo deverá permitir futuramente:

- Email
- WhatsApp Business API
- Microsoft Teams
- SMS
- Webhooks corporativos
- Integração com sistemas internos

Essas integrações não fazem parte do MVP.

---

# 32. Performance

O envio de notificações não deve bloquear o fluxo da aplicação.

Sempre que possível:

- registrar ocorrência;
- confirmar ao usuário;
- processar notificações em segundo plano.

O usuário de campo nunca deve esperar o envio de todas as notificações para continuar utilizando o aplicativo.

---

# 33. Experiência Mobile

As notificações devem ser pensadas primeiro para dispositivos móveis.

Prioridades:

- poucos toques;
- leitura rápida;
- ações diretas;
- carregamento imediato;
- navegação para a ocorrência com um toque.

---

# 34. Fonte da Verdade

Este documento deve respeitar:

docs/product.md

docs/architecture.md

docs/database.md

docs/workflow.md

docs/decisions/

Em caso de conflito:

1. Segurança
2. Fluxo operacional
3. Integridade dos dados
4. Arquitetura
5. Implementação

---

# 35. Regra Final

O SafeStop existe para eliminar atrasos de comunicação em ocorrências de segurança.

Uma notificação somente cumpriu seu objetivo quando:

- chegou à pessoa correta;
- foi visualizada;
- houve confirmação de ciência;
- permaneceu registrada para auditoria.

O sistema deve reduzir o tempo entre a identificação do risco e a tomada de decisão, garantindo que nenhuma ocorrência crítica deixe de ser comunicada por falha humana.

Toda comunicação deve ser:

- rápida;
- automática;
- rastreável;
- auditável;
- segura.

A tecnologia deve apoiar a segurança operacional, nunca criar barreiras para quem está em campo.
