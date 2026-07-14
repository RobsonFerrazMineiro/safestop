-- ============================================================================
-- SafeStop — Sprint 1.5: Fundação do Banco de Dados
-- ============================================================================
-- Fonte da verdade: docs/database.md (Seções 4 a 7, 23, 31 e 32 — Fase 1 e 2)
--
-- Escopo desta migration (Fase 1 — Fundação + Fase 2 — Estrutura operacional):
--   organizations, profiles, organization_members,
--   roles, permissions, role_permissions, member_roles,
--   units, areas, management_departments, contracts, organization_contacts
--
-- Fora de escopo (Sprints futuras): occurrences, MDHO, action_plans,
-- notifications, audit_events, Storage, Realtime, Edge Functions.
--
-- Convenções (docs/database.md §3, .cursor/rules/004-supabase.mdc):
--   snake_case; UUID primary keys via gen_random_uuid() (nativo no PostgreSQL
--   17, sem necessidade de extensão pgcrypto); timestamptz em UTC;
--   created_at/updated_at padronizados; enums implementados como texto com
--   CHECK (mais simples de evoluir do que tipos ENUM nativos).
-- ============================================================================


-- ============================================================================
-- 1. Função utilitária — updated_at
-- ============================================================================
-- Função única e reutilizável para manter updated_at sincronizado.
-- Aplicada via trigger apenas nas tabelas que possuem a coluna updated_at.

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Atualiza automaticamente updated_at antes de qualquer UPDATE. Reutilizada por trigger em todas as tabelas com essa coluna.';


-- ============================================================================
-- 2. organizations (docs/database.md §5.1)
-- ============================================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  trade_name text,
  document_number text,
  organization_type text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_organization_type_check
    check (organization_type in ('CLIENT', 'CONTRACTOR', 'PLATFORM')),
  constraint organizations_name_not_blank check (btrim(name) <> '')
);

comment on table public.organizations is
  'Organização cadastrada no SafeStop: contratante, contratada, cliente ou administradora da plataforma (docs/database.md §5.1).';
comment on column public.organizations.organization_type is
  'CLIENT | CONTRACTOR | PLATFORM — docs/database.md §5.1.';

create index organizations_organization_type_idx on public.organizations (organization_type);
create index organizations_is_active_idx on public.organizations (is_active);

create trigger set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 3. profiles (docs/database.md §5.2)
-- ============================================================================
-- Complementa auth.users. Não duplica credenciais. Não possui trigger
-- automático de criação nesta Sprint (não definido em docs/database.md).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  avatar_path text,
  is_active boolean not null default true,
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_not_blank check (btrim(full_name) <> '')
);

comment on table public.profiles is
  'Perfil de domínio complementar ao auth.users. Não define permissões por si só (docs/database.md §5.2).';
comment on column public.profiles.email is
  'Cópia do e-mail principal de auth.users para facilitar consultas. auth.users permanece a fonte oficial.';

create index profiles_email_idx on public.profiles (email);
create index profiles_is_active_idx on public.profiles (is_active);

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 4. organization_members (docs/database.md §5.3)
-- ============================================================================

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  employee_number text,
  job_title text,
  membership_type text not null,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_membership_type_check
    check (membership_type in ('INTERNAL', 'CONTRACTOR', 'EXTERNAL', 'PLATFORM_ADMIN')),
  -- Impede vínculo duplicado do mesmo usuário na mesma organização.
  -- Não documentado literalmente em database.md, mas decorre diretamente da
  -- integridade relacional exigida (ver relatório final — Decisões).
  constraint organization_members_org_profile_unique unique (organization_id, profile_id),
  -- Suporta chaves estrangeiras compostas (isolamento multi-tenant) em
  -- organization_contacts.
  constraint organization_members_id_org_unique unique (id, organization_id)
);

comment on table public.organization_members is
  'Vínculo de um usuário (profile) a uma organização (docs/database.md §5.3).';
comment on column public.organization_members.membership_type is
  'INTERNAL | CONTRACTOR | EXTERNAL | PLATFORM_ADMIN — docs/database.md §5.3.';

create index organization_members_organization_id_idx on public.organization_members (organization_id);
create index organization_members_profile_id_idx on public.organization_members (profile_id);
create index organization_members_is_active_idx on public.organization_members (is_active);

