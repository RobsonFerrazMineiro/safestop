# Design System

## Objetivo

O Design System do SafeStop define os princípios visuais, componentes, padrões de interação e diretrizes de experiência do usuário para toda a plataforma.

Ele é a fonte oficial para o desenvolvimento das interfaces Mobile e Web, garantindo consistência, previsibilidade, acessibilidade e facilidade de manutenção.

Toda nova interface deverá seguir este documento.

---

# Filosofia

O SafeStop é um sistema desenvolvido para Segurança do Trabalho em ambientes industriais.

Sua identidade visual deve transmitir imediatamente:

- Segurança;
- Confiabilidade;
- Engenharia;
- Robustez;
- Tecnologia;
- Agilidade;
- Controle;
- Rastreabilidade;
- Profissionalismo.

O usuário deve sentir que está utilizando uma plataforma Enterprise desenvolvida para operações críticas.

---

# Objetivos do Design System

O Design System possui os seguintes objetivos:

- Padronizar toda a interface do produto;
- Reduzir inconsistências visuais;
- Facilitar o desenvolvimento;
- Melhorar a experiência do usuário;
- Reduzir erros operacionais;
- Tornar a interface previsível;
- Facilitar acessibilidade;
- Garantir responsividade;
- Manter identidade visual consistente.

---

# Mobile First

Todo componente deve ser pensado inicialmente para smartphones.

Somente após validar a experiência mobile deverá ser adaptado para Web.

A ordem correta de desenvolvimento é:

Mobile

↓

Tablet

↓

Desktop

Nunca o contrário.

---

# Princípios Visuais

Toda interface deve seguir os princípios abaixo.

## Simplicidade

Remover qualquer elemento que não agregue valor operacional.

Toda informação exibida deve possuir um propósito.

---

## Clareza

O usuário deve compreender rapidamente:

- onde está;
- o que aconteceu;
- o que precisa fazer;
- qual o próximo passo.

---

## Rapidez

O sistema deve reduzir:

- quantidade de toques;
- quantidade de cliques;
- tempo de preenchimento;
- tempo de decisão.

---

## Consistência

Mesmo componente.

Mesmo comportamento.

Mesmo significado.

Sempre.

---

## Segurança

A interface deve prevenir erros.

Nunca incentivar ações perigosas.

Ações críticas devem exigir confirmação.

---

## Acessibilidade

A interface deve ser utilizável por qualquer profissional.

Inclusive em:

- ambientes externos;
- iluminação intensa;
- uso com luvas;
- dispositivos pequenos.

---

# Personalidade Visual

A identidade visual do SafeStop deve transmitir:

🏭 Ambiente Industrial

🛡 Segurança do Trabalho

⚙ Engenharia

📋 Gestão

🚧 Operação

⚡ Agilidade

Nunca deve transmitir aparência de:

- ERP financeiro;
- CRM comercial;
- rede social;
- sistema hospitalar;
- sistema escolar;
- aplicativo de entretenimento.

---

# Inspiração

A identidade do SafeStop é inspirada em:

- Centros de Controle Operacional;
- Salas de Controle Industriais;
- Refinarias;
- Mineração;
- Indústria de Alumínio;
- Engenharia;
- Sistemas SCADA modernos;
- Softwares Enterprise.

---

# Psicologia das Cores

As cores do SafeStop possuem significado operacional.

Elas não são apenas decorativas.

Cada cor representa uma ação ou estado do sistema.

| Cor             | Significado                        |
| --------------- | ---------------------------------- |
| 🟧 Laranja      | Ação, Engenharia, Operação         |
| 🟢 Verde        | Segurança, Liberação, Conformidade |
| 🟡 Âmbar        | Atenção, Pendência                 |
| 🔴 Vermelho     | Risco Crítico, Interdição          |
| 🔵 Azul         | Informação                         |
| ⚫ Cinza Escuro | Ambiente Industrial                |
| ⚪ Cinza Claro  | Apoio Visual                       |

---

# Identidade Principal

A identidade oficial utiliza:

Laranja Industrial

-

Cinzas Industriais

-

Verde de Liberação

O azul NÃO é a cor principal do produto.

Ele será utilizado apenas para elementos informativos.

---

# Paleta Base

## Background

Background principal

```css
#0F1115
```

Representa:

- aço;
- equipamentos industriais;
- salas de controle.

---

Surface

```css
#171A21
```

---

Surface Secondary

```css
#20242D
```

---

Surface Hover

```css
#2A303B
```

---

# Cor Primária

Primary

```css
#F97316
```

Representa:

- engenharia;
- EPC;
- operação;
- inspeção;
- ação.

---

Primary Hover

```css
#EA580C
```

---

Primary Active

```css
#C2410C
```

---

# Cor Secundária

A cor secundária é neutra.

```css
#374151
```

Ela não deve competir com o laranja.

---

# Cores Semânticas

## Success

```css
#16A34A
```

Utilizada para:

- Liberação;
- Conforme;
- Concluído;
- Validado;
- Ativo.

---

## Warning

```css
#FACC15
```

Utilizada para:

- Atenção;
- Pendência;
- Prazo próximo;
- Monitoramento.

---

## Destructive

```css
#DC2626
```

Utilizada para:

- Interdição;
- Erro;
- Exclusão;
- Cancelamento;
- Risco Crítico.

---

## Information

```css
#2563EB
```

Utilizada para:

- Informações;
- Ajuda;
- Comunicação;
- Orientações.

Não utilizar como identidade principal.

---

# Escala de Cinzas

Gray 950

```css
#0F1115
```

Gray 900

```css
#171A21
```

Gray 800

```css
#20242D
```

Gray 700

```css
#374151
```

Gray 600

```css
#4B5563
```

Gray 500

```css
#6B7280
```

Gray 400

```css
#9CA3AF
```

Gray 300

```css
#D1D5DB
```

Gray 200

```css
#E5E7EB
```

Gray 100

```css
#F3F4F6
```

Gray 50

```css
#F9FAFB
```

---

# Tokens Semânticos

Os componentes nunca devem utilizar cores diretamente.

Sempre utilizar tokens.

Exemplo:

Background

Surface

Border

Foreground

Muted

Primary

Success

Warning

Critical

Information

Disabled

---

# Tipografia

A tipografia deve favorecer leitura rápida.

Critérios:

- excelente legibilidade;
- aparência Enterprise;
- boa leitura em telas pequenas;
- ótima renderização Android;
- ótima renderização iOS.

A fonte oficial será:

Inter

---

# Escala Tipográfica

Toda a tipografia do SafeStop deve seguir uma hierarquia consistente.

A diferença entre os níveis deve comunicar importância, nunca apenas tamanho.

| Nível      | Uso                           |
| ---------- | ----------------------------- |
| Display    | Landing pages e apresentações |
| H1         | Título principal da página    |
| H2         | Seções principais             |
| H3         | Cards e subtítulos            |
| H4         | Blocos menores                |
| Body Large | Texto principal               |
| Body       | Texto padrão                  |
| Small      | Texto auxiliar                |
| Caption    | Legendas                      |
| Badge      | Badges e Chips                |

---

## Display

```css
Font Size: 48px
Weight: 700
Line Height: 56px
```

Uso:

- Landing Page
- Marketing
- Documentação

Nunca utilizar dentro da aplicação operacional.

---

## H1

```css
Font Size: 32px
Weight: 700
Line Height: 40px
```

Uso:

- Dashboard
- Título de página
- Grandes módulos

Exemplo:

```
Ocorrências
```

---

## H2

```css
Font Size: 28px
Weight: 700
Line Height: 36px
```

Uso:

- Seções
- Relatórios
- Configurações

---

## H3

```css
Font Size: 24px
Weight: 600
Line Height: 32px
```

Uso:

- Cards
- Modais
- Drawers

---

## H4

```css
Font Size: 20px
Weight: 600
Line Height: 28px
```

Uso:

- Agrupamentos
- Títulos internos

---

## Body Large

```css
Font Size: 18px
Weight: 400
Line Height: 28px
```

Uso:

- Conteúdo principal

---

## Body

```css
Font Size: 16px
Weight: 400
Line Height: 24px
```

É o tamanho padrão da aplicação.

Todo texto comum deve utilizar este tamanho.

---

## Small

```css
Font Size: 14px
Weight: 400
Line Height: 20px
```

Uso:

- Informações secundárias
- Datas
- Horários
- Autor

---

## Caption

```css
Font Size: 12px
Weight: 400
Line Height: 16px
```

Uso:

- Legendas
- Informações complementares

Evitar textos críticos nesse tamanho.

---

## Badge

```css
Font Size: 12px
Weight: 600
```

Uso exclusivo para:

- Status
- Prioridade
- Criticidade
- Tags

---

# Pesos Tipográficos

Utilizar apenas os seguintes pesos:

| Peso | Uso          |
| ---- | ------------ |
| 400  | Texto normal |
| 500  | Labels       |
| 600  | Subtítulos   |
| 700  | Títulos      |

Evitar utilizar muitos pesos diferentes.

---

# Alinhamento

Priorizar:

- alinhamento à esquerda;
- leitura natural;
- consistência.

Evitar:

- texto centralizado em grandes blocos;
- justificado;
- alinhamentos inconsistentes.

---

# Comprimento de Linha

Evitar linhas muito longas.

Ideal:

60–80 caracteres por linha.

Isso melhora a leitura.

---

# Espaçamentos

O SafeStop utilizará uma escala de espaçamento baseada em múltiplos de 4.

---

## Escala Oficial

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

Nunca utilizar valores arbitrários.

Exemplo inadequado:

```css
margin: 13px;
```

---

## Espaçamento Interno

Padding padrão dos componentes:

| Componente   | Padding |
| ------------ | ------- |
| Button       | 12 x 16 |
| Input        | 12 x 16 |
| Card         | 20      |
| Dialog       | 24      |
| Drawer       | 24      |
| Bottom Sheet | 20      |

---

## Espaçamento Entre Seções

Entre grandes blocos:

```text
32px
```

Entre componentes relacionados:

```text
16px
```

Entre elementos internos:

