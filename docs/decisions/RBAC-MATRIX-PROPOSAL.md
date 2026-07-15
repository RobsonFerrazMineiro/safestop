# Matriz RBAC — Proposta para Aprovação (Etapa 0 — PRODUTO)

**Status:** `APROVADO` — ver [RBAC-MATRIX-APPROVED.md](./RBAC-MATRIX-APPROVED.md)  
**Sprint:** 1.9 — RBAC  
**Data:** 2026-07-15  
**Bloqueia:** seed de `role_permissions` em `supabase/seed.sql` (Etapa 2 — DATABASE)

---

## Objetivo deste artefato

Formalizar a matriz oficial **papel global → permissão (`permissions.code`)** para os 9 papéis e 25 códigos já catalogados em `docs/database.md` §6.1–6.2 e semeados em `supabase/seed.sql`.

Até a aprovação registrada neste documento, o mecanismo de autorização (Sprint 1.9) opera com **negação por padrão** — comportamento correto e seguro.

---

## Fontes consultadas

| Fonte | Uso nesta proposta |
|---|---|
| `docs/database.md` §6.1–6.3 | Catálogo de papéis e permissões |
| `docs/workflow.md` §3 | Responsabilidades textuais por perfil |
| `docs/database.md` §23.2 | Exemplos de acesso por perfil |
| `docs/engineering.md` §20 | Princípio papel ≠ permissão; escopo organizacional |
| `docs/product.md` | Alinhamento operacional (comunicação, campo, liderança) |
| `packages/types/src/permission-codes.ts` | Lista tipada dos 25 códigos |

**Regra aplicada:** cada permissão proposta abaixo cita a responsabilidade documental que a motiva. Onde a documentação é ambígua ou usa *"conforme permissão"*, o item está marcado como **DECISÃO HUMANA**.

---

## Catálogo de permissões (referência)

| Código | Descrição (seed) |
|---|---|
| `occurrence.create` | Registrar nova Paralisação Preventiva |
| `occurrence.read` | Consultar ocorrências no escopo autorizado |
| `occurrence.evaluate` | Iniciar avaliação / registrar decisão (Ver e Agir ou IO) |
| `occurrence.confirm_interdiction` | Confirmar Interdição Oficial |
| `occurrence.validate_correction` | Validar correção enviada |
| `occurrence.release` | Liberar atividade interrompida |
| `occurrence.cancel` | Cancelar ocorrência com justificativa |
| `mdho.fill` | Preencher Avaliação Técnica MDHO |
| `mdho.submit` | Enviar MDHO para aprovação HSE |
| `mdho.approve` | Aprovar MDHO enviado |
| `mdho.return` | Devolver MDHO para correção |
| `ims_reference.register` | Registrar referência IMS manualmente |
| `ims_reference.update` | Corrigir referência IMS registrada |
| `action_plan.create` | Criar plano de ação |
| `action_plan.manage` | Gerenciar ações corretivas |
| `action_plan.validate` | Validar conclusão de ações |
| `notification.read` | Consultar notificações recebidas |
| `notification.confirm_awareness` | Confirmar ciência de notificação |
| `user.manage` | Gerenciar usuários, vínculos e papéis |
| `organization.manage` | Gerenciar dados da organização |
| `area.manage` | Gerenciar áreas operacionais |
| `contract.manage` | Gerenciar contratos |
| `settings.manage` | Ajustar configurações da plataforma |
| `report.read` | Consultar relatórios e indicadores |
| `audit.read` | Consultar registros de auditoria |

---

## Matriz proposta (9 papéis × permissões)

Legenda de confiança:

- **A** — alinhamento direto com `docs/workflow.md` §3 ou `docs/database.md` §23.2  
- **D** — decisão humana necessária (documentação ambígua)

---

### 1. HSE de Campo

**Referência:** `docs/workflow.md` §3.1, `docs/database.md` §23.2 (HSE de Campo)

