# Fluxo Operacional do SafeStop

> Documento de referência para os status, decisões, permissões, transições e regras operacionais do SafeStop.

---

## 1. Objetivo

Este documento define como uma ocorrência percorre o SafeStop desde a identificação de uma condição insegura até sua liberação e encerramento.

O fluxo deve garantir:

- comunicação imediata;
- redução do tempo de resposta;
- rastreabilidade;
- segurança operacional;
- simplicidade para o usuário de campo;
- controle das decisões da liderança;
- registro estruturado do MDHO;
- acompanhamento da referência manual do IMS;
- prevenção de mudanças de status indevidas.

O SafeStop não deve transformar a paralisação em um processo burocrático.

A prioridade é:

> primeiro interromper e comunicar; depois avaliar, documentar e acompanhar.

---

# 2. Conceitos Principais

## 2.1 Paralisação Preventiva

É a interrupção imediata de uma atividade após a identificação de uma condição insegura.

Ela pode ser registrada por um profissional autorizado em campo.

A Paralisação Preventiva:

- interrompe a atividade;
- inicia a comunicação;
- não significa, por si só, Interdição Oficial;
- aguarda avaliação da liderança;
- deve ser registrada em menos de 60 segundos.

---

## 2.2 Ver e Agir

É a decisão aplicada quando a condição pode ser corrigida imediatamente ou em curto prazo, sem necessidade de Interdição Oficial.

O fluxo exige:

- registro da correção;
- evidência quando necessária;
- validação da liderança;
- liberação da atividade;
- encerramento da ocorrência.

Não existe IMS nesse fluxo.

---

## 2.3 Interdição Oficial

É a decisão aplicada quando a atividade deve permanecer interrompida por risco, gravidade, necessidade de análise técnica ou necessidade de ações corretivas formais.

A Interdição Oficial inicia:

- Avaliação Técnica MDHO;
- avaliação da liderança HSE;
- registro manual da referência do IMS, quando emitido externamente;
- plano de ação;
- acompanhamento das correções;
- validação;
- liberação.

---

## 2.4 Avaliação Técnica MDHO

É a avaliação estruturada dos fatores contribuintes da ocorrência.

Categorias:

- Comportamento;
- Tipo de Desvio;
- Pré-condições;
- Questões Organizacionais;
- Supervisão/Fiscalização.

O MDHO deve utilizar listas padronizadas e permitir complemento textual.

---

## 2.5 Referência do IMS

O SafeStop não gera nem consulta o IMS.

Após o IMS ser criado em outra plataforma, um usuário autorizado informa manualmente o código no SafeStop.

Exemplo:

```text
BAA-26-0001
```

Esse código serve apenas como referência de acompanhamento.

---

# 3. Perfis Operacionais

Os nomes abaixo representam responsabilidades. As permissões reais deverão ser verificadas por códigos de autorização.

## 3.1 HSE de Campo

Pode:

- registrar Paralisação Preventiva;
- anexar fotos;
- informar localização;
- acompanhar ocorrências do seu escopo;
- adicionar comentários;
- registrar evidências de campo;
- confirmar ciência quando for destinatário.

Não pode, por padrão:

- confirmar Interdição Oficial;
- aprovar MDHO;
- liberar atividade;
- registrar referência IMS sem permissão específica.

---

## 3.2 Liderança da Contratada

Pode:

- receber alerta;
- confirmar ciência;
- acompanhar ocorrências relacionadas à contratada;
- registrar correções;
- anexar evidências;
- acompanhar ações corretivas;
- responder solicitações da liderança HSE.

---

## 3.3 Fiscal do Contrato

Pode, conforme permissão:

- visualizar ocorrências do contrato;
- participar da avaliação;
- acompanhar tratativas;
- validar correções;
- registrar observações;
- confirmar ciência.

---

## 3.4 Supervisor HSE

Pode, conforme permissão:

- iniciar avaliação;
- registrar decisão;
- classificar como Ver e Agir;
- confirmar Interdição Oficial;
- acompanhar MDHO;
- validar correções;
- liberar atividade;
- registrar referência do IMS.

---

## 3.5 Liderança HSE

Pode:

- aprovar ou devolver MDHO;
- acompanhar Interdições Oficiais;
- validar planos de ação;
- liberar atividades;
- revisar decisões;
- registrar referência IMS quando autorizado;
- consultar auditoria.

