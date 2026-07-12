# Arquitetura do SafeStop

> Documento de referência para a arquitetura técnica, organização do código, responsabilidades das aplicações e decisões estruturais do SafeStop.

---

## 1. Visão Geral

O SafeStop será uma plataforma **mobile-first** para gestão de Paralisações Preventivas, comunicação operacional e acompanhamento de Interdições Oficiais.

A solução será composta por:

* um aplicativo mobile para profissionais em campo;
* um painel web para liderança, gestão e administração;
* uma plataforma backend compartilhada;
* pacotes internos compartilhados entre mobile e web.

A arquitetura deve priorizar:

1. simplicidade;
2. velocidade de desenvolvimento;
3. segurança;
4. rastreabilidade;
5. boa experiência mobile;
6. facilidade de manutenção;
7. baixo acoplamento;
8. evolução gradual.

O SafeStop não deve ser transformado prematuramente em uma arquitetura complexa.

A solução deve começar simples e crescer apenas quando houver necessidade comprovada.

---

# 2. Princípios Arquiteturais

## 2.1 Mobile First

Todas as funcionalidades operacionais devem ser pensadas primeiro para o aplicativo mobile.

O painel web é complementar e será direcionado principalmente para:

* liderança;
* gestão;
* acompanhamento;
* administração;
* indicadores;
* relatórios.

---

## 2.2 Simplicidade com eficiência

A arquitetura deve utilizar o menor número possível de tecnologias para resolver o problema com segurança e qualidade.

Não criar:

* microsserviços prematuramente;
* APIs duplicadas;
* abstrações sem necessidade;
* pacotes internos excessivos;
* camadas que não tragam valor prático;
* infraestrutura própria quando uma solução gerenciada já atender ao projeto.

---

## 2.3 Backend centralizado

Mobile e web devem utilizar o mesmo backend, banco de dados, autenticação e regras de acesso.

O Supabase será a plataforma central do SafeStop.

---

## 2.4 Regras de negócio protegidas

Regras críticas não devem existir somente na interface.

Sempre que uma ação envolver:

* mudança de status;
* aprovação;
* liberação;
* registro de ciência;
* envio de notificações;
* alteração de responsáveis;
* vínculo com IMS;
* controle de permissão;

a regra deve ser protegida no backend e no banco de dados.

---

## 2.5 Rastreabilidade por padrão

Toda ação relevante deve gerar um evento no histórico da ocorrência.

O SafeStop deve manter registro de:

* quem executou;
* qual ação foi executada;
* quando aconteceu;
* qual era o estado anterior;
* qual passou a ser o novo estado;
* informações adicionais necessárias para auditoria.

---

## 2.6 Evolução gradual

Funcionalidades avançadas devem entrar por etapas.

Exemplos:

* funcionamento offline completo;
* integração com WhatsApp;
* múltiplos métodos de investigação;
* integrações corporativas;
* análise avançada de dados;
* automações complexas.

Esses recursos não devem aumentar a complexidade do primeiro MVP.

---

# 3. Stack Tecnológica

## 3.1 Monorepo

Ferramentas:

* pnpm Workspaces;
* Turborepo;
* TypeScript.

O monorepo conterá o aplicativo mobile, painel web e pacotes compartilhados.

### Motivos

* compartilhar tipos;
* compartilhar validações;
* manter uma única fonte de verdade;
* executar testes e verificações de forma centralizada;
* reduzir duplicação;
* facilitar atualizações;
* manter mobile e web alinhados.

---

## 3.2 Aplicativo Mobile

Tecnologias:

* Expo;
* React Native;
* Expo Router;
* TypeScript;
* NativeWind;
* TanStack Query;
* React Hook Form;
* Zod;
* Supabase JavaScript Client.

Recursos nativos previstos:

* câmera;
* galeria;
* geolocalização;
* notificações push;
* armazenamento local;
* conectividade;
* compartilhamento;
* biometria futuramente, se necessária.

O aplicativo mobile será o principal produto operacional do SafeStop.

---

## 3.3 Painel Web

Tecnologias:

* Next.js com App Router;
* React;
* TypeScript;
* Tailwind CSS;
* shadcn/ui;
* TanStack Query quando necessário;
* React Hook Form;
* Zod;
* Supabase JavaScript Client.

O painel web será utilizado para:

