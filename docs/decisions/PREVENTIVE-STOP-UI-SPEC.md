# Spec UI/UX — Paralisação Preventiva (Sprint 2.1)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 2.1 — Stop Work / Paralisação Preventiva  
**Agente:** UIUX  
**Atualizado:** 2026-08-01  
**Desbloqueia:** MOBILE e WEB (implementação sem ambiguidade de campos)

**Referências obrigatórias:**

| Fonte | Uso |
|---|---|
| `reference/base44/src/pages/NewInterdiction.jsx` | Composição criação, callout, CTA, sucesso |
| `reference/base44/src/pages/InterdictionList.jsx` | Search, cards, empty |
| `reference/base44/src/pages/InterdictionDatail.jsx` | Header código+status, info grid, timeline |
| `docs/design-system.md` | Tokens, tipografia, componentes, densidade |
| `docs/decisions/PREVENTIVE-STOP-DECISIONS.md` | A-R1…A-R10 (regras de produto) |

Base44 é referência visual/composicional. Documentação SafeStop prevalece em regras.

---

## Objetivo

Spec visual **mobile-first** para registrar Paralisação Preventiva em **< 60s**, listar PP, ver sucesso com código `SS-*` e detalhe **read-only** — sem fotos, sem banner de notificados, sem ações de decisão.

---

## Usuário

| Item | Valor |
|---|---|
| Persona | Técnico HSE / campo |
| Contexto | Uma mão, pressão de tempo, conexão instável |
| Permissão criar | `occurrence.create` |
| Org | Organização ativa da sessão |

---

## Telas e rotas

| ID | Tela | Rota | Plataformas |
|---|---|---|---|
| **PP-NEW** | Criação | `/stop-work/new` | Mobile + Web |
| **PP-SUCCESS** | Sucesso | estado pós-create (inline ou `/stop-work/new?success=`) | Mobile + Web |
| **PP-LIST** | Listagem | `/stop-work` | Mobile + Web |
| **PP-DETAIL** | Detalhe read-only | `/stop-work/[id]` | Mobile + Web |

**Redirects (A-R8):** `/occurrences/new` → `/stop-work/new`.  
**Módulo (A-R9):** UI `features/stop-work/` → persistência `features/occurrences/`.

---

## Fluxo

```text
[PP-LIST] ── CTA / FAB ──► [PP-NEW]
                              │
                         RPC create ok
                              ▼
                         [PP-SUCCESS]
                    ┌─────────┴─────────┐
            Ver ocorrência      Nova paralisação
                    ▼                   ▼
              [PP-DETAIL]            [PP-NEW]

[PP-LIST] ── card ──► [PP-DETAIL]
```

---

## FORA do escopo UI (2.1)

| Item | Motivo |
|---|---|
| Upload / fotos | A-R1 |
| Banner “Responsáveis notificados” / Bell de alertas | A-R1; Sprint 3 |
| Modais / dialogs / bottom sheets na criação | Single-scroll |
| Ver e Agir / Interdição Oficial / liberação / ciência | Workflow futuro |
| Campo `title` visível | A-R3 |
| Campo “Motivo da Paralisação” (Base44 `reason`) | A-R6 |
| Filtro de status na listagem | A-R5 — filtro implícito PP |
| Auto-transição para `EM_AVALIACAO` | Workflow; Sprint 4 |
| Área / empresa como texto livre | Multi-tenant FK |

---

# Mapeamento de campos — criação (fonte da verdade)

Schema: `createPreventiveStopSchema` (`@safestop/validation`).

**Ordem visual obrigatória (topo → base):**

