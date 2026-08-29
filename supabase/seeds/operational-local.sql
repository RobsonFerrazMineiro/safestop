-- ============================================================================
-- SafeStop — Seed operacional LOCAL (fictício)
-- ============================================================================
-- Carregado após supabase/seed.sql (config.toml [db.seed]).
-- Auth users das personas abaixo já existem (mesmo mecanismo: auth.users).
-- Senha local comum: SafeStop-QA-Local-2026
--
-- NÃO contém dados reais. Nomes, CNPJs, contratos e IMS são fictícios.
--
-- Modelagem REAL do banco (sem inventar tipo):
--   - Gerenciadora NÃO usa organization_type MANAGING_COMPANY (schema pendente
--     PO-NOTIF-2). Org criada como CLIENT; supervisão mapeada para CUSTOM +
--     membership EXTERNAL na Hydro (workaround documentado).
--   - Encarregado NÃO é organization_contacts. Snapshot em
--     occurrence_participants como OBSERVER (ACTIVITY_FOREMAN ainda não existe
--     no CHECK atual).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Organizações operacionais
-- ----------------------------------------------------------------------------

insert into public.organizations (
  id, name, legal_name, document_number, organization_type, is_active
)
values
  (
    'b1000000-0000-4000-8000-000000000001',
    'Hydro QA',
    'Hydro QA Mineração Ltda. (fictícia)',
    '00.000.000/0001-91',
    'CLIENT',
    true
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'Montagem Industrial Norte QA Ltda.',
    'Montagem Industrial Norte QA Ltda. (fictícia)',
    '00.000.000/0001-92',
    'CONTRACTOR',
    true
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'Gestão Industrial QA Ltda.',
    'Gestão Industrial QA Ltda. (fictícia — gerenciadora)',
    '00.000.000/0001-93',
    'CLIENT',
    true
  )
on conflict (id) do update set
  name = excluded.name,
  legal_name = excluded.legal_name,
  document_number = excluded.document_number,
  organization_type = excluded.organization_type,
  is_active = true;

-- ----------------------------------------------------------------------------
-- Unidade Alunorte QA + 5 áreas
-- ----------------------------------------------------------------------------

insert into public.units (id, organization_id, name, code, is_active)
values (
  'e1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'Alunorte QA',
  'ALU-QA',
  true
)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  is_active = true;

insert into public.areas (id, organization_id, unit_id, name, code, is_active)
values
  ('f1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Clarificação', 'ALU-CLAR', true),
  ('f1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Digestão', 'ALU-DIG', true),
  ('f1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Precipitação', 'ALU-PREC', true),
  ('f1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Filtração', 'ALU-FILT', true),
  ('f1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Utilidades', 'ALU-UTIL', true)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  unit_id = excluded.unit_id,
  is_active = true;

-- ----------------------------------------------------------------------------
-- Contrato fictício 4600012345
-- ----------------------------------------------------------------------------

insert into public.contracts (
  id, client_organization_id, contractor_organization_id, unit_id,
  contract_number, name, description, starts_at, is_active
)
values (
  '01010000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000001',
  '4600012345',
  '4600012345 — Manutenção e Montagem Industrial',
  'Contrato QA fictício: Hydro QA (cliente) × Montagem Industrial Norte QA Ltda. (contratada). Gerenciadora Gestão Industrial QA Ltda. representada via membership EXTERNAL + contact_type CUSTOM (schema MANAGING_COMPANY ainda não migrado).',
  '2026-01-01 00:00:00+00',
  true
)
on conflict (id) do update set
  client_organization_id = excluded.client_organization_id,
  contractor_organization_id = excluded.contractor_organization_id,
  unit_id = excluded.unit_id,
  contract_number = excluded.contract_number,
  name = excluded.name,
  description = excluded.description,
  starts_at = excluded.starts_at,
  is_active = true;

-- ----------------------------------------------------------------------------
-- Vínculos organization_members
-- ----------------------------------------------------------------------------
-- Contratados têm dual membership: org contratada (INTERNAL) + Hydro
-- (CONTRACTOR), porque occurrences_select exige occurrence.read na org
-- CLIENTE da ocorrência. Gerenciadora: org própria + Hydro EXTERNAL.