* acompanhar ocorrências;
* avaliar Paralisações Preventivas;
* registrar decisões;
* validar correções;
* acompanhar Interdições Oficiais;
* administrar usuários;
* administrar empresas;
* administrar áreas;
* administrar listas do MDHO;
* visualizar indicadores;
* emitir relatórios.

---

## 3.4 Backend

Plataforma:

* Supabase.

Serviços utilizados:

* PostgreSQL;
* Supabase Auth;
* Supabase Storage;
* Supabase Realtime;
* Supabase Edge Functions;
* Row Level Security;
* Database Functions;
* Database Triggers;
* logs da plataforma.

O Supabase será responsável por:

* persistência;
* autenticação;
* autorização;
* armazenamento de imagens e documentos;
* eventos em tempo real;
* processamento de notificações;
* integrações externas;
* proteção de dados por empresa.

---

## 3.5 Serviços externos

### Notificações push

* Expo Notifications.

### E-mail

* Resend.

### WhatsApp

Não fará parte do primeiro MVP.

Integrações futuras poderão utilizar:

* API oficial do WhatsApp Business;
* Twilio;
* Evolution API;
* outro provedor aprovado.

Nenhuma integração de WhatsApp deverá ser acoplada diretamente à interface.

Ela deverá passar pela camada de notificações do backend.

---

## 3.6 Deploy

### Mobile

* Expo Application Services;
* EAS Build;
* EAS Update, após avaliação;
* distribuição Android inicialmente;
* distribuição iOS posteriormente, se necessária.

### Web

* Vercel.

### Backend

* Supabase Cloud.

### Código

* GitHub.

---

# 4. Arquitetura Geral

```text
┌───────────────────────────────────────┐
│           SafeStop Mobile             │
│ Expo + React Native + TypeScript      │
└───────────────────┬───────────────────┘
                    │
                    │ HTTPS / Realtime
                    │
┌───────────────────▼───────────────────┐
│               Supabase                │
│                                       │
│ Auth                                  │
│ PostgreSQL                            │
│ Storage                               │
│ Realtime                              │
│ Edge Functions                        │
│ Row Level Security                    │
└───────────────────▲───────────────────┘
                    │
                    │ HTTPS / Realtime
                    │
┌───────────────────┴───────────────────┐
│             SafeStop Web              │
│ Next.js + TypeScript + shadcn/ui      │
└───────────────────────────────────────┘
```

Mobile e web acessam a mesma base de dados e as mesmas regras de segurança.

---

# 5. Estrutura do Monorepo

```text
safestop/
│
├── apps/
│   ├── mobile/
│   └── web/
│
├── packages/
│   ├── config/
│   ├── types/
│   ├── validation/
│   ├── utils/
│   └── ui/
│
├── supabase/
│   ├── migrations/
│   ├── seed/
│   ├── functions/
│   └── config.toml
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── product.md
│   ├── workflow.md
│   ├── notifications.md
│   ├── api.md
│   ├── roadmap.md
│   └── decisions/
│
├── reference/
│   ├── base44/
│   ├── Fluxo.md
│   └── Exemplo.md
│
├── assets/
│
├── .cursor/
│   ├── rules/
│   ├── agents/
│   └── prompts/
│
├── .github/
│   └── workflows/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── .gitignore
└── README.md
```

---

# 6. Responsabilidade das Aplicações

## 6.1 `apps/mobile`

Responsável pela experiência de campo.

Principais funcionalidades:

* autenticação;
* abertura de Paralisação Preventiva;
* captura de fotos;
* localização;
* seleção de área e empresa;
* recebimento de notificações;
* confirmação de ciência;
* acompanhamento das ocorrências;
* comentários;
* envio de evidências;
* avaliação quando o perfil permitir;
* consulta ao histórico;
* funcionamento resiliente em conexão instável.

O aplicativo não deve concentrar regras críticas somente na interface.

---

## 6.2 `apps/web`

Responsável pela experiência de gestão.

Principais funcionalidades:

* dashboard;
* fila de ocorrências;
* avaliação da liderança;
* acompanhamento de Ver e Agir;
* acompanhamento de Interdição Oficial;
* avaliação MDHO;
* aprovação HSE;
* registro do código IMS;
* plano de ação;
* validação de correções;
* liberação;
* gestão de notificações;
* usuários;
* empresas;
* áreas;
* contratos;
* configurações;
* listas configuráveis;
* relatórios.

