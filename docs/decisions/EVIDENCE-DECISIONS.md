# Decisões — Evidências de Ocorrência (Sprint 2.2)

**Status:** `APROVADO`  
**Sprint:** 2.2 — Evidências de Ocorrência  
**Data:** 2026-08-01  
**Etapa:** 0 — Produto (agente DOCS / MASTER)  
**Gate:** **G0 desbloqueado** — libera DATABASE (Etapa 1) e BACKEND (Etapa 2)

**Arquitetura base:** Sprint 2.2 — Evidências de Ocorrência (2026-08-01, aprovada)

**Fundação:** Sprint 2.0 (Occurrences) + Sprint 2.1 (Paralisação Preventiva — fotos **fora** da 2.1; ver A-R1 / A-R7)

**Spec UI:** [`EVIDENCE-UI-SPEC.md`](./EVIDENCE-UI-SPEC.md)

**Modelo de dados:** `docs/database.md` §13.1 e §24 — **não reescrever**; este documento apenas referencia.

---

## Objetivo

Registrar as decisões de produto **PO-1 a PO-15** da Sprint 2.2 **sem inventar regra de negócio**, usando como fonte primária:

- arquitetura Sprint 2.2;
- `docs/workflow.md` §7.1 e §19;
- `docs/database.md` §13.1 e §24;
- `docs/engineering.md` §18 e §32;
- `docs/decisions/PREVENTIVE-STOP-DECISIONS.md` (fotos fora da 2.1).

**RBAC:** somente `occurrence.create` (upload/remoção) e `occurrence.read` (listagem/preview/signed URL). **Não** inventar `attachment.*`.

---

## Gate G0

| Item | Estado |
|---|---|
| **G0 — Etapa 0 PO** | **Desbloqueado** (2026-08-01) |
| **Desbloqueia** | DATABASE (tabela/RLS/Storage/CHECK) e BACKEND (RPCs prepare/complete/fail/delete/signed URL) |
| **Critério** | PO-1…PO-15 sem ambiguidade; implementação validável contra este documento |
| **UIUX** | Spec em `EVIDENCE-UI-SPEC.md` (cross-check abaixo) |

Ordem oficial: **Etapa 0 DOCS → DATABASE → BACKEND → MOBILE/WEB**.  
Documento retroativo quando a implementação já existir: decisões abaixo são a fonte oficial para validação.

---

## Decisões aprovadas

### PO-1 — Tipos de evidência na Sprint 2.2

| Item | Decisão |
|---|---|
| **Escopo MVP 2.2** | **Fotos only** — `image/jpeg`, `image/png`, `image/webp` |
| **Documentos (PDF, Office)** | **Fora do MVP 2.2** — fase 2.2b ou sprint futura |
| **Entidade persistida** | `occurrence_attachments` (`docs/database.md` §13.1) — **não** criar tabela `occurrence_evidence` |
| **Discriminador** | Campo `attachment_type`; Sprint 2.2 usa **`INITIAL_EVIDENCE`** |
| **Outros tipos** | `CORRECTION_EVIDENCE`, `RELEASE_EVIDENCE`, `DOCUMENT`, `OTHER` — **fora** dos fluxos 2.2 |

---

### PO-2 — Formatos MIME permitidos

| Item | Decisão |
|---|---|
| **Allowlist** | `image/jpeg`, `image/png`, `image/webp` |
| **Validação** | Cliente (Zod) + RPC + Storage `allowed_mime_types` + CHECK na tabela |
| **Executáveis / scripts / outros MIME** | **Bloqueados** |

**Copy UI (UI-SPEC):** `Use apenas imagens JPG, PNG ou WebP.`

---

### PO-3 — Tamanho máximo por arquivo

| Item | Decisão |
|---|---|
| **Limite** | **10 MiB** (10 485 760 bytes) por arquivo |
| **Escopo** | Bucket `occurrence-evidence` + CHECK + validação RPC |
| **config.toml global** | Pode permanecer maior; **limite do bucket prevalece** |

