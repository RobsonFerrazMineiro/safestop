# Banco de Dados do SafeStop

> Documento de referência para a modelagem de dados, relacionamentos, integridade, segurança e evolução do banco de dados do SafeStop.

---

## 1. Objetivo

O banco de dados do SafeStop deve permitir:

- registrar Paralisações Preventivas;
- identificar quem registrou a ocorrência;
- comunicar automaticamente as pessoas responsáveis;
- acompanhar quem recebeu, visualizou e confirmou ciência;
- registrar a avaliação da liderança;
- classificar a ocorrência como Ver e Agir ou Interdição Oficial;
- registrar a avaliação técnica MDHO;
- registrar manualmente o código do IMS após sua emissão em outra plataforma;
- acompanhar ações corretivas;
- registrar evidências;
- controlar a validação e a liberação da atividade;
- manter uma linha do tempo auditável;
- gerar indicadores operacionais.

A modelagem deve priorizar:

1. simplicidade;
2. integridade;
3. rastreabilidade;
4. segurança;
5. suporte a múltiplas empresas;
6. boa experiência mobile;
7. evolução gradual;
8. baixa complexidade operacional.

---

# 2. Tecnologia de Banco de Dados

O SafeStop utilizará:

- PostgreSQL;
- Supabase;
- Supabase Auth;
- Supabase Storage;
- Supabase Realtime;
- Row Level Security;
- Database Functions;
- Database Triggers;
- Edge Functions apenas quando necessárias.

---

# 3. Convenções

## 3.1 Nomenclatura

Tabelas e colunas devem utilizar:

```text
snake_case
```

Exemplos:

```text
organizations
organization_members
created_at
organization_id
```

---

## 3.2 Identificadores

As entidades principais utilizarão UUID.

Exemplo:

```sql
id uuid primary key default gen_random_uuid()
```

Não utilizar identificadores sequenciais como chave primária.

Códigos visíveis aos usuários poderão seguir um padrão próprio, mas não substituirão o UUID.

---

## 3.3 Datas e horários

Todas as datas e horários serão armazenados em UTC.

Tipo padrão:

```sql
timestamptz
```

A aplicação será responsável por exibir o horário de acordo com o fuso local do usuário.

---

## 3.4 Colunas padrão

Sempre que aplicável:

```text
id
organization_id
created_at
updated_at
created_by
updated_by
```

Nem todas as tabelas precisarão possuir todas essas colunas.

---

## 3.5 Exclusão de dados

Registros críticos não devem ser excluídos fisicamente por usuários comuns.

Quando necessário, utilizar:

```text
is_active
archived_at
cancelled_at
deleted_at
```

Ocorrências, decisões, avaliações, histórico, notificações e auditoria não devem ser apagados fisicamente no fluxo comum.

---

# 4. Visão Geral das Entidades

```text
organizations
profiles
organization_members

roles
permissions
role_permissions
member_roles

units
areas
management_departments
contracts
organization_contacts

occurrences
occurrence_participants
occurrence_decisions
occurrence_status_history
occurrence_comments
occurrence_attachments

mdho_categories
mdho_options
mdho_assessments
mdho_selections

action_plans
action_items
action_item_attachments

notification_events
notifications
notification_deliveries
device_tokens

audit_events
report_export_audit
```

---

# 5. Organizações e Multiempresa

## 5.1 `organizations`

Representa uma organização cadastrada no SafeStop.

Pode representar:

- empresa contratante;
- empresa contratada;
- cliente;
- empresa administradora da plataforma.

### Campos

```text
id
name
legal_name
trade_name
document_number
organization_type
is_active
created_at
updated_at
```

### `organization_type`

Valores iniciais:

```text
CLIENT
CONTRACTOR
PLATFORM
```

### Regras

- organizações não devem ser excluídas quando possuírem ocorrências;
- organizações inativas permanecem disponíveis no histórico;
- `document_number` poderá armazenar CNPJ ou outro identificador empresarial;
- uma organização poderá atuar como contratante ou contratada conforme o contexto.

---

## 5.2 `profiles`

Complementa os usuários do Supabase Auth.

O identificador deve corresponder ao usuário existente em:

```text
auth.users.id
```

### Campos

```text
id
full_name
email
phone
job_title
avatar_path
is_active
last_access_at
created_at
updated_at
```

### Regras

- o e-mail principal permanece em `auth.users`;
- o campo `email` poderá ser mantido para facilitar consultas;
- o perfil não define sozinho as permissões;
- o acesso será determinado pelo vínculo organizacional e pelos papéis.

---

## 5.3 `organization_members`

Relaciona um usuário a uma organização.

### Campos

```text
id
organization_id
profile_id
employee_number
job_title
membership_type
is_active
joined_at
left_at
created_at
updated_at
```

### `membership_type`

Valores iniciais:

```text
INTERNAL
CONTRACTOR
EXTERNAL
PLATFORM_ADMIN
```

### Regras

- um usuário poderá pertencer a mais de uma organização;
- as permissões serão associadas ao vínculo organizacional;
- um vínculo inativo não deve permitir acesso operacional;
- o mesmo usuário poderá possuir papéis diferentes em organizações diferentes.

---

## 5.4 `workspaces` (Gate 12 — fundação)

Espaço operacional que pode ser compartilhado por várias Organizations (ex.: Hydro + TÜV + Arcadis no mesmo Workspace).

**Não** é `unit` nem `contract`. Gate 12 criou apenas a fundação. O Gate 13A adiciona `occurrences.workspace_id` nullable (raiz operacional Workspace-scoped); filhos continuam **sem** `workspace_id` próprio.

### Campos

```text
id
name
code
owner_organization_id
is_active
created_at
updated_at
```

### Regras

- `owner_organization_id` é **opcional neste schema** (Gates 12–13X.1) para não quebrar rows existentes com owner NULL;
- **modelo final (ADR-006 / 13X.0):** `owner_organization_id` será obrigatório (empresa contratante administradora). Sem `NOT NULL` / CHECK neste Gate;
- `code` é opcional e unique parcial quando informado;
- soft deactivate via `is_active` (sem DELETE físico obrigatório);
- Organization Membership ≠ Workspace Membership.

---

## 5.5 `organization_workspace_links` (Gate 12 — fundação)

Participação N:N Organization ↔ Workspace.

### Campos

```text
id
organization_id
workspace_id
is_active
participation_role  -- Gate 13X.5.1; NULL permitido
created_at
updated_at
```

### Regras

- `UNIQUE (organization_id, workspace_id)` — impede link duplicado;
- `UNIQUE (id, organization_id, workspace_id)` — prepara FKs compostas filhas;
- várias Organizations podem participar do mesmo Workspace;
- `link_role` **omitido** no Gate 12: ownership opcional já existe em `workspaces.owner_organization_id`.
- `participation_role` (Gate 13X.5.1): papel da **EMPRESA no AMBIENTE**, no vínculo Organization × Workspace. CHECK `GERENCIADORA` | `CONTRATADA`. NULL = não classificado; **não** inferir GERENCIADORA nem CONTRATADA. Owner **não** é valor do CHECK (`workspaces.owner_organization_id`). A mesma Organization pode ser GERENCIADORA num Workspace e CONTRATADA noutro. Não é RBAC, não é `assignment_role`, não deriva de `organization.type` nem de `contractor_organization_id` / `client_organization_id`. Sem NOT NULL e sem backfill obrigatório.

---

## 5.6 `workspace_memberships` (Gate 12 — fundação)

Grant explícito de acesso a um Workspace por `organization_member_id` (não por `user_id` solto).

### Campos

```text
id
organization_member_id
organization_id
workspace_id
is_active
granted_at
revoked_at
created_at
updated_at
```

### Integridade estrutural

- `UNIQUE (organization_member_id, workspace_id)` — impede grant duplicado;
- FK `(organization_member_id, organization_id) → organization_members (id, organization_id)`;
- FK `(organization_id, workspace_id) → organization_workspace_links (organization_id, workspace_id)`;
- impossível conceder membership se a Organization do member não participa do Workspace.

### RLS (somente foundation)

- SELECT: platform admin ou organização em `current_organization_ids()`;
### RLS foundation (Gate 13B)

- `workspaces` SELECT: `is_platform_admin()` **OU** `can_access_workspace(id)` (não basta link da Organization).
- `organization_workspace_links` SELECT: platform admin **OU** (`is_active` **E** `can_access_workspace`).
- `workspace_memberships` SELECT: platform admin **OU** apenas grants **próprios** ativos (`organization_member.profile_id = auth.uid()`).
- INSERT/UPDATE foundation: somente `is_platform_admin()`; sem wildcard `organization.manage`.
- `create_occurrence`: `workspace_id` **opcional** no payload (Strategy B). Ausente → NULL (legado). Presente → caminho Workspace (Gate 13X.2): `occurrence.create` na org **atuante** + `can_access_workspace` + link ativo org↔ws; `origin` = org atuante; tenant legado = `owner_organization_id` (fallback = atuante).
- Trigger `validate_occurrence_workspace_assignment`: impede Organization × Workspace sem link ativo quando `workspace_id IS NOT NULL`.

SafeStop é **ONLINE**. Sem outbox, sync, drafts offline ou fila de mutações.