insert into public.organization_members (
  id, organization_id, profile_id, job_title, membership_type, is_active
)
values
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Administradora da organização', 'INTERNAL', true),
  ('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'TST Hydro — Clarificação', 'INTERNAL', true),
  ('c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003', 'Supervisor Hydro', 'INTERNAL', true),
  ('c1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004', 'Gerente Hydro', 'INTERNAL', true),
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000005', 'Fiscal do contrato', 'INTERNAL', true),
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000006', 'Encarregado da atividade', 'CONTRACTOR', true),
  ('c1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000007', 'Supervisor da contratada', 'CONTRACTOR', true),
  ('c1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000008', 'Preposto da contratada', 'CONTRACTOR', true),
  ('c1000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000009', 'TST da contratada', 'CONTRACTOR', true),
  ('c1000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000010', 'Supervisor HSE contratada', 'CONTRACTOR', true),
  ('c1000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000011', 'Engenharia da contratada', 'CONTRACTOR', true),
  ('c1000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000012', 'Supervisão da gerenciadora', 'EXTERNAL', true),
  ('c1000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000013', 'Liderança HSE', 'INTERNAL', true),
  ('c1100000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000006', 'Encarregado da atividade', 'INTERNAL', true),
  ('c1100000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000007', 'Supervisor da contratada', 'INTERNAL', true),
  ('c1100000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000008', 'Preposto', 'INTERNAL', true),
  ('c1100000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000009', 'TST contratada', 'INTERNAL', true),
  ('c1100000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000010', 'Supervisor HSE', 'INTERNAL', true),
  ('c1100000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000011', 'Engenharia', 'INTERNAL', true),
  ('c1200000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000012', 'Supervisão gerenciadora', 'INTERNAL', true)
on conflict (organization_id, profile_id) do update set
  job_title = excluded.job_title,
  membership_type = excluded.membership_type,
  is_active = true;

-- ----------------------------------------------------------------------------
-- Papéis (matriz vigente — sem permissão nova)
-- ----------------------------------------------------------------------------

insert into public.member_roles (organization_member_id, role_id)
select om.id, r.id
from public.organization_members om
cross join public.roles r
where r.organization_id is null
  and (
    (om.id = 'c1000000-0000-4000-8000-000000000001' and r.name = 'Administrador da Empresa')
    or (om.id = 'c1000000-0000-4000-8000-000000000002' and r.name = 'HSE de Campo')
    or (om.id = 'c1000000-0000-4000-8000-000000000003' and r.name = 'Gestor')
    or (om.id = 'c1000000-0000-4000-8000-000000000004' and r.name = 'Gestor')
    or (om.id = 'c1000000-0000-4000-8000-000000000005' and r.name = 'Fiscal do Contrato')
    or (om.id in (
      'c1000000-0000-4000-8000-000000000006',
      'c1000000-0000-4000-8000-000000000007',
      'c1000000-0000-4000-8000-000000000008',
      'c1100000-0000-4000-8000-000000000001',
      'c1100000-0000-4000-8000-000000000002',
      'c1100000-0000-4000-8000-000000000003'
    ) and r.name = 'Liderança da Contratada')
    or (om.id in (
      'c1000000-0000-4000-8000-000000000009',
      'c1100000-0000-4000-8000-000000000004'
    ) and r.name = 'HSE de Campo')
    or (om.id in (
      'c1000000-0000-4000-8000-000000000010',
      'c1100000-0000-4000-8000-000000000005'
    ) and r.name = 'Supervisor HSE')
    or (om.id in (
      'c1000000-0000-4000-8000-000000000011',
      'c1100000-0000-4000-8000-000000000006'
    ) and r.name = 'Gestor')
    or (om.id in (
      'c1000000-0000-4000-8000-000000000012',
      'c1200000-0000-4000-8000-000000000001'
    ) and r.name = 'Gestor')
    or (om.id = 'c1000000-0000-4000-8000-000000000013' and r.name = 'Liderança HSE')
  )
on conflict (organization_member_id, role_id) do nothing;

-- ----------------------------------------------------------------------------
-- organization_contacts (tipos REAIS do CHECK)
-- ----------------------------------------------------------------------------
-- Contrato 4600012345:
--   Fiscal              → CONTRACT_INSPECTOR     (João)
--   Supervisor Hydro    → CONTRACT_MANAGER       (Ricardo)
--   Gerente Hydro       → COMPANY_RESPONSIBLE    (Fernanda)
--   Preposto            → CONTRACTOR_LEADERSHIP  (Marcelo, org contratada)
--   Supervisor contr.   → CONTRACTOR_LEADERSHIP  (André, org contratada, prio 2)
--   TST contratada      → CUSTOM                 (Juliana, org contratada)
--   Supervisor HSE      → HSE_SUPERVISOR         (Roberto, vínculo Hydro)
--   Engenharia          → CUSTOM                 (Camila, org contratada)
--   Liderança HSE       → HSE_LEADERSHIP         (Patrícia)
-- Área Clarificação:
--   TST Hydro           → CUSTOM                 (Carlos)
--   Supervisão Hydro    → AREA_MANAGER           (Ricardo)
--   Gerente Hydro área  → AREA_MANAGER           (Fernanda, prio 2)
--   Supervisão Gerenc.  → CUSTOM                 (Eduardo) — workaround Gerenciadora

insert into public.organization_contacts (
  id, organization_id, organization_member_id, unit_id, area_id, contract_id,
  contact_type, priority, is_active
)
values
  ('02100000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000001', null, '01010000-0000-4000-8000-000000000001', 'CONTRACT_INSPECTOR', 1, true),
  ('02100000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000001', null, '01010000-0000-4000-8000-000000000001', 'CONTRACT_MANAGER', 1, true),
  ('02100000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000001', null, '01010000-0000-4000-8000-000000000001', 'COMPANY_RESPONSIBLE', 1, true),
  ('02100000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 'c1100000-0000-4000-8000-000000000003', null, null, '01010000-0000-4000-8000-000000000001', 'CONTRACTOR_LEADERSHIP', 1, true),
  ('02100000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 'c1100000-0000-4000-8000-000000000002', null, null, '01010000-0000-4000-8000-000000000001', 'CONTRACTOR_LEADERSHIP', 2, true),
  ('02100000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', 'c1100000-0000-4000-8000-000000000004', null, null, '01010000-0000-4000-8000-000000000001', 'CUSTOM', 1, true),
  ('02100000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000010', 'e1000000-0000-4000-8000-000000000001', null, '01010000-0000-4000-8000-000000000001', 'HSE_SUPERVISOR', 1, true),
  ('02100000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000002', 'c1100000-0000-4000-8000-000000000006', null, null, '01010000-0000-4000-8000-000000000001', 'CUSTOM', 2, true),
  ('02100000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000013', 'e1000000-0000-4000-8000-000000000001', null, '01010000-0000-4000-8000-000000000001', 'HSE_LEADERSHIP', 1, true),
  ('02100000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', null, 'CUSTOM', 1, true),
  ('02100000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', null, 'AREA_MANAGER', 1, true),
  ('02100000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', null, 'AREA_MANAGER', 2, true),
  ('02100000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000012', 'e1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', '01010000-0000-4000-8000-000000000001', 'CUSTOM', 1, true)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  organization_member_id = excluded.organization_member_id,
  unit_id = excluded.unit_id,
  area_id = excluded.area_id,
  contract_id = excluded.contract_id,
  contact_type = excluded.contact_type,
  priority = excluded.priority,
  is_active = true;

-- ----------------------------------------------------------------------------
-- 16 Paralisações Preventivas (status reais, datas relativas a now())
-- ----------------------------------------------------------------------------

insert into public.occurrences (
  id, organization_id, unit_id, area_id, contract_id, contractor_organization_id,
  public_code, title, task_description, location_description, condition_description,
  immediate_action_description, severity, status, decision_type,
  occurred_at, stopped_at, evaluated_at, released_at, closed_at, cancelled_at,
  cancellation_reason, created_by, assigned_evaluator_id,
  ims_reference_code, ims_reference_registered_at, ims_reference_registered_by,
  created_at
)
values
  (
    '11000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000101',
    'Vazamento de licor na Clarificação',
    'Inspeção de flange no tanque TK-Clarif-04.',
    'Clarificação — nível 2, lado leste.',
    'Gotejamento contínuo de licor na base do flange.',
    'Área isolada e equipe retirada.',
    'HIGH', 'PARALISACAO_PREVENTIVA', null,
    now() - interval '2 hours', now() - interval '2 hours',
    null, null, null, null, null,
    'a1000000-0000-4000-8000-000000000002', null,
    null, null, null,
    now() - interval '2 hours'
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000002',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000102',
    'Andaime incompleto na Digestão',
    'Montagem de andaime para inspeção de vaso.',
    'Digestão — plataforma P-12.',
    'Guarda-corpo ausente no trecho norte.',
    'Trabalho interrompido; acesso bloqueado.',
    'MEDIUM', 'PARALISACAO_PREVENTIVA', null,
    now() - interval '1 day', now() - interval '1 day',
    null, null, null, null, null,
    'a1000000-0000-4000-8000-000000000009', null,
    null, null, null,
    now() - interval '1 day'
  ),
  (
    '11000000-0000-4000-8000-000000000003',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000103',
    'Cabo energizado exposto na Clarificação',
    'Manutenção elétrica em CCM auxiliar.',
    'Clarificação — sala elétrica SE-02.',
    'Isolamento danificado em cabo 480V.',
    'Circuito desligado e etiquetado.',
    'CRITICAL', 'EM_AVALIACAO', null,
    now() - interval '3 days', now() - interval '3 days',
    now() - interval '2 days 20 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000010',
    null, null, null,
    now() - interval '3 days'
  ),
  (
    '11000000-0000-4000-8000-000000000004',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000003',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000104',
    'Piso escorregadio na Precipitação',
    'Limpeza de cristalizadores.',
    'Precipitação — corredor C-3.',
    'Acúmulo de hidrato no piso, risco de queda.',
    'Sinalização e contenção provisória.',
    'LOW', 'VER_E_AGIR', 'VER_E_AGIR',
    now() - interval '5 days', now() - interval '5 days',
    now() - interval '4 days 18 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000010',
    null, null, null,
    now() - interval '5 days'
  ),
  (
    '11000000-0000-4000-8000-000000000005',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000004',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000105',
    'Bloqueio LOTO incompleto na Filtração',
    'Troca de pano de filtro prensa.',
    'Filtração — prensa PF-07.',
    'Falta cadeado no ponto de energia residual.',
    'Atividade parada; equipe afastada.',
    'HIGH', 'INTERDICAO_CONFIRMADA', 'INTERDICAO_OFICIAL',
    now() - interval '6 days', now() - interval '6 days',
    now() - interval '5 days 20 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000009',
    'a1000000-0000-4000-8000-000000000010',
    null, null, null,
    now() - interval '6 days'
  ),
  (
    '11000000-0000-4000-8000-000000000006',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000005',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000106',
    'Válvula de vapor com vazamento — Utilidades',
    'Manutenção em linha de vapor 10 bar.',
    'Utilidades — casa de caldeiras.',
    'Vazamento visível no prensa-vedação.',
    'Linha isolada; isolamento térmico refeito provisoriamente.',
    'HIGH', 'MDHO_EM_PREENCHIMENTO', 'INTERDICAO_OFICIAL',
    now() - interval '8 days', now() - interval '8 days',
    now() - interval '7 days 18 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000010',
    null, null, null,
    now() - interval '8 days'
  ),
  (
    '11000000-0000-4000-8000-000000000007',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000107',
    'Trabalho em altura sem linha de vida',
    'Inspeção de cobertura do espessador.',
    'Clarificação — cobertura do espessador E-01.',
    'Equipe posicionada sem ancoragem certificada.',
    'Descida imediata e interdição do acesso.',
    'CRITICAL', 'AGUARDANDO_APROVACAO_HSE', 'INTERDICAO_OFICIAL',
    now() - interval '10 days', now() - interval '10 days',
    now() - interval '9 days 16 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000010',
    null, null, null,
    now() - interval '10 days'
  ),
  (
    '11000000-0000-4000-8000-000000000008',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000002',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000108',
    'Espaço confinado sem monitoração de atmosfera',
    'Limpeza interna de tanque de digestão.',
    'Digestão — tanque DG-03.',
    'Entrada iniciada sem medição de O2/LEL.',
    'Resgate preventivo; acesso lacrado.',
    'CRITICAL', 'AGUARDANDO_REGISTRO_IMS', 'INTERDICAO_OFICIAL',
    now() - interval '12 days', now() - interval '12 days',
    now() - interval '11 days 12 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000009',
    'a1000000-0000-4000-8000-000000000010',
    null, null, null,
    now() - interval '12 days'
  ),
  (
    '11000000-0000-4000-8000-000000000009',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000003',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000109',
    'Proteção de máquina removida na Precipitação',
    'Ajuste de acoplamento do agitador.',
    'Precipitação — agitador AG-22.',
    'Grade de proteção retirada e não reinstalada.',
    'Equipamento desligado e delimitado.',
    'HIGH', 'EM_TRATATIVA', 'INTERDICAO_OFICIAL',
    now() - interval '15 days', now() - interval '15 days',
    now() - interval '14 days 10 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000010',
    'IMS-QA-2026-0041',
    now() - interval '13 days',
    'a1000000-0000-4000-8000-000000000010',
    now() - interval '15 days'
  ),
  (
    '11000000-0000-4000-8000-000000000010',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000004',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000110',
    'Içamento com linga danificada — Filtração',
    'Movimentação de conjunto de placas.',
    'Filtração — pátio de peças.',
    'Linga com alma exposta em dois trechos.',
    'Carga apoiada; linga fora de uso.',
    'HIGH', 'EM_TRATATIVA', 'INTERDICAO_OFICIAL',
    now() - interval '18 days', now() - interval '18 days',
    now() - interval '17 days 8 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000009',
    'a1000000-0000-4000-8000-000000000010',
    'IMS-QA-2026-0042',
    now() - interval '16 days',
    'a1000000-0000-4000-8000-000000000010',
    now() - interval '18 days'
  ),
  (
    '11000000-0000-4000-8000-000000000011',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000001',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000111',
    'Produto químico sem ficha no ponto de uso',
    'Dosagem de floculante.',
    'Clarificação — casa de dosagem.',
    'Tambor sem rótulo e sem FDS no local.',
    'Produto isolado; dosagem suspensa.',
    'MEDIUM', 'AGUARDANDO_VALIDACAO', 'INTERDICAO_OFICIAL',
    now() - interval '20 days', now() - interval '20 days',
    now() - interval '19 days', null, null, null, null,
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000013',
    'IMS-QA-2026-0043',
    now() - interval '18 days',
    'a1000000-0000-4000-8000-000000000013',
    now() - interval '20 days'
  ),
  (
    '11000000-0000-4000-8000-000000000012',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000002',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000112',
    'Sinalização de emergência obstruída',
    'Organização de materiais no corredor.',
    'Digestão — rota de fuga R-4.',
    'Paletes bloqueando placa e extintor.',
    'Corredor desobstruído parcialmente.',
    'MEDIUM', 'LIBERADA', 'INTERDICAO_OFICIAL',
    now() - interval '25 days', now() - interval '25 days',
    now() - interval '24 days', now() - interval '2 days', null, null, null,
    'a1000000-0000-4000-8000-000000000009',
    'a1000000-0000-4000-8000-000000000013',
    'IMS-QA-2026-0044',
    now() - interval '22 days',
    'a1000000-0000-4000-8000-000000000013',
    now() - interval '25 days'
  ),
  (
    '11000000-0000-4000-8000-000000000013',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000003',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000113',
    'Iluminação insuficiente em área de circulação',
    'Ronda noturna de inspeção.',
    'Precipitação — passarela inferior.',
    'Três luminárias queimadas no trecho.',
    'Área interditada no turno noturno.',
    'LOW', 'ENCERRADA', 'VER_E_AGIR',
    now() - interval '32 days', now() - interval '32 days',
    now() - interval '31 days', now() - interval '10 days', now() - interval '8 days', null, null,
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000013',
    null, null, null,
    now() - interval '32 days'
  ),
  (
    '11000000-0000-4000-8000-000000000014',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000005',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000114',
    'Falso alarme de cheiro de gás — Utilidades',
    'Verificação de odor reportado.',
    'Utilidades — compressores.',
    'Odor não confirmado após medição.',
    'Área ventilada; medição zerada.',
    'LOW', 'CANCELADA', null,
    now() - interval '4 days', now() - interval '4 days',
    null, null, null, now() - interval '3 days 20 hours',
    'Medição de atmosfera sem desvio. Falso alarme.',
    'a1000000-0000-4000-8000-000000000002', null,
    null, null, null,
    now() - interval '4 days'
  ),
  (
    '11000000-0000-4000-8000-000000000015',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000004',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000115',
    'Escada portátil sem sapatas antiderrapantes',
    'Acesso a instrumentação elevada.',
    'Filtração — mezanino de válvulas.',
    'Escada com sapatas gastas, risco de escorregamento.',
    'Escada retirada de uso.',
    'MEDIUM', 'INTERDICAO_CONFIRMADA', 'INTERDICAO_OFICIAL',
    now() - interval '7 days', now() - interval '7 days',
    now() - interval '6 days 12 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000010',
    null, null, null,
    now() - interval '7 days'
  ),
  (
    '11000000-0000-4000-8000-000000000016',
    'b1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000005',
    '01010000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'SS-26-000116',
    'Ruído acima do esperado em compressor',
    'Ronda de Utilidades.',
    'Utilidades — compressor C-02.',
    'Vibração e ruído anormais no mancal.',
    'Máquina desligada para inspeção.',
    'MEDIUM', 'EM_AVALIACAO', null,
    now() - interval '9 hours', now() - interval '9 hours',
    now() - interval '6 hours', null, null, null, null,
    'a1000000-0000-4000-8000-000000000009',
    'a1000000-0000-4000-8000-000000000013',
    null, null, null,
    now() - interval '9 hours'
  )
on conflict (id) do nothing;

insert into public.occurrence_public_code_yearly_counters (year, last_value)
values (26, 116)
on conflict (year) do update
  set last_value = greatest(public.occurrence_public_code_yearly_counters.last_value, excluded.last_value);

-- ----------------------------------------------------------------------------
-- Histórico de status (cadeias coerentes, sem pular invariante de domínio)
-- ----------------------------------------------------------------------------

insert into public.occurrence_status_history (
  occurrence_id, from_status, to_status, reason, changed_by, changed_at
)
values
  ('11000000-0000-4000-8000-000000000001', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '2 hours'),
  ('11000000-0000-4000-8000-000000000002', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000009', now() - interval '1 day'),
  ('11000000-0000-4000-8000-000000000003', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '3 days'),
  ('11000000-0000-4000-8000-000000000003', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000010', now() - interval '2 days 20 hours'),
  ('11000000-0000-4000-8000-000000000004', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '5 days'),
  ('11000000-0000-4000-8000-000000000004', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000010', now() - interval '4 days 20 hours'),
  ('11000000-0000-4000-8000-000000000004', 'EM_AVALIACAO', 'VER_E_AGIR', 'Decisão Ver e Agir', 'a1000000-0000-4000-8000-000000000010', now() - interval '4 days 18 hours'),
  ('11000000-0000-4000-8000-000000000005', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000009', now() - interval '6 days'),
  ('11000000-0000-4000-8000-000000000005', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000010', now() - interval '5 days 22 hours'),
  ('11000000-0000-4000-8000-000000000005', 'EM_AVALIACAO', 'INTERDICAO_CONFIRMADA', 'Interdição Oficial', 'a1000000-0000-4000-8000-000000000010', now() - interval '5 days 20 hours'),
  ('11000000-0000-4000-8000-000000000006', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '8 days'),
  ('11000000-0000-4000-8000-000000000006', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000010', now() - interval '7 days 20 hours'),
  ('11000000-0000-4000-8000-000000000006', 'EM_AVALIACAO', 'INTERDICAO_CONFIRMADA', 'Interdição Oficial', 'a1000000-0000-4000-8000-000000000010', now() - interval '7 days 18 hours'),
  ('11000000-0000-4000-8000-000000000006', 'INTERDICAO_CONFIRMADA', 'MDHO_EM_PREENCHIMENTO', 'MDHO iniciado', 'a1000000-0000-4000-8000-000000000010', now() - interval '7 days 12 hours'),
  ('11000000-0000-4000-8000-000000000007', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '10 days'),
  ('11000000-0000-4000-8000-000000000007', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000010', now() - interval '9 days 20 hours'),
  ('11000000-0000-4000-8000-000000000007', 'EM_AVALIACAO', 'INTERDICAO_CONFIRMADA', 'Interdição Oficial', 'a1000000-0000-4000-8000-000000000010', now() - interval '9 days 16 hours'),
  ('11000000-0000-4000-8000-000000000007', 'INTERDICAO_CONFIRMADA', 'MDHO_EM_PREENCHIMENTO', 'MDHO iniciado', 'a1000000-0000-4000-8000-000000000010', now() - interval '9 days 8 hours'),
  ('11000000-0000-4000-8000-000000000007', 'MDHO_EM_PREENCHIMENTO', 'AGUARDANDO_APROVACAO_HSE', 'MDHO enviado', 'a1000000-0000-4000-8000-000000000010', now() - interval '8 days 20 hours'),
  ('11000000-0000-4000-8000-000000000008', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000009', now() - interval '12 days'),
  ('11000000-0000-4000-8000-000000000008', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000010', now() - interval '11 days 18 hours'),
  ('11000000-0000-4000-8000-000000000008', 'EM_AVALIACAO', 'INTERDICAO_CONFIRMADA', 'Interdição Oficial', 'a1000000-0000-4000-8000-000000000010', now() - interval '11 days 12 hours'),
  ('11000000-0000-4000-8000-000000000008', 'INTERDICAO_CONFIRMADA', 'MDHO_EM_PREENCHIMENTO', 'MDHO iniciado', 'a1000000-0000-4000-8000-000000000010', now() - interval '11 days 4 hours'),
  ('11000000-0000-4000-8000-000000000008', 'MDHO_EM_PREENCHIMENTO', 'AGUARDANDO_APROVACAO_HSE', 'MDHO enviado', 'a1000000-0000-4000-8000-000000000010', now() - interval '10 days 20 hours'),
  ('11000000-0000-4000-8000-000000000008', 'AGUARDANDO_APROVACAO_HSE', 'AGUARDANDO_REGISTRO_IMS', 'MDHO aprovado', 'a1000000-0000-4000-8000-000000000013', now() - interval '10 days 8 hours'),
  ('11000000-0000-4000-8000-000000000009', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '15 days'),
  ('11000000-0000-4000-8000-000000000009', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000010', now() - interval '14 days 16 hours'),
  ('11000000-0000-4000-8000-000000000009', 'EM_AVALIACAO', 'INTERDICAO_CONFIRMADA', 'Interdição Oficial', 'a1000000-0000-4000-8000-000000000010', now() - interval '14 days 10 hours'),
  ('11000000-0000-4000-8000-000000000009', 'INTERDICAO_CONFIRMADA', 'MDHO_EM_PREENCHIMENTO', 'MDHO iniciado', 'a1000000-0000-4000-8000-000000000010', now() - interval '14 days'),
  ('11000000-0000-4000-8000-000000000009', 'MDHO_EM_PREENCHIMENTO', 'AGUARDANDO_APROVACAO_HSE', 'MDHO enviado', 'a1000000-0000-4000-8000-000000000010', now() - interval '13 days 16 hours'),
  ('11000000-0000-4000-8000-000000000009', 'AGUARDANDO_APROVACAO_HSE', 'AGUARDANDO_REGISTRO_IMS', 'MDHO aprovado', 'a1000000-0000-4000-8000-000000000013', now() - interval '13 days 8 hours'),
  ('11000000-0000-4000-8000-000000000009', 'AGUARDANDO_REGISTRO_IMS', 'EM_TRATATIVA', 'IMS informado', 'a1000000-0000-4000-8000-000000000010', now() - interval '13 days'),
  ('11000000-0000-4000-8000-000000000010', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000009', now() - interval '18 days'),
  ('11000000-0000-4000-8000-000000000010', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000010', now() - interval '17 days 12 hours'),
  ('11000000-0000-4000-8000-000000000010', 'EM_AVALIACAO', 'INTERDICAO_CONFIRMADA', 'Interdição Oficial', 'a1000000-0000-4000-8000-000000000010', now() - interval '17 days 8 hours'),
  ('11000000-0000-4000-8000-000000000010', 'INTERDICAO_CONFIRMADA', 'MDHO_EM_PREENCHIMENTO', 'MDHO iniciado', 'a1000000-0000-4000-8000-000000000010', now() - interval '17 days'),
  ('11000000-0000-4000-8000-000000000010', 'MDHO_EM_PREENCHIMENTO', 'AGUARDANDO_APROVACAO_HSE', 'MDHO enviado', 'a1000000-0000-4000-8000-000000000010', now() - interval '16 days 16 hours'),
  ('11000000-0000-4000-8000-000000000010', 'AGUARDANDO_APROVACAO_HSE', 'AGUARDANDO_REGISTRO_IMS', 'MDHO aprovado', 'a1000000-0000-4000-8000-000000000013', now() - interval '16 days 8 hours'),
  ('11000000-0000-4000-8000-000000000010', 'AGUARDANDO_REGISTRO_IMS', 'EM_TRATATIVA', 'IMS informado', 'a1000000-0000-4000-8000-000000000010', now() - interval '16 days'),
  ('11000000-0000-4000-8000-000000000011', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '20 days'),
  ('11000000-0000-4000-8000-000000000011', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000013', now() - interval '19 days 8 hours'),
  ('11000000-0000-4000-8000-000000000011', 'EM_AVALIACAO', 'INTERDICAO_CONFIRMADA', 'Interdição Oficial', 'a1000000-0000-4000-8000-000000000013', now() - interval '19 days'),
  ('11000000-0000-4000-8000-000000000011', 'INTERDICAO_CONFIRMADA', 'MDHO_EM_PREENCHIMENTO', 'MDHO iniciado', 'a1000000-0000-4000-8000-000000000010', now() - interval '18 days 16 hours'),
  ('11000000-0000-4000-8000-000000000011', 'MDHO_EM_PREENCHIMENTO', 'AGUARDANDO_APROVACAO_HSE', 'MDHO enviado', 'a1000000-0000-4000-8000-000000000010', now() - interval '18 days 8 hours'),
  ('11000000-0000-4000-8000-000000000011', 'AGUARDANDO_APROVACAO_HSE', 'AGUARDANDO_REGISTRO_IMS', 'MDHO aprovado', 'a1000000-0000-4000-8000-000000000013', now() - interval '18 days 2 hours'),
  ('11000000-0000-4000-8000-000000000011', 'AGUARDANDO_REGISTRO_IMS', 'EM_TRATATIVA', 'IMS informado', 'a1000000-0000-4000-8000-000000000013', now() - interval '18 days'),
  ('11000000-0000-4000-8000-000000000011', 'EM_TRATATIVA', 'AGUARDANDO_VALIDACAO', 'Ações submetidas', 'a1000000-0000-4000-8000-000000000007', now() - interval '1 day'),
  ('11000000-0000-4000-8000-000000000012', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000009', now() - interval '25 days'),
  ('11000000-0000-4000-8000-000000000012', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000013', now() - interval '24 days'),
  ('11000000-0000-4000-8000-000000000012', 'EM_AVALIACAO', 'INTERDICAO_CONFIRMADA', 'Interdição Oficial', 'a1000000-0000-4000-8000-000000000013', now() - interval '23 days 18 hours'),
  ('11000000-0000-4000-8000-000000000012', 'INTERDICAO_CONFIRMADA', 'MDHO_EM_PREENCHIMENTO', 'MDHO iniciado', 'a1000000-0000-4000-8000-000000000010', now() - interval '23 days'),
  ('11000000-0000-4000-8000-000000000012', 'MDHO_EM_PREENCHIMENTO', 'AGUARDANDO_APROVACAO_HSE', 'MDHO enviado', 'a1000000-0000-4000-8000-000000000010', now() - interval '22 days 12 hours'),
  ('11000000-0000-4000-8000-000000000012', 'AGUARDANDO_APROVACAO_HSE', 'AGUARDANDO_REGISTRO_IMS', 'MDHO aprovado', 'a1000000-0000-4000-8000-000000000013', now() - interval '22 days 4 hours'),
  ('11000000-0000-4000-8000-000000000012', 'AGUARDANDO_REGISTRO_IMS', 'EM_TRATATIVA', 'IMS informado', 'a1000000-0000-4000-8000-000000000013', now() - interval '22 days'),
  ('11000000-0000-4000-8000-000000000012', 'EM_TRATATIVA', 'AGUARDANDO_VALIDACAO', 'Ações submetidas', 'a1000000-0000-4000-8000-000000000007', now() - interval '4 days'),
  ('11000000-0000-4000-8000-000000000012', 'AGUARDANDO_VALIDACAO', 'LIBERADA', 'Liberação', 'a1000000-0000-4000-8000-000000000013', now() - interval '2 days'),
  ('11000000-0000-4000-8000-000000000013', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '32 days'),
  ('11000000-0000-4000-8000-000000000013', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000013', now() - interval '31 days 8 hours'),
  ('11000000-0000-4000-8000-000000000013', 'EM_AVALIACAO', 'VER_E_AGIR', 'Decisão Ver e Agir', 'a1000000-0000-4000-8000-000000000013', now() - interval '31 days'),
  ('11000000-0000-4000-8000-000000000013', 'VER_E_AGIR', 'LIBERADA', 'Liberação', 'a1000000-0000-4000-8000-000000000013', now() - interval '10 days'),
  ('11000000-0000-4000-8000-000000000013', 'LIBERADA', 'ENCERRADA', 'Encerramento', 'a1000000-0000-4000-8000-000000000013', now() - interval '8 days'),
  ('11000000-0000-4000-8000-000000000014', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '4 days'),
  ('11000000-0000-4000-8000-000000000014', 'PARALISACAO_PREVENTIVA', 'CANCELADA', 'Falso alarme', 'a1000000-0000-4000-8000-000000000013', now() - interval '3 days 20 hours'),
  ('11000000-0000-4000-8000-000000000015', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000002', now() - interval '7 days'),
  ('11000000-0000-4000-8000-000000000015', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000010', now() - interval '6 days 16 hours'),
  ('11000000-0000-4000-8000-000000000015', 'EM_AVALIACAO', 'INTERDICAO_CONFIRMADA', 'Interdição Oficial', 'a1000000-0000-4000-8000-000000000010', now() - interval '6 days 12 hours'),
  ('11000000-0000-4000-8000-000000000016', null, 'PARALISACAO_PREVENTIVA', 'Registro inicial', 'a1000000-0000-4000-8000-000000000009', now() - interval '9 hours'),
  ('11000000-0000-4000-8000-000000000016', 'PARALISACAO_PREVENTIVA', 'EM_AVALIACAO', 'Avaliação iniciada', 'a1000000-0000-4000-8000-000000000013', now() - interval '6 hours');

insert into public.occurrence_decisions (
  occurrence_id, decision_type, decision_reason, decided_by, decided_at
)
values
  ('11000000-0000-4000-8000-000000000004', 'VER_E_AGIR', 'Risco localizado, correção imediata viável sem interdição formal.', 'a1000000-0000-4000-8000-000000000010', now() - interval '4 days 18 hours'),
  ('11000000-0000-4000-8000-000000000005', 'INTERDICAO_OFICIAL', 'LOTO incompleto — interdição até correção do bloqueio.', 'a1000000-0000-4000-8000-000000000010', now() - interval '5 days 20 hours'),
  ('11000000-0000-4000-8000-000000000006', 'INTERDICAO_OFICIAL', 'Vapor 10 bar — interdição da linha até reparo.', 'a1000000-0000-4000-8000-000000000010', now() - interval '7 days 18 hours'),
  ('11000000-0000-4000-8000-000000000007', 'INTERDICAO_OFICIAL', 'Trabalho em altura sem proteção — interdição do acesso.', 'a1000000-0000-4000-8000-000000000010', now() - interval '9 days 16 hours'),
  ('11000000-0000-4000-8000-000000000008', 'INTERDICAO_OFICIAL', 'Espaço confinado sem monitoração — interdição da entrada.', 'a1000000-0000-4000-8000-000000000010', now() - interval '11 days 12 hours'),
  ('11000000-0000-4000-8000-000000000009', 'INTERDICAO_OFICIAL', 'Proteção de máquina removida — equipamento interditado.', 'a1000000-0000-4000-8000-000000000010', now() - interval '14 days 10 hours'),
  ('11000000-0000-4000-8000-000000000010', 'INTERDICAO_OFICIAL', 'Linga danificada — içamento interditado.', 'a1000000-0000-4000-8000-000000000010', now() - interval '17 days 8 hours'),
  ('11000000-0000-4000-8000-000000000011', 'INTERDICAO_OFICIAL', 'Produto químico sem identificação — dosagem interditada.', 'a1000000-0000-4000-8000-000000000013', now() - interval '19 days'),
  ('11000000-0000-4000-8000-000000000012', 'INTERDICAO_OFICIAL', 'Rota de fuga obstruída — correção obrigatória.', 'a1000000-0000-4000-8000-000000000013', now() - interval '23 days 18 hours'),
  ('11000000-0000-4000-8000-000000000013', 'VER_E_AGIR', 'Iluminação — correção local sem interdição formal.', 'a1000000-0000-4000-8000-000000000013', now() - interval '31 days'),
  ('11000000-0000-4000-8000-000000000015', 'INTERDICAO_OFICIAL', 'Escada imprópria — acesso interditado até substituição.', 'a1000000-0000-4000-8000-000000000010', now() - interval '6 days 12 hours');

-- Encarregado: snapshot OBSERVER (ACTIVITY_FOREMAN ainda não está no CHECK).
insert into public.occurrence_participants (
  occurrence_id, organization_id, organization_member_id, participant_type, is_primary, created_by
)
select
  o.id,
  'b1000000-0000-4000-8000-000000000001',
  case o.created_by
    when 'a1000000-0000-4000-8000-000000000002'::uuid then 'c1000000-0000-4000-8000-000000000002'::uuid
    else 'c1000000-0000-4000-8000-000000000009'::uuid
  end,
  'REPORTER',
  true,
  o.created_by
from public.occurrences o
where o.id >= '11000000-0000-4000-8000-000000000001'
  and o.id <= '11000000-0000-4000-8000-000000000016'
on conflict (occurrence_id, organization_member_id) do nothing;

insert into public.occurrence_participants (
  occurrence_id, organization_id, organization_member_id, participant_type, is_primary, created_by
)
values
  ('11000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', 'OBSERVER', true, 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000010', 'EVALUATOR', true, 'a1000000-0000-4000-8000-000000000010'),
  ('11000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', 'OBSERVER', true, 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000006', 'OBSERVER', true, 'a1000000-0000-4000-8000-000000000002'),
  ('11000000-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000013', 'EVALUATOR', true, 'a1000000-0000-4000-8000-000000000013')
on conflict (occurrence_id, organization_member_id) do nothing;

-- ----------------------------------------------------------------------------
-- MDHO (rascunho / enviado / aprovado)
-- ----------------------------------------------------------------------------

-- Inserir como DRAFT/SUBMITTED primeiro: o trigger impede SELECTIONs em APPROVED.
insert into public.mdho_assessments (
  id, occurrence_id, organization_id, status, complement,
  submitted_at, submitted_by, created_at
)
values
  ('13000000-0000-4000-8000-000000000006', '11000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', 'DRAFT', 'Rascunho — vazamento de vapor.', null, null, now() - interval '7 days 12 hours'),
  ('13000000-0000-4000-8000-000000000007', '11000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', 'SUBMITTED', 'Trabalho em altura sem linha de vida.', now() - interval '8 days 20 hours', 'a1000000-0000-4000-8000-000000000010', now() - interval '9 days 8 hours'),
  ('13000000-0000-4000-8000-000000000008', '11000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000001', 'SUBMITTED', 'Espaço confinado sem monitoração.', now() - interval '10 days 20 hours', 'a1000000-0000-4000-8000-000000000010', now() - interval '11 days 4 hours'),
  ('13000000-0000-4000-8000-000000000009', '11000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', 'SUBMITTED', 'Proteção de máquina removida.', now() - interval '13 days 16 hours', 'a1000000-0000-4000-8000-000000000010', now() - interval '14 days'),
  ('13000000-0000-4000-8000-000000000010', '11000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000001', 'SUBMITTED', 'Linga danificada.', now() - interval '16 days 16 hours', 'a1000000-0000-4000-8000-000000000010', now() - interval '17 days'),
  ('13000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000001', 'SUBMITTED', 'Produto químico sem identificação.', now() - interval '18 days 8 hours', 'a1000000-0000-4000-8000-000000000010', now() - interval '18 days 16 hours'),
  ('13000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000001', 'SUBMITTED', 'Rota de fuga obstruída.', now() - interval '22 days 12 hours', 'a1000000-0000-4000-8000-000000000010', now() - interval '23 days')
on conflict (id) do nothing;

insert into public.mdho_selections (assessment_id, category_id, option_id, created_by)
select a.id, '90000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000010'
from public.mdho_assessments a
where a.id in (
  '13000000-0000-4000-8000-000000000006',
  '13000000-0000-4000-8000-000000000007',
  '13000000-0000-4000-8000-000000000008',
  '13000000-0000-4000-8000-000000000009',
  '13000000-0000-4000-8000-000000000010',
  '13000000-0000-4000-8000-000000000011',
  '13000000-0000-4000-8000-000000000012'
)
on conflict (assessment_id, option_id) do nothing;

insert into public.mdho_selections (assessment_id, category_id, option_id, created_by)
select a.id, '90000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000010'
from public.mdho_assessments a
where a.id in (
  '13000000-0000-4000-8000-000000000006',
  '13000000-0000-4000-8000-000000000007',
  '13000000-0000-4000-8000-000000000008',
  '13000000-0000-4000-8000-000000000009',
  '13000000-0000-4000-8000-000000000010',
  '13000000-0000-4000-8000-000000000011',
  '13000000-0000-4000-8000-000000000012'
)
on conflict (assessment_id, option_id) do nothing;

update public.mdho_assessments
set
  status = 'APPROVED',
  approved_at = case id
    when '13000000-0000-4000-8000-000000000008' then now() - interval '10 days 8 hours'
    when '13000000-0000-4000-8000-000000000009' then now() - interval '13 days 8 hours'
    when '13000000-0000-4000-8000-000000000010' then now() - interval '16 days 8 hours'
    when '13000000-0000-4000-8000-000000000011' then now() - interval '18 days 2 hours'
    when '13000000-0000-4000-8000-000000000012' then now() - interval '22 days 4 hours'
  end,
  approved_by = 'a1000000-0000-4000-8000-000000000013'
where id in (
  '13000000-0000-4000-8000-000000000008',
  '13000000-0000-4000-8000-000000000009',
  '13000000-0000-4000-8000-000000000010',
  '13000000-0000-4000-8000-000000000011',
  '13000000-0000-4000-8000-000000000012'
);

-- ----------------------------------------------------------------------------
-- Planos de ação (datas relativas a now() — vencida / próxima / futura)
-- ----------------------------------------------------------------------------

insert into public.action_plans (
  id, occurrence_id, organization_id, status, summary, created_by, created_at, closed_at
)
values
  ('12000000-0000-4000-8000-000000000009', '11000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', 'IN_PROGRESS', 'Reinstalar proteção e treinar equipe.', 'a1000000-0000-4000-8000-000000000010', now() - interval '12 days', null),
  ('12000000-0000-4000-8000-000000000010', '11000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000001', 'IN_PROGRESS', 'Substituir lingas e revisar procedimento de içamento.', 'a1000000-0000-4000-8000-000000000010', now() - interval '15 days', null),
  ('12000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000001', 'AWAITING_VALIDATION', 'Identificar produto e disponibilizar FDS.', 'a1000000-0000-4000-8000-000000000013', now() - interval '17 days', null),
  ('12000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000001', 'COMPLETED', 'Desobstruir rota de fuga e sinalizar.', 'a1000000-0000-4000-8000-000000000013', now() - interval '21 days', now() - interval '2 days')
on conflict (id) do nothing;

insert into public.action_items (
  id, action_plan_id, organization_id, title, description,
  responsible_member_id, responsible_organization_id,
  due_at, priority, status,
  completion_description, completed_at, completed_by, validated_at, validated_by
)
values
  (
    '12100000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000009',
    'b1000000-0000-4000-8000-000000000001',
    'Reinstalar grade de proteção do agitador AG-22',
    'Fixar grade original e registrar inspeção.',
    'c1000000-0000-4000-8000-000000000007',
    'b1000000-0000-4000-8000-000000000001',
    now() - interval '2 days',
    'HIGH', 'PENDING',
    null, null, null, null, null
  ),
  (
    '12100000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000009',
    'b1000000-0000-4000-8000-000000000001',
    'DDS sobre proteção de máquinas',
    'Diálogo de segurança com a equipe do contrato.',
    'c1000000-0000-4000-8000-000000000010',
    'b1000000-0000-4000-8000-000000000001',
    now() + interval '2 days',
    'MEDIUM', 'PENDING',
    null, null, null, null, null
  ),
  (
    '12100000-0000-4000-8000-000000000003',
    '12000000-0000-4000-8000-000000000009',
    'b1000000-0000-4000-8000-000000000001',
    'Atualizar APR do agitador',
    'Incluir etapa obrigatória de reinstalação da proteção.',
    'c1000000-0000-4000-8000-000000000011',
    'b1000000-0000-4000-8000-000000000001',
    now() + interval '14 days',
    'MEDIUM', 'IN_PROGRESS',
    null, null, null, null, null
  ),
  (
    '12100000-0000-4000-8000-000000000004',
    '12000000-0000-4000-8000-000000000010',
    'b1000000-0000-4000-8000-000000000001',
    'Descartar linga danificada',
    'Segregar e destruir linga com alma exposta.',
    'c1000000-0000-4000-8000-000000000008',
    'b1000000-0000-4000-8000-000000000001',
    now() - interval '1 day',
    'CRITICAL', 'PENDING',
    null, null, null, null, null
  ),
  (
    '12100000-0000-4000-8000-000000000005',
    '12000000-0000-4000-8000-000000000010',
    'b1000000-0000-4000-8000-000000000001',
    'Inspecionar estoque de lingas',
    'Inspeção 100% do estoque do contrato 4600012345.',
    'c1000000-0000-4000-8000-000000000007',
    'b1000000-0000-4000-8000-000000000001',
    now() + interval '1 day',
    'HIGH', 'IN_PROGRESS',
    null, null, null, null, null
  ),
  (
    '12100000-0000-4000-8000-000000000006',
    '12000000-0000-4000-8000-000000000011',
    'b1000000-0000-4000-8000-000000000001',
    'Rotular tambor e anexar FDS',
    'Identificação permanente e FDS no ponto de uso.',
    'c1000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000001',
    now() - interval '3 days',
    'HIGH', 'AWAITING_VALIDATION',
    'Tambor rotulado e FDS afixada na casa de dosagem.',
    now() - interval '1 day',
    'a1000000-0000-4000-8000-000000000002',
    null, null
  ),
  (
    '12100000-0000-4000-8000-000000000007',
    '12000000-0000-4000-8000-000000000012',
    'b1000000-0000-4000-8000-000000000001',
    'Remover paletes da rota de fuga',
    'Desobstrução completa do corredor R-4.',
    'c1000000-0000-4000-8000-000000000007',
    'b1000000-0000-4000-8000-000000000001',
    now() - interval '12 days',
    'HIGH', 'COMPLETED',
    'Corredor liberado e demarcado.',
    now() - interval '5 days',
    'a1000000-0000-4000-8000-000000000007',
    now() - interval '3 days',
    'a1000000-0000-4000-8000-000000000013'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Notificações / ciência (timestamps coerentes; leitura ≠ ciência)
-- ----------------------------------------------------------------------------

insert into public.notification_events (
  id, organization_id, occurrence_id, event_type, priority, created_by, created_at
)
values
  ('15000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'OCCURRENCE_CREATED', 'HIGH', 'a1000000-0000-4000-8000-000000000002', now() - interval '2 hours'),
  ('15000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000003', 'DECISION_REQUIRED', 'CRITICAL', 'a1000000-0000-4000-8000-000000000010', now() - interval '2 days 20 hours'),
  ('15000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000005', 'INTERDICTION_CONFIRMED', 'CRITICAL', 'a1000000-0000-4000-8000-000000000010', now() - interval '5 days 20 hours'),
  ('15000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000007', 'MDHO_APPROVAL_REQUIRED', 'HIGH', 'a1000000-0000-4000-8000-000000000010', now() - interval '8 days 20 hours'),
  ('15000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000009', 'ACTION_PLAN_CREATED', 'HIGH', 'a1000000-0000-4000-8000-000000000010', now() - interval '12 days')
on conflict (id) do nothing;

insert into public.notifications (
  id, notification_event_id, organization_id, recipient_member_id,
  title, message, priority, requires_awareness, read_at, awareness_confirmed_at, created_at
)
values
  (
    '15100000-0000-4000-8000-000000000001',
    '15000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000005',
    'Nova Paralisação Preventiva SS-26-000101',
    'Vazamento de licor na Clarificação. Ciência requerida.',
    'HIGH', true, null, null, now() - interval '2 hours'
  ),
  (
    '15100000-0000-4000-8000-000000000002',
    '15000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000003',
    'Nova Paralisação Preventiva SS-26-000101',
    'Vazamento de licor na Clarificação. Ciência requerida.',
    'HIGH', true, now() - interval '90 minutes', null, now() - interval '2 hours'
  ),
  (
    '15100000-0000-4000-8000-000000000003',
    '15000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000013',
    'Nova Paralisação Preventiva SS-26-000101',
    'Vazamento de licor na Clarificação. Ciência requerida.',
    'HIGH', true, now() - interval '80 minutes', now() - interval '70 minutes', now() - interval '2 hours'
  ),
  (
    '15100000-0000-4000-8000-000000000004',
    '15000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000008',
    'Nova Paralisação Preventiva SS-26-000101',
    'Vazamento de licor na Clarificação.',
    'HIGH', false, null, null, now() - interval '2 hours'
  ),
  (
    '15100000-0000-4000-8000-000000000005',
    '15000000-0000-4000-8000-000000000003',
    'b1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000005',
    'Decisão requerida SS-26-000103',
    'Cabo energizado exposto — aguardando decisão.',
    'CRITICAL', true, now() - interval '2 days 10 hours', now() - interval '2 days 8 hours', now() - interval '2 days 20 hours'
  ),
  (
    '15100000-0000-4000-8000-000000000006',
    '15000000-0000-4000-8000-000000000005',
    'b1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000013',
    'Interdição confirmada SS-26-000105',
    'LOTO incompleto na Filtração.',
    'CRITICAL', true, now() - interval '5 days 10 hours', null, now() - interval '5 days 20 hours'
  ),
  (
    '15100000-0000-4000-8000-000000000007',
    '15000000-0000-4000-8000-000000000007',
    'b1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000013',
    'MDHO aguardando aprovação SS-26-000107',
    'Trabalho em altura sem linha de vida.',
    'HIGH', false, now() - interval '8 days 10 hours', null, now() - interval '8 days 20 hours'
  ),
  (
    '15100000-0000-4000-8000-000000000008',
    '15000000-0000-4000-8000-000000000009',
    'b1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000010',
    'Plano de ação criado SS-26-000109',
    'Plano em andamento na Precipitação.',
    'HIGH', false, null, null, now() - interval '12 days'
  )
on conflict (id) do nothing;

do $$
begin
  raise notice 'SafeStop local — senha comum das personas: SafeStop-QA-Local-2026';
  raise notice 'Operacional: admin.hydro / tst.hydro / lideranca.hse @safestop.local (org Hydro QA)';
  raise notice 'Super Admin: superadmin@safestop.local | técnico: qa-platform@safestop.local';
end
$$;
