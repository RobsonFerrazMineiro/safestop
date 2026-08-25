# UX Convergence — UI Spec (Proposta UIUX)

**Sprint:** 3.4 — UX/UI Convergence + Hardening Final
**Etapa:** 2 — Proposta visual/UX (aguardando aprovação do Product Owner)
**Autor:** UIUX (agente)
**Consolidado por:** ARCHITECT (sem reinterpretação de conteúdo)
**Status:** APROVADA EM DIREÇÃO PELO PRODUCT OWNER, com 4 ajustes incorporados nesta versão — ainda NÃO liberada para o MASTER. Aguardando aprovação final.

> Este documento consolida a proposta original do UIUX e o adendo de correção posterior
> (a proposta original havia declarado, erroneamente, que `reference/research/` não existia;
> a pasta existe e foi inspecionada — 24 imagens, ver seção "Nota de evidência" abaixo).
> Onde o adendo corrige a proposta original, a versão **corrigida** é a que consta abaixo.

---

## Nota de evidência

A hierarquia de evidência do `UX-CONVERGENCE-DECISIONS.md` foi cumprida nos 4 níveis:

1. Screenshots — `reference/research/` (24 imagens inspecionadas diretamente: `Inicio` 3, `interdictions` 2, `interdiction-id` 4, `new` 5, `notifications` 2, `profile` 3, `login` 2, `register` 1, `forgot-password` 1, `reset-password` 1)
2. Páginas `.jsx` do Base44 — `reference/base44/src/pages/*.jsx`
3. Tokens do Base44 — `reference/base44/src/index.css`, `tailwind.config.js`, `components.json`
4. `docs/design-system.md`

Toda recomendação abaixo cita a origem concreta.

---

## A. Executive UX Summary

O SafeStop Web hoje usa uma top bar horizontal simples (`apps/web/src/features/notifications/components/app-top-bar.tsx`), sem branding forte, sem destaque de organização ativa, e **sem nenhum botão de logout em toda a aplicação Web** (confirmado: `signOut` só existe em `auth-provider.tsx`/`auth.service.ts`, nunca chamado por UI). O Mobile não tem navegação persistente — é uma tela "Início" com pilha de botões, que inclui um "Sair" ali, mas o Perfil mobile não tem logout.

Em contrapartida, várias telas críticas já são visualmente/funcionalmente mais maduras que o Base44: Dashboard com ~17 KPIs em 3 níveis, distinção Leitura×Ciência já implementada com badges próprios, Plano de Ação com badge de atraso discreto (chip, não banner de tela cheia). O trabalho desta Sprint é majoritariamente **estrutural de navegação** (Sidebar Web, Bottom Nav Mobile, logout) e de **harmonização** — não reconstrução de telas.

O Base44 usa tema claro, azul como cor primária e radius grande (`--radius: 0.625rem`), o que contraria a identidade SafeStop (dark, laranja `#F97316`, radius mais discreto por componente). O Base44 serve apenas como referência de estrutura/fluxo/copy — nunca de cor ou radius.

---

## B. Princípios de convergência

| Princípio | Fonte | Aplicação |
|---|---|---|
| Sidebar adaptada, não copiada | PO-UX-1 | Estrutura confirmada por screenshots + módulos reais do SafeStop |
| Bottom Nav + Stack coexistindo | PO-UX-2 | Itens equivalentes aos atalhos já existentes na home mobile, promovidos a navegação persistente |
| Não copiar campos automaticamente | PO-UX-3 | Campos da Nova PP mantidos; divergências do Base44 registradas como recomendação de produto separada |
| "Paralisação Preventiva" / "PP" | PO-UX-4 | Aplicado em toda a proposta de copy |
| `/occurrences/*` legado | PO-UX-5 | Tratado como legado; nada novo desenhado |
| Logout na Sidebar | PO-UX-6 | Confirmado visualmente no rodapé isolado do protótipo |
| `packages/ui` controlado | PO-UX-7 | Escopo mínimo na seção P |
| Online-only | Decisão definitiva | Apenas estados de perda de conectividade, nunca fila/sync |

---

## C. Arquitetura de navegação Web — Sidebar (VERSÃO CORRIGIDA por evidência visual)

**Evidência**: `reference/research/Inicio/image copy 2.png`, `interdictions/image copy.png`, `interdiction-id/image copy 2.png` e `image copy 3.png`, `new/image copy 3.png` e `image copy 4.png`, `notifications/image copy.png`, `profile/image copy 2.png`.

Confirmado pelos screenshots:
- Sidebar dark fixa, fundo grafite quase preto.
- Branding no topo: ícone laranja quadrado com glifo de escudo + wordmark "SafeStop".
- Lista vertical única de itens (ícone + label): Dashboard, Nova Paralisação, Ocorrências, Notificações, Perfil — **sem separadores ou grupos visuais** (correção: a proposta inicial havia inventado 2 grupos com separador, sem evidência).
- Item ativo: **pill de fundo levemente mais claro** ao redor de ícone+label (correção: não há barra lateral, como propunha a primeira versão).
- **Sair isolado no rodapé**, sem bloco de conta/avatar/nome (correção: a proposta inicial inventava um "bloco de conta" agrupado; os screenshots mostram apenas o item "Sair" isolado após um grande espaço vazio flexível). "Perfil" é um item normal da lista principal, não um bloco de rodapé.
- Bloco de organização ativa/troca de organização: **sem precedente visual no Base44** (produto não tem multi-tenant) — mantido como adaptação funcional exclusiva do SafeStop, não visual.