create trigger set_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 5. roles (docs/database.md §6.1)
-- ============================================================================

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete restrict,
  name text not null,
  description text,
  is_system_role boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_name_not_blank check (btrim(name) <> '')
);

comment on table public.roles is
  'Papel operacional. organization_id nulo representa papel global do catálogo oficial (docs/database.md §6.1).';

-- Impede duplicidade de nome entre os papéis globais do catálogo oficial.
-- Necessário para permitir seed idempotente do catálogo (docs/database.md §30).
create unique index roles_global_name_unique on public.roles (name) where organization_id is null;
create index roles_organization_id_idx on public.roles (organization_id);
create index roles_is_active_idx on public.roles (is_active);

create trigger set_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 6. permissions (docs/database.md §6.2)
-- ============================================================================

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint permissions_code_unique unique (code),
  constraint permissions_code_not_blank check (btrim(code) <> '')
);

comment on table public.permissions is
  'Catálogo de permissões atômicas no padrão resource.action (docs/database.md §6.2).';


-- ============================================================================
-- 7. role_permissions (docs/database.md §6.3)
-- ============================================================================

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint role_permissions_role_permission_unique unique (role_id, permission_id)
);

comment on table public.role_permissions is
  'Relaciona papéis e permissões (docs/database.md §6.3).';

create index role_permissions_role_id_idx on public.role_permissions (role_id);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);


-- ============================================================================
-- 8. member_roles (docs/database.md §6.4)
-- ============================================================================

create table public.member_roles (
  id uuid primary key default gen_random_uuid(),
  organization_member_id uuid not null references public.organization_members (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  constraint member_roles_member_role_unique unique (organization_member_id, role_id)
);

comment on table public.member_roles is
  'Relaciona um vínculo organizacional (organization_member) a um papel (docs/database.md §6.4).';

create index member_roles_organization_member_id_idx on public.member_roles (organization_member_id);
create index member_roles_role_id_idx on public.member_roles (role_id);

-- Impede atribuir a um vínculo organizacional um papel personalizado
-- (roles.organization_id not null) de uma organização diferente da sua
-- (docs/database.md §6.1 e §6.4). Papéis globais do catálogo oficial
-- (organization_id null) permanecem atribuíveis a qualquer organização.
-- Não é possível expressar essa regra como chave estrangeira composta
-- simples porque envolve duas tabelas relacionadas indiretamente
-- (roles e organization_members), por isso o uso de trigger dedicado.
-- Sem security definer: leitura de roles/organization_members deve
-- respeitar RLS normalmente.
create function public.validate_member_role_org()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_role_organization_id uuid;
  v_member_organization_id uuid;
begin
  select r.organization_id into v_role_organization_id
  from public.roles r
  where r.id = new.role_id;

  if v_role_organization_id is not null then
    select om.organization_id into v_member_organization_id
    from public.organization_members om
    where om.id = new.organization_member_id;

    if v_member_organization_id is null or v_member_organization_id <> v_role_organization_id then
      raise exception
        'role_id (%) pertence a uma organização diferente do organization_member_id (%)',
        new.role_id, new.organization_member_id;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.validate_member_role_org() is
  'Garante que papéis personalizados (roles.organization_id not null) só sejam atribuídos a membros da mesma organização (isolamento multi-tenant — docs/database.md §6.4).';

create trigger validate_member_role_org
  before insert or update on public.member_roles
  for each row execute function public.validate_member_role_org();


-- ============================================================================
-- 9. units (docs/database.md §7.1)
-- ============================================================================

create table public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null,
  code text,
  address text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint units_name_not_blank check (btrim(name) <> ''),
  -- Suporta chaves estrangeiras compostas (isolamento multi-tenant) em
  -- areas, management_departments e contracts.
  constraint units_id_org_unique unique (id, organization_id)
);

comment on table public.units is
  'Unidade, planta ou complexo industrial de uma organização (docs/database.md §7.1).';

create unique index units_org_code_unique on public.units (organization_id, code) where code is not null;
create index units_organization_id_idx on public.units (organization_id);
create index units_is_active_idx on public.units (is_active);

