-- ============================================================================
-- SafeStop — Seed estrutural (Sprint 1.5 + usuário de teste local)
-- ============================================================================
-- Contém dados estruturais estáveis previstos na documentação oficial:
--   - catálogo oficial de papéis (docs/database.md §6.1, docs/workflow.md §3);
--   - catálogo oficial de permissões (docs/database.md §6.2);
--   - usuário Auth de QA local (Sprint 1.6) com perfil via trigger on_auth_user_created.
--
-- Não contém: organizações, unidades, áreas, contratos ou vínculos fictícios.
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
-- Relacionamentos padrão papel-permissão (role_permissions)
-- ----------------------------------------------------------------------------
-- NÃO SEMEADO NESTA SPRINT.
--
-- docs/database.md e docs/workflow.md não definem uma matriz explícita e
-- definitiva de papel -> permissões (workflow.md §3 afirma literalmente:
-- "As permissões reais deverão ser verificadas por códigos de autorização",
-- e docs/workflow.md §26 lista "permissões de cada perfil" como decisão
-- pendente). Derivar essa matriz apenas da descrição textual dos papéis
-- seria inventar regra de negócio não documentada.
--
-- Conforme instrução do prompt desta Sprint, o ponto foi registrado como
-- divergência/ambiguidade e não implementado (ver relatório final —
-- "Decisões ou ambiguidades"). A estrutura (tabela role_permissions) está
-- pronta para receber esses vínculos quando a matriz for aprovada.

-- ----------------------------------------------------------------------------
-- Usuário Auth de QA local (somente desenvolvimento — 127.0.0.1:54321)
-- ----------------------------------------------------------------------------
-- E-mail e nome alinhados a supabase/qa-credentials.local.example.
-- Senha local documentada: SafeStop-QA-Local-2026
-- (defina QA_TEST_USER_PASSWORD com o mesmo valor em qa-credentials.local).
-- O perfil em public.profiles é criado automaticamente pelo trigger
-- on_auth_user_created (migration 20260714210000_create_profile_on_auth_user).

do $$
declare
  v_user_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_email text := 'qa-field@safestop.local';
  v_full_name text := 'QA Campo SafeStop';
  v_password text := 'SafeStop-QA-Local-2026';
begin
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
end
$$;
