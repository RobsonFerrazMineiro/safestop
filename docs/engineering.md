# Engenharia de Software do SafeStop

> Documento oficial de engenharia de software do SafeStop.

Este documento define todas as diretrizes técnicas utilizadas durante o desenvolvimento do projeto.

Nenhum código deverá ser implementado contrariando este documento.

Em caso de conflito entre implementações existentes e este documento, este documento será considerado a Fonte da Verdade.

---

# 1. Objetivo

O objetivo deste documento é padronizar completamente o desenvolvimento do SafeStop.

Ele deverá servir como referência para:

- desenvolvedores;
- Cursor;
- Codex;
- revisões de código;
- Pull Requests;
- documentação;
- manutenção futura.

Todo código produzido deverá seguir estas diretrizes.

---

# 2. Filosofia de Engenharia

O SafeStop é um software operacional.

Seu objetivo não é demonstrar arquiteturas complexas.

Seu objetivo é resolver rapidamente problemas reais de comunicação em operações industriais.

Portanto, toda decisão técnica deve priorizar:

- simplicidade;
- previsibilidade;
- manutenção;
- performance;
- segurança;
- rastreabilidade.

Sempre que houver duas soluções possíveis, deve ser escolhida aquela que puder ser compreendida mais facilmente por outro desenvolvedor.

---

# 3. Princípios Fundamentais

Todo desenvolvimento deve seguir os princípios abaixo.

## Mobile First

Toda funcionalidade deve ser pensada primeiro para quem está em campo utilizando o aplicativo.

A versão Web complementa a experiência.

Ela nunca será a prioridade operacional.

---

## Simplicidade

Evitar arquiteturas excessivamente abstratas.

Evitar excesso de camadas.

Evitar padrões desnecessários.

Código simples possui menor custo de manutenção.

---

## Legibilidade

Código é escrito para pessoas.

A máquina apenas executa.

Uma função deve ser facilmente compreendida sem necessidade de documentação adicional.

---

## Responsabilidade Única

Cada componente deve possuir apenas uma responsabilidade.

Cada função deve executar apenas uma tarefa.

Cada arquivo deve representar um conceito específico.

---

## Evolução Gradual

Não desenvolver funcionalidades pensando em cenários hipotéticos.

Primeiro resolver o problema atual.

Depois evoluir.

---

## Segurança

Segurança nunca deve depender exclusivamente do frontend.

Toda validação crítica deverá existir no backend.

---

## Performance

O usuário nunca deve perceber lentidão causada por arquitetura inadequada.

A simplicidade normalmente gera melhor performance.

---

## Consistência

Uma mesma solução deve ser utilizada em todo o projeto.

Evitar cinco formas diferentes de resolver o mesmo problema.

---

# 4. Stack Oficial

## Mobile

Expo

React Native

TypeScript

Expo Router

NativeWind

React Hook Form

Zod

TanStack Query

React Native Reanimated

React Native Gesture Handler

Expo Notifications

Expo Location

Expo Image Picker

Expo FileSystem

Expo SecureStore

---

## Web

Next.js

React

TypeScript

TailwindCSS

shadcn/ui

TanStack Query

React Hook Form

Zod

---

## Backend

Supabase

Supabase Auth

Supabase Database

Supabase Storage

Supabase Realtime

Supabase Edge Functions (somente quando necessário)

---

## Banco

PostgreSQL

---

## Ferramentas

pnpm

TurboRepo

ESLint

Prettier

Husky

Commitlint

GitHub Actions

---

# 5. Estrutura Geral

O projeto utilizará Monorepo.

Estrutura:

apps/

packages/

docs/

research/

scripts/

supabase/

.github/

---

# 6. Organização do Monorepo

apps/

mobile/

web/

packages/

ui/

shared/

types/

utils/

config/

docs/

research/

supabase/

migrations/

seed/

storage/

---

# 7. Responsabilidade das Pastas

## apps/mobile

Aplicação Expo.

Nunca deverá conter regras de negócio.

Apenas interface e integração com a camada compartilhada.

---

## apps/web

Aplicação Next.js.

Mesma regra do Mobile.

---

## packages/ui

Componentes compartilhados.

Exemplos:

Botões

Cards

Inputs

Badges

Dialogs

Avatares

Ícones

Layouts

Nunca conter regras de negócio.

---

## packages/shared

Toda regra reutilizável.

Exemplos:

Enums

Constantes

Schemas

Tipos

Helpers

Validações

Formatações

---

## packages/utils

Funções utilitárias.

Sem dependência do React.

---

## packages/config

Configurações compartilhadas.

Exemplos:

ESLint

Prettier

TypeScript

Tailwind

---

## docs

Toda documentação oficial.

Nunca armazenar código.

---

## research

Referências.

Protótipos.

Capturas do Base44.

Fluxos.

Estudos.

---

## supabase

Toda infraestrutura.

Migrations

Policies

Functions

Triggers

Seeds

Storage

---

# 8. Organização por Feature

Evitar organizar apenas por tipo de arquivo.

Sempre que possível utilizar organização por domínio.

Exemplo:

occurrences/

components/

hooks/

queries/

mutations/

schemas/

services/

types/

utils/

pages/

Essa organização reduz acoplamento.

---

# 9. Convenções de Nomenclatura

Pastas:

snake_case

Arquivos:

kebab-case

Componentes:

PascalCase

Hooks:

camelCase iniciando com use

Exemplo:

useOccurrence()

Funções:

camelCase

Interfaces:

PascalCase

Enums:

PascalCase

Constantes globais:

UPPER_SNAKE_CASE

---

# 10. Convenções Gerais

Nunca utilizar abreviações confusas.

Ruim:

btn

usr

cfg

Bom:

button

user

configuration

Código deve ser autoexplicativo.

---

# 11. Organização dos Componentes

Todo componente deverá possuir:

uma responsabilidade;

propriedades tipadas;

nome descritivo;

baixo acoplamento.

Evitar componentes com mais de aproximadamente 300 linhas.

Caso cresçam demais, dividir.

---

# 12. Componentes Compartilhados

Tudo que for utilizado em mais de um módulo deverá migrar para packages/ui.

Nunca duplicar componentes.

---

# 13. Componentes de Feature

Componentes específicos permanecem dentro da própria feature.

Exemplo:

occurrence-card

occurrence-header

occurrence-gallery

Não mover para packages/ui caso sejam exclusivos da feature.

---

# 14. Filosofia de Código

Antes de escrever código perguntar:

Isso realmente precisa existir?

Existe forma mais simples?

Estou duplicando lógica?

Esse código será entendido daqui a dois anos?

Se qualquer resposta for negativa, reavaliar a implementação.

---

# 15. Regra Final

Todo desenvolvimento do SafeStop deverá privilegiar clareza, simplicidade e previsibilidade.

Arquiteturas extremamente sofisticadas serão evitadas quando não trouxerem benefício real.

A melhor solução é aquela que resolve o problema com o menor custo de manutenção possível.

# 16. Backend com Supabase

O Supabase será a plataforma principal de backend do SafeStop.

Ele será responsável por:

- autenticação;
- banco de dados;
- autorização;
- armazenamento de arquivos;
- comunicação em tempo real;
- funções seguras;
- políticas de acesso;
- infraestrutura de dados.

O SafeStop não possuirá inicialmente um servidor Node.js separado.

A arquitetura deve utilizar os recursos nativos do Supabase sempre que eles resolverem o problema com segurança e simplicidade.

---

## 16.1 Responsabilidades do backend

O backend deve proteger:

- criação de ocorrências;
- mudanças de status;
- avaliação da liderança;
- confirmação de Interdição Oficial;
- envio e aprovação do MDHO;
- registro manual da referência IMS;
- validação de correções;
- liberação de atividades;
- criação de notificações;
- confirmação de ciência;
- registro de auditoria;
- controle de permissões.

Essas regras não podem depender apenas do frontend.

---

## 16.2 Cliente Supabase

Mobile e web utilizarão o cliente oficial do Supabase.

Devem existir implementações adequadas para:

- navegador;
- servidor Next.js;
- React Native;
- Edge Functions;
- scripts administrativos.

Não reutilizar incorretamente o mesmo cliente em todos os ambientes.

---

## 16.3 Cliente mobile

O cliente mobile deverá:

- persistir a sessão de forma segura;
- utilizar configuração compatível com React Native;
- renovar tokens;
- tratar falhas de autenticação;
- não armazenar chaves administrativas;
- utilizar apenas a chave pública apropriada;
- limpar dados sensíveis após logout;
- reagir corretamente à expiração da sessão.

A chave `service_role` nunca poderá existir no aplicativo mobile.

O armazenamento da sessão deverá utilizar uma solução compatível com Expo e React Native, como o SecureStore, quando apropriado.

---

## 16.4 Cliente web

No Next.js deverão existir clientes distintos quando necessário:

- cliente para navegador;
- cliente para Server Components;
- cliente para Route Handlers;
- cliente para Server Actions;
- cliente administrativo apenas em ambiente seguro.

Nunca enviar segredos administrativos ao navegador.

O cliente web deverá respeitar:

- cookies de sessão;
- renovação de autenticação;
- execução no servidor;
- execução no cliente;
- separação entre contexto público e contexto administrativo.

---

## 16.5 Operações simples

Consultas autorizadas e operações simples poderão utilizar diretamente a API do Supabase.

Exemplos:

- listar ocorrências;
- consultar detalhes;
- listar áreas;
- listar organizações;
- consultar notificações;
- consultar timeline;
- consultar opções do MDHO;
- consultar planos de ação;
- consultar dados do perfil.

Toda consulta deve permanecer protegida por Row Level Security.

A possibilidade técnica de consultar diretamente uma tabela não significa que qualquer operação deva ser feita dessa forma.

---

## 16.6 Operações críticas

Operações críticas deverão utilizar:

- funções PostgreSQL;
- transações;
- Edge Functions, quando necessário;
- validação explícita de permissões;
- registro de histórico;
- registro de auditoria;
- criação de eventos de notificação.

Exemplos:

- criar Paralisação Preventiva;
- registrar decisão da liderança;
- confirmar Interdição Oficial;
- enviar MDHO;
- aprovar ou devolver MDHO;
- registrar referência IMS;
- validar correção;
- liberar atividade;
- confirmar ciência;
- cancelar ocorrência;
- encerrar ocorrência.

A interface não deverá alterar diretamente campos críticos como `status`, `decision_type`, `released_at` ou dados de auditoria.

---

## 16.7 Edge Functions

Edge Functions devem ser utilizadas somente quando houver necessidade real.

Casos adequados:

- integração com Expo Push;
- envio de e-mails;
- integração futura com WhatsApp;
- processamento com segredo externo;
- webhooks;
- tarefas assíncronas;
- comunicação com provedores externos;
- processamento que não deve ocorrer no cliente;
- operações que exigem credenciais privadas.

Não utilizar Edge Function para substituir uma consulta simples ao banco.

Não criar Edge Functions apenas para adicionar uma camada desnecessária entre a aplicação e o Supabase.

---

## 16.8 Funções PostgreSQL

Funções PostgreSQL poderão ser utilizadas para operações atômicas e críticas.

Exemplos:

```
create_occurrence()
start_occurrence_evaluation()
record_occurrence_decision()
submit_mdho_assessment()
approve_mdho_assessment()
return_mdho_assessment()
register_ims_reference()
update_ims_reference()
submit_correction()
validate_correction()
release_occurrence()
close_occurrence()
cancel_occurrence()
confirm_notification_awareness()
```

Cada função crítica deve:

1. validar autenticação;
2. validar organização;
3. validar permissão;
4. validar escopo;
5. validar status atual;
6. validar campos obrigatórios;
7. executar a alteração;
8. registrar histórico;
9. registrar auditoria;
10. criar eventos de notificação quando necessário;
11. retornar resposta padronizada.

Essas etapas devem ocorrer na mesma transação sempre que fizerem parte de uma única ação operacional.

---

## 16.9 Respostas do backend

Operações de backend devem retornar estruturas previsíveis.

Exemplo:

```
type OperationResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
```

A interface não deve depender diretamente de mensagens técnicas do banco.

Exemplos de códigos de erro:

```
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
INVALID_STATUS
NOT_FOUND
DUPLICATE_OPERATION
FILE_UPLOAD_FAILED
NETWORK_ERROR
INTERNAL_ERROR
```

A mensagem apresentada ao usuário deve ser clara e adequada ao contexto.

---

## 16.10 Validação no backend

Toda operação crítica deve validar novamente os dados recebidos.

Mesmo quando o frontend já utiliza Zod, o backend deve considerar o payload como não confiável.

Validar:

- identificadores;
- campos obrigatórios;
- formatos;
- relacionamento entre entidades;
- organização;
- permissão;
- status;
- tamanho de texto;
- arquivos;
- regras condicionais.

A validação do frontend melhora a experiência.

A validação do backend protege o sistema.

---

## 16.11 Autorização no backend

A autorização deve considerar:

- usuário autenticado;
- vínculo organizacional ativo;
- papel;
- permissão;
- escopo;
- relação com a ocorrência;
- status atual;
- ação solicitada.

Possuir uma permissão não significa acesso irrestrito a todas as organizações.

---

## 16.12 Idempotência

Operações críticas devem evitar duplicidade.

Exemplos:

- clique duplo;
- repetição após timeout;
- retry de rede;
- mesma requisição enviada novamente;
- confirmação repetida de ciência;
- liberação repetida;
- decisão duplicada.

Poderão ser utilizados:

- `idempotency_key`;
- restrições únicas;
- transações;
- `upsert`;
- validação de estado atual.

---

## 16.13 Regra de negócio única

Uma mesma regra de negócio não deve possuir implementações diferentes no mobile, web e backend.

Exemplo inadequado:

- o mobile permite uma transição;
- o web possui outra regra;
- o banco aceita uma terceira possibilidade.

A regra oficial deve existir no backend.

Mobile e web apenas representam essa regra na interface.

---

# 17. Banco de Dados

O PostgreSQL será a fonte oficial dos dados do SafeStop.

Toda implementação deve respeitar:

```
docs/database.md
```

As migrations são a fonte oficial da estrutura do banco.

---

## 17.1 Convenções

No banco de dados utilizar:

```
snake_case
```

No TypeScript utilizar:

```
camelCase
```

Exemplo:

```
Banco: organization_id
TypeScript: organizationId
```

A conversão deve ocorrer na fronteira da camada de dados.

---

## 17.2 Identificadores

Entidades principais devem utilizar UUID.

Exemplo:

```
id uuid primary key default gen_random_uuid()
```

Códigos visíveis não substituem o UUID.

Exemplos de códigos visíveis:

```
SS-26-000001
BAA-26-0001
```

O código interno do SafeStop identifica a ocorrência desde a criação.