create trigger set_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 10. areas (docs/database.md §7.2)
-- ============================================================================

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  unit_id uuid not null references public.units (id) on delete restrict,
  name text not null,
  code text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint areas_name_not_blank check (btrim(name) <> ''),
  -- Garante que a área pertence à mesma organização de sua unidade,
  -- impedindo associação entre organizações (isolamento multi-tenant).
  constraint areas_unit_org_consistency
    foreign key (unit_id, organization_id) references public.units (id, organization_id),
  -- Suporta chave estrangeira composta (isolamento multi-tenant) em
  -- organization_contacts.
  constraint areas_id_org_unique unique (id, organization_id)
);

comment on table public.areas is
  'Área operacional dentro de uma unidade (docs/database.md §7.2). Uma área pertence a uma unidade e herda sua organização.';

create unique index areas_org_code_unique on public.areas (organization_id, code) where code is not null;
create index areas_organization_id_idx on public.areas (organization_id);
create index areas_unit_id_idx on public.areas (unit_id);
create index areas_is_active_idx on public.areas (is_active);

create trigger set_updated_at
  before update on public.areas
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 11. management_departments (docs/database.md §7.3)
-- ============================================================================

create table public.management_departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  unit_id uuid not null references public.units (id) on delete restrict,
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint management_departments_name_not_blank check (btrim(name) <> ''),
  constraint management_departments_unit_org_consistency
    foreign key (unit_id, organization_id) references public.units (id, organization_id),
  -- Suporta chave estrangeira composta (isolamento multi-tenant) em
  -- organization_contacts.
  constraint management_departments_id_org_unique unique (id, organization_id)
);

comment on table public.management_departments is
  'Gerência, coordenação ou estrutura responsável dentro de uma unidade (docs/database.md §7.3).';

create unique index management_departments_org_code_unique on public.management_departments (organization_id, code) where code is not null;
create index management_departments_organization_id_idx on public.management_departments (organization_id);
create index management_departments_unit_id_idx on public.management_departments (unit_id);

create trigger set_updated_at
  before update on public.management_departments
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 12. contracts (docs/database.md §7.4)
-- ============================================================================

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  client_organization_id uuid not null references public.organizations (id) on delete restrict,
  contractor_organization_id uuid not null references public.organizations (id) on delete restrict,
  unit_id uuid references public.units (id) on delete restrict,
  contract_number text,
  name text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_name_not_blank check (btrim(name) <> ''),
  constraint contracts_client_contractor_distinct
    check (client_organization_id <> contractor_organization_id),
  constraint contracts_ends_after_starts check (ends_at is null or ends_at >= starts_at),
  -- Garante que, quando informada, a unidade pertence à organização cliente
  -- do contrato (isolamento multi-tenant).
  constraint contracts_unit_client_org_consistency
    foreign key (unit_id, client_organization_id) references public.units (id, organization_id)
);

comment on table public.contracts is
  'Relacionamento contratual entre organização cliente e organização contratada (docs/database.md §7.4).';

create unique index contracts_client_org_number_unique on public.contracts (client_organization_id, contract_number) where contract_number is not null;
create index contracts_client_organization_id_idx on public.contracts (client_organization_id);
create index contracts_contractor_organization_id_idx on public.contracts (contractor_organization_id);
create index contracts_unit_id_idx on public.contracts (unit_id);
create index contracts_is_active_idx on public.contracts (is_active);

create trigger set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 13. organization_contacts (docs/database.md §7.5)
-- ============================================================================

create table public.organization_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  organization_member_id uuid not null references public.organization_members (id) on delete restrict,
  unit_id uuid references public.units (id) on delete restrict,
  area_id uuid references public.areas (id) on delete restrict,
  management_department_id uuid references public.management_departments (id) on delete restrict,
  contract_id uuid references public.contracts (id) on delete restrict,
  contact_type text not null,
  priority smallint not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_contacts_contact_type_check check (
    contact_type in (
      'CONTRACTOR_LEADERSHIP',
      'CONTRACT_INSPECTOR',
      'HSE_SUPERVISOR',
      'HSE_LEADERSHIP',
      'AREA_MANAGER',
      'CONTRACT_MANAGER',
      'COMPANY_RESPONSIBLE',
      'CUSTOM'
    )
  ),
  constraint organization_contacts_priority_positive check (priority > 0),
  -- Garante que o responsável configurado é membro da mesma organização do
  -- contato (isolamento multi-tenant).
  constraint organization_contacts_member_org_consistency
    foreign key (organization_member_id, organization_id) references public.organization_members (id, organization_id),
  -- Garante que unit_id/area_id/management_department_id, quando informados,
  -- pertencem à mesma organização do contato (isolamento multi-tenant). Chaves
  -- estrangeiras compostas com qualquer lado nulo são corretamente ignoradas
  -- pelo PostgreSQL (colunas opcionais). A consistência de contract_id é
  -- validada por trigger dedicado (ver validate_organization_contact_contract_org),
  -- pois contracts possui duas organizações (cliente e contratada).
  constraint organization_contacts_unit_org_consistency
    foreign key (unit_id, organization_id) references public.units (id, organization_id),
  constraint organization_contacts_area_org_consistency
    foreign key (area_id, organization_id) references public.areas (id, organization_id),
  constraint organization_contacts_management_department_org_consistency
    foreign key (management_department_id, organization_id) references public.management_departments (id, organization_id)
);

