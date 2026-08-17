-- ============================================================================
-- SafeStop — Sprint 3.0: Plano de Ação foundation (docs/database.md §15)
-- ============================================================================
-- Referências: docs/decisions/ACTION-PLAN-DECISIONS.md (PO-AP-1…PO-AP-19)
-- SEM notification_events; SEM audit_events; SEM submit_action_plan_for_occurrence_validation.
-- Mutations somente via RPC SECURITY DEFINER (migration 20260809190000).
-- ============================================================================

-- Chave composta occurrences para FK multi-tenant
alter table public.occurrences
  add constraint occurrences_id_org_unique unique (id, organization_id);

-- ============================================================================
-- 1. action_plans
-- ============================================================================

create table public.action_plans (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  status text not null default 'OPEN',
  summary text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,

  constraint action_plans_occurrence_org_fk
    foreign key (occurrence_id, organization_id)
    references public.occurrences (id, organization_id)
    on delete restrict,
  constraint action_plans_id_org_unique unique (id, organization_id),
  constraint action_plans_status_check
    check (status in ('OPEN', 'IN_PROGRESS', 'AWAITING_VALIDATION', 'COMPLETED', 'CANCELLED')),
  constraint action_plans_summary_length_check
    check (summary is null or char_length(summary) <= 4000)
);

comment on table public.action_plans is
  'Plano de ação da ocorrência IO (docs/database.md §15.1). Uma instância ativa por ocorrência.';

create unique index action_plans_one_active_per_occurrence_idx
  on public.action_plans (occurrence_id)
  where status in ('OPEN', 'IN_PROGRESS', 'AWAITING_VALIDATION');

create index action_plans_org_status_idx
  on public.action_plans (organization_id, status);

create trigger set_updated_at
  before update on public.action_plans
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 2. action_items
-- ============================================================================

create table public.action_items (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid not null,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  title text not null,
  description text,
  responsible_member_id uuid not null,
  responsible_organization_id uuid not null references public.organizations (id) on delete restrict,
  due_at timestamptz not null,
  priority text not null,
  status text not null default 'PENDING',
  completion_description text,
  completed_at timestamptz,
  completed_by uuid references public.profiles (id) on delete set null,
  validated_at timestamptz,
  validated_by uuid references public.profiles (id) on delete set null,
  validation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint action_items_plan_org_fk
    foreign key (action_plan_id, organization_id)
    references public.action_plans (id, organization_id)
    on delete restrict,
  constraint action_items_id_org_unique unique (id, organization_id),
  constraint action_items_responsible_member_org_fk
    foreign key (responsible_member_id, organization_id)
    references public.organization_members (id, organization_id)
    on delete restrict,
  constraint action_items_title_not_blank check (btrim(title) <> ''),
  constraint action_items_title_length_check check (char_length(title) <= 200),
  constraint action_items_description_length_check
    check (description is null or char_length(description) <= 4000),
  constraint action_items_completion_description_length_check
    check (completion_description is null or char_length(completion_description) <= 4000),
  constraint action_items_validation_note_length_check
    check (validation_note is null or char_length(validation_note) <= 4000),
  constraint action_items_priority_check
    check (priority in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  constraint action_items_status_check
    check (status in ('PENDING', 'IN_PROGRESS', 'AWAITING_VALIDATION', 'COMPLETED', 'REJECTED', 'CANCELLED'))
);

comment on table public.action_items is
  'Ações corretivas do plano (docs/database.md §15.2).';

create index action_items_plan_id_idx on public.action_items (action_plan_id);
create index action_items_responsible_member_idx on public.action_items (responsible_member_id);
create index action_items_org_status_idx on public.action_items (organization_id, status);

create trigger set_updated_at
  before update on public.action_items
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 3. action_item_attachments
-- ============================================================================

create table public.action_item_attachments (
  id uuid primary key default gen_random_uuid(),
  action_item_id uuid not null,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  storage_bucket text not null default 'occurrence-evidence',
  storage_path text not null,
  original_file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  caption text,
  upload_status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,

  constraint action_item_attachments_item_org_fk
    foreign key (action_item_id, organization_id)
    references public.action_items (id, organization_id)
    on delete restrict,
  constraint action_item_attachments_storage_path_unique unique (storage_path),
  constraint action_item_attachments_original_file_name_not_blank
    check (btrim(original_file_name) <> ''),
  constraint action_item_attachments_storage_bucket_check
    check (storage_bucket = 'occurrence-evidence'),
  constraint action_item_attachments_upload_status_check
    check (upload_status in ('PENDING', 'COMPLETED', 'FAILED')),
  constraint action_item_attachments_mime_type_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint action_item_attachments_file_size_check
    check (file_size > 0 and file_size <= 10485760),
  constraint action_item_attachments_caption_max_length
    check (caption is null or char_length(caption) <= 500)
);

comment on table public.action_item_attachments is
  'Evidências de ações corretivas; subpath action-items no bucket occurrence-evidence (PO-AP-6).';
comment on column public.action_item_attachments.storage_path is
  'Path: {organization_id}/action-items/{action_item_id}/{attachment_id}.{ext}';

create index action_item_attachments_item_active_idx
  on public.action_item_attachments (action_item_id, created_at desc)
  where deleted_at is null;

create trigger set_updated_at
  before update on public.action_item_attachments
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 4. Helpers internos
-- ============================================================================

create function public.is_action_item_responsible_member(
  p_item_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.action_items ai
    join public.organization_members om
      on om.id = ai.responsible_member_id
     and om.organization_id = ai.organization_id
    where ai.id = p_item_id
      and om.profile_id = p_user_id
      and om.is_active = true
  );
$$;

comment on function public.is_action_item_responsible_member(uuid, uuid) is
  'Verifica se auth.uid() é o responsável ativo pela ação (PO-AP-10).';


-- ============================================================================
-- 5. Row Level Security — SELECT-only
-- ============================================================================

alter table public.action_plans enable row level security;
alter table public.action_items enable row level security;
alter table public.action_item_attachments enable row level security;

create policy action_plans_select on public.action_plans
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      public.has_permission('occurrence.read', organization_id)
      and public.can_access_occurrence(occurrence_id)
    )
  );

create policy action_items_select on public.action_items
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      public.has_permission('occurrence.read', organization_id)
      and exists (
        select 1
        from public.action_plans ap
        where ap.id = action_plan_id
          and public.can_access_occurrence(ap.occurrence_id)
      )
    )
  );

create policy action_item_attachments_select on public.action_item_attachments
  for select to authenticated
  using (
    public.is_platform_admin()
    or (
      public.has_permission('occurrence.read', organization_id)
      and exists (
        select 1
        from public.action_items ai
        join public.action_plans ap on ap.id = ai.action_plan_id
        where ai.id = action_item_id
          and public.can_access_occurrence(ap.occurrence_id)
      )
    )
  );

revoke insert, update, delete on public.action_plans from authenticated;
revoke insert, update, delete on public.action_items from authenticated;
revoke insert, update, delete on public.action_item_attachments from authenticated;

grant select on public.action_plans to authenticated;
grant select on public.action_items to authenticated;
grant select on public.action_item_attachments to authenticated;