A referência IMS é apenas um valor digitado manualmente depois, sem integração com o sistema externo.

---

## 17.3 Datas e horários

Datas e horários devem ser armazenados em UTC.

Tipo padrão:

```
timestamptz
```

A apresentação no fuso local é responsabilidade da aplicação.

Evitar armazenar data e hora em campos separados quando um único `timestamptz` resolver o caso.

---

## 17.4 Integridade

O banco deve garantir:

- chaves estrangeiras;
- campos obrigatórios;
- unicidade;
- checks;
- transições válidas;
- relacionamentos;
- consistência organizacional;
- proteção contra duplicidade;
- integridade das referências.

Não depender apenas do Zod ou da interface.

---

## 17.5 Chaves estrangeiras

Toda relação deve possuir comportamento explícito.

Avaliar cuidadosamente:

- `on delete restrict`;
- `on delete cascade`;
- `on delete set null`.

Registros críticos devem normalmente utilizar `restrict` ou inativação lógica.

Não utilizar `cascade` indiscriminadamente em dados auditáveis.

---

## 17.6 Migrations

Toda alteração estrutural deve utilizar migration.

Local:

```
supabase/migrations/
```

Nunca alterar manualmente o banco de produção sem migration correspondente.

Cada migration deve:

- possuir objetivo claro;
- ser pequena quando possível;
- evitar múltiplas mudanças não relacionadas;
- incluir índices necessários;
- incluir políticas relacionadas quando apropriado;
- ser revisável;
- ser testada localmente.

---

## 17.7 Nomenclatura de migrations

Exemplo:

```
202607110001_create_organizations.sql
202607110002_create_profiles.sql
202607110003_create_occurrences.sql
202607110004_create_notifications.sql
```

O nome deve indicar claramente a finalidade da migration.

---

## 17.8 Seeds

Seeds serão utilizados para desenvolvimento e homologação.

Podem incluir:

- organização de demonstração;
- usuários de teste;
- áreas;
- unidades;
- papéis;
- permissões;
- categorias do MDHO;
- opções do MDHO;
- ocorrências fictícias;
- notificações fictícias;
- planos de ação de exemplo.

Não utilizar dados reais sem autorização.

Seeds devem ser determinísticos sempre que possível.

---

## 17.9 Índices

Índices devem ser adicionados com base em consultas reais.

Prioridades iniciais:

- `organization_id`;
- `status`;
- `created_at`;
- `area_id`;
- `contractor_organization_id`;
- `occurrence_id`;
- `recipient_member_id`;
- `ims_reference_code`;
- `assigned_evaluator_id`.

Índices compostos possíveis:

```
organization_id + status
organization_id + created_at
organization_id + area_id + created_at
organization_id + contractor_organization_id + created_at
```

Evitar índices sem uso comprovado.

---

## 17.10 Transações

Operações com múltiplas alterações relacionadas devem ser transacionais.

Exemplo:

```
Atualizar status
+
Criar histórico
+
Criar auditoria
+
Criar evento de notificação
```

Essas etapas não podem ficar parcialmente concluídas.

---

## 17.11 Exclusão

Registros críticos devem utilizar exclusão lógica ou inativação.

Exemplos:

```
is_active
deleted_at
cancelled_at
archived_at
```

Ocorrências, auditorias, decisões, avaliações e históricos não devem ser apagados por usuários comuns.

---

## 17.12 Dados derivados

Evitar armazenar informações que podem ser calculadas com segurança.

Exemplos:

```
tempo_para_avaliacao
tempo_para_liberacao
duracao_total
```

Esses valores podem ser calculados a partir das datas.

Armazenar dados derivados somente quando houver benefício comprovado de performance ou necessidade histórica.

---

## 17.13 JSONB

JSONB pode ser utilizado para:

- metadados;
- payload de notificações;
- estado anterior e novo;
- dados auxiliares;
- integração futura.

Não utilizar JSONB para evitar uma modelagem relacional adequada.

Campos pesquisados, filtrados ou relacionados frequentemente devem possuir colunas próprias.

---

## 17.14 Views

Views poderão ser criadas quando simplificarem consultas recorrentes.

Exemplos:

```
occurrence_summary_view
open_occurrences_view
notification_status_view
mdho_statistics_view
```

Não criar views antes de existir necessidade real.

---

## 17.15 Funções e triggers

Triggers poderão ser utilizados para:

- atualização de `updated_at`;
- criação automática de perfil;
- auditoria limitada;
- manutenção de consistência;
- eventos controlados.

Não esconder regras complexas em triggers difíceis de rastrear.

Regras importantes devem permanecer explícitas e documentadas.

---

## 17.16 Tipos do banco

Após alterações no schema, os tipos TypeScript devem ser regenerados.

Local sugerido:

```
packages/types/src/database.types.ts
```

O arquivo gerado não deve ser editado manualmente.

---

# 18. Storage

O Supabase Storage será utilizado para:

- fotos iniciais;
- evidências de correção;
- evidências de liberação;
- documentos;
- imagens de perfil;
- anexos de planos de ação.

---

## 18.1 Buckets

Buckets iniciais:

```
occurrence-evidence
action-plan-evidence
profile-images
```

Os buckets devem ser privados por padrão.

---

## 18.2 Estrutura de caminhos

Formato recomendado:

```
{organization_id}/{occurrence_id}/{attachment_id}/{file_name}
```

Exemplo:

```
organization-uuid/occurrence-uuid/attachment-uuid/photo.jpg
```

Para imagens de perfil:

```
{organization_id}/{profile_id}/{file_name}
```

---

## 18.3 Metadados

O banco deverá armazenar:

- bucket;
- caminho;
- nome original;
- tipo MIME;
- tamanho;
- usuário;
- data;
- categoria;
- legenda;
- ocorrência relacionada;
- latitude e longitude quando aplicável;
- data de captura quando disponível.

O banco não deve armazenar o arquivo binário.

---

## 18.4 Acesso

Arquivos privados devem ser acessados por:

- políticas do Storage;
- URL assinada;
- tempo de expiração;
- verificação de organização;
- permissão do usuário;
- relação com a ocorrência.

Nunca tornar evidências operacionais públicas por conveniência.

---

## 18.5 Upload seguro

Todo upload deve validar:

- autenticação;
- organização;
- ocorrência;
- permissão;
- tipo;
- tamanho;
- quantidade;
- caminho;
- nome;
- categoria;
- extensão;
- tipo MIME real.

Não confiar somente na extensão do arquivo.

---

## 18.6 Tipos permitidos

Os tipos permitidos deverão ser definidos por categoria.

Exemplo inicial para imagens:

```
image/jpeg
image/png
image/webp
```

Documentos poderão aceitar:

```
application/pdf
```

Outros tipos só devem ser adicionados quando houver necessidade real.

---

## 18.7 Tamanho máximo

O tamanho máximo deve ser configurável.

Imagens capturadas no mobile devem ser compactadas antes do upload.

O sistema deve equilibrar:

- qualidade da evidência;
- velocidade;
- consumo de dados;
- custo de armazenamento;
- desempenho.

---

## 18.8 Fluxo de upload

Fluxo recomendado:

1. validar arquivo localmente;
2. gerar identificador do anexo;
3. preparar caminho;
4. compactar quando necessário;
5. enviar para o Storage;
6. registrar metadados no banco;
7. confirmar sucesso;
8. atualizar a interface.

Se o upload falhar, não registrar o anexo como concluído.

---

## 18.9 Arquivos órfãos

O sistema deve evitar arquivos no Storage sem registro correspondente no banco.

Estratégias possíveis:

- registrar metadados somente após upload;
- remover arquivo se o registro no banco falhar;
- tarefa periódica de limpeza;
- status temporário de upload.

---

## 18.10 Exclusão de arquivos

Arquivos críticos não devem ser excluídos após encerramento da ocorrência.

Antes do encerramento, exclusões permitidas devem:

- possuir autorização;
- utilizar exclusão lógica nos metadados;
- gerar auditoria;
- remover ou preservar o arquivo conforme política;
- evitar inconsistência.

---

## 18.11 Upload offline futuro

Quando o suporte offline completo for implementado, arquivos poderão permanecer em fila local.

Estados possíveis:

```
Aguardando envio
Compactando
Enviando
Enviado
Falha no envio
```

A interface não deve indicar que a evidência está no servidor enquanto ela existir apenas no dispositivo.

---

## 18.12 URLs assinadas

URLs assinadas devem:

- possuir tempo de expiração;
- ser criadas apenas para usuários autorizados;
- não ser armazenadas permanentemente;
- ser regeneradas quando necessário.

O banco deve armazenar o caminho do arquivo, não a URL temporária.

---

## 18.13 Imagens de perfil

Imagens de perfil possuem regras diferentes de evidências operacionais.

Elas poderão ser substituídas pelo próprio usuário, conforme permissão.

Evidências de ocorrência possuem maior exigência de rastreabilidade e retenção.

---

## 18.14 Regra final da Etapa 2A

O backend deve centralizar e proteger as regras críticas do SafeStop.

O PostgreSQL deve garantir integridade e rastreabilidade.

O Storage deve manter arquivos privados, organizados e vinculados corretamente aos registros do banco.

A arquitetura deve evitar:

- lógica crítica no frontend;
- alterações diretas de status;
- chaves administrativas no cliente;
- arquivos públicos;
- dados sem auditoria;
- operações parciais;
- complexidade desnecessária.

Supabase deve ser utilizado como uma plataforma integrada, sem criar camadas extras quando elas não trouxerem benefício real.

# 19. Realtime

O Supabase Realtime poderá ser utilizado para melhorar a atualização da interface e reduzir o tempo entre uma alteração no backend e sua exibição para o usuário.

Casos de uso:

- nova notificação;
- mudança de status;
- atualização da timeline;
- confirmação de ciência;
- nova evidência;
- correção enviada;
- correção validada;
- ocorrência liberada;
- atualização de filas operacionais;
- alteração de responsável;
- ação corretiva atualizada.

---

## 19.1 Princípio

Realtime não é a fonte oficial dos dados.

A fonte oficial continua sendo o PostgreSQL.

Ao recarregar a aplicação, os dados corretos devem ser obtidos diretamente do banco.

Realtime serve para melhorar a experiência, não para substituir persistência, consultas ou validação.

---

## 19.2 Uso controlado

Não criar subscriptions para todas as tabelas indiscriminadamente.

Assinar somente:

- dados necessários;
- organização ativa;
- ocorrência aberta na tela;
- notificações do usuário atual;
- filas que realmente exigem atualização imediata;
- dados compatíveis com o escopo do usuário.

Subscriptions devem respeitar:

- autenticação;
- organização;
- escopo;
- RLS;
- ciclo de vida da tela.

---

## 19.3 Casos adequados

Realtime poderá ser utilizado em:

- central de notificações;
- detalhes da ocorrência;
- timeline;
- dashboard de ocorrências abertas;
- fila de avaliação;
- fila de validação;
- confirmação de ciência;
- atualização de ações corretivas.

---

## 19.4 Casos inadequados

Não utilizar Realtime para:

- substituir consultas iniciais;
- manter formulários locais;
- salvar rascunhos;
- executar regra de negócio;
- confirmar operação crítica;
- autorizar ações;
- substituir cache;
- evitar modelagem adequada do banco.

---

## 19.5 Ciclo de vida

Toda subscription deve:

1. ser criada no momento adequado;
2. utilizar filtro quando possível;
3. possuir identificador claro;
4. atualizar ou invalidar o cache;
5. ser removida ao sair da tela;
6. ser recriada quando o contexto mudar.

Evitar:

- listeners duplicados;
- subscriptions abandonadas;
- eventos processados mais de uma vez;
- vazamentos;
- atualizações fora do escopo;
- consumo desnecessário.

---

## 19.6 Realtime e TanStack Query

Eventos Realtime devem atualizar ou invalidar o cache do TanStack Query.

Exemplo:

```
queryClient.invalidateQueries({
  queryKey: occurrenceQueryKeys.detail(occurrenceId),
});
```

Quando o payload recebido for confiável e suficiente, poderá ocorrer atualização direta do cache.

Exemplo:

```
queryClient.setQueryData(
  occurrenceQueryKeys.detail(occurrenceId),
  (current) => updateOccurrenceStatus(current, nextStatus),
);
```

A atualização direta deve ser usada com cuidado.

Para eventos complexos ou com muitos relacionamentos, preferir invalidar e consultar novamente.

---

## 19.7 Reconexão

A aplicação deve lidar com:

- perda de conexão;
- retomada;
- mudança de rede;
- retorno do segundo plano;
- token expirado;
- subscription encerrada.

Após reconectar, a aplicação deve buscar novamente os dados necessários.

Não assumir que todos os eventos ocorridos durante a desconexão serão recebidos posteriormente.

---

## 19.8 Eventos duplicados

O processamento deve ser idempotente.

Receber o mesmo evento mais de uma vez não pode gerar:

- duplicidade visual;
- notificações repetidas;
- timeline duplicada;
- contadores incorretos;
- alterações repetidas.

---

## 19.9 Estado da conexão

Quando relevante, a interface poderá informar:

```
Atualização em tempo real ativa
Reconectando...
Dados podem estar desatualizados
```

Não exibir detalhes técnicos do canal ou da conexão ao usuário comum.

---

## 19.10 Segurança no Realtime

Subscriptions devem respeitar as políticas do banco.

Nunca confiar no frontend para filtrar dados sensíveis após recebê-los.

O backend deve impedir que eventos fora do escopo sejam entregues.

---

# 20. Permissões

O SafeStop utilizará permissões atômicas para controlar ações.

Permissões representam capacidades específicas.

Exemplos:

```
occurrence.create
occurrence.read
occurrence.evaluate
occurrence.confirm_interdiction
occurrence.validate_correction
occurrence.release
occurrence.cancel

mdho.fill
mdho.submit
mdho.approve
mdho.return

ims_reference.register
ims_reference.update

action_plan.create
action_plan.manage
action_plan.validate

notification.read
notification.confirm_awareness

user.manage
organization.manage
area.manage
contract.manage
settings.manage

report.read
audit.read
```

---

## 20.1 Papéis

Papéis agrupam permissões.

Exemplos:

- HSE de Campo;
- Liderança da Contratada;
- Fiscal do Contrato;
- Supervisor HSE;
- Liderança HSE;
- Gestor;
- Administrador da Empresa;
- Administrador da Plataforma.

O nome do papel não deve ser utilizado como regra direta de autorização.

Evitar:

```
if (role === "SUPERVISOR") {
  allow();
}
```

Preferir:

```
if (hasPermission("occurrence.evaluate")) {
  allow();
}
```

---

## 20.2 Motivo da separação

A separação entre papel e permissão permite:

- alterar responsabilidades;
- criar papéis personalizados;
- reduzir acoplamento;
- evitar verificações espalhadas;
- adaptar o sistema a diferentes empresas;
- revisar acesso sem alterar código.

---

## 20.3 Escopo

Além da permissão, o sistema deve validar o escopo.

Escopos possíveis:

- organização;
- unidade;
- área;
- contrato;
- empresa contratada;
- gerência;
- ocorrência;
- responsabilidade atribuída.

Um usuário pode possuir a permissão `occurrence.read`, mas acessar apenas ocorrências da sua organização ou contrato.

---

## 20.4 Permissões na interface

A interface poderá:

- ocultar ações;
- desabilitar botões;
- mostrar mensagens de acesso;
- adaptar menus;
- impedir navegação indevida.

Isso melhora a experiência, mas não substitui a validação do backend.

---

## 20.5 Verificação de permissões

Helpers poderão ser utilizados:

```
can("occurrence.release")
can("mdho.approve")
can("ims_reference.register")
```

Também poderá existir verificação contextual:

```
canAccessOccurrence(occurrenceId)
canManageContract(contractId)
canApproveMdho(occurrenceId)
```

---

## 20.6 Carregamento de permissões

Após autenticação, o sistema poderá carregar:

- vínculos organizacionais;
- papéis;
- permissões;
- escopos;
- organização ativa.

Esses dados podem permanecer em contexto ou cache estável.

Alterações administrativas devem invalidar o cache correspondente.

---

## 20.7 Negação por padrão

Quando houver dúvida, ausência de dados ou falha ao carregar permissões, a ação deve ser negada.

Não permitir acesso por falta de informação.

---

## 20.8 Permissões críticas

Exigem atenção especial:

- confirmar Interdição Oficial;
- aprovar MDHO;
- registrar ou alterar referência IMS;
- validar correção;
- liberar atividade;
- cancelar ocorrência;
- acessar auditoria;
- administrar usuários e permissões.

---

## 20.9 Elevação de privilégio

O sistema não deve permitir que um usuário atribua a si mesmo permissões superiores sem autorização.

Alterações de papel devem:

- exigir permissão administrativa;
- respeitar organização;
- gerar auditoria;
- registrar usuário responsável;
- registrar data e hora;
- registrar valores anteriores e novos.

---

## 20.10 Revisão de acesso

A aplicação deve permitir futuramente:

- revisar usuários inativos;
- identificar permissões excessivas;
- consultar alterações de papel;
- remover acessos;
- auditar administradores.

---

# 21. Row Level Security

Todas as tabelas expostas ao cliente devem possuir Row Level Security habilitado.

Exemplo:

```
alter table occurrences enable row level security;
```

RLS será uma camada fundamental da segurança do SafeStop.

---

## 21.1 Objetivo

RLS deve impedir:

- acesso entre organizações;
- leitura indevida;
- alteração não autorizada;
- acesso fora do escopo;
- leitura de notificações de outros usuários;
- acesso público a evidências;
- alteração de auditoria;
- manipulação direta de status;
- acesso administrativo indevido.

---

## 21.2 Princípio de defesa em profundidade

A segurança deve existir em múltiplas camadas:

1. interface;
2. validação;
3. backend;
4. funções de banco;
5. RLS;
6. restrições do PostgreSQL;
7. auditoria.

Nenhuma camada isolada é suficiente.

---

## 21.3 Políticas de leitura

A leitura pode considerar:

- usuário autenticado;
- vínculo organizacional ativo;
- organização da entidade;
- participação na ocorrência;
- contrato;
- área;
- permissão;
- papel;
- responsabilidade atribuída.

Exemplo conceitual:

```
O usuário pode ler uma ocorrência quando:
- pertence à organização;
- possui vínculo ativo;
- possui permissão de leitura;
- está dentro do escopo permitido.
```

---

## 21.4 Políticas de inserção

A inserção deve validar:

- autenticação;
- organização;
- vínculo ativo;
- permissão;
- relacionamento correto;
- campos controlados.

O cliente não deve conseguir definir livremente:

- autor diferente do usuário atual;
- organização fora do seu vínculo;
- status avançado;
- datas de aprovação;
- dados de auditoria.

---

## 21.5 Políticas de atualização

Atualizações diretas devem ser limitadas.

Campos críticos devem ser alterados somente por funções controladas.

Exemplos:

- `status`;
- `decision_type`;
- `released_at`;
- `closed_at`;
- `approved_by`;
- `approved_at`;
- `ims_reference_registered_by`;
- campos de auditoria.

---

## 21.6 Políticas de exclusão

A exclusão direta deve ser negada na maioria das tabelas críticas.

Exemplos:

- ocorrências;
- decisões;
- status history;
- notificações;
- auditorias;
- MDHO aprovado;
- evidências encerradas.

Quando necessário, utilizar inativação ou exclusão lógica.

---

## 21.7 Funções auxiliares

Funções PostgreSQL poderão simplificar políticas.

Exemplos:

```
current_profile_id()
current_organization_ids()
has_permission(permission_code)
can_access_occurrence(occurrence_id)
can_manage_organization(organization_id)
is_platform_admin()
```

Essas funções devem:

- possuir propósito claro;
- ser pequenas;
- ser testadas;
- evitar recursão;
- controlar `search_path`;
- não expor dados desnecessários;
- evitar consultas excessivamente pesadas.

---

## 21.8 Security Definer

Funções com `security definer` devem ser utilizadas com extremo cuidado.

Regras:

- justificar uso;
- limitar privilégios;
- controlar `search_path`;
- validar usuário;
- validar organização;
- evitar SQL dinâmico sem necessidade;
- não retornar dados além do necessário;
- possuir testes específicos.

---

## 21.9 Service Role

A chave `service_role` ignora RLS.

Por isso:

- nunca deve existir no frontend;
- nunca deve ser enviada ao mobile;
- nunca deve aparecer em variável pública;
- deve existir apenas em backend seguro;
- seu uso deve ser mínimo;
- toda operação deve validar escopo manualmente.

---

## 21.10 Testes de RLS

As políticas devem possuir testes com diferentes usuários e cenários.

Exemplos:

- HSE de Campo acessa ocorrência da sua organização;
- contratada acessa ocorrência relacionada;
- usuário de outra empresa não acessa;
- liderança HSE aprova MDHO;
- usuário sem permissão não libera;
- usuário comum não lê auditoria restrita;
- um destinatário lê apenas suas notificações;
- administrador de uma empresa não administra outra.

---

## 21.11 Performance de RLS

Políticas complexas podem prejudicar consultas.

Para evitar isso:

- indexar colunas usadas;
- simplificar funções;
- evitar subqueries desnecessárias;
- testar planos de execução;
- evitar lógica duplicada;
- medir antes de otimizar.

---

## 21.12 RLS no Storage

Buckets privados também devem possuir políticas.

As políticas devem validar:

- usuário;
- organização;
- caminho;
- ocorrência;
- permissão;
- tipo de arquivo.

O caminho do arquivo não deve ser considerado proteção suficiente.

---

# 22. Segurança

A segurança deve ser aplicada desde o início do projeto.

Ela não será uma etapa adicionada apenas antes da produção.

---

## 22.1 Princípios de segurança

- menor privilégio;
- negação por padrão;
- validação no backend;
- dados mínimos;
- arquivos privados;
- segredos protegidos;
- auditoria;
- rastreabilidade;
- dependências atualizadas;
- mensagens sem dados sensíveis;
- sessões protegidas;
- acesso por escopo.

---

## 22.2 Variáveis de ambiente

Segredos devem permanecer fora do Git.

O arquivo:

```
.env.example
```

deve conter somente:

- nomes das variáveis;
- descrições;
- exemplos fictícios;
- indicação de ambiente.

Nunca incluir:

- senha;
- token real;
- chave privada;
- service role;
- credencial de produção;
- segredo de provedor.

---

## 22.3 Variáveis públicas

Variáveis com prefixo público ficam disponíveis no cliente.

Exemplos:

```
NEXT_PUBLIC_
EXPO_PUBLIC_
```

Nunca armazenar segredos nessas variáveis.

Chaves públicas do Supabase poderão existir no cliente, desde que a segurança dependa de RLS e autorização adequada.

---

## 22.4 Autenticação

A autenticação deve:

- validar credenciais;
- manter sessão segura;
- renovar tokens;
- permitir logout;
- reagir à expiração;
- reagir à inativação;
- impedir uso de sessão inválida;
- limpar dados locais após saída.

---

## 22.5 Autorização

Toda ação crítica deve validar:

1. usuário autenticado;
2. vínculo ativo;
3. organização;
4. permissão;
5. escopo;
6. status atual;
7. campos obrigatórios;
8. regras do fluxo.

---

## 22.6 Validação de entrada

Toda entrada externa deve ser considerada não confiável.

Validar:

- formulários;
- parâmetros;
- identificadores;
- arquivos;
- payloads;
- deep links;
- webhooks;
- respostas externas;
- variáveis de ambiente;
- dados de QR Code, se futuramente utilizado.

---

## 22.7 Mensagens de erro

Mensagens para o usuário não devem expor:

- estrutura do banco;
- SQL;
- stack trace;
- nomes internos de tabela;
- credenciais;
- detalhes de infraestrutura.

Exemplo inadequado:

```
new row violates row-level security policy for table occurrences
```

Exemplo adequado:

```
Você não possui permissão para realizar esta ação.
```

---

## 22.8 Dados sensíveis em notificações

Notificações push não devem expor descrições detalhadas.

Exemplo adequado:

```
Paralisação Preventiva registrada.
Toque para visualizar.
```

Os detalhes devem permanecer dentro da aplicação autenticada.

---

## 22.9 Sessão no mobile

A sessão mobile deve:

- utilizar armazenamento seguro;
- evitar AsyncStorage para segredos quando houver alternativa mais segura;
- limpar tokens no logout;
- reagir à troca de usuário;
- impedir exibição de cache anterior;
- suportar renovação.

---

## 22.10 Sessão no web

A sessão web deve:

- utilizar cookies seguros;
- respeitar contexto de servidor e navegador;
- proteger rotas;
- renovar autenticação;
- evitar exposição de token;
- limpar cookies no logout.

---

## 22.11 Dispositivo compartilhado

Como o aplicativo poderá ser utilizado em ambiente industrial, considerar dispositivos compartilhados.

O sistema deve:

- facilitar logout;
- ocultar dados após saída;
- limpar cache sensível;
- impedir acesso por botão voltar;
- validar sessão ao retornar do segundo plano;
- permitir bloqueio local futuro.

---

## 22.12 Uploads

Uploads devem possuir:

- limite de tamanho;
- tipos permitidos;
- nome controlado;
- caminho seguro;
- autenticação;
- autorização;
- auditoria;
- validação de MIME;
- prevenção contra sobrescrita indevida.

Não confiar somente na extensão do arquivo.

---

## 22.13 Proteção contra duplicidade

Ações críticas devem ser protegidas contra:

- clique duplo;
- múltiplas abas;
- retry automático;
- reconexão;
- repetição de mutation;
- resposta tardia.

---

## 22.14 Logs seguros

Logs não devem expor:

- senhas;
- tokens;
- service role;
- dados pessoais desnecessários;
- conteúdo sensível;
- URLs assinadas completas;
- payloads críticos sem sanitização.

---

## 22.15 Dependências

Antes de instalar dependências, avaliar:

- manutenção;
- histórico de vulnerabilidades;
- comunidade;
- compatibilidade;
- necessidade;
- tamanho;
- permissões solicitadas.

Dependências vulneráveis devem ser corrigidas ou substituídas com prioridade proporcional ao risco.

---

## 22.16 Controle de acesso administrativo

Ações administrativas devem exigir:

- permissão específica;
- organização correta;
- registro em auditoria;
- confirmação quando forem destrutivas;
- justificativa em alterações sensíveis.

---

## 22.17 Auditoria de segurança

Eventos importantes:

- login;
- logout;
- falha de login;
- recuperação de senha;
- alteração de papel;
- inativação de usuário;
- tentativa negada;
- acesso administrativo;
- mudança crítica;
- registro ou alteração de IMS;
- liberação;
- cancelamento.

---

## 22.18 Proteção contra abuso

O sistema poderá utilizar futuramente:

- rate limiting;
- bloqueio temporário;
- limitação de tentativas;
- proteção de endpoints;
- monitoramento de comportamento anormal.

Aplicar apenas quando houver necessidade, sem prejudicar o uso de campo.

---

## 22.19 Privacidade

O SafeStop deve armazenar somente os dados necessários.

Evitar:

- localização contínua;
- dados médicos;
- documentos pessoais sem necessidade;
- conteúdo privado;
- informações fora do contexto operacional.

A geolocalização deve estar vinculada à ocorrência, não ao monitoramento permanente do trabalhador.

---

## 22.20 Regra final da Etapa 2B

Realtime deve melhorar a experiência sem se tornar uma segunda fonte de verdade.

Permissões devem representar ações específicas e sempre respeitar o escopo.

RLS deve proteger os dados diretamente no banco.

A segurança deve existir em todas as camadas e seguir o princípio de menor privilégio.

Nenhuma facilidade de desenvolvimento justifica:

- expor segredos;
- desativar RLS;
- confiar apenas no frontend;
- tornar arquivos públicos;
- ignorar auditoria;
- permitir acesso fora da organização.

# 23. Componentes

Componentes devem possuir responsabilidade única, propriedades tipadas e comportamento previsível.

Eles devem ser organizados de forma que seja simples:

- localizar;
- reutilizar;
- testar;
- corrigir;
- substituir;
- evoluir.

Componentes não devem concentrar regras críticas de negócio.

---

## 23.1 Categorias de componentes

Os componentes poderão ser divididos em:

- componentes de UI;
- componentes de domínio;
- componentes de apresentação;
- componentes de orquestração;
- componentes de layout;
- componentes de feedback.

---

## 23.2 Componentes de UI

Componentes de UI representam elementos visuais genéricos.

Exemplos:

```
Button
Card
Input
TextArea
Badge
Dialog
Drawer
Avatar
Skeleton
EmptyState
Alert
Progress
```

Esses componentes não devem conhecer regras específicas do SafeStop.

Um `Button` não deve saber o que significa liberar uma ocorrência.

Um `Badge` genérico não deve consultar o status diretamente no banco.

---

## 23.3 Componentes de domínio

Componentes de domínio representam conceitos específicos do produto.

Exemplos:

```
OccurrenceCard
OccurrenceStatusBadge
OccurrenceTimeline
MdhoAssessmentForm
NotificationAwarenessButton
ActionPlanCard
ReleaseSummary
```

Esses componentes podem receber tipos do domínio, mas não devem acessar diretamente a infraestrutura.

---