---

## 3.6 Gestor

Pode, conforme escopo:

- acompanhar ocorrências;
- receber alertas;
- confirmar ciência;
- consultar indicadores;
- acompanhar ações e prazos.

---

## 3.7 Administrador

Pode:

- gerenciar usuários;
- configurar áreas;
- definir responsáveis;
- configurar listas MDHO;
- administrar papéis e permissões;
- consultar auditoria;
- ajustar configurações do sistema.

O administrador não deve alterar ocorrências críticas sem justificativa e trilha de auditoria.

---

# 4. Status Oficiais

Os status iniciais do SafeStop serão:

```text
PARALISACAO_PREVENTIVA
EM_AVALIACAO
VER_E_AGIR
INTERDICAO_CONFIRMADA
MDHO_EM_PREENCHIMENTO
AGUARDANDO_APROVACAO_HSE
AGUARDANDO_REGISTRO_IMS
EM_TRATATIVA
AGUARDANDO_VALIDACAO
LIBERADA
ENCERRADA
CANCELADA
```

---

# 5. Significado de Cada Status

## 5.1 `PARALISACAO_PREVENTIVA`

A atividade foi interrompida e a ocorrência foi registrada.

Ações do sistema:

- gerar código interno;
- registrar autor, data e hora;
- salvar localização e evidências;
- identificar destinatários;
- criar notificações;
- disparar alertas;
- registrar timeline.

Próximo status permitido:

```text
EM_AVALIACAO
CANCELADA
```

---

## 5.2 `EM_AVALIACAO`

A liderança está analisando a ocorrência.

Ações possíveis:

- revisar evidências;
- solicitar complemento;
- adicionar comentário;
- confirmar ciência;
- registrar decisão.

Decisões permitidas:

```text
VER_E_AGIR
INTERDICAO_CONFIRMADA
```

---

## 5.3 `VER_E_AGIR`

A ocorrência será corrigida sem Interdição Oficial.

Ações necessárias:

- registrar correção;
- anexar evidência quando exigida;
- enviar para validação.

Próximo status:

```text
AGUARDANDO_VALIDACAO
```

Também poderá ser cancelada apenas mediante justificativa e permissão.

---

## 5.4 `INTERDICAO_CONFIRMADA`

A liderança confirmou a Interdição Oficial.

Ações do sistema:

- registrar decisão;
- notificar envolvidos;
- bloquear liberação imediata;
- iniciar fluxo MDHO;
- criar timeline;
- manter atividade interrompida.

Próximo status:

```text
MDHO_EM_PREENCHIMENTO
```

---

## 5.5 `MDHO_EM_PREENCHIMENTO`

A avaliação técnica está sendo preenchida.

Requisitos:

- preencher categorias obrigatórias;
- respeitar seleção única ou múltipla;
- detalhar opção “Outro”;
- informar complemento quando necessário.

Próximo status:

```text
AGUARDANDO_APROVACAO_HSE
```

---

## 5.6 `AGUARDANDO_APROVACAO_HSE`

O MDHO foi enviado para análise da liderança HSE.

A liderança poderá:

- aprovar;
- devolver para correção.

Se aprovado:

```text
AGUARDANDO_REGISTRO_IMS
```

Se devolvido:

```text
MDHO_EM_PREENCHIMENTO
```

A devolução exige justificativa.

---

## 5.7 `AGUARDANDO_REGISTRO_IMS`

O MDHO foi aprovado e a ocorrência aguarda o preenchimento manual da referência do IMS.

Importante:

- o IMS é gerado em outra plataforma;
- o SafeStop não consulta essa plataforma;
- o código é digitado manualmente;
- o registro deve informar usuário, data e hora.

Após o registro da referência IMS:

```text
EM_TRATATIVA
```

O projeto poderá futuramente permitir avanço sem código IMS em situações autorizadas, mas essa exceção deve ser explícita e auditável.

---

## 5.8 `EM_TRATATIVA`

A ocorrência possui ações corretivas em andamento.

Ações permitidas:

- criar ações;
- atribuir responsáveis;
- definir prazos;
- anexar evidências;
- registrar atualizações;
- concluir ações;
- rejeitar correções;
- solicitar complementos.

Próximo status:

```text
AGUARDANDO_VALIDACAO
```

---

## 5.9 `AGUARDANDO_VALIDACAO`

