-- ============================================================================
-- SafeStop — Seed estrutural (Sprint 1.5 + QA local multi-cenário)
-- ============================================================================
-- Contém dados estruturais estáveis previstos na documentação oficial:
--   - catálogo oficial de papéis (docs/database.md §6.1, docs/workflow.md §3);
--   - catálogo oficial de permissões (docs/database.md §6.2);
--   - usuários Auth de QA local com perfil via trigger on_auth_user_created;
--   - organizações e vínculos organization_members para cenários F3/F4/F5/F7.
--
-- Cenários QA:
--   qa-field@safestop.local    — 1 org, HSE de Campo (F3/F8)
--   qa-multi@safestop.local    — 2 orgs, papéis distintos (F4/F5 cross-tenant)
--   qa-noorg@safestop.local    — 0 orgs (OrganizationEmpty F7)
--   qa-noperm@safestop.local   — 1 org, sem member_roles (hasNoPermissions F9)
--   qa-emptyrole@safestop.local — 1 org, papel sem role_permissions (F2)
--   qa-dualrole@safestop.local  — 1 org, HSE + Gestor no mesmo vínculo (F10)
--   qa-platform@safestop.local  — PLATFORM_ADMIN + papel plataforma (bypass UI)
--
-- Idempotente: seguro executar múltiplas vezes (supabase db reset).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Papéis globais (docs/database.md §6.1)
-- ----------------------------------------------------------------------------

insert into public.roles (organization_id, name, description, is_system_role, is_active)
values
  (null, 'HSE de Campo', 'Registra Paralisações Preventivas em campo, anexa evidências e acompanha ocorrências do seu escopo.', true, true),
  (null, 'Liderança da Contratada', 'Recebe alertas, confirma ciência e registra correções em nome da empresa contratada.', true, true),
  (null, 'Fiscal do Contrato', 'Acompanha e avalia ocorrências relacionadas aos contratos sob sua responsabilidade.', true, true),
  (null, 'Supervisor HSE', 'Inicia avaliação, registra decisões, confirma Interdição Oficial e acompanha o MDHO.', true, true),
  (null, 'Liderança HSE', 'Aprova ou devolve o MDHO, valida planos de ação e libera atividades.', true, true),
  (null, 'Gestor', 'Acompanha ocorrências, indicadores e prazos dentro do seu escopo.', true, true),
  (null, 'Administrador da Empresa', 'Gerencia usuários, áreas, papéis e configurações da própria organização.', true, true),
  (null, 'Administrador da Plataforma', 'Administra a plataforma SafeStop com acesso irrestrito entre organizações.', true, true)
on conflict (name) where organization_id is null
do update set
  description = excluded.description,
  is_system_role = true,
  is_active = true;

-- ----------------------------------------------------------------------------
-- Catálogo oficial de permissões (docs/database.md §6.2)
-- ----------------------------------------------------------------------------