```text
8px
```

---

# Grid

---

## Mobile

Utilizar:

```text
1 coluna
```

Todo conteúdo deve ser organizado verticalmente.

Evitar grids complexos.

---

## Tablet

Permitir:

```text
2 colunas
```

quando houver benefício.

---

## Desktop

Utilizar:

```text
12 colunas
```

com largura fluida.

---

## Largura Máxima

Conteúdo principal:

```css
1440px
```

Evitar conteúdo extremamente largo.

---

# Containers

Mobile:

```text
100%
```

Tablet:

```text
90%
```

Desktop:

```text
1280–1440px
```

---

# Radius

O SafeStop deve transmitir robustez.

Não utilizar cantos extremamente arredondados.

---

## Radius Oficial

Extra Small

```css
4px
```

Small

```css
8px
```

Medium

```css
12px
```

Large

```css
16px
```

Extra Large

```css
24px
```

---

## Aplicação

| Elemento     | Radius |
| ------------ | ------ |
| Input        | 8px    |
| Button       | 8px    |
| Badge        | 999px  |
| Chip         | 999px  |
| Card         | 12px   |
| Dialog       | 16px   |
| Drawer       | 16px   |
| Bottom Sheet | 20px   |

---

# Bordas

Utilizar bordas discretas.

Padrão:

```css
1px
```

Nunca utilizar bordas grossas sem justificativa.

---

## Cor da Borda

Border

```css
#2E3440
```

Hover

```css
#3F4754
```

Focus

Utilizar Primary.

---

# Shadows

Sombras devem comunicar elevação.

Nunca decoração.

---

## Shadow Small

Uso:

Inputs

Cards

Menus

```css
0 1px 2px rgba(0,0,0,.18)
```

---

## Shadow Medium

Uso:

Dialogs

Drawers

Dropdowns

```css
0 8px 24px rgba(0,0,0,.20)
```

---

## Shadow Large

Uso:

Modais importantes

```css
0 16px 40px rgba(0,0,0,.28)
```

---

Evitar sombras fortes.

O sistema deve parecer técnico.

---

# Opacidade

Estados oficiais:

Disabled

```css
40%
```

Loading

```css
70%
```

Overlay

```css
60%
```

Backdrop

```css
50%
```

---

# Ícones

Biblioteca oficial:

```text
Lucide
```

---

# Tamanho dos Ícones

Extra Small

```text
14px
```

Small

```text
16px
```

Default

```text
20px
```

Large

```text
24px
```

Extra Large

```text
32px
```

---

# Regras para Ícones

Todo ícone deve:

- possuir significado claro;
- manter o mesmo estilo;
- utilizar a mesma espessura;
- possuir tamanho consistente;
- acompanhar texto quando necessário.

Evitar:

- misturar bibliotecas;
- utilizar ícones decorativos;
- utilizar somente ícone em ações críticas.

---

# Ícones Oficiais do SafeStop

Alguns exemplos recomendados:

| Contexto      | Ícone           |
| ------------- | --------------- |
| Ocorrência    | TriangleAlert   |
| Segurança     | Shield          |
| Engenharia    | Wrench          |
| Indústria     | Factory         |
| Localização   | MapPin          |
| Evidência     | Camera          |
| Upload        | Upload          |
| Download      | Download        |
| Usuário       | User            |
| Organização   | Building2       |
| Empresa       | Building        |
| Plano de Ação | ClipboardList   |
| Timeline      | Clock3          |
| Auditoria     | ScrollText      |
| Notificações  | Bell            |
| Dashboard     | LayoutDashboard |
| Configurações | Settings        |
| Aprovação     | CheckCircle2    |
| Rejeição      | XCircle         |
| Liberação     | BadgeCheck      |
| Interdição    | ShieldAlert     |

---

# Uso dos Ícones

Os ícones devem reforçar o significado.

Nunca substituir completamente o texto.

Exemplo correto:

✔️ BadgeCheck

"Atividade Liberada"

Exemplo incorreto:

✔️ BadgeCheck

(sem texto)

---

# Consistência Visual

Todos os componentes deverão seguir:

- mesma escala;
- mesmo espaçamento;
- mesma tipografia;
- mesma linguagem visual;
- mesmos tokens;
- mesmas cores semânticas.

A consistência é mais importante que a criatividade isolada.

---

# Componentes

Todos os componentes do SafeStop devem seguir os princípios:

- reutilização;
- previsibilidade;
- acessibilidade;
- consistência;
- simplicidade;
- baixo acoplamento.

Sempre utilizar componentes do Design System antes de criar novos componentes.

---

# Componentes Base

Os componentes fundamentais da aplicação são:

- Button
- IconButton
- Input
- Textarea
- Select
- Combobox
- Checkbox
- Radio Group
- Switch
- Badge
- Chip
- Card
- Divider
- Avatar
- Tooltip
- Popover
- Dialog
- Alert Dialog
- Drawer
- Bottom Sheet
- Toast
- Progress
- Skeleton
- Empty State
- Timeline
- Stepper

Todos devem possuir comportamento consistente entre Mobile e Web.

---

# Botões

