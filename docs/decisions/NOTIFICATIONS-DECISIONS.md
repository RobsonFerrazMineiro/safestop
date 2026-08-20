# Decisões — Notificações, Responsabilidade Operacional e Ciência (Sprint 3.1)

**Status:** `APROVADO`
**Sprint:** 3.1 — Notificações (sub-entrega incremental do domínio "Comunicação" do roadmap — Sprint 3)
**Data:** 2026-08-17
**Etapa:** 0 — Produto (agente MASTER / ARCHITECT / DOCS)
**Gate:** **G0 desbloqueado** — libera DATABASE (schema + RPCs) e UIUX (spec)

**Arquitetura base:** Relatório arquitetural Sprint 3.1 (2026-08-17, ARCHITECT) — validado contra o repositório real.

**Fundação:** Sprints 2.0–2.9 (fluxo operacional PP → IMS) + 3.0 (Plano de Ação, `action_plans`/`action_items`/`action_item_attachments`).

**Modelo de dados base:** `docs/database.md` §17.1–17.3 (`notification_events`, `notifications`) — **não** criar `notification_deliveries`/`device_tokens` nesta sprint (Push/e-mail fora de escopo).

**Spec UI:** [`NOTIFICATIONS-UI-SPEC.md`](./NOTIFICATIONS-UI-SPEC.md) — Etapa UIUX concluída (2026-08-17)

**Relação roadmap:** `docs/roadmap.md` lista "Sprint 3 — Comunicação" com entregas: Notification Events, Push, Notificações internas, Ciência, Histórico. A **sub-sprint 3.1** entrega Notification Events + Notificações internas (`IN_APP`) + Ciência + Histórico. **Push permanece fora** desta sub-sprint (decisão fechada na arquitetura, mantida).

**Contrato de eventos base:** `docs/decisions/CONSOLIDATION-DECISIONS.md` **PO-CON-21** — esta sprint implementa e fecha esse contrato.

---

## Objetivo

Registrar as decisões de produto **PO-NOTIF-1 a PO-NOTIF-8** (ambiguidades A–H da arquitetura) da Sprint 3.1, incorporar os três desenhos técnicos que essas decisões exigiram (Gerenciadora, Encarregado da Atividade, Ação Atrasada), e registrar uma lacuna técnica adicional encontrada durante a validação (nomes de colegas de organização).

Fonte primária:

- Relatório arquitetural Sprint 3.1 (2026-08-17);
- Levantamento factual RBAC/Responsabilidade Operacional (2026-08-17, mesma sessão);
- `docs/database.md` §5–9, §17;
- `docs/notifications.md`;
- `docs/decisions/CONSOLIDATION-DECISIONS.md` (PO-CON-21);
- `docs/decisions/RBAC-MATRIX-APPROVED.md`;
- `supabase/seed.sql`, `supabase/migrations/20260713193559_create_foundation_schema.sql`, `20260715220000_create_occurrences_foundation.sql`, `20260809180000_create_action_plan_foundation.sql`.

---

## Correções factuais ao relatório arquitetural

Identificadas na validação contra o repositório; não alteram a arquitetura, apenas os números citados:

| Item | Relatório dizia | Real (seed/migrations) |
|---|---|---|
| Papéis globais | "9 papéis" | **8** — HSE de Campo, Liderança da Contratada, Fiscal do Contrato, Supervisor HSE, Liderança HSE, Gestor, Administrador da Empresa, Administrador da Plataforma |
| `notification.confirm_awareness` | "já atribuída a todos os papéis" | Atribuída a **7 dos 8** — falta em **Administrador da Empresa** (Administrador da Plataforma tem por wildcard) |

**DATABASE deve corrigir** a lacuna de `notification.confirm_awareness` para "Administrador da Empresa" no mesmo seed patch que atribuirá `notification.read` a todos os papéis (já previsto no handoff original) — correção de seed, não decisão de negócio nova.

---

