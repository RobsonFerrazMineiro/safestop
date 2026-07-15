# Matriz RBAC — Aprovada (Etapa 0 — PRODUTO)

**Status:** `APROVADO` (com ressalvas documentadas abaixo)  
**Sprint:** 1.9 — RBAC  
**Data de aprovação:** 2026-07-15  
**Aprovado por:** Dono do produto (sessão Cursor)  
**Desbloqueia:** seed `role_permissions` — Etapa 2 DATABASE

**Proposta base:** [RBAC-MATRIX-PROPOSAL.md](./RBAC-MATRIX-PROPOSAL.md)

---

## Decisões registradas

| # | Tema | Decisão |
|---|---|---|
| 1 | Contratada — registrar correções | `occurrence.validate_correction` |
| 2 | Fiscal — avaliar ocorrência | Sim — incluir `occurrence.evaluate` |
| 3 | Quem preenche MDHO (`mdho.fill`) | **Supervisor HSE** e **Liderança HSE** (Eng/Téc SST atuam nesses papéis; não há papel separado no catálogo) |
| 4 | Admin Empresa — leitura de ocorrências | **Pendente** — mantida proposta: `occurrence.read` apenas |
| 5 | Admin Plataforma na matriz | **25 permissões** no papel global |
| 6 | `notification.read` operacional | **Omitir** até módulo de notificações |
| 7 | `occurrence.cancel` — Supervisor HSE | **Pendente** — mantida proposta: incluir |

### Ressalvas

1. **"Gentente HSE"** mencionado na decisão #3: não existe como papel global no catálogo (9 papéis). Interpretado como perfil operacional que assume **Supervisor HSE** ou **Liderança HSE**. Se referia-se a **Gestor**, este papel **não** recebe `mdho.fill`.
2. Decisões **#4** e **#7** não respondidas explicitamente — aplicada proposta conservadora. Ajustar antes do seed se necessário.

---

## Matriz oficial aprovada

### HSE de Campo

```
occurrence.create
occurrence.read
notification.confirm_awareness
```

### Liderança da Contratada

```
occurrence.read
occurrence.validate_correction
action_plan.manage
notification.confirm_awareness
```

### Fiscal do Contrato

```
occurrence.read
occurrence.evaluate
occurrence.validate_correction
notification.confirm_awareness
```

### Supervisor HSE

```
occurrence.read
occurrence.evaluate
occurrence.confirm_interdiction
occurrence.validate_correction
occurrence.release
occurrence.cancel
mdho.fill
mdho.submit
ims_reference.register
ims_reference.update
action_plan.create
action_plan.manage
notification.confirm_awareness
```

### Liderança HSE

```
occurrence.read
occurrence.evaluate
occurrence.confirm_interdiction
occurrence.validate_correction
occurrence.release
mdho.fill
mdho.approve
mdho.return
action_plan.validate
ims_reference.register
ims_reference.update
audit.read
notification.confirm_awareness
```

### Gestor

```
occurrence.read
report.read
notification.confirm_awareness
```

### Administrador da Empresa

```
user.manage
organization.manage
area.manage
contract.manage
settings.manage
audit.read
occurrence.read
report.read
```

### Administrador da Plataforma

Todos os 25 códigos em `packages/types/src/permission-codes.ts` / `docs/database.md` §6.2.

---

## Contagem por papel

| Papel | Permissões |
|---|---|
| HSE de Campo | 3 |
| Liderança da Contratada | 4 |
| Fiscal do Contrato | 4 |
| Supervisor HSE | 13 |
| Liderança HSE | 13 |
| Gestor | 3 |
| Administrador da Empresa | 8 |
| Administrador da Plataforma | 25 |

---

## Próximo passo

1. ~~**DATABASE (Etapa 2):** semear `role_permissions` em `supabase/seed.sql` conforme listas acima.~~ **Concluído** (2026-07-15).
2. **QA:** reexecutar F8 — usuário `qa-field` com papel HSE de Campo deve obter permissões efetivas.
3. Atualizar status em [DECISION-pending-rbac-matrix.md](./DECISION-pending-rbac-matrix.md) para concluído.

---

## Referências

- `docs/workflow.md` §3
- `docs/database.md` §6.2
- `packages/types/src/permission-codes.ts`
