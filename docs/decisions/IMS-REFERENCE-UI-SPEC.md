# Spec UI/UX — Referência IMS (Sprint 2.8)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** 2.8 — Referência IMS (até `EM_TRATATIVA`)  
**Agente:** UIUX  
**Data:** 2026-08-02  
**Entregável:** `docs/decisions/IMS-REFERENCE-UI-SPEC.md`

**PO (fonte oficial):** [`IMS-REFERENCE-DECISIONS.md`](./IMS-REFERENCE-DECISIONS.md) — PO-IMS-1…PO-IMS-16; Gate G0.

**Referências:**

| Fonte | Uso |
|---|---|
| `docs/decisions/IMS-REFERENCE-DECISIONS.md` | RPCs, formato BAA, guards, timeline |
| `docs/decisions/MDHO-UI-SPEC.md` | Ordem detalhe IO; substituir hint estático |
| `docs/decisions/HSE-APPROVAL-UI-SPEC.md` | Pós-approve hint IMS → seção ativa |
| `docs/design-system.md` | Etapa Registro IMS no fluxo |
| `reference/base44/.../Interdiction.jsonc` | `ims_code` — UX only |

Base44 = composição. PO prevalece. **Sem código apps/packages/supabase nesta entrega.**

---

## Objetivo

Substituir o hint estático de `MdhoSummary` por **`ImsReferenceSection`** completa:

1. **IMS-FORM** — registrar em `AGUARDANDO_REGISTRO_IMS`
2. **IMS-CARD** — read-only pós-registro
3. **IMS-EDIT** — corrigir código + motivo
4. **IMS-SEARCH** — filtro listagem
5. Estados loading / forbidden / offline / validation
6. Copy **IMS-C01…C25**

SafeStop **não** cria, sincroniza nem valida existência no IMS externo.

---

## Terminologia

| Termo UI | Significado |
|---|---|
| **Referência IMS** | Título da seção — código externo digitado manualmente |
| **Código IMS** | Valor `ims_reference_code` (ex. `BAA-26-0001`) |
| **Código SafeStop** | `public_code` (`SS-26-…`) — **nunca** confundir na UI |
| **Registrar referência IMS** | CTA / RPC `register_ims_reference` |
| **Corrigir referência** | CTA / RPC `update_ims_reference` + motivo |

**Proibido na copy:** “Criar IMS”, “Sincronizar”, “Validar no IMS”, “Gerar IMS”, “Buscar IMS”.

---

## Princípios invioláveis

| Regra | Aplicação |
|---|---|
| Digitação manual | Input texto + validação formato local/RPC |
| Sem integração | Nenhum botão de sync/API |
| IO-only | Seção **ausente** em Ver e Agir (PO-IMS-4) |
| Confirm register | Dialog antes do register |
| Offline | Bloquear mutations (PO-IMS-14) |
| Sem plano de ação | Pós-register: status Em Tratativa — **sem** CTA plano (PO-IMS-15) |
| Feature | `features/ims-reference/` |

---

## Ordem no detalhe IO

```text
1. Header + badges
2. Banner IO
3. Info / condição
4. Evidências
5. Decisão VA/IO
6. InterdicaoSummary
7. MdhoSummary (sem hint IMS estático quando ImsReferenceSection ativo)
8. ImsReferenceSection          ← este spec
9. Timeline
10. Composer
```

**Integração MdhoSummary:** remover MDHO-C20 / HSE-C20 como único feedback; a seção IMS assume o papel operacional.

---

## Guards UI

```text
canRegisterIms =
  can("ims_reference.register") && !isPlatformAdmin &&
  decisionType === "INTERDICAO_OFICIAL" &&
  status === "AGUARDANDO_REGISTRO_IMS" &&
  !imsReferenceCode

canUpdateIms =
  can("ims_reference.update") && !isPlatformAdmin &&
  !!imsReferenceCode &&
  status ∉ { ENCERRADA, LIBERADA, CANCELADA }

canViewIms = can("occurrence.read")
```

| Papel | Register | Update | Ver |
|---|---|---|---|
| Supervisor / Liderança HSE | Sim | Sim | Sim |
| Fiscal / Campo / Gestor | Não | Não | Sim (read) |
| Platform Admin | Não | Não | Sim (read) |
| Ramo VA | Seção ausente | — | — |

---

## Hierarquia visual