## Lacuna técnica adicional encontrada (DIV-06)

**Achado:** `profiles_select` (RLS, `docs/database.md` §5.2 / migration de fundação) restringe leitura de `profiles` ao próprio usuário ou `is_platform_admin()`. Isso significa que **qualquer join client-side com `profiles(full_name)` para exibir nome de colegas da mesma organização retorna `null`** — bug já documentado como lacuna conhecida desde a Sprint 1.5 (comentário na migration de fundação) e **nunca resolvido**.

**Onde isso já afeta código existente:** `apps/web/src/features/action-plan/services/get-organization-members.ts` e equivalente mobile (seletor de "responsável" do Plano de Ação, Sprint 3.0) fazem exatamente esse join quebrado.

**Por que importa agora:** a Sprint 3.1 introduz **três novos pontos** que precisam exibir nome de colegas de organização — seletor de Encarregado (PO-NOTIF-3), tela de gestão de `organization_contacts` (Web), e exibição de "quem está envolvido" na ocorrência (Mobile, via `occurrence_participants`). Sem correção, todos exibirão nomes vazios.

**Decisão:** corrigir agora, como pré-requisito técnico (não é nova regra de negócio, é o funcionamento correto de algo já assumido como funcionando). Criar função `SECURITY DEFINER`:

```sql
create function public.get_organization_member_profiles(target_organization_id uuid)
returns table (
  organization_member_id uuid,
  profile_id uuid,
  full_name text,
  job_title text
)
language sql
stable
security definer
set search_path = ''
as $$
  select om.id, om.profile_id, p.full_name, p.job_title
  from public.organization_members om
  join public.profiles p on p.id = om.profile_id
  where om.organization_id = target_organization_id
    and om.is_active = true
    and (
      target_organization_id in (select public.current_organization_ids())
      or public.is_platform_admin()
    );
$$;
```

Substitui o join direto a `profiles` em `get-organization-members.ts` (Web e Mobile, Plano de Ação) e serve de base para os novos seletores desta sprint. Não expõe `email`/`phone` (minimização de dados, mesma régua já aplicada a `profiles_select`).

**Agente responsável:** DATABASE (função) + BACKEND (atualizar os dois services existentes do Plano de Ação para usar a nova função).

---

## Decisão arquitetural central (não redesenhar)

| Item | Decisão |
|---|---|
| **Tabelas novas** | `notification_events`, `notifications` — exatamente `docs/database.md` §17.2–17.3 |
| **Fora de escopo** | `notification_deliveries`, `device_tokens`, Push, e-mail, Realtime, `pg_cron` genérico |
| **RBAC** | Inalterado — Responsabilidade Operacional é conceito paralelo, não nova permissão de ação |
| **Responsabilidade Operacional** | `organization_contacts` (configuração viva) + `occurrence_participants` (snapshot imutável por ocorrência) |
| **Resolução** | Função única `SECURITY DEFINER` `resolve_occurrence_notification_recipients`, chamada por dentro das RPCs de domínio existentes, na mesma transação |
| **Atomicidade** | Notificação nasce na mesma transação do evento de negócio — nunca trigger assíncrono, nunca job externo (exceto o novo cron de `ACTION_DUE`, ver PO-NOTIF-6) |
| **Cache/Realtime** | Reaproveita `@safestop/query-keys` (`TENANT_QUERY_KEY_PREFIX`/`clearTenantCache`); sem Realtime |
| **Mutações client** | Nenhuma — `notifications`/`notification_events` só são escritas por função `SECURITY DEFINER`; leitura/ciência via RPC dedicada |

---

## Tabela de decisões PO-NOTIF-1 a PO-NOTIF-8