## 23.4 Componentes de apresentação

Componentes de apresentação devem:

- receber dados por propriedades;
- emitir eventos por callbacks;
- não consultar banco;
- não executar regra crítica;
- não controlar autorização real;
- não criar subscriptions;
- não alterar estado remoto diretamente.

Exemplo:

```
type OccurrenceCardProps = {
  occurrence: OccurrenceSummary;
  onPress: (occurrenceId: string) => void;
};

export function OccurrenceCard({
  occurrence,
  onPress,
}: OccurrenceCardProps) {
  return null;
}
```

---

## 23.5 Componentes de orquestração

Componentes de orquestração podem:

- chamar hooks;
- buscar dados;
- controlar loading;
- controlar erro;
- controlar estado vazio;
- disparar mutations;
- montar componentes de apresentação;
- adaptar dados para a interface.

Exemplo:

```
export function OccurrenceListContainer() {
  const query = useOccurrences();

  if (query.isLoading) {
    return <OccurrenceListSkeleton />;
  }

  if (query.isError) {
    return <OccurrenceListError />;
  }

  if (!query.data.length) {
    return <OccurrenceEmptyState />;
  }

  return <OccurrenceList occurrences={query.data} />;
}
```

Eles não devem acumular todas as regras da feature.

---

## 23.6 Componentes de layout

Componentes de layout devem organizar a estrutura visual.

Exemplos:

```
AppShell
PageContainer
MobileScreen
DashboardLayout
Section
Stack
Grid
```

Eles não devem conhecer regras operacionais.

---

## 23.7 Componentes de feedback

Devem padronizar estados como:

- carregamento;
- erro;
- sucesso;
- vazio;
- sem conexão;
- acesso negado;
- sincronização;
- envio pendente.

Exemplos:

```
LoadingState
ErrorState
EmptyState
OfflineState
PermissionDeniedState
SyncPendingState
```

---

## 23.8 Tipagem de propriedades

Toda propriedade deve possuir tipo explícito.

Evitar:

```
function Card(props: any) {}
```

Preferir:

```
type OccurrenceStatusBadgeProps = {
  status: OccurrenceStatus;
  size?: "small" | "medium";
};

export function OccurrenceStatusBadge({
  status,
  size = "medium",
}: OccurrenceStatusBadgeProps) {
  return null;
}
```

O uso de `any` deve ser evitado.

Quando o tipo for realmente desconhecido, utilizar `unknown` e validar antes do uso.

---

## 23.9 Responsabilidade única

Sinais de que um componente precisa ser dividido:

- muitos estados;
- muitos efeitos;
- muitas propriedades;
- várias seções independentes;
- muitas condições;
- dificuldade para testar;
- dificuldade para nomear;
- arquivo muito extenso;
- mistura de consulta, regra e renderização.

Não dividir apenas por quantidade de linhas.

Dividir quando existirem responsabilidades diferentes.

---

## 23.10 Tamanho de componentes

Não existe limite absoluto de linhas.

Como referência, componentes acima de aproximadamente 250 a 300 linhas devem ser revisados.

O tamanho por si só não é o problema.

O problema é a complexidade acumulada.

---

## 23.11 Propriedades booleanas

Evitar dezenas de propriedades booleanas.

Exemplo inadequado:

```
<OccurrenceCard
  compact
  showCompany
  showArea
  showActions
  showCriticality
  enableSwipe
  enableMenu
  useDesktopLayout
/>
```

Preferir:

- variantes controladas;
- componentes específicos;
- composição;
- slots;
- APIs menores.

---

## 23.12 Variantes

Quando necessário, variantes devem ser explícitas.

Exemplo:

```
type OccurrenceCardVariant =
  | "mobile"
  | "dashboard"
  | "compact";
```

Não criar variantes demais em um mesmo componente.

---

## 23.13 Eventos

Callbacks devem representar intenção.

Preferir:

```
onOpenOccurrence
onConfirmAwareness
onSubmitCorrection
onReleaseOccurrence
```

Evitar:

```
onClick
onAction
onHandle
onProcess
```

quando a intenção puder ser mais clara.

---

## 23.14 Estado controlado e não controlado

Componentes de formulário devem possuir comportamento consistente.

Quando controlados, receber:

- valor;
- callback;
- erro;
- estado desabilitado.

Quando não controlados, integrar corretamente com React Hook Form.

Não misturar os dois padrões sem necessidade.

---

## 23.15 Acessibilidade

Todo componente interativo deve considerar:

- label;
- descrição;
- foco;
- contraste;
- estado desabilitado;
- leitor de tela;
- teclado no web;
- área de toque no mobile;
- mensagens de erro;
- estado selecionado.

Status não devem depender apenas de cor.

---

## 23.16 Loading

Componentes devem mostrar loading quando uma ação não for imediata.

Exemplo:

```
Salvar
Salvando...
```

Evitar múltiplos cliques durante processamento.

---

## 23.17 Erros

Erros devem ser apresentados próximos ao contexto.

Exemplos:

- erro do campo junto ao campo;
- erro da seção dentro da seção;
- erro da página no topo da página;
- falha de rede em um estado dedicado.

Não mostrar mensagens técnicas.

---

## 23.18 Componentes mobile e web

Não forçar o compartilhamento do mesmo componente entre React Native e web.

Compartilhar:

- intenção;
- tipos;
- tokens;
- regras visuais;
- contratos.

Manter implementações separadas quando isso produzir melhor experiência e menor complexidade.

---

## 23.19 Estilos

Os estilos devem utilizar o sistema visual oficial.

Evitar:

- valores arbitrários repetidos;
- cores diretas espalhadas;
- margens inconsistentes;
- tamanhos sem padrão;
- componentes visualmente semelhantes com estilos diferentes.

---

## 23.20 Testes de componentes

Testar principalmente:

- renderização por estado;
- eventos;
- acessibilidade;
- mensagens de erro;
- comportamento desabilitado;
- loading;
- variantes críticas.

Evitar testes excessivamente acoplados à estrutura interna.

---

# 24. Hooks

Hooks devem encapsular comportamento reutilizável relacionado ao React.

Exemplos:

```
useOccurrences
useOccurrenceDetails
useCreateOccurrence
useConfirmAwareness
useCurrentOrganization
usePermissions
useNetworkStatus
useImageUpload
usePushNotifications
```

---

## 24.1 Responsabilidade

Cada hook deve possuir uma responsabilidade clara.

Um hook não deve:

- buscar dados;
- abrir modal;
- enviar notificação;
- controlar formulário;
- navegar;
- salvar preferências;

tudo ao mesmo tempo.

---

## 24.2 Nomenclatura

Todo hook deve iniciar com:

```
use
```

Exemplos adequados:

```
useOccurrenceDetails
useSubmitMdhoAssessment
useNotificationAwareness
useActiveOrganization
```

Evitar nomes genéricos:

```
useData
useCommon
useHandler
useLogic
useStuff
```

---

## 24.3 Retorno

O retorno deve ser previsível e tipado.

Exemplo:

```
type UseNetworkStatusResult = {
  isOnline: boolean;
  isInternetReachable: boolean | null;
};
```

Quando o hook encapsular TanStack Query, poderá retornar diretamente o resultado da query ou uma estrutura adaptada.

---

## 24.4 Hooks de query

Hooks de query devem centralizar a configuração do TanStack Query.

Exemplo:

```
export function useOccurrenceDetails(
  occurrenceId: string,
) {
  return useQuery({
    queryKey:
      occurrenceQueryKeys.detail(occurrenceId),
    queryFn: () =>
      getOccurrenceDetails(occurrenceId),
    enabled: Boolean(occurrenceId),
  });
}
```

---

## 24.5 Hooks de mutation

Hooks de mutation devem:

- encapsular a mutation;
- invalidar cache necessário;
- tratar callbacks previsíveis;
- não esconder comportamento crítico;
- não limpar formulário antes da confirmação.

Exemplo:

```
export function useCreateOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOccurrence,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          occurrenceQueryKeys.lists(),
      });
    },
  });
}
```

---

## 24.6 Hooks de plataforma

Hooks específicos do Expo devem permanecer no mobile.

Exemplos:

```
useCameraPermission
useLocationPermission
useSecureStorage
usePushNotificationRegistration
```

Hooks específicos do navegador devem permanecer no web.

Exemplos:

```
useMediaQuery
useBrowserVisibility
useDownloadFile
```

---

## 24.7 Efeitos

Evitar `useEffect` quando o valor puder ser:

- calculado;
- derivado;
- obtido por evento;
- controlado por query;
- controlado por formulário.

Não utilizar `useEffect` como solução padrão para toda lógica.

---

## 24.8 Dependências de efeito

Dependências devem estar corretas.

Não desabilitar regras de lint para esconder dependências ausentes sem justificativa.

Quando um efeito estiver complexo demais, reconsiderar a arquitetura.

---

## 24.9 Hooks e regras de negócio

Hooks podem coordenar regras já definidas, mas não devem ser a única proteção de regras críticas.

Exemplo:

```
useReleaseOccurrence()
```

pode chamar a mutation de liberação, mas a autorização e validação real continuam no backend.

---

## 24.10 Hooks globais

Hooks globais devem ser poucos e estáveis.

Exemplos:

```
useAuth
useActiveOrganization
usePermissions
useTheme
```

Evitar transformar cada estado local em hook global.

---

## 24.11 Testes de hooks

Testar hooks quando eles possuírem:

- lógica;
- transformação;
- coordenação;
- retry;
- efeitos;
- comportamento offline;
- estados importantes.

Hooks que apenas encapsulam uma chamada simples podem ser testados indiretamente.

---

# 25. Services

Services representam integração com infraestrutura, plataforma ou serviços externos.

Exemplos:

```
occurrence.service.ts
notification.service.ts
storage.service.ts
location.service.ts
auth.service.ts
push-notification.service.ts
```

---

## 25.1 Responsabilidades

Services podem:

- chamar Supabase;
- chamar Edge Functions;
- fazer upload;
- baixar arquivo;
- acessar APIs da plataforma;
- mapear respostas;
- tratar erro técnico;
- retornar dados tipados.

Services não devem renderizar interface.

---

## 25.2 Intenção explícita

Métodos devem possuir nomes claros.

Preferir:

```
createOccurrence
registerImsReference
approveMdhoAssessment
uploadOccurrenceEvidence
releaseOccurrence
```

Evitar:

```
save
update
process
handle
execute
sendData
```

quando um nome mais específico for possível.

---

## 25.3 Services de domínio e infraestrutura

Services de infraestrutura:

```
storage.service.ts
location.service.ts
push.service.ts
```

Services de domínio:

```
occurrence.service.ts
mdho.service.ts
action-plan.service.ts
```

A separação deve existir apenas quando trouxer clareza.

---

## 25.4 Services específicos por plataforma

Mobile:

- câmera;
- localização;
- SecureStore;
- FileSystem;
- push;
- compartilhamento.

Web:

- cookies;
- download;
- geração de arquivo;
- APIs do navegador;
- Server Actions.

Não tentar compartilhar services incompatíveis.

---

## 25.5 Tratamento de erro

O service deve converter erros técnicos em erros padronizados.

Exemplo:

```
throw new AppError({
  code: "FILE_UPLOAD_FAILED",
  message:
    "Não foi possível enviar a evidência.",
  cause: error,
});
```

A interface não deve conhecer detalhes do SDK do Supabase.

---

## 25.6 Mapeamento

Quando necessário, services podem utilizar mapeadores para converter:

- `snake_case` em `camelCase`;
- linhas do banco em DTOs;
- payloads externos em contratos internos;
- respostas técnicas em resultados de domínio.

---

## 25.7 Testabilidade

Services devem permitir testes sem depender diretamente da interface.

Quando a integração for complexa, dependências podem ser injetadas.

Não criar abstração apenas para facilitar um teste simples.

---

## 25.8 Service Role

Services que utilizam `service_role` devem existir somente em ambiente seguro.

Nunca importar esse tipo de service no mobile ou em Client Components.

---

# 26. Repositories

Repositories não serão obrigatórios por padrão.

Eles devem ser utilizados somente quando reduzirem acoplamento ou organizarem acesso a dados de forma realmente útil.

---

## 26.1 Quando utilizar

Pode ser adequado quando:

- existem várias consultas relacionadas;
- o domínio precisa ser isolado do Supabase;
- há mais de uma fonte de dados;
- testes exigem substituição;
- regras dependem de uma interface de persistência;
- o acesso a dados está espalhado.

---

## 26.2 Quando não utilizar

Não criar repository apenas para envolver uma chamada simples.

Exemplo de excesso:

```
Component
↓
Hook
↓
Service
↓
Repository
↓
Supabase
```

Se o repository apenas repassar os mesmos argumentos, ele não agrega valor.

---

## 26.3 Interface opcional

Exemplo:

```
export interface OccurrenceRepository {
  findById(
    occurrenceId: string,
  ): Promise<OccurrenceDetails>;

  list(
    filters: OccurrenceFilters,
  ): Promise<OccurrenceSummary[]>;

  create(
    input: CreateOccurrenceInput,
  ): Promise<OccurrenceDetails>;
}
```

Essa interface só deve existir quando houver necessidade real.

---

## 26.4 Implementação

Exemplo:

```
export class SupabaseOccurrenceRepository
  implements OccurrenceRepository {
  async findById(
    occurrenceId: string,
  ): Promise<OccurrenceDetails> {
    return getOccurrenceDetails(
      occurrenceId,
    );
  }
}
```

Não adotar classes por padrão.

Funções simples são preferíveis quando suficientes.

---

## 26.5 Regra de simplicidade

Antes de criar um repository, responder:

1. Ele reduz acoplamento real?
2. Ele remove duplicação?
3. Ele melhora testes?
4. Existem múltiplas fontes?
5. Ele organiza uma complexidade existente?

Se a resposta for negativa, não criar.

---

# 27. Queries

Queries representam operações de leitura.

Elas não devem alterar o estado do sistema.

---

## 27.1 Regras

Queries devem:

- possuir nome claro;
- receber parâmetros explícitos;
- retornar tipos definidos;
- selecionar apenas campos necessários;
- aplicar filtros;
- aplicar paginação;
- respeitar RLS;
- tratar erros;
- evitar consultas excessivas.

---

## 27.2 Nomenclatura

Exemplos:

```
getOccurrenceDetails
getOccurrences
getPendingEvaluations
getUnreadNotifications
getMdhoOptions
getActionPlan
getOccurrenceTimeline
```

Evitar:

```
fetchData
getItems
loadInfo
querySomething
```

---

## 27.3 Seleção de campos

Evitar:

```
select("*")
```

quando apenas alguns campos forem necessários.

Preferir consultas específicas para:

- listagem;
- detalhe;
- dashboard;
- exportação;
- mobile;
- web.

