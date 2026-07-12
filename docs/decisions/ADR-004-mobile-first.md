# ADR-004 — Mobile First

**Status:** Aprovado

**Data:** 2026-07-11

**Responsáveis:** Equipe SafeStop

---

# Contexto

O SafeStop foi concebido para resolver um problema operacional que ocorre diretamente em campo.

As primeiras pessoas envolvidas em uma Paralisação Preventiva ou Interdição normalmente são:

- Técnicos de Segurança;
- Engenheiros de Segurança;
- Supervisores de Campo;
- Fiscais;
- Profissionais de HSE.

Esses profissionais realizam suas atividades utilizando predominantemente dispositivos móveis.

Na maioria das situações eles:

- estão caminhando pela planta;
- utilizam apenas uma mão para operar o aparelho;
- trabalham sob pressão;
- possuem pouco tempo para preencher informações;
- frequentemente enfrentam conexão instável.

Por esse motivo, tornou-se necessário definir qual plataforma direcionaria todas as decisões do produto.

---

# Decisão

O SafeStop adotará oficialmente a filosofia **Mobile First**.

Toda funcionalidade deverá ser projetada inicialmente para dispositivos móveis.

A versão Web será construída para complementar a experiência operacional, oferecendo recursos voltados principalmente para:

- acompanhamento;
- avaliação;
- gestão;
- consultas;
- indicadores;
- auditoria;
- administração.

O fluxo operacional principal sempre será pensado para o usuário em campo.

---

# Objetivos

A filosofia Mobile First busca:

- reduzir o tempo de registro;
- reduzir a quantidade de toques;
- diminuir a necessidade de digitação;
- facilitar o uso durante deslocamentos;
- melhorar a experiência em ambientes industriais;
- permitir operação mesmo em condições adversas.

---

# Princípios

Toda tela deve responder às seguintes perguntas:

É utilizável com apenas uma mão?

Os principais botões estão facilmente acessíveis?

O usuário consegue concluir a tarefa rapidamente?

A interface continua compreensível sob iluminação intensa?

O fluxo exige o mínimo possível de digitação?

Existe excesso de informações na tela?

A ação principal está evidente?

---

# Diretrizes de Interface

As interfaces Mobile deverão priorizar:

- poucos campos por tela;
- botões grandes;
- áreas de toque confortáveis;
- textos objetivos;
- navegação simples;
- contraste elevado;
- feedback imediato.

Evitar:

- tabelas extensas;
- excesso de menus;
- telas com muitos formulários;
- múltiplas colunas;
- ações escondidas.

---

# Fluxos Operacionais

As operações mais importantes deverão ser concluídas com o menor número possível de etapas.

Exemplos:

- Registrar Paralisação Preventiva;
- Registrar evidências;
- Confirmar ciência;
- Enviar correção;
- Consultar andamento;
- Validar ação corretiva.

Sempre que possível, esses fluxos deverão ser concluídos em menos de um minuto.

---

# Uso Offline

Embora o MVP inicial não implemente todas as funcionalidades offline, a arquitetura deverá estar preparada para suportar futuramente:

- armazenamento local;
- sincronização automática;
- filas de envio;
- recuperação após perda de conexão.

Nenhuma decisão de arquitetura deverá impedir essa evolução.

---

# Geolocalização

O Mobile poderá utilizar recursos do dispositivo quando agregarem valor operacional.

Exemplos:

- localização;
- câmera;
- notificações Push;
- armazenamento seguro;
- compartilhamento;
- arquivos.

Esses recursos deverão ser utilizados para simplificar o trabalho do usuário.

Nunca para aumentar burocracia.

---

# Painel Web

O painel Web possui papel complementar.

Será utilizado principalmente para:

- avaliação das ocorrências;
- acompanhamento;
- dashboards;
- indicadores;
- administração;
- auditorias;
- gestão de usuários;
- configuração da plataforma.

O painel Web não deverá definir o fluxo operacional principal.

---

# Motivação

A adoção da filosofia Mobile First proporciona:

- maior velocidade operacional;
- melhor experiência para o usuário principal;
- menor tempo de resposta;
- menor necessidade de treinamento;
- menor quantidade de erros de preenchimento;
- maior adesão ao sistema.

---

# Alternativas Avaliadas

## Web First

Descartada.

Motivos:

- não representa o ambiente real de uso;
- gera interfaces excessivamente complexas no celular;
- aumenta a quantidade de cliques;
- reduz produtividade em campo.

---

## Desktop First

Descartada.

O SafeStop não é um sistema administrativo tradicional.

Seu principal usuário atua fora do escritório.

---

# Consequências

## Positivas

- Interface mais rápida.
- Melhor usabilidade em campo.
- Menor curva de aprendizado.
- Fluxos mais objetivos.
- Melhor aproveitamento dos recursos do dispositivo.

## Negativas

- Exige maior cuidado no design responsivo.
- Algumas funcionalidades administrativas precisarão de adaptações específicas para o Web.

Esses impactos são considerados aceitáveis.

---

# Critério para Novas Funcionalidades

Antes da implementação de qualquer nova funcionalidade, responder:

O profissional de campo realmente precisa disso?

Essa funcionalidade facilita o trabalho em campo?

Ela aumenta ou reduz o tempo de operação?

Ela exige informações realmente necessárias?

Caso a funcionalidade torne o processo mais lento ou burocrático, ela deverá ser reavaliada.

---

# Decisões relacionadas

- ADR-001 — Arquitetura do SafeStop
- ADR-002 — Stack Tecnológica
- ADR-003 — Arquitetura de Comunicação
- ADR-005 — Simplicidade Operacional

---

# Resultado

O SafeStop adota oficialmente a filosofia **Mobile First**.

Todas as decisões de arquitetura, experiência do usuário e desenvolvimento deverão priorizar o profissional que atua em campo.

O painel Web será tratado como um complemento estratégico para gestão, acompanhamento e administração, sem substituir o foco operacional da aplicação.