### Estrutura final proposta (v2 — inclui ajuste do PO: item "Nova Paralisação")

```
┌───────────────────────────────┐
│ [Ícone laranja] SafeStop       │ ← branding (confirmado)
│ Organização ativa (nome+code)  │ ← adaptação SafeStop, sem precedente Base44
├───────────────────────────────┤
│ Dashboard                      │ → sem restrição específica de módulo
│ Paralisações Preventivas       │ → occurrence.read
│ + Nova Paralisação             │ → occurrence.create (oculto, não desabilitado, se ausente)
│ Aprovações MDHO (RBAC)         │ → mdho.approve / mdho.return
│ Responsáveis (RBAC)            │ → organization.manage
│ Relatórios (RBAC)              │ → report.read
│ Notificações                   │ → sem restrição
│ Perfil                         │ → sem restrição
│                                 │
│ (espaço flexível vazio)        │ ← confirmado nas capturas
├───────────────────────────────┤
│ → Sair                         │ ← isolado no rodapé (PO-UX-6, confirmado)
└───────────────────────────────┘
```

**Posição de "Nova Paralisação"**: imediatamente após "Paralisações Preventivas" (não antes), seguindo o padrão "ver → criar" e a ordem confirmada nos screenshots (`reference/research/Inicio/image copy 2.png`, `new/image copy 3.png`: Dashboard → Nova Paralisação → Ocorrências) — adaptada porque no SafeStop "Paralisações Preventivas" é o módulo/hub e "Nova Paralisação" é uma ação dentro dele.

**Tratamento visual**: item de lista normal, mesmo peso dos demais — **sem** destaque de cor primária. O laranja permanece reservado para "ação crítica pontual" (já usado em CTAs de página); repetir destaque de cor dentro da lista da sidebar diluiria esse significado. Usar ícone `PlusCircle` para diferenciá-lo visualmente como ação de criação, sem cor de destaque.

**RBAC**: `occurrence.create` — mesma permissão já usada em `stop-work-create-container.tsx:31`. Item oculto (não desabilitado) se o usuário não tiver a permissão.

### Hierarquia/agrupamento dos módulos — decisão: lista plana (sem agrupamento)

Avaliado a pedido do PO. **Recomendação: manter lista totalmente plana, sem separadores ou grupos visuais.** Motivos:
- Evidência visual do Base44 (`Inicio/image copy 2.png`, `notifications/image copy.png`, `profile/image copy 2.png`) mostra consistentemente lista única sem separadores.
- Com 8 itens, ainda abaixo do limiar (~10-12) em que agrupamento reduz carga cognitiva; abaixo disso, agrupar aumenta complexidade visual sem ganho real.
- RBAC torna agrupamento fixo problemático: papéis diferentes veem subconjuntos diferentes da lista (ex.: um usuário sem `mdho.approve`, `organization.manage` e `report.read` veria um grupo esvaziado ou com 1 item), gerando sidebar visualmente inconsistente entre papéis — viola "Simplicidade Operacional" e consistência.
- Uma lista plana é imune a esse problema: cada papel vê um subconjunto contíguo da mesma lista, sempre com a mesma aparência estrutural.
- Se o número de itens crescer significativamente em sprints futuras (ex.: novos módulos administrativos), reavaliar agrupamento nesse momento — não antecipar sem necessidade concreta.

### Comportamento em viewport menor

- **Desktop (≥1024px)**: Sidebar expandida fixa, sempre visível.
- **Tablet (768-1023px)**: Sidebar colapsada para ícones, tooltip on-hover.
- **Mobile-web (≤767px)**: Sidebar recolhe para Drawer disparado por ícone hambúrguer (não usar Sheet — nomenclatura reservada a Mobile nativo em `docs/design-system.md`).

RBAC: cada item condicionado exatamente às mesmas regras já existentes hoje na top bar (`app-top-bar.tsx` linhas 41-71) — Dashboard e Paralisações sempre visíveis; MDHO exige `mdho.approve`/`mdho.return`; Responsáveis exige `organization.manage`; Relatórios exige `report.read`.

Acessibilidade: usar `<nav aria-label="Navegação principal">`, reaproveitando o padrão já existente na top bar atual.

---

## D. Arquitetura de navegação Mobile — Bottom Navigation (VERSÃO CORRIGIDA)

**Evidência**: bottom nav visível e idêntica em 11 capturas de mobile-frame (`Inicio`, `interdictions`, `interdiction-id`, `new`, `notifications`, `profile` — todas as variações).

**Confirmado**: 5 itens fixos + FAB circular central elevado (flutua acima da barra) para a ação principal — validando a estrutura central já proposta.