A versão web também deverá funcionar em navegadores mobile, mas não substituirá o aplicativo de campo.

---

# 7. Responsabilidade dos Pacotes Compartilhados

## 7.1 `packages/types`

Conterá tipos TypeScript compartilhados.

Exemplos:

* ocorrências;
* usuários;
* empresas;
* áreas;
* notificações;
* histórico;
* MDHO;
* planos de ação;
* filtros;
* respostas de funções.

Não deve conter lógica de interface.

---

## 7.2 `packages/validation`

Conterá schemas Zod compartilhados.

Exemplos:

* abertura de Paralisação Preventiva;
* decisão da liderança;
* avaliação MDHO;
* registro do código IMS;
* plano de ação;
* liberação;
* criação de usuário;
* cadastro de empresa.

Os schemas devem ser usados no mobile, web e backend sempre que possível.

---

## 7.3 `packages/utils`

Conterá funções independentes de plataforma.

Exemplos:

* formatação de datas;
* formatação de código;
* cálculo de duração;
* normalização de textos;
* helpers de status;
* validações auxiliares;
* geração de identificadores visuais.

Não deve conter acesso ao banco, React ou dependências específicas de mobile ou web.

---

## 7.4 `packages/config`

Conterá configurações compartilhadas.

Exemplos:

* TypeScript;
* ESLint;
* Prettier, se utilizado;
* constantes globais;
* configurações de ambiente;
* enums não dependentes do banco.

---

## 7.5 `packages/ui`

O compartilhamento visual entre React Native e web será limitado.

Mobile e web utilizam tecnologias de renderização diferentes.

Esse pacote não deverá tentar forçar o compartilhamento de todos os componentes visuais.

Poderá conter:

* tokens de design;
* nomes semânticos de cores;
* escalas de espaçamento;
* tipografia;
* ícones ou metadados;
* contratos de componentes;
* componentes realmente compatíveis entre plataformas, quando houver benefício.

Componentes específicos devem permanecer dentro de cada aplicação.

---

# 8. Organização Interna do Mobile

Estrutura inicial sugerida:

```text
apps/mobile/
│
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   ├── occurrences/
│   ├── notifications/
│   ├── profile/
│   └── _layout.tsx
│
├── src/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── lib/
│   ├── constants/
│   └── types/
│
├── assets/
├── app.json
├── eas.json
└── package.json
```

## Organização por funcionalidade

Sempre que possível, utilizar organização por domínio.

Exemplo:

```text
src/features/occurrences/
├── components/
├── hooks/
├── services/
├── schemas/
├── types/
└── utils/
```

Evitar criar uma pasta global enorme com arquivos de funcionalidades não relacionadas.

---

# 9. Organização Interna da Web

Estrutura inicial sugerida:

```text
apps/web/
│
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
│
├── src/
│   ├── components/
│   ├── features/
│   ├── services/
│   ├── hooks/
│   ├── lib/
│   ├── constants/
│   └── types/
│
├── public/
├── middleware.ts
├── next.config.ts
└── package.json
```

## Organização por domínio

Exemplo:

```text
src/features/occurrences/
├── components/
├── actions/
├── queries/
├── schemas/
├── types/
└── utils/
```

Rotas devem conter principalmente composição de página.

Regras e componentes de domínio devem permanecer dentro de `src/features`.

---

# 10. Domínios Principais

O sistema será dividido conceitualmente nos seguintes domínios:

## 10.1 Identidade e acesso

* autenticação;
* usuários;
* perfis;
* permissões;
* sessões;
* dispositivos;
* tokens de notificação.

## 10.2 Organização

* empresas;
* contratadas;
* unidades;
* áreas;
* gerências;
* contratos;
* responsáveis.

## 10.3 Ocorrências

* Paralisação Preventiva;
* avaliação;
* Ver e Agir;
* Interdição Oficial;
* liberação;
* encerramento.

## 10.4 Comunicação

* destinatários;
* notificações;
* entregas;
* visualizações;
* confirmações de ciência;
* tentativas;
* falhas.

## 10.5 MDHO

* comportamento;
* tipo de desvio;
* pré-condições;
* questões organizacionais;
* supervisão e fiscalização;
* aprovação HSE.

## 10.6 Plano de ação

* ações;
* responsáveis;
* prazos;
* evidências;
* validações.

## 10.7 Auditoria