Os botões representam ações.

Toda tela deve possuir apenas uma ação principal claramente destacada.

---

## Variantes

### Primary

Cor:

Primary

Uso:

- ação principal;
- confirmação;
- continuar;
- salvar;
- registrar.

Exemplos:

Registrar Paralisação

Salvar

Continuar

Enviar

---

### Secondary

Uso:

ações importantes porém secundárias.

Exemplos:

Editar

Duplicar

Visualizar

---

### Outline

Uso:

ações neutras.

Exemplos:

Cancelar

Fechar

Voltar

---

### Ghost

Uso:

ações discretas.

Exemplos:

Mais opções

Filtro

Expandir

---

### Destructive

Uso exclusivo para:

- excluir;
- cancelar;
- remover;
- rejeitar;
- descartar.

Nunca utilizar vermelho para ações comuns.

---

### Link

Uso:

ações de navegação.

Nunca utilizar como ação principal.

---

# Estados do Botão

Todo botão deve possuir:

Default

Hover (Web)

Pressed

Focused

Disabled

Loading

Success (quando aplicável)

---

# Loading

Durante uma operação:

- manter largura;
- impedir clique duplo;
- mostrar indicador;
- alterar texto.

Exemplo:

Registrar

↓

Registrando...

---

# Botões de Ícone

Devem ser utilizados apenas quando o significado for evidente.

Exemplos:

Pesquisar

Filtro

Notificações

Configurações

Download

Upload

Excluir

Sempre possuir:

- Tooltip (Web)
- Accessibility Label (Mobile)

---

# Tamanho dos Botões

Small

```text
36px
```

Default

```text
44px
```

Large

```text
52px
```

No Mobile, priorizar 44px ou superior.

---

# Inputs

Todos os campos devem conter:

- Label;
- Placeholder (quando útil);
- Ajuda (quando necessário);
- Mensagem de erro;
- Estado de foco;
- Estado desabilitado.

Nunca utilizar placeholder como label.

---

# Estados do Input

Default

Focused

Filled

Disabled

Error

Success

Readonly

---

# Labels

As labels devem ser:

- curtas;
- objetivas;
- consistentes.

Exemplos:

Área

Empresa

Atividade

Descrição

Criticidade

---

# Placeholders

Utilizar apenas para exemplos.

Exemplo:

Digite uma breve descrição da situação.

Não utilizar placeholders como instrução completa.

---

# Mensagens de Erro

Preferir:

Selecione uma empresa.

Evitar:

Campo obrigatório.

---

# Textarea

Utilizar somente quando necessário.

Aplicações:

- descrição;
- observações;
- justificativas;
- comentários.

Não utilizar Textarea para dados estruturados.

---

# Select

Utilizar quando houver poucas opções.

Até aproximadamente:

10 opções.

Acima disso:

Utilizar Combobox.

---

# Combobox

Utilizar para:

- empresas;
- usuários;
- áreas;
- responsáveis;
- organizações.

Sempre possuir busca.

---

# Checkbox

Utilizar apenas para:

múltipla seleção.

Nunca utilizar para:

escolha única.

---

# Radio Group

Utilizar quando existir apenas uma resposta possível.

Exemplo:

Ver e Agir

ou

Interdição Oficial

---

# Switch

Utilizar apenas para:

liga/desliga.

Nunca para confirmar ações.

---

# Chips

Utilizar para:

- filtros rápidos;
- categorias;
- seleção múltipla;
- palavras-chave.

---

# Badges

Representam estados.

Nunca ações.

---

## Badges Oficiais

Status

Criticidade

Prioridade

Offline

Sincronizado

Rascunho

Pendente

---

# Cores das Badges

Verde

↓

Conforme

Liberado

---

Laranja

↓

Aguardando

Em Avaliação

---

Vermelho

↓

Interdição

Erro

Rejeitado

---

Azul

↓

Informação

---

Cinza

↓

Encerrado

Inativo

---

# Avatar

Utilizar apenas quando representar pessoas.

Nunca utilizar avatares decorativos.

Caso não exista fotografia:

Utilizar iniciais.

---

# Divider

Utilizar para separar grupos relacionados.

Evitar excesso de divisores.

Espaçamento comunica melhor que linhas.

---

# Tooltips

Utilizar apenas para:

- explicar ícones;
- atalhos;
- informações adicionais.

Nunca esconder informação importante em tooltip.

---

# Popovers

Utilizar para:

- ações rápidas;
- filtros;
- detalhes pequenos.

Nunca substituir páginas completas.

---

# Cards

O Card é o principal componente do SafeStop.

Ele deve agrupar informações relacionadas.

---

## Tipos de Card

Resumo

Ocorrência

Plano de Ação

Notificação

Dashboard

Indicador

Histórico

Evidência

---

# Estrutura do Card

Título

Status

Conteúdo

Informações secundárias

Ação principal

Ações secundárias

---

# Card de Ocorrência

Deve apresentar:

Código

Status

Criticidade

Empresa

Área

Data

Tempo decorrido

Ação pendente

---

# Card de Dashboard

Responder apenas uma pergunta.