| Permissão | Proposta | Ref. | Conf. |
|---|---|---|---|
| `occurrence.create` | ✅ | Registrar Paralisação Preventiva | A |
| `occurrence.read` | ✅ | Acompanhar ocorrências do escopo | A |
| `notification.read` | ✅ | Receber/acompanhar alertas (implícito no fluxo) | D |
| `notification.confirm_awareness` | ✅ | Confirmar ciência quando destinatário | A |
| Demais | ❌ | §3.1 "Não pode, por padrão": IO, MDHO, liberar, IMS | A |

**Lista proposta:** `occurrence.create`, `occurrence.read`, `notification.read`, `notification.confirm_awareness`

---

### 2. Liderança da Contratada

**Referência:** `docs/workflow.md` §3.2

| Permissão | Proposta | Ref. | Conf. |
|---|---|---|---|
| `occurrence.read` | ✅ | Acompanhar ocorrências da contratada | A |
| `notification.read` | ✅ | Receber alerta | A |
| `notification.confirm_awareness` | ✅ | Confirmar ciência | A |
| `occurrence.validate_correction` | ✅ | Registrar/validar correções (contratada) | D |
| `action_plan.manage` | ✅ | Acompanhar ações corretivas | D |
| Demais | ❌ | Sem avaliação MDHO, IO, liberação | A |

**Lista proposta:** `occurrence.read`, `notification.read`, `notification.confirm_awareness`, `occurrence.validate_correction`, `action_plan.manage`

**DECISÃO HUMANA #1:** `occurrence.validate_correction` cobre "registrar correções" da contratada, ou é necessária permissão adicional / fluxo distinto?

---

### 3. Fiscal do Contrato

**Referência:** `docs/workflow.md` §3.3 (*"conforme permissão"*)

| Permissão | Proposta | Ref. | Conf. |
|---|---|---|---|
| `occurrence.read` | ✅ | Visualizar ocorrências do contrato | A |
| `occurrence.evaluate` | ✅ | Participar da avaliação | D |
| `occurrence.validate_correction` | ✅ | Validar correções | A |
| `notification.read` | ✅ | Acompanhar tratativas | D |
| `notification.confirm_awareness` | ✅ | Confirmar ciência | A |
| Demais | ❌ | Sem IO, MDHO, liberação por padrão | D |

**Lista proposta:** `occurrence.read`, `occurrence.evaluate`, `occurrence.validate_correction`, `notification.read`, `notification.confirm_awareness`

**DECISÃO HUMANA #2:** Fiscal pode `occurrence.evaluate` ou apenas leitura + validação pontual?

---

### 4. Supervisor HSE

**Referência:** `docs/workflow.md` §3.4

| Permissão | Proposta | Ref. | Conf. |
|---|---|---|---|
| `occurrence.read` | ✅ | Acompanhar ocorrências | A |
| `occurrence.evaluate` | ✅ | Iniciar avaliação; registrar decisão | A |
| `occurrence.confirm_interdiction` | ✅ | Confirmar Interdição Oficial | A |
| `occurrence.validate_correction` | ✅ | Validar correções | A |
| `occurrence.release` | ✅ | Liberar atividade | A |
| `occurrence.cancel` | ✅ | Cancelar com justificativa (workflow §5.3) | D |
| `mdho.fill` | ✅ | Acompanhar/preencher MDHO | D |
| `mdho.submit` | ✅ | Enviar MDHO | D |
| `ims_reference.register` | ✅ | Registrar referência IMS | A |
| `ims_reference.update` | ✅ | Corrigir referência IMS | D |
| `action_plan.create` | ✅ | Plano de ação em IO | D |
| `action_plan.manage` | ✅ | Gerenciar ações | D |
| `notification.read` | ✅ | Fluxo operacional | D |
| `notification.confirm_awareness` | ✅ | Ciência | D |
| Demais | ❌ | Aprovação MDHO é Liderança HSE (§3.5) | A |