* histórico;
* eventos;
* alterações;
* usuários responsáveis;
* datas e horários.

## 10.8 Indicadores

* tempos de resposta;
* tempos de avaliação;
* tempos de correção;
* causas;
* empresas;
* áreas;
* recorrências.

---

# 11. Fluxo de Dados

## 11.1 Consultas simples

Para consultas autorizadas, mobile e web poderão utilizar o cliente Supabase diretamente.

Exemplos:

* listar ocorrências;
* consultar detalhes;
* listar áreas;
* listar empresas;
* consultar histórico;
* consultar notificações.

O acesso será limitado pelas políticas de Row Level Security.

---

## 11.2 Operações críticas

Operações críticas deverão utilizar funções de banco ou Edge Functions.

Exemplos:

* criar Paralisação Preventiva;
* determinar destinatários;
* registrar mudança de status;
* aprovar decisão;
* confirmar Interdição Oficial;
* aprovar MDHO;
* registrar IMS;
* liberar atividade;
* encerrar ocorrência;
* enviar notificações.

Essas operações devem ser atômicas sempre que possível.

Isso evita situações como:

* status alterado sem histórico;
* ocorrência criada sem destinatários;
* liberação realizada sem autorização;
* notificação enviada sem registro;
* duplicidade por clique repetido.

---

# 12. Máquina de Estados

O status de uma ocorrência não deve ser alterado livremente.

As transições devem seguir o fluxo de negócio.

Status iniciais previstos:

```text
PARALISACAO_PREVENTIVA
EM_AVALIACAO
VER_E_AGIR
INTERDICAO_CONFIRMADA
MDHO_EM_PREENCHIMENTO
AGUARDANDO_APROVACAO_HSE
AGUARDANDO_REGISTRO_IMS
EM_TRATATIVA
AGUARDANDO_VALIDACAO
LIBERADA
ENCERRADA
CANCELADA
```

A definição final ficará documentada em `docs/workflow.md`.

Cada transição deve validar:

* status atual;
* perfil do usuário;
* campos obrigatórios;
* evidências necessárias;
* justificativa, quando aplicável.

Não permitir saltos de etapa sem regra explícita.

---

# 13. Autenticação

A autenticação será realizada pelo Supabase Auth.

Métodos iniciais:

* e-mail e senha;
* recuperação de senha;
* sessão persistente.

Métodos futuros:

* magic link;
* login corporativo;
* Microsoft Entra ID;
* SSO;
* biometria local para reabrir o aplicativo.

O MVP não precisa implementar todos os métodos.

---

# 14. Autorização e RBAC

O SafeStop utilizará controle de acesso baseado em papéis e escopo organizacional.

Perfis iniciais possíveis:

* HSE de Campo;
* Liderança da Contratada;
* Fiscal do Contrato;
* Supervisor HSE;
* Liderança HSE;
* Gestor;
* Administrador da Empresa;
* Administrador da Plataforma.

As permissões não devem depender apenas do nome do papel.

Elas devem ser representadas por ações autorizadas.

Exemplos:

```text
occurrence.create
occurrence.read
occurrence.evaluate
occurrence.confirm_interdiction
occurrence.validate_correction
occurrence.release
mdho.fill
mdho.approve
ims_reference.register
ims_reference.update
action_plan.manage
notification.read
notification.confirm_awareness
user.manage
organization.manage
report.read
```

O acesso também deverá respeitar o escopo:

* empresa;
* unidade;
* contrato;
* área;
* gerência.

---

# 15. Multiempresa

A arquitetura deve permitir atender mais de uma empresa.

Cada registro operacional deve pertencer a uma organização.

A separação de dados será garantida por:

* identificador da organização;
* relacionamentos organizacionais;
* políticas de Row Level Security;
* permissões;
* escopo do usuário.

Nenhum usuário deve acessar dados de outra organização sem autorização explícita.

O MVP poderá começar com uma única organização configurada, mas o banco deve evitar decisões que impeçam a evolução futura.

---

# 16. Armazenamento de Arquivos

Fotos e documentos serão armazenados no Supabase Storage.

Buckets iniciais possíveis:

```text
occurrence-evidence
action-plan-evidence
profile-images
```

Os arquivos não devem ser públicos por padrão.

O acesso deve ocorrer por:

* políticas de Storage;
* URLs assinadas;
* tempo de expiração;
* autorização por organização e ocorrência.