| Posição | Item | Rota destino | Nota |
|---|---|---|---|
| 1 | Início | `/(app)` | Confirmado (ícone grid) |
| 2 | Paralisações | `/(app)/stop-work` | Base44 usa "Ocorrências" — SafeStop mantém "Paralisações" por PO-UX-4 (estrutura sim, copy não) |
| 3 (central, FAB elevado) | Nova PP / Paralisar | `/(app)/stop-work/new` | Posição central elevada 100% confirmada visualmente |
| 4 | Notificações | `/(app)/notifications` | Base44 usa "Alertas" — SafeStop mantém "Notificações" (terminologia já usada no código) |
| 5 | Perfil | `/(app)/profile` | Confirmado |

**Fora da Bottom Nav**: Aprovação HSE (condicional, baixa frequência), Trocar organização (ocasional), Sair (move para dentro do Perfil).

**Correção importante sobre visibilidade**: a proposta original recomendava esconder a bottom nav em telas de detalhe/criação. A evidência mostra o oposto — em `interdiction-id/*.png` e `new/*.png` a bottom nav **permanece sempre visível**, inclusive em Nova PP e Detalhe. **Correção aplicada**: manter a Bottom Nav sempre visível em todas as telas, sem escondê-la em fluxos de detalhe/criação — mais consistente com "poucos toques para voltar" e alinhado à evidência real do protótipo.

**Achado de cor**: mesmo o Base44 usa dois tons de azul para diferenciar hierarquia entre o FAB de navegação e o CTA de formulário — inspiração válida para usar `primary` (`#F97316`) vs. `primary-active` (`#C2410C`) do SafeStop para replicar essa distinção sem usar azul.

### Convivência com o Stack

Bottom Nav via grupo de rotas paralelas `(tabs)` dentro de `(app)`; cada aba mantém seu próprio Stack interno para navegação hierárquica (ex.: Paralisações → Detalhe → seções de MDHO/IMS/Plano de Ação).

### Comportamento com formulário não salvo (ajuste do PO)

Requisito: navegar para outra aba da Bottom Nav não pode causar perda silenciosa de dados não submetidos (ex.: Nova PP parcialmente preenchida).

**Análise do que já existe**: o rascunho local (`preventive-stop-draft-store.ts`, "Salvo localmente") resolve a **persistência do dado**, mas não resolve a **experiência de navegação** — o usuário não recebe nenhum sinal no momento da saída (pode achar que perdeu o trabalho) e não há diferenciação entre saída acidental e intencional.

**Experiência esperada (não é solução técnica — MASTER/MOBILE definem a implementação):**

1. Ao tocar em outra aba estando em Nova PP com **algum campo preenchido** (mesmo critério de "conteúdo relevante" já usado pelo store de rascunho), exibir confirmação explícita antes de navegar — nunca navegar/descartar silenciosamente.
2. Copy sugerido:
   - Título: "Sair sem concluir a paralisação?"
   - Corpo: "Seu preenchimento foi salvo neste dispositivo e continuará disponível quando você voltar para Nova Paralisação."
   - Ação principal: "Salvar e sair" / Ação secundária: "Continuar preenchendo" (cancela a navegação)
3. Se confirmar a saída, o rascunho permanece salvo (comportamento já existente) e a navegação prossegue.
4. Ao retornar à aba "Nova PP", o formulário deve reabrir com o rascunho recuperado automaticamente, com indicador visual "Rascunho salvo neste dispositivo" no topo.
5. Se o formulário estiver **totalmente vazio**, navegar direto, sem confirmação.
6. Mesmo comportamento para o botão/gesto físico de voltar (Android) — sem exceções inconsistentes entre os dois mecanismos de saída.

Nenhum mecanismo de fila/sync offline é proposto — apenas uma camada de confirmação de navegação sobre o rascunho local já existente.

---

## E. Matriz Base44 × SafeStop