| # | Label UI | Campo | Controle | Obrig. | Default | Regras |
|---|---|---|---|---|---|---|
| — | *(callout)* | — | Callout information | — | — | Ver § Callout |
| 1 | Área | `areaId` → `area_id` | Select / Combobox FK `areas` | **Sim** | — | Org ativa; busca se ≥ 10 opções |
| 2 | Local | `locationDescription` | Text | **Sim** | — | Placeholder: `Ex: Galpão 3` |
| 3 | Atividade | `taskDescription` | Text | **Sim** | — | Gera `title` (trim, max 200) — campo title **oculto** |
| 4 | Condição insegura | `conditionDescription` | Textarea 3 linhas | **Sim** | — | |
| 5 | Criticidade | `severity` | **SeveritySelector 2×2** | **Sim** | `MEDIUM` | `LOW` `MEDIUM` `HIGH` `CRITICAL` |
| 6 | Contratada | `contractorOrganizationId` | Select / Combobox FK | **Sim** | — | Cascata — ver § Cascata |
| 7 | Contrato | `contractId` | Select / Combobox FK | **Não** | — | Cascata; opções filtradas pela contratada |
| 8 | Medida imediata | `immediateActionDescription` | Textarea 2 linhas | **Não** | — | Label: `Medida imediata (opcional)` |
| — | Geolocalização | `latitude` `longitude` `locationAccuracy` | Indicador | **Não** | — | Opt-in; não bloqueia |
| — | *(CTA)* | — | Primary full-width | — | — | Sticky bottom mobile |

**Campos ocultos / servidor:**

| Campo | Origem |
|---|---|
| `title` | Cliente: `buildPreventiveStopTitle(taskDescription)` (A-R3) |
| `organizationId` | Sessão + RPC |
| `occurredAt` / `stoppedAt` | RPC (`stopped_at = occurred_at`, A-R4) |
| `unitId` | **Não exibir** na 2.1 |
| `createdBy` | `auth.uid()` |

### Mensagens de erro

| Campo | Mensagem |
|---|---|
| Área | `Selecione a área.` |
| Local | `Informe o local.` |
| Atividade | `Informe a atividade.` |
| Condição | `Descreva a condição insegura.` |
| Criticidade | `Selecione a criticidade.` |
| Contratada | `Selecione a contratada.` |
| Contrato | `Contrato inválido para a contratada selecionada.` (só se enviado inconsistente) |

Após submit inválido: primeiro erro em foco/scroll; preservar valores.

---

# Cascata Contratada → Contrato (A-R2)

```text
[Contratada *] ──seleciona──► [Contrato (opcional)]
                     │
                     ├── limpa contractId
                     ├── carrega contratos ativos dessa contratada
                     │     (client_organization_id = org ativa
                     │      AND contractor_organization_id = selecionada
                     │      AND is_active)
                     └── se 1 contrato: pré-selecionar (acelera <60s)
                         se 0 contratos: ocultar ou desabilitar select Contrato
                         se N: lista com label contract_number + name
```

| Regra | Comportamento |
|---|---|
| Contratada obrigatória | Sim |
| Contrato obrigatório | **Não** (A-R2) |
| Troca de contratada | Zerar `contractId`; recarregar opções |
| Sem contratada | Campo Contrato oculto ou disabled + placeholder `Selecione a contratada primeiro` |
| Label Contratada | `Contratada` (produto: empresa envolvida) |
| Label Contrato | `Contrato (opcional)` |
| Display opção contrato | `{contract_number}` — `{name}` (omitir parte vazia) |
| Payload | Enviar `contractorOrganizationId` sempre; `contractId` só se selecionado |
| Validação | RPC rejeita contrato inconsistente com contratada |

**Empty states:**

- Sem contratadas: select disabled + `Nenhuma contratada com contrato ativo. Contate o administrador.` + CTA disabled.
- Sem áreas: `Nenhuma área cadastrada para esta organização.` + CTA disabled.

---

# SeveritySelector 2×2

```text
┌─────────────┬─────────────┐
│   Baixa     │   Média ●   │
│   (LOW)     │  (MEDIUM)   │
├─────────────┼─────────────┤
│   Alta      │  Crítica    │
│   (HIGH)    │ (CRITICAL)  │
└─────────────┴─────────────┘
```

| Valor | Label | Token |
|---|---|---|
| `LOW` | Baixa | neutro + label |
| `MEDIUM` | Média | warning/âmbar + label |
| `HIGH` | Alta | primary/laranja + label |
| `CRITICAL` | Crítica | destructive + label |

- Toque mín. 48px; seleção única; selected = borda + ring + tint.
- `accessibilityRole="radio"` + `selected`.
- Cor nunca é o único indicador.