Metadados devem ser registrados no banco:

* nome;
* caminho;
* tipo;
* tamanho;
* usuário;
* data;
* categoria;
* ocorrência relacionada.

---

# 17. Notificações

A arquitetura de notificações deve ser independente do canal.

O domínio de notificações decidirá:

* quem deve receber;
* qual mensagem;
* qual prioridade;
* quais canais;
* quando enviar;
* quais tentativas realizar.

Canais previstos:

* notificação no aplicativo;
* push;
* e-mail;
* WhatsApp futuramente.

## Fluxo básico

```text
Ocorrência criada
        ↓
Backend identifica destinatários
        ↓
Registra notificações no banco
        ↓
Dispara canais configurados
        ↓
Registra sucesso ou falha
        ↓
Usuário visualiza
        ↓
Sistema registra ciência
```

As notificações não devem ser enviadas diretamente por componentes da interface.

---

# 18. Realtime

O Realtime poderá ser utilizado para:

* atualizar ocorrências abertas;
* mostrar mudanças de status;
* atualizar a timeline;
* exibir novas notificações;
* informar confirmação de ciência;
* atualizar filas de avaliação.

Realtime é uma melhoria de experiência.

Ele não substitui a persistência no banco.

A aplicação deve continuar funcionando corretamente após recarregar os dados diretamente do banco.

---

# 19. Estratégia de Conectividade

O campo pode apresentar conexão instável.

Por isso, o aplicativo deve ser resiliente.

## MVP

No primeiro MVP:

* detectar ausência de conexão;
* preservar dados digitados localmente;
* impedir perda acidental do formulário;
* exibir claramente o estado da conexão;
* permitir nova tentativa;
* evitar envios duplicados;
* compactar imagens antes do upload;
* confirmar quando o registro estiver salvo no servidor.

## Evolução futura

Posteriormente poderá ser criada uma fila offline para:

* criação de ocorrências;
* envio de fotos;
* comentários;
* confirmação de ciência;
* evidências.

O aplicativo não deverá informar que uma ocorrência foi comunicada enquanto ela ainda existir somente no dispositivo.

Deve diferenciar claramente:

```text
Salvo no dispositivo
Aguardando conexão
Enviando
Registrado no servidor
Notificações disparadas
Falha no envio
```

---

# 20. Cache e Estado

## Estado remoto

TanStack Query será utilizado para:

* consultas;
* cache;
* atualização;
* invalidação;
* retry;
* estados de carregamento;
* sincronização.

## Estado local

Estado local deve ser mantido o mais próximo possível do componente ou funcionalidade.

Zustand poderá ser utilizado apenas para estado global realmente necessário.

Exemplos:

* sessão complementar;
* rascunho operacional;
* conectividade;
* preferências locais;
* fila offline futura.

Não utilizar Zustand para substituir o servidor ou duplicar todo o banco localmente.

---

# 21. Validação

Todos os formulários devem utilizar schemas Zod.

Validações devem existir em mais de uma camada:

1. interface;
2. schema compartilhado;
3. backend;
4. banco de dados.

A interface melhora a experiência.

O backend e o banco garantem integridade.

---

# 22. Segurança

## Regras obrigatórias

* Row Level Security habilitado nas tabelas expostas;
* chaves administrativas nunca enviadas ao cliente;
* variáveis sensíveis fora do Git;
* arquivos privados;
* URLs assinadas;
* validação no servidor;
* autorização por operação;
* registros de auditoria;
* limitação de tamanho e tipo de upload;
* proteção contra duplicidade;
* dados pessoais minimizados;
* políticas de retenção definidas posteriormente.

A chave `service_role` nunca deverá existir no mobile ou no navegador.

Ela poderá ser utilizada apenas em ambiente seguro de backend.

---

# 23. Auditoria

A auditoria será tratada como parte central do produto.

Eventos auditáveis:

* ocorrência criada;
* ocorrência editada;
* responsáveis notificados;
* notificação entregue;
* notificação visualizada;
* ciência confirmada;
* avaliação iniciada;
* decisão registrada;
* Interdição Oficial confirmada;
* MDHO preenchido;
* MDHO aprovado ou devolvido;
* IMS vinculado;
* ação criada;
* evidência enviada;
* correção validada;
* atividade liberada;
* ocorrência encerrada;
* ocorrência cancelada.