| Estado | Tratamento |
|---|---|
| Aguardando registro | Banner/info neutro-azul + form |
| Código registrado | Card com código monospace + badge Em Tratativa |
| Correção | Dialog — não editar inline destrutivo sem motivo |

Distinto de: vermelho IO · âmbar Aprovação HSE · azul form MDHO — IMS usa **neutro + destaque monospace** no código.

---

# Componentes

| Componente | Papel |
|---|---|
| `ImsReferenceSection` | Container por status |
| `ImsRegisterForm` | IMS-FORM |
| `ImsReferenceCard` | IMS-CARD |
| `ImsEditDialog` | IMS-EDIT |
| Filtro listagem | IMS-SEARCH |

---

# IMS-FORM — Registrar (`AGUARDANDO_REGISTRO_IMS`)

### Wireframe mobile

```text
┌──────────────────────────────────────┐
│ REFERÊNCIA IMS                       │
│                                      │
│ Informe o código gerado no sistema   │
│ IMS da Hydro. O SafeStop não         │
│ consulta o IMS.                      │
│                                      │
│ Código IMS *                         │
│ ┌──────────────────────────────────┐ │
│ │ BAA-26-0001                      │ │  monospace
│ └──────────────────────────────────┘ │
│ Formato: BAA-XX-0000                 │
│                                      │
│ [padding footer]                     │
├──────────────────────────────────────┤
│ [   Registrar referência IMS     ]   │  sticky primary
└──────────────────────────────────────┘
```

### Wireframe web

```text
┌─ Referência IMS ─────────────────────────────────────┐
│ Helper + input (max-w-md) + [ Registrar referência ] │
│ Confirm dialog antes do submit                       │
└──────────────────────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| Label | `Código IMS` |
| Placeholder | `BAA-26-0001` |
| Helper | IMS-C04 |
| Regex client | `^BAA-\d{2}-\d{4,}$` (normalizar trim/uppercase opcional — preferir **trim + validar case-sensitive conforme RPC**) |
| CTA | `Registrar referência IMS` — primary full-width mobile sticky |
| Visível | Só `canRegisterIms` |
| RPC | `register_ims_reference({ occurrence_id, ims_reference_code })` |
| Sem justificativa | No register (PO-IMS-5) |

### Confirm dialog (obrigatório)

```text
Registrar referência IMS?

Código: BAA-26-0001

A ocorrência passará para Em Tratativa.
O SafeStop não valida este código no sistema IMS.

[ Cancelar ]     [ Registrar referência IMS ]
```

### Pós-sucesso

- Invalidar detail / timeline / lists  
- UI → **IMS-CARD**  
- Toast opcional: IMS-C10  
- Status badge → Em Tratativa  

### Idempotência (PO-IMS-12)

Retry após success: tratar como sucesso → card.  
`ALREADY_REGISTERED` com código diferente: conflict + refetch.

---

# IMS-CARD — Read-only pós-registro

```text
┌──────────────────────────────────────┐
│ REFERÊNCIA IMS                       │
│                                      │
│ Código                               │
│ BAA-26-0001                          │  monospace destaque
│                                      │
│ Registrado por  Nome                 │
│ Em              dd/mm/aaaa HH:mm     │
│ Atualizado por  Nome (se houver)     │
│ Em              …                    │
│                                      │
│ [ Corrigir referência ]              │  só canUpdateIms
└──────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| Modo | Read-only |
| CTA corrigir | Outline/secondary — abre IMS-EDIT |
| Sem CTA | Plano de ação / liberação / “abrir IMS” |
| Terminais | Sem botão corrigir se ENCERRADA/LIBERADA/CANCELADA |

---

# IMS-EDIT — Dialog correção (PO-IMS-5)

```text
┌──────────────────────────────────────┐
│ Corrigir referência IMS              │
│                                      │
│ Código atual: BAA-26-0001            │
│                                      │
│ Novo código *                        │
│ ┌──────────────────────────────────┐ │
│ │ BAA-26-0002                      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Motivo da correção *                 │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ n/4000  (mín. 10)                    │
│                                      │
│ [ Cancelar ]  [ Salvar correção ]    │
└──────────────────────────────────────┘
```

| Item | Spec |
|---|---|
| RPC | `update_ims_reference({ occurrence_id, ims_reference_code, update_reason })` |
| Novo ≠ atual | Validação client |
| Status ocorrência | **Não** muda |
| Timeline | “Referência IMS alterada” |
| Offline | Disabled + toast |