| # | Tema | Decisão do PO |
|---|---|---|
| PO-NOTIF-1 | Permissão de gestão de `organization_contacts` | **Manter `organization.manage`** — sem nova permissão |
| PO-NOTIF-2 | Gerenciadora | **Modelar estruturalmente** como terceira organização real do contrato — ver desenho dedicado abaixo |
| PO-NOTIF-3 | Encarregado da atividade | **Novo `participant_type = ACTIVITY_FOREMAN`**, informado manualmente na criação da PP — ver desenho dedicado abaixo |
| PO-NOTIF-4 | Precedência de contatos duplicados | **Notificar todos os ativos** do mesmo `contact_type`+escopo — sem exclusão por prioridade |
| PO-NOTIF-5 | Ciência obrigatória | `OCCURRENCE_CREATED`, `VER_AND_ACT_REQUIRED`, `INTERDICTION_CONFIRMED` — somente esses três |
| PO-NOTIF-6 | Lembrete de ação atrasada (`ACTION_DUE`) | **Incluir nesta sprint** (adendo formal de escopo) — ver desenho dedicado abaixo |
| PO-NOTIF-7 | Destinatários de `ACTION_PLAN_COMPLETED` | **Fiscal do Contrato + Supervisor HSE + autor original da PP** (`occurrence.created_by`) |
| PO-NOTIF-8 | Retenção de notificações (`expires_at`) | **Não popular nesta versão** — retenção indefinida |

---

## PO-NOTIF-2 — Gerenciadora (desenho completo)

**Princípio do PO:** representar a Gerenciadora como **terceira parte real** ligada à operação/contrato, com modelagem mínima consistente, preservando isolamento multi-tenant e **sem confundi-la com a contratada executante**. Não usar `CUSTOM` como solução definitiva.

### Schema

```sql
-- organizations: novo tipo de organização
alter table public.organizations
  drop constraint organizations_organization_type_check;
alter table public.organizations
  add constraint organizations_organization_type_check
  check (organization_type in ('CLIENT', 'CONTRACTOR', 'PLATFORM', 'MANAGING_COMPANY'));

-- contracts: terceira parte opcional, distinta de cliente e contratada
alter table public.contracts
  add column managing_company_organization_id uuid
    references public.organizations (id) on delete restrict;

alter table public.contracts
  add constraint contracts_managing_company_distinct
  check (
    managing_company_organization_id is null
    or (
      managing_company_organization_id <> client_organization_id
      and managing_company_organization_id <> contractor_organization_id
    )
  );

create index contracts_managing_company_organization_id_idx
  on public.contracts (managing_company_organization_id);
```

### RLS — `contracts_select` (patch, não recriar do zero)

Estender a policy existente para incluir a Gerenciadora entre quem pode ver o contrato:

```sql
using (
  client_organization_id in (select public.current_organization_ids())
  or contractor_organization_id in (select public.current_organization_ids())
  or managing_company_organization_id in (select public.current_organization_ids())
  or public.is_platform_admin()
)
```

### Trigger `validate_organization_contact_contract_org` (patch)

Passa a aceitar `organization_id = managing_company_organization_id` como válido, além de cliente/contratada:

```sql
if new.organization_id <> v_client_organization_id
   and new.organization_id <> v_contractor_organization_id
   and new.organization_id <> coalesce(v_managing_company_organization_id, '00000000-0000-0000-0000-000000000000'::uuid) then
  raise exception ...
end if;
```

### `organization_contacts.contact_type` — novo valor

```sql
alter table public.organization_contacts drop constraint organization_contacts_contact_type_check;
alter table public.organization_contacts add constraint organization_contacts_contact_type_check
  check (contact_type in (
    'CONTRACTOR_LEADERSHIP', 'CONTRACT_INSPECTOR', 'HSE_SUPERVISOR', 'HSE_LEADERSHIP',
    'AREA_MANAGER', 'CONTRACT_MANAGER', 'COMPANY_RESPONSIBLE',
    'MANAGING_COMPANY_SUPERVISOR', 'CUSTOM'
  ));
```

`MANAGING_COMPANY_SUPERVISOR` só é semanticamente válido quando `organization_contacts.organization_id = contracts.managing_company_organization_id` do `contract_id` informado — validação adicional na função de resolução (não em constraint de banco, para não acoplar duas tabelas em CHECK).