Scoping operacional de dados = iniciado no Gate 13A; endurecimento RLS/RPC = **Gate 13B**; cutover UI = Gates 13C+.

---

## 5.7 Autorização efetiva de Workspace (Gate 13A/13B)

### Modelo

```text
RBAC (has_permission)     = O QUE o usuário pode fazer
Workspace Membership      = ONDE ele pode fazer
Contract Assignment       = em QUAL contrato (papel de assignment; Gate 13X.1)
```

Os eixos são independentes. `occurrence.create` não autoriza qualquer Workspace. `organization.manage` não concede automaticamente acesso operacional a todos os Workspaces da Organization. Assignment **não** substitui RBAC.

Organization Membership ≠ Workspace Membership.

### `can_access_workspace(p_workspace_id)`

Acesso efetivo somente quando (usuário comum):

1. Workspace existe e `is_active`;
2. `organization_workspace_links` ativo;
3. `workspace_memberships` ativo;
4. `organization_members` ativo com `profile_id = auth.uid()`;
5. Organization da membership = Organization do link.

Platform Admin: bypass **somente** via `is_platform_admin()` dentro deste helper (e no topo de `can_access_occurrence`).

### `current_workspace_ids()`

Espelha `current_organization_ids()`. Retorna apenas Workspaces com acesso efetivo (mesmas regras). Não lista Workspaces só porque a Organization tem link. Platform Admin não recebe set universal nesta função.

### SafeStop ONLINE

O SafeStop é uma aplicação **ONLINE**. Não há arquitetura de modo offline, outbox, sync, drafts offline ou fila de sincronização no banco. Preferência de UI (ex.: Workspace ativo) não caracteriza offline.

---

# 6. Papéis e Permissões

## 6.1 `roles`

Representa um papel operacional.

Exemplos:

```text
HSE de Campo
Liderança da Contratada
Fiscal do Contrato
Supervisor HSE
Liderança HSE
Gestor
Administrador da Empresa
Administrador da Plataforma
```

### Campos

```text
id
organization_id
name
description
is_system_role
is_active
created_at
updated_at
```

### Regras

- papéis globais poderão possuir `organization_id` nulo;
- papéis personalizados poderão pertencer a uma organização;
- o nome do papel não deve ser utilizado diretamente como regra de autorização;
- permissões devem ser verificadas por códigos específicos.

---

## 6.2 `permissions`

Representa uma permissão atômica.

### Campos

```text
id
code
description
created_at
```

### Exemplos

```text
occurrence.create
occurrence.read
occurrence.evaluate
occurrence.confirm_interdiction
occurrence.validate_correction
occurrence.release
occurrence.cancel

mdho.fill
mdho.submit
mdho.approve
mdho.return

ims_reference.register
ims_reference.update

action_plan.create
action_plan.manage
action_plan.validate

notification.read
notification.confirm_awareness

user.manage
organization.manage
area.manage
contract.manage
settings.manage

report.read
audit.read
```

### Operacionais vs reservadas (Sprints 2.9–3.3 — PO-CON-20)

Catálogo no seed pode incluir códigos **ainda sem fluxo de produto** nas sub-sprints anteriores. Marcar como **reservadas** evita tratar seed como feature entregue.

| Código | Estado |
|---|---|
| `occurrence.create` | **Operacional** |
| `occurrence.read` | **Operacional** (inclui RPC `list_operational_occurrences` — PR-D1 / PO-UX-10; **não** exige `report.read`) |
| `occurrence.evaluate` | **Operacional** |
| `occurrence.confirm_interdiction` | **Operacional** |
| `mdho.fill` · `mdho.submit` · `mdho.approve` · `mdho.return` | **Operacional** |
| `ims_reference.register` · `ims_reference.update` | **Operacional** (registro **manual** — sem integração IMS) |
| `action_plan.create` · `action_plan.manage` · `action_plan.validate` | **Operacional** (Sprint 3.0 — Plano de Ação IO) |
| `notification.read` · `notification.confirm_awareness` | **Operacional** (Sprint 3.1 — notificações in-app + ciência) |
| `report.read` | **Operacional** (Sprint 3.2 — `pendingAwarenessOrg` em `get_dashboard_kpis`; Sprint 3.3 — `list_*_report`, `log_report_export`, SELECT em `report_export_audit`) |
| `occurrence.validate_correction` | **Reservada** — validação/correção futura |
| `occurrence.release` | **Reservada** — liberação futura |
| `occurrence.cancel` | **Reservada** — cancelamento formal futuro (sem RPC operacional) |
| `user.manage` · `organization.manage` · `area.manage` · `contract.manage` · `settings.manage` | Administração — fora do fluxo operacional de ocorrência |
| `audit.read` | Consulta / auditoria — fora do fluxo operacional |

**Regra:** permissão **reservada** pode existir em `permissions` / `role_permissions` no seed, mas **não** implica RPC, UI ou transição disponível. Não inventar integração IMS.

---

## 6.3 `role_permissions`

Relaciona papéis e permissões.

### Campos

```text
id
role_id
permission_id
created_at
```

### Restrição

```text
unique(role_id, permission_id)
```

---

## 6.4 `member_roles`

Relaciona um vínculo organizacional a um papel.

### Campos

```text
id
organization_member_id
role_id
created_at
created_by
```

### Restrição

```text
unique(organization_member_id, role_id)
```

---

# 7. Estrutura Organizacional

## 7.1 `units`

Representa uma unidade, planta, site ou complexo industrial.

### Campos

```text
id
organization_id
workspace_id
name
code
address
latitude
longitude
is_active
created_at
updated_at
```

### `workspace_id` (Gate 13X.2)

```text
workspace_id uuid NULL references workspaces(id) on delete restrict
```

- Destino = Workspace-scoped (AndCheck: `OperationalArea.workspaceId`).
- `NULL` = ainda Organization-scoped (legado). Sem backfill.
- `organization_id` **permanece** (dual-read / tenant legado).
- Unique parcial `(workspace_id, code)` onde ambos NOT NULL. Unique legado `(organization_id, code)` permanece.

---

## 7.2 `areas`

Representa áreas operacionais dentro de uma unidade.

Exemplos:

```text
Caldeiras
Digestão
Filtração
Evaporação
Oficina Central
```

### Campos

```text
id
organization_id
workspace_id
unit_id
name
code
description
is_active
created_at
updated_at
```

### Regras

- uma área pertence a uma unidade;
- áreas antigas podem ser inativadas;
- ocorrências antigas continuam vinculadas à área original.

### `workspace_id` (Gate 13X.2)

Mesmo espírito de `units.workspace_id`. Se `area.workspace_id` e `unit.workspace_id` forem ambos NOT NULL, devem ser iguais (trigger). Sem tabela de mapping extra.

**Dual-read no `create_occurrence` (caminho Workspace):**

- se `area.workspace_id IS NOT NULL` → igualdade estrita com `payload.workspace_id`;
- se `area.workspace_id IS NULL` → `area.organization_id` = tenant legado da occurrence (`occurrences.organization_id`).

O FK composto `occurrences (area_id, organization_id)` foi **substituído** no Gate 13X.2.1 por trigger de dual-read. Área com `workspace_id` = WS **não** precisa ter `organization_id` = tenant.

---

## 7.3 `management_departments`

Representa gerências, coordenações ou estruturas responsáveis.

### Campos

```text
id
organization_id
workspace_id
unit_id
name
code
is_active
created_at
updated_at
```

### `workspace_id` (Gate 13X.2)

Mesmo dual-read de `areas` × unit. Unique parcial `(workspace_id, code)`. Unique legado `(organization_id, code)` permanece.

---

## 7.4 `contracts`

Representa o relacionamento contratual entre contratante e contratada.

### Campos

```text
id
client_organization_id
contractor_organization_id
workspace_id
unit_id
contract_number
name
description
starts_at
ends_at
is_active
created_at
updated_at
```

### Regras

- uma ocorrência poderá estar vinculada a um contrato;
- contratos encerrados permanecem disponíveis no histórico;
- o uso do contrato poderá ser opcional no primeiro MVP.

### `workspace_id` (Gate 13X.1)

```text
workspace_id uuid NULL references workspaces(id) on delete restrict
```

- Modelo final (ADR-006): Contract = vínculo de **uma** Organization titular **dentro** de um Workspace (0..N).
- **NULLABLE** neste Gate (contratos legado sem Workspace).
- Nos Gates 13X.2/13X.6 tornará `NOT NULL`; titular = Organization da contratada no Workspace.
- `client_organization_id` e `contractor_organization_id` **permanecem** (não drop neste Gate).
- Índice parcial `(workspace_id)` onde `workspace_id IS NOT NULL`.
- Unique parcial `(workspace_id, contractor_organization_id, contract_number)` onde ambos `workspace_id` e `contract_number` são NOT NULL. Coexiste com o unique legado `(client_organization_id, contract_number)`.

### RLS SELECT (Gate 13X.5.2)

Eixo existente **preservado**: `client_organization_id` **OU** `contractor_organization_id` em `current_organization_ids()` **OU** platform admin.

Eixo additive de governança no Workspace (não substitui client/contractor):

- `workspace_id IS NOT NULL`
- `can_access_workspace(workspace_id)`
- `organization.manage` na org atuante **e** essa org é `workspaces.owner_organization_id` **ou** tem link ativo com `participation_role = GERENCIADORA`