---

# Callout “< 60 segundos”

| Prop | Valor |
|---|---|
| Posição | Abaixo do header de PP-NEW |
| Variante | `information` `#2563EB` |
| Ícone | `Zap` |
| Texto | `Preenchimento otimizado para menos de 60 segundos` |
| Layout | full-width, padding 12, radius 12 |

**Não** usar callout Bell/laranja de notificações (Base44).

---

# CTA criação — full-width bottom

| Prop | Mobile | Web |
|---|---|---|
| Posição | Sticky acima Safe Area | Full-width no fim do form (`max-w-lg`); sticky se viewport < 768px |
| Altura | 52–56px | Consistente DS |
| Variante | `primary` `#F97316` | Igual |
| Idle | `Paralisar atividade` | Igual |
| Loading | `Registrando...` + spinner; disabled | Igual |
| Scroll padding | ≥ CTA + Safe Area | — |

Sem caixa alta total. Sem modal de confirmação pré-envio.

---

# PP-NEW — Criação

### Wireframe mobile

```text
┌──────────────────────────────────────┐
│ ←  Nova Paralisação Preventiva       │
│    Identifique a condição insegura   │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ ⚡ Preenchimento otimizado para  │ │
│ │    menos de 60 segundos          │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Área *                          ▾    │
│ Local *                              │
│ Atividade *                          │
│ Condição insegura *                  │
│                                      │
│ Criticidade *                        │
│ ┌───────────┬───────────┐            │
│ │  Baixa    │  Média ●  │            │
│ ├───────────┼───────────┤            │
│ │  Alta     │  Crítica  │            │
│ └───────────┴───────────┘            │
│                                      │
│ Contratada *                    ▾    │
│ Contrato (opcional)             ▾    │  ← após contratada
│                                      │
│ Medida imediata (opcional)           │
│                                      │
│ 📍 Localização capturada             │
│    ou: Localização não disponível    │
│                                      │
├──────────────────────────────────────┤
│ [      Paralisar atividade       ]   │  sticky + Safe Area
└──────────────────────────────────────┘
```

### Geo (opt-in)

- Pedir permissão no contexto da tela.
- OK → enviar coords + accuracy; texto `Localização capturada`.
- Negada/falha → `Localização não disponível`; **não** bloquear submit.
- Sem tracking contínuo.

### Rascunho (mobile)

- Draft local parcial; indicador `Salvo neste dispositivo`.
- Limpar só após RPC sucesso.
- Offline 2.1: **sem** fila — bloquear submit, preservar draft, mensagem clara.

### Estados

| Estado | UI |
|---|---|
| Loading opções | Skeleton / loading |
| Erro opções | Mensagem + `Tentar novamente` |
| Submitting | CTA loading; anti double-tap |
| Erro RPC | `Não foi possível registrar. Seus dados foram preservados.` |
| Sucesso | → PP-SUCCESS |

---

# PP-SUCCESS — Sucesso

```text
┌──────────────────────────────────────┐
│         (CheckCircle2 / success)     │
│                                      │
│       Atividade paralisada           │
│                                      │
│          SS-26-000001                │  monospace + primary
│     [Paralisação Preventiva]         │
│                                      │
│  A ocorrência foi registrada         │
│  no servidor.                        │
│                                      │
│ [      Ver ocorrência            ]   │  primary full-width
│ [      Nova paralisação          ]   │  outline full-width
└──────────────────────────────────────┘
```

| Elemento | Texto / ação |
|---|---|
| Título | `Atividade paralisada` |
| Código | `public_code` real (`SS-*`) — **obrigatório** |
| Corpo | `A ocorrência foi registrada no servidor.` |
| CTA 1 | `Ver ocorrência` → PP-DETAIL |
| CTA 2 | `Nova paralisação` → limpa form → PP-NEW |

**Proibido:** “Responsáveis notificados”, “comunicação iniciada”, qualquer menção a push/alertas.

---

# PP-LIST — Listagem

**Filtro implícito:** apenas `status = PARALISACAO_PREVENTIVA` (A-R5). Sem chips de status (diferente do Base44).