### Resolução

`resolve_occurrence_notification_recipients` ganha um branch: quando `occurrence.contract_id` está preenchido e o contrato tem `managing_company_organization_id`, resolver `organization_contacts` com `organization_id = managing_company_organization_id`, `contract_id = occurrence.contract_id`, `contact_type = 'MANAGING_COMPANY_SUPERVISOR'`.

### Impacto

Esta é uma alteração estrutural em duas tabelas já existentes (`organizations`, `contracts`) — maior que um "paliativo", mas mínima dentro do que o PO pediu: 1 valor de enum + 1 coluna opcional + 1 índice + 1 check + patch em 1 policy + patch em 1 trigger + 1 valor de enum em `organization_contacts`. Nenhuma tabela nova.

**Fora desta sprint:** UI de cadastro de organizações do tipo `MANAGING_COMPANY` (tela de administração de organizações não existe hoje para nenhum tipo — cadastro continua via seed/backoffice manual, mesmo padrão de `CLIENT`/`CONTRACTOR` hoje).

---

## PO-NOTIF-3 — Encarregado da Atividade / `ACTIVITY_FOREMAN` (desenho completo)

**Princípio do PO:** informar manualmente na criação da PP, gravar em `occurrence_participants` com `participant_type` próprio (não reutilizar `OBSERVER`), sem criar entidade de atividade nem coluna em `occurrences`.

### Schema

```sql
alter table public.occurrence_participants drop constraint occurrence_participants_participant_type_check;
alter table public.occurrence_participants add constraint occurrence_participants_participant_type_check
  check (participant_type in (
    'REPORTER', 'EVALUATOR', 'CONTRACTOR_LEADER', 'CONTRACT_INSPECTOR',
    'HSE_SUPERVISOR', 'HSE_APPROVER', 'AREA_MANAGER', 'ACTION_OWNER',
    'RELEASE_APPROVER', 'OBSERVER', 'ACTIVITY_FOREMAN'
  ));
```

### RPC `create_occurrence` (patch)

Novo campo **opcional** no payload: `activity_foreman_member_id` (uuid). Quando informado:

1. validar que referencia `organization_members` com `organization_id = v_contractor_organization_id` (a empresa executante, não a organização cliente) e `is_active = true`;
2. se inválido → `VALIDATION_ERROR` (mesma convenção das validações existentes na função);
3. se válido, após o `insert` em `occurrences`, inserir em `occurrence_participants`:
   `(occurrence_id, organization_id = v_contractor_organization_id, organization_member_id = activity_foreman_member_id, participant_type = 'ACTIVITY_FOREMAN', is_primary = true, created_by = v_user_id)`.

Campo **opcional** — PP continua podendo ser registrada sem Encarregado definido (não bloquear registro rápido em campo, princípio Mobile First / comunicação antes da burocracia). Sem `GRANT INSERT` novo para `authenticated` em `occurrence_participants` — a escrita ocorre dentro da função `SECURITY DEFINER` (mantém DIV-02 do relatório original).

### Web/Mobile

Novo campo opcional "Encarregado da atividade" no formulário de PP, com seletor de membros da **contratada selecionada** (`contractor_organization_id`), usando `get_organization_member_profiles` (ver DIV-06) em vez do join direto a `profiles`.

---

## PO-NOTIF-6 — Ação Atrasada / `ACTION_DUE` (desenho completo)

**Decisão do PO:** incluir nesta sprint como adendo formal de escopo.

**Nota de transparência:** este é o **primeiro uso de `pg_cron` no projeto** — nenhuma migration anterior usa agendamento. É infraestrutura nova, não apenas uma RPC — DATABASE deve confirmar que a extensão está disponível no ambiente Supabase (gerenciada, normalmente já habilitável via `create extension if not exists pg_cron`) antes de aplicar.

### Evento

