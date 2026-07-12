# ADR-005 — Simplicidade Operacional

**Status:** Aprovado

**Data:** 2026-07-11

**Responsáveis:** Equipe SafeStop

---

# Contexto

Durante a concepção do SafeStop foi identificado que grande parte da demora na gestão de Paralisações Preventivas e Interdições não está relacionada à identificação do risco, mas sim ao processo burocrático que ocorre após a decisão de interromper uma atividade.

Na prática, o profissional de HSE frequentemente precisa:

- telefonar para diversas pessoas;
- enviar mensagens em grupos;
- localizar supervisores;
- repetir as mesmas informações várias vezes;
- aguardar respostas;
- preencher formulários extensos.

Esse processo consome tempo precioso justamente no momento em que a prioridade deveria ser controlar o risco.

Também foi observado que muitos sistemas corporativos acabam crescendo de forma desordenada, adicionando novas etapas, novos campos e novos fluxos sem avaliar o impacto operacional.

Isso torna o processo mais lento e reduz a adesão dos usuários.

---

# Decisão

O SafeStop adotará oficialmente o princípio da **Simplicidade Operacional**.

Toda funcionalidade deverá existir para tornar o trabalho do usuário mais rápido, mais simples e mais eficiente.

O sistema nunca deverá criar burocracia desnecessária.

Sempre que possível, a tecnologia deverá assumir tarefas repetitivas que hoje são executadas manualmente.

---

# Objetivo

O objetivo do SafeStop não é produzir documentação.

O objetivo do SafeStop é reduzir o tempo entre:

- identificação do risco;
- comunicação;
- avaliação;
- tomada de decisão;
- acompanhamento.

A documentação necessária deverá ser consequência desse processo, e não seu foco principal.

---

# Princípios

Toda nova funcionalidade deverá obedecer aos seguintes princípios.

## Velocidade

O sistema deve reduzir o tempo necessário para executar uma atividade.

Nunca aumentá-lo.

---

## Clareza

O usuário deve compreender imediatamente:

- o que aconteceu;
- qual o próximo passo;
- quem é o responsável;
- qual o status atual.

---

## Menos Digitação

Sempre que possível utilizar:

- listas;
- seletores;
- preenchimento automático;
- sugestões;
- dados previamente cadastrados.

Evitar campos de texto longos quando existirem alternativas melhores.

---

## Menos Cliques

Cada fluxo deverá possuir o menor número possível de etapas.

Sempre que possível:

- remover telas intermediárias;
- eliminar confirmações desnecessárias;
- evitar navegação excessiva.

---

## Automação

O sistema deverá automatizar atividades como:

- identificação de responsáveis;
- envio de notificações;
- criação de histórico;
- auditoria;
- atualização de status;
- registro de datas.

O usuário não deve executar manualmente tarefas que podem ser realizadas automaticamente.

---

## Feedback Imediato

Após qualquer ação importante, o usuário deverá receber retorno imediato.

Exemplos:

- ocorrência registrada;
- notificação enviada;
- avaliação concluída;
- ação corretiva aprovada.

O sistema nunca deverá deixar o usuário em dúvida se a operação foi concluída.

---

# Critério para Novas Funcionalidades

Antes de implementar qualquer nova funcionalidade, responder obrigatoriamente às seguintes perguntas.

## Ela reduz o tempo de operação?

Se não reduzir, deve ser reavaliada.

---

## Ela elimina alguma atividade manual?

Se não eliminar ou simplificar alguma etapa existente, seu benefício deverá ser claramente justificado.

---

## Ela reduz ligações telefônicas?

---

## Ela reduz mensagens informais?

---

## Ela reduz retrabalho?

---

## Ela reduz erros de comunicação?

---

## Ela melhora a rastreabilidade?

---

## Ela melhora a segurança operacional?

---

## Ela aumenta a burocracia?

Se aumentar, a funcionalidade deverá ser redesenhada antes da implementação.

---

# Fluxos

Todos os fluxos deverão priorizar:

- rapidez;
- objetividade;
- poucos passos;
- poucas telas;
- poucos campos.

O usuário deverá conseguir concluir a maioria das ações operacionais em menos de um minuto.

---

# Evolução do Produto

À medida que o SafeStop crescer, novas funcionalidades poderão ser adicionadas.

Entretanto:

nenhuma nova funcionalidade deverá comprometer a simplicidade do fluxo principal.

Quando existir conflito entre:

- adicionar recursos;

ou

- manter a simplicidade operacional;

a simplicidade deverá possuir prioridade.

---

# Motivação

A adoção desse princípio proporciona:

- maior produtividade;
- maior adesão ao sistema;
- menor necessidade de treinamento;
- menor tempo de resposta;
- redução de falhas humanas;
- melhor experiência do usuário.

---

# Alternativas Avaliadas

## Sistema altamente configurável

Foi considerado.

Entretanto, criar inúmeras opções de configuração aumentaria significativamente a complexidade da aplicação.

Foi decidido priorizar um fluxo padronizado e objetivo.

---

## Processo totalmente manual

Foi descartado.

Grande parte do problema que originou o SafeStop está justamente na dependência de processos manuais.

---

## Excesso de validações obrigatórias

Também foi descartado.

Validações são importantes, porém não podem impedir uma comunicação rápida durante uma situação operacional.

A prioridade inicial sempre será registrar e comunicar a ocorrência.

As informações complementares poderão ser adicionadas durante as etapas seguintes do fluxo.

---

# Consequências

## Positivas

- Interface mais simples.
- Menor tempo de treinamento.
- Maior velocidade operacional.
- Melhor experiência em campo.
- Maior adoção pelos usuários.
- Redução da burocracia.
- Menor probabilidade de abandono do sistema.

## Negativas

- Algumas funcionalidades desejadas poderão ser rejeitadas por aumentarem a complexidade.
- Determinadas customizações serão limitadas para preservar a experiência principal.

Essas limitações são consideradas aceitáveis diante dos benefícios obtidos.

---

# Relação com os demais ADRs

Este ADR complementa os demais registros de decisão.

- ADR-001 define como o sistema foi arquitetado.
- ADR-002 define a stack tecnológica.
- ADR-003 define a comunicação como núcleo do produto.
- ADR-004 estabelece a filosofia Mobile First.

Este ADR define **como todas essas decisões deverão ser aplicadas durante a evolução do produto**, sempre preservando a simplicidade operacional.

---

# Resultado

O SafeStop adota oficialmente a **Simplicidade Operacional** como um princípio permanente de desenvolvimento.

Toda decisão de produto, arquitetura ou implementação deverá priorizar a redução da burocracia, a velocidade de operação e a facilidade de uso.

O sucesso do SafeStop será medido não pela quantidade de funcionalidades disponíveis, mas pela capacidade de permitir que uma Paralisação Preventiva seja registrada, comunicada, avaliada e acompanhada da forma mais rápida, simples e confiável possível.