| Tela | Referência | Atual | Divergência | Decisão | Prioridade |
|---|---|---|---|---|---|
| Login | `Login.jsx` + `reference/research/login/*` | `apps/web/src/app/(auth)/login/page.tsx` | Base44 tem Google OAuth + AuthLayout ilustrado | PRESERVAR estrutura SafeStop; não adicionar OAuth | P2 |
| Dashboard | `Dashboard.jsx` + `reference/research/Inicio/*` (4+3 KPIs, 1 gráfico, recentes) | `dashboard-page.tsx` (17 KPIs em 3 níveis, 3 gráficos, 2 listas de atenção) | SafeStop mais rico/maduro | PRESERVAR e reorganizar por hierarquia (seção F) | P1 |
| Nova PP | `NewInterdiction.jsx` + `reference/research/new/*` (Área, Local, Empresa, Atividade, Condição, **Motivo**, Criticidade, **Fotos**, Observações) | `stop-work-create-container.tsx` (sem Motivo/Fotos/Observações na criação) | Campos extras no Base44 | ADAPTAR organização visual; campos extras = RECOMENDAÇÃO DE PRODUTO (seção G) | P1 (organização) / P2 (recomendação) |
| Listagem PP | `InterdictionList.jsx` + `reference/research/interdictions/*` (busca textual + filtros recolhidos por ícone de funil) | Busca só por código IMS | Falta busca textual/filtro de status | ADAPTAR (seção H, itens marcados REQUER CAPACIDADE TÉCNICA) | P1 |
| Detalhe PP | `InterdictionDatail.jsx` + `reference/research/interdiction-id/*` | `stop-work-detail-container.tsx` (muito mais completo: evidências, participantes, MDHO, IMS, plano de ação, ciência) | SafeStop substancialmente mais completo | PRESERVAR estrutura; especificação completa de hierarquia (seção I, aprovada como P0 pelo PO) | P0 |
| Notificações | `Notifications.jsx` (só lida/não lida) | `notification-item.tsx` (lida/não lida + ciência pendente/confirmada) | SafeStop já supera a referência | PRESERVAR; harmonizar tokens em volta | P1 |
| Perfil | `Profile.jsx` (avatar editável, **botão Sair**) | `profile-page.tsx`/`profile-screen.tsx` (sem avatar editável, **sem logout**) | Base44 tem avatar+logout; SafeStop não tem nenhum dos dois | ADAPTAR: logout move para Sidebar (Web)/Perfil (Mobile); avatar fora de escopo | P0 (logout) / P2 (avatar) |
| Responsáveis | Sem equivalente | `organization-contacts-table.tsx` | Feature exclusiva SafeStop | PRESERVAR | P2 |
| Relatórios | Sem equivalente | `reports-hub-page.tsx` + 3 relatórios | Feature exclusiva SafeStop | PRESERVAR (seção L) | P2 |
| `/occurrences/*` | — | Rotas legadas duplicando `/stop-work/*` | Legado | DESCARTAR (candidata a remoção, PO-UX-5) | P2 (implementação, fora desta etapa) |

---

## F. Dashboard

**Evidência**: `dashboard-kpi-grid.tsx`, `dashboard-page.tsx`, `reference/research/Inicio/*` (3 imagens).

Confirmado: Base44 usa 2 linhas de KPI empilhadas **sem título de seção** entre elas (4 cards de contagem + 3 cards de desempenho), gráfico de barras logo abaixo, depois "Ocorrências Recentes".

**Nota de correção**: a recomendação de adicionar títulos de seção explícitos ("Atenção imediata" / "Situação operacional" / "Desempenho no período") **não tem precedente visual no Base44** — é uma melhoria proposta pela UIUX além da referência, justificada pela maior densidade real do SafeStop (17 indicadores em 3 níveis vs. 7 em 2 linhas no Base44). A hierarquia de dados já existente (Level1 → Level2 → Level3) é mantida; a mudança é de rotulagem visual, não de reordenação de dados. **Nenhum dos ~17 indicadores é removido.**

---

## G. Nova Paralisação Preventiva

**Evidência**: `stop-work-create-container.tsx`, `preventive-stop-create-screen.tsx`, `NewInterdiction.jsx`, `reference/research/new/*` (5 imagens).

Ordem visual confirmada no Base44: Header → Callout "menos de 60s" → Área/Local → Empresa → Atividade → Condição Insegura → **Motivo da Paralisação** → Criticidade (4 chips retangulares) → **Fotos** (caixa pontilhada) → Observações → geolocalização → banner "notificação para 5 responsáveis" → CTA full-width.

### Organização proposta para o SafeStop (sem alterar campos de domínio)

```
Bloco 1 — Onde e quem
  Área* | Local*
  Contratada* → Contrato (condicional, já é assim hoje)

Bloco 2 — O que está acontecendo
  Atividade*
  Condição insegura*
  Criticidade* — seletor de chips/cards (não <select>), validado pela evidência visual do Base44

Bloco 3 — Complemento (opcional)
  Medida imediata (opcional)
```

Criticidade como chips: confirmado e reforçado pela evidência visual (4 chips retangulares no Base44); alinhado a `docs/design-system.md` (Radio Group para escolha única com poucas opções).

### Recomendações de produto (não implementar — apenas registrar)

> **RECOMENDAÇÃO 1**: Base44 permite fotos já na criação (posição confirmada: depois de Criticidade, antes de Observações); SafeStop só permite evidência após criada a ocorrência. Decisão de fluxo/domínio, fora do escopo UIUX.
>
> **RECOMENDAÇÃO 2**: Base44 tem "Motivo da Paralisação" distinto de "Condição Insegura"; SafeStop só tem `conditionDescription`. Se forem semanticamente diferentes, é nova decisão de domínio — não recomendamos campo redundante (duplicação semântica é vedada por PO-UX-3).
>
> **RECOMENDAÇÃO 3**: `observations` do Base44 não tem equivalente direto; `immediateActionDescription` já cobre necessidade parecida. Não recomendamos campo adicional.

---

## H. Listagem de Paralisações Preventivas