`ACTION_DUE` — gatilho **não é uma ação de usuário**, é um job agendado.

### Função

```sql
create function public.dispatch_action_due_notifications()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
begin
  for v_item in
    select ai.id as action_item_id, ai.organization_id, ai.responsible_member_id, ai.due_at
    from public.action_items ai
    where ai.due_at < now()
      and ai.status not in ('COMPLETED', 'REJECTED', 'CANCELLED')
      and not exists (
        select 1
        from public.notification_events ne
        where ne.event_type = 'ACTION_DUE'
          and ne.payload ->> 'action_item_id' = ai.id::text
          and ne.created_at >= date_trunc('day', now())
      )
  loop
    -- cria notification_event + notifications para v_item.responsible_member_id
    -- (mesma função de geração usada pelas RPCs de domínio, chamada aqui diretamente)
  end loop;
end;
$$;

select cron.schedule(
  'action-items-due-daily',
  '0 10 * * *', -- 10:00 UTC (07:00 BRT) — horário de referência, ajustável
  $$select public.dispatch_action_due_notifications();$$
);
```

**Idempotência:** no máximo 1 `notification_event` do tipo `ACTION_DUE` por `action_item_id` por dia corrido (checagem `created_at >= date_trunc('day', now())` acima) — evita spam em execuções repetidas ou reprocessamento manual.

**Destinatário:** `action_items.responsible_member_id` (quem está atrasado) — consistente com o exemplo já documentado em `docs/notifications.md` §11 ("Ação atrasada").

**Ciência:** não exigida (fora da lista fechada em PO-NOTIF-5).

---

## PO-NOTIF-7 — `ACTION_PLAN_COMPLETED` (atualização da Matriz de Eventos)

Substitui a linha correspondente do relatório original:

| Evento | Destinatário (final) | Como resolve |
|---|---|---|
| `ACTION_PLAN_COMPLETED` | Fiscal do Contrato + Supervisor HSE + autor original da PP (`occurrence.created_by`) | `contract_id` (Fiscal) + `unit_id`/`area_id` (Supervisor HSE) + direto (`created_by`) |

---

## Catálogo de eventos — versão final

Substitui integralmente a "Matriz de Eventos" do relatório arquitetural, incorporando PO-NOTIF-6 e PO-NOTIF-7:

`OCCURRENCE_CREATED`, `DECISION_REQUIRED`, `VER_AND_ACT_REQUIRED`, `INTERDICTION_CONFIRMED`, `MDHO_APPROVAL_REQUIRED`, `MDHO_RETURNED`, `MDHO_APPROVED`, `IMS_REFERENCE_REGISTERED`, `ACTION_PLAN_CREATED`, `ACTION_ITEM_ASSIGNED`, `ACTION_ITEM_SUBMITTED`, `ACTION_ITEM_VALIDATED`, `ACTION_PLAN_COMPLETED`, **`ACTION_DUE`** (novo, PO-NOTIF-6).

Todas as demais colunas (origem RPC, resolução, ciência, idempotência, deep link) permanecem exatamente como no relatório arquitetural original, exceto `ACTION_PLAN_COMPLETED` (destinatário atualizado acima) e a adição de `ACTION_DUE`:

| Evento | Existe hoje? | Origem | Destinatário | Ciência? | Idempotency key |
|---|---|---|---|---|---|
| `ACTION_DUE` | Novo | `dispatch_action_due_notifications` (cron diário) | `responsible_member_id` | Não | `(action_item_id, event_type, dia corrente)` |

---

## Catálogo de Responsabilidades — versão final

Adiciona as duas linhas resultantes de PO-NOTIF-2 e PO-NOTIF-3 ao catálogo do relatório original:

| Categoria | Fonte de resolução | Contexto usado |
|---|---|---|
| Supervisão da Gerenciadora | `organization_contacts.contact_type = MANAGING_COMPANY_SUPERVISOR` | `organization_id = contracts.managing_company_organization_id`, `contract_id = occurrence.contract_id` |
| Encarregado da Atividade | `occurrence_participants.participant_type = ACTIVITY_FOREMAN` | Direto, informado na criação da PP (snapshot, não configuração) |

