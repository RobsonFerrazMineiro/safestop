-- ============================================================================
-- SafeStop — Criação automática de profiles ao inserir auth.users (Opção A)
-- ============================================================================
-- Trigger AFTER INSERT em auth.users cria linha correspondente em public.profiles.
-- Não cria organização, vínculo, papel ou permissão.
-- profiles_select e profiles_update permanecem inalteradas; sem policy de INSERT.
-- ============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text;
begin
  v_full_name := nullif(
    btrim(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        ''
      )
    ),
    ''
  );

  if v_full_name is null and new.email is not null then
    v_full_name := nullif(btrim(split_part(new.email, '@', 1)), '');
  end if;

  if v_full_name is null then
    v_full_name := 'Usuário SafeStop';
  end if;

  insert into public.profiles (id, full_name, email, is_active)
  values (new.id, v_full_name, new.email, true)
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Cria public.profiles ao inserir auth.users. full_name deriva de raw_user_meta_data ou fallback seguro (docs/database.md §5.2).';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill one-time: usuários Auth já existentes sem perfil (dev/local).
insert into public.profiles (id, full_name, email, is_active)
select
  u.id,
  coalesce(
    nullif(
      btrim(
        coalesce(
          u.raw_user_meta_data ->> 'full_name',
          u.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    ),
    nullif(btrim(split_part(u.email, '@', 1)), ''),
    'Usuário SafeStop'
  ),
  u.email,
  true
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
);
