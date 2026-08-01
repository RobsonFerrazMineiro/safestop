# Spec UI/UX — Evidências fotográficas (pós-create)

**Status:** `PRONTO PARA IMPLEMENTAÇÃO`  
**Sprint:** entrega incremental pós-2.1 (roadmap Sprint 2 — fotos)  
**Agente:** UIUX  
**Data:** 2026-08-01  
**Entregável:** `docs/decisions/EVIDENCE-UI-SPEC.md`

**Referências obrigatórias:**

| Fonte | Uso |
|---|---|
| `reference/base44/src/pages/NewInterdiction.jsx` | Tile 80×80, botão Adicionar, estados de upload |
| `reference/base44/src/pages/InterdictionDatail.jsx` | Bloco “Evidências”, galeria horizontal scroll |
| `docs/design-system.md` | Card de evidência, Bottom Sheet, Progress, Dialog, Empty |
| `docs/engineering.md` §18 | Storage privado, signed URLs, fluxo de upload |
| `docs/database.md` §13.1 | `occurrence_attachments`, `attachment_type` |
| `docs/decisions/PREVENTIVE-STOP-UI-SPEC.md` | Detalhe PP — ponto de inserção do bloco |

Base44 é referência visual. Documentação SafeStop prevalece em segurança e workflow.

---

## Objetivo

Permitir anexar, visualizar e acompanhar **evidências fotográficas iniciais** na ocorrência **depois** do registro da Paralisação Preventiva — sem atrasar o fluxo < 60s da criação e sem expor arquivos públicos.

---

## Princípios

| Princípio | Aplicação |
|---|---|
| Pós-create | Evidências **não** entram em `PP-NEW` (preserva A-R1 / < 60s) |
| Storage privado | Thumbnails e preview usam **signed URL** de curta duração |
| Feedback real | Cada item tem estado próprio na fila; progresso verdadeiro |
| Mobile First | Sheet câmera/galeria; toque amplo; uma mão |
| Rastreabilidade | Autor, data, tipo; remoção só autorizada + soft-delete |

---

## Escopo desta entrega

| Incluído | Fora |
|---|---|
| Bloco Evidências em `PP-DETAIL` | Fotos no formulário de criação |
| Galeria horizontal 80×80 | `CORRECTION_EVIDENCE` / `RELEASE_EVIDENCE` (sprints futuras) |
| Sheet mobile: Câmera / Galeria | URLs públicas permanentes |
| Modal / fullscreen preview | PDF / documentos (só `image/jpeg|png|webp` nesta entrega) |
| Fila de upload com progresso % | Fila offline completa (engineering §18.11 — futuro) |
| Empty / error / offline copy | Comentários, decisão, liberação |
| Remoção autorizada (soft-delete) | Apagar evidência após encerramento |

**Tipo de anexo nesta entrega:** `INITIAL_EVIDENCE`.

**Bucket:** `occurrence-evidence` (privado).

**Path:** `{organization_id}/{occurrence_id}/{attachment_id}/{file_name}`.

---

## Usuário e permissão

| Ação | Quem (orientação UI) |
|---|---|
| Ver evidências | Quem tem `occurrence.read` no escopo |
| Adicionar evidência | Quem pode complementar a ocorrência (mín.: criador / papéis com create+read; alinhar RBAC na implementação BACKEND) |
| Remover evidência | Autorizado + ocorrência não encerrada; soft-delete |

UI nunca assume Service Role. Signed URL gerada no backend/Edge para o usuário autenticado.

---

## Posição no detalhe PP

Inserir o bloco **após** descrição (atividade / condição / medida) e **antes** da Timeline — alinhado ao Base44 `InterdictionDetail` (bloco Evidências antes da decisão).

```text
[Header código + status]
[Info read-only]
[Descrição]
[EVIDÊNCIAS]          ← este spec
[Timeline]
```

---

# Componentes e telas

## EV-BLOCK — Bloco Evidências (PP-DETAIL)

### Wireframe

```text
┌──────────────────────────────────────┐
│ EVIDÊNCIAS                    3      │  ← título + contagem
│                                      │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│ │img │ │ 45%│ │ ✕  │ │ +  │ →       │  scroll horizontal
│ │80  │ │80  │ │fail│ │add │         │
│ └────┘ └────┘ └────┘ └────┘         │
│                                      │
│ (empty / error / offline — ver copy) │
└──────────────────────────────────────┘
```

### Regras de layout