As correções foram enviadas e aguardam validação.

A liderança poderá:

- aprovar;
- rejeitar;
- solicitar nova evidência.

Se rejeitada:

```text
VER_E_AGIR
```

ou:

```text
EM_TRATATIVA
```

conforme o fluxo de origem.

Se aprovada:

```text
LIBERADA
```

---

## 5.10 `LIBERADA`

A liderança autorizou a retomada da atividade.

Requisitos:

- usuário autorizado;
- correções concluídas;
- evidências suficientes;
- ações obrigatórias concluídas;
- nota de liberação;
- data e hora registradas.

Próximo status:

```text
ENCERRADA
```

A liberação não deve apagar a ocorrência ou seu histórico.

---

## 5.11 `ENCERRADA`

A ocorrência foi concluída.

Permissões:

- leitura;
- consulta;
- relatório;
- auditoria.

Alterações posteriores somente com permissão especial e justificativa.

---

## 5.12 `CANCELADA`

A ocorrência foi cancelada.

O cancelamento exige:

- motivo;
- usuário autorizado;
- data e hora;
- registro em auditoria.

Exemplos de motivo:

- registro duplicado;
- ocorrência aberta por engano;
- teste autorizado;
- área ou atividade informada incorretamente e impossível de corrigir sem recriação.

Cancelamento não deve ser utilizado para ocultar ocorrência válida.

---

# 6. Fluxo Principal

```text
Condição insegura identificada
            ↓
Atividade interrompida
            ↓
Paralisação Preventiva registrada
            ↓
Alertas enviados aos responsáveis
            ↓
Liderança inicia avaliação
            ↓
      ┌───────────────┴───────────────┐
      ↓                               ↓
   VER E AGIR               INTERDIÇÃO OFICIAL
      ↓                               ↓
Correção imediata                  MDHO
      ↓                               ↓
Evidência                     Aprovação HSE
      ↓                               ↓
Validação                 Registro manual do IMS
      ↓                               ↓
Liberação                      Plano de ação
      ↓                               ↓
Encerramento                   Correções
                                      ↓
                                 Validação
                                      ↓
                                  Liberação
                                      ↓
                                 Encerramento
```

---

# 7. Fluxo de Abertura da Paralisação

## 7.1 Campos mínimos

Para preservar a velocidade, a abertura deve exigir apenas o necessário.

Campos mínimos:

- área;
- local;
- empresa envolvida;
- atividade;
- descrição da condição insegura;
- criticidade;
- ao menos uma evidência, quando viável;
- autor;
- data e hora automáticas.

Campos automáticos:

- usuário;
- data;
- hora;
- código interno;
- organização;
- status;
- localização, quando autorizada.

---

## 7.2 Comunicação imediata

A ocorrência deve ser comunicada assim que for registrada no servidor.

A comunicação não deve aguardar:

- MDHO;
- IMS;
- plano de ação;
- descrição extensa;
- aprovação formal.

A interface deve diferenciar claramente:

```text
Salvo no dispositivo
Enviando
Registrado no servidor
Alertas enviados
Falha no envio
```

O sistema nunca deve informar “alertas enviados” se a ocorrência ainda estiver somente no dispositivo.

---

# 8. Fluxo de Avaliação da Liderança

Ao abrir a ocorrência, a liderança deve visualizar:

- código interno;
- autor;
- empresa;
- área;
- local;
- atividade;
- descrição;
- criticidade;
- fotos;
- horário da paralisação;
- destinatários notificados;
- confirmações de ciência;
- histórico.

A liderança deve registrar:

- decisão;
- justificativa;
- data e hora;
- usuário responsável.

Decisões permitidas:

```text
VER_E_AGIR
INTERDICAO_OFICIAL
```

Não permitir decisão sem justificativa mínima.

---

# 9. Fluxo Ver e Agir

## 9.1 Etapas

```text
Decisão: Ver e Agir
        ↓
Contratada recebe solicitação
        ↓
Correção executada
        ↓
Evidência anexada
        ↓
Correção enviada para validação
        ↓
Liderança aprova ou rejeita
        ↓
Liberação
        ↓
Encerramento
```

## 9.2 Regras

- não gera IMS;
- não exige MDHO;
- pode exigir foto antes e depois;
- a validação não deve ser realizada pela mesma pessoa que registrou a correção quando houver segregação definida;
- rejeição deve informar motivo;
- liberação exige usuário autorizado.