**Evidência**: `stop-work-list-container.tsx`, `preventive-stop-list-screen.tsx`, `InterdictionList.jsx`, `reference/research/interdictions/*` (2 imagens).

Confirmado: campo de busca textual full-width sempre visível abaixo do header (placeholder "Buscar por área, empresa, atividade..."); **nenhum chip de status visível por padrão** — filtros ficam recolhidos, revelados por um ícone de funil no canto superior direito.

| Capacidade | Proposta | Status técnico |
|---|---|---|
| Busca por código IMS | Manter como está | Já implementado |
| Busca textual livre | Campo de busca sempre visível, mesmo padrão do campo IMS | **REQUER CAPACIDADE TÉCNICA** |
| Filtro por status | Recolhido por padrão, revelado por ícone de funil (correção: não expor chips permanentemente, conforme evidência) | **REQUER CAPACIDADE TÉCNICA** |
| Ordenação | Não proposta — sem evidência de necessidade | — |
| Paginação | Lista atual carrega tudo; risco de performance para volumes grandes | **REQUER CAPACIDADE TÉCNICA**, fora do escopo de decisão UX |

Layout: manter cards em lista vertical (Web e Mobile) — diferenciação card (operacional) vs. tabela (Relatórios) já documentada, preservar.

---

## I. Detalhe da Paralisação Preventiva (ESPECIFICAÇÃO P0 COMPLETA — ajuste do PO)

**Evidência**: `stop-work-detail-container.tsx`, `preventive-stop-detail-screen.tsx`, `InterdictionDatail.jsx`, `reference/research/interdiction-id/*` (4 imagens).

Especificação concreta, sem remover ou alterar nenhuma regra funcional existente. Baseada na ordem real hoje existente nos dois clientes.

### Ordem e agrupamento — Web

| # | Bloco/Card | Elementos agrupados | Destaque | Colapsável |
|---|---|---|---|---|
| 1 | Breadcrumb | Paralisações / código | Neutro | Não |
| 2 | Header | Código (mono, laranja), badge de status, badge "Interdição Oficial" (condicional), badge de criticidade, título (H1) | Alto peso tipográfico (H1), badges com cor semântica | Não |
| 3 | Banners de estado | `InterdicaoBanner` (se confirmada), `OperationalDeadEndBanner` | Cor de alerta (vermelho/âmbar conforme status), acima de qualquer card | Não |
| 4 | Card "Localização" | Área, Local, Empresa, Coordenadas | Neutro | Não |
| 5 | Card "Descrição" | Atividade, Condição insegura, Ação imediata (condicional) | Neutro | Não |
| 6 | Card "Registro" | Registrado por, Ocorrido em, Paralisado em | Neutro, baixa prioridade (metadado de auditoria) | Sim — pode iniciar colapsado em telas menores |
| 7 | `EvidenceSection` | Galeria de evidências iniciais | Neutro | Não (sempre visível para avaliação) |
| 8 | "Decisão da Liderança" (unifica `LeadershipDecisionSection`: Ver e Agir + Interdição Oficial) | 2 cards lado a lado, mesmo peso visual, cor própria por opção (âmbar/vermelho) — composição inspirada em `reference/research/interdiction-id/image copy 2.png`, sem alterar lógica de habilitação/permissão existente | Alto destaque | Não — ação crítica, nunca esconder |
| 9 | `MdhoSection` | Avaliação MDHO | Destaque (borda colorida) quando pendente de ação do usuário atual; neutro quando só leitura | Sim quando concluída/aprovada (accordion fechado, mostrando resumo); expandida enquanto pendente |
| 10 | `ImsReferenceSection` | Referência IMS | Neutro; leve destaque âmbar quando aguardando registro | Sim quando já registrada |
| 11 | `ActionPlanSection` | Ações corretivas, prazos, responsáveis | Destaque proporcional a atrasos (chip, já definido na seção K) | Seção sempre visível quando aplicável; itens individuais podem colapsar detalhes |
| 12 | `OccurrenceTimeline` | Histórico cronológico + comentários | Neutro | Não — fonte de rastreabilidade, sempre visível ao final |

**Tabs: não se justificam.** A sequência é linear e corresponde à progressão real do workflow (identificação → decisão → tratativa → histórico); dividir em tabs obrigaria alternância para entender o estado completo, contrariando "poucos toques" e compreensão rápida. Accordion nos blocos 6, 9 e 10 (quando já resolvidos) já resolve o problema de tela longa sem precisar de abas.

**CTA contextual (Web)**: sem botão fixo único — cada seção (`LeadershipDecisionSection`, `MdhoSection`, `ImsReferenceSection`, `ActionPlanSection`) expõe sua própria ação principal condicionada a status+permissão (padrão já existente, preservar).

### Ordem e agrupamento — Mobile