**Copy UI:** `A imagem ultrapassa o tamanho máximo permitido.`

---

### PO-4 — Quantidade máxima por ocorrência

| Item | Decisão |
|---|---|
| **Limite** | **20** evidências **ativas** por ocorrência |
| **Ativa** | `deleted_at IS NULL` e `upload_status` em `PENDING` ou `COMPLETED` |
| **Validação** | RPC `prepare_occurrence_attachment_upload` antes do INSERT |
| **Lote UI** | Picker pode limitar lote (ex. 10); o teto oficial permanece **20 ativas** |

---

### PO-5 — Evidência obrigatória na abertura PP?

| Item | Decisão |
|---|---|
| **Obrigatória?** | **Não** |
| **Fonte** | `docs/workflow.md` §7.1 — *ao menos uma evidência, **quando viável*** |
| **Fluxo** | `create_occurrence` **não** exige anexo; upload **após** ocorrência no servidor |
| **PP < 60s** | Preservado — evidência não bloqueia o registro inicial (A-R1 / A-R7) |

---

### PO-6 — Legenda (`caption`)

| Item | Decisão |
|---|---|
| **Obrigatória?** | **Não** — opcional |
| **Tamanho máximo** | **500** caracteres |
| **Edição pós-upload** | **Fora** da entrega mínima 2.2; preview pode exibir se preenchida |

---

### PO-7 — Quem pode remover evidência?

| Item | Decisão |
|---|---|
| **Regra base** | Autor do upload (`uploaded_by = auth.uid()`) **e** permissão **`occurrence.create`** na org |
| **Leitura / preview** | **`occurrence.read`** + `can_access_occurrence` |
| **Permissão nova** | **Proibida** — não criar `attachment.delete` / `attachment.upload` |
| **Supervisor HSE / cancel** | **Fora da 2.2** — sem fluxo `occurrence.cancel` nesta sprint |
| **Status ocorrência** | Ver PO-13 |

---

### PO-8 — Remoção física no Storage

| Item | Decisão |
|---|---|
| **Modelo DB** | Soft-delete (`deleted_at`, `deleted_by` quando aplicável) — alinhado a `docs/database.md` §13.1 |
| **Ordem** | Soft-delete no banco → delete do objeto no Storage via RPC |
| **Falha Storage** | Registrar; **não** reverter soft-delete; cleanup/job futuro |
| **UI** | Confirmação obrigatória (Alert Dialog) — ver UI-SPEC |

---

### PO-9 — Prazo para remoção

| Item | Decisão |
|---|---|
| **Regra** | Permitida **enquanto** a ocorrência **não** estiver em `LIBERADA`, `ENCERRADA` ou `CANCELADA` |
| **Janela temporal fixa (ex. 24h)** | **Não** adotada na 2.2 |

---

### PO-10 — Compressão mobile

| Item | Decisão |
|---|---|
| **Aplicar compressão?** | **Sim** (antes do upload) — `docs/engineering.md` §18.7 e §32.4 |
| **Parâmetros alvo** | Qualidade **≈ 0.8**; dimensão máxima **≤ 2048px** (maior lado) |
| **Implementação de referência** | Mobile pode usar qualidade **0.82** e resize **1920px** de largura — compatível com o alvo |
| **Objetivo** | Reduzir tempo de upload em campo sem degradar a evidência operacional |
| **Web** | Compactação recomendada quando viável; validação de tamanho no cliente |

---

### PO-11 — Strip EXIF

| Item | Decisão |
|---|---|
| **Fotos mobile** | **Remover EXIF** antes do upload (privacidade) — efeito esperado da compressão / pipeline |
| **Coords explícitas** | Opcionais via payload RPC (`latitude` / `longitude` / `captured_at`) quando capturadas pelo app |
| **Bloqueio** | Ausência de EXIF/geo **nunca** bloqueia o upload |

---

### PO-12 — Evento na timeline PP