Exemplo:

Ocorrências Abertas

12

---

Nunca misturar muitos indicadores no mesmo card.

---

# Card de Notificação

Deve mostrar:

Título

Resumo

Data

Prioridade

Status de leitura

Ciência

Ação disponível

---

# Card de Evidência

Mostrar:

Imagem

Legenda

Data

Autor

Upload

Categoria

---

# Dialog

Utilizar para:

- confirmação;
- ações críticas;
- informações importantes.

Nunca utilizar para formulários extensos.

---

# Estrutura do Dialog

Título

Descrição

Conteúdo

Ação Principal

Cancelar

---

# Alert Dialog

Reservado para:

Excluir

Cancelar

Interditar

Liberar

Aprovar

Rejeitar

Sempre explicar a consequência.

---

# Drawer

Utilizar principalmente no Web.

Aplicações:

Filtros

Detalhes

Edição

Informações complementares

---

# Bottom Sheet

Utilizar no Mobile.

Aplicações:

Filtros

Escolhas

Ações rápidas

Menus

Não esconder ação principal.

---

# Toast

Utilizar para:

Sucesso

Informação

Erro recuperável

Nunca para:

erros críticos.

---

# Duração

Sucesso

3 segundos

Erro

Até interação

Informação

4 segundos

---

# Progress

Utilizar para:

Upload

Sincronização

Download

Processamento

Nunca utilizar progresso falso.

---

# Skeleton

Sempre representar a estrutura real.

Evitar blocos genéricos.

---

# Empty State

Toda lista deve possuir estado vazio.

Estrutura:

Ilustração (opcional)

Título

Descrição

Ação

Exemplo:

Nenhuma ocorrência encontrada.

Registrar Paralisação

---

# Timeline

A Timeline representa a história da ocorrência.

Cada evento deve conter:

Ícone

Título

Descrição

Autor

Data

Hora

---

# Stepper

Utilizar quando existir fluxo sequencial.

Exemplo:

Registro

↓

Avaliação

↓

MDHO

↓

Tratativa

↓

Validação

↓

Liberação

---

O usuário deve identificar facilmente:

- etapa atual;
- etapas concluídas;
- próxima etapa.

---

# Componentes Compartilhados

Sempre reutilizar componentes entre:

apps/mobile

apps/web

packages/ui

Evitar duplicação.

---

# Regras Gerais

Todo componente deve:

- possuir documentação;
- aceitar tema;
- aceitar tokens;
- possuir estados;
- possuir acessibilidade;
- possuir testes;
- ser reutilizável;
- seguir nomenclatura oficial.

Nunca criar componentes específicos quando um componente genérico puder ser reutilizado.

---

# Convenções

Todos os componentes devem utilizar:

PascalCase

Exemplo:

Button

ActionCard

NotificationCard

TimelineItem

EmptyState

Stepper

Nunca utilizar nomes genéricos como:

CardNovo

MeuBotao

TesteCard

Componente1

---

# Navegação

A navegação do SafeStop deve ser intuitiva, previsível e orientada ao fluxo operacional.

O usuário nunca deve precisar "procurar" a próxima ação.

Cada tela deve indicar claramente:

- onde ele está;
- o que aconteceu;
- qual o próximo passo;
- quais ações estão disponíveis.

---

# Navegação Mobile

A aplicação Mobile é o principal ambiente operacional do SafeStop.

A navegação deve privilegiar:

- poucos toques;
- acesso rápido;
- uso com uma mão;
- ações frequentes.

---

## Estrutura Principal

A navegação inferior (Bottom Tabs) deve conter apenas os módulos essenciais.

Sugestão:

```text
🏠 Início

📋 Ocorrências

➕ Registrar

🔔 Notificações

👤 Perfil
```

Evitar adicionar muitas abas.

Caso novos módulos sejam criados, utilizar navegação secundária.

---

## Fluxo Principal

O fluxo principal esperado é:

```text
Home

↓

Nova Paralisação

↓

Registro

↓

Envio

↓

Timeline

↓

Acompanhamento
```

Todo o fluxo deve exigir o menor número possível de interações.

---

## Navegação Hierárquica

Utilizar navegação em pilha (Stack).

Exemplo:

```text
Ocorrências

↓

SS-26-000154

↓

Plano de Ação

↓

Detalhe da Correção
```

O botão voltar deve sempre retornar ao contexto anterior.

---

# Navegação Web

O painel Web é voltado para:

- liderança;
- supervisão;
- HSE;
- administração;
- auditoria.

A navegação deve favorecer produtividade.

---

## Sidebar

A Sidebar deve conter:

```text
Dashboard

Ocorrências

Avaliações

MDHO

Planos de Ação

Notificações

Relatórios

Usuários

Configurações
```

Itens administrativos devem respeitar permissões.

---

## Header

O Header poderá conter:

- Breadcrumb;
- Pesquisa;
- Organização ativa;
- Notificações;
- Perfil do usuário.

Não adicionar excesso de ações.

---

# Dashboard

O Dashboard é um painel operacional.

Seu objetivo é responder perguntas rapidamente.

Não deve ser apenas um conjunto de gráficos.