---

## 27.4 DTOs de consulta

Uma query de listagem deve retornar um DTO de listagem.

Exemplo:

```
type OccurrenceSummary = {
  id: string;
  publicCode: string;
  status: OccurrenceStatus;
  severity: OccurrenceSeverity;
  areaName: string;
  companyName: string;
  createdAt: string;
};
```

Não retornar a entidade inteira sem necessidade.

---

## 27.5 Paginação

Listagens grandes devem usar paginação.

Estratégias possíveis:

- range;
- offset;
- cursor.

A escolha deve considerar:

- estabilidade da ordenação;
- volume;
- experiência;
- necessidade de scroll infinito;
- exportação.

---

## 27.6 Ordenação

Toda consulta paginada deve possuir ordenação estável.

Exemplo:

```
created_at desc
id desc
```

Evitar paginação com ordenação ambígua.

---

## 27.7 Filtros

Filtros devem possuir tipos explícitos.

Exemplo:

```
type OccurrenceFilters = {
  status?: OccurrenceStatus[];
  severity?: OccurrenceSeverity[];
  areaId?: string;
  contractorOrganizationId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
};
```

---

## 27.8 Busca textual

Busca textual deve:

- normalizar entrada;
- limitar tamanho;
- evitar consultas pesadas;
- utilizar índice quando necessário;
- respeitar organização;
- escapar corretamente.

---

## 27.9 Consultas compostas

Quando uma tela exigir muitos relacionamentos, avaliar:

- view;
- função SQL;
- query específica;
- DTO;
- carregamento separado.

Evitar dezenas de requisições sequenciais para montar uma única página.

---

## 27.10 Queries no servidor e cliente

No web, consultas iniciais podem ocorrer no servidor.

No mobile, consultas ocorrerão normalmente via TanStack Query.

A fonte e a regra devem permanecer consistentes.

---

## 27.11 Cache

Toda query deve possuir uma query key centralizada e estratégia de cache adequada.

Dados estáveis podem possuir cache maior.

Dados operacionais devem atualizar mais frequentemente.

---

## 27.12 Erros

Queries devem lançar erros padronizados.

Exemplos:

```
NOT_FOUND
FORBIDDEN
NETWORK_ERROR
QUERY_FAILED
```

A interface deve apresentar mensagem adequada.

---

# 28. Mutations

Mutations representam operações que alteram o estado do sistema.

---

## 28.1 Intenção de negócio

Cada mutation deve representar uma ação clara.

Exemplos:

```
createOccurrence
startOccurrenceEvaluation
recordOccurrenceDecision
submitMdhoAssessment
approveMdhoAssessment
registerImsReference
createActionItem
submitCorrection
validateCorrection
releaseOccurrence
confirmNotificationAwareness
```

Evitar:

```
updateData
saveItem
changeStatus
processRequest
```

---

## 28.2 Validação

Toda mutation deve:

1. validar entrada;
2. validar autenticação;
3. validar organização;
4. validar permissão;
5. validar escopo;
6. validar status;
7. executar a operação;
8. registrar histórico;
9. registrar auditoria;
10. criar notificações quando necessário.

---

## 28.3 Mudança de status

O frontend não deve enviar apenas:

```
status: "LIBERADA"
```

Ele deve solicitar uma ação:

```
releaseOccurrence({
  occurrenceId,
  releaseNote,
});
```

O backend decide a transição válida.

---

## 28.4 Idempotência

Mutations críticas devem evitar duplicidade.

Casos:

- clique duplo;
- retry;
- reconexão;
- timeout;
- múltiplas abas;
- resposta duplicada.

A proteção pode utilizar:

- idempotency key;
- restrição única;
- validação de status;
- transação;
- upsert.

---

## 28.5 Loading

Durante uma mutation:

- desabilitar ação repetida;
- mostrar progresso;
- preservar formulário;
- impedir navegação acidental quando necessário.

---

## 28.6 Sucesso

Após sucesso:

- atualizar cache;
- mostrar feedback;
- atualizar timeline;
- navegar quando adequado;
- limpar rascunho;
- preservar dados necessários.

---

## 28.7 Falha

Após falha:

- preservar formulário;
- mostrar mensagem clara;
- permitir nova tentativa;
- registrar erro técnico;
- evitar estado visual inconsistente.

---

## 28.8 Erros de negócio

Exemplos:

```
INVALID_STATUS
MISSING_EVIDENCE
MDHO_NOT_APPROVED
ACTIONS_NOT_COMPLETED
PERMISSION_DENIED
DUPLICATE_OPERATION
```

Esses erros não devem ser tratados como falhas inesperadas.

---

## 28.9 Atualização otimista

Não utilizar atualização otimista em ações críticas.

Exemplos:

- Interdição Oficial;
- aprovação MDHO;
- referência IMS;
- liberação;
- cancelamento;
- encerramento.

Aguardar confirmação do backend.

---

## 28.10 Mutations simples

Atualização otimista pode ser considerada em:

- marcar item visual como lido;
- preferência local;
- filtro salvo;
- ação reversível e de baixo risco.

Mesmo nesses casos, deve existir rollback.

---

## 28.11 Auditoria

Toda mutation crítica deve gerar auditoria no backend.

O frontend não deve criar auditoria manualmente como única fonte.

---

# 29. Cache

O cache deve melhorar a experiência sem esconder inconsistências.

A ferramenta padrão para estado remoto será o TanStack Query.

---

## 29.1 Objetivos

O cache deve:

- reduzir requisições;
- melhorar abertura de telas;
- preservar dados temporariamente;
- permitir navegação mais rápida;
- apoiar conexão instável;
- evitar carregamentos repetidos.

---

## 29.2 Tipos de dados

Dados estáveis:

- áreas;
- unidades;
- categorias MDHO;
- opções MDHO;
- configurações;
- papéis.

Podem utilizar `staleTime` maior.

Dados operacionais:

- ocorrência;
- status;
- timeline;
- notificações;
- confirmações de ciência;
- ações;
- validações.

Devem atualizar com mais frequência.

---

## 29.3 Query keys

Query keys devem ser centralizadas por domínio.

Não criar arrays manualmente em vários arquivos.

Exemplo:

```
occurrenceQueryKeys.detail(
  occurrenceId,
)
```

---

## 29.4 Invalidação

Invalidar apenas o necessário.

Exemplo:

```
await queryClient.invalidateQueries({
  queryKey:
    occurrenceQueryKeys.detail(
      occurrenceId,
    ),
});

await queryClient.invalidateQueries({
  queryKey:
    occurrenceQueryKeys.lists(),
});
```

Evitar limpar todo o cache após qualquer mutation.

---

## 29.5 Atualização direta

Pode ser usada quando o novo valor for conhecido e seguro.

Exemplo:

```
queryClient.setQueryData(
  occurrenceQueryKeys.detail(
    occurrenceId,
  ),
  updatedOccurrence,
);
```

Para alterações complexas, preferir invalidação.

---

## 29.6 Persistência no mobile

O cache poderá ser persistido localmente para melhorar o uso em conexão instável.

A persistência deve considerar:

- segurança;
- tamanho;
- expiração;
- organização ativa;
- usuário atual;
- limpeza no logout;
- dados sensíveis;
- versão do schema.

---

## 29.7 Dados desatualizados

A interface deve indicar quando necessário:

```
Última atualização há 5 minutos
Você está offline
Exibindo dados armazenados
Sincronização pendente
```

Não apresentar dado armazenado como atualizado sem contexto.

---

## 29.8 Logout

Ao sair da conta:

- limpar cache sensível;
- limpar organização ativa;
- limpar dados protegidos;
- limpar tokens;
- remover subscriptions;
- impedir acesso por navegação anterior.

---

## 29.9 Troca de organização

Ao trocar a organização ativa:

- invalidar consultas dependentes;
- remover dados da organização anterior;
- atualizar permissões;
- atualizar subscriptions;
- atualizar filtros;
- evitar mistura de dados.

---

## 29.10 Cache e Realtime

Realtime pode:

- invalidar queries;
- atualizar dados conhecidos;
- atualizar contadores;
- atualizar timeline.

O cache continua subordinado ao servidor.

---

## 29.11 Cache e offline

Cache não é o mesmo que suporte offline completo.

Cache permite leitura de dados armazenados.

Suporte offline completo exige:

- fila de operações;
- sincronização;
- resolução de conflito;
- status local;
- upload posterior;
- confirmação do servidor.

---

## 29.12 Limites

Não utilizar cache para:

- substituir banco;
- armazenar segredos;
- manter auditoria;
- confirmar operação crítica;
- esconder falha de sincronização;
- compartilhar dados entre usuários.

---

## 29.13 Regra final da Etapa 2C

Componentes devem ser simples, tipados e organizados por responsabilidade.

Hooks devem encapsular comportamento React sem esconder regras críticas.

Services devem integrar infraestrutura de forma previsível.

Repositories são opcionais e só devem existir quando agregarem valor.

Queries representam leitura.

Mutations representam intenção de negócio.

O cache deve melhorar a experiência, mas nunca substituir o servidor ou ocultar dados desatualizados.

A arquitetura deve evitar camadas artificiais, duplicação e abstrações sem benefício real.

# 30. Offline

O SafeStop deve ser preparado para operar em ambientes com conexão instável.

O suporte offline será implementado de forma gradual.

No MVP inicial, a prioridade será impedir perda de dados.

O suporte offline completo será uma evolução posterior.

---

## 30.1 Princípios

O funcionamento offline deve:

- preservar dados digitados;
- informar claramente o estado da conexão;
- impedir duplicidade;
- diferenciar dado local de dado confirmado no servidor;
- evitar falsa sensação de sucesso;
- permitir nova tentativa;
- proteger dados sensíveis;
- manter o fluxo simples.

---

## 30.2 Estados de conectividade

A aplicação deve identificar estados como:

```
Online
Offline
Conexão instável
Reconectando
Sem confirmação do servidor
```

A interface não deve depender apenas de um booleano simples quando houver informação mais detalhada disponível.

---

## 30.3 Estados de uma operação offline

Uma operação poderá possuir estados locais como:

```
DRAFT
SAVED_LOCALLY
WAITING_FOR_CONNECTION
SYNCING
SYNCED
FAILED
```

Esses estados não substituem os status oficiais da ocorrência.

Eles representam apenas o estado de sincronização local.

---

## 30.4 Rascunho local

Formulários operacionais devem permitir rascunho local quando houver risco de perda.

Exemplos:

- nova Paralisação Preventiva;
- complemento de evidências;
- comentário;
- correção;
- avaliação MDHO em andamento.

O rascunho deve registrar:

- usuário;
- organização;
- tela;
- dados;
- data da última alteração;
- versão do formato;
- anexos pendentes.

---

## 30.5 Criação de ocorrência offline

Quando o suporte completo for implementado, o fluxo será:

1. usuário preenche a ocorrência;
2. aplicação valida localmente;
3. ocorrência é salva no dispositivo;
4. interface informa que ainda não foi enviada;
5. aplicação aguarda conexão;
6. dados são enviados ao servidor;
7. servidor cria a ocorrência;
8. servidor gera o código interno;
9. notificações são geradas;
10. aplicação confirma sincronização.

Enquanto a ocorrência existir apenas no dispositivo, não mostrar:

```
Responsáveis notificados
```

Mostrar:

```
Ocorrência salva no dispositivo.
Aguardando conexão para envio.
```

---

## 30.6 Código temporário local

Caso necessário, uma ocorrência offline poderá possuir um identificador local temporário.

Exemplo:

```
local-550e8400-e29b-41d4-a716-446655440000
```

Esse identificador:

- não será exibido como código oficial;
- não substituirá o código do SafeStop;
- existirá apenas até a sincronização;
- ajudará a associar fotos e rascunhos locais.

---

## 30.7 Operações permitidas offline

Inicialmente poderão ser consideradas:

- salvar rascunho;
- preparar nova ocorrência;
- anexar fotos localmente;
- escrever comentário;
- preparar correção;
- preencher MDHO como rascunho;
- visualizar dados previamente armazenados.

Operações críticas não devem ser consideradas concluídas sem confirmação do servidor.

---

## 30.8 Operações críticas offline

Ações como:

- confirmar Interdição Oficial;
- aprovar MDHO;
- registrar referência IMS;
- validar correção;
- liberar atividade;
- cancelar ocorrência;

não devem ser apresentadas como concluídas enquanto não forem confirmadas pelo backend.

A aplicação poderá permitir preparar a ação, mas deve mostrar claramente:

```
Aguardando sincronização
```

---

## 30.9 Segurança dos dados locais

Dados locais devem ser protegidos.

Avaliar:

- armazenamento criptografado;
- SecureStore para segredos;
- limpeza no logout;
- separação por usuário;
- separação por organização;
- expiração de rascunhos;
- remoção após sincronização.

Não armazenar arquivos sensíveis indefinidamente sem necessidade.

---

## 30.10 Interface offline

A interface deve utilizar mensagens simples.

Exemplos:

```
Você está offline.
Seus dados foram salvos neste dispositivo.

Aguardando conexão para enviar.

Não foi possível sincronizar.
Tente novamente.
```

Evitar mensagens técnicas.

---

## 30.11 Indicador visual

A aplicação poderá exibir:

- ícone de conexão;
- banner;
- badge;
- status na ocorrência;
- contador de itens pendentes.

O indicador deve chamar atenção sem bloquear o uso.

---

## 30.12 Limites

Offline não deve significar:

- acesso irrestrito a todos os dados;
- banco completo no dispositivo;
- execução de regra crítica local;
- confirmação falsa de comunicação;
- ausência de validação posterior;
- duplicação permanente de dados.

---

# 31. Sincronização

A sincronização será responsável por enviar operações locais pendentes ao servidor e atualizar o dispositivo com o estado oficial.

---

## 31.1 Princípio

O servidor sempre será a fonte oficial.

O dispositivo pode manter:

- rascunhos;
- fila de operações;
- anexos pendentes;
- cache;
- metadados de sincronização.

---

## 31.2 Fila de sincronização

A fila poderá armazenar:

- identificador local;
- tipo da operação;
- payload;
- usuário;
- organização;
- data de criação;
- número de tentativas;
- estado;
- último erro;
- idempotency key.

Exemplo de tipos:

```
CREATE_OCCURRENCE
ADD_COMMENT
UPLOAD_ATTACHMENT
SUBMIT_CORRECTION
CONFIRM_AWARENESS
```

---

## 31.3 Ordem de processamento

Operações dependentes devem respeitar ordem.

Exemplo:

```
Criar ocorrência
↓
Obter ID oficial
↓
Enviar fotos
↓
Registrar anexos
```

Não enviar anexo antes de existir uma ocorrência oficial no servidor.

---