CONTRATADA operacional **não** ganha SELECT de todos os contratos do Workspace só pelo link CONTRATADA. Campo sem `organization.manage` permanece no eixo client/contractor.

**INSERT/UPDATE de `contracts` inalterados** (`contract.manage` no client). Visibilidade do Contract ≠ autoridade para alterar `client_organization_id` / `contractor_organization_id` ≠ WRITE de assignment sobre members de outra Organization.

---

## 7.4.1 `contract_assignments` (Gate 13X.1)

Assignment N:N entre `organization_member` × `contract` × `assignment_role`.

**Não substitui RBAC.** Eixos independentes: RBAC = O QUE; Workspace Membership = ONDE; Assignment = em QUAL contrato.

### Campos

```text
id
organization_member_id
organization_id
contract_id
assignment_role
is_active
granted_at
revoked_at
created_at
updated_at
```

### Regras

- `assignment_role` CHECK: `FISCAL` | `GERENTE` | `GESTOR` (catálogo inicial 13X.0);
- `UNIQUE (organization_member_id, contract_id, assignment_role)`;
- FK composta `(organization_member_id, organization_id) → organization_members`;
- FK `contract_id → contracts` `ON DELETE RESTRICT`;
- Integridade Workspace (trigger): assignment **somente** se `contracts.workspace_id IS NOT NULL` **e** a Organization do member possui `organization_workspace_links` ativo para esse Workspace. Gate 13X.5.2: o trigger é `SECURITY DEFINER` (`search_path` vazio) para **ler** `workspace_id` e o link sem depender do RLS de `contracts`; não INSERT/UPDATE próprios; **não** substitui `can_manage_contract_assignment`.
- Contratos legado (`workspace_id IS NULL`) **não** aceitam assignment neste Gate (limitação documentada);
- Soft deactivate via `is_active` / `revoked_at`.

### RLS (Gate 13X.5 / 13X.5.1)

Assignment **não** é RBAC, membership nem acesso a Workspace.

`member.organization_id` **não** precisa ser `contract.contractor_organization_id` (ex.: Fiscal Hydro → Contract TÜV → FISCAL). Nomes Hydro/TÜV nas fixtures são apenas exemplos; as policies **não** usam nome, `organization.type` nem contractor/client.

**WRITE** (helper `can_manage_contract_assignment`, Gate 13X.5 — semântica inalterada em 13X.5.1):

- `organization.manage` na **Organization do member**;
- `can_access_workspace` do contrato (`workspace_id IS NOT NULL`);
- link ativo da Organization do member no Workspace.

Assim o manager da org do member atribui apenas membros **da própria Organization**; `can_access_workspace` sozinho **não** autoriza escrita. GERENCIADORA **não** ganha WRITE sobre members de outra Organization.

**READ** (helper `can_read_contract_assignment`, Gate 13X.5.1) — eixo independente do WRITE:

- platform admin **OU** assignment próprio ativo **OU** `can_manage_contract_assignment` (visão da própria org) **OU** visão **Contract-scoped**: `can_access_workspace` + `workspace_id IS NOT NULL` + `organization.manage` na org atuante **e** essa org é `workspaces.owner_organization_id` **ou** tem link ativo com `participation_role = GERENCIADORA`.
- CONTRATADA (não-owner) **não** entra na visão global: manager vê só a própria org + próprio assignment.
- `participation_role` NULL em Organization **não-owner** **não** concede visão global e **não** é inferido como GERENCIADORA.
- VISUALIZAR responsáveis ≠ GERENCIAR responsáveis.

Policies:

- SELECT: `can_read_contract_assignment`;
- INSERT/UPDATE: `can_manage_contract_assignment` (inclui platform admin);
- Sem DELETE policy (soft revoke).
- Sem permission nova (`contract.assignment.manage` não criada).

Contratos legado (`workspace_id IS NULL`) continuam sem assignment (policy + trigger 13X.1).

Não participa do roteamento de notificações neste Gate (`organization_contacts` permanece).

---

## 7.5 `organization_contacts`

Representa responsáveis que devem receber comunicações por organização, área, gerência ou contrato.

### Campos

```text
id
organization_id
organization_member_id
unit_id
area_id
management_department_id
contract_id
contact_type
priority
is_active
created_at
updated_at
```

### `contact_type`

Valores possíveis:

```text
CONTRACTOR_LEADERSHIP
CONTRACT_INSPECTOR
HSE_SUPERVISOR
HSE_LEADERSHIP
AREA_MANAGER
CONTRACT_MANAGER
COMPANY_RESPONSIBLE
CUSTOM
```

### Objetivo

Permitir que o SafeStop identifique automaticamente quem deve receber a comunicação quando uma ocorrência for registrada.

---

# 8. Ocorrências

## 8.1 `occurrences`

Tabela principal do SafeStop.

Representa uma Paralisação Preventiva e todo o seu acompanhamento até a conclusão.

### Campos

```text
id
organization_id
unit_id
area_id
management_department_id
contract_id
contractor_organization_id

workspace_id
origin_organization_id

public_code
title
task_description
location_description
condition_description
immediate_action_description

severity
status
decision_type

latitude
longitude
location_accuracy

occurred_at
stopped_at
evaluated_at
released_at
closed_at
cancelled_at

created_by
assigned_evaluator_id

ims_reference_code
ims_reference_registered_at
ims_reference_registered_by
ims_reference_updated_at
ims_reference_updated_by

cancellation_reason

created_at
updated_at
```

### `workspace_id` (Gate 13A)

```text
workspace_id uuid NULL references workspaces(id) on delete restrict
```

- Raiz operacional Workspace-scoped.
- **NULLABLE** durante coexistência com occurrences legadas (criadas antes de Workspace).
- `NULL` = autorização legado (sem filtro Workspace) via `can_access_occurrence`.
- `NOT NULL` somente após backfill completo + homologação (Gate futuro — não neste 13A).
- Entidades filhas (status history, participants, decisions, comments, attachments, action plans/items, MDHO, etc.) **herdam** o Workspace pela occurrence — **não** recebem coluna `workspace_id` própria neste Gate.

Índices (parciais onde `workspace_id is not null`):

- `occurrences_workspace_id_idx (workspace_id)` — filtro por Workspace;
- `occurrences_organization_id_workspace_id_idx (organization_id, workspace_id)` — listas já org-scoped + futuro filtro Workspace.

### `origin_organization_id` (Gate 13X.1)

```text
origin_organization_id uuid NULL references organizations(id) on delete restrict
```

- Empresa originadora/registradora (empregador do criador).
- `NULL` = ainda não migrado.
- **Não** usar como tenant no 13X.1.
- `occurrences.organization_id` permanece **LEGADO** (cliente/tenant). Significado **não** muda neste Gate.
- Índice parcial `(origin_organization_id)` onde NOT NULL.
- Sem `NOT NULL`, sem backfill.
- Preenchido automaticamente no **caminho Workspace** de `create_occurrence` (org atuante). Permanece `NULL` no caminho legado.

Ver ADR-006.

---

## 8.2 Código interno do SafeStop

Toda ocorrência deve possuir um código interno independente do IMS.

Exemplo:

```text
SS-26-000001
```

Campo:

```text
public_code
```

### Objetivo

O SafeStop precisa identificar a ocorrência desde o momento em que a Paralisação Preventiva é registrada.

O código IMS poderá ser informado somente depois, caso a ocorrência seja confirmada como Interdição Oficial.

### Regras

- `public_code` deve ser único;
- deve ser gerado pelo backend;
- não deve ser gerado pelo aplicativo mobile;
- deve existir mesmo quando não houver IMS;
- não possui relação técnica com o código do IMS.

---

## 8.3 Referência manual do IMS

O SafeStop não gera, consulta, valida, sincroniza ou atualiza informações no sistema IMS.

Quando o IMS for emitido na plataforma corporativa utilizada pela empresa, um usuário autorizado deverá informar manualmente no SafeStop o código gerado.

Exemplo:

```text
BAA-26-0001
```

Campo:

```text
ims_reference_code
```

### Finalidade

O código será armazenado apenas como uma referência textual para acompanhamento interno da ocorrência no SafeStop.

Não haverá ligação técnica entre os sistemas.

### Regras

- o preenchimento será manual;
- o campo será opcional;
- somente poderá ser preenchido após a confirmação da Interdição Oficial;
- deverá registrar quem informou o código;
- deverá registrar quando o código foi informado;
- alterações posteriores devem registrar quem alterou e quando;
- o SafeStop não verificará se o código existe na plataforma IMS;
- o SafeStop não consultará dados na plataforma IMS;
- não haverá sincronização de status;
- não haverá importação automática;
- não haverá exportação automática;
- não haverá criação automática de links;
- não haverá geração do IMS dentro do SafeStop;
- não deve existir campo separado chamado “Código BAA”;
- BAA faz parte do próprio código informado;
- toda inclusão ou alteração deve gerar auditoria.

### Exibição

Enquanto o código não for informado, o sistema poderá exibir:

```text
Aguardando registro do IMS
```

Essa mensagem representa apenas que o campo ainda não foi preenchido.

---

## 8.4 `severity`

Valores iniciais:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