---

## Perguntas que o Dashboard deve responder

- Quantas ocorrências estão abertas?
- Quantas aguardam avaliação?
- Quantas aguardam validação?
- Quantas aguardam ciência?
- Quantas estão atrasadas?
- Quais áreas apresentam maior recorrência?
- Qual empresa possui mais ocorrências?
- Quanto tempo leva para liberar uma atividade?

---

# Estrutura Recomendada

```text
KPIs

↓

Gráfico Principal

↓

Ocorrências Recentes

↓

Ações Pendentes

↓

Notificações Críticas
```

---

# KPIs

Os KPIs devem ser objetivos.

Cada KPI responde apenas uma pergunta.

Exemplos:

- Ocorrências Abertas
- Pendentes de Avaliação
- Pendentes de Ciência
- Pendentes de Liberação
- Interdições Ativas
- Ações em Atraso

---

# Gráficos

Os gráficos devem apoiar decisões.

Nunca utilizar gráficos apenas por estética.

---

## Gráficos Recomendados

- Linha
- Barra
- Barra Empilhada
- Área
- Rosca (com moderação)

Evitar:

- Radar;
- Pizza com muitas categorias;
- 3D;
- Gauge.

---

# Cores dos Gráficos

Utilizar a paleta oficial.

Exemplo:

Verde

↓

Conforme

Laranja

↓

Pendências

Vermelho

↓

Interdições

Azul

↓

Informações

Cinza

↓

Encerradas

---

# Formulários

Todo formulário deve seguir os princípios:

- poucos campos;
- organização lógica;
- feedback imediato;
- validação em tempo real quando útil;
- preservação dos dados.

---

# Organização dos Formulários

Agrupar campos por contexto.

Exemplo:

```text
Identificação

↓

Local

↓

Descrição

↓

Criticidade

↓

Evidências
```

Nunca apresentar dezenas de campos sem agrupamento.

---

# Progressão

Quando o formulário possuir muitas etapas:

Utilizar Stepper.

Mostrar:

- etapa atual;
- total;
- progresso.

---

# Workflow Visual

O Workflow deve ser representado visualmente.

O usuário deve entender imediatamente:

- onde a ocorrência está;
- qual etapa foi concluída;
- quem é o responsável;
- qual será a próxima ação.

---

## Fluxo Oficial

```text
Paralisação Preventiva

↓

Em Avaliação

↓

Ver e Agir

ou

Interdição Oficial

↓

MDHO

↓

Aprovação HSE

↓

Registro IMS

↓

Tratativa

↓

Validação

↓

Liberação

↓

Encerramento
```

---

# Representação Visual

Cada etapa deve possuir:

- ícone;
- cor;
- label;
- descrição curta;
- estado.

---

# Estados do Sistema

Todo estado operacional deve possuir representação visual consistente.

---

## Estados Principais

### Sucesso

Cor:

Verde

Ícone:

CheckCircle

---

### Atenção

Cor:

Âmbar

Ícone:

TriangleAlert

---

### Erro

Cor:

Vermelho

Ícone:

CircleX

---

### Informação

Cor:

Azul

Ícone:

Info

---

### Neutro

Cor:

Cinza

Ícone:

Circle

---

# Estados de Sincronização

A sincronização deve ser compreendida facilmente.

Nunca confundir sincronização com status da ocorrência.

---

## Estados

Rascunho

↓

Salvo Localmente

↓

Aguardando Conexão

↓

Enviando

↓

Sincronizado

↓

Falha no Envio

---

# Offline

O usuário deve saber quando está offline.

Exemplo:

```text
Você está sem conexão.

As informações serão armazenadas no dispositivo e enviadas automaticamente quando a conexão for restabelecida.
```

---

# Indicadores de Offline

Utilizar:

- Badge;
- Banner;
- Ícone.

Nunca impedir o trabalho apenas pela ausência de conexão.

---

# Sincronização

Após retorno da conexão:

Mostrar:

```text
Sincronizando...

3 de 8 registros enviados.
```

Ao concluir:

```text
Todos os registros foram sincronizados.
```

---

# Conflitos

Quando ocorrer conflito:

Explicar claramente:

- qual versão será mantida;
- qual dado foi alterado;
- quem realizou a alteração;
- quando ocorreu.

Evitar mensagens técnicas.

---

# Responsividade

Toda interface deve funcionar em:

- Smartphones;
- Tablets;
- Notebooks;
- Monitores Full HD.

---

## Breakpoints

Sugestão:

```text
Mobile

até 767px

Tablet

768–1023px

Desktop

1024–1439px

Large Desktop

1440px+
```

---

# Adaptação Mobile

No Mobile:

- utilizar listas;
- cards;
- bottom sheet;
- navegação por stack.

Evitar:

- tabelas grandes;
- múltiplas colunas;
- modais extensos.

---

# Adaptação Tablet

Permitir:

- duas colunas;
- cards maiores;
- filtros laterais quando fizer sentido.

---

# Adaptação Desktop

Priorizar:

- tabelas;
- dashboards;
- filtros persistentes;
- maior densidade de informação.

---