Eventos de auditoria não devem ser alterados por usuários comuns.

---

# 24. Tratamento de Erros

Erros devem ser:

* registrados;
* apresentados de forma clara;
* classificados;
* recuperáveis quando possível.

A interface não deve mostrar mensagens técnicas como:

```text
PostgrestError
foreign key violation
network request failed
```

Deve mostrar mensagens úteis:

```text
Não foi possível registrar a ocorrência.
Seus dados foram preservados. Tente novamente.
```

Logs técnicos devem permanecer disponíveis para investigação.

---

# 25. Observabilidade

No MVP, utilizar:

* logs do Supabase;
* logs das Edge Functions;
* logs de build;
* registros de falha de notificações;
* tabela de tentativas de entrega.

Posteriormente poderá ser adotado:

* Sentry;
* monitoramento de desempenho;
* alertas de erros;
* métricas de disponibilidade.

Não adicionar ferramentas de observabilidade sem uma necessidade concreta.

---

# 26. Testes

## Testes unitários

Ferramenta:

* Vitest.

Aplicar principalmente em:

* validações;
* funções de transição;
* regras de permissão;
* helpers;
* cálculos;
* formatação;
* seleção de destinatários.

## Testes de componentes

Mobile:

* React Native Testing Library.

Web:

* Testing Library.

## Testes de integração

Testar:

* banco;
* Row Level Security;
* Edge Functions;
* transições;
* notificações;
* uploads.

## Testes E2E

Web:

* Playwright.

Mobile:

* avaliar Maestro ou Detox quando o fluxo mobile estiver estabilizado.

O MVP deve priorizar testes das regras críticas, não cobertura numérica artificial.

---

# 27. Qualidade de Código

Validações obrigatórias:

```text
lint
typecheck
test
build
```

Scripts raiz deverão executar tarefas no monorepo por meio do Turborepo.

Exemplo futuro:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm qa
```

Commits devem ser pequenos e relacionados a uma única mudança lógica.

---

# 28. Ambientes

Ambientes previstos:

```text
local
staging
production
```

## Local

Utilizado no desenvolvimento.

Poderá utilizar Supabase local ou projeto remoto de desenvolvimento.

## Staging

Utilizado para:

* validação;
* testes integrados;
* homologação;
* demonstrações.

## Production

Utilizado por usuários reais.

Dados e chaves não devem ser compartilhados entre os ambientes.

---

# 29. Variáveis de Ambiente

O arquivo `.env.example` deve documentar as variáveis necessárias sem armazenar valores reais.

Exemplos:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

RESEND_API_KEY=
EXPO_ACCESS_TOKEN=
```

Variáveis administrativas devem existir apenas no backend seguro.

---

# 30. Estratégia de API

O SafeStop não terá inicialmente um servidor Node separado.

Serão utilizados:

* API automática do Supabase;
* funções PostgreSQL;
* Edge Functions;
* Route Handlers do Next.js apenas quando houver necessidade específica da aplicação web.

Evitar criar duas APIs diferentes para a mesma regra.

A regra de negócio deve ter uma fonte oficial.

---

# 31. Integrações Corporativas

O SafeStop não substituirá o IMS.

O código do IMS será registrado como referência externa.

Exemplo:

```text
BAA-26-0001
```

A arquitetura deve permitir futuramente:

* integração automática com sistemas corporativos;
* webhooks;
* importação;
* exportação;
* sincronização;
* links externos.

No MVP, o código será informado manualmente após sua emissão no sistema corporativo.

---

# 32. Design System

Mobile e web devem compartilhar os mesmos princípios visuais:

* cores semânticas;
* tipografia;
* espaçamento;
* estados;
* badges;
* iconografia;
* linguagem;
* níveis de prioridade.

Status não devem depender apenas da cor.

Sempre utilizar:

* texto;
* ícone;
* contraste adequado;
* descrição acessível.

O mobile deve priorizar:

* alvos de toque adequados;
* botões grandes;
* leitura rápida;
* formulários curtos;
* uso com uma mão;
* feedback imediato.

---

# 33. Acessibilidade

A aplicação deve considerar:

* contraste;
* tamanho de fonte;
* leitores de tela;
* labels;
* foco;
* navegação por teclado no web;
* áreas de toque;
* mensagens de erro;
* não depender exclusivamente de cores.

Acessibilidade não deve ser tratada apenas no final do projeto.