A criticidade ajuda na priorização, mas não substitui a decisão da liderança.

---

## 8.5 `status`

Valores iniciais:

```text
PARALISACAO_PREVENTIVA
EM_AVALIACAO
VER_E_AGIR
INTERDICAO_CONFIRMADA
MDHO_EM_PREENCHIMENTO
AGUARDANDO_APROVACAO_HSE
AGUARDANDO_REGISTRO_IMS
EM_TRATATIVA
AGUARDANDO_VALIDACAO
LIBERADA
ENCERRADA
CANCELADA
```

### Regras

- o status inicial será `PARALISACAO_PREVENTIVA`;
- transições devem ser executadas por função de backend;
- a interface não poderá alterar livremente o status;
- toda alteração deve gerar histórico;
- `AGUARDANDO_REGISTRO_IMS` significa apenas que o código externo ainda não foi digitado;
- o registro do IMS no SafeStop é manual;
- o fluxo definitivo será documentado em `workflow.md`.

---

## 8.6 `decision_type`

Valores:

```text
VER_E_AGIR
INTERDICAO_OFICIAL
```

O campo permanecerá nulo até a avaliação da liderança.

---

## 8.7 Índices recomendados

```text
organization_id
status
severity
unit_id
area_id
contractor_organization_id
created_at
occurred_at
assigned_evaluator_id
ims_reference_code
```

Índices compostos possíveis:

```text
organization_id + status
organization_id + created_at
organization_id + area_id + created_at
organization_id + contractor_organization_id + created_at
```

---

# 9. Participantes da Ocorrência

## 9.1 `occurrence_participants`

Relaciona usuários e organizações à ocorrência.

### Campos

```text
id
occurrence_id
organization_id
organization_member_id
participant_type
is_primary
created_at
created_by
```

### `participant_type`

Valores possíveis:

```text
REPORTER
EVALUATOR
CONTRACTOR_LEADER
CONTRACT_INSPECTOR
HSE_SUPERVISOR
HSE_APPROVER
AREA_MANAGER
ACTION_OWNER
RELEASE_APPROVER
OBSERVER
```

### Objetivo

Registrar formalmente quem participou, foi comunicado ou teve responsabilidade na ocorrência.

---

# 10. Avaliação da Liderança

## 10.1 `occurrence_decisions`

Registra a decisão da liderança após a Paralisação Preventiva.

### Campos

```text
id
occurrence_id
decision_type
decision_reason
decided_by
decided_at
created_at
```

### Regras

- uma ocorrência deve possuir apenas uma decisão vigente;
- alterações posteriores devem gerar novo registro ou auditoria;
- `VER_E_AGIR` não exige registro de IMS;
- `INTERDICAO_OFICIAL` inicia o fluxo MDHO;
- somente usuários autorizados podem registrar a decisão.

---

# 11. Histórico de Status

## 11.1 `occurrence_status_history`

Registra todas as mudanças de status.

### Campos

```text
id
occurrence_id
from_status
to_status
reason
metadata
changed_by
changed_at
```

### `metadata`

Campo JSONB para informações complementares.

Exemplo:

```json
{
  "decision_type": "INTERDICAO_OFICIAL"
}
```

Outro exemplo:

```json
{
  "ims_reference_code": "BAA-26-0001",
  "input_method": "MANUAL"
}
```

### Regras

- registros não podem ser editados por usuários comuns;
- toda mudança de status deve gerar um item;
- o histórico deve ser criado na mesma transação da alteração;
- o registro manual do IMS deve aparecer na timeline.

---

# 12. Comentários

## 12.1 `occurrence_comments`

Representa comentários e atualizações textuais.

### Campos

```text
id
occurrence_id
organization_id
author_id
comment_type
content
is_internal
created_at
updated_at
deleted_at
```

### `comment_type`

Valores:

```text
GENERAL
CORRECTION_UPDATE
LEADERSHIP_NOTE
HSE_NOTE
RELEASE_NOTE
SYSTEM_NOTE
```

### Regras

- comentários de sistema não devem ser editáveis;
- comentários internos podem possuir acesso restrito;
- exclusão deve ser lógica;
- comentários críticos devem permanecer no histórico.

---

# 13. Anexos e Evidências

## 13.1 `occurrence_attachments`

Armazena metadados dos arquivos existentes no Supabase Storage.

### Campos

```text
id
occurrence_id
organization_id
uploaded_by
attachment_type
storage_bucket
storage_path
original_file_name
mime_type
file_size
caption
latitude
longitude
captured_at
created_at
deleted_at
```

### `attachment_type`

Valores:

```text
INITIAL_EVIDENCE
CORRECTION_EVIDENCE
RELEASE_EVIDENCE
DOCUMENT
OTHER
```

### MIME allowlist (banco + RPC + bucket `occurrence-evidence`)

```text
image/jpeg
image/png
image/webp
application/pdf
```

Limite por arquivo: **10 MiB** (`10485760`). Extensão do `storage_path` deriva do MIME (`jpg` / `png` / `webp` / `pdf`), não do filename. `attachment_type` é independente do MIME — `DOCUMENT` já existia e é o valor adequado para PDF quando o cliente o informar; a RPC não força nem bloqueia `DOCUMENT` por causa do MIME.

A mesma allowlist aplica-se a `action_item_attachments` e `prepare_action_item_attachment_upload` (bucket compartilhado `occurrence-evidence`).

### Regras

- arquivos devem ser privados;
- o arquivo real ficará no Storage;
- a tabela armazenará metadados;
- tipos e tamanhos devem ser validados;
- exclusão deve ser lógica;
- evidências críticas não devem ser apagadas após o encerramento.

---

# 14. Avaliação Técnica MDHO

## 14.1 Objetivo

A avaliação MDHO será estruturada por listas padronizadas e configuráveis.

Ela deverá permitir:

- múltiplas seleções;
- opções configuráveis;
- campo “Outro”;
- detalhamento textual;
- complemento da avaliação;
- geração de indicadores;
- análise pela liderança HSE.

---

## 14.2 `mdho_categories`

Representa as categorias principais.

### Registros iniciais

```text
BEHAVIOR
DEVIATION_TYPE
PRECONDITIONS
ORGANIZATIONAL_ISSUES
SUPERVISION_INSPECTION
```

### Campos

```text
id
organization_id
code
name
description
allows_multiple
requires_selection
display_order
is_active
created_at
updated_at
```

### Regras iniciais

| Categoria                | Seleção múltipla |
| ------------------------ | ---------------: |
| Comportamento            |              Sim |
| Tipo de Desvio           |              Não |
| Pré-condições            |              Sim |
| Questões Organizacionais |              Sim |
| Supervisão/Fiscalização  |              Sim |

---

## 14.3 `mdho_options`

Representa cada opção disponível em uma categoria.

### Campos

```text
id
organization_id
category_id
code
label
description
allows_detail
display_order
is_active
created_at
updated_at
```

### Exemplos de Comportamento

```text
EXCESS_CONFIDENCE
DISTRACTION
LACK_OF_ATTENTION
RUSH
IMPROVISATION
PPE_NOT_USED
PROCEDURE_NOT_FOLLOWED
OPERATIONAL_SHORTCUT
RISK_NOT_PERCEIVED
COMMUNICATION_FAILURE
OTHER
```

### Tipo de Desvio

```text
ERROR
VIOLATION
```

### Pré-condições

```text
INADEQUATE_TOOL
DEFECTIVE_EQUIPMENT
POOR_HOUSEKEEPING
INSUFFICIENT_SIGNALING
INADEQUATE_LIGHTING
WEATHER_CONDITION
MISSING_COLLECTIVE_PROTECTION
APR_FAILURE
WORK_PERMIT_FAILURE
OTHER
```

### Questões Organizacionais

```text
INADEQUATE_PLANNING
MISSING_PROCEDURE
INADEQUATE_PROCEDURE
POOR_COMMUNICATION
INSUFFICIENT_TRAINING
INSUFFICIENT_RESOURCES
SCHEDULE_PRESSURE
CHANGE_MANAGEMENT_FAILURE
INADEQUATE_STAFFING
OTHER
```

### Supervisão/Fiscalização

```text
ABSENT_SUPERVISION
INSUFFICIENT_SUPERVISION
INADEQUATE_INSPECTION
GUIDANCE_NOT_PROVIDED
VERIFICATION_FAILURE
INADEQUATE_RELEASE
OTHER
```

---

## 14.4 `mdho_assessments`

Representa uma avaliação MDHO vinculada à ocorrência.

### Campos

```text
id
occurrence_id
organization_id
status
complement
submitted_at
submitted_by
approved_at
approved_by
returned_at
returned_by
return_reason
created_at
updated_at
```

### `status`

Valores:

```text
DRAFT
SUBMITTED
APPROVED
RETURNED
```

### Regras

- somente uma avaliação ativa por ocorrência;
- só poderá existir após a confirmação da Interdição Oficial;
- somente usuário autorizado poderá aprovar;
- uma avaliação devolvida poderá ser corrigida e reenviada;
- aprovação e devolução devem gerar histórico e auditoria.

---

## 14.5 `mdho_selections`

Registra as opções selecionadas.

### Campos

```text
id
assessment_id
category_id
option_id
detail
created_at
created_by
```

### Regras