---

## RLS e Segurança — itens adicionais desta sprint

Complementa a Matriz de Segurança do relatório arquitetural original (mantida integralmente):

| Item novo | Mitigação | Camada |
|---|---|---|
| Vazamento de nome/perfil de colegas via join client-side quebrado (DIV-06) | `get_organization_member_profiles` `SECURITY DEFINER`, escopado a `current_organization_ids()`, sem `email`/`phone` | RPC |
| Gerenciadora enxergando dados fora do seu papel no contrato | `contracts_select` só libera SELECT (não `contract.manage`); Gerenciadora nunca vira `client_organization_id`/`contractor_organization_id` (CHECK de distinção) | RLS/Constraint |
| `organization_contacts.contact_type = MANAGING_COMPANY_SUPERVISOR` atribuído a organização errada | Validação na função de resolução (organization_id deve casar com `managing_company_organization_id` do contrato) — não é enforced por CHECK de banco, é regra de leitura | RPC |
| `activity_foreman_member_id` de outra organização (não a contratada) | Validação explícita em `create_occurrence`: deve pertencer a `contractor_organization_id` | RPC |
| `ACTION_DUE` gerando notificação duplicada em reprocessamento do cron | Checagem `created_at >= date_trunc('day', now())` antes do insert | RPC |

---

## Handoff atualizado por agente

Mantém a estrutura de gates do relatório arquitetural original (`Gate A → J`); os itens abaixo são **adições**, não substituições.

### DATABASE — itens adicionais

1. Migration `organizations`/`contracts` (Gerenciadora — PO-NOTIF-2): novo valor de enum, coluna `managing_company_organization_id`, check de distinção, índice, patch em `contracts_select`, patch em `validate_organization_contact_contract_org`, novo valor `MANAGING_COMPANY_SUPERVISOR` em `organization_contacts.contact_type`.
2. Migration `occurrence_participants` (Encarregado — PO-NOTIF-3): novo valor `ACTIVITY_FOREMAN`; patch em `create_occurrence` para aceitar `activity_foreman_member_id` opcional e validar/inserir.
3. Migration `get_organization_member_profiles` (DIV-06) — função `SECURITY DEFINER`.
4. Migration `dispatch_action_due_notifications` + `cron.schedule` (PO-NOTIF-6) — confirmar disponibilidade de `pg_cron` no ambiente antes de aplicar; reportar se precisar de habilitação manual fora de migration (extensões às vezes exigem ativação no painel Supabase).
5. Seed: `notification.read` para todos os papéis + `notification.confirm_awareness` para "Administrador da Empresa" (correção factual desta sessão).
6. Resolução (`resolve_occurrence_notification_recipients`) deve incluir os branches de Gerenciadora e continuar ignorando `ACTIVITY_FOREMAN`/`OBSERVER` como destinatários de notificação (são snapshot de participação, não papéis de comunicação — salvo decisão futura em contrário).

### BACKEND — itens adicionais

1. Atualizar `apps/web/src/features/action-plan/services/get-organization-members.ts` e equivalente mobile para usar `get_organization_member_profiles` (DIV-06) em vez do join direto quebrado.
2. Novo service compartilhado para o seletor de "Encarregado da atividade" (reaproveitando o mesmo padrão RPC).

### WEB — itens adicionais

1. Campo opcional "Encarregado da atividade" no formulário de PP (se PP for registrada via Web) ou confirmar que é mobile-only (ver `docs/product.md`/`workflow.md` para confirmar onde a PP é registrada hoje) — **verificar antes de implementar**, não assumir.
2. Tela de gestão de `organization_contacts` deve listar/permitir `contact_type = MANAGING_COMPANY_SUPERVISOR` quando o contrato selecionado tiver `managing_company_organization_id`.

