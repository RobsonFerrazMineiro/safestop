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

## `@safestop/ui` — Tokens implementados (Sprint 3.4 + PR-0a)

O pacote `packages/ui` exporta **somente tokens TypeScript** (`colors`, `spacing`, `radius`, `typography`, `componentStates`, `statusChip`, `occurrenceStatusTone`, `occurrenceSeverityTone`, `elevation`, `overlay`, `controlHeight`). Não há componentes visuais compartilhados neste pacote.

**Componentes visuais cross-platform continuam NÃO implementados:** `Button`, `NavigationItem`, `Badge`, `Card`, `EmptyState`, `Skeleton` (e `StatusBadge` / `PageHeader` / `FormField` — estes são Web-only em PRs posteriores, não neste package).

Web consome o **espelho CSS** em `apps/web/src/app/globals.css`. Páginas Web **não** precisam importar `@safestop/ui` em TypeScript neste PR.

### Cores (`colors.ts`)

| Token | Valor |
| --- | --- |
| `background` | `#0F1115` |
| `surface` | `#171A21` |
| `surfaceMuted` | `#20242D` |
| `surfaceElevated` | `#2A303B` |
| `border` | `#2E3440` |
| `foreground` | `#F3F4F6` |
| `foregroundMuted` | `#9CA3AF` |
| `primary` | `#F97316` |
| `primaryHover` | `#EA580C` |
| `primaryActive` | `#C2410C` |
| `destructive` | `#DC2626` |
| `success` | `#16A34A` |
| `warning` | `#FACC15` |
| `info` | `#2563EB` |

Disabled: `DISABLED_OPACITY = 0.4` (helper `withDisabledOpacity`).

**Web:** `apps/web/src/app/globals.css` espelha a paleta em CSS variables (`--background`, `--surface`, `--primary`, etc.). `--primary` / `--destructive` shadcn **não** foram redefinidos no PR-0a.

### Spacing (`spacing.ts`)

Escala em px: **4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96** (chaves `1`…`24` no objeto exportado).

### Radius (`radius.ts`)

Escala base: **4 · 8 · 12 · 16 · 24** (`radiusScale`).

Por componente (referência futura): `input`/`button` 8, `card` 12, `dialog`/`drawer` 16, `badge`/`chip` 999.

### Tipografia (`typography.ts`)

| Token | fontSize | fontWeight |
| --- | --- | --- |
| `pageTitle` | 32 | 700 |
| `sectionTitle` | 28 | 700 |
| `cardTitle` | 24 | 600 |
| `body` | 16 | 400 |
| `label` | 14 | 500 |
| `helper` / `caption` | 12 | 400 |
| `kpi` | 28–32 | 700 |

Fonte oficial do produto: **Inter** (Web via `next/font`; Mobile conforme stack nativa).

### Estados (`states.ts`)

Enum de contrato: `default`, `hover`, `pressed`, `focused`, `disabled`, `loading`, `success` — sem implementação visual compartilhada ainda.

Disabled em chips: `DISABLED_OPACITY = 0.4` sobre o token base (`colors.ts`). Focus/hover: `componentStates` existente; não redesenhados no PR-0a.

### Status e criticidade (`status.ts`, `severity.ts`) — PR-0a / spec 0a.1

Receita única de chip: estilo **soft** (`foreground` + `background` + `border` da família). Label textual **sempre** visível. Sem hex exclusivo por status. Sem badge só por cor.

Chaves TypeScript são literais alinhadas a `OCCURRENCE_STATUSES` e `OCCURRENCE_SEVERITIES` em `@safestop/types`. O package `ui` **não** depende de `types` (evita ciclo).

#### Famílias de chip (`statusChip`)

| Família | foreground | background | border | CSS |
| --- | --- | --- | --- | --- |
| `success` | `#BBF7D0` | `#14532D` | `#16A34A` | `--status-success-*` |
| `warning` | `#FDE68A` | `#422006` | `#FACC15` | `--status-warning-*` |
| `destructive` | `#FECACA` | `#7F1D1D` | `#DC2626` | `--status-destructive-*` |
| `info` | `#BFDBFE` | `#1E3A5F` | `#2563EB` | `--status-info-*` |
| `primary` | `#FFEDD5` | `#7C2D12` | `#F97316` | `--status-primary-*` |
| `muted` | `#9CA3AF` | `#20242D` | `#2E3440` | `--status-muted-*` |