| Prop | Valor |
|---|---|
| Título seção | `Evidências` (uppercase tracking opcional — padrão Base44 FieldLabel) |
| Contador | Número de itens **concluídos** no servidor (não contar falhas/locais) |
| Galeria | `flex` row, `overflow-x: auto`, gap 8 |
| Tile | **80×80** fixo (`w-20 h-20`), `border-radius: 12`, `object-cover` |
| Tile Adicionar | 80×80, borda dashed, ícone `Camera` + label `Adicionar` |
| Ordem | Mais recentes à esquerda **ou** ordem `created_at` asc — **fixar:** `created_at` asc (cronológica); Adicionar sempre por último à direita |

### Tile de evidência (estados)

| Estado UI | Visual | Interação |
|---|---|---|
| `local` / Preparando | Thumbnail local + overlay “…” | Sem preview servidor |
| `uploading` | Thumbnail + overlay progresso `%` | Bloquear remoção acidental durante envio (ou permitir cancelar se existir API) |
| `synced` | Thumbnail via **signed URL** | Tap → preview |
| `failed` | Thumbnail + badge erro / ícone | Tap → retry; long-press / menu → remover local |
| `deleted` | Não exibir | — |

Overlay de progresso: barra ou texto `45%` centrado; fundo escuro semitransparente. Progresso **real** do upload (nunca falso).

### Acessibilidade tile

- `accessibilityLabel`: `Evidência {n}, {estado}` ou `Adicionar evidência`
- Toque ≥ 48×48 (tile 80×80 atende)
- Não depender só da cor no estado `failed`

---

## EV-ADD — Adicionar evidência

### Mobile — Bottom Sheet

Ao tocar em **Adicionar**:

```text
┌──────────────────────────────────────┐
│         ──── (handle)                │
│  Adicionar evidência                 │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Tirar foto                    │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  Escolher da galeria           │  │
│  └────────────────────────────────┘  │
│                                      │
│  [ Cancelar ]                        │
└──────────────────────────────────────┘
```

| Ação | Comportamento |
|---|---|
| Tirar foto | Câmera traseira (`capture: environment`); 1 foto por captura; volta à fila |
| Escolher da galeria | Picker imagem; **múltiplas** permitidas (máx. configurável — default **10** por lote / limite org) |
| Cancelar | Fecha sheet |

Permissões do SO: se câmera/galeria negada → toast/banner:

```text
Permissão necessária para anexar fotos.
Abra as configurações do dispositivo para habilitar.
```

### Web

- Sem bottom sheet: `input type="file" accept="image/jpeg,image/png,image/webp" multiple` acionado pelo tile Adicionar.
- Opcional: drag-and-drop na área do bloco (não obrigatório nesta entrega).

### Tipos e validação (cliente)

| Regra | Valor |
|---|---|
| MIME | `image/jpeg`, `image/png`, `image/webp` |
| Tamanho máx. | Configurável; rejeitar acima do limite com copy clara |
| Compactação | Mobile: compactar antes do upload (engineering §18.7) |
| Geo EXIF | Opcional: preencher `latitude`/`longitude`/`captured_at` se disponíveis; nunca bloquear |

Mensagem tipo inválido:

```text
Use apenas imagens JPG, PNG ou WebP.
```

Mensagem tamanho:

```text
A imagem ultrapassa o tamanho máximo permitido.
```

---

## EV-QUEUE — Fila de upload com progresso

Cada arquivo entra na fila com id local estável até sync.

### Estados oficiais (labels UI)

| Estado | Label | Observação |
|---|---|---|
| `preparing` | `Preparando` | Compactação / geração de id |
| `uploading` | `Enviando {n}%` | Progresso real |
| `registering` | `Registrando…` | Pós-storage: metadados no banco |
| `synced` | _(sem badge)_ | Thumbnail signed URL |
| `failed` | `Falha no envio` | Ação `Tentar novamente` |

Falha em um item **não** invalida visualmente os demais.

### Fluxo (alinhado engineering §18.8)

```text
validar local → id attachment → path → compactar → upload Storage
    → registrar occurrence_attachments → obter signed URL → UI synced
```

Se Storage ok e metadados falharem: item `failed`; não mostrar como concluído; backend trata órfão.

### Retry

- Botão/ação no tile ou no preview: `Tentar novamente`
- Mantém posição na galeria
- Não duplicar registro se upload parcial for retomável; se não, novo attempt limpo

### Offline na fila