### MOBILE — itens adicionais

1. Campo opcional "Encarregado da atividade" no formulário de criação de PP (`preventive-stop-create-screen.tsx`), reaproveitando o padrão de seletor já usado no Plano de Ação.
2. Exibir `ACTIVITY_FOREMAN` na lista de participantes da ocorrência, quando presente.

### SECURITY — itens adicionais

1. Revisar especificamente: distinção Gerenciadora × contratada × cliente (nunca a mesma organização em dois papéis no mesmo contrato); escopo de `get_organization_member_profiles` (não deve vazar `email`/`phone`); idempotência do cron `ACTION_DUE`.

### QA — itens adicionais

1. Cenário Gerenciadora: organização `MANAGING_COMPANY` vê o contrato, mas não pode `contract.manage`; contato `MANAGING_COMPANY_SUPERVISOR` só resolve quando organização bate com `managing_company_organization_id`.
2. Cenário Encarregado: PP com e sem `activity_foreman_member_id`; membro de organização errada é rejeitado.
3. Cenário `ACTION_DUE`: item vencido gera 1 notificação; reprocessar o cron no mesmo dia não duplica.
4. Cenário DIV-06: usuário sem `platform_admin` consegue ver nome de colega da própria organização via `get_organization_member_profiles`, mas não de outra organização.

### DOCUMENTATION — itens adicionais

1. `docs/database.md` §5.1 (`organization_type`), §7.4 (`contracts`), §7.5 (`organization_contacts`), §9.1 (`occurrence_participants`) — refletir os novos valores de enum e a nova coluna.
2. `docs/api.md` — catalogar `get_organization_member_profiles`, `dispatch_action_due_notifications`.

---

## Critérios de aceite adicionais desta sprint

Complementam (não substituem) os critérios funcionais/arquiteturais já aprovados no relatório original:

- [ ] Gerenciadora: organização `MANAGING_COMPANY` distinta de cliente/contratada no mesmo contrato (constraint valida).
- [ ] Encarregado da atividade: opcional, restrito a membros da contratada, snapshot em `occurrence_participants`.
- [ ] `ACTION_DUE`: idempotente por dia, destinatário correto, sem Push (fora de escopo).
- [ ] `get_organization_member_profiles` retorna nomes corretos para colegas da mesma organização e nunca de outra.
- [ ] Seletor de responsável do Plano de Ação (Sprint 3.0) passa a exibir nomes corretamente após a correção de DIV-06 (regressão obrigatória).

---

## Próximo passo

Handoff liberado para **DATABASE** — pode iniciar migrations imediatamente (Gate A cumprido: todas as decisões de produto necessárias para o schema estão fechadas nesta sessão). **UIUX** — `NOTIFICATIONS-UI-SPEC.md` entregue (2026-08-17); WEB/MOBILE podem implementar UI em paralelo ao fechamento DATABASE/BACKEND restante.

---

## Referências

- Relatório arquitetural Sprint 3.1 (2026-08-17)
- `docs/decisions/NOTIFICATIONS-UI-SPEC.md` — Spec UI (sino, central, ciência, contatos, envolvidos)
- Levantamento RBAC/Responsabilidade Operacional (2026-08-17, mesma sessão)
- `docs/database.md` §5, §7, §9, §17
- `docs/notifications.md`
- `docs/decisions/CONSOLIDATION-DECISIONS.md` (PO-CON-21)
- `docs/decisions/RBAC-MATRIX-APPROVED.md`
- `docs/decisions/ACTION-PLAN-DECISIONS.md` (padrão de responsável/RPC reaproveitado)
- `supabase/seed.sql`
- `supabase/migrations/20260713193559_create_foundation_schema.sql`
- `supabase/migrations/20260715220000_create_occurrences_foundation.sql`
- `supabase/migrations/20260716300000_harden_pp_rpc_and_contract_lists.sql`
- `supabase/migrations/20260809180000_create_action_plan_foundation.sql`