comment on table public.organization_contacts is
  'Responsável que deve receber comunicações por organização, área, gerência ou contrato (docs/database.md §7.5).';
comment on column public.organization_contacts.contact_type is
  'CONTRACTOR_LEADERSHIP | CONTRACT_INSPECTOR | HSE_SUPERVISOR | HSE_LEADERSHIP | AREA_MANAGER | CONTRACT_MANAGER | COMPANY_RESPONSIBLE | CUSTOM — docs/database.md §7.5.';

create index organization_contacts_organization_id_idx on public.organization_contacts (organization_id);
create index organization_contacts_organization_member_id_idx on public.organization_contacts (organization_member_id);
create index organization_contacts_unit_id_idx on public.organization_contacts (unit_id);
create index organization_contacts_area_id_idx on public.organization_contacts (area_id);
create index organization_contacts_management_department_id_idx on public.organization_contacts (management_department_id);
create index organization_contacts_contract_id_idx on public.organization_contacts (contract_id);
create index organization_contacts_contact_type_idx on public.organization_contacts (contact_type);

create trigger set_updated_at
  before update on public.organization_contacts
  for each row execute function public.set_updated_at();

-- contracts possui duas organizações (client_organization_id e
-- contractor_organization_id) e um contato pode legitimamente pertencer a
-- qualquer um dos lados (ex.: CONTRACT_INSPECTOR do lado cliente,
-- CONTRACTOR_LEADERSHIP do lado contratada — docs/database.md §7.5). Por isso
-- essa consistência não pode ser expressa como chave estrangeira composta
-- simples e depende de trigger dedicado. Sem security definer: a leitura de
-- contracts deve respeitar RLS normalmente, pois quem insere/atualiza o
-- contato já precisa ter organization_id dentro de current_organization_ids(),
-- o que garante visibilidade do contrato pela policy contracts_select.
create function public.validate_organization_contact_contract_org()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_client_organization_id uuid;
  v_contractor_organization_id uuid;
begin
  if new.contract_id is null then
    return new;
  end if;

  select c.client_organization_id, c.contractor_organization_id
    into v_client_organization_id, v_contractor_organization_id
  from public.contracts c
  where c.id = new.contract_id;

  if v_client_organization_id is null then
    raise exception 'contract_id % não corresponde a um contrato acessível', new.contract_id;
  end if;

  if new.organization_id <> v_client_organization_id
     and new.organization_id <> v_contractor_organization_id then
    raise exception
      'organization_id (%) do contato deve corresponder à organização cliente ou contratada do contrato (%)',
      new.organization_id, new.contract_id;
  end if;

  return new;
end;
$$;

comment on function public.validate_organization_contact_contract_org() is
  'Garante que organization_contacts.organization_id corresponde à organização cliente ou contratada do contract_id informado, quando presente (isolamento multi-tenant — docs/database.md §7.5).';

create trigger validate_contract_org
  before insert or update on public.organization_contacts
  for each row execute function public.validate_organization_contact_contract_org();


-- ============================================================================
-- 14. Funções auxiliares de segurança (docs/database.md §23.3)
-- ============================================================================
-- security definer + search_path fixo para evitar recursão de RLS ao
-- consultar organization_members / member_roles / role_permissions, que
-- também possuem RLS habilitado.

create function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid();
$$;