# Dark Mode

O tema escuro será o padrão oficial do SafeStop.

O tema claro poderá ser implementado futuramente.

Caso implementado:

- utilizar os mesmos tokens;
- manter contraste;
- preservar semântica das cores;
- validar todos os componentes.

Nunca inverter cores manualmente.

---

# Acessibilidade

Todo componente deve atender às recomendações WCAG 2.2 sempre que aplicável.

---

## Navegação por Teclado

No Web:

Todo fluxo deve ser utilizável por teclado.

---

## Foco

Todo elemento interativo deve possuir foco visível.

Nunca remover outline sem substituição adequada.

---

## Contraste

Todo texto deve possuir contraste suficiente.

Evitar:

- cinza claro sobre branco;
- laranja sobre amarelo;
- vermelho sobre preto.

---

## Área de Toque

No Mobile:

Botões e componentes interativos devem possuir área confortável para toque.

---

## Leitores de Tela

Todos os componentes devem possuir:

- labels;
- roles;
- descrições;
- estados.

---

## Não depender apenas da Cor

Todo estado deve ser identificado também por:

- texto;
- ícone;
- badge;
- descrição.

Nunca depender exclusivamente da cor.

---

# Consistência

Sempre manter:

- mesmas cores;
- mesma tipografia;
- mesmos espaçamentos;
- mesmos componentes;
- mesmas animações;
- mesma linguagem.

O usuário deve sentir que todo o sistema foi desenvolvido como uma única aplicação.

---

# Design Enterprise

Toda interface deve transmitir:

- robustez;
- organização;
- confiabilidade;
- engenharia;
- segurança;
- tecnologia.

Evitar:

- excesso de efeitos;
- gradientes chamativos;
- animações exageradas;
- cores vibrantes em excesso;
- visual infantil.

A identidade visual deve refletir um software utilizado em operações industriais críticas.

---

# Motion

As animações do SafeStop devem existir para melhorar a compreensão da interface.

Nunca devem existir apenas por estética.

Toda animação deve comunicar:

- mudança de estado;
- transição;
- carregamento;
- sucesso;
- erro;
- hierarquia.

---

# Princípios das Animações

Toda animação deve ser:

- rápida;
- discreta;
- previsível;
- consistente;
- funcional.

Evitar:

- efeitos chamativos;
- movimentos longos;
- animações desnecessárias.

---

# Duração

## Muito rápida

100ms

Uso:

- hover;
- foco;
- estados.

---

## Curta

200ms

Uso:

- botões;
- cards;
- listas.

---

## Média

300ms

Uso:

- dialogs;
- drawers;
- bottom sheets.

---

## Longa

400ms

Uso apenas quando realmente necessário.

---

# Curvas de Animação

Utilizar curvas suaves.

Exemplo:

```css
ease-out
```

ou

```css
ease-in-out
```

Evitar curvas exageradas.

---

# Microinterações

Microinterações aumentam a percepção de qualidade.

Aplicar em:

- clique de botão;
- mudança de status;
- upload;
- sincronização;
- notificações;
- seleção;
- expansão de cards.

Nunca exagerar.

---

# Feedback Tátil

No aplicativo Mobile utilizar feedback tátil quando disponível.

Aplicar em:

- registro concluído;
- erro crítico;
- confirmação de ciência;
- envio concluído;
- liberação;
- interdição.

Nunca utilizar vibração contínua.

---

# Feedback Visual

Toda ação importante deve produzir retorno imediato.

Exemplos:

✔ Ocorrência registrada.

✔ MDHO aprovado.

✔ Referência IMS registrada.

✔ Correção validada.

✔ Atividade liberada.

---

# Mensagens do Sistema

Toda mensagem deve responder:

- o que aconteceu;
- qual consequência;
- o que fazer agora.

---

## Mensagens de Sucesso

Devem ser:

- curtas;
- positivas;
- objetivas.

Exemplos:

Ocorrência registrada.

Correção enviada.

Plano de ação atualizado.

Notificação enviada.

---

## Mensagens de Erro

Devem explicar:

- o problema;
- o impacto;
- a ação recomendada.

Exemplo:

Não foi possível enviar a ocorrência.

Seus dados permanecem salvos no dispositivo.

Tente novamente quando houver conexão.

---

## Mensagens de Aviso

Devem alertar sem gerar pânico.

Exemplo:

Esta atividade ainda não foi validada.

---

## Mensagens Informativas

Utilizar para orientar.

Exemplo:

A referência IMS deve ser registrada manualmente.

---

# UX Writing

Todo texto do sistema deve seguir os princípios:

- linguagem simples;
- frases curtas;
- voz ativa;
- termos técnicos apenas quando necessários;
- consistência.

---

## Evitar

"Efetuar cadastramento"

Preferir

"Cadastrar"

---

Evitar

"Proceder com o envio"

Preferir

"Enviar"

---

Evitar

"Realizar confirmação"

Preferir

"Confirmar"

---

# Tom de Voz

O SafeStop comunica como um profissional experiente de Segurança do Trabalho.

O tom deve ser:

- respeitoso;
- objetivo;
- técnico;
- claro;
- confiável.