Ver § Copy offline. Enquanto offline: itens ficam `preparing` / aguardando com label:

```text
Aguardando conexão
```

Não marcar `synced`. Sem fila persistente completa nesta entrega se BACKEND/MOBILE ainda não tiverem — **mínimo:** bloquear novo upload offline com copy; preservar itens já em memória/draft da sessão.

> Se a sprint de evidências incluir persistência local de fila, usar labels de engineering §18.11. Caso contrário, documentar limitação: upload só online.

**Decisão UI padrão desta spec (conservadora):**

- Online: fila com progresso.
- Offline: **não iniciar** novo upload; copy offline; draft de seleção pode ser descartado ou mantido na sessão — preferir manter tiles locais com `Aguardando conexão` se já adicionados na sessão.

---

## EV-PREVIEW — Modal / fullscreen preview

Tap em tile `synced` (e opcionalmente local) abre preview.

### Mobile

```text
┌──────────────────────────────────────┐
│ ✕                         ⋮          │  fechar / menu
│                                      │
│                                      │
│         [ imagem full-bleed ]        │
│                                      │
│                                      │
│──────────────────────────────────────│
│ Evidência inicial                    │
│ Por Nome · 01/08/2026 18:20          │
│ [ Remover ]  (se autorizado)         │
└──────────────────────────────────────┘
```

- Pinch-zoom desejável; mínimo: pan + imagem `contain`.
- Fechar: ✕, back gesture, tap fora (se overlay).
- Não logar / não persistir signed URL.

### Web

- Dialog/modal centrado (`max-w` adequado), imagem grande, ESC fecha, foco trap.
- Mesmos metadados + Remover se autorizado.

### Metadados no preview

| Campo | Fonte |
|---|---|
| Tipo | Label de `INITIAL_EVIDENCE` → `Evidência inicial` |
| Autor | `uploaded_by` → nome |
| Data | `captured_at` ou `created_at` |
| Legenda | `caption` se existir (edição de legenda **fora** desta entrega mínima; exibir se preenchida) |

### Remover

Confirmação (Alert Dialog):

```text
Remover evidência?

A imagem deixará de aparecer nesta ocorrência.
Esta ação será registrada na auditoria.

[ Cancelar ]   [ Remover ]
```

Só soft-delete. Bloqueado se ocorrência `ENCERRADA` / `CANCELADA` (ou política BACKEND).

---

## Signed URLs (obrigatório na UI)

| Regra | UI / cliente |
|---|---|
| Nunca usar URL pública do Storage | — |
| Não persistir signed URL no AsyncStorage / localStorage | Regenerar ao abrir detalhe / expirar |
| Thumbnail e preview | Solicitar URL assinada via API/service autenticado |
| Expiração | Renovar transparentemente em 401/expirado; skeleton breve no tile |
| Erro ao assinar | Tile com placeholder + `Não foi possível carregar a imagem` + retry |

Base44 usava `file_url` direto — **não copiar**.

---

# Copy — empty / error / offline

## Empty (bloco sem evidências e sem fila)

```text
Nenhuma evidência anexada.

Adicione fotos da condição insegura para fortalecer o registro.
```

CTA visual = tile **Adicionar** (não exige botão extra full-width).

## Error (falha ao listar anexos)

```text
Não foi possível carregar as evidências.

Verifique sua conexão e tente novamente.

[ Tentar novamente ]
```

## Offline

**Banner no bloco ou topo do detalhe:**

```text
Você está offline.

As evidências já sincronizadas podem não atualizar.
Novos envios ficarão aguardando conexão.
```

**Tentativa de Adicionar offline (se bloqueado):**

```text
Sem conexão.

Conecte-se para enviar evidências ao servidor.
```

**Item na fila aguardando:**

```text
Aguardando conexão
```

## Upload falhou (item)

```text
Falha no envio

[ Tentar novamente ]
```

## Sucesso breve (opcional toast)

```text
Evidência enviada
```

Duração ~3s (DS). Não usar toast como única confirmação se o tile já mostra `synced`.

---

# Wireframes resumo

### Detalhe com evidências

```text
┌──────────────────────────────────────┐
│ ← SS-26-000154  [PP] [Alta]          │
│ … info + descrição …                 │
│                                      │
│ EVIDÊNCIAS                        2  │
│ ┌────┐ ┌────┐ ┌────┐                │
│ │ ✔  │ │ ✔  │ │ +  │ →              │
│ └────┘ └────┘ └────┘                │
│                                      │
│ TIMELINE                             │
│ • Paralisação Preventiva registrada  │
└──────────────────────────────────────┘
```