---

# 10. Fluxo de Interdição Oficial

## 10.1 Etapas

```text
Decisão: Interdição Oficial
        ↓
Comunicação reforçada
        ↓
MDHO em preenchimento
        ↓
Envio para liderança HSE
        ↓
Aprovação ou devolução
        ↓
Registro manual da referência IMS
        ↓
Plano de ação
        ↓
Execução das correções
        ↓
Validação
        ↓
Liberação
        ↓
Encerramento
```

## 10.2 Regras

- a atividade permanece interrompida;
- a Interdição Oficial exige MDHO;
- o SafeStop não emite o IMS;
- o código IMS é apenas digitado manualmente;
- ações corretivas devem possuir responsáveis e prazos;
- a liberação deve ser formal e auditável.

---

# 11. Fluxo MDHO

## 11.1 Categorias

### Comportamento

Seleção múltipla.

### Tipo de Desvio

Seleção única:

```text
ERRO
VIOLACAO
```

### Pré-condições

Seleção múltipla.

### Questões Organizacionais

Seleção múltipla.

### Supervisão/Fiscalização

Seleção múltipla.

---

## 11.2 Regras

- todas as categorias obrigatórias devem ser preenchidas;
- “Outro” exige detalhamento;
- a avaliação pode ser salva como rascunho;
- somente avaliação enviada pode ser aprovada;
- avaliação devolvida retorna para edição;
- aprovação e devolução devem aparecer na timeline;
- listas devem ser configuráveis pela organização;
- alterações nas listas não devem modificar avaliações antigas.

---

# 12. Fluxo da Referência IMS

## 12.1 Registro

Após aprovação do MDHO, um usuário autorizado informa manualmente:

```text
BAA-26-0001
```

O SafeStop registra:

- código;
- usuário;
- data;
- hora;
- ocorrência relacionada.

## 12.2 Correção

Se houver erro de digitação, um usuário autorizado poderá corrigir.

A alteração deve registrar:

- valor anterior;
- novo valor;
- usuário;
- data;
- justificativa.

## 12.3 Limites

O SafeStop não deve:

- acessar a plataforma IMS;
- gerar IMS;
- validar se o código existe;
- consultar status;
- sincronizar dados;
- importar informações;
- alterar a ocorrência externa.

---

# 13. Fluxo do Plano de Ação

## 13.1 Campos mínimos da ação

- título;
- descrição;
- responsável;
- organização responsável;
- prazo;
- prioridade;
- status.

## 13.2 Etapas

```text
PENDING
IN_PROGRESS
AWAITING_VALIDATION
COMPLETED
REJECTED
CANCELLED
```

## 13.3 Regras

- toda ação deve possuir responsável;
- ação atrasada deve gerar alerta;
- conclusão pode exigir evidência;
- conclusão e validação são etapas diferentes;
- rejeição exige justificativa;
- ações críticas não podem ser canceladas sem autorização.

---

# 14. Fluxo de Validação e Liberação

## 14.1 Verificações obrigatórias

Antes da liberação:

- confirmar status correto;
- verificar correções;
- revisar evidências;
- confirmar ações concluídas;
- registrar nota de liberação;
- identificar usuário responsável.

## 14.2 Ação de liberar

Ao liberar, o sistema deve:

- atualizar status;
- registrar data e hora;
- registrar usuário;
- criar histórico;
- criar auditoria;
- notificar os envolvidos;
- manter todas as evidências.

## 14.3 Encerramento

A ocorrência poderá ser encerrada:

- imediatamente após liberação, ou
- após uma etapa administrativa simples.

A decisão final será validada no MVP.

---

# 15. Confirmação de Ciência

A confirmação de ciência é diferente de leitura.

## 15.1 Leitura

Ocorre quando o usuário abre a notificação ou a ocorrência.

## 15.2 Ciência

Ocorre quando o usuário confirma explicitamente que tomou conhecimento.

O sistema deve registrar:

- destinatário;
- data;
- hora;
- ocorrência;
- canal de acesso.

Notificações críticas poderão exigir ciência obrigatória.

---

# 16. Regras de Notificação por Etapa

## 16.1 Paralisação criada

Notificar:

- liderança da contratada;
- fiscal do contrato;
- supervisor HSE;
- responsável pela empresa;
- gerência responsável;
- demais destinatários configurados.