| # | Bloco | Elementos agrupados | Destaque | Colapsável |
|---|---|---|---|---|
| 1 | Header (rola com o conteúdo) | Voltar, código, título, meta (status · criticidade) | Título maior peso; código laranja mono | Não |
| 2 | `InterdicaoBanner` | Interdição confirmada | Vermelho, alto contraste | Não |
| 3 | `NotificationAwarenessBanner` | Ciência pendente do usuário atual | **Maior destaque de toda a tela** — antes até da descrição, ação obrigatória pendente | Não |
| 4 | `FlowDeadEndBanner` | Fim de fluxo operacional | Âmbar/neutro | Não |
| 5 | "Localização" | Área, Local, Contratada, Coordenadas | Neutro | Não |
| 6 | "Descrição" | Atividade, Condição, Medida imediata | Neutro | Não |
| 7 | "Registro" | Registrado por, Ocorrido em, Paralisado em | Neutro, baixa prioridade | Sim, oculto por padrão atrás de "Ver detalhes de registro" |
| 8 | `OccurrenceParticipantsSection` | Participantes/responsáveis | Neutro | Sim, se lista >3 participantes |
| 9 | `EvidenceSection` | Evidências | Neutro | Não |
| 10 | "Decisão da Liderança" (unifica `EvaluationSection` + `InterdicaoSection`) | Ver e Agir + Interdição Oficial, lado a lado ou em pilha conforme largura — sem alterar lógica já implementada em cada componente | Alto destaque (âmbar/vermelho) | Não |
| 11 | `MdhoSection` | Avaliação MDHO (com `reviewSectionRef` para scroll automático já existente) | Destaque quando pendente | Sim quando concluída |
| 12 | `ImsReferenceSection` | Referência IMS | Leve destaque quando pendente | Sim quando registrada |
| 13 | `ActionPlanSection` | Plano de ação | Destaque por atraso | Sim por item |
| — | `OccurrenceTimelineList` | Timeline + comentários | Neutro | Não |
| — | Rodapés fixos (`HseActionsFooter`, `ImsRegisterFooter`) sobre `CommentComposerBar` | Ações críticas de aprovação/registro | Fixo/sticky quando ativo — **manter como está** | Não |

**Tabs: não se justificam** (mesma razão do Web; mobile já usa rodapés fixos para a ação crítica do momento).

**CTA contextual (Mobile)**: mantido como está — rodapés fixos condicionados a status+permissão; botão "Voltar ao início" permanece em posição secundária, nunca sobrepondo rodapés de ação crítica (já tratado via `homeButtonWithStickyFooter`).

### Único ajuste de composição proposto (não funcional)

Unificar visualmente "Ver e Agir" + "Interdição Oficial" sob um título de seção comum ("Decisão da Liderança") em ambos os clientes, inspirado na composição de 2 cards lado a lado do Base44 — puramente apresentacional (título de agrupamento + layout em grid/pilha), **sem alterar nenhuma regra de habilitação, permissão ou transição de status** já implementada em `EvaluationSection`/`InterdicaoSection` (Mobile) ou `LeadershipDecisionSection` (Web).

Além disso, replicar no Web o banner de ciência pendente no topo do detalhe (hoje só existe no Mobile) — já registrado na versão anterior desta spec, mantido aqui.

### Responsividade do Detalhe

- **Mobile (<600px)**: 1 coluna, ordem acima; decisão em pilha vertical (2 cards de largura total, empilhados) se não couberem lado a lado com texto legível.
- **Tablet (600-1024px)**: mesma ordem; cards em grid 2×2 nas seções Localização/Descrição/Registro (já existente no Web); decisão lado a lado.
- **Desktop (>1024px)**: mesma ordem linear (sem sidebar de detalhes paralela, sem tabs); largura máxima de conteúdo limitada (`max-w-3xl`, já usado hoje) para preservar legibilidade de textos longos (condição insegura, motivo).

---

## J. Notificações — Leitura × Ciência Obrigatória

**Evidência**: `notification-item.tsx`, `docs/design-system.md`.

Já bem implementado no Web — supera até o Base44 (que só tem lida/não-lida). Estados distinguidos com badge + texto (nunca só cor): "Não lida", "Ciência pendente" (âmbar), "Ciência confirmada" (verde), botão explícito "Confirmar ciência" (nunca automático ao abrir), diálogo extra de confirmação para prioridade CRITICAL.

**Ação pendente**: confirmar paridade visual no Mobile (não verificado nesta etapa) antes de qualquer implementação.

---

## K. Plano de Ação

**Evidência**: `action-plan-section.tsx`, `action-plan-item-card.tsx` (Mobile).

Padrão de atraso já correto no Mobile: chip vermelho pequeno e contido, não banner de tela cheia — preservar. Recomenda-se ao WEB confirmar que o item individual usa o mesmo tratamento discreto (não verificado nesta etapa).

---

## L. Relatórios

**Evidência**: `reports-hub-page.tsx`, `docs/design-system.md` (spec já formalizada na Sprint 3.3).

Sem equivalente no Base44 — não inventar "como era". Hub atual já segue o padrão de card-grid com 3 entradas, estados de loading/forbidden tratados. Única integração: item "Relatórios" da Sidebar deve linkar para `/reports`, preservando `report.read`.

---

## M. Administração (Organização/Responsáveis)

**Evidência**: `organization-contacts-table.tsx`.