comment on function public.current_profile_id() is
  'Retorna o profile_id (= auth.uid()) do usuário autenticado atual (docs/database.md §23.3).';

create function public.current_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select om.organization_id
  from public.organization_members om
  where om.profile_id = auth.uid()
    and om.is_active = true;
$$;

comment on function public.current_organization_ids() is
  'Retorna as organizações onde o usuário autenticado possui vínculo ativo (docs/database.md §23.3).';

create function public.has_permission(
  permission_code text,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    join public.member_roles mr on mr.organization_member_id = om.id
    join public.roles r on r.id = mr.role_id and r.is_active = true
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where om.profile_id = auth.uid()
      and om.organization_id = target_organization_id
      and om.is_active = true
      and p.code = permission_code
  );
$$;

comment on function public.has_permission(text, uuid) is
  'Verifica se o usuário autenticado possui a permissão informada dentro da organização especificada em target_organization_id (docs/database.md §23.3). O escopo organizacional é obrigatório e faz parte da própria verificação — corrigido nesta Sprint para eliminar vazamento de privilégio entre organizações (cross-tenant), quando o predicado de vínculo organizacional e o de permissão eram avaliados de forma independente.';

create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.profile_id = auth.uid()
      and om.is_active = true
      and om.membership_type = 'PLATFORM_ADMIN'
  );
$$;

comment on function public.is_platform_admin() is
  'Verifica se o usuário autenticado possui vínculo ativo do tipo PLATFORM_ADMIN em qualquer organização (docs/database.md §23.3).';

-- can_access_occurrence(occurrence_id) está documentada em docs/database.md
-- §23.3, mas depende da tabela occurrences, fora do escopo desta Sprint.
-- Pendência registrada no relatório final.


-- ============================================================================
-- 15. Row Level Security
-- ============================================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.member_roles enable row level security;
alter table public.units enable row level security;
alter table public.areas enable row level security;
alter table public.management_departments enable row level security;
alter table public.contracts enable row level security;
alter table public.organization_contacts enable row level security;

-- ----------------------------------------------------------------------------
-- organizations
-- ----------------------------------------------------------------------------
-- SELECT: usuário com vínculo ativo na organização, ou administrador de plataforma.
create policy organizations_select on public.organizations
  for select to authenticated
  using (
    id in (select public.current_organization_ids())
    or public.is_platform_admin()
  );

-- INSERT: apenas administrador de plataforma (criação de organização não
-- pertence ao escopo de nenhuma organização existente).
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (public.is_platform_admin());

-- UPDATE: administrador de plataforma, ou membro com permissão
-- organization.manage dentro da própria organização.
create policy organizations_update on public.organizations
  for update to authenticated
  using (
    public.is_platform_admin()
    or (id in (select public.current_organization_ids()) and public.has_permission('organization.manage', id))
  )
  with check (
    public.is_platform_admin()
    or (id in (select public.current_organization_ids()) and public.has_permission('organization.manage', id))
  );

-- Nenhuma policy de DELETE: exclusão física negada por padrão
-- (docs/database.md §3.5 — organizações não devem ser excluídas fisicamente).

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
-- SELECT: o próprio perfil, ou administrador de plataforma.
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());

-- UPDATE: apenas o próprio perfil.
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Sem policy de INSERT: a criação de perfil não está definida nesta Sprint
-- (docs/database.md §5.2 não define trigger automático). Pendência registrada.
-- Sem policy de DELETE: exclusão física negada por padrão.

-- profiles_select (acima) restringe a leitura direta da tabela ao próprio
-- perfil e ao administrador de plataforma — phone/email nunca são expostos a
-- terceiros pela tabela base (minimização de dados, docs/database.md §5.2 e
-- .cursor/rules/006-security.mdc). Isso cria uma lacuna funcional conhecida:
-- um Administrador da Empresa com a permissão user.manage não consegue ver
-- nome/cargo de colegas da própria organização na tela de gestão de
-- usuários, mesmo já vendo os vínculos em organization_members
-- (organization_members_select). A exposição resumida de dados de perfil
-- para outros papéis (ex.: full_name, job_title, avatar_path, sem
-- phone/email) será resolvida futuramente por view ou RPC específica, a ser
-- definida e aprovada formalmente. Nenhuma view ou RPC foi criada nesta
-- Sprint — pendência registrada no relatório final.