- `detail` será utilizado quando a opção exigir explicação;
- a opção `OTHER` exige detalhamento;
- seleções duplicadas devem ser impedidas;
- deve respeitar se a categoria permite uma ou múltiplas opções.

### Restrição

```text
unique(assessment_id, option_id)
```

---

# 15. Plano de Ação

## 15.1 `action_plans`

Representa o plano de ação de uma ocorrência.

### Campos

```text
id
occurrence_id
organization_id
status
summary
created_by
approved_by
approved_at
created_at
updated_at
closed_at
```

### `status`

Valores:

```text
OPEN
IN_PROGRESS
AWAITING_VALIDATION
COMPLETED
CANCELLED
```

### Regras

- o plano de ação poderá ser obrigatório para Interdição Oficial;
- para Ver e Agir poderá existir uma correção simplificada;
- uma ocorrência possuirá inicialmente apenas um plano ativo.

---

## 15.2 `action_items`

Representa cada ação corretiva.

### Campos

```text
id
action_plan_id
organization_id
title
description
responsible_member_id
responsible_organization_id
due_at
priority
status
completion_description
completed_at
completed_by
validated_at
validated_by
validation_note
created_at
updated_at
```

### `status`

```text
PENDING
IN_PROGRESS
AWAITING_VALIDATION
COMPLETED
REJECTED
CANCELLED
```

### `priority`

```text
LOW
MEDIUM
HIGH
CRITICAL
```

### Regras

- uma ação deve possuir responsável;
- uma ação poderá exigir evidência;
- conclusão e validação são etapas diferentes;
- ação rejeitada retorna para correção.

---

## 15.3 `action_item_attachments`

Relaciona evidências às ações corretivas.

### Campos

```text
id
action_item_id
organization_id
uploaded_by
storage_bucket
storage_path
original_file_name
mime_type
file_size
caption
created_at
deleted_at
```

---

# 16. Fluxo Ver e Agir

Para manter o MVP simples, o fluxo Ver e Agir não precisa inicialmente de uma tabela própria.

A correção poderá ser registrada por:

- comentário do tipo `CORRECTION_UPDATE`;
- anexo do tipo `CORRECTION_EVIDENCE`;
- atualização controlada de status;
- validação da liderança;
- evento de auditoria.

Caso esse fluxo se torne mais complexo, uma entidade específica poderá ser criada futuramente.

---

# 17. Notificações

**Estado (Sprint 3.1):** `notification_events` e `notifications` **implementadas** — migrations `20260817180000_create_notifications_foundation.sql`, `20260817190000_notification_rpcs.sql` e patches de dispatch (`20260817200000` … `20260817230000`). Escrita de eventos/notificações: somente funções `SECURITY DEFINER` (`create_occurrence_notification_event`, patches nas RPCs de domínio). Cliente: leitura/ciência via RPC + `SELECT` RLS; badge via contagem client-side.

**Fora 3.1:** `notification_deliveries`, `device_tokens`, Push, e-mail, WhatsApp — ver §17.4–17.5.

## 17.1 Princípio

O sistema deve separar:

- o evento de negócio;
- a notificação destinada ao usuário;
- a tentativa de entrega por canal.

---

## 17.2 `notification_events`

Representa um evento que exige comunicação.

### `event_type` (implementado — Sprint 3.1)

```text
OCCURRENCE_CREATED
DECISION_REQUIRED
VER_AND_ACT_REQUIRED
INTERDICTION_CONFIRMED
MDHO_APPROVAL_REQUIRED
MDHO_RETURNED
MDHO_APPROVED
IMS_REFERENCE_REGISTERED
ACTION_PLAN_CREATED
ACTION_ITEM_ASSIGNED
ACTION_ITEM_SUBMITTED
ACTION_ITEM_VALIDATED
ACTION_ITEM_RETURNED
ACTION_PLAN_COMPLETED
```

Contrato destinatários/ciência: `docs/decisions/NOTIFICATIONS-DECISIONS.md` · `docs/decisions/CONSOLIDATION-DECISIONS.md` PO-CON-21 (fechado na 3.1).

### Exemplos (roadmap / sprints futuras — ainda sem dispatch)

```text
OCCURRENCE_ASSIGNED
ACTION_DUE
CORRECTION_SUBMITTED
RELEASE_REQUIRED
OCCURRENCE_RELEASED
```

### Campos

```text
id
organization_id
occurrence_id
event_type
priority
payload
created_at
created_by
```

### `payload`

Campo JSONB com os dados necessários para gerar a mensagem.

---

## 17.3 `notifications`

Representa uma notificação individual.

### Campos

```text
id
notification_event_id
organization_id
recipient_member_id
title
message
priority
requires_awareness
read_at
awareness_confirmed_at
created_at
expires_at
```

### Regras

- cada notificação pertence a um destinatário;
- leitura e confirmação de ciência são eventos diferentes;
- nem toda notificação precisa exigir ciência;
- notificações críticas poderão exigir confirmação explícita.

---

## 17.4 `notification_deliveries`

**Fora Sprint 3.1** — tabela ainda **não** migrada. Representa cada tentativa de entrega por canal.

### Campos

```text
id
notification_id
channel
destination
status
provider
provider_message_id
attempt_count
last_attempt_at
delivered_at
failed_at
failure_reason
created_at
updated_at
```

### `channel`

```text
IN_APP
PUSH
EMAIL
WHATSAPP
```

### `status`

```text
PENDING
PROCESSING
SENT
DELIVERED
FAILED
CANCELLED
```

### Regras

- WhatsApp não fará parte do primeiro MVP;
- falhas devem ser registradas;
- tentativas devem ser idempotentes;
- uma mensagem enviada não significa automaticamente que houve ciência.

---

## 17.5 `device_tokens`

**Fora Sprint 3.1** — tabela ainda **não** migrada. Armazena tokens para notificações push.

### Campos

```text
id
profile_id
organization_member_id
device_id
platform
push_token
app_version
is_active
last_seen_at
created_at
updated_at
```

### `platform`

```text
ANDROID
IOS
WEB
```

### Regras

- um usuário poderá possuir mais de um dispositivo;
- tokens inválidos devem ser desativados;
- tokens não devem ficar visíveis para outros usuários.

---

# 18. Auditoria

## 18.1 `audit_events`

Registra ações relevantes do sistema.

### Campos

```text
id
organization_id
actor_profile_id
actor_member_id
entity_type
entity_id
action
previous_data
new_data
metadata
ip_address
user_agent
created_at
```

### Exemplos de `action`

```text
OCCURRENCE_CREATED
OCCURRENCE_UPDATED
STATUS_CHANGED
DECISION_RECORDED
NOTIFICATION_CREATED
NOTIFICATION_READ
AWARENESS_CONFIRMED
MDHO_SUBMITTED
MDHO_APPROVED
MDHO_RETURNED
IMS_REFERENCE_REGISTERED
IMS_REFERENCE_UPDATED
ACTION_ITEM_CREATED
ACTION_ITEM_COMPLETED
CORRECTION_VALIDATED
OCCURRENCE_RELEASED
OCCURRENCE_CANCELLED
```

### Regras

- usuários comuns não podem editar ou excluir auditorias;
- ações críticas devem ser registradas no backend;
- alterações do código IMS devem registrar valor anterior e novo valor;
- dados sensíveis devem ser minimizados.

---

## 18.2 `report_export_audit` (Sprint 3.3)

Auditoria **dedicada** a exportações de relatório — **não** substitui `audit_events` genérico.

**Migration:** `20260822194000_create_report_export_audit.sql`

### Campos

```text
id
organization_id
exported_by
report_type
export_format
filters
row_count
created_at
```

### Domínios (`CHECK`)

| Coluna | Valores |
|---|---|
| `report_type` | `OCCURRENCES` · `ACTION_ITEMS` · `AWARENESS` |
| `export_format` | `CSV` · `XLSX` |
| `row_count` | `>= 0` |

### Regras

- Escrita **somente** via RPC `log_report_export` (`SECURITY DEFINER`) — cliente **não** faz `INSERT` direto.
- SELECT: `report.read` na organização (ou platform admin).
- Trilha **não apagável** nesta sprint (sem `DELETE` para authenticated).
- `filters`: snapshot jsonb dos filtros ativos no momento da exportação.

### Índice

| Índice | Colunas | Uso |
|---|---|---|
| `report_export_audit_organization_id_created_at_idx` | `(organization_id, created_at desc)` | Histórico por org |

Decisões: `docs/decisions/REPORTS-DECISIONS.md` (PO-REP-6).

---

# 19. Relacionamentos Principais

```text
auth.users
    │
    └── profiles
            │
            └── organization_members
                    ├── member_roles
                    ├── occurrence_participants
                    ├── notifications
                    └── device_tokens

organizations
    ├── organization_members
    ├── units
    ├── contracts
    ├── occurrences
    ├── mdho_categories
    ├── audit_events
    └── report_export_audit

units
    └── areas

occurrences
    ├── occurrence_participants
    ├── occurrence_decisions
    ├── occurrence_status_history
    ├── occurrence_comments
    ├── occurrence_attachments
    ├── mdho_assessments
    ├── action_plans
    ├── notification_events
    └── audit_events

mdho_assessments
    └── mdho_selections

action_plans
    └── action_items
            └── action_item_attachments

notification_events
    └── notifications
            └── notification_deliveries
```