insert into public.permissions (code, description)
values
  ('occurrence.create', 'Permite registrar uma nova Paralisação Preventiva.'),
  ('occurrence.read', 'Permite consultar ocorrências dentro do escopo autorizado.'),
  ('occurrence.evaluate', 'Permite iniciar avaliação e registrar a decisão da liderança (Ver e Agir ou Interdição Oficial).'),
  ('occurrence.confirm_interdiction', 'Permite confirmar a Interdição Oficial de uma ocorrência.'),
  ('occurrence.validate_correction', 'Permite validar a correção enviada em uma ocorrência.'),
  ('occurrence.release', 'Permite liberar a atividade interrompida.'),
  ('occurrence.cancel', 'Permite cancelar uma ocorrência mediante justificativa.'),
  ('mdho.fill', 'Permite preencher a Avaliação Técnica MDHO.'),
  ('mdho.submit', 'Permite enviar o MDHO para aprovação da liderança HSE.'),
  ('mdho.approve', 'Permite aprovar o MDHO enviado.'),
  ('mdho.return', 'Permite devolver o MDHO para correção.'),
  ('ims_reference.register', 'Permite registrar manualmente a referência do IMS emitida em outra plataforma.'),
  ('ims_reference.update', 'Permite corrigir a referência do IMS já registrada.'),
  ('action_plan.create', 'Permite criar um plano de ação para a ocorrência.'),
  ('action_plan.manage', 'Permite gerenciar ações corretivas do plano de ação.'),
  ('action_plan.validate', 'Permite validar a conclusão de ações corretivas.'),
  ('notification.read', 'Permite consultar notificações recebidas.'),
  ('notification.confirm_awareness', 'Permite confirmar ciência de uma notificação.'),
  ('user.manage', 'Permite gerenciar usuários, vínculos organizacionais e papéis.'),
  ('organization.manage', 'Permite gerenciar dados da organização, unidades e gerências.'),
  ('area.manage', 'Permite gerenciar áreas operacionais.'),
  ('contract.manage', 'Permite gerenciar contratos entre organizações.'),
  ('settings.manage', 'Permite ajustar configurações da plataforma.'),
  ('report.read', 'Permite consultar relatórios e indicadores.'),
  ('audit.read', 'Permite consultar registros de auditoria.')
on conflict (code)
do update set description = excluded.description;

