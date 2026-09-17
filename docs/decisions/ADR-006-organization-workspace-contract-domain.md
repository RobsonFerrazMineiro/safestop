# ADR-006 — Domínio Organization × Workspace × Contract × Occurrence

**Status:** Aprovado (Gate 13X.0 / implementação schema 13X.1)

**Data:** 2026-09-13

**Responsáveis:** PO / MASTER / DATABASE

---

# Contexto

Os Gates 12–13C.1 introduziram Workspace compartilhado e `occurrences.workspace_id` nullable, com autorização efetiva (`can_access_workspace`) e filtro opcional em `list_operational_occurrences`.

O modelo legado ainda trata:

- `organizations` como tenant operacional da occurrence (`occurrences.organization_id`);
- `contracts` como par cliente × contratada **sem** Workspace;
- `organization_contacts` como roteamento de comunicação por Organization.

O Gate 13X.0 fechou o domínio final. Este ADR registra as decisões. O Gate 13X.1 implementa **somente** a fundação additive (colunas/tabelas). Cutover de RPC/UI, remodelagem de areas/units e `NOT NULL` ficam para Gates 13X.2+.

SafeStop permanece **ONLINE**. Sem outbox, sync, drafts offline ou fila de mutações.

---

# Decisão

## 1. Organization

A Organization é a **empresa do usuário** (identidade e RBAC).

- `organization_members` + papéis + `has_permission` = **O QUE** o usuário pode fazer.
- Organization Membership **não** é Workspace Membership e **não** é Contract Assignment.

## 2. Workspace

O Workspace é o **ambiente / contratante operacional**, compartilhado N:N via `organization_workspace_links`.

- Workspace Membership = **ONDE** o usuário pode atuar (autorização territorial).
- Sem wildcard de Workspace.
- `owner_organization_id` = empresa contratante administradora do ambiente.
  - **Modelo final:** obrigatório.
  - **Neste Gate (13X.1):** continua NULLABLE para não quebrar rows existentes; documentado. Sem `NOT NULL` e sem CHECK que rejeite NULL legado.

## 3. Contract

O Contract é o vínculo de **uma Organization titular dentro de um Workspace** (0..N contratos por org no mesmo ambiente).

- No modelo final, o titular será a Organization da contratada no Workspace; `workspace_id` tornará-se `NOT NULL` (13X.2/13X.6).
- **Neste Gate:** `contracts.workspace_id` é NULLABLE. `client_organization_id` e `contractor_organization_id` **permanecem**.
- Equipe própria (decisão 13X.0): occurrence **sem** `contract_id` e **sem** `contractor_organization_id` — regra de RPC no 13X.2, não neste Gate.

## 4. Contract Assignment

`contract_assignments` é N:N entre `organization_member` × `contract` × `assignment_role`.

- **Não substitui** RBAC.
- Catálogo inicial de `assignment_role` (13X.0): `FISCAL` | `GERENTE` | `GESTOR`.
- Integridade 13X.1: assignment **somente** se `contracts.workspace_id IS NOT NULL` e a Organization do member possui link ativo ao Workspace do contrato.
- Contratos legado (`workspace_id IS NULL`) **não** aceitam assignment neste Gate (limitação documentada; sem trigger frágil sobre NULL).

## 5. Occurrence (modelo final vs legado)

Campos finais pretendidos:

- `workspace_id` — ambiente operacional;
- `origin_organization_id` — empresa originadora/registradora (empregador do criador);
- `contractor_organization_id` — nullable (equipe própria);
- `contract_id` — nullable (equipe própria).

**Neste Gate:**

- `occurrences.organization_id` permanece **LEGADO** (cliente/tenant). Significado **não** muda.
- `occurrences.origin_organization_id` é adicionado **NULLABLE**. `NULL` = ainda não migrado. **Não** é tenant no 13X.1.
- Sem `NOT NULL`, sem backfill de produção, sem alteração de `create_occurrence` / `can_access_occurrence`.

## 6. Eixos de autorização (não fundir)

```text
RBAC (has_permission)        = O QUE
Workspace Membership         = ONDE
Contract Assignment          = em QUAL contrato (papel de assignment)
```

Os três eixos são independentes. `organization.manage` não concede todos os Workspaces. Assignment não concede permissão operacional.

## 7. Contacts

`organization_contacts` **não** é substituído neste Gate. Permanece Organization-scoped.

## 8. Areas / Units

Não se movem neste Gate (13X.2).

---

# Motivação

- Preservar o SafeStop atual (coexistência legado × Workspace).
- Preparar Contract×Workspace e origem da occurrence sem cutover prematuro.
- Manter a barreira de segurança já homologada (`can_access_workspace` / `can_access_occurrence`).