Já segue a spec de tabelas de relatório (`docs/design-system.md`): colunas essenciais, badge de status com texto, ações inline. Preservar como está. Harmonização de tokens é o único ajuste necessário (seção O).

---

## N. Perfil

**Evidência**: `profile-page.tsx`, `profile-screen.tsx`, `Profile.jsx`.

**Achado crítico verificado**: nenhuma das telas de Perfil tem logout; a Web não tem logout em lugar nenhum da aplicação; o Mobile tem logout apenas na Home, não no Perfil.

**Proposta**:
- Web: logout sai do Perfil (nunca existiu ali) e vai para a Sidebar (PO-UX-6).
- Mobile: mover (não duplicar) o "Sair" da Home para dentro do Perfil, como ação secundária/destrutiva ao final da tela; remover da lista de atalhos da Home.
- Avatar editável do Base44: não recomendado nesta Sprint — feature nova de domínio/storage, fora do escopo UIUX.

---

## O. Design Tokens (proposta)

**Evidência**: `docs/design-system.md`, `apps/web/src/app/globals.css` (implementação parcial: só 3 variáveis hoje), `reference/base44/src/index.css` (o que não seguir).

**Color**: `background #0F1115`, `surface #171A21`, `surface-muted #20242D`, `surface-elevated #2A303B`, `border #2E3440`, `foreground #F3F4F6`, `foreground-muted #9CA3AF`, `primary #F97316`, `primary-hover #EA580C`, `primary-active #C2410C`, `destructive #DC2626`, `success #16A34A`, `warning #FACC15`, `info #2563EB`, `disabled` (40% opacidade sobre token base).

**Typography**: Page title 32px/700, Section title 28px/700, Card title 24px/600, Body 16px/400, Label 14px/500, Helper/Caption 12px/400, KPI ~28-32px/700 (validado visualmente pelos screenshots de Dashboard) + Label pequeno abaixo.

**Spacing**: escala oficial `4·8·12·16·20·24·32·40·48·64·80·96`.

**Radius**: escala por componente `4·8·12·16·24` (Input/Button 8px, Card 12px, Dialog/Drawer 16px, Badge/Chip 999px) — **não copiar** o radius único do Base44 (~10px em tudo); manter visual mais sóbrio/industrial do SafeStop.

**Component states**: Default, Hover (Web), Pressed, Focused, Disabled, Loading, Success — já enumerados em `docs/design-system.md`.

---

## P. Componentes prioritários (escopo mínimo desta Sprint)

1. **Button** — maior ganho de consistência por esforço (hoje reimplementado ad-hoc em quase todo arquivo)
2. **Navigation Item** — necessário diretamente para Sidebar (C) e Bottom Nav (D)
3. **Badge** — já usado repetidamente com variações (status de notificação, prioridade de ação, ativo/inativo)
4. **Card** — base de listas em ambas plataformas
5. **Empty State** — padrão já exigido, implementado componente a componente
6. **Skeleton** — já usado de forma fragmentada

**Fora do escopo mínimo** (próximas sprints): Select, Textarea, Search, Filter controls, Table, Dialog, KPI Card, Error State.

---

## Q. Responsividade

| Superfície | Breakpoint | Comportamento |
|---|---|---|
| Web Desktop | ≥1024px | Sidebar expandida fixa; grids de KPI 3-4 colunas; gráficos visíveis |
| Web Tablet | 768-1023px | Sidebar colapsada para ícones (tooltip on-hover); introduzir estado intermediário de grid (`md:grid-cols-3`) hoje ausente |
| Web Mobile (navegador) | ≤767px | Sidebar recolhida em Drawer (hambúrguer no topo); grids 2 colunas (já correto); gráficos ocultos (já correto) |
| Mobile Nativo | Todas as larguras | Bottom Navigation fixa (5 itens, sempre visível) + Stack interno; SafeAreaView já consistente |

Nenhuma superfície deve "esconder links" sem substituto de navegação.

---

## R. Estados UX (por padrão/tela crítica)

| Estado | Onde já existe | Gap identificado |
|---|---|---|
| Default/Hover/Focus/Active/Disabled | Presentes na maioria dos componentes lidos | Web sem estado `:active` distinto — considerar ao formalizar Button |
| Loading | Componentes dedicados em quase todas as telas | Preservar |
| Submitting | Texto de botão trocado durante mutation | Já segue a spec |
| Success | Banners pontuais, `PreventiveStopSuccessView` (Mobile) | Web de criação de PP vai direto ao detalhe (sem tela de sucesso dedicada) — aceitável, não recomendado replicar Base44 aqui |
| Error/Empty/Forbidden/Retry | Componentes dedicados consistentes | Copy de forbidden varia entre telas — padronizar ao formalizar tokens |
| Offline | Mobile já trata (banner + bloqueio) | **Gap real**: Web não tem indicador visual de offline — recomenda-se replicar o banner do Mobile |

---

## S. Acessibilidade