-- ----------------------------------------------------------------------------
-- Matriz oficial papel-permissão (role_permissions)
-- ----------------------------------------------------------------------------
-- Aprovada em docs/decisions/RBAC-MATRIX-APPROVED.md (2026-07-15).
-- notification.read omitido (decisão #6) até módulo de notificações.

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.name = 'HSE de Campo'
  and p.code in (
    'occurrence.create',
    'occurrence.read',
    'notification.confirm_awareness'
  )
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.name = 'Liderança da Contratada'
  and p.code in (
    'occurrence.read',
    'occurrence.validate_correction',
    'action_plan.manage',
    'notification.confirm_awareness'
  )
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.name = 'Fiscal do Contrato'
  and p.code in (
    'occurrence.read',
    'occurrence.evaluate',
    'occurrence.validate_correction',
    'notification.confirm_awareness'
  )
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.name = 'Supervisor HSE'
  and p.code in (
    'occurrence.read',
    'occurrence.evaluate',
    'occurrence.confirm_interdiction',
    'occurrence.validate_correction',
    'occurrence.release',
    'occurrence.cancel',
    'mdho.fill',
    'mdho.submit',
    'ims_reference.register',
    'ims_reference.update',
    'action_plan.create',
    'action_plan.manage',
    'notification.confirm_awareness'
  )
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.name = 'Liderança HSE'
  and p.code in (
    'occurrence.read',
    'occurrence.evaluate',
    'occurrence.confirm_interdiction',
    'occurrence.validate_correction',
    'occurrence.release',
    'mdho.fill',
    'mdho.approve',
    'mdho.return',
    'action_plan.validate',
    'ims_reference.register',
    'ims_reference.update',
    'audit.read',
    'notification.confirm_awareness'
  )
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.name = 'Gestor'
  and p.code in (
    'occurrence.read',
    'report.read',
    'notification.confirm_awareness'
  )
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.name = 'Administrador da Empresa'
  and p.code in (
    'user.manage',
    'organization.manage',
    'area.manage',
    'contract.manage',
    'settings.manage',
    'audit.read',
    'occurrence.read',
    'report.read'
  )
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.organization_id is null
  and r.name = 'Administrador da Plataforma'
on conflict (role_id, permission_id) do nothing;

-- ----------------------------------------------------------------------------
-- Organizações de QA local (somente desenvolvimento — 127.0.0.1:54321)
-- ----------------------------------------------------------------------------
-- UUIDs determinísticos para seed idempotente.

insert into public.organizations (
  id,
  name,
  legal_name,
  document_number,
  organization_type,
  is_active
)
values
  (
    'b0000000-0000-4000-8000-000000000001',
    'QA Alpha Contratante',
    'QA Alpha Contratante Ltda',
    '11.111.111/0001-01',
    'CLIENT',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'QA Beta Contratada',
    'QA Beta Contratada Ltda',
    '22.222.222/0001-02',
    'CONTRACTOR',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000003',
    'QA Gamma Cliente',
    'QA Gamma Cliente Ltda',
    '33.333.333/0001-03',
    'CLIENT',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000004',
    'QA Delta Plataforma',
    'QA Delta Plataforma Ltda',
    '44.444.444/0001-04',
    'PLATFORM',
    true
  )
on conflict (id) do update set
  name = excluded.name,
  legal_name = excluded.legal_name,
  document_number = excluded.document_number,
  organization_type = excluded.organization_type,
  is_active = true;

-- ----------------------------------------------------------------------------
-- Papel de QA sem permissões (cenário F2)
-- ----------------------------------------------------------------------------
-- Papel personalizado da organização Alpha, intencionalmente sem linhas em
-- role_permissions. Usado por qa-emptyrole@safestop.local.

insert into public.roles (
  id,
  organization_id,
  name,
  description,
  is_system_role,
  is_active
)
values (
  'd0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'QA Papel Vazio',
  'Papel de QA local sem permissões em role_permissions (cenário F2).',
  false,
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true;

-- ----------------------------------------------------------------------------
-- Usuários Auth de QA local (somente desenvolvimento — 127.0.0.1:54321)
-- ----------------------------------------------------------------------------
-- Senha local documentada: SafeStop-QA-Local-2026
-- (defina QA_TEST_USER_PASSWORD com o mesmo valor em qa-credentials.local).
-- Perfis criados automaticamente pelo trigger on_auth_user_created.

do $$
declare
  v_password text := 'SafeStop-QA-Local-2026';
  v_users constant jsonb := jsonb_build_array(
    jsonb_build_object(
      'id', 'a0000000-0000-4000-8000-000000000001',
      'email', 'qa-field@safestop.local',
      'full_name', 'QA Campo SafeStop'
    ),
    jsonb_build_object(
      'id', 'a0000000-0000-4000-8000-000000000002',
      'email', 'qa-multi@safestop.local',
      'full_name', 'QA Multi Org SafeStop'
    ),
    jsonb_build_object(
      'id', 'a0000000-0000-4000-8000-000000000003',
      'email', 'qa-noorg@safestop.local',
      'full_name', 'QA Sem Org SafeStop'
    ),
    jsonb_build_object(
      'id', 'a0000000-0000-4000-8000-000000000004',
      'email', 'qa-noperm@safestop.local',
      'full_name', 'QA Sem Permissões SafeStop'
    ),
    jsonb_build_object(
      'id', 'a0000000-0000-4000-8000-000000000005',
      'email', 'qa-platform@safestop.local',
      'full_name', 'QA Plataforma SafeStop'
    ),
    jsonb_build_object(
      'id', 'a0000000-0000-4000-8000-000000000006',
      'email', 'qa-emptyrole@safestop.local',
      'full_name', 'QA Papel Vazio SafeStop'
    ),
    jsonb_build_object(
      'id', 'a0000000-0000-4000-8000-000000000007',
      'email', 'qa-dualrole@safestop.local',
      'full_name', 'QA Papéis Duplos SafeStop'
    )
  );
  v_user jsonb;
  v_user_id uuid;
  v_email text;
  v_full_name text;
begin
  for v_user in
    select value
    from jsonb_array_elements(v_users)
  loop
    v_user_id := (v_user ->> 'id')::uuid;
    v_email := v_user ->> 'email';
    v_full_name := v_user ->> 'full_name';

    if not exists (select 1 from auth.users where id = v_user_id) then
      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      values (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        extensions.crypt(v_password, extensions.gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_full_name),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );

      insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      values (
        v_user_id,
        v_user_id,
        v_user_id::text,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      );
    end if;
  end loop;
end
$$;

-- ----------------------------------------------------------------------------
-- Vínculos organization_members de QA local
-- ----------------------------------------------------------------------------
-- organization_members.id exposto como organizationMemberId nas queries de join.
-- qa-noorg@safestop.local intencionalmente sem vínculos (cenário F7).
-- qa-noperm@safestop.local com vínculo mas sem member_roles (cenário F9).

insert into public.organization_members (
  id,
  organization_id,
  profile_id,
  membership_type,
  is_active
)
values
  (
    'c0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'INTERNAL',
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000002',
    'CONTRACTOR',
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000002',
    'INTERNAL',
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000004',
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000004',
    'INTERNAL',
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000005',
    'b0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000005',
    'PLATFORM_ADMIN',
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000006',
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000006',
    'INTERNAL',
    true
  ),
  (
    'c0000000-0000-4000-8000-000000000007',
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000007',
    'INTERNAL',
    true
  )
on conflict (organization_id, profile_id) do update set
  membership_type = excluded.membership_type,
  is_active = true;

-- ----------------------------------------------------------------------------
-- member_roles de QA local (Sprint 1.9)
-- ----------------------------------------------------------------------------
-- Atribui papéis aos vínculos de QA para testar autorização efetiva.
-- Matriz role_permissions: docs/decisions/RBAC-MATRIX-APPROVED.md
--
-- Cenários:
--   qa-field     — HSE de Campo na Alpha (occurrence.create na própria org)
--   qa-multi     — HSE de Campo na Beta + Gestor na Gamma (cross-tenant QA)
--   qa-noperm    — sem member_roles (F9: hasNoPermissions)
--   qa-emptyrole — QA Papel Vazio na Alpha (F2: papel sem role_permissions)
--   qa-dualrole  — HSE + Gestor no mesmo vínculo Alpha (F10: união runtime)
--   qa-noorg     — sem vínculos (F7)
--   qa-platform  — Administrador da Plataforma na Delta (PLATFORM_ADMIN bypass)

insert into public.member_roles (organization_member_id, role_id)
select om.id, r.id
from public.organization_members om
cross join public.roles r
where om.id = 'c0000000-0000-4000-8000-000000000001'
  and r.name = 'HSE de Campo'
  and r.organization_id is null
on conflict (organization_member_id, role_id) do nothing;

insert into public.member_roles (organization_member_id, role_id)
select om.id, r.id
from public.organization_members om
join public.roles r on r.id = 'd0000000-0000-4000-8000-000000000001'
where om.id = 'c0000000-0000-4000-8000-000000000006'
on conflict (organization_member_id, role_id) do nothing;

insert into public.member_roles (organization_member_id, role_id)
select om.id, r.id
from public.organization_members om
cross join public.roles r
where om.id = 'c0000000-0000-4000-8000-000000000007'
  and r.name in ('HSE de Campo', 'Gestor')
  and r.organization_id is null
on conflict (organization_member_id, role_id) do nothing;

insert into public.member_roles (organization_member_id, role_id)
select om.id, r.id
from public.organization_members om
cross join public.roles r
where om.id = 'c0000000-0000-4000-8000-000000000002'
  and r.name = 'HSE de Campo'
  and r.organization_id is null
on conflict (organization_member_id, role_id) do nothing;

insert into public.member_roles (organization_member_id, role_id)
select om.id, r.id
from public.organization_members om
cross join public.roles r
where om.id = 'c0000000-0000-4000-8000-000000000003'
  and r.name = 'Gestor'
  and r.organization_id is null
on conflict (organization_member_id, role_id) do nothing;

insert into public.member_roles (organization_member_id, role_id)
select om.id, r.id
from public.organization_members om
cross join public.roles r
where om.id = 'c0000000-0000-4000-8000-000000000005'
  and r.name = 'Administrador da Plataforma'
  and r.organization_id is null
on conflict (organization_member_id, role_id) do nothing;