-- ----------------------------------------------------------------------------
-- organization_members
-- ----------------------------------------------------------------------------
-- SELECT: membros da mesma organização (visibilidade de colegas), ou o
-- próprio vínculo, ou administrador de plataforma.
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    organization_id in (select public.current_organization_ids())
    or profile_id = auth.uid()
    or public.is_platform_admin()
  );

-- INSERT/UPDATE: administrador de plataforma, ou membro com permissão
-- user.manage dentro da própria organização.
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('user.manage', organization_id))
  );

create policy organization_members_update on public.organization_members
  for update to authenticated
  using (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('user.manage', organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('user.manage', organization_id))
  );

-- Sem policy de DELETE: desvinculação deve ocorrer via is_active/left_at,
-- nunca exclusão física.

-- ----------------------------------------------------------------------------
-- roles
-- ----------------------------------------------------------------------------
-- SELECT: papéis globais (catálogo oficial) são visíveis a todo usuário
-- autenticado; papéis específicos de organização são visíveis a membros
-- daquela organização ou ao administrador de plataforma.
create policy roles_select on public.roles
  for select to authenticated
  using (
    organization_id is null
    or organization_id in (select public.current_organization_ids())
    or public.is_platform_admin()
  );

-- INSERT/UPDATE: administrador de plataforma, ou membro com permissão
-- user.manage dentro da própria organização (papéis personalizados).
create policy roles_insert on public.roles
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (organization_id is not null and organization_id in (select public.current_organization_ids()) and public.has_permission('user.manage', organization_id))
  );

create policy roles_update on public.roles
  for update to authenticated
  using (
    public.is_platform_admin()
    or (organization_id is not null and organization_id in (select public.current_organization_ids()) and public.has_permission('user.manage', organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id is not null and organization_id in (select public.current_organization_ids()) and public.has_permission('user.manage', organization_id))
  );

-- Sem policy de DELETE: papéis em uso não devem ser excluídos fisicamente.

-- ----------------------------------------------------------------------------
-- permissions
-- ----------------------------------------------------------------------------
-- SELECT: catálogo de permissões é legível por qualquer usuário autenticado
-- (não é dado sensível nem organizacional).
create policy permissions_select on public.permissions
  for select to authenticated
  using (true);

-- Sem policies de INSERT/UPDATE/DELETE: o catálogo de permissões é gerido
-- exclusivamente via migration/seed, nunca pelo cliente.

-- ----------------------------------------------------------------------------
-- role_permissions
-- ----------------------------------------------------------------------------
-- SELECT: visível quando o papel relacionado é visível.
create policy role_permissions_select on public.role_permissions
  for select to authenticated
  using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and (
          r.organization_id is null
          or r.organization_id in (select public.current_organization_ids())
          or public.is_platform_admin()
        )
    )
  );

-- INSERT/UPDATE: administrador de plataforma, ou permissão user.manage sobre
-- o papel de organização relacionado.
create policy role_permissions_insert on public.role_permissions
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.organization_id is not null
        and r.organization_id in (select public.current_organization_ids())
        and public.has_permission('user.manage', r.organization_id)
    )
  );

-- Sem policy de UPDATE: associações são substituídas via insert/delete, não
-- atualizadas em campo.
-- Sem policy de DELETE nesta Sprint: gestão de catálogo de papéis do
-- sistema permanece via migration/seed; remoção de papéis personalizados
-- será tratada quando o fluxo de administração for implementado.

-- ----------------------------------------------------------------------------
-- member_roles
-- ----------------------------------------------------------------------------
-- SELECT: visível a membros da mesma organização do vínculo, ao próprio
-- usuário, ou ao administrador de plataforma.
create policy member_roles_select on public.member_roles
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members om
      where om.id = member_roles.organization_member_id
        and (
          om.organization_id in (select public.current_organization_ids())
          or om.profile_id = auth.uid()
        )
    )
  );

-- INSERT: administrador de plataforma, ou permissão user.manage sobre a
-- organização do vínculo.
create policy member_roles_insert on public.member_roles
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members om
      where om.id = member_roles.organization_member_id
        and om.organization_id in (select public.current_organization_ids())
        and public.has_permission('user.manage', om.organization_id)
    )
  );