---

# 20. Regras de Integridade

## 20.1 Ocorrências

- toda ocorrência deve pertencer a uma organização;
- toda ocorrência deve possuir autor;
- toda ocorrência deve possuir um código interno;
- o código interno deve ser único;
- unidade e área poderão ser obrigatórias conforme a configuração;
- uma ocorrência encerrada não poderá ser alterada livremente;
- uma ocorrência cancelada exige justificativa.

---

## 20.2 Decisão

- somente usuário autorizado poderá decidir;
- Ver e Agir não exige IMS;
- Interdição Oficial inicia o fluxo MDHO;
- toda decisão deve gerar histórico e auditoria.

---

## 20.3 MDHO

- somente existe em Interdição Oficial;
- deve respeitar categorias obrigatórias;
- Tipo de Desvio aceita apenas uma opção;
- opção Outro exige detalhe;
- devolução exige justificativa;
- aprovação deve gerar histórico.

---

## 20.4 Referência manual do IMS

- o SafeStop não gera IMS;
- o SafeStop não se comunica diretamente com a plataforma IMS;
- o código será digitado manualmente;
- o código será armazenado apenas como texto de referência;
- o SafeStop não validará se o código existe na plataforma externa;
- o SafeStop não consultará informações na plataforma externa;
- o SafeStop não sincronizará status;
- o SafeStop não importará dados;
- o SafeStop não exportará dados automaticamente;
- o código somente poderá ser informado em Interdição Oficial;
- toda inclusão ou alteração deve gerar histórico e auditoria;
- somente usuário autorizado poderá informar ou corrigir o código.

Uma validação básica de formato poderá ser utilizada apenas para evitar erro de digitação.

Formato inicialmente esperado:

```text
BAA-26-0001
```

Validação básica sugerida:

```regex
^BAA-\d{2}-\d{4,}$
```

Essa validação não confirma a existência ou a validade do registro na plataforma IMS.

---

## 20.5 Liberação

A liberação deve exigir:

- usuário autorizado;
- status compatível;
- correções registradas;
- evidências quando necessárias;
- ações obrigatórias concluídas;
- nota ou justificativa de liberação;
- registro de data, hora e usuário.

---

# 21. Máquina de Estados no Banco

Mudanças de status devem ocorrer por funções controladas.

Exemplos:

```text
create_occurrence()
start_occurrence_evaluation()
record_occurrence_decision()
submit_mdho_assessment()
approve_mdho_assessment()
return_mdho_assessment()
register_ims_reference()
update_ims_reference()
submit_correction()
validate_correction()
release_occurrence()
close_occurrence()
cancel_occurrence()
```

Cada função deverá:

1. validar o usuário;
2. validar a organização;
3. validar a permissão;
4. validar o status atual;
5. validar os campos obrigatórios;
6. executar a alteração;
7. registrar histórico;
8. registrar auditoria;
9. criar eventos de notificação quando necessário;
10. retornar um resultado padronizado.

---

# 22. Idempotência

Operações críticas devem evitar duplicidade.

Exemplos:

- criação duplicada por clique repetido;
- envio duplicado de notificação;
- confirmação repetida de ciência;
- registro repetido da mesma referência IMS;
- liberação repetida;
- conclusão duplicada de ação.

Recursos possíveis:

```text
idempotency_key
unique constraints
database transactions
upsert
```

---

# 23. Row Level Security

## 23.1 Princípio

Todas as tabelas acessíveis pelo cliente devem possuir RLS habilitado.

O acesso deve considerar:

- usuário autenticado;
- vínculo organizacional ativo;
- papel;
- permissão;
- escopo;
- relação com a ocorrência.

---

## 23.2 Exemplos de acesso

### HSE de Campo

Pode:

- criar ocorrência;
- visualizar ocorrências do seu escopo;
- acompanhar ocorrências criadas por ele;
- adicionar comentários;
- enviar evidências.

Não pode:

- aprovar MDHO;
- registrar referência IMS sem permissão;
- liberar ocorrência sem autorização;
- administrar usuários.

### Liderança da Contratada

Pode:

- visualizar ocorrências da contratada;
- receber alertas;
- confirmar ciência;
- registrar correções;
- acompanhar ações.

### Fiscal do Contrato

Pode:

- visualizar ocorrências dos contratos sob sua responsabilidade;
- avaliar;
- acompanhar;
- validar conforme permissão.

### Liderança HSE

Pode:

- avaliar ocorrências;
- confirmar Interdição Oficial;
- aprovar ou devolver MDHO;
- validar correções;
- registrar referência IMS quando autorizado;
- liberar atividades.

### Administrador

Pode:

- administrar configurações;
- cadastrar áreas;
- cadastrar responsáveis;
- administrar papéis e permissões.

---

## 23.3 Funções auxiliares

Poderão existir funções PostgreSQL:

```text
current_profile_id()
current_organization_ids()
current_workspace_ids()
has_permission(permission_code, target_organization_id)
can_access_workspace(workspace_id)
can_access_occurrence(occurrence_id)
is_platform_admin()
```

`has_permission` exige o escopo organizacional como argumento obrigatório: verifica a permissão apenas dentro de `target_organization_id`, nunca em qualquer organização ativa do usuário. Isso evita que um usuário com papel elevado na Organização A satisfaça, indevidamente, uma verificação de permissão relativa à Organização B.

`can_access_workspace` implementa o eixo **ONDE** (acesso efetivo a Workspace). Ver §5.7.

`can_access_occurrence` (Gate 13A — coexistência):

- `workspace_id IS NULL` → preserva regras legado (org / contratada / contrato / participante) + `is_platform_admin()`;
- `workspace_id IS NOT NULL` → mesmas regras legado **AND** `can_access_workspace(workspace_id)`.

RBAC (`has_permission`) permanece nas policies/RPCs (eixo **O QUE**).

Estratégia de backfill legado: script local de homologação `supabase/scripts/homologate-workspace-legacy-local.sql` (não é migration; não executar em produção). Produção exige Gate/aprovação PO separada.

---

# 24. Supabase Storage

## 24.1 Buckets iniciais

```text
occurrence-evidence
action-plan-evidence
profile-images
```

## 24.2 Estrutura de caminho

```text
{organization_id}/{occurrence_id}/{attachment_id}/{file_name}
```

## 24.3 Regras

- buckets privados por padrão;
- acesso por URL assinada;
- validação de tipo;
- validação de tamanho;
- acesso limitado à organização;
- uploads devem registrar metadados;
- arquivos órfãos devem ser evitados.

### `occurrence-evidence` (evidências)

- `public = false`
- `file_size_limit = 10 MiB` (`10485760`)
- `allowed_mime_types`: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Paths: ocorrência `{org}/{occurrence}/{attachment}/{attachment}.{ext}`; ação `{org}/action-items/{itemId}/{attachment}.{ext}`

---

# 25. Performance

## 25.1 Listagens

Listagens devem utilizar:

- paginação;
- filtros;
- ordenação;
- seleção apenas dos campos necessários;
- índices adequados.

A lista operacional de Paralisações Preventivas (Web/Mobile) deve usar a RPC `list_operational_occurrences` (filtro e paginação no servidor — PO-UX-10). Não filtrar no cliente sobre um array unbounded. Relatórios gerenciais continuam em `list_occurrences_report` (`report.read`).

Evitar carregar na listagem principal:

- todos os comentários;
- todos os anexos;
- todo o histórico;
- todas as notificações;
- toda a avaliação MDHO.

Esses dados devem ser carregados na tela de detalhes.

---

## 25.2 Dashboard

**Implementado (Sprint 3.2):** agregações via RPC `get_dashboard_kpis` — migration `20260820182000_create_dashboard_kpis_rpc.sql`. Cliente **não** recalcula KPIs de estoque/fluxo.

**Extensão:** `personal.myDueSoonActions` — migration `20260906180000_extend_dashboard_kpis_my_due_soon_actions.sql`. Mesma janela temporal de `managerial.dueSoonActionItems` (`p_due_soon_days`, default 3), restrita a `responsible_member_id` do membro autenticado.

### Índices (Sprint 3.2)

Migration `20260820180000_dashboard_indexes.sql`:

| Índice | Tabela | Colunas / filtro | Métricas |
|---|---|---|---|
| `action_items_org_due_open_idx` | `action_items` | `(organization_id, due_at)` WHERE status ∉ (`COMPLETED`, `CANCELLED`) | `overdueActionItems`, `dueSoonActionItems` |
| `notifications_org_pending_awareness_idx` | `notifications` | `(organization_id, requires_awareness, awareness_confirmed_at)` WHERE `requires_awareness` AND `awareness_confirmed_at IS NULL` | `pendingAwarenessOrg` |

**Não criados (EXPLAIN não justificou na escala de teste):** índice composto adicional em `occurrences(organization_id, status)` — índices existentes (`organization_id_status_idx`, `occurrences_status_idx`) já cobrem consultas relevantes; demais métricas usam índices pré-existentes (`action_items_responsible_member_idx`, `action_plans_org_status_idx`, `idx_mdho_assessments_org_status`, `notifications_recipient_read_created_idx`).