- Mobile: já cumpre bem (`accessibilityLabel`/`accessibilityRole` em praticamente todo `Pressable`) — preservar ao criar itens da Bottom Nav.
- Web: `role="alert"`/`role="status"` já presentes; usar `<nav aria-label="Navegação principal">` na Sidebar.
- Contraste: validar `text-gray-400`/`text-gray-500` sobre fundo escuro (WCAG AA 4.5:1) ao formalizar tokens — não estimar visualmente.
- Dialogs: `<dialog>` nativo com `showModal()` já trata foco corretamente — preservar ao padronizar em `packages/ui`.
- Não depender só de cor: já cumprido nos casos observados — manter obrigatoriamente nos ícones novos de Sidebar/Bottom Nav (label sempre visível).

---

## T. P0 / P1 / P2 consolidado por item de UX

### P0
- Composição da Sidebar Web (seção C)
- Logout na Sidebar Web (lacuna real verificada)
- Banner de ciência pendente replicado no topo do Detalhe Web (seção I)
- Indicador visual de offline na Web (seção R)

### P1
- Bottom Navigation Mobile completa (seção D)
- Tokens iniciais em `packages/ui`: Button, Navigation Item, Badge, Card, Empty State, Skeleton (seções O/P)
- Reorganização visual do Dashboard por títulos de seção (seção F)
- Reagrupamento de campos da Nova PP + seletor de criticidade por chips no Web (seção G)
- Filtro de status recolhido por ícone de funil, se a busca textual já for viável (seção H)
- Mover logout mobile da Home para o Perfil (seção N)
- Confirmar/harmonizar badges de Notificações entre Web e Mobile (seção J)
- Responsividade Tablet da Sidebar + grid intermediário de KPIs (seção Q)

### P2
- Filtros de busca textual/status que exigem capacidade técnica nova (seção H)
- Avatar editável no Perfil
- Refinamentos de microinteração/spacing fino
- Componentes secundários de `packages/ui` (Select, Textarea, Table, Dialog, KPI Card)

---

## U. Recomendações que exigem nova decisão de produto

1. **Campo "Motivo da Paralisação" separado de "Condição Insegura"** — decisão de domínio/workflow, não de UI (seção G).
2. **Evidência (foto) na criação vs. só depois de criada a ocorrência** — mudança de fluxo de domínio a avaliar, não escolha de layout (seção G).
3. **Filtro de status e busca textual na Listagem — priorizar capacidade técnica agora ou depois?** — decisão de priorização de produto/arquitetura, não de UX (seção H).

---

## Resumo de arquivos/pastas inspecionados

`docs/decisions/UX-CONVERGENCE-DECISIONS.md`; `docs/design-system.md`; `reference/base44/src/pages/*.jsx` (8 páginas); `reference/base44/src/index.css`; `tailwind.config.js`; `components.json`; **24 imagens em `reference/research/**`**; `apps/web/src/features/notifications/components/{app-top-bar,notification-item}.tsx`; `apps/web/src/app/(app)/layout.tsx`; `apps/web/src/app/layout.tsx`; `apps/web/src/app/globals.css`; `apps/web/src/features/dashboard/components/{dashboard-page,dashboard-kpi-grid}.tsx`; `apps/web/src/features/stop-work/components/{stop-work-create-container,stop-work-list-container,stop-work-detail-container}.tsx`; `apps/web/src/features/action-plan/components/action-plan-section.tsx`; `apps/web/src/features/reports/components/reports-hub-page.tsx`; `apps/web/src/features/profile/components/profile-page.tsx`; `apps/web/src/features/organization-contacts/components/organization-contacts-table.tsx`; `apps/mobile/app/(app)/{_layout,index,profile,notifications/index}.tsx`; `apps/mobile/src/features/stop-work/components/*`; `apps/mobile/src/features/profile/components/profile-screen.tsx`; `apps/mobile/src/features/action-plan/components/action-plan-item-card.tsx`; `packages/ui/src/index.ts`.

**Nenhum código foi implementado, criado ou editado nesta etapa. Nenhum commit foi feito.**

---

## Histórico de revisão desta spec

- **v1**: proposta inicial do UIUX (seções A-U), com nota de evidência incorreta sobre `reference/research/`.
- **v2**: correção factual — `reference/research/` inspecionada (24 imagens); ajustes nas seções C, D, F, G, H, I com base em evidência visual real.
- **v3 (atual)**: incorpora os 4 ajustes do Product Owner — item "Nova Paralisação" na Sidebar (seção C), decisão de lista plana sem agrupamento (seção C), comportamento de formulário não salvo na Bottom Nav (seção D), especificação P0 completa do Detalhe da PP para Web e Mobile (seção I). Todas as demais decisões (Sidebar como conceito, Bottom Nav+Stack, identidade visual, Dashboard sem perda de KPIs, nomenclatura, Nova PP sem mudança de domínio, Notificações, Plano de Ação, Relatórios, online-only, Design System controlado, P0/P1/P2) permanecem inalteradas desta versão.

**Confirmação**: nenhuma implementação de código ocorreu em nenhuma das 3 versões desta spec. Aguardando aprovação final do Product Owner antes do handoff ao MASTER.