### Sheet + fila

```text
Sheet: [Tirar foto] [Escolher da galeria] [Cancelar]
   ↓
Galeria: [thumb 12%] [thumb synced] [thumb falhou] [+]
```

---

## Adaptação Base44 → SafeStop

| Base44 | SafeStop |
|---|---|
| Fotos no `NewInterdiction` (create) | **Pós-create** no detalhe PP |
| Tile 80×80 + Adicionar | Mantém **80×80** |
| Galeria horizontal no detail (96/128) | Unificar **80×80** mobile; web pode 80 ou 96 — default **80** |
| `UploadFile` → URL pública | Upload Storage privado + **signed URL** |
| Sem fila/progresso por item | Fila com `%` por tile |
| Sem empty copy | Empty / error / offline explícitos |
| Sem remoção com auditoria | Soft-delete + confirmação |
| Mistura create+communicate | Evidência não bloqueia nem altera status |

---

## Tokens / componentes DS

| Uso | Componente / token |
|---|---|
| Sheet | Bottom Sheet (radius 20, padding 20) |
| Preview | Dialog / fullscreen |
| Progresso | Progress (upload) |
| Ícones | `Camera`, `Image` / `Images`, `Upload`, `X`, `RotateCcw` (retry) |
| Surface tile | `surface` + border |
| Erro | `destructive` |
| Primary add accent | `primary` no ícone Adicionar (opcional) |

---

## Critérios de aceite

1. Bloco Evidências visível no detalhe PP (após descrição, antes da timeline).
2. Galeria horizontal com tiles **80×80** + tile Adicionar.
3. Mobile: sheet com **Tirar foto** e **Escolher da galeria**.
4. Web: file picker `accept` imagens; multiple.
5. Preview modal/fullscreen com autor e data; fechar previsível.
6. Fila: estados Preparando / Enviando n% / Falha / synced; progresso real.
7. Thumbnails e preview via **signed URL**; sem URL pública persistida.
8. Copy empty, error e offline conforme esta spec.
9. Remoção só com confirmação + soft-delete; bloqueada quando política impedir.
10. **Não** há upload de fotos em `PP-NEW`.
11. Tipo gravado: `INITIAL_EVIDENCE`.
12. Falha de um arquivo não marca os outros como erro.

---

## Checklist MOBILE / WEB

### Bloco + galeria
- [ ] Seção Evidências no detalhe  
- [ ] Tiles 80×80 scroll horizontal  
- [ ] Contador de sincronizados  
- [ ] Tile Adicionar  

### Captura
- [ ] Sheet câmera/galeria (mobile)  
- [ ] File input (web)  
- [ ] Validação MIME/tamanho  

### Fila
- [ ] Progresso por item  
- [ ] Retry  
- [ ] Estados e labels oficiais  

### Preview + segurança
- [ ] Modal preview  
- [ ] Signed URLs  
- [ ] Remover com confirmação  

### Estados
- [ ] Empty copy  
- [ ] Error + retry  
- [ ] Offline copy  

---

## Riscos

| Risco | Mitigação |
|---|---|
| Expiração de signed URL durante preview | Renovar e recarregar imagem |
| Usuário espera foto no create (Base44) | Empty no detalhe orienta anexar depois; não stub no create |
| Upload grande em rede fraca | Compactação + progresso + retry |
| RBAC de “quem anexa” ainda genérico | BACKEND define permissão; UI esconde Adicionar se `canUpload === false` |

---

## Relação com outros agentes

| Agente | Dependência |
|---|---|
| **DATABASE** | Tabela `occurrence_attachments` + RLS + soft-delete |
| **BACKEND** | Upload seguro, signed URL, validação MIME/tamanho, auditoria remoção |
| **MOBILE** | Sheet, câmera, compactação, fila UI, geo EXIF opcional |
| **WEB** | Bloco detalhe, modal preview, file picker |
| **SECURITY** | Bucket privado; sem service role no cliente; expiração URL |
| **QA** | Fluxos add/preview/retry/offline/empty; regressão: create sem fotos |

---

## Registro

```text
UIUX — Spec evidências pós-create
Data: 2026-08-01
Arquivo: docs/decisions/EVIDENCE-UI-SPEC.md
Status: PRONTO PARA IMPLEMENTAÇÃO
```
