# UX Convergence Decisions — Sprint 3.4

**Status:** APROVADO PELO PRODUCT OWNER (decisões fechadas — não reabrir)
**Sprint:** 3.4 — UX/UI Convergence + Hardening Final
**Etapa:** 2 — Consolidação das decisões do PO + handoff para UIUX
**Responsável pelo registro:** ARCHITECT

Este documento registra as decisões definitivas do Product Owner tomadas a partir do relatório
arquitetural da Etapa 1 da Sprint 3.4. Nenhuma implementação de código ocorreu nesta etapa.

---

## Princípio central de convergência (fórmula oficial)

```
BASE44            = referência de UX/estrutura
SAFESTOP ATUAL    = fonte da verdade funcional
IDENTIDADE SAFESTOP = fonte da verdade visual de marca

Resultado = ESTRUTURA/UX BASE44 + FUNCIONALIDADE SAFESTOP ATUAL + IDENTIDADE VISUAL SAFESTOP ATUAL
```

Hierarquia de evidência para qualquer proposta visual:

1. Screenshots — `reference/research/` (fonte de verdade **visual**)
2. Páginas `.jsx` do Base44 — `reference/base44/src/pages/` (campos, copy, sequência, fluxo)
3. Configuração/tokens do Base44 — `tailwind.config.js`, `index.css`, `components.json`
4. `docs/design-system.md` (documentação arquitetural; em caso de divergência com o produto atual, **registrar**, não assumir que a doc vence)

---

## PO-UX-1 — Navegação Web: Sidebar

**DECISÃO:** migrar a navegação Web da top bar horizontal atual para **Sidebar**.

- Seguir os princípios estruturais da documentação oficial, do Base44 e dos screenshots de `reference/research/`.
- **Não copiar literalmente** a sidebar do Base44 — adaptar à arquitetura real atual do SafeStop.
- Preservar: dark theme, grafite/preto, laranja industrial `#F97316`, identidade Enterprise, multi-organização, RBAC, organização ativa, módulos e funcionalidades atuais.
- UIUX propõe a composição; **não implementar** nesta etapa.

## PO-UX-2 — Navegação Mobile: Bottom Navigation + Stack

**DECISÃO:** implementar **Bottom Navigation** como arquitetura principal de navegação mobile, mantendo o Stack (Expo Router) para navegação interna e fluxos de detalhe. Não é substituição total do Stack.

- Limite recomendado: 4–5 destinos permanentes.
- Funções administrativas/secundárias podem ficar fora da Bottom Nav.
- Critérios de seleção dos itens: frequência de uso, criticidade operacional, contexto de campo, hierarquia funcional — a definir pela UIUX.

## PO-UX-3 — Nova Paralisação Preventiva: campos

**DECISÃO:** não copiar automaticamente campos do Base44 (Motivo, Fotos, Observações, evidências na criação).

- UIUX compara Base44 × SafeStop atual × workflow aprovado e propõe a melhor composição **visual/organizacional**.
- **UIUX não está autorizado a alterar domínio ou workflow.** Não adicionar/remover campos de negócio.
- Campos que pareçam melhorar a operação → registrar como **RECOMENDAÇÃO DE PRODUTO** (não implementar).
- Evitar duplicação semântica de informação (ex.: dois campos que capturam a mesma coisa).

## PO-UX-4 — Nomenclatura oficial

**DECISÃO:** o termo principal apresentado ao usuário é **"Paralisação Preventiva"** (abreviação permitida: **"PP"**, quando o contexto estiver claro). "Ocorrência" não deve permanecer como termo concorrente na interface para a mesma entidade operacional.

- **Não renomear** tabelas, schemas, enums, types, interfaces, funções, RPCs, migrations, nomes internos ou estruturas técnicas.
- Decisão é de **copy/UX**, não de código/domínio.
- Se "Ocorrência" tiver significado técnico mais amplo em algum ponto específico, documentar antes de propor substituição.
- UIUX mapeia inconsistências de copy (não corrige código).

## PO-UX-5 — Rotas legadas `/occurrences/*`