## 16.2 Avaliação pendente

Notificar:

- avaliadores definidos;
- liderança HSE, conforme criticidade.

## 16.3 Ver e Agir

Notificar:

- responsável pela correção;
- liderança da contratada;
- avaliador;
- fiscal.

## 16.4 Interdição Oficial

Notificar:

- todos os responsáveis da ocorrência;
- liderança HSE;
- gerência;
- contratada;
- fiscal.

## 16.5 MDHO pendente

Notificar:

- responsável pelo preenchimento;
- aprovador HSE quando enviado.

## 16.6 Ação atrasada

Notificar:

- responsável pela ação;
- liderança da contratada;
- gestor configurado.

## 16.7 Correção enviada

Notificar:

- validador;
- liderança HSE;
- fiscal, quando aplicável.

## 16.8 Liberação

Notificar:

- autor;
- contratada;
- fiscalização;
- liderança;
- destinatários originais.

As regras detalhadas ficarão em `docs/notifications.md`.

---

# 17. Permissões por Transição

| Transição                    | Permissão sugerida                |
| ---------------------------- | --------------------------------- |
| Criar paralisação            | `occurrence.create`               |
| Iniciar avaliação            | `occurrence.evaluate`             |
| Definir Ver e Agir           | `occurrence.evaluate`             |
| Confirmar Interdição Oficial | `occurrence.confirm_interdiction` |
| Preencher MDHO               | `mdho.fill`                       |
| Enviar MDHO                  | `mdho.submit`                     |
| Aprovar MDHO                 | `mdho.approve`                    |
| Devolver MDHO                | `mdho.return`                     |
| Registrar referência IMS     | `ims_reference.register`          |
| Alterar referência IMS       | `ims_reference.update`            |
| Criar plano de ação          | `action_plan.create`              |
| Gerenciar ações              | `action_plan.manage`              |
| Validar correção             | `occurrence.validate_correction`  |
| Liberar atividade            | `occurrence.release`              |
| Cancelar ocorrência          | `occurrence.cancel`               |
| Confirmar ciência            | `notification.confirm_awareness`  |

---

# 18. Transições Permitidas

```text
PARALISACAO_PREVENTIVA
  → EM_AVALIACAO
  → CANCELADA

EM_AVALIACAO
  → VER_E_AGIR
  → INTERDICAO_CONFIRMADA
  → CANCELADA

VER_E_AGIR
  → AGUARDANDO_VALIDACAO
  → CANCELADA

INTERDICAO_CONFIRMADA
  → MDHO_EM_PREENCHIMENTO

MDHO_EM_PREENCHIMENTO
  → AGUARDANDO_APROVACAO_HSE

AGUARDANDO_APROVACAO_HSE
  → MDHO_EM_PREENCHIMENTO
  → AGUARDANDO_REGISTRO_IMS

AGUARDANDO_REGISTRO_IMS
  → EM_TRATATIVA

EM_TRATATIVA
  → AGUARDANDO_VALIDACAO

AGUARDANDO_VALIDACAO
  → VER_E_AGIR
  → EM_TRATATIVA
  → LIBERADA

LIBERADA
  → ENCERRADA
```

Nenhuma outra transição deve ser permitida sem regra explícita.

---

# 19. Ações Proibidas

O sistema não deve permitir:

- alterar status diretamente pelo cliente;
- liberar ocorrência sem permissão;
- confirmar Interdição Oficial sem decisão registrada;
- iniciar MDHO antes da Interdição Oficial;
- aprovar MDHO incompleto;
- registrar referência IMS no fluxo Ver e Agir;
- apagar histórico;
- apagar auditoria;
- excluir evidência crítica após encerramento;
- considerar notificação enviada como ciência;
- marcar ocorrência como comunicada sem confirmação do servidor;
- saltar etapas sem justificativa e autorização.

---

# 20. Idempotência

As ações abaixo devem aceitar proteção contra repetição:

- criação da ocorrência;
- decisão da liderança;
- envio do MDHO;
- aprovação do MDHO;
- registro da referência IMS;
- confirmação de ciência;
- envio de correção;
- liberação.

Cliques repetidos não podem gerar:

- ocorrências duplicadas;
- notificações duplicadas;
- múltiplas decisões;
- históricos repetidos;
- múltiplas liberações.