## 31.4 Idempotência

Cada operação sincronizável deve possuir uma chave idempotente.

Isso evita duplicidade em:

- retries;
- reinício do aplicativo;
- perda de resposta;
- timeout;
- reconexão;
- envio manual repetido.

---

## 31.5 Retentativas

Retentativas devem considerar:

- tipo de erro;
- quantidade máxima;
- intervalo;
- conexão;
- autenticação;
- validade do payload.

Não repetir automaticamente erros como:

- permissão negada;
- status inválido;
- validação;
- ocorrência inexistente;
- usuário inativo.

---

## 31.6 Backoff

Falhas temporárias poderão utilizar backoff progressivo.

Exemplo conceitual:

```
1ª tentativa: imediata
2ª tentativa: após 10 segundos
3ª tentativa: após 30 segundos
4ª tentativa: após 2 minutos
```

Os valores finais deverão ser configurados conforme testes reais.

---

## 31.7 Conflitos

Conflitos podem ocorrer quando o estado do servidor mudar enquanto o dispositivo está offline.

Exemplos:

- ocorrência já avaliada;
- ação já validada;
- status alterado;
- usuário perdeu permissão;
- ocorrência encerrada.

Nesses casos:

- não sobrescrever automaticamente;
- preservar dados locais;
- informar o usuário;
- permitir revisão;
- registrar erro;
- aplicar a regra oficial do servidor.

---

## 31.8 Estratégia de conflito

Por padrão:

- servidor vence em status;
- dados locais não enviados são preservados;
- usuário recebe instrução;
- operação pode ser corrigida e reenviada;
- ações críticas não usam last-write-wins automaticamente.

---

## 31.9 Sincronização em segundo plano

Quando tecnicamente viável, a aplicação poderá sincronizar:

- ao recuperar conexão;
- ao abrir o aplicativo;
- ao retornar do segundo plano;
- por ação manual;
- em intervalos controlados.

Não depender exclusivamente de execução contínua em segundo plano.

Sistemas móveis podem limitar esse comportamento.

---

## 31.10 Sincronização manual

A aplicação deve oferecer ação como:

```
Sincronizar agora
```

Essa ação deve:

- mostrar progresso;
- informar quantidade pendente;
- evitar múltiplas execuções;
- mostrar falhas;
- preservar itens não enviados.

---

## 31.11 Indicadores

A interface poderá mostrar:

```
3 itens aguardando envio
1 upload em andamento
Última sincronização há 2 minutos
```

---

## 31.12 Limpeza da fila

Após confirmação do servidor:

- marcar como sincronizado;
- atualizar IDs locais;
- remover payload sensível quando seguro;
- manter metadado mínimo, se necessário;
- atualizar cache;
- remover arquivo temporário quando adequado.

---

## 31.13 Observabilidade da sincronização

Registrar tecnicamente:

- operação;
- tentativas;
- duração;
- erro;
- resultado;
- conectividade;
- versão do aplicativo.

Não expor payload sensível nos logs.

---

# 32. Upload de Arquivos

O upload de arquivos é uma parte crítica da experiência de campo.

O SafeStop utilizará principalmente:

- fotos;
- documentos PDF;
- evidências de correção;
- evidências de liberação;
- anexos de plano de ação.

---

## 32.1 Fluxo geral

O fluxo de upload deve ser:

1. selecionar ou capturar;
2. validar;
3. gerar preview;
4. compactar quando necessário;
5. armazenar temporariamente;
6. enviar;
7. registrar metadados;
8. confirmar;
9. atualizar interface.

---

## 32.2 Seleção

O usuário poderá utilizar:

- câmera;
- galeria;
- seletor de arquivos, quando aplicável.

A interface deve deixar claro o tipo aceito.

---

## 32.3 Preview

Antes do envio, permitir:

- visualizar;
- remover;
- adicionar legenda;
- revisar qualidade;
- confirmar.

---

## 32.4 Compressão

Imagens mobile devem ser compactadas antes do upload.

A compressão deve equilibrar:

- legibilidade;
- qualidade;
- tamanho;
- velocidade;
- consumo de dados.

Não reduzir a qualidade a ponto de prejudicar a evidência.

---

## 32.5 Nome do arquivo

Não utilizar diretamente o nome original como caminho definitivo.

Gerar nome seguro.

Exemplo:

```
{attachment_id}.jpg
```

O nome original poderá permanecer nos metadados.

---

## 32.6 Progresso

Uploads devem mostrar:

```
Preparando...
Enviando 35%
Processando...
Concluído
Falha no envio
```

---

## 32.7 Upload múltiplo

Quando houver várias fotos:

- processar de forma controlada;
- limitar concorrência;
- mostrar estado individual;
- permitir tentar novamente apenas o item com falha;
- evitar reiniciar todos os uploads.

---

## 32.8 Falha parcial

Se uma de quatro imagens falhar:

- manter três concluídas;
- marcar uma como falha;
- permitir retry;
- não duplicar as concluídas.

---

## 32.9 Upload e ocorrência

Fotos iniciais podem depender da criação da ocorrência.

Estratégia possível:

1. criar ocorrência;
2. receber ID oficial;
3. enviar anexos;
4. associar metadados;
5. confirmar resultado.

Caso a foto seja obrigatória, a regra deve decidir se a ocorrência pode ser criada antes do upload completo.

---

## 32.10 Upload offline

Arquivos offline devem possuir:

- caminho local;
- tipo;
- tamanho;
- hash opcional;
- estado;
- ocorrência local;
- tentativas;
- erro.

Após sincronização, o caminho remoto substitui a referência local.

---

## 32.11 Validação

Validar:

- tipo MIME;
- extensão;
- tamanho;
- quantidade;
- integridade;
- categoria;
- autorização;
- ocorrência;
- organização.

---

## 32.12 Limites iniciais

Os limites finais serão definidos após testes.

Exemplo inicial:

- até 10 imagens por etapa;
- até 10 MB por imagem antes da compressão;
- até 20 MB por PDF.

Esses valores devem ser configuráveis.

---

## 32.13 Metadados de imagem

Quando disponíveis e necessários, registrar:

- data de captura;
- latitude;
- longitude;
- orientação;
- usuário;
- dispositivo.

Não depender exclusivamente de EXIF.

Metadados podem ser removidos durante compressão.

---

## 32.14 Privacidade

Antes de armazenar metadados, avaliar necessidade.

Não coletar:

- localização desnecessária;
- informações pessoais ocultas;
- dados não relacionados à ocorrência.

---

## 32.15 Evidências imutáveis

Após encerramento, evidências críticas não devem ser substituídas silenciosamente.

Correções devem:

- criar nova versão;
- registrar auditoria;
- preservar histórico;
- exigir permissão.

---

# 33. Geolocalização

A geolocalização será utilizada para registrar o local da ocorrência.

Ela não será utilizada para rastreamento contínuo do usuário.

---

## 33.1 Dados registrados

Quando autorizada:

- latitude;
- longitude;
- precisão;
- data e hora;
- origem da localização.

---

## 33.2 Permissão

A permissão deve ser solicitada no momento em que o recurso for necessário.

A mensagem deve explicar:

- por que a localização é usada;
- em qual contexto;
- que não existe rastreamento contínuo.

---

## 33.3 Negação

Se o usuário negar:

- não bloquear a paralisação;
- permitir preenchimento manual;
- registrar ausência de geolocalização;
- permitir tentar novamente.

Segurança operacional deve prevalecer sobre a captura automática.

---

## 33.4 Precisão

A precisão deve ser armazenada.

Exemplo:

```
latitude: -1.5058
longitude: -48.6853
accuracy: 18 metros
```

A interface poderá indicar localização aproximada.

---

## 33.5 Timeout

A aplicação não deve aguardar indefinidamente.

Utilizar timeout adequado.

Se não obtiver localização:

- continuar o fluxo;
- permitir preenchimento manual;
- mostrar mensagem simples.

---

## 33.6 Local textual

Além das coordenadas, registrar:

- unidade;
- área;
- local;
- TAG quando aplicável;
- descrição complementar.

Coordenadas não substituem o contexto operacional.

---

## 33.7 Uso offline

A geolocalização do dispositivo pode funcionar sem internet, dependendo do equipamento.

A aplicação poderá registrar coordenadas localmente e enviá-las depois.

Mapas ou geocodificação podem exigir conexão.

---

## 33.8 Mapa

O mapa não é obrigatório no MVP inicial.

Quando implementado, poderá ser usado para:

- revisar posição;
- ajustar marcador;
- visualizar ocorrência;
- filtrar por área.

Não deve tornar o registro mais lento.

---

## 33.9 Segurança e privacidade

Não registrar localização em segundo plano.

Não manter histórico contínuo de deslocamento.

Não utilizar geolocalização fora do contexto da ocorrência sem necessidade explícita.

---

# 34. Notificações

A implementação deve seguir:

```
docs/notifications.md
```

As notificações são parte central do SafeStop.

Elas devem ser:

- rápidas;
- automáticas;
- rastreáveis;
- seguras;
- auditáveis;
- direcionadas às pessoas corretas.

---

## 34.1 Arquitetura

O fluxo será:

```
Evento de negócio
↓
Descoberta de destinatários
↓
Criação de notificações individuais
↓
Criação das entregas
↓
Envio pelos canais
↓
Registro do resultado
↓
Leitura
↓
Confirmação de ciência
```

---

## 34.2 Fonte oficial

A notificação interna armazenada no banco é a fonte oficial.

Push é apenas um canal de entrega.

Se o push falhar, a notificação continua existindo.

---

## 34.3 Eventos de negócio

Exemplos:

```
OCCURRENCE_CREATED
DECISION_REQUIRED
VER_AND_ACT_REQUIRED
INTERDICTION_CONFIRMED
MDHO_APPROVAL_REQUIRED
MDHO_RETURNED
IMS_REFERENCE_REGISTERED
ACTION_DUE
CORRECTION_SUBMITTED
RELEASE_REQUIRED
OCCURRENCE_RELEASED
```

---

## 34.4 Destinatários

O backend deve determinar os destinatários considerando:

- organização;
- empresa contratada;
- unidade;
- área;
- contrato;
- gerência;
- papel;
- responsabilidade;
- criticidade;
- configuração.

O usuário de campo não deve selecionar manualmente todos os destinatários.

---

## 34.5 Push

Push deve:

- ser curto;
- evitar dados sensíveis;
- abrir a rota correta;
- carregar identificador;
- tratar token inválido;
- registrar tentativa;
- registrar falha.

---

## 34.6 Notificação interna

Toda notificação deve aparecer na central.

Campos importantes:

- título;
- mensagem;
- prioridade;
- data;
- leitura;
- ciência;
- ocorrência;
- expiração, quando aplicável.

---

## 34.7 Leitura e ciência

São estados diferentes.

Leitura:

```
O usuário abriu a notificação ou ocorrência.
```

Ciência:

```
O usuário confirmou explicitamente que tomou conhecimento.
```

Não marcar ciência automaticamente.

---

## 34.8 Confirmação de ciência

A confirmação deve registrar:

- usuário;
- notificação;
- ocorrência;
- data;
- hora;
- dispositivo;
- canal.

A operação deve ser idempotente.

---

## 34.9 Prioridades

Exemplo:

```
CRITICAL
HIGH
MEDIUM
LOW
```

A prioridade pode influenciar:

- destaque;
- som;
- exigência de ciência;
- escalonamento;
- ordem da central.

---

## 34.10 Escalonamento

Escalonamento poderá ocorrer quando:

- notificação crítica não for visualizada;
- ciência não for confirmada;
- avaliação atrasar;
- ação vencer;
- validação permanecer pendente.

O escalonamento deve:

- seguir regras configuradas;
- evitar spam;
- registrar auditoria;
- possuir limite;
- informar novos destinatários.

---

## 34.11 Tokens de dispositivo

Registrar:

- usuário;
- organização;
- dispositivo;
- plataforma;
- token;
- versão do aplicativo;
- último uso;
- estado ativo.

Tokens inválidos devem ser desativados.

---

## 34.12 Múltiplos dispositivos

Um usuário pode possuir vários dispositivos.

O sistema poderá enviar push para todos os tokens ativos.

A leitura e a ciência permanecem vinculadas ao usuário, não ao dispositivo.

---

## 34.13 Permissões do sistema operacional

Se o usuário negar push:

- manter notificações internas;
- informar como habilitar;
- não impedir uso;
- registrar ausência do canal.

---

## 34.14 Falha de entrega

Falhas devem registrar:

- canal;
- provedor;
- motivo;
- tentativa;
- data;
- destinatário.

Retentativas devem respeitar o tipo de erro.

---

## 34.15 Processamento assíncrono

O envio não deve bloquear o registro da ocorrência.

Fluxo ideal:

1. criar ocorrência;
2. criar eventos;
3. confirmar registro ao usuário;
4. processar canais;
5. registrar resultados.

A comunicação deve iniciar imediatamente, mas a interface não precisa aguardar a conclusão de todos os provedores.

---

## 34.16 Deep links

Push relacionado a ocorrência deve abrir:

```
/occurrences/{id}
```

Antes de exibir, validar:

- autenticação;
- organização;
- permissão;
- existência;
- escopo.

---

## 34.17 Conteúdo sensível

Evitar no push:

- descrição detalhada;
- nomes completos desnecessários;
- dados contratuais;
- fotos;
- informações confidenciais.

O detalhe fica dentro do aplicativo.

---

## 34.18 Testes

Testar:

- destinatários;
- prioridade;
- criação individual;
- push;
- falha;
- token inválido;
- leitura;
- ciência;
- escalonamento;
- deep link;
- múltiplos dispositivos.

---

## 34.19 Regra final da Etapa 3A

O suporte offline deve preservar o trabalho sem criar falsa confirmação.

A sincronização deve ser idempotente, segura e orientada pelo estado oficial do servidor.

Uploads devem ser resilientes e rastreáveis.

A geolocalização deve apoiar a ocorrência sem bloquear o fluxo ou rastrear continuamente o usuário.

As notificações devem ser tratadas como comunicação operacional, não como detalhe visual.

Nenhuma ocorrência deve ser considerada comunicada enquanto não estiver registrada no servidor e os eventos de notificação tiverem sido criados.

# 35. Tratamento de Erros

O SafeStop deve tratar erros de forma previsível, consistente e compreensível.

O objetivo é permitir que o usuário saiba:

- o que aconteceu;
- se seus dados foram preservados;
- qual ação deve executar;
- quando poderá tentar novamente.

Nunca expor detalhes técnicos ao usuário final.

---

## 35.1 Categorias de erro

Os erros serão classificados em:

- erro de validação;
- erro de permissão;
- erro de autenticação;
- erro de conectividade;
- erro do servidor;
- erro inesperado;
- erro de sincronização;
- erro de upload.