Views / materialized views / cache: **fora** 3.2 — priorizar RPC única antes de otimizações adicionais.

---

## 25.3 Relatórios gerenciais (Sprint 3.3)

**Implementado:** três relatórios paginados (Web) + auditoria de exportação. Contrato: `docs/decisions/REPORTS-DECISIONS.md` · tipos: `@safestop/types/report.ts` (`OccurrenceReportFilters`, `ActionItemReportFilters`, `AwarenessReportFilters`, `*ReportRow`, `ReportCursor`).

### RPCs operacionais

| RPC | Modo | Permissão gate | Notas |
|---|---|---|---|
| `list_occurrences_report` | `SECURITY INVOKER` | `report.read` + escopo `can_access_occurrence` | Paginação keyset; 19 colunas camelCase |
| `list_action_items_report` | `SECURITY INVOKER` | `report.read` + escopo plano | `isOverdue`/`isDueSoon` = fórmulas dashboard |
| `list_awareness_report` | `SECURITY DEFINER` | `report.read` (1ª linha) | Agregação org-wide de `notifications` |
| `log_report_export` | `SECURITY DEFINER` | `report.read` | Após montar arquivo; retorno `void` |

**Helpers (exibição cross-tenant, não expõem PII além de nome):** `resolve_profile_display_name`, `resolve_organization_display_name`, `resolve_member_display_name` — usados pelas RPCs de listagem; **não** são contrato client direto.

**Paginação comum:** retorno `{ items, nextCursor: { sortValue, id }, hasNext }`; `p_limit` 1–100 (default 20). Exportação client-side até `REPORT_EXPORT_MAX_ROWS` (10.000).

### Índices (Sprint 3.3)

Migration `20260822180000_reports_indexes.sql`:

| Índice | Tabela | Colunas | Uso |
|---|---|---|---|
| `occurrences_organization_id_contract_id_created_at_idx` | `occurrences` | `(organization_id, contract_id, created_at)` | Filtro por contrato em `list_occurrences_report` |

---

## 25.4 Lista operacional (PR-D1 / PO-UX-10)

**Implementado:** RPC `list_operational_occurrences` — migrations
`20260825220000_list_operational_occurrences.sql` +
`20260913190000_gate13c1_list_operational_occurrences_workspace.sql` (Gate 13C.1).

Lista de cards operacionais (não relatório). **Não** substitui `list_occurrences_report`.

| Item | Valor |
|---|---|
| Modo | `SECURITY INVOKER`, `search_path = ''` |
| Permissão gate | `occurrence.read` na org alvo (`is_platform_admin()` segue o mesmo padrão de membership das RPCs de reports). **Não** exige `report.read`. |
| Escopo de linha | `organization_id = p_organization_id` + `can_access_occurrence` + RLS de `occurrences` |
| Contexto Workspace (13C.1) | `p_workspace_id` opcional; filtro na CTE `base` **antes** do keyset/`LIMIT`/`hasNext`/`nextCursor` |
| Ordenação | `created_at desc, id desc` (fixa neste ciclo; sem `p_sort_field`) |
| Paginação | keyset `{ sortValue, id }` — **sem OFFSET**. `p_limit` clamp 1–100 (default 20). Busca `limit+1`; `hasNext` / `nextCursor` no último item da página. |
| Retorno | `{ items, nextCursor, hasNext }`. Cada item: `id`, `publicCode`, `title`, `status`, `severity`, `areaName`, `contractorOrganizationName`, `createdAt`, `createdByName` (camelCase, compatível com `OccurrenceSummary`). Sem colunas 1:N. Sem `statusFamily`. |

**Parâmetros:**

```text
p_organization_id uuid                — obrigatório
p_search text                         — trim; vazio = sem filtro. contains (ilike) em:
                                        public_code, task_description (atividade),
                                        location_description, ims_reference_code,
                                        areas.name, nome da contratada (helper)
p_area_id uuid
p_contractor_organization_id uuid
p_status text[]                       — enum OccurrenceStatus existente
p_severity text[]                     — LOW / MEDIUM / HIGH / CRITICAL
p_ims_reference_code text             — contains, mesmo espírito de PO-IMS-10
p_cursor jsonb                        — { sortValue, id }
p_limit integer                       — default 20, clamp 1–100
p_workspace_id uuid                   — DEFAULT NULL (Gate 13C.1; ao final da assinatura)
```

**`p_workspace_id` — segurança × contexto**

- `NULL` / omitido: comportamento legado Organization-scoped autorizado (pode incluir Workspaces A/B e ocorrências `workspace_id IS NULL`, conforme `can_access_occurrence`). Compatível com Web pré-13C.2, Mobile e callers ainda não convertidos.
- `NOT NULL`: contexto estrito. Exige `can_access_workspace(p_workspace_id)` + link ativo `organization_workspace_links` entre `p_organization_id` e `p_workspace_id`. Aplica `o.workspace_id = p_workspace_id` na CTE `base` **antes** da paginação. **Não** inclui legado `NULL` nem outros Workspaces, mesmo que o usuário tenha acesso legítimo a eles.
- Autorização continua em RLS / RBAC / `can_access_occurrence`. O parâmetro define o **contexto ativo**, não substitui a barreira de segurança.
- Consumo pelo Web = **Gate 13C.2** (este Gate 13C.1 só prepara a RPC/types).

Não existe `p_activity_id` (atividade não é FK).

**Diferença vs `list_occurrences_report`:** gate `occurrence.read` (Campo lista) vs `report.read`; busca textual ampla vs só `public_code`; 9 campos de card vs 19 colunas de relatório; ordenação fixa `created_at` vs allowlist de sort.

**Helpers reutilizados (não recriados):** `resolve_profile_display_name`, `resolve_organization_display_name`, `can_access_workspace`. Escopo estrito: nome apenas nos resolve_*.

**Índices novos:** nenhum nesta migration. Índices org/`workspace_id` (Gate 13A) cobrem o filtro de contexto.

**Rollback:**

```text
drop function public.list_operational_occurrences(
  uuid, text, uuid, uuid, text[], text[], text, jsonb, integer, uuid
);
-- recriar assinatura anterior (9 args) a partir de 20260825220000 se necessário
```

Não dropar os helpers `resolve_*_display_name`.

**GRANT:** `EXECUTE` para `authenticated` apenas. Sem grant para `anon`. `REVOKE ALL … FROM public`.

---

## 25.5 Domínio final additive (Gate 13X.1)

Migration: `20260913200000_gate13x1_contract_workspace_assignments_origin.sql`.

Decisão: `docs/decisions/ADR-006-organization-workspace-contract-domain.md`.

Schema additive apenas:

- `contracts.workspace_id` nullable;
- tabela `contract_assignments`;
- `occurrences.origin_organization_id` nullable.

**Não** altera `create_occurrence`, `can_access_occurrence`, `can_access_workspace`, `list_operational_occurrences`, areas/units, nem o significado de `occurrences.organization_id`.

`organization_contacts` permanece vigente.

---

## 25.6 `create_occurrence` — dois caminhos (Gate 13X.2)

Migration: `20260913210000_gate13x2_location_workspace_and_create_occurrence.sql`.

Addendum ADR-006.

### Caminho legado (`payload.workspace_id` ausente / NULL)

Comportamento anterior intacto:

- `contractor_organization_id` obrigatório;
- contrato ativo com `client_organization_id` = org atuante;
- `area.organization_id` = org atuante;
- `origin_organization_id` permanece NULL;
- `occurrences.organization_id` = org atuante.

### Caminho Workspace (`payload.workspace_id` NOT NULL)

- Org atuante (`payload.organization_id`) deve estar em `current_organization_ids()` e ter `occurrence.create`.
- `can_access_workspace` + link ativo org atuante ↔ WS.
- `origin_organization_id` = org atuante (servidor; origin do cliente é ignorado).
- `occurrences.organization_id` (legado) = `workspaces.owner_organization_id` se NOT NULL; senão fallback = org atuante (dívida 13X.6).
- Contrato: `contract_id` e `contractor_organization_id` juntos, ou ambos omitidos.
  - Se informados: contrato ativo, `contract.workspace_id` = payload, titular = `contractor_organization_id`, link ativo da titular no WS. **Não** exige `client_organization_id` = org atuante.
  - Ambos omitidos = equipe própria **somente** se a org atuante for o `owner_organization_id` do Workspace. Sem contrato Hydro-Hydro inventado. Owner NULL → equipe própria rejeitada.
- Dual-read area/unit/md: WS estrito se a coluna estiver preenchida; fallback `organization_id` = tenant só se `workspace_id` da entidade for NULL.
- JSON de sucesso inclui `origin_organization_id`.
- Notificação: `lookup_organization_member_id` na org **atuante**.

### Visibilidade da contratada (Gate 13X.2.1)

Migration: `20260913220000_gate13x21_contractor_workspace_visibility.sql`.

- `occurrences_select`: `can_access_occurrence` **e** `occurrence.read` no tenant **ou** origin **ou** contractor. Origin não é tenant.
- `list_operational_occurrences` com `p_workspace_id NOT NULL`:

```text
o.organization_id = p_organization_id
OR o.origin_organization_id = p_organization_id
OR o.contractor_organization_id = p_organization_id
```

  Caminho `p_workspace_id IS NULL` permanece `organization_id = p_organization_id`.