Nunca utilizar:

- linguagem infantil;
- humor;
- ironia;
- excesso de formalidade.

---

# Terminologia Oficial

Sempre utilizar:

Paralisação Preventiva

Interdição Oficial

Ver e Agir

Plano de Ação

MDHO

Referência IMS

Ocorrência

Validação

Liberação

Ciência

Timeline

Auditoria

Nunca criar sinônimos para esses termos.

---

# Convenções Visuais

Todos os módulos devem seguir os mesmos padrões.

Exemplo:

Botão Primário

↓

Sempre laranja.

Botão Destrutivo

↓

Sempre vermelho.

Botão Secundário

↓

Sempre outline.

---

# Convenções de Componentes

Sempre reutilizar componentes existentes.

Nunca criar:

ButtonNovo

Card2

ModalNovo

InputEmpresa

Quando um componente genérico puder ser reutilizado.

---

# Convenções de Layout

Toda página deve possuir:

Título

↓

Resumo

↓

Conteúdo principal

↓

Ações

Nunca inverter essa estrutura sem justificativa.

---

# Convenções de Formulários

Todos os formulários devem possuir:

- labels;
- mensagens de erro;
- estados;
- validação;
- feedback.

---

# Convenções de Ícones

Sempre utilizar Lucide.

Não misturar bibliotecas.

---

# Convenções de Cores

As cores possuem significado.

Nunca alterar esse significado.

Exemplo:

Verde

↓

Conforme

Liberado

Nunca utilizar verde para representar erro.

---

# Checklist UI

Antes de concluir uma tela verificar:

- [ ] Segue o Design System.
- [ ] Utiliza componentes reutilizáveis.
- [ ] Possui hierarquia visual.
- [ ] Possui ação principal.
- [ ] Possui estados.
- [ ] Utiliza cores corretas.
- [ ] Utiliza tipografia oficial.
- [ ] Utiliza espaçamentos oficiais.
- [ ] Utiliza ícones oficiais.

---

# Checklist UX

- [ ] Poucos toques.
- [ ] Pouca digitação.
- [ ] Fluxo intuitivo.
- [ ] Mensagens claras.
- [ ] Erros compreensíveis.
- [ ] Estados previsíveis.
- [ ] Feedback imediato.
- [ ] Sem burocracia desnecessária.

---

# Checklist Mobile

- [ ] Funciona com uma mão.
- [ ] Safe Area respeitada.
- [ ] Área de toque adequada.
- [ ] Bottom Sheet quando apropriado.
- [ ] Navegação simples.
- [ ] Offline tratado.
- [ ] Sincronização tratada.
- [ ] Feedback tátil quando possível.

---

# Checklist Web

- [ ] Sidebar consistente.
- [ ] Dashboard organizado.
- [ ] Breadcrumb quando necessário.
- [ ] Tabelas responsivas.
- [ ] Filtros claros.
- [ ] Dialogs consistentes.
- [ ] Acessível por teclado.

---

# Checklist Responsividade

- [ ] Smartphone.
- [ ] Tablet.
- [ ] Notebook.
- [ ] Desktop.
- [ ] Sem sobreposição.
- [ ] Sem scroll horizontal desnecessário.

---

# Checklist Acessibilidade

- [ ] Contraste adequado.
- [ ] Focus visível.
- [ ] Navegação por teclado.
- [ ] Labels.
- [ ] Roles.
- [ ] Leitor de tela.
- [ ] Não depende apenas da cor.
- [ ] Área de toque adequada.

---

# Integração com Desenvolvimento

Todo componente criado deve respeitar:

- docs/engineering.md
- docs/product.md
- docs/workflow.md
- docs/architecture.md

Toda nova tela deve utilizar este documento como referência principal.

---

# Evolução do Design System

Este documento é um organismo vivo.

Toda alteração deve:

- manter compatibilidade;
- preservar consistência;
- ser documentada;
- ser aprovada arquiteturalmente quando impactar diversos módulos.

Mudanças estruturais relevantes devem gerar um novo ADR.

---

# Fonte da Verdade

O Design System é a única fonte oficial para:

- identidade visual;
- componentes;
- tipografia;
- cores;
- espaçamentos;
- layout;
- experiência do usuário;
- acessibilidade;
- interação.

Nenhuma tela deve ser criada ignorando este documento.

---

# Regra Final

Antes de aprovar qualquer interface, responder às seguintes perguntas:

- A interface parece um software Enterprise para Segurança do Trabalho?
- A ação principal está evidente?
- O usuário entende imediatamente o que deve fazer?
- O fluxo reduz tempo e esforço?
- A terminologia está consistente?
- As cores respeitam seus significados?
- O componente já existe no Design System?
- A interface funciona em Mobile e Web?
- Está acessível?
- Está alinhada ao Product, Workflow e Engineering?

Se qualquer resposta for negativa, a interface deve ser revisada.

O Design System do SafeStop existe para garantir que todas as telas transmitam segurança, robustez e profissionalismo, oferecendo uma experiência consistente desde o primeiro acesso até a conclusão de uma ocorrência.
