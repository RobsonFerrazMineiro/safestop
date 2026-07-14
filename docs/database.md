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
name
code
address
latitude
longitude
is_active
created_at
updated_at
```

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

---

## 7.3 `management_departments`

Representa gerências, coordenações ou estruturas responsáveis.

### Campos

```text
id
organization_id
unit_id
name
code
is_active
created_at
updated_at
```

---

## 7.4 `contracts`

Representa o relacionamento contratual entre contratante e contratada.

### Campos

```text
id
client_organization_id
contractor_organization_id
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

## 17.1 Princípio

O sistema deve separar:

- o evento de negócio;
- a notificação destinada ao usuário;
- a tentativa de entrega por canal.

---

## 17.2 `notification_events`

Representa um evento que exige comunicação.

### Exemplos

```text
OCCURRENCE_CREATED
OCCURRENCE_ASSIGNED
DECISION_REQUIRED
VER_AND_ACT_REQUIRED
INTERDICTION_CONFIRMED
MDHO_APPROVAL_REQUIRED
MDHO_RETURNED
IMS_REFERENCE_REGISTERED
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

Representa cada tentativa de entrega por canal.

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

Armazena tokens para notificações push.

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
    └── audit_events

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
has_permission(permission_code, target_organization_id)
can_access_occurrence(occurrence_id)
is_platform_admin()
```

`has_permission` exige o escopo organizacional como argumento obrigatório: verifica a permissão apenas dentro de `target_organization_id`, nunca em qualquer organização ativa do usuário. Isso evita que um usuário com papel elevado na Organização A satisfaça, indevidamente, uma verificação de permissão relativa à Organização B.

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

---

# 25. Performance

## 25.1 Listagens

Listagens devem utilizar:

- paginação;
- filtros;
- ordenação;
- seleção apenas dos campos necessários;
- índices adequados.

Evitar carregar na listagem principal:

- todos os comentários;
- todos os anexos;
- todo o histórico;
- todas as notificações;
- toda a avaliação MDHO.

Esses dados devem ser carregados na tela de detalhes.

---

## 25.2 Dashboard

Consultas do dashboard devem evitar processamento excessivo no cliente.

Poderão ser utilizadas futuramente:

- views;
- funções SQL;
- agregações;
- materialized views;
- cache.

No MVP, priorizar consultas simples.

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

```text
notification_events
notifications
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
14. se o registro IMS será obrigatório antes do plano de ação;
15. se o fluxo poderá seguir mesmo sem o código IMS informado.

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
