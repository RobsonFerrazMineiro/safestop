# Decisão pendente — Matriz oficial `role_permissions`

**Status:** aprovado — ver [RBAC-MATRIX-APPROVED.md](./RBAC-MATRIX-APPROVED.md)  
**Sprint:** 1.9 — RBAC  
**Data:** 2026-07-15  
**Artefato de proposta:** [RBAC-MATRIX-PROPOSAL.md](./RBAC-MATRIX-PROPOSAL.md)  
**Matriz aprovada:** [RBAC-MATRIX-APPROVED.md](./RBAC-MATRIX-APPROVED.md)

---

## Contexto

O catálogo de papéis (9 globais) e permissões (25 códigos) está definido em `docs/database.md` §6.1–6.2 e semeado em `supabase/seed.sql`.

A matriz **papel → permissão** (`role_permissions`) **não** está documentada de forma explícita e definitiva em:

- `docs/workflow.md` §3 (responsabilidades textuais, não códigos);
- `docs/workflow.md` §26 (decisões pendentes não incluem a matriz RBAC).

Derivar associações apenas das descrições textuais dos papéis seria inventar regra de negócio.

---

## Decisão

1. ~~**Não semear** `role_permissions` até aprovação formal da matriz~~ → **Matriz aprovada** em 2026-07-15 ([RBAC-MATRIX-APPROVED.md](./RBAC-MATRIX-APPROVED.md)).
2. A Sprint 1.9 entrega o **mecanismo de autorização** (provider, hooks, guards, cache).
3. O seed de QA inclui `member_roles`; **DATABASE** deve semear `role_permissions` conforme matriz aprovada.

---

## Artefato de aprovação

A proposta detalhada (9 papéis, rastreabilidade com `docs/workflow.md` §3, 7 decisões humanas) está em:

**[RBAC-MATRIX-PROPOSAL.md](./RBAC-MATRIX-PROPOSAL.md)**

Resumo rápido — permissões propostas por papel:

| Papel | Qtd | Status |
|---|---|---|
| HSE de Campo | 4 | proposta |
| Liderança da Contratada | 5 | proposta (+ decisão #1) |
| Fiscal do Contrato | 5 | proposta (+ decisão #2) |
| Supervisor HSE | 14 | proposta (+ decisões #3, #7) |
| Liderança HSE | 13 | proposta |
| Gestor | 4 | proposta |
| Administrador da Empresa | 8 | proposta (+ decisão #4) |
| Administrador da Plataforma | 25 ou 0 | proposta (+ decisão #5) |

Referência: códigos em `docs/database.md` §6.2 e `packages/types/src/permission-codes.ts`.

---

## Após aprovação

1. ~~Atualizar `supabase/seed.sql` com inserts em `role_permissions`.~~ **Concluído** (Etapa 2 DATABASE, 2026-07-15).
2. Regenerar tipos se necessário.
3. Reexecutar cenários QA de autorização com permissões efetivas.

---

## Referências

- `docs/database.md` §6.3
- `docs/workflow.md` §3, §115
- `supabase/seed.sql` (comentário em `role_permissions`)