-- Sem policy de UPDATE/DELETE nesta Sprint: revogação de papel será tratada
-- por função de backend controlada quando o fluxo de administração de
-- usuários for implementado.

-- ----------------------------------------------------------------------------
-- units / areas / management_departments
-- ----------------------------------------------------------------------------
create policy units_select on public.units
  for select to authenticated
  using (organization_id in (select public.current_organization_ids()) or public.is_platform_admin());

create policy units_insert on public.units
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('organization.manage', organization_id))
  );

create policy units_update on public.units
  for update to authenticated
  using (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('organization.manage', organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('organization.manage', organization_id))
  );

create policy areas_select on public.areas
  for select to authenticated
  using (organization_id in (select public.current_organization_ids()) or public.is_platform_admin());

create policy areas_insert on public.areas
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('area.manage', organization_id))
  );

create policy areas_update on public.areas
  for update to authenticated
  using (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('area.manage', organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('area.manage', organization_id))
  );

create policy management_departments_select on public.management_departments
  for select to authenticated
  using (organization_id in (select public.current_organization_ids()) or public.is_platform_admin());

create policy management_departments_insert on public.management_departments
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('organization.manage', organization_id))
  );

create policy management_departments_update on public.management_departments
  for update to authenticated
  using (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('organization.manage', organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('organization.manage', organization_id))
  );

-- Sem policies de DELETE em units/areas/management_departments: inativação
-- via is_active, nunca exclusão física (docs/database.md §3.5 e §7.2).

-- ----------------------------------------------------------------------------
-- contracts
-- ----------------------------------------------------------------------------
-- Visível para ambas as partes do contrato (cliente e contratada).
create policy contracts_select on public.contracts
  for select to authenticated
  using (
    client_organization_id in (select public.current_organization_ids())
    or contractor_organization_id in (select public.current_organization_ids())
    or public.is_platform_admin()
  );

create policy contracts_insert on public.contracts
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (client_organization_id in (select public.current_organization_ids()) and public.has_permission('contract.manage', client_organization_id))
  );

create policy contracts_update on public.contracts
  for update to authenticated
  using (
    public.is_platform_admin()
    or (client_organization_id in (select public.current_organization_ids()) and public.has_permission('contract.manage', client_organization_id))
  )
  with check (
    public.is_platform_admin()
    or (client_organization_id in (select public.current_organization_ids()) and public.has_permission('contract.manage', client_organization_id))
  );

-- Sem policy de DELETE: contratos encerrados permanecem no histórico
-- (docs/database.md §7.4).

-- ----------------------------------------------------------------------------
-- organization_contacts
-- ----------------------------------------------------------------------------
create policy organization_contacts_select on public.organization_contacts
  for select to authenticated
  using (organization_id in (select public.current_organization_ids()) or public.is_platform_admin());

create policy organization_contacts_insert on public.organization_contacts
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('organization.manage', organization_id))
  );

create policy organization_contacts_update on public.organization_contacts
  for update to authenticated
  using (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('organization.manage', organization_id))
  )
  with check (
    public.is_platform_admin()
    or (organization_id in (select public.current_organization_ids()) and public.has_permission('organization.manage', organization_id))
  );

-- Sem policy de DELETE: inativação via is_active.


-- ============================================================================
-- 16. Concessões de acesso à Data API (obrigatório desde Supabase CLI 2.106+)
-- ============================================================================
-- Desde 30/05/2026 o Supabase deixou de expor automaticamente novas tabelas
-- do schema public à Data API (anon/authenticated). É necessário conceder
-- acesso explícito por tabela; o isolamento e as regras de negócio
-- continuam sendo garantidos pelas policies de RLS acima, nunca pelo GRANT.
-- Nenhuma tabela desta migration concede acesso ao papel anon: todo o
-- domínio de identidade e organização exige autenticação.

grant usage on schema public to authenticated;

grant select, insert, update on public.organizations to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.organization_members to authenticated;
grant select, insert, update on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select, insert on public.role_permissions to authenticated;
grant select, insert on public.member_roles to authenticated;
grant select, insert, update on public.units to authenticated;
grant select, insert, update on public.areas to authenticated;
grant select, insert, update on public.management_departments to authenticated;
grant select, insert, update on public.contracts to authenticated;
grant select, insert, update on public.organization_contacts to authenticated;