---

# IMS-SEARCH — Filtro listagem (PO-IMS-10)

| Item | Spec |
|---|---|
| Label | `Código IMS` |
| Placeholder | `BAA-26-0001` ou `Buscar por código IMS` |
| Comportamento | Contains `ilike` — org ativa apenas |
| Resultado | Pode haver **múltiplas** ocorrências (PO-IMS-7) |
| Plataformas | Web listagem PP/ocorrências + mobile search/filters |
| Vazio | `Nenhuma ocorrência com este código IMS.` |

Não confundir com busca por `public_code` SS-*.

---

# IMS-STATES

| Estado | UI |
|---|---|
| **Loading** | Skeleton seção / CTA busy `Registrando…` / `Salvando…` |
| **Forbidden** | Seção form/edit **ausente**; card read-only se `canViewIms` e código existe |
| **Offline** | CTAs disabled; toast `Sem conexão — ação não enviada` |
| **Validation formato** | Inline: IMS-C12 |
| **VALIDATION_ERROR motivo** | Inline no edit: mín. 10 / máx. 4000 |
| **STATUS_MISMATCH** | Banner conflict + `Atualizar` |
| **ALREADY_REGISTERED** | Refetch → card |
| **VA branch** | Seção **não renderiza** |

Anti-acidente: confirm no register; disable durante mutation; sem optimistic.

---

# Timeline (consumo UI)

| Evento | Título |
|---|---|
| Register | `Referência IMS registrada` |
| Update | `Referência IMS alterada` |

Kind: `STATUS_CHANGED` / history metadata — sem kind novo.

---

# Copy PT — IMS-C01…C25

| ID | Contexto | Texto |
|---|---|---|
| **IMS-C01** | Seção | `Referência IMS` |
| **IMS-C02** | Label uppercase | `REFERÊNCIA IMS` |
| **IMS-C03** | Label campo | `Código IMS` |
| **IMS-C04** | Helper | `Informe o código gerado no sistema IMS da Hydro. O SafeStop não consulta o IMS.` |
| **IMS-C05** | Placeholder | `BAA-26-0001` |
| **IMS-C06** | Formato hint | `Formato: BAA-XX-0000` |
| **IMS-C07** | CTA register | `Registrar referência IMS` |
| **IMS-C08** | Confirm título | `Registrar referência IMS?` |
| **IMS-C09** | Confirm corpo | `A ocorrência passará para Em Tratativa. O SafeStop não valida este código no sistema IMS.` |
| **IMS-C10** | Sucesso register | `Código registrado — ocorrência em tratativa` |
| **IMS-C11** | CTA corrigir | `Corrigir referência` |
| **IMS-C12** | Erro formato | `Use o formato BAA-XX-0000 (ex.: BAA-26-0001).` |
| **IMS-C13** | Dialog edit título | `Corrigir referência IMS` |
| **IMS-C14** | Label novo código | `Novo código` |
| **IMS-C15** | Motivo label | `Motivo da correção` |
| **IMS-C16** | Motivo helper | `Mínimo 10 caracteres` |
| **IMS-C17** | CTA salvar edit | `Salvar correção` |
| **IMS-C18** | Cancelar | `Cancelar` |
| **IMS-C19** | Erro motivo curto | `Informe um motivo com pelo menos 10 caracteres.` |
| **IMS-C20** | Erro motivo longo | `O motivo deve ter no máximo 4000 caracteres.` |
| **IMS-C21** | Offline | `Sem conexão — ação não enviada` |
| **IMS-C22** | Conflict | `Esta ocorrência foi atualizada. Atualize para continuar.` |
| **IMS-C23** | Conflict CTA | `Atualizar` |
| **IMS-C24** | Search label | `Código IMS` |
| **IMS-C25** | Search empty | `Nenhuma ocorrência com este código IMS.` |

### Complementar

| ID | Texto |
|---|---|
| IMS-C26 | Meta: `Registrado por` / `Atualizado por` / `Em` |
| IMS-C27 | Loading: `Registrando…` / `Salvando…` |
| IMS-C28 | Forbidden a11y: `Você não tem permissão para registrar a referência IMS.` |
| IMS-C29 | Already: `Esta ocorrência já possui referência IMS registrada.` |
| IMS-C30 | Timeline: `Referência IMS registrada` / `Referência IMS alterada` |
| IMS-C31 | Código atual (edit): `Código atual` |