**Lista proposta:** `occurrence.read`, `occurrence.evaluate`, `occurrence.confirm_interdiction`, `occurrence.validate_correction`, `occurrence.release`, `occurrence.cancel`, `mdho.fill`, `mdho.submit`, `ims_reference.register`, `ims_reference.update`, `action_plan.create`, `action_plan.manage`, `notification.read`, `notification.confirm_awareness`

**DECISÃO HUMANA #3:** Supervisor preenche MDHO (`mdho.fill`) ou apenas Liderança HSE / papel dedicado?

---

### 5. Liderança HSE

**Referência:** `docs/workflow.md` §3.5

| Permissão | Proposta | Ref. | Conf. |
|---|---|---|---|
| `occurrence.read` | ✅ | Acompanhar Interdições | A |
| `occurrence.evaluate` | ✅ | Revisar decisões | D |
| `occurrence.confirm_interdiction` | ✅ | Acompanhar/confirmar IO | D |
| `occurrence.validate_correction` | ✅ | Validar correções | A |
| `occurrence.release` | ✅ | Liberar atividades | A |
| `mdho.approve` | ✅ | Aprovar MDHO | A |
| `mdho.return` | ✅ | Devolver MDHO | A |
| `action_plan.validate` | ✅ | Validar planos de ação | A |
| `ims_reference.register` | ✅ | Registrar IMS quando autorizado | A |
| `ims_reference.update` | ✅ | Corrigir referência | D |
| `audit.read` | ✅ | Consultar auditoria | A |
| `notification.read` | ✅ | Fluxo | D |
| `notification.confirm_awareness` | ✅ | Ciência | D |
| Demais | ❌ | Administração é Administrador (§3.7) | A |

**Lista proposta:** `occurrence.read`, `occurrence.evaluate`, `occurrence.confirm_interdiction`, `occurrence.validate_correction`, `occurrence.release`, `mdho.approve`, `mdho.return`, `action_plan.validate`, `ims_reference.register`, `ims_reference.update`, `audit.read`, `notification.read`, `notification.confirm_awareness`

---

### 6. Gestor

**Referência:** `docs/workflow.md` §3.6 (*"conforme escopo"*)

| Permissão | Proposta | Ref. | Conf. |
|---|---|---|---|
| `occurrence.read` | ✅ | Acompanhar ocorrências | A |
| `notification.read` | ✅ | Receber alertas | A |
| `notification.confirm_awareness` | ✅ | Confirmar ciência | A |
| `report.read` | ✅ | Consultar indicadores | A |
| Demais | ❌ | Sem decisão operacional nem admin | A |

**Lista proposta:** `occurrence.read`, `notification.read`, `notification.confirm_awareness`, `report.read`

---

### 7. Administrador da Empresa

**Referência:** `docs/workflow.md` §3.7, `docs/database.md` §23.2 (Administrador)

| Permissão | Proposta | Ref. | Conf. |
|---|---|---|---|
| `user.manage` | ✅ | Gerenciar usuários | A |
| `organization.manage` | ✅ | Configurações da própria organização | A |
| `area.manage` | ✅ | Configurar áreas | A |
| `contract.manage` | ✅ | Contratos da organização | D |
| `settings.manage` | ✅ | Ajustar configurações | A |
| `audit.read` | ✅ | Consultar auditoria | A |
| `occurrence.read` | ✅ | Visibilidade para gestão (sem alterar críticas) | D |
| `report.read` | ✅ | Indicadores | D |
| Demais | ❌ | §3.7: não alterar ocorrências críticas sem trilha | A |

**Lista proposta:** `user.manage`, `organization.manage`, `area.manage`, `contract.manage`, `settings.manage`, `audit.read`, `occurrence.read`, `report.read`