---

# Consequências

## Positivas

- Schema additive, reversível no sentido de DROP das colunas/tabela novas.
- Callers atuais de `create_occurrence` / listas sem `workspace_id` continuam válidos.
- Assignments já nascem com integridade Workspace quando o contrato está no modelo novo.

## Negativas / dívidas (13X.2+)

- `owner_organization_id` ainda pode ser NULL.
- `contracts.workspace_id` ainda pode ser NULL; assignments bloqueados nesses contratos.
- `occurrences.organization_id` ainda é o tenant operacional das RPCs.
- `origin_organization_id` não é preenchido automaticamente.
- Areas/units ainda Organization-scoped.
- Sem permissão `workspace.manage` / `contract.assignment.manage` — escrita de assignments só platform admin no 13X.1.

---

# Não fazer (reafirmado)

- Offline / outbox / sync / drafts offline.
- Alterar AndCheck / Web / Mobile neste Gate.
- Backfill de produção.
- Dashboard 13E.
- Substituir `organization_contacts`.

---

# Addendum Gate 13X.2 (RPC)

As 8 decisões de domínio **não mudam**. Este addendum só descreve o `create_occurrence`.

- Dois caminhos na **mesma** RPC (`payload.workspace_id` NULL vs NOT NULL).
- Caminho legado: contratada obrigatória; `origin` NULL; tenant = org atuante.
- Caminho Workspace: `origin` = org atuante confirmada pelo servidor; tenant legado = `owner_organization_id` (fallback atuante se owner NULL).
- Contrato no WS: titular = contratada; `client_organization_id` deixa de ser o eixo do create.
- Equipe própria: sem `contract_id` e sem `contractor_organization_id`, só para o owner do Workspace.
- `units` / `areas` / `management_departments` ganham `workspace_id` NULLABLE (dual-read). Sem backfill.
- `can_access_occurrence` inalterado neste Gate. Visibilidade de lista/SELECT da contratada = Gate 13X.2.1.

---

# Addendum Gate 13X.2.1 (visibilidade contratada)

As 8 decisões de domínio **não mudam**. Caminho legado (`workspace_id` NULL) **não muda**.

- SELECT da occurrence: `occurrence.read` no tenant **ou** origin **ou** contractor, sempre com `can_access_occurrence`. Origin não é tenant.
- Lista operacional com `p_workspace_id` NOT NULL: visibilidade na org atuante (tenant/origin/contractor).
- SELECT de areas/units/md no Workspace acessível (picker da contratada). Escrita inalterada.
- FKs compostos location×tenant substituídos por trigger de dual-read.

---

# Addendum Gate 13X.2.2 (leitura de detalhe)

As 8 decisões de domínio **não mudam**. Este Gate é **somente leitura** de detalhe.

- Helper novo: `can_read_occurrence_record(occurrence_id)` — predicado da ROW; origin/contractor **não** são tenant.
- `can_read_occurrence_in_org(organization_id)` **inalterado** (permission nesta org).
- Filhos de detalhe e timeline passam a usar o helper. Mutações (evaluate, comments write, MDHO write, etc.) **não** são ampliadas.

---

# Addendum Gate 13X.5 (administração de Contract Assignment)

As 8 decisões de domínio **não mudam**.

- Organization = EMPRESA (identidade/RBAC).
- Workspace = AMBIENTE da contratante.
- Contract = vínculo comercial/operacional da Organization contratada no Workspace.
- Contract Assignment = responsabilidade da **pessoa no contrato** (FISCAL | GERENTE | GESTOR).

`member.organization_id` **não** precisa ser igual a `contract.contractor_organization_id`.

Exemplo normativo: Fiscal Hydro → Contract TÜV → FISCAL.

Administração: `organization.manage` na Organization **do member** + `can_access_workspace` + link org↔WS. Sem permission nova. TÜV manager **não** administra members Hydro.

Assignment **não** concede Workspace, RBAC, membership em outra org, nem destinatário de notificação neste Gate. Destinatários oficiais de `OCCURRENCE_CREATED` continuam `organization_contacts`.

# Addendum Gate 13X.5.1 (READ Contract-scoped ≠ WRITE Organization-scoped)

As 8 decisões de domínio **não mudam**.

`participation_role` em `organization_workspace_links` é o papel da Organization **naquele** Workspace (GERENCIADORA | CONTRATADA | NULL). Pertence ao vínculo Organization × Workspace, **não** à Organization globalmente. Owner continua em `workspaces.owner_organization_id` e **não** é valor do CHECK.

READ e WRITE são eixos independentes:

- **READ** (`can_read_contract_assignment`): owner do Ambiente ou GERENCIADORA no vínculo, com `organization.manage` na própria org e `can_access_workspace`, visualiza todos os assignments daquele Contract.
- **WRITE** (`can_manage_contract_assignment`): inalterado — autoridade sobre a Organization do **member**. GERENCIADORA pode visualizar assignments de outras orgs; **não** pode cadastrar, alterar ou revogá-los.

CONTRATADA e `participation_role` NULL (não-owner) não ganham visão gerencial global. O papel **não** é inferido de `organization.type`, `contractor_organization_id`, `client_organization_id`, `origin_organization_id` nem do nome da empresa.

# Addendum Gate 13X.5.2 (SELECT de contracts para governança no Workspace)

As 8 decisões de domínio **não mudam**.

`contracts_select` ganha um eixo additive: owner do Ambiente ou GERENCIADORA no vínculo Organization × Workspace, com `organization.manage` na própria org e `can_access_workspace`, **lê** os contracts daquele Workspace. O eixo client/contractor permanece.

Isso **não** amplia INSERT/UPDATE de `contracts`, **não** transforma GERENCIADORA em client/contractor e **não** concede WRITE de assignment sobre members de outra Organization.

O trigger `validate_contract_assignment_workspace` passa a `SECURITY DEFINER` somente para validar invariantes 13X.1 (workspace preenchido + link da org do member), sem autorizar INSERT/UPDATE de assignment.

# Addendum Gate 13X.5.4 (SELECT de colegas no Workspace)

As 8 decisões de domínio **não mudam**. Os três eixos permanecem independentes:

- `participation_role` = EMPRESA × Ambiente (GERENCIADORA | CONTRATADA | NULL).
- `workspace_memberships` = PESSOA × Ambiente.
- `contract_assignment` = PESSOA × Contract.

`workspace_memberships_select` passa a permitir que quem tem `organization.manage` na Organization atuante leia memberships **ativos** dos colegas **dessa mesma Organization** no Workspace com `can_access_workspace`.

Isso **não** é diretório cross-Organization: owner e GERENCIADORA **não** ganham wildcard sobre memberships de outras empresas. INSERT/UPDATE de memberships permanecem 13B (platform admin). VISUALIZAR colegas da própria org ≠ GERENCIAR memberships ≠ VISUALIZAR estrutura do Contract.

# Addendum Gate 13X.2.3 (visibilidade OPERACIONAL de contracts)

As 8 decisões de domínio **não mudam**.

VISIBILIDADE OPERACIONAL ≠ GOVERNANÇA DO CONTRATO.

- 13X.5.2: `organization.manage` + owner/GERENCIADORA → administração de responsáveis (contracts + assignments READ).
- 13X.2.3: `occurrence.create` + owner/GERENCIADORA → ver a executora (`contractor_organization_id`) e os contracts dela naquele Ambiente, para registrar PP.

Não exige `organization.manage` no Create. Não amplia `organizations_select`. Não concede SELECT de `workspace_memberships` de outra Organization. Não concede WRITE de assignments nem INSERT/UPDATE de contracts. CONTRATADA não ganha SELECT global do Workspace só com `occurrence.create`. Equipe própria (atuante == owner) permanece a regra 13X.2.

# Addendum Gate 13X.2.6 (origin lê a PP)

As 8 decisões de domínio **não mudam**. Origin não é tenant.

Quem cria a PP com `origin_organization_id` = sua Organization (ex.: GERENCIADORA no Ambiente) passa a satisfazer `can_access_occurrence` pelo eixo origin, no mesmo estilo contractor, ainda sujeito a `can_access_workspace` quando a occurrence tem Workspace.

GERENCIADORA **não** ganha wildcard sobre occurrences originadas por outra Organization. `organization.manage` não entra neste predicado. `can_read_occurrence_record` permanece `can_access` ∧ `occurrence.read` em tenant | origin | contractor.

FK `occurrences.area_id → areas(id)` (RESTRICT) restaura o relacionamento PostgREST. Consistência dual-read continua no trigger 13X.2.1; o FK composto area×tenant **não** retorna.

# Addendum Gate 13X.2.8 (WRITE evidência tenant|origin|contractor)

As 8 decisões de domínio **não mudam**. VISIBILIDADE ≠ WRITE.

Quem tem `occurrence.create` na **própria** Organization que é tenant, origin ou contractor da ROW, e `can_access_occurrence`, pode anexar evidência. O path Storage e `occurrence_attachments.organization_id` continuam o **tenant**. GERENCIADORA não vira wildcard de PPs de outro origin. Sem `organization.manage`. Sem permission `attachment.*`.