| Item | Decisão |
|---|---|
| **Registrar upload na timeline?** | **Não** na 2.2 |
| **UI** | Contador + galeria no detalhe / sucesso; `occurrence_status_history` **sem** novo evento por anexo |
| **Auditoria `audit_events`** | **Fora** da 2.2 para upload/remoção |

---

### PO-13 — Upload/remoção por status da ocorrência

| Status | Upload | Remoção |
|---|---|---|
| `PARALISACAO_PREVENTIVA` | Permitido | Permitido |
| `EM_AVALIACAO` … `AGUARDANDO_VALIDACAO` | Permitido | Permitido |
| `LIBERADA` | **Bloqueado** | **Bloqueado** |
| `ENCERRADA` | **Bloqueado** | **Bloqueado** |
| `CANCELADA` | **Bloqueado** | **Bloqueado** |

| Item | Decisão |
|---|---|
| **Validação** | **Server-side na RPC** — UI apenas esconde/desabilita |
| **Fonte** | `docs/workflow.md` §19 (não excluir evidência crítica após encerramento); `docs/database.md` §13.1 |

---

### PO-14 — Onde ocorre o upload na UX

| Item | Decisão |
|---|---|
| **Formulário create PP (`PP-NEW`) inline** | **Não** — preserva < 60s e A-R1 |
| **Fluxo oficial** | Bloco `EvidenceSection` no **detalhe PP** (`/stop-work/[id]`) |
| **Tela de sucesso PP** | Pode embutir o **mesmo bloco** imediatamente após o create (upload pós-create sem voltar ao formulário) |
| **CTA / navegação** | “Ver ocorrência” leva ao detalhe com o bloco Evidências |
| **Base44** | Referência visual; SafeStop é **sempre pós-create** |
| **Posição no detalhe** | Após descrição; **antes** da Timeline (UI-SPEC) |

---

### PO-15 — Download no mobile

| Item | Decisão |
|---|---|
| **Escopo 2.2** | **Preview only** — sem download/share nativo |
| **Web** | Preview modal + signed URL |
| **Acesso ao arquivo** | Sempre via **signed URL** (`docs/database.md` §24.3; `docs/engineering.md` §18.12) |

---

## Modelo técnico (referência — não redesenhar §13)

Detalhes de colunas, `attachment_type` e regras gerais: **`docs/database.md` §13.1**.  
Buckets e path: **`docs/database.md` §24**.

| Item | Decisão 2.2 |
|---|---|
| **Bucket** | `occurrence-evidence` (privado) |
| **Path** | `{organization_id}/{occurrence_id}/{attachment_id}/{file_name}` — `file_name` gerado na RPC (ex. `{attachment_id}.jpg`) |
| **Fluxo upload** | `prepare` → Storage INSERT → `complete` / `fail` (`docs/engineering.md` §18.8) |
| **Mutations DB** | Somente RPC `SECURITY DEFINER`; SELECT via RLS |
| **RBAC** | Upload/remoção: `occurrence.create`; leitura/signed URL: `occurrence.read` |
| **Signed URL TTL** | **3600s** |
| **Offline queue persistente** | **Não** na 2.2 — sessão em memória / bloquear novo upload offline |
| **service_role no cliente** | **Proibido** |

---

## Cross-check com `EVIDENCE-UI-SPEC.md`