**DECISÃO HUMANA #4:** Admin da Empresa tem `occurrence.read` apenas, ou também `occurrence.cancel` / outras para suporte operacional?

---

### 8. Administrador da Plataforma

**Referência:** papel global em `docs/database.md` §6.1; bypass RLS via `membership_type = 'PLATFORM_ADMIN'` (separado)

| Permissão | Proposta | Ref. | Conf. |
|---|---|---|---|
| **Todas (25)** | ✅ | Administração irrestrita entre organizações | D |

**Lista proposta:** todos os códigos em `PERMISSION_CODES`

**DECISÃO HUMANA #5:** Confirmar se o papel global recebe as 25 permissões na matriz, ou se o bypass é **exclusivamente** via `membership_type` + `is_platform_admin()` (UI), mantendo `role_permissions` vazio para este papel.

**Nota arquitetural (Sprint 1.9):** `isPlatformAdmin` na UI deriva de `membership_type`, não do nome do papel. A matriz do papel global pode coexistir como documentação, mas não substitui `is_platform_admin()` no RLS.

---

### 9. Papéis sem entrada acima

Não há nono papel além dos 8 operacionais + Administrador da Plataforma. Total: **9 papéis globais** (confirmado no seed).

---

## Resumo tabular (visão rápida)

| Papel | Qtd permissões propostas |
|---|---|
| HSE de Campo | 4 |
| Liderança da Contratada | 5 |
| Fiscal do Contrato | 5 |
| Supervisor HSE | 14 |
| Liderança HSE | 13 |
| Gestor | 4 |
| Administrador da Empresa | 8 |
| Administrador da Plataforma | 25 (ou 0 — ver decisão #5) |

---

## Decisões humanas pendentes (checklist de aprovação)

O dono do produto deve responder **antes** de liberar DATABASE:

| # | Pergunta | Opções |
|---|---|---|
| 1 | Contratada: como modelar "registrar correções"? | A) `occurrence.validate_correction` · B) outro código · C) sem permissão dedicada nesta fase |
| 2 | Fiscal: pode `occurrence.evaluate`? | A) Sim · B) Não (somente read + validate) |
| 3 | Quem preenche MDHO (`mdho.fill`)? | A) Supervisor HSE · B) Liderança HSE · C) ambos |
| 4 | Admin Empresa: `occurrence.read` apenas? | A) Sim · B) incluir outras (especificar) |
| 5 | Admin Plataforma na matriz | A) 25 permissões · B) 0 (só `PLATFORM_ADMIN`) |
| 6 | `notification.read` para papéis operacionais | A) incluir onde proposto · B) omitir até módulo de notificações |
| 7 | `occurrence.cancel` para Supervisor HSE | A) incluir · B) somente Liderança HSE |

---

## Registro de aprovação

Preencher após revisão:

```text
Aprovado por: _______________________
Data: _______________________
Versão da proposta: 2026-07-15

Decisões #1–#7:
  1: ___
  2: ___
  3: ___
  4: ___
  5: ___
  6: ___
  7: ___

Observações: _______________________
```

Ao aprovar, alterar **Status** no topo deste arquivo para `APROVADO` e atualizar `DECISION-pending-rbac-matrix.md`.

---

## Próximo passo após aprovação

1. **DATABASE (Etapa 2):** inserir `role_permissions` em `supabase/seed.sql` conforme matriz aprovada.
2. **QA:** reexecutar F8 com permissões efetivas (não mais `AuthorizationEmpty` para usuário com papel semeado).
3. **Commit:** `chore(supabase): seed role_permissions com matriz RBAC aprovada`

---

## Referências

- [DECISION-pending-rbac-matrix.md](./DECISION-pending-rbac-matrix.md)
- [VERIFICATION-sprint-1.9-rbac.md](./VERIFICATION-sprint-1.9-rbac.md)
- `docs/workflow.md` §3, §115
- `docs/database.md` §6, §23.2