Cada categoria deverá possuir tratamento específico.

---

## 35.2 Mensagens

Mensagens devem ser simples.

Exemplo:

```
Não foi possível enviar a ocorrência.
Verifique sua conexão e tente novamente.
```

Evitar mensagens como:

```
HTTP 500
SupabaseError
Row Level Security Policy
SQL Error
```

---

## 35.3 Recuperação

Sempre que possível oferecer:

- Tentar novamente;
- Voltar;
- Salvar localmente;
- Continuar depois.

Nunca perder dados digitados.

---

## 35.4 Registro técnico

Erros deverão registrar:

- usuário;
- organização;
- tela;
- operação;
- horário;
- versão do aplicativo;
- dispositivo;
- stack trace (quando disponível).

Esses dados são apenas para diagnóstico.

---

# 36. Logs

Logs possuem finalidade técnica.

Não substituem auditoria.

---

## 36.1 Objetivos

Permitir:

- diagnóstico;
- monitoramento;
- investigação;
- suporte.

---

## 36.2 Nunca registrar

Jamais registrar:

- senha;
- token;
- refresh token;
- service role;
- arquivos enviados;
- dados pessoais desnecessários.

---

## 36.3 Níveis

Utilizar níveis padronizados.

```
DEBUG
INFO
WARN
ERROR
```

Produção não deverá utilizar DEBUG permanentemente.

---

# 37. Observabilidade

A observabilidade permitirá compreender o comportamento da aplicação.

Ela deverá responder:

- o sistema está funcionando?
- onde ocorreu a falha?
- qual operação está lenta?
- qual recurso apresenta maior erro?

---

## 37.1 Métricas

Inicialmente acompanhar:

- tempo de login;
- tempo de criação de ocorrência;
- tempo de sincronização;
- tempo de upload;
- tempo de carregamento;
- taxa de erro;
- taxa de sincronização.

---

## 37.2 Alertas

No futuro poderão existir alertas para:

- aumento de erros;
- falha em Edge Functions;
- falha de Push;
- aumento de tempo de resposta.

---

# 38. Performance

Performance faz parte da experiência.

Não deve ser tratada apenas no final do projeto.

---

## 38.1 Mobile First

Prioridades:

- abertura rápida;
- poucos toques;
- pouco consumo de bateria;
- pouco consumo de internet.

---

## 38.2 Consultas

Evitar:

- consultas duplicadas;
- carregamentos desnecessários;
- componentes pesados.

---

## 38.3 Renderização

Componentes devem:

- evitar re-renderizações;
- utilizar memoização quando necessário;
- evitar listas gigantes sem virtualização.

---

## 38.4 Bundle

Adicionar dependências apenas quando realmente agregarem valor.

Preferir bibliotecas leves.

---

# 39. Acessibilidade

Toda interface deverá ser utilizável pelo maior número possível de pessoas.

---

## 39.1 Diretrizes

Considerar:

- contraste;
- foco;
- leitor de tela;
- tamanho do toque;
- navegação por teclado no Web.

---

## 39.2 Cores

Nunca utilizar apenas cor para transmitir significado.

Sempre combinar:

- ícone;
- texto;
- badge;
- cor.

---

# 40. Internacionalização

O idioma oficial inicial será:

```
Português (Brasil)
```

Toda a estrutura deverá permitir futuramente:

- Inglês;
- Espanhol.

---

## 40.1 Datas

Datas devem utilizar formatação da localização do usuário.

---

## 40.2 Textos

Evitar textos diretamente dentro dos componentes.

Utilizar arquivos centralizados.

---

# 41. Testes

Todo recurso importante deverá possuir estratégia de teste.

---

## 41.1 Tipos

Priorizar:

- testes unitários;
- testes de integração;
- testes E2E;
- testes manuais.

---

## 41.2 Fluxos críticos

Sempre testar:

- criar ocorrência;
- avaliação;
- MDHO;
- IMS;
- ação corretiva;
- liberação;
- notificações;
- sincronização.

---

# 42. Git

Git é parte do processo de engenharia.

Não apenas ferramenta de versionamento.

---

## 42.1 Branch principal

A branch oficial será:

```
main
```

---

## 42.2 Branch develop

Opcional.

Será criada apenas se realmente necessária.

---

## 42.3 Branches de feature

Padrão:

```
feature/nome-da-feature
```

Exemplo:

```
feature/create-occurrence
```

---

## 42.4 Branch de correção

Padrão:

```
fix/nome-da-correcao
```

---

# 43. Branches

Organização sugerida.

```
feature/
fix/
refactor/
docs/
test/
hotfix/
```

Cada branch deve possuir apenas um objetivo.

---

# 44. Commits

Commits devem ser pequenos.

Cada commit representa uma alteração lógica.

---

## 44.1 Conventional Commits

Utilizar:

```
feat:
fix:
docs:
refactor:
style:
chore:
test:
perf:
```

---

## 44.2 Exemplos

```
feat: create occurrence workflow

fix: correct notification recipient

docs: update engineering guide
```

---

# 45. Pull Requests

Todo Pull Request deverá:

- possuir descrição;
- objetivo;
- checklist;
- impacto esperado;
- screenshots quando houver interface.

---

## 45.1 Revisão

Antes do merge verificar:

- lint;
- testes;
- build;
- documentação;
- impacto.

---

# 46. Versionamento

O SafeStop seguirá Semantic Versioning.

Formato:

```
MAJOR.MINOR.PATCH
```

Exemplo:

```
1.0.0
```

---

## 46.1 MAJOR

Mudanças incompatíveis.

---

## 46.2 MINOR

Novas funcionalidades.

---

## 46.3 PATCH

Correções.

---

# 47. CI/CD

Todo código deverá passar automaticamente por validações antes do deploy.

Pipeline mínimo:

1. Install
2. Lint
3. Typecheck
4. Test
5. Build

Somente após todas as etapas concluídas o deploy poderá ocorrer.

---

## 47.1 Deploy

Ambientes:

```
Local
```

↓

```
Development
```

↓

```
Staging
```

↓

```
Production
```

Cada ambiente deverá possuir:

- variáveis próprias;
- banco próprio;
- configurações próprias.

---

## 47.2 Regra Final da Etapa 3B

O processo de engenharia do SafeStop deve priorizar previsibilidade, simplicidade e qualidade.

Toda alteração deverá ser:

- testável;
- auditável;
- reproduzível;
- documentada;
- revisável.

Velocidade nunca poderá comprometer a confiabilidade do sistema.

# 48. Deploy

O deploy do SafeStop deve ser previsível, reproduzível e separado por ambiente.

Nenhum deploy deve depender de alterações manuais não documentadas.

---

## 48.1 Deploy do Mobile

O aplicativo mobile utilizará:

- Expo Application Services;
- EAS Build;
- EAS Submit, quando aplicável;
- EAS Update, após avaliação;
- distribuição interna para testes;
- publicação oficial nas lojas quando o produto estiver validado.

---

## 48.2 Plataformas mobile

A prioridade inicial será:

```
Android
```

O suporte a iOS deverá permanecer possível desde o início, mesmo que a publicação ocorra posteriormente.

Não utilizar APIs exclusivas de Android sem abstração ou justificativa.

---

## 48.3 Perfis de build

O arquivo `eas.json` deverá possuir perfis separados.

Exemplo:

```
development
preview
production
```

Cada perfil deverá utilizar:

- variáveis apropriadas;
- identificadores próprios quando necessário;
- canal de atualização correspondente;
- configurações de assinatura;
- ambiente de backend correto.

---

## 48.4 Build de desenvolvimento

O build de desenvolvimento será utilizado para:

- desenvolvimento com recursos nativos;
- testes de câmera;
- testes de localização;
- testes de push;
- testes de deep link;
- testes de armazenamento seguro.

O Expo Go poderá ser utilizado apenas enquanto atender às necessidades do projeto.

Quando uma funcionalidade exigir configuração nativa, utilizar Development Build.

---

## 48.5 Build de preview

O build de preview será utilizado para:

- homologação;
- testes com usuários;
- demonstrações;
- validação de fluxo;
- testes em dispositivos reais.

O preview não deve utilizar o banco de produção.

---

## 48.6 Build de produção

O build de produção deve:

- utilizar variáveis de produção;
- remover logs de debug;
- possuir versionamento correto;
- utilizar backend de produção;
- possuir configuração final de notificações;
- passar pelos testes obrigatórios;
- ser validado em dispositivo real.

---

## 48.7 EAS Update

EAS Update poderá ser utilizado para alterações compatíveis com a camada JavaScript.

Não utilizar atualização remota para mudanças incompatíveis com o código nativo.

Antes de publicar uma atualização, validar:

- runtime version;
- compatibilidade;
- ambiente;
- canal;
- rollback;
- impacto;
- testes.

---

## 48.8 Rollback mobile

O processo de publicação deve permitir retorno seguro.

Quando possível:

- manter versão anterior estável;
- documentar alterações;
- usar canais de atualização;
- interromper rollout;
- reverter atualização JavaScript;
- publicar correção rapidamente.

---

## 48.9 Deploy da Web

O painel web será hospedado inicialmente na Vercel.

O deploy poderá ocorrer automaticamente a partir do GitHub.

---

## 48.10 Deploy de preview web

Pull Requests poderão gerar ambientes de preview.

Esses ambientes servirão para:

- revisão visual;
- testes;
- validação de comportamento;
- comparação com referência;
- homologação rápida.

Ambientes de preview não devem acessar dados reais de produção.

---

## 48.11 Deploy de produção web

O deploy de produção deve ocorrer somente após:

- lint aprovado;
- typecheck aprovado;
- testes aprovados;
- build aprovado;
- migrations aplicadas;
- variáveis validadas;
- revisão concluída.

---

## 48.12 Deploy do Supabase

O Supabase será gerenciado por migrations versionadas.

O fluxo recomendado será:

1. desenvolver localmente;
2. criar migration;
3. testar;
4. aplicar em staging;
5. validar;
6. aplicar em produção.

Não alterar manualmente tabelas, políticas ou funções em produção sem registrar migration correspondente.

---

## 48.13 Edge Functions

Edge Functions devem possuir processo de deploy separado e rastreável.

Antes do deploy:

- validar variáveis;
- testar payloads;
- testar erros;
- verificar autenticação;
- verificar autorização;
- verificar logs;
- testar integração externa.

---

## 48.14 Ordem de deploy

Quando houver mudança coordenada entre banco, backend e interface, utilizar ordem segura.

Exemplo:

1. aplicar mudança compatível no banco;
2. publicar funções;
3. publicar web;
4. publicar mobile;
5. remover compatibilidade antiga somente depois.

Evitar mudanças que exijam atualização simultânea de todos os clientes.

---

## 48.15 Compatibilidade entre versões

O backend deve tolerar, por um período controlado, versões anteriores do aplicativo.

Isso é importante porque usuários mobile podem demorar para atualizar.

Mudanças incompatíveis devem:

- ser planejadas;
- possuir transição;
- ter prazo;
- gerar comunicação;
- evitar quebra imediata.

---

## 48.16 Checklist de deploy

Antes de qualquer deploy:

- confirmar ambiente;
- confirmar branch;
- confirmar versão;
- validar secrets;
- validar migrations;
- validar build;
- validar testes;
- validar rollback;
- revisar alterações;
- registrar release.

---

# 49. Ambientes

O SafeStop deverá possuir ambientes separados.

Ambientes previstos:

```
local
development
staging
production
```

---

## 49.1 Ambiente local

Utilizado para desenvolvimento individual.

Características:

- Supabase local ou projeto remoto de desenvolvimento;
- dados fictícios;
- logs detalhados;
- ferramentas de desenvolvimento;
- hot reload;
- migrations locais;
- seeds.

Nenhum dado real de produção deve ser necessário para desenvolver.

---

## 49.2 Ambiente development

Utilizado para integração contínua entre funcionalidades em desenvolvimento.

Pode ser compartilhado pela equipe.

Deve possuir:

- banco próprio;
- Storage próprio;
- configurações próprias;
- chaves próprias;
- dados de teste;
- canais de push separados.

---

## 49.3 Ambiente staging

Utilizado para homologação.

Deve ser o mais próximo possível de produção.

Objetivos:

- validar fluxos;
- testar migrations;
- testar notificações;
- testar permissões;
- testar dispositivos reais;
- testar deploy;
- validar versão candidata.

---

## 49.4 Ambiente production

Utilizado por usuários reais.

Deve possuir:

- banco exclusivo;
- chaves exclusivas;
- Storage exclusivo;
- monitoramento;
- backups;
- logs controlados;
- acesso administrativo restrito.

---

## 49.5 Separação de dados

Dados não devem ser compartilhados entre ambientes.

Não reutilizar:

- banco;
- bucket;
- token;
- projeto Supabase;
- credencial;
- canal de push;
- chave de provedor.

---

## 49.6 Variáveis de ambiente

O arquivo `.env.example` deve documentar todas as variáveis necessárias.

Exemplos:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