### Wireframe mobile

```text
┌──────────────────────────────────────┐
│ Paralisação Preventiva          [+]  │
│ N registros                          │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🔍 Buscar por código, área…      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ SS-26-000154              Média  │ │
│ │ Soldagem no galpão 3             │ │  ← title
│ │ Área X · Contratada Beta         │ │
│ │ há 12 min                        │ │
│ └──────────────────────────────────┘ │
│ …                                    │
└──────────────────────────────────────┘
```

### Search (obrigatório)

| Prop | Valor |
|---|---|
| Placeholder | `Buscar por código, área, empresa, atividade…` |
| Campos | `public_code`, nome área, nome contratada, `title` / `taskDescription` |
| Escopo | Client-side sobre lista já filtrada PP **ou** query server se página grande — resultado equivalente |
| Empty search | `Nenhuma ocorrência encontrada.` + manter CTA nova |

**Não** exibir painel de filtro por status na 2.1.

### Card

1. `public_code` + criticidade  
2. `title`  
3. Área · Contratada  
4. Data relativa (`created_at` / `occurred_at`)  

Toque → PP-DETAIL.

### Empty

```text
Nenhuma Paralisação Preventiva encontrada.
As novas paralisações aparecerão aqui.

[ Registrar Paralisação ]   ← primary
```

### Web

- Search no topo + lista de cards **ou** tabela: Código | Título | Área | Contratada | Criticidade | Data.
- CTA header: `Nova paralisação`.
- Ordenação padrão: `created_at` desc.

### Estados

| Estado | UI |
|---|---|
| Loading | Skeleton cards |
| Vazio | Empty + CTA |
| Erro | `Não foi possível carregar as ocorrências.` + retry |
| Populado | Lista + search |

---

# PP-DETAIL — Detalhe read-only

Composição Base44 (header + info grid + timeline) **sem** bloco de decisão / comentários / fotos.

```text
┌──────────────────────────────────────┐
│ ←  SS-26-000154                      │
│     [Paralisação Preventiva] [Média] │
│     Soldagem no galpão 3             │
│                                      │
│ ┌─ Info ───────────────────────────┐ │
│ │ Área      Caldeiraria            │ │
│ │ Local     Galpão 3               │ │
│ │ Contratada Empresa Beta          │ │
│ │ Contrato  C-001 — Nome (se houver)│ │
│ │ Autor     Nome                   │ │
│ │ Abertura  16/07/2026 14:32       │ │
│ │ Parada    16/07/2026 14:32       │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Atividade / Condição / Medida        │
│ (medida só se preenchida)            │
│                                      │
│ Coordenadas (se houver)              │
│                                      │
│ ── Timeline ─────────────────────── │
│ • Paralisação Preventiva registrada  │
│   por Nome · 16/07/2026 14:32        │
│   (1 entrada: null → PP)             │
└──────────────────────────────────────┘
```

| Seção | Conteúdo | Editável |
|---|---|---|
| Header | `public_code` + status badge + severity badge + `title` | Não |
| Info | área, local, contratada, contrato (se houver), autor, occurred/stopped | Não |
| Descrição | atividade, condição, medida imediata (ocultar se vazia) | Não |
| Geo | coords se existirem | Não |
| Timeline | **1 entrada** `occurrence_status_history` | Não |

### Proibido no detalhe 2.1

- Ver e Agir / Interdição Oficial  
- Comentários  
- Fotos / upload  
- Ciência / liberação / cancelar / IMS  
- Qualquer CTA que mude status  

### Web

Breadcrumb: `Paralisação Preventiva > SS-26-000154`. Mesma hierarquia.

---

## Labels oficiais

| Enum / valor | Label UI |
|---|---|
| `PARALISACAO_PREVENTIVA` | `Paralisação Preventiva` |
| `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` | `Baixa` / `Média` / `Alta` / `Crítica` |

---

## Tokens (design-system)

| Uso | Valor |
|---|---|
| Background / surface | `#0F1115` / `#171A21` / `#20242D` |
| Primary CTA | `#F97316` |
| Callout 60s | information `#2563EB` |
| Success | `#16A34A` |
| Destructive (crítica) | `#DC2626` |
| Radius input/button | 8px |
| Radius card | 12px |
| Gap campos | 16–20 |