| Tema | PO | UI-SPEC | Status |
|---|---|---|---|
| Pós-create (não em PP-NEW) | PO-5, PO-14 | Princípio Pós-create; critério #10 | Alinhado |
| MIME / copy tipo inválido | PO-2 | EV-ADD validação + copy | Alinhado |
| Limite 10 MiB + copy | PO-3 | Validação tamanho (valor = PO-3) | Alinhado |
| Máx. 20 ativas; lote UI ≤ 10 | PO-4 | “default 10 por lote” | Alinhado (lote ≠ teto) |
| Compressão mobile | PO-10 | Compactar antes do upload | Alinhado |
| EXIF / geo opcional | PO-11 | Geo EXIF opcional; não bloquear | Alinhado |
| Estados fila / labels | — | `preparing`…`failed` | Spec UI; backend PENDING/COMPLETED/FAILED |
| Empty / error / offline copy | — | § Copy | Oficial para UI |
| Remoção + confirmação | PO-7, PO-8, PO-9 | EV-PREVIEW Remover | Alinhado |
| Bloqueio `LIBERADA`/`ENCERRADA`/`CANCELADA` | PO-13 | Preview/remoção bloqueados | Alinhado |
| Preview only (sem download) | PO-15 | EV-PREVIEW | Alinhado |
| Signed URL | Modelo técnico | § Signed URLs | Alinhado |
| Permissões UI | PO-7 | `occurrence.read` / `occurrence.create` | Alinhado |
| Timeline sem evento de upload | PO-12 | Bloco antes da Timeline; sem novo evento | Alinhado |
| Sucesso PP com bloco evidências | PO-14 | Detalhe + sucesso pós-create | Alinhado |

---

## Explicitamente fora da Sprint 2.2

- Comentários, notificações, assinatura, OCR
- Fluxos `CORRECTION_EVIDENCE`, `RELEASE_EVIDENCE`, `DOCUMENT`
- PDF e documentos Office
- Edição/anotação de imagem
- Antivírus, versionamento, bucket público
- `service_role` no cliente
- `audit_events` para upload/remoção
- Evento em `occurrence_status_history` por anexo
- Fila offline persistente (AsyncStorage)
- Integração IMS / MDHO / plano de ação
- Download/share nativo no mobile
- Permissões RBAC novas além de `occurrence.create` / `occurrence.read`

---

## Dependências registradas

### Etapa 0 — DOCS / PO (esta)

1. ~~PO-1…PO-15 formalizados.~~ **Concluído** (G0).
2. Cross-check com `EVIDENCE-UI-SPEC.md`.

### Etapa 1 — DATABASE (desbloqueada por G0)

1. `occurrence_attachments` + CHECK MIME/tamanho + soft-delete (`docs/database.md` §13.1).
2. Bucket `occurrence-evidence` privado, limites e path (§24).
3. RLS SELECT; mutations via RPC.

### Etapa 2 — BACKEND (desbloqueada por G0)

1. RPCs: `prepare_occurrence_attachment_upload`, `complete_*`, `fail_*`, delete soft + Storage, `get_occurrence_attachment_signed_url`.
2. Validar PO-2…PO-4, PO-7, PO-13 no servidor.
3. Sem permissão nova.

### Etapas 3–4 — UIUX / MOBILE / WEB

1. Implementar conforme `EVIDENCE-UI-SPEC.md` + PO-14/PO-15.
2. Compressão + strip EXIF (PO-10/PO-11).

---

## Registro de aprovação

```text
Etapa 0 aplicada por: agente DOCS (formalização PO — Sprint 2.2)
Data: 2026-08-01
Gate G0: DESBLOQUEADO — DATABASE e BACKEND liberados
Base documental: arquitetura Sprint 2.2; docs/database.md §13, §24;
                 docs/workflow.md §7.1, §19; docs/engineering.md §18, §32;
                 PREVENTIVE-STOP-DECISIONS.md (A-R1 / A-R7);
                 EVIDENCE-UI-SPEC.md (cross-check)
Status: APROVADO — PO-1…PO-15 oficiais; implementação validável contra este documento
Modo: documentação only (sem alteração de apps/packages/supabase nesta etapa)
```

---

## Referências

- `docs/database.md` §13.1, §24 (fonte do modelo — não duplicar)
- `docs/workflow.md` §7.1, §19
- `docs/engineering.md` §18, §32.4–32.9
- `docs/decisions/PREVENTIVE-STOP-DECISIONS.md` (A-R1, A-R7 — fotos fora da 2.1)
- `docs/decisions/OCCURRENCE-FOUNDATION-DECISIONS.md`
- `docs/decisions/EVIDENCE-UI-SPEC.md`
- `docs/roadmap.md` — nota sub-sprint 2.2
- Arquitetura Sprint 2.2 — Evidências (2026-08-01)