---

# 21. Falhas de Conectividade

## 21.1 Antes do envio

O aplicativo deve preservar o formulário localmente.

## 21.2 Durante o envio

Exibir:

```text
Enviando ocorrência...
```

## 21.3 Sem confirmação do servidor

Exibir:

```text
Aguardando conexão
```

Não exibir:

```text
Alerta enviado
```

## 21.4 Após confirmação

Exibir:

```text
Ocorrência registrada e responsáveis notificados
```

O comportamento offline completo será tratado em fase futura.

---

# 22. Timeline

Toda ocorrência deve apresentar uma linha do tempo.

Eventos mínimos:

- Paralisação Preventiva criada;
- destinatários identificados;
- notificações enviadas;
- notificações visualizadas;
- ciências confirmadas;
- avaliação iniciada;
- decisão registrada;
- Interdição Oficial confirmada;
- MDHO iniciado;
- MDHO enviado;
- MDHO aprovado ou devolvido;
- referência IMS registrada;
- plano de ação criado;
- ação atualizada;
- correção enviada;
- correção aprovada ou rejeitada;
- atividade liberada;
- ocorrência encerrada;
- ocorrência cancelada.

---

# 23. Indicadores Derivados do Fluxo

O sistema deve permitir calcular:

- tempo entre paralisação e primeiro alerta;
- tempo até primeira visualização;
- tempo até primeira ciência;
- tempo até início da avaliação;
- tempo até decisão;
- tempo do fluxo Ver e Agir;
- tempo até aprovação do MDHO;
- tempo até registro da referência IMS;
- tempo de tratativa;
- tempo até liberação;
- ocorrências por decisão;
- ocorrências por criticidade;
- causas MDHO mais frequentes;
- ações atrasadas;
- destinatários sem ciência.

---

# 24. Exceções Operacionais

Exceções devem ser raras, autorizadas e auditadas.

Exemplos:

- mudança de avaliador;
- correção de área;
- correção de empresa;
- correção da referência IMS;
- reabertura administrativa;
- cancelamento por duplicidade;
- avanço sem código IMS, caso permitido futuramente.

Toda exceção deve registrar:

- motivo;
- usuário;
- data;
- valor anterior;
- novo valor.

---

# 25. Critérios de Aceite do Fluxo

O fluxo será considerado correto quando:

- uma paralisação puder ser registrada rapidamente;
- os responsáveis forem identificados automaticamente;
- o alerta for enviado sem aguardar documentação completa;
- a liderança puder decidir entre Ver e Agir ou Interdição Oficial;
- o MDHO existir apenas em Interdição Oficial;
- o IMS for tratado apenas como referência manual;
- toda mudança de status gerar histórico;
- a liberação exigir autorização;
- o usuário puder identificar quem foi comunicado e quem confirmou ciência;
- nenhuma etapa crítica depender apenas do frontend.

---

# 26. Decisões Pendentes

Antes da implementação final, validar:

1. quem pode registrar Paralisação Preventiva;
2. quem pode confirmar Interdição Oficial;
3. se toda notificação inicial exige ciência;
4. se a referência IMS é obrigatória antes do plano de ação;
5. se a liberação encerra automaticamente a ocorrência;
6. quantidade mínima de evidências;
7. exigência de foto antes e depois no Ver e Agir;
8. regra de segregação entre executor e validador;
9. prazo para primeira avaliação;
10. regra de escalonamento automático;
11. criticidades que exigem notificação adicional;
12. condições para cancelamento;
13. possibilidade de reabertura;
14. obrigatoriedade de contrato;
15. quais perfis poderão corrigir dados cadastrais da ocorrência.

---

# 27. Fonte da Verdade

Este documento deve respeitar:

```text
docs/product.md
docs/architecture.md
docs/database.md
docs/notifications.md
docs/decisions/
```

Em caso de conflito:

1. segurança;
2. fluxo operacional validado;
3. integridade dos dados;
4. arquitetura;
5. implementação existente.

---

# 28. Regra Final

O fluxo do SafeStop deve ser simples para quem está em campo e rigoroso apenas onde a segurança, a autorização e a rastreabilidade exigirem.

A aplicação deve acelerar a comunicação, não criar novas barreiras.

> Parar, comunicar, avaliar, corrigir, validar e liberar — com rapidez, clareza e histórico completo.