Ícones: `ArrowLeft`, `Zap`, `CheckCircle2`, `MapPin`, `Search`, `Plus`.

---

## Diferenças Base44 (justificadas)

| Base44 | SafeStop 2.1 | Justificativa |
|---|---|---|
| Área / empresa texto livre | Select FK multi-tenant | Isolamento org; A-R2 |
| Sem contrato | Cascata contratada → contrato opcional | `contracts` + consistência FK |
| Fotos na criação | **Omitido** | A-R1 |
| Banner Bell “5 responsáveis” | **Omitido** | Notificações = Sprint 3 |
| Sucesso “responsáveis notificados” | Código `SS-*` + registrado no servidor | Fonte oficial = banco; sem push |
| Auto `Em Avaliação` no create | Permanece `PARALISACAO_PREVENTIVA` | Workflow oficial |
| Criticidade 1×4 | **2×2** | Toque campo / uma mão |
| Filtros de status na lista | Filtro implícito PP | A-R5 |
| Decisão / comentários no detalhe | **Omitidos** | Fora 2.1 |
| CTA azul | Primary laranja | Design system SafeStop |
| `reason` + `unsafe_condition` | Só condição + medida opcional | A-R6 |
| Observações | → Medida imediata | A-R6 |

---

## Critérios de aceite

1. Ordem de campos PP-NEW conforme tabela (callout → área → local → atividade → condição → 2×2 → contratada → contrato → medida → geo → CTA).
2. Cascata: contrato filtrado pela contratada; contrato opcional; troca de contratada limpa contrato.
3. Área e contratada são selects FK — nunca texto livre.
4. SeveritySelector 2×2, default `MEDIUM`.
5. Callout “menos de 60 segundos” presente.
6. CTA full-width; sticky + Safe Area no mobile.
7. Sucesso exibe `SS-*`; CTAs `Ver ocorrência` / `Nova paralisação`; **sem** “Responsáveis notificados”.
8. Listagem: search + cards + empty com CTA; só PP.
9. Detalhe: header código+status; info read-only; timeline 1 entrada; **sem** ações de decisão.
10. Sem fotos, sem auto `EM_AVALIACAO`, sem modais na criação.
11. Mobile e Web: mesmos labels, campos e regras; layout pode diferir.

---

## Checklist implementação (MOBILE / WEB)

### PP-NEW
- [ ] Callout <60s  
- [ ] Select área FK  
- [ ] Local, atividade, condição  
- [ ] SeveritySelector 2×2  
- [ ] Cascata contratada → contrato  
- [ ] Medida imediata opcional  
- [ ] Geo indicator  
- [ ] CTA full-width bottom  
- [ ] Sem title / fotos / banner notificados / modais  

### PP-SUCCESS
- [ ] Ícone + código SS-*  
- [ ] Ver ocorrência / Nova paralisação  
- [ ] Sem copy de notificados  

### PP-LIST
- [ ] Search  
- [ ] Cards  
- [ ] Empty + CTA  
- [ ] Filtro implícito PP  

### PP-DETAIL
- [ ] Header código + status (+ criticidade)  
- [ ] Info read-only  
- [ ] Timeline 1 entrada  
- [ ] Sem ações decisão  

---

## Riscos

| Risco | Mitigação |
|---|---|
| Cascata sem contratos na contratada | Ocultar/desabilitar contrato; create segue só com contratada |
| Implementação atual sem contrato / search | Alinhar a esta spec antes de fechar 2.1 |
| Sucesso web redireciona direto ao detalhe | Deve passar por PP-SUCCESS ou estado equivalente com SS-* |

---

## Registro

```text
Etapa UIUX — Spec visual mobile-first Sprint 2.1
Atualizado: 2026-08-01
Arquivo: docs/decisions/PREVENTIVE-STOP-UI-SPEC.md
Status: PRONTO PARA IMPLEMENTAÇÃO — MOBILE/WEB sem ambiguidade de campos
```