---

# 34. Performance

## Mobile

Prioridades:

* abertura rápida;
* formulários responsivos;
* compressão de imagens;
* listas paginadas;
* carregamento progressivo;
* redução de requisições;
* cache controlado.

## Web

Prioridades:

* Server Components quando apropriado;
* paginação;
* consultas selecionando apenas campos necessários;
* carregamento sob demanda;
* componentes client somente quando necessários.

Não realizar otimizações prematuras sem medir.

---

# 35. Decisões que devem ser evitadas

Não implementar inicialmente:

* microsserviços;
* Kubernetes;
* servidor próprio sem necessidade;
* GraphQL adicional;
* banco duplicado;
* Redux por padrão;
* sincronização offline complexa;
* compartilhamento forçado de UI entre mobile e web;
* múltiplos provedores de autenticação;
* integrações corporativas antes do MVP;
* filas externas sem necessidade;
* analytics avançado antes dos dados reais.

---

# 36. Fonte da Verdade

Os documentos oficiais do projeto serão:

```text
docs/product.md
docs/architecture.md
docs/database.md
docs/workflow.md
docs/notifications.md
docs/roadmap.md
docs/decisions/
```

Em caso de conflito:

1. regras de segurança;
2. `product.md`;
3. `workflow.md`;
4. `architecture.md`;
5. ADR mais recente;
6. código existente.

Mudanças arquiteturais importantes devem gerar um ADR.

---

# 37. Critérios para uma nova dependência

Antes de instalar uma nova dependência, responder:

1. Qual problema concreto ela resolve?
2. A plataforma já possui essa capacidade?
3. Existe solução mais simples?
4. Ela funciona no monorepo?
5. Ela funciona no Expo?
6. Ela possui manutenção ativa?
7. Ela aumenta muito o tamanho ou a complexidade?
8. Ela será utilizada de imediato?

Não instalar bibliotecas apenas porque poderão ser úteis futuramente.

---

# 38. Critérios de Evolução

Uma mudança arquitetural deve ser considerada quando:

* existe problema real de desempenho;
* existe limitação comprovada;
* a manutenção está prejudicada;
* uma regra está duplicada;
* a segurança exige;
* a escala atual justifica;
* há benefício claro para o produto.

O crescimento da arquitetura deve acompanhar o crescimento real do SafeStop.

---

# 39. Resumo das Decisões

| Área             | Decisão                                      |
| ---------------- | -------------------------------------------- |
| Repositório      | Monorepo                                     |
| Workspace        | pnpm                                         |
| Orquestração     | Turborepo                                    |
| Mobile           | Expo + React Native                          |
| Navegação mobile | Expo Router                                  |
| Web              | Next.js App Router                           |
| Linguagem        | TypeScript                                   |
| Backend          | Supabase                                     |
| Banco            | PostgreSQL                                   |
| Autenticação     | Supabase Auth                                |
| Arquivos         | Supabase Storage                             |
| Tempo real       | Supabase Realtime                            |
| Backend seguro   | PostgreSQL Functions + Edge Functions        |
| Push             | Expo Notifications                           |
| E-mail           | Resend                                       |
| Estilo mobile    | NativeWind                                   |
| Estilo web       | Tailwind CSS + shadcn/ui                     |
| Validação        | Zod                                          |
| Formulários      | React Hook Form                              |
| Estado remoto    | TanStack Query                               |
| Estado global    | Zustand somente quando necessário            |
| Deploy web       | Vercel                                       |
| Build mobile     | EAS Build                                    |
| Testes unitários | Vitest                                       |
| E2E web          | Playwright                                   |
| Segurança        | RLS + RBAC + escopo organizacional           |
| Arquivos         | Privados por padrão                          |
| IMS              | Referência externa, não gerado pelo SafeStop |
| Offline          | Evolução gradual                             |

---

# 40. Regra Final

Toda decisão técnica deverá preservar os princípios fundamentais do produto:

* Mobile First;
* velocidade acima da complexidade;
* comunicação antes da burocracia;
* rastreabilidade total;
* segurança em primeiro lugar;
* simplicidade com eficiência.

A melhor arquitetura para o SafeStop não será a mais sofisticada.

Será aquela que permitir comunicar uma ocorrência rapidamente, proteger os dados, registrar todas as ações e manter o sistema simples para quem está em campo.