- SELECT de `areas` / `units` / `management_departments`: org própria, ou `can_access_workspace` se `workspace_id` preenchido, ou área/unit/md legado cujo `organization_id` é owner de um Workspace acessível. INSERT/UPDATE inalterados.
- FKs `occurrences_*_org_consistency` dropados; trigger `validate_occurrence_location_org_workspace`.

`can_access_occurrence` **não** muda o eixo de tenant.

### Leitura de detalhe (Gate 13X.2.2)

Migration: `20260913230000_gate13x22_occurrence_detail_read.sql`.

Helper `can_read_occurrence_record(occurrence_id)`: predicado da ROW (admin **ou** `can_access_occurrence` **e** `occurrence.read` no tenant **ou** origin **ou** contractor). **Não** autoriza mutação.

`can_read_occurrence_in_org(p_organization_id)` permanece: permission **nesta** Organization.

SELECT de detalhe alinhado ao helper: status_history, participants, decisions, comments, attachments, action_plans/items/anexos, mdho_assessments/selections, storage `occurrence-evidence` SELECT, `get_occurrence_timeline`, signed URLs de evidência.

INSERT/UPDATE/DELETE dos filhos e RPCs de mutação **não** mudam.

---

# 26. Views Futuras

Possíveis views:

```text
occurrence_summary_view
open_occurrences_view
notification_status_view
mdho_statistics_view
action_plan_progress_view
response_time_metrics_view
```

Não devem ser criadas antes de existir necessidade real.

---

# 27. Indicadores

O modelo deve permitir calcular:

- número de Paralisações Preventivas;
- ocorrências em avaliação;
- ocorrências Ver e Agir;
- Interdições Oficiais;
- tempo até primeira visualização;
- tempo até confirmação de ciência;
- tempo até avaliação;
- tempo até decisão;
- tempo até correção;
- tempo até liberação;
- ocorrências por empresa;
- ocorrências por área;
- ocorrências por criticidade;
- principais fatores MDHO;
- ações atrasadas;
- taxa de recorrência;
- quantidade de ocorrências aguardando registro IMS.

---

# 28. Dados Derivados

Evitar armazenar valores que podem ser calculados.

Exemplos:

```text
tempo_total_da_ocorrencia
tempo_para_avaliacao
tempo_para_liberacao
```

Esses valores podem ser obtidos pelas datas existentes.

Armazenar dados derivados somente quando houver necessidade comprovada.

---

# 29. Dados Sensíveis

Armazenar somente os dados pessoais necessários.

Evitar:

- documentos pessoais desnecessários;
- dados médicos;
- informações privadas sem função operacional;
- localização contínua;
- acesso irrestrito a telefones e e-mails.

A geolocalização será registrada apenas no contexto da ocorrência.

---

# 30. Seeds

O banco deverá possuir seeds de desenvolvimento.

Exemplos:

- organização de demonstração;
- unidade;
- áreas;
- contratada;
- usuários de teste;
- papéis;
- permissões;
- categorias MDHO;
- opções MDHO;
- ocorrência de exemplo;
- notificações de exemplo.

Seeds não devem utilizar dados reais sem autorização.

---

# 31. Migrations

Toda mudança estrutural deverá utilizar migrations versionadas.

Local:

```text
supabase/migrations/
```

Exemplos:

```text
202607090001_create_organizations.sql
202607090002_create_profiles.sql
202607090003_create_rbac.sql
202607090004_create_occurrences.sql
202607090005_create_mdho.sql
202607090006_create_notifications.sql
```

Não alterar manualmente o banco de produção.

---

# 32. Ordem Sugerida das Migrations

## Fase 1 — Fundação

```text
organizations
profiles
organization_members
roles
permissions
role_permissions
member_roles
```

## Fase 2 — Estrutura operacional

```text
units
areas
management_departments
contracts
organization_contacts
```

## Fase 3 — Ocorrências

```text
occurrences
occurrence_participants
occurrence_decisions
occurrence_status_history
occurrence_comments
occurrence_attachments
```

## Fase 4 — Comunicação

**Parcial (Sprint 3.1):**

```text
notification_events      ← implementado
notifications            ← implementado
```

**Pendente (Push / canais externos):**

```text
notification_deliveries
device_tokens
```

## Fase 5 — MDHO

```text
mdho_categories
mdho_options
mdho_assessments
mdho_selections
```

## Fase 6 — Plano de ação

```text
action_plans
action_items
action_item_attachments
```

## Fase 7 — Auditoria e segurança

```text
audit_events
RLS
database functions
triggers
indexes
```

---

# 33. Simplificações para o MVP

Para evitar complexidade excessiva, o primeiro MVP poderá:

- utilizar uma organização principal;
- possuir poucas áreas cadastradas;
- usar papéis fixos inicialmente;
- utilizar notificações internas e push;
- deixar e-mail para uma fase seguinte;
- não implementar WhatsApp;
- permitir registro manual do código IMS;
- não possuir qualquer integração com o IMS;
- não implementar offline completo no início;
- não criar materialized views;
- não criar múltiplos planos por ocorrência;
- não criar integração com sistemas corporativos;
- não criar workflows configuráveis complexos.

---

# 34. Entidades Obrigatórias do MVP

```text
organizations
profiles
organization_members
roles
permissions
role_permissions
member_roles

units
areas
organization_contacts

occurrences
occurrence_participants
occurrence_decisions
occurrence_status_history
occurrence_comments
occurrence_attachments

notification_events
notifications
notification_deliveries
device_tokens

mdho_categories
mdho_options
mdho_assessments
mdho_selections

action_plans
action_items
action_item_attachments

audit_events
```

`contracts` e `management_departments` poderão entrar no MVP caso sejam necessários no primeiro fluxo real.

---

# 35. Decisões Pendentes

Antes das migrations, definir:

1. formato final do código interno SafeStop;
2. obrigatoriedade de unidade e área;
3. uso obrigatório de contrato;
4. quais notificações exigem ciência;
5. perfis exatos do MVP;
6. permissões de cada perfil;
7. opções definitivas do MDHO;
8. regra de aprovação da liberação;
9. quantidade mínima de evidências;
10. tamanho máximo dos arquivos;
11. política de retenção;
12. formato final da referência IMS;
13. quem poderá registrar ou corrigir a referência IMS;
14. ~~se o registro IMS será obrigatório antes do plano de ação;~~ **Fechado (Sprint 3.0)** — ver abaixo;
15. ~~se o fluxo poderá seguir mesmo sem o código IMS informado;~~ **Fechado (Sprint 3.0)** — ver abaixo.

### Fechadas — IMS → Plano de Ação (Sprint 3.0)

Decisões oficiais: `docs/decisions/ACTION-PLAN-DECISIONS.md` PO-AP-1, PO-AP-12; `docs/decisions/IMS-REFERENCE-DECISIONS.md` PO-IMS-2.

| # | Pendência | Decisão fechada |
|---|---|---|
| **14** | IMS obrigatório antes do plano? | **Sim** — `create_action_plan` exige `ims_reference_code IS NOT NULL` + `EM_TRATATIVA` + ramo IO (PO-AP-1). Registro IMS continua **manual**; SafeStop **não** consulta IMS externo. |
| **15** | Fluxo sem código IMS? | **Acompanhamento** (leitura, timeline, comentários) pode continuar em `AGUARDANDO_REGISTRO_IMS`. **Plano de Ação** exige IMS registrado. Transição ocorrência `→ AGUARDANDO_VALIDACAO` **fora** 3.0 (PO-AP-12). Exceção futura “avanço sem IMS” permanece **fora** MVP (`workflow.md` §5.7 nota). |

---

# 36. Integrações Corporativas

No MVP, o SafeStop não terá integração com o IMS ou com qualquer outro sistema corporativo.

O código do IMS será digitado manualmente após sua emissão na plataforma externa.

O SafeStop armazenará esse código apenas como referência operacional.

Não haverá:

- API de integração;
- sincronização;
- consulta externa;
- importação automática;
- exportação automática;
- webhooks;
- validação do registro externo;
- atualização automática de status.

Qualquer integração futura deverá ser tratada como uma funcionalidade separada e somente poderá ser avaliada quando existir:

- autorização formal;
- acesso oficial à API;
- documentação técnica;
- necessidade comprovada;
- benefício claro para o produto.

---

# 37. Fonte da Verdade

O modelo de dados deve respeitar:

```text
docs/product.md
docs/architecture.md
docs/workflow.md
docs/notifications.md
docs/decisions/
```

Em caso de conflito:

1. segurança;
2. fluxo de negócio;
3. integridade dos dados;
4. decisão arquitetural mais recente;
5. implementação existente.

---

# 38. Regra Final

O banco de dados do SafeStop deve ser robusto o suficiente para garantir segurança e rastreabilidade, mas simples o suficiente para não transformar a aplicação em um sistema burocrático.

A modelagem deve apoiar o propósito principal do produto:

> comunicar rapidamente, registrar quem tomou ciência, acompanhar a decisão e manter toda a ocorrência rastreável até sua conclusão.

O SafeStop não substitui o IMS.

O código do IMS será apenas digitado manualmente e armazenado como uma referência textual de acompanhamento, sem qualquer ligação técnica entre as plataformas.