`statusChip.primary` é o **chip** laranja. Não altera `colors.primary` nem `--primary`.

**Âmbar:** default = soft (tabela acima). Alternativa QA: `statusChipWarningSolid` (`#0F1115` sobre `#FACC15`). **Proibido:** texto claro (`#F3F4F6`) sobre âmbar ou vermelho/verde sólidos.

#### Enum status → família (`occurrenceStatusTone`)

| Status | Label | Família |
| --- | --- | --- |
| `PARALISACAO_PREVENTIVA` | Paralisação Preventiva | `info` |
| `EM_AVALIACAO` | Em avaliação | `warning` |
| `VER_E_AGIR` | Ver e Agir | `warning` |
| `INTERDICAO_CONFIRMADA` | Interdição confirmada | `destructive` |
| `MDHO_EM_PREENCHIMENTO` | MDHO em preenchimento | `info` |
| `AGUARDANDO_APROVACAO_HSE` | Aguardando aprovação HSE | `warning` |
| `AGUARDANDO_REGISTRO_IMS` | Aguardando registro IMS | `warning` |
| `EM_TRATATIVA` | Em tratativa | `info` |
| `AGUARDANDO_VALIDACAO` | Aguardando validação | `warning` |
| `LIBERADA` | Liberada | `success` |
| `ENCERRADA` | Encerrada | `muted` |
| `CANCELADA` | Cancelada | `muted` |

Nenhum dos 12 status usa a família `primary` (reservada a identidade SafeStop, ações, navegação e seleção — não à criticidade).

#### Enum criticidade → família (`occurrenceSeverityTone`)

| Severity | Label | Família |
| --- | --- | --- |
| `LOW` | Baixa | `muted` |
| `MEDIUM` | Média | `warning` |
| `HIGH` | Alta | `warning` |
| `CRITICAL` | Crítica | `destructive` |

MEDIUM e HIGH compartilham a família `warning`. Diferenciação visual extra fica no futuro `SeverityBadge` (não nesta foundation). `statusChip.primary` permanece disponível para identidade, ações, navegação e seleção.

### Elevation e overlay (`elevation.ts`) — PR-0a

Sombra preta sóbria, sem glow laranja.

| Token TS | CSS | Uso |
| --- | --- | --- |
| `elevation.none` | `--elevation-0: none` | Flat / surface / lista |
| `elevation.card` | `--elevation-1` | Card de conteúdo |
| `elevation.overlay` | `--elevation-2` | Popover, dropdown, dialog, sheet |
| `overlay.scrim` | `--overlay: rgba(0, 0, 0, 0.60)` | Backdrop único de dialog/drawer/AlertDialog |

`elevation.overlay` (sombra) ≠ `--overlay` (scrim). Proibido scrim laranja.

### Control height (`sizing.ts`) — PR-0a

| Token TS | CSS | Valor | Plataforma |
| --- | --- | --- | --- |
| `controlHeight.web` | `--control-height-web` | `36px` | Web (`h-9` shadcn) |
| `controlHeight.mobile` | `--control-height-mobile` | `44px` | Mobile (touch mínimo) |

Nome da spec: `--control-height-mobile` (não `--control-height-touch`). Sem terceira altura “desktop large”.

### Mapeamento CSS × shadcn (desambiguação)

| Token novo | Não colide com |
| --- | --- |
| `--status-primary-*` | `--primary` (marca `#F97316`) |
| `--status-destructive-*` | `--destructive` (shadcn) |
| `--status-warning-*` | `--warning` (âmbar raw `#FACC15` — chips **não** usam o raw como fundo de texto claro) |
| `--overlay` | `--elevation-2` / `elevation.overlay` |
| `--control-height-web` / `--control-height-mobile` | (novos) |

Hex de suporte dos chips (`#422006`, `#7F1D1D`, `#14532D`, `#7C2D12`, `#1E3A5F`, …) são **pares de chip**, não nova paleta de marca.

### Regras normativas (PR-0a)

