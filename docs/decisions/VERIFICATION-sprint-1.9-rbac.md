# Verificação Sprint 1.9 — RBAC

Checklist manual de segurança e QA (executar após `supabase db reset`).

## Cenários

| ID | Usuário | Esperado |
|---|---|---|
| F7 | qa-noorg@safestop.local | OrganizationEmpty (sem org) |
| F8 | qa-field@safestop.local | HSE de Campo com `occurrence.create` na Alpha |
| F9 | qa-noperm@safestop.local | Vínculo ativo, sem `member_roles` (hasNoPermissions) |
| F2 | qa-emptyrole@safestop.local | Vínculo + papel `QA Papel Vazio` sem `role_permissions` |
| F10 | qa-dualrole@safestop.local | HSE + Gestor no mesmo `organization_member_id` (união runtime) |
| F4/F5 | qa-multi@safestop.local | Troca de org altera papéis exibidos; cache authorization limpo |
| Platform | qa-platform@safestop.local | `membership_type = PLATFORM_ADMIN` (bypass UI) |
| Logout | qualquer | Queries `authorization` e `organizations` removidas |
| Cross-tenant | qa-multi | Permissões da org A não aplicadas na org B após troca |

## Segurança

- [ ] `can()` retorna `false` durante `isLoading` / `isSwitching`
- [ ] Nenhum `organization_id` aceito de URL para contexto
- [ ] `getEffectiveAuthorization` usa `organizationMemberId` do vínculo ativo validado
- [ ] Sem `service_role` nos apps
- [ ] Matriz `role_permissions` semeada conforme [RBAC-MATRIX-APPROVED.md](./RBAC-MATRIX-APPROVED.md)

## Comandos

```bash
pnpm install
pnpm typecheck
pnpm lint
```
