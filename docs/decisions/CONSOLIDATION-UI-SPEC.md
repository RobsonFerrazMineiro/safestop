# Spec UI/UX — Consolidação (Sprint 2.9)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 2.9 — Consolidação UX / hardening operacional  
**Agente:** UIUX  
**Data:** 2026-08-03  
**Entregável:** `docs/decisions/CONSOLIDATION-UI-SPEC.md`

**PO (fonte oficial):** [`CONSOLIDATION-DECISIONS.md`](./CONSOLIDATION-DECISIONS.md) — PO-CON-1…PO-CON-22; Gate G0.

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/decisions/CONSOLIDATION-DECISIONS.md` | Dead-ends VA/IO, rotas canônicas |
| Specs 2.1–2.8 `*-UI-SPEC.md` | Hierarquia detalhe acumulada |
| `docs/design-system.md` | Banner, Empty, navegação |
| `reference/base44` InterdictionList / InterdictionDetail | Checklist gaps |

**Sem código apps/packages/supabase nesta entrega UIUX.**

---

## Objetivo

Consolidar a experiência operacional SafeStop (2.0–2.8) em:

1. Banners de **dead-end** claros (VA e IO pós-IMS)
2. Navegação única **Paralisações** com rotas `/stop-work` canônicas
3. Hierarquia de detalhe **única e confirmada**
4. Checklist Base44 → SafeStop (o que adaptar / o que não copiar)

WEB/MOBILE implementam sem ambiguidade; **sem** novas features de produto (plano, liberação, notificações).

---

## Princípios

| Princípio | Aplicação |
|---|---|
| Dead-end honesto | Banner informativo — **zero** CTA fake (PO-CON-2 / PO-CON-3) |
| Uma superfície operacional | Detalhe e criação só em `stop-work` (PO-CON-5 / PO-CON-6) |
| Redirect, não duplicar | `/occurrences/*` → `/stop-work/*` |
| Terminologia | Nav: **Paralisações**; detalhe: fluxo completo IO/VA |
| Base44 | Referência visual — SafeStop prevalece em regras |

---

# 1. Banners de dead-end

## CON-BANNER-VA — status `VER_E_AGIR` (PO-CON-2)

**Posição:** logo abaixo do header (código + badges), **acima** do grid info — ou imediatamente acima de `VerEAgirSummary`.

```text
┌──────────────────────────────────────┐
│ ℹ  Aguardando validação e liberação │
│    — em versão futura                │
└──────────────────────────────────────┘
```

| Prop | Valor |
|---|---|
| Variante | Information / neutro-azul (não âmbar de “ação pendente agora”) |
| Ícone | `Info` |
| CTA | **Nenhum** |
| Visível | `status === VER_E_AGIR` |
| Copy | **CON-C01** (+ CON-C02 opcional corpo) |

**Não** mostrar botões Liberar / Validar / Corrigir (fora 2.9).

---

## CON-BANNER-TRATATIVA — status `EM_TRATATIVA` (PO-CON-3)

> **Superseded (Sprint 3.0):** com IMS no ramo IO, a seção real [`ACTION-PLAN-UI-SPEC.md`](./ACTION-PLAN-UI-SPEC.md) **substitui** este banner.  
> - Com `action_plan.create` e sem plano → AP-EMPTY + CTA (não CON-C03).  
> - Sem create → banner **AP-C02** “Aguardando Plano de Ação”.  
> - Com plano → seção funcional; CON-C03 **removido**.  
> Manter CON-C03 só como referência 2.9 / fallback se feature plano indisponível.

**Posição (2.9 legado):** abaixo do header (e abaixo do banner IO vermelho se ainda visível — preferir **um** banner de fase dominante).

```text
┌──────────────────────────────────────┐
│ ℹ  Em tratativa — Plano de Ação em   │
│    versão futura                     │
└──────────────────────────────────────┘
```

| Prop | Valor |
|---|---|
| Variante | Information / neutro |
| CTA | **Nenhum** |
| Visível (2.9) | `status === EM_TRATATIVA` **e** seção Plano de Ação **não** montada |
| IMS card | **Mantido** read-only (2.8) |
| Copy | **CON-C03** (legado) → ver AP-C02 / AP-SECTION na 3.0 |

**Não** mostrar CTA Liberação. CTA Plano → apenas via `ACTION-PLAN-UI-SPEC` (3.0).

---

## Regras comuns dos banners

| Item | Spec |
|---|---|
| Mobile / Web | Mesmo texto; full-width |
| A11y | `role="status"`; não só cor |
| Dismiss | **Não** dismissível (estado do fluxo) |
| Concurrent | Um dead-end por vez — VA **ou** tratativa (status exclusivos) |

---

# 2. Navegação canônica — Paralisações

## Labels

| Superfície | Label UI |
|---|---|
| Nav principal (web sidebar / mobile home) | **Paralisações** |
| Título listagem | `Paralisações` **ou** `Paralisação Preventiva` — **padronizar 2.9:** título página **Paralisações**; subtítulo pode citar PP |
| Breadcrumb detalhe | `Paralisações > SS-26-…` |
| Item secundário HSE | `Aprovação HSE` → `/approvals/mdho` (inalterado 2.7) |

Evitar labels divergentes: “Ocorrências” vs “Paralisação Preventiva” vs “Stop Work” na nav do usuário.  
**Código/rotas:** `stop-work` permanece; **copy de nav:** Paralisações.

## Rotas (PO-CON-5 / PO-CON-6)

| Canônica | Legacy → comportamento |
|---|---|
| `/stop-work` | Listagem operacional |
| `/stop-work/new` | Criação PP |
| `/stop-work/[id]` | Detalhe completo |
| `/occurrences` | Redirect → `/stop-work` (ou manter listagem genérica **somente** se não for fluxo operacional — **preferir redirect**) |
| `/occurrences/new` | Redirect → `/stop-work/new` |
| `/occurrences/[id]` | Redirect → `/stop-work/[id]` |
| Mobile `/(app)/occurrences/*` | Redirect → `/(app)/stop-work/*` |

**Proibido:** duas UIs de detalhe (occurrences + stop-work) com seções diferentes.

## Mobile tabs / home

| Item | Spec |
|---|---|
| Entrada principal | Card/botão **Paralisações** → `stop-work` |
| FAB / CTA | Nova Paralisação → `stop-work/new` |
| Aprovação HSE | Entrada separada se `mdho.approve` |

---

# 3. Hierarquia do detalhe (confirmada)

Ordem vertical **obrigatória** no detalhe canônico `/stop-work/[id]`:

```text
 1. Header — código SS-* + status badge + criticidade
 2. Banner de fase (quando aplicável):
      - IO confirmada: “Atividade formalmente interditada” (2.5)
      - VER_E_AGIR: CON-BANNER-VA (2.9)
      - EM_TRATATIVA: CON-BANNER-TRATATIVA (2.9) — **omitir** se ActionPlanSection (3.0) montada
 3. Grid info — área, local, atividade, autor, datas
 4. Condição insegura (+ medida imediata se houver)
 5. Evidências — EvidenceSection 2.2
 6. Decisão da Liderança — VA / IO (2.4–2.5) + summaries
 7. Avaliação Técnica (MDHO) — start / form / HSE review / summary (2.6–2.7)
 8. Referência IMS — form / card (2.8)
 9. Plano de Ação — ActionPlanSection (3.0) quando IO+IMS+EM_TRATATIVA
10. Linha do Tempo — OccurrenceTimeline (2.3)
11. Carregar mais (se houver)
12. CommentComposer (2.3)
```

### Resumo mnemônico (aceite usuário)

```text
Evidence → Decisão → MDHO → IMS → Plano → Timeline → Composer
```

(+ Header/Info/Condição/Banners acima de Evidence.)

### Por status — o que aparece

| Status | Seções ativas além de base |
|---|---|
| `PARALISACAO_PREVENTIVA` | Start avaliação |
| `EM_AVALIACAO` | Cards VA (± IO) |
| `VER_E_AGIR` | VerEAgirSummary + **CON-BANNER-VA** |
| `INTERDICAO_CONFIRMADA` | InterdicaoSummary + MdhoStart |
| `MDHO_EM_PREENCHIMENTO` | MdhoForm |
| `AGUARDANDO_APROVACAO_HSE` | HseReview |
| `AGUARDANDO_REGISTRO_IMS` | MdhoSummary + ImsForm |
| `EM_TRATATIVA` | ImsCard + **ActionPlanSection (3.0)** — CON-BANNER-TRATATIVA só se plano indisponível |

Composer e Timeline: sempre que `occurrence.read` (exceto erros/404).

---

# 4. Checklist Base44 vs SafeStop

## Listagem / filtros

| Base44 | SafeStop 2.9 | Ação |
|---|---|---|
| Título “Ocorrências” | Nav **Paralisações** · rota `/stop-work` | Adaptar label |
| Filtros status Todos / PP / Em Avaliação / VA / IO / Liberada / Encerrada | Listagem PP operacional + busca código/IMS; filtros multi-status **não** obrigatórios na 2.9 (listagem pode evoluir) | **Não** copiar chip Liberada/Encerrada como foco operacional se fora de escopo |
| Search área/empresa/atividade | Search + filtro Código IMS (2.8) | Manter; alinhar placeholder |
| Card → detalhe | → `/stop-work/[id]` | Canônico |

## Detalhe único

| Base44 | SafeStop 2.9 | Ação |
|---|---|---|
| Um detalhe com decisão 2 cols + MDHO flag + ims_code | Um detalhe `stop-work` com seções por sprint | **Já** — consolidar redirects |
| Decisão merge start+decide | Start separado + VA/IO | Não regressar |
| `mdho_status` client | Assessment + RPCs | Não copiar |
| `ims_code` sem validação BAA | Form regex + RPC | Manter 2.8 |
| Sem dead-end copy | Banners CON-C* | **Novo 2.9** |
| Liberar / Encerrar no detalhe | **Fora** 2.9 | Não reintroduzir |
| Notified / responsáveis | **Fora** (Sprint 3) | Não reintroduzir |
| Timeline events mistos | OccurrenceTimeline kinds | Manter 2.3+ |

## Navegação

| Base44 | SafeStop | Ação |
|---|---|---|
| Rotas soltas New / List / Detail | `/stop-work` + `/approvals/mdho` | Canônico |
| Duplicata occurrences foundation | Redirect | PO-CON-5 |

---

# Copy PT — CON-C*

| ID | Contexto | Texto |
|---|---|---|
| **CON-C01** | Banner VA (título/corpo) | `Aguardando validação e liberação — em versão futura` |
| **CON-C02** | Banner VA (ajuda opcional) | `A decisão Ver e Agir foi registrada. As próximas etapas operacionais ainda não estão disponíveis neste aplicativo.` |
| **CON-C03** | Banner tratativa (legado 2.9) | `Em tratativa — Plano de Ação em versão futura` — **superseded** por AP-C02 / AP-SECTION (3.0) |
| **CON-C04** | Banner tratativa (ajuda opcional) | `A referência IMS foi registrada. O plano de ação será disponibilizado em versão futura.` |
| **CON-C05** | Nav item | `Paralisações` |
| **CON-C06** | Título listagem | `Paralisações` |
| **CON-C07** | Breadcrumb root | `Paralisações` |
| **CON-C08** | Subtítulo listagem (opc.) | `Paralisação Preventiva e acompanhamento na organização ativa` |
| **CON-C09** | CTA nova | `Nova Paralisação` |
| **CON-C10** | Redirect a11y (opc.) | `Redirecionando para Paralisações` |

**Proibido nos banners:** CTAs “Liberar”, “Abrir plano”, “Validar agora”, “Em breve — clique aqui”.

---

# Acessibilidade

| Item | Spec |
|---|---|
| Banners | `role="status"`; texto completo sem depender de ícone |
| Nav Paralisações | Label acessível igual ao visual |
| Redirect | Anunciar destino se houver delay |

---

# Critérios de aceite

1. Em `VER_E_AGIR`: banner CON-C01 visível; **sem** CTA operacional futuro.
2. Em `EM_TRATATIVA` (2.9): banner CON-C03; IMS RO; sem CTA. **(3.0)** ActionPlanSection substitui CON-C03 — ver `ACTION-PLAN-UI-SPEC.md`.
3. Nav principal usa **Paralisações** → `/stop-work` (web/mobile).
4. Detalhe/criação legados redirect para `stop-work`.
5. Hierarquia detalhe: Evidence → Decisão → MDHO → IMS → **Plano (3.0)** → Timeline → Composer.
6. Checklist Base44 respeitado — sem reintroduzir Liberar/Notificados/merge decide.
7. WEB e MOBILE implementáveis sem ambiguidade de copy/posição.

---

# Checklist implementação WEB / MOBILE

### Banners
- [ ] CON-BANNER-VA em `VER_E_AGIR`  
- [ ] CON-BANNER-TRATATIVA em `EM_TRATATIVA` (2.9; omitir se ActionPlanSection 3.0)  
- [ ] Sem CTAs fake  

### Navegação
- [ ] Label **Paralisações**  
- [ ] Rotas canônicas stop-work  
- [ ] Redirects occurrences → stop-work  

### Detalhe
- [ ] Ordem seções confirmada  
- [ ] Uma única tela operacional  

### Base44
- [ ] Não copiar filtros Liberada como fluxo principal  
- [ ] Não copiar Liberar/Encerrar/Notificados  

---

## Cross-check PO

| Tema | PO | Spec | Status |
|---|---|---|---|
| Banner VER_E_AGIR | PO-CON-2 | CON-BANNER-VA · CON-C01 | Alinhado |
| Banner EM_TRATATIVA | PO-CON-3 | CON-BANNER-TRATATIVA · CON-C03 | Alinhado 2.9; **superseded 3.0** por AP-SECTION |
| Detalhe canônico | PO-CON-5 | Navegação + hierarquia | Alinhado |
| Criação canônica | PO-CON-6 | `/stop-work/new` | Alinhado |
| Sem plano/liberação | PO-CON-1 | Escopo + proibidos | Alinhado |

---

## Hand-off

| De | Para |
|---|---|
| UIUX | WEB ∥ MOBILE — banners + nav + redirects |
| QA | S29-UX-02 / S29-UX-03 / S29-WEB-01 / S29-MOB-01 |

```text
UIUX — CONSOLIDATION-UI-SPEC.md
Sprint 2.9
Data: 2026-08-03
Status: PRONTO PARA IMPLEMENTAÇÃO
DoD: banners + nav Paralisações + hierarquia + checklist Base44
```