1. **Dialog destrutivo = Radix AlertDialog** (não `<dialog>` nativo nas confirmações destrutivas). Toast **não** confirma exclusão.
2. **Toast (Sonner) ≠ ciência.** Toast = feedback efêmero. Ciência = ação explícita + registro (`confirm_notification_awareness`). Nunca auto-ciência por toast, leitura ou dismiss.
3. Status/criticidade: **sempre label textual** + tokens de família; nunca só cor.
4. Componentes visuais em `packages/ui` continuam **não implementados**.

Consumo futuro (fora deste PR): `StatusBadge` / `SeverityBadge` leem `occurrenceStatusTone` / `occurrenceSeverityTone` e as vars `--status-{family}-*`. Dialogs usam `var(--overlay)`.

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

### Web

Biblioteca oficial: **Lucide React** (`lucide-react`).

Implementação atual: Sidebar e ações funcionais via `apps/web/src/features/navigation/components/nav-icons.tsx` (re-exporta ícones Lucide). Configuração shadcn: `"iconLibrary": "lucide"` em `apps/web/components.json`.

### Mobile

Ícones da Bottom Navigation: **placeholders tipográficos/emoji** (`▦`, `☰`, `🔔`, `👤`) — substituição por icon set formal (`lucide-react-native` ou equivalente) permanece **P1**.

Não misturar bibliotecas **dentro da mesma plataforma**. Web = Lucide; Mobile = placeholders até adoção formal.

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

Evitar duplicação de **tokens** e **contratos de domínio** entre plataformas.

| Camada | Local | Conteúdo |
| --- | --- | --- |
| **Tokens** | `packages/ui` | `colors`, `spacing`, `radius`, `typography`, `componentStates`, status/criticidade, elevation, overlay, control height — **sem React** |
| **Primitives Web** | `apps/web/src/components/ui` | shadcn/ui seletivo (Button, Card, Badge, Input, Dialog, Table, …) tematizado via `globals.css` |
| **UI Mobile** | `apps/mobile/src/**` | Componentes próprios + `StyleSheet`; importa `@safestop/ui` onde aplicável |

**Não mover** primitives shadcn DOM para `packages/ui`. Mobile **não consome** arquivos de `components/ui`.