RESEND_API_KEY=
EXPO_ACCESS_TOKEN=
```

Variáveis administrativas devem existir somente em ambientes seguros.

---

## 49.7 Validação das variáveis

As variáveis devem ser validadas na inicialização.

Se uma variável obrigatória estiver ausente, a aplicação deve falhar com mensagem clara.

Não permitir comportamento silencioso com configuração incompleta.

---

## 49.8 Identificação visual do ambiente

Ambientes que não sejam produção podem exibir identificação visual.

Exemplo:

```
DEVELOPMENT
STAGING
```

Isso reduz o risco de testes serem realizados no ambiente errado.

---

## 49.9 Dados de teste

Dados de desenvolvimento e staging devem ser:

- fictícios;
- identificáveis;
- reproduzíveis;
- seguros;
- descartáveis.

Não copiar dados reais de produção sem processo formal de anonimização.

---

# 50. Dependências

Toda dependência adiciona custo de manutenção, segurança e compatibilidade.

Antes de instalar uma dependência, deve existir uma necessidade concreta.

---

## 50.1 Critérios para nova dependência

Responder:

1. Qual problema ela resolve?
2. A plataforma já oferece esse recurso?
3. Existe solução simples sem biblioteca?
4. Ela funciona no Expo?
5. Ela funciona no monorepo?
6. Possui manutenção ativa?
7. Possui boa documentação?
8. Possui vulnerabilidades conhecidas?
9. Qual impacto no bundle?
10. Será utilizada agora?

---

## 50.2 Dependências desnecessárias

Não instalar bibliotecas apenas porque podem ser úteis futuramente.

Evitar:

- bibliotecas duplicadas;
- utilitários enormes para uma função simples;
- múltiplas bibliotecas para datas;
- múltiplos gerenciadores de estado;
- múltiplos sistemas de validação;
- múltiplas bibliotecas de formulário.

---

## 50.3 Dependências oficiais

Quando possível, preferir:

- SDK oficial;
- biblioteca mantida pelo fornecedor;
- biblioteca consolidada;
- solução com documentação ativa.

---

## 50.4 Dependências nativas

Dependências nativas exigem atenção adicional.

Verificar:

- compatibilidade com Expo;
- necessidade de prebuild;
- compatibilidade Android;
- compatibilidade iOS;
- EAS Build;
- manutenção;
- permissões do sistema.

---

## 50.5 Dependências compartilhadas

Dependências utilizadas por vários pacotes devem ter versões alinhadas.

Evitar versões diferentes de:

- React;
- TypeScript;
- Zod;
- TanStack Query;
- Supabase;
- ferramentas de lint.

---

## 50.6 Peer dependencies

Pacotes internos devem declarar corretamente suas peer dependencies quando necessário.

Isso evita:

- múltiplas versões do React;
- conflitos;
- bundles duplicados;
- erros de resolução.

---

## 50.7 Lockfile

O arquivo:

```
pnpm-lock.yaml
```

deve permanecer versionado.

Instalações em CI devem utilizar:

```
pnpm install --frozen-lockfile
```

---

## 50.8 Scripts nativos

Dependências com scripts de instalação devem ser avaliadas.

No pnpm, scripts nativos devem ser permitidos apenas quando necessários e confiáveis.

---

## 50.9 Auditoria de dependências

Executar verificações periódicas.

Avaliar:

- vulnerabilidades;
- pacotes abandonados;
- versões incompatíveis;
- dependências não utilizadas;
- duplicações;
- tamanho.

---

## 50.10 Remoção

Dependências não utilizadas devem ser removidas.

Antes de remover:

- pesquisar imports;
- verificar scripts;
- verificar configuração;
- executar testes;
- executar build.

---

# 51. Atualizações

Atualizações devem ser planejadas e controladas.

Não atualizar toda a stack ao mesmo tempo sem necessidade.

---

## 51.1 Tipos de atualização

Classificar:

- patch;
- minor;
- major;
- segurança;
- compatibilidade;
- correção urgente.

---

## 51.2 Atualizações de segurança

Devem receber prioridade conforme o risco.

Antes de atualizar:

- verificar impacto;
- ler changelog;
- testar;
- validar build;
- validar fluxo crítico.

---

## 51.3 Atualizações major

Atualizações major devem possuir tarefa própria.

Elas podem exigir:

- migration;
- refatoração;
- mudança de configuração;
- alteração nativa;
- nova versão mobile;
- ADR.

---

## 51.4 Expo SDK

A atualização do Expo SDK deve verificar:

- React Native;
- módulos Expo;
- EAS;
- configuração nativa;
- plugins;
- Android;
- iOS;
- Development Build.

---

## 51.5 Next.js

Antes de atualizar Next.js:

- ler migration guide;
- verificar App Router;
- verificar middleware;
- verificar Server Actions;
- verificar build;
- verificar Vercel.

---

## 51.6 Supabase

Atualizações do cliente ou ferramentas devem ser testadas em:

- Auth;
- Storage;
- Realtime;
- Edge Functions;
- geração de tipos;
- sessão mobile;
- sessão web.

---

## 51.7 Atualizações automáticas

Ferramentas como Dependabot ou Renovate poderão ser utilizadas futuramente.

Pull Requests automáticos não devem ser mesclados sem:

- testes;
- revisão;
- changelog;
- validação de compatibilidade.

---

## 51.8 Frequência

Realizar revisões periódicas, sem transformar atualizações em trabalho contínuo sem valor.

A estabilidade do produto possui prioridade.

---

# 52. Convenções para Inteligência Artificial

Ferramentas de IA poderão auxiliar no desenvolvimento, mas devem seguir a documentação e as decisões do projeto.

A IA não é fonte da verdade.

---

## 52.1 Contexto obrigatório

Antes de implementar uma funcionalidade, a IA deve consultar os documentos relevantes.

Exemplos:

```
docs/product.md
docs/architecture.md
docs/database.md
docs/workflow.md
docs/notifications.md
docs/roadmap.md
docs/engineering.md
docs/decisions/
```

---

## 52.2 Não inventar regras

A IA não deve:

- criar status não definidos;
- alterar fluxo por conta própria;
- adicionar campos sem justificativa;
- criar integração com IMS;
- mudar stack;
- instalar dependências sem necessidade;
- criar arquitetura paralela;
- remover rastreabilidade;
- enfraquecer segurança.

---

## 52.3 Antes de codificar

A IA deve:

1. compreender o objetivo;
2. localizar arquivos relacionados;
3. consultar documentação;
4. verificar padrões existentes;
5. propor plano curto;
6. implementar mudança mínima;
7. validar;
8. resumir alterações.

---

## 52.4 Alteração mínima

Preferir alterações pequenas e focadas.

Não refatorar áreas não relacionadas sem solicitação.

Não alterar estilo, dependências ou arquitetura durante uma correção simples.

---

## 52.5 Reutilização

Antes de criar:

- componente;
- hook;
- schema;
- tipo;
- utilitário;
- service;

a IA deve pesquisar se já existe solução adequada.

---

## 52.6 Dependências

A IA não deve instalar dependência automaticamente sem:

- explicar a necessidade;
- verificar alternativa nativa;
- verificar compatibilidade;
- avaliar impacto.

---

## 52.7 Segurança

A IA nunca deve:

- expor secrets;
- desabilitar RLS;
- usar `service_role` no cliente;
- tornar bucket público;
- ignorar autorização;
- confiar apenas no frontend;
- registrar tokens em logs.

---

## 52.8 Banco

A IA deve:

- usar migrations;
- preservar dados;
- documentar mudança;
- atualizar tipos;
- criar índices quando necessários;
- considerar RLS;
- evitar alteração manual em produção.

---

## 52.9 Testes

Toda implementação relevante deve incluir ou atualizar testes quando aplicável.

A IA deve executar:

```
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

ou os scripts equivalentes existentes.

---

## 52.10 Comunicação de incerteza

Quando houver ambiguidade real, a IA deve:

- apontar a dúvida;
- consultar documentação;
- evitar inventar;
- sugerir decisão explícita.

---

## 52.11 Saída da tarefa

Ao concluir, a IA deve informar:

- o que mudou;
- arquivos alterados;
- validações executadas;
- riscos;
- pendências;
- próximo passo objetivo.

---

# 53. Regras para Cursor

O Cursor será utilizado como principal ambiente assistido de desenvolvimento.

Ele deve respeitar integralmente este documento.

---

## 53.1 Leitura de contexto

Antes de iniciar uma tarefa, o Cursor deve consultar:

- documentação relevante;
- arquivos existentes;
- fluxo;
- modelagem;
- regras da feature;
- referências do Base44 quando a tarefa envolver interface.

---

## 53.2 Planejamento

Para tarefas médias ou grandes, o Cursor deve apresentar plano objetivo antes de alterar arquivos.

O plano deve listar:

- objetivo;
- arquivos prováveis;
- etapas;
- validações.

---

## 53.3 Edição controlada

O Cursor deve:

- editar somente arquivos necessários;
- preservar código funcional;
- evitar reescrita extensa;
- não apagar documentação;
- não mudar arquitetura sem autorização;
- manter padrões existentes.

---

## 53.4 Referência Base44

O código e os prints do Base44 são referências de:

- layout;
- navegação;
- fluxo visual;
- identidade inicial.

Eles não são fonte oficial de:

- arquitetura;
- segurança;
- banco;
- regras de negócio;
- qualidade de código.

---

## 53.5 Código gerado

Todo código deve ser:

- tipado;
- legível;
- testável;
- simples;
- consistente;
- sem `any` desnecessário;
- sem imports não utilizados;
- sem comentários inúteis;
- sem TODO abandonado.

---

## 53.6 Validação

Após mudanças, executar as validações disponíveis.

Não afirmar que uma tarefa foi concluída sem informar o que foi realmente validado.

---

## 53.7 Agentes

Agentes especializados poderão ser utilizados para:

- arquitetura;
- mobile;
- web;
- backend;
- banco;
- segurança;
- testes;
- depuração;
- UI/UX.

Cada agente deve respeitar as mesmas fontes da verdade.

---

# 54. Regras para Codex

O Codex poderá ser utilizado para tarefas de implementação, revisão, correção e investigação.

---

## 54.1 Escopo

O prompt deve definir:

- objetivo;
- contexto;
- arquivos relevantes;
- restrições;
- critérios de aceite;
- validações.

---

## 54.2 Investigação antes da alteração

O Codex deve:

1. pesquisar a implementação atual;
2. identificar causa;
3. consultar documentação;
4. avaliar impacto;
5. alterar somente depois.

---

## 54.3 Não mascarar problemas

O Codex não deve:

- desabilitar lint;
- usar `@ts-ignore` sem justificativa;
- converter para `any`;
- remover teste;
- capturar erro silenciosamente;
- alterar regra para fazer teste passar;
- comentar código problemático.

---

## 54.4 Correções

Correções devem atacar a causa raiz.

Não aplicar remendo visual quando o problema for:

- regra de negócio;
- cache;
- banco;
- autorização;
- sincronização;
- estado;
- fluxo.

---

## 54.5 Relatório final

Ao concluir, deve informar:

- diagnóstico;
- solução;
- arquivos;
- testes;
- riscos residuais;
- comportamento esperado.

---

# 55. Checklist de Desenvolvimento

Antes de iniciar uma funcionalidade:

- [ ] Ler o roadmap.
- [ ] Ler o fluxo relacionado.
- [ ] Verificar o banco.
- [ ] Verificar permissões.
- [ ] Verificar notificações.
- [ ] Consultar referência visual.
- [ ] Identificar componentes existentes.
- [ ] Identificar schemas existentes.
- [ ] Definir critérios de aceite.
- [ ] Confirmar escopo da Sprint.

Durante o desenvolvimento:

- [ ] Manter mudança focada.
- [ ] Preservar tipagem.
- [ ] Validar entradas.
- [ ] Tratar loading.
- [ ] Tratar erro.
- [ ] Tratar estado vazio.
- [ ] Tratar permissão.
- [ ] Tratar conexão.
- [ ] Evitar duplicidade.
- [ ] Atualizar cache corretamente.
- [ ] Registrar auditoria quando necessário.
- [ ] Garantir experiência mobile.

Após o desenvolvimento:

- [ ] Revisar código.
- [ ] Executar lint.
- [ ] Executar typecheck.
- [ ] Executar testes.
- [ ] Executar build.
- [ ] Testar fluxo principal.
- [ ] Testar erro.
- [ ] Testar sem permissão.
- [ ] Atualizar documentação.
- [ ] Registrar commit.

---

# 56. Checklist Antes do Commit

Antes de criar um commit:

- [ ] O código compila.
- [ ] Não existem erros de TypeScript.
- [ ] Não existem imports não utilizados.
- [ ] Não existem logs temporários.
- [ ] Não existem secrets.
- [ ] Não existem arquivos desnecessários.
- [ ] A mudança está focada.
- [ ] O comportamento foi testado.
- [ ] Os testes foram executados.
- [ ] A documentação foi atualizada.
- [ ] O commit possui mensagem clara.

---

## 56.1 Commit incompleto

Não criar commit com:

- build quebrado;
- teste quebrado;
- código comentado;
- arquivo temporário;
- secret;
- `.env`;
- dependência não utilizada;
- migration não testada.

---

# 57. Checklist Antes do Merge

Antes do merge:

- [ ] Pull Request revisado.
- [ ] Critérios de aceite atendidos.
- [ ] Lint aprovado.
- [ ] Typecheck aprovado.
- [ ] Testes aprovados.
- [ ] Build aprovado.
- [ ] Migrations revisadas.
- [ ] RLS revisada.
- [ ] Segurança revisada.
- [ ] Mobile validado.
- [ ] Web validado.
- [ ] Documentação atualizada.
- [ ] Sem conflito.
- [ ] Sem alteração fora do escopo.
- [ ] Plano de rollback avaliado.

---

# 58. Checklist Antes da Release

Antes de uma release:

- [ ] Versão atualizada.
- [ ] Changelog preparado.
- [ ] Ambiente confirmado.
- [ ] Banco validado.
- [ ] Backup confirmado.
- [ ] Migrations testadas em staging.
- [ ] Edge Functions publicadas.
- [ ] Web validada.
- [ ] Build mobile validado.
- [ ] Push testado.
- [ ] Deep links testados.
- [ ] Autenticação testada.
- [ ] Permissões testadas.
- [ ] Fluxo Ver e Agir testado.
- [ ] Fluxo de Interdição testado.
- [ ] MDHO testado.
- [ ] Referência IMS testada.
- [ ] Plano de ação testado.
- [ ] Liberação testada.
- [ ] Auditoria testada.
- [ ] Monitoramento ativo.
- [ ] Rollback preparado.

---

# 59. Fonte da Verdade

As fontes oficiais do SafeStop são:

```
docs/product.md
docs/architecture.md
docs/database.md
docs/workflow.md
docs/notifications.md
docs/roadmap.md
docs/engineering.md
docs/decisions/
```

---

## 59.1 Ordem de prioridade

Em caso de conflito:

1. segurança;
2. legislação e requisitos aplicáveis;
3. `product.md`;
4. `workflow.md`;
5. `database.md`;
6. `architecture.md`;
7. `notifications.md`;
8. ADR mais recente;
9. `engineering.md`;
10. implementação existente.

A implementação existente não deve prevalecer quando contrariar uma decisão oficial mais recente.

---

## 59.2 Atualização da documentação

Quando uma decisão mudar:

- atualizar o documento correspondente;
- criar ADR quando necessário;
- atualizar código;
- atualizar testes;
- evitar documentos contraditórios.

---

# 60. Regra Final

O SafeStop deve ser construído como um produto simples, confiável, seguro e eficiente.

A engenharia deve apoiar o objetivo do produto:

> reduzir o tempo entre a identificação de uma condição insegura e a comunicação efetiva às pessoas responsáveis.

Toda decisão técnica deve preservar:

- Mobile First;
- velocidade acima da complexidade;
- comunicação antes da burocracia;
- rastreabilidade total;
- segurança em primeiro lugar;
- simplicidade com eficiência.

A melhor solução não será a mais sofisticada.

Será aquela que:

- funcionar bem em campo;
- proteger os dados;
- reduzir falhas de comunicação;
- permitir manutenção;
- evitar retrabalho;
- gerar confiança;
- continuar simples conforme o produto evoluir.

Nenhuma arquitetura, dependência, padrão ou ferramenta deve se tornar mais importante que o problema real que o SafeStop existe para resolver.