**Proibido:** Criar/Sincronizar/Validar/Gerar/Buscar IMS.

---

# Acessibilidade

| Requisito | Spec |
|---|---|
| Seção | Heading `Referência IMS` |
| Input | Label + helper `aria-describedby` |
| Código | Anunciar valor; monospace visual ok |
| Dialogs | Foco trap; ESC = Cancelar |
| Sticky CTA | Safe Area; não cobrir teclado (KAV) |
| Erros | `aria-invalid` + mensagem |
| Forbidden | Controles ausentes — não disabled “Criar IMS” |

---

# Adaptação Base44 → SafeStop

| Base44 `ims_code` | SafeStop 2.8 |
|---|---|
| Campo texto livre implícito | Form + regex + RPC |
| Sem confirm | Dialog obrigatório no register |
| Sem correção auditável | Update + motivo + timeline |
| Sem busca | IMS-SEARCH contains |
| Implica sync | Copy explícita: não consulta IMS |

---

# Critérios de aceite

1. Ordem: … MdhoSummary → **ImsReferenceSection** → Timeline → Composer.
2. Hint estático MdhoSummary removido quando seção IMS ativa.
3. FORM só em `AGUARDANDO_REGISTRO_IMS` + `canRegisterIms` + ramo IO.
4. Confirm dialog antes do register.
5. Mobile: input + sticky `Registrar referência IMS`.
6. CARD read-only pós-registro; EDIT com motivo 10–4000.
7. SEARCH na listagem (contains).
8. Copy IMS-C01…C25; sem Criar/Sincronizar/Validar.
9. Estados: loading, forbidden, offline, validation.
10. Seção ausente em Ver e Agir.
11. Sem CTA plano de ação / integração externa.
12. Timeline títulos register/alterada.

---

# Checklist WEB / MOBILE

### Detalhe
- [ ] ImsReferenceSection  
- [ ] FORM + confirm + sticky mobile  
- [ ] CARD + Corrigir  
- [ ] EDIT dialog + motivo  
- [ ] Substituir hint MdhoSummary  

### Listagem
- [ ] Filtro Código IMS  
- [ ] Empty search  

### Estados
- [ ] Loading / forbidden / offline / validation / conflict  
- [ ] VA: seção ausente  

### Fora de escopo
- [ ] Sync/API IMS  
- [ ] Plano de ação  
- [ ] Tabela auxiliar  

---

## Cross-check PO → UI

Espelho de [`IMS-REFERENCE-DECISIONS.md`](./IMS-REFERENCE-DECISIONS.md) § Cross-check. Destaques:

| Tema | PO | UI-SPEC | Status |
|---|---|---|---|
| Formato BAA | PO-IMS-1 | IMS-C12 | Alinhado |
| Form register → `EM_TRATATIVA` | PO-IMS-2 | IMS-FORM | Alinhado |
| Card + corrigir | PO-IMS-2/5 | IMS-CARD · IMS-EDIT | Alinhado |
| Sem VA | PO-IMS-4 | Guards | Alinhado |
| Copy: não consulta/valida IMS | PO-IMS-6 | IMS-C04/C09 | Alinhado |
| Filtro listagem | PO-IMS-10 | IMS-SEARCH | Alinhado |
| Offline / Platform Admin | PO-IMS-13/14 | Guards · IMS-STATES | Alinhado |
| Sem plano / sem integração | PO-IMS-15 · inviolável | Princípios + fora de escopo | Alinhado |
| Substituir hint MdhoSummary | PO-IMS-6 | Ordem detalhe | Alinhado |

**Proibido documentar ou sugerir:** API/sync/validação de existência no IMS externo.

---

## Hand-off

| De | Para |
|---|---|
| UIUX (este doc) | MASTER → WEB ∥ MOBILE |
| Implementação | `features/ims-reference/` |
| QA | IMS-01…IMS-16 |

```text
UIUX — IMS-REFERENCE-UI-SPEC.md
Sprint 2.8
Data: 2026-08-02
Status: PRONTO PARA REVISÃO MASTER → WEB ∥ MOBILE
DoD: spec completa; IMS-C01…C25; sem código apps/packages/supabase
```
