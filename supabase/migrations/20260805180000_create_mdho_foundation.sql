-- ============================================================================
-- SafeStop — Sprint 2.6: MDHO foundation (Fase 5 — docs/database.md §14.2–14.5)
-- ============================================================================
-- Referências: docs/decisions/MDHO-DECISIONS.md (PO-MDHO-1…PO-MDHO-28)
-- SEM notification_events; SEM IMS; SEM action_plans.
-- Mutations somente via RPC SECURITY DEFINER (migration 20260805190000).
-- ============================================================================

-- ============================================================================
-- 1. mdho_categories
-- ============================================================================

create table public.mdho_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete restrict,
  code text not null,
  name text not null,
  description text,
  allows_multiple boolean not null default true,
  requires_selection boolean not null default true,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mdho_categories_code_not_blank check (btrim(code) <> ''),
  constraint mdho_categories_name_not_blank check (btrim(name) <> '')
);

comment on table public.mdho_categories is
  'Categorias do catálogo MDHO (docs/database.md §14.2). organization_id NULL = global.';

create unique index mdho_categories_global_code_unique
  on public.mdho_categories (code)
  where organization_id is null;

create unique index mdho_categories_org_code_unique
  on public.mdho_categories (organization_id, code)
  where organization_id is not null;

create index idx_mdho_categories_active_order
  on public.mdho_categories (display_order)
  where is_active = true;

create trigger set_updated_at
  before update on public.mdho_categories
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 2. mdho_options
-- ============================================================================

create table public.mdho_options (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete restrict,
  category_id uuid not null references public.mdho_categories (id) on delete restrict,
  code text not null,
  label text not null,
  description text,
  allows_detail boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mdho_options_code_not_blank check (btrim(code) <> ''),
  constraint mdho_options_label_not_blank check (btrim(label) <> ''),
  constraint mdho_options_category_code_unique unique (category_id, code)
);

comment on table public.mdho_options is
  'Opções MDHO por categoria (docs/database.md §14.3). organization_id NULL = global.';

create index idx_mdho_options_category_active_order
  on public.mdho_options (category_id, display_order)
  where is_active = true;

create trigger set_updated_at
  before update on public.mdho_options
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 3. mdho_assessments
-- ============================================================================

create table public.mdho_assessments (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.occurrences (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  status text not null default 'DRAFT',
  complement text,
  submitted_at timestamptz,
  submitted_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  returned_at timestamptz,
  returned_by uuid references public.profiles (id) on delete set null,
  return_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mdho_assessments_occurrence_unique unique (occurrence_id),
  constraint mdho_assessments_status_check
    check (status in ('DRAFT', 'SUBMITTED', 'APPROVED', 'RETURNED')),
  constraint mdho_assessments_complement_length_check
    check (complement is null or char_length(complement) <= 4000),
  constraint mdho_assessments_return_reason_length_check
    check (return_reason is null or char_length(return_reason) <= 4000)
);

comment on table public.mdho_assessments is
  'Avaliação MDHO vinculada à ocorrência (docs/database.md §14.4). Uma por ocorrência.';

create index idx_mdho_assessments_org_status
  on public.mdho_assessments (organization_id, status);

create trigger set_updated_at
  before update on public.mdho_assessments
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 4. mdho_selections
-- ============================================================================

create table public.mdho_selections (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.mdho_assessments (id) on delete restrict,
  category_id uuid not null references public.mdho_categories (id) on delete restrict,
  option_id uuid not null references public.mdho_options (id) on delete restrict,
  detail text,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id) on delete restrict,

  constraint mdho_selections_assessment_option_unique unique (assessment_id, option_id)
);

comment on table public.mdho_selections is
  'Seleções MDHO por avaliação (docs/database.md §14.5).';

create index idx_mdho_selections_assessment_id
  on public.mdho_selections (assessment_id);

create index idx_mdho_selections_category_id
  on public.mdho_selections (category_id);


-- ============================================================================
-- 5. Triggers — consistência org + imutabilidade APPROVED
-- ============================================================================

create function public.validate_mdho_assessment_org()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_occurrence_org_id uuid;
begin
  select o.organization_id
    into v_occurrence_org_id
  from public.occurrences o
  where o.id = new.occurrence_id;

  if v_occurrence_org_id is null then
    raise exception 'occurrence_id % inválido', new.occurrence_id;
  end if;

  if new.organization_id <> v_occurrence_org_id then
    raise exception
      'organization_id deve corresponder à organização da ocorrência';
  end if;

  return new;
end;
$$;

create trigger validate_mdho_assessment_org
  before insert or update on public.mdho_assessments
  for each row execute function public.validate_mdho_assessment_org();

create function public.prevent_mdho_assessment_mutation_when_approved()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.status = 'APPROVED' then
    raise exception 'Avaliação MDHO aprovada é imutável (PO-MDHO-12).';
  end if;

  if tg_op = 'DELETE' and old.status = 'APPROVED' then
    raise exception 'Avaliação MDHO aprovada não pode ser excluída (PO-MDHO-12).';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger prevent_mdho_assessment_mutation_when_approved
  before update or delete on public.mdho_assessments
  for each row execute function public.prevent_mdho_assessment_mutation_when_approved();

create function public.prevent_mdho_selection_mutation_when_approved()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_status text;
  v_assessment_id uuid;
begin
  v_assessment_id := coalesce(new.assessment_id, old.assessment_id);

  select a.status
    into v_status
  from public.mdho_assessments a
  where a.id = v_assessment_id;

  if v_status = 'APPROVED' then
    raise exception 'Seleções MDHO imutáveis após aprovação (PO-MDHO-12).';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger prevent_mdho_selection_mutation_when_approved
  before insert or update or delete on public.mdho_selections
  for each row execute function public.prevent_mdho_selection_mutation_when_approved();


-- ============================================================================
-- 6. Row Level Security — SELECT tenant; mutations negadas
-- ============================================================================

alter table public.mdho_categories enable row level security;
alter table public.mdho_options enable row level security;
alter table public.mdho_assessments enable row level security;
alter table public.mdho_selections enable row level security;

create policy mdho_categories_select on public.mdho_categories
  for select to authenticated
  using (
    public.is_platform_admin()
    or organization_id is null
    or organization_id in (select public.current_organization_ids())
  );

create policy mdho_options_select on public.mdho_options
  for select to authenticated
  using (
    public.is_platform_admin()
    or organization_id is null
    or organization_id in (select public.current_organization_ids())
  );

create policy mdho_assessments_select on public.mdho_assessments
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      public.has_permission('occurrence.read', organization_id)
      and public.can_access_occurrence(occurrence_id)
    )
  );

create policy mdho_selections_select on public.mdho_selections
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.mdho_assessments a
      where a.id = assessment_id
        and public.has_permission('occurrence.read', a.organization_id)
        and public.can_access_occurrence(a.occurrence_id)
    )
  );

revoke insert, update, delete on public.mdho_categories from authenticated;
revoke insert, update, delete on public.mdho_options from authenticated;
revoke insert, update, delete on public.mdho_assessments from authenticated;
revoke insert, update, delete on public.mdho_selections from authenticated;

grant select on public.mdho_categories to authenticated;
grant select on public.mdho_options to authenticated;
grant select on public.mdho_assessments to authenticated;
grant select on public.mdho_selections to authenticated;