**Estado Sprint 3.4 — stack de apresentação:** ver seção [Stack de apresentação](#stack-de-apresentação-sprint-34) abaixo. Componentes React **cross-platform** (Button, NavigationItem, EmptyState compartilhados) permanecem **P1 — não implementados** em `packages/ui`.

---

# Stack de apresentação (Sprint 3.4)

Documenta o **código implementado** ([`UI-STACK-AUDIT.md`](decisions/UI-STACK-AUDIT.md) §16–17, [`ADR-002`](decisions/ADR-002-technology-stack.md)).

## Web

| Tecnologia | Escopo implementado | Regra |
| --- | --- | --- |
| **Tailwind CSS v4** | Layout/utilities em todo o painel | `@import "tailwindcss"` em `globals.css` |
| **shadcn/ui** | Primitives em `apps/web/src/components/ui` | Lista seletiva: `alert-dialog`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `popover`, `radio-group`, `select`, `sheet`, `skeleton`, `table`, `textarea`, `tooltip`, `toaster` + `ui-providers`. Tema SafeStop dark/grafite + `#F97316` — **não** copiar new-york/light do Base44 |
| **Lucide React** | Sidebar (spec C), sino, ações, chrome de gráficos | Via `nav-icons.tsx` e imports pontuais |
| **Recharts** | **Somente Dashboard** — `dashboard-charts.tsx` | **Não** usar em Relatórios |
| **Sonner** | Feedback **transitório** (ex.: “Marcadas como lidas”) | **Nunca** substituir confirmação de **ciência** — ciência = CTA/banner/`AlertDialog` explícitos |
| **TanStack Table** | Relatórios (`*-report-table.tsx`) | Abordagem **tabela-first**; export CSV/XLSX separado (`write-excel-file`) |
| **RHF + Zod + `@hookform/resolvers`** | Nova PP Web, Perfil Web | Demais fluxos podem usar estado local até migração pontual |

**Sidebar Web:** arquitetura da spec C (lista plana, RBAC, org ativa, logout rodapé) — **não** substituir por template shadcn Sidebar genérico.

## Mobile

| Tecnologia | Estado |
| --- | --- |
| **StyleSheet** | Estilização oficial |
| **NativeWind** | **Não adotado** (documentado em ADR-002 histórico; rejeitado Sprint 3.4) |
| **`@safestop/ui`** | `colors` importado na Bottom Nav, Perfil e Nova PP |
| **shadcn / Recharts / TanStack Table / Sonner** | **Ausentes** — fora de escopo Mobile nesta onda |

Feedback nativo: `Alert.alert`, sheets próprios. Ciência = fluxo explícito (nunca toast).

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

**Implementação atual (Sprint 3.4):** Bottom Navigation fixa + Stack (Expo Router) para fluxos internos. Componente: `apps/mobile/src/features/navigation/components/app-bottom-tab-bar.tsx`, montado em `apps/mobile/app/(app)/(tabs)/_layout.tsx`.

---

## Bottom Navigation — estrutura implementada

Quatro abas permanentes + **FAB central** (não é aba do router):

| Destino | Label | Rota | Ícone (atual) |
| --- | --- | --- | --- |
| Início | Início | `/(app)` | `▦` |
| Listagem PP | Paralisações | `/(app)/stop-work` | `☰` |
| Nova PP (FAB) | Paralisar | `/(app)/stop-work/new` | `+` (botão elevado) |
| Notificações | Notificações | `/(app)/notifications` | `🔔` |
| Perfil | Perfil | `/(app)/profile` | `👤` |

Copy alinhada a PO-UX-4: **“Paralisações”** (não “Ocorrências”) na navegação principal.

**Fora da Bottom Nav (acesso secundário / Stack):** Aprovações MDHO (`/(app)/approvals/mdho`), troca de organização (`/(app)/organizations`), rotas legadas `/occurrences/*` ainda existentes no código.

---

## Bottom Navigation — comportamento

- **Sempre visível** nas telas dentro de `(tabs)` — inclusive listagem, detalhe e criação de PP (FAB permanece acessível).
- **Safe Area:** `paddingBottom` respeita `useSafeAreaInsets()`.
- **Rascunho Nova PP:** ao sair de `stop-work/new` com formulário não enviado, `PreventiveStopDraftNavigationProvider` exibe confirmação (“Salvar e sair” / “Continuar preenchendo”); em “Salvar e sair”, persiste o estado atual via **`flushDraft(getValues())`** antes de navegar (não depende apenas de `onBlur`).
- **Logout:** ação **“Sair”** no `profile-screen.tsx` (não na Home).
- **Cores:** tokens `@safestop/ui` (`colors.primary`, `colors.foregroundMuted`, etc.) — importados no componente.
- **Ícones:** placeholders tipográficos/emoji — substituição por icon set formal permanece P1.

Evitar adicionar abas além dos destinos acima; novos módulos administrativos devem usar Stack ou telas secundárias.

---

## Fluxo Principal

O fluxo principal esperado é:

```text
Início

↓

Nova Paralisação (FAB)

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

Utilizar navegação em pilha (Stack) acima da Bottom Nav.

Exemplo:

```text
Paralisações

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

**Implementação atual (Sprint 3.4):** a **top bar horizontal** (`app-top-bar`) foi **substituída** por **Sidebar** (`apps/web/src/features/navigation/components/app-sidebar.tsx`), montada no layout autenticado `(app)/layout.tsx`. Itens e RBAC: `get-nav-items.ts`.

A Sidebar **não renderiza** em `/organizations/*` nem `/login/*`.

---

## Sidebar — itens e RBAC

Lista **plana** (sem agrupamento). Itens condicionados são **ocultos** — nunca exibidos desabilitados.

| Item | Rota | Visibilidade |
| --- | --- | --- |
| Dashboard | `/` | sempre |
| Paralisações Preventivas | `/stop-work` | sempre |
| Nova Paralisação | `/stop-work/new` | `occurrence.create` |
| Aprovações MDHO | `/approvals/mdho` | `mdho.approve` **ou** `mdho.return` |
| Responsáveis | `/organization-contacts` | `canManageOrganizationContacts` (`organization.manage` ou platform admin) |
| Relatórios | `/reports` | `report.read` |
| Notificações | `/notifications` | sempre |
| Perfil | `/profile` | sempre |

Mecanismo: `useAuthorization().can(...)` + helper `canManageOrganizationContacts` — mesmo critério da navegação anterior.

**Item ativo:** destaque em **pill** (`rounded-full`, `bg-[var(--surface-elevated)]`), não barra lateral colorida.

**Badge de notificações:** contador na sidebar quando `unreadCount > 0` (ponto no modo ícone; pill numérico no modo expandido).

**Organização ativa:** bloco com nome, código e link **“Trocar”** quando o usuário possui múltiplas organizações.

**Logout:** botão **“Sair”** no rodapé da sidebar (`SignOutButton` → `signOut()`).

**Branding:** ícone laranja + texto “SafeStop”.

**Ícones de navegação:** Lucide React via `nav-icons.tsx` (spec C — estrutura inalterada).

---

## Sidebar — responsividade

| Viewport | Comportamento |
| --- | --- |
| **&lt; 768px** | Barra superior mínima (brand + hambúrguer); menu completo em **Drawer** (`w-72`, overlay escuro). |
| **768px – 1023px** | Sidebar fixa **colapsada** (`w-16`): ícones + `sr-only` + `title` tooltip. |
| **≥ 1024px** | Sidebar **expandida** (`lg:w-64`): ícones + labels completos. |

---

## Barra superior Web (pós-3.4)

Não existe header global com breadcrumb, busca ou perfil como na navegação antiga.

- Em **mobile-web**, a barra superior serve **apenas** para brand + abrir o Drawer.
- Demais contextos (título de página, filtros, ações locais) ficam **no conteúdo** de cada feature.
- **Indicador offline:** banner sticky no layout autenticado (`OfflineIndicator`) quando `navigator.onLine === false`.

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

# Tabelas de Relatório

Relatórios gerenciais (Web) usam tabela densa — não lista de cards operacionais.

**Implementado — Sprint 3.3:** hub `/reports` + três telas; feature `features/reports/`.

Referência de implementação: `organization-contacts-table` + `docs/decisions/REPORTS-UI-SPEC.md`.

## Princípios

- Uma linha = um registro do domínio (ocorrência, ação ou notificação de ciência).
- Colunas classificadas: visíveis por padrão, opcionais, somente exportação.
- Não exibir 15+ colunas ao mesmo tempo.
- Ordenação apenas em campos allowlisted pela API.
- Status e flags críticos usam texto e/ou ícone — nunca só cor.
- Tema dark; ações e links no accent laranja do produto (`#F97316`).

## Estrutura

```text
Caption (sr-only)
thead → th scope=col
tbody → tr (drill-down quando houver rota)
```

Container com `overflow-x-auto` e borda discreta. Em tablet, esconder opcionais primeiro e permitir scroll horizontal antes de quebrar o layout.

## Estados da tabela

- Loading: skeleton de linhas (não spinner de tela cheia).
- Empty: nenhum registro no sistema.
- No-results: filtros ativos sem correspondência (copy distinta).
- Error / Forbidden: conforme spec do relatório.

---

# Exportação

Exportação de relatórios é ação explícita do usuário com auditoria (Sprint 3.3 — `log_report_export` / `report_export_audit`).

## Formatos

- CSV
- XLSX

Sempre duas opções nomeadas no menu — nunca um único botão “Exportar” ambíguo.

## Estados

- Idle
- Gerando arquivo (loading no controle, não fullscreen)
- Erro recuperável com nova tentativa
- Sucesso: download no navegador

## Regras de produto

- Respeitar o mesmo filtro da tela.
- Colunas export-only entram no arquivo mesmo se ocultas na tabela.
- Limite máximo de linhas definido pelo contrato técnico (não inventar na UI).
- PDF fora do catálogo aprovado nesta fase.

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

Implementação atual: **Lucide React** no Web; placeholders emoji no Mobile Bottom Nav (ver [Ícones](#ícones)).

Não misturar bibliotecas dentro da mesma plataforma.

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