**DECISÃO:** candidatas à remoção nesta Sprint, mas a remoção **não é cega**.

- Antes de qualquer implementação, MASTER/WEB/MOBILE devem verificar: imports, links, redirects, bookmarks internos, testes, middleware, deep links, referências em notificações e relatórios, componentes desacoplados, navegação Mobile, documentação.
- UIUX apenas trata essas rotas como legadas — **não desenha experiência nova para elas**.
- Remoção ocorre somente na etapa de implementação, após análise técnica.

## PO-UX-6 — Logout Web

**DECISÃO:** incluir logout na nova arquitetura Web, integrado à Sidebar (direção preferencial: região inferior, associada à área de usuário/perfil).

- Não alterar comportamento de autenticação — apenas integrar a ação/fluxo já suportado.

## PO-UX-7 — `packages/ui` (Design System)

**DECISÃO:** iniciar consolidação do Design System nesta Sprint, de forma **controlada** — não é reconstrução completa de biblioteca de componentes.

- Escopo inicial: tokens (cores, spacing, radius, tipografia, superfícies, estados) + poucos primitivos realmente compartilháveis e usados repetidamente (candidatos: Button, Card, Badge, Input, EmptyState, Skeleton, estados de feedback).
- ARCHITECT/UIUX propõem escopo; **MASTER decide posteriormente a divisão técnica**.
- Não criar um segundo Design System paralelo.

---

## Reclassificação de prioridades (substitui a classificação preliminar do relatório da Etapa 1)

### P0 — Bloqueante para consolidação
- Sidebar Web
- Correção de `isPending` em "Confirmar ciência" (F1 do relatório da Etapa 1)
- Correção de isolamento/cache entre organizações (F2)
- Retry nos estados de erro identificados (F3)
- Problemas críticos de responsividade
- Estados UX críticos
- Inconsistências que possam induzir erro operacional

### P1 — Importante para a Sprint
- Bottom Navigation Mobile
- Consolidação inicial de tokens
- Padronização de componentes
- Nomenclatura "Paralisação Preventiva"
- Logout Web
- Harmonização visual das principais telas
- Responsividade geral

### P2 — Pode ser posterior
- Refinamentos puramente estéticos
- Microinterações
- Limpeza técnica sem impacto atual (ex.: remoção efetiva de componentes legados desacoplados)
- Melhorias cosméticas não bloqueantes
- Evoluções de produto encontradas durante a auditoria

**Importante:** P0 não significa autorização automática para implementação. A Sprint ainda está na etapa UIUX.

---

## Decisão definitiva — Online-only

SafeStop **não terá** funcionalidade operacional offline (fila offline, sync, IndexedDB operacional, mutations locais, sucesso simulado, offline-first). Ao perder conexão: comunicar, impedir ação dependente de servidor, preservar entrada do usuário quando razoável, oferecer retry, nunca simular persistência remota.

---

## Identidade visual a preservar

- Background preto/grafite, superfícies escuras
- Laranja industrial `#F97316` como identidade/ação (não dominante em toda a interface)
- Aparência Enterprise, linguagem industrial, visual sóbrio, pouco ornamentado, foco operacional
- Semântica de status independente da marca: verde = sucesso/liberação, vermelho = crítico/interdição, âmbar = atenção, laranja SafeStop = identidade/ação/navegação/seleção
- Não depender exclusivamente de cor para transmitir estado

---

## Proibições desta etapa (Architect + UIUX)

Não editar código, criar migration, alterar schema/RLS/RBAC, criar permission, alterar workflow, remover rota, criar Sidebar/Bottom Navigation de fato, modificar componentes, instalar dependências, alterar tokens no código, alterar copy no código, corrigir bugs, ou fazer commit. Mesmo os itens P0 aguardam aprovação do PO antes de implementação.

---

## Fluxo da Sprint a partir desta etapa

```
ARCHITECT → UIUX → PRODUCT OWNER (aprovação visual/UX) → MASTER → WEB/MOBILE/outros → BUILD → SECURITY → QA
```

MASTER só recebe autorização para distribuir implementação **depois** da aprovação da proposta UIUX pelo Product Owner.
