# Content4You - Guia Completo do PromoControl

Este documento resume a aplicacao inteira (backend + frontend web + operacao), atualizado para o estado atual do projeto.

## 1) Visao geral

O PromoControl e um sistema web para controle operacional de promotores em loja:
- cadastro e manutencao de fornecedores, promotores e usuarios;
- registro de entrada e saida com regras de negocio;
- visao de painel estilo planilha e indicadores de cumprimento;
- configuracao operacional por empresa;
- trilha de auditoria, seguranca por perfil e observabilidade.

Pilha principal:
- Java 21
- Spring Boot
- Spring Security (Basic Auth)
- Spring Data JPA
- Flyway
- H2 (dev/homolog local) e PostgreSQL (prod)
- Front estatico em `src/main/resources/static/promocontrol` (HTML/CSS/JS)

## 2) Arquitetura por camadas

Estrutura de codigo:
- `core`: dominio (entidades, enums, repositorios, excecoes)
- `application`: regras de negocio (services + mapper)
- `infra`: controllers, seguranca, configuracoes, filtros, tratamento de erro, job agendado

Arquivo de entrada:
- `src/main/java/br/com/infocedro/promocontrol/PromocontrolApplication.java`

## 3) Dominio (core)

Entidades principais:
- `AuditableEntity`: base de auditoria (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`)
- `Fornecedor`: cadastro e status
- `Promotor`: dados operacionais, vinculo com fornecedor, status e codigo numerico
- `MovimentoPromotor`: entrada/saida, trilha de ajuste de horario e liberacao de saida
- `Usuario`: autenticacao/autorizacao, flags `acessaWeb` e `acessaMobile`, troca de senha obrigatoria
- `ConfiguracaoEmpresa`: regras por empresa (encerramento automatico, multiplas entradas, foto obrigatoria)
- `EmpresaContratante`: dominio administrativo vinculado a fornecedor

Enums:
- `StatusPromotor`: `ATIVO`, `INATIVO`, `BLOQUEADO`
- `TipoMovimentoPromotor`: `ENTRADA`, `SAIDA`

Repositorios:
- `FornecedorRepository`
- `PromotorRepository`
- `MovimentoPromotorRepository`
- `UsuarioRepository`
- `ConfiguracaoEmpresaRepository`
- `EmpresaContratanteRepository`

Excecoes de negocio:
- base: `BusinessException`, `BadRequestBusinessException`, `NotFoundBusinessException`
- especificas: entrada em aberto, sem entrada em aberto, liberacao obrigatoria, foto obrigatoria, multiplas entradas nao permitidas, usuario ja existe, autoexclusao, etc.

## 4) Servicos (application)

Principais services:
- `FornecedorService`
- `PromotorService`
- `MovimentoPromotorService`
- `DashboardService`
- `ConfiguracaoEmpresaService`
- `EmpresaContratanteService`
- `EncerramentoAutomaticoMovimentoService`
- `ApiMapper`

Regras criticas implementadas:
- promotor precisa estar `ATIVO` para movimentar;
- bloqueio de dupla entrada em aberto;
- bloqueio de saida sem entrada em aberto;
- `liberadoPor` obrigatorio na saida;
- ajuste manual de horario com motivo (perfil `ADMIN`);
- regras por empresa (multiplas entradas, exigencia de foto, encerramento automatico);
- exclusoes administrativas com limpeza de vinculos quando aplicavel.

## 5) API HTTP (infra/controller)

### 5.1 Autenticacao e usuarios
- `GET /auth/sessao`
- `POST /auth/alterar-senha`
- `POST /auth/admin/resetar-senha`
- `GET /auth/admin/usuarios`
- `POST /auth/admin/usuarios`
- `PATCH /auth/admin/usuarios/{username}`
- `DELETE /auth/admin/usuarios/{username}`

### 5.2 Fornecedores
- `POST /fornecedores`
- `GET /fornecedores`
- `GET /fornecedores/{id}`
- `PUT /fornecedores/{id}`
- `DELETE /fornecedores/{id}`

### 5.3 Promotores
- `POST /promotores`
- `GET /promotores`
- `PUT /promotores/{id}`
- `DELETE /promotores/{id}`

### 5.4 Movimentos
- `POST /movimentos/entrada`
- `POST /movimentos/saida`
- `PATCH /movimentos/{movimentoId}/ajuste-horario`
- `GET /movimentos`
- `DELETE /movimentos/{movimentoId}`

### 5.5 Dashboard
- `GET /dashboard/planilha-principal`
- `GET /dashboard/cumprimento-fornecedores`

### 5.6 Configuracao por empresa
- `POST /empresas/{empresaId}/configuracao`
- `GET /empresas/{empresaId}/configuracao`
- `PUT /empresas/{empresaId}/configuracao`
- `DELETE /empresas/{empresaId}/configuracao` (redefine padrao)

### 5.7 Empresas contratantes
- `POST /empresas-cadastro`
- `GET /empresas-cadastro`
- `GET /empresas-cadastro/{id}`
- `PUT /empresas-cadastro/{id}`
- `DELETE /empresas-cadastro/{id}`

## 6) Seguranca e autorizacao

Configuracao central:
- `src/main/java/br/com/infocedro/promocontrol/infra/config/SecurityConfig.java`

Pontos importantes:
- Basic Auth;
- CORS configuravel por env;
- `CorrelationIdFilter` no pipeline;
- `PasswordChangeRequiredFilter` bloqueia uso da API quando senha temporaria ainda nao foi trocada;
- `ApiErrorResponse` padroniza `401/403`.

Matriz de perfis (resumo):
- `VIEWER`: leitura (`GET`) de dominios operacionais e dashboard.
- `OPERATOR`: leitura + operacao de movimento + CRUD operacional (fornecedor/promotor/configuracao/empresa contratante).
- `GESTOR`: leitura + gestao administrativa (usuarios, cadastros), sem operacao de entrada/saida e sem exclusoes criticas de admin.
- `ADMIN`: acesso total, incluindo `DELETE` criticos e ajuste de horario.

## 7) Frontend web (promocontrol)

Local:
- `src/main/resources/static/promocontrol/index.html`
- `src/main/resources/static/promocontrol/styles.css`
- `src/main/resources/static/promocontrol/app.js`

Telas e modulos principais:
- login + troca obrigatoria de senha temporaria;
- painel (planilha principal + cards do dia);
- operacao de entrada e saida;
- cadastro de fornecedores;
- cadastro de promotores;
- gestao de usuarios;
- configuracoes (gerais, logs, sobre) com gestao de empresa contratante.

Comportamentos relevantes:
- refresh por icone nas listas;
- filtros operacionais;
- modal e fluxo de localizacao;
- controle de visibilidade por perfil.

## 8) Configuracao de ambiente

Arquivos:
- `src/main/resources/application.properties`
- `src/main/resources/application-dev.properties`
- `src/main/resources/application-homolog.properties`
- `src/main/resources/application-prod.properties`

Pontos chave:
- perfil default atual: `homolog`;
- Flyway habilitado com `ddl-auto=validate`;
- health/info no actuator;
- correlacao de logs por cabecalho.

Variaveis importantes:
- banco: `APP_DB_URL`, `APP_DB_USERNAME`, `APP_DB_PASSWORD`
- seguranca: `APP_SECURITY_*`
- CORS: `APP_CORS_ALLOWED_ORIGINS`
- correlacao: `APP_CORRELATION_HEADER`
- job: `APP_MOVIMENTO_ENCERRAMENTO_AUTOMATICO_CRON`

## 9) Banco e migracoes

Pasta:
- `src/main/resources/db/migration`

Migracoes atuais:
- `V1__init_schema.sql`
- `V2__fornecedor_e_relacao_promotor.sql`
- `V3__add_liberado_por_movimento_saida.sql`
- `V4__add_codigo_numerico_fornecedor_promotor.sql`
- `V5__add_usuario_table.sql`
- `V6__cleanup_fornecedor_tecnico.sql`
- `V7__add_status_ativo_usuario.sql`
- `V8__add_codigo_usuario.sql`
- `V9__add_configuracao_empresa.sql`
- `V10__add_access_flags_usuario.sql`
- `V11__add_empresa_contratante_table.sql`

## 10) Job agendado

Arquivo:
- `src/main/java/br/com/infocedro/promocontrol/infra/job/EncerramentoAutomaticoMovimentoJob.java`

Funcao:
- roda por cron e encerra movimentos abertos do dia anterior conforme configuracao da empresa.

## 11) Observabilidade e erros

Observabilidade:
- `GET /actuator/health`
- `GET /actuator/info`
- correlacao por `X-Correlation-Id` (ou header configurado)

Erros:
- `ApiExceptionHandler` com payload padrao em `ApiErrorResponse`.

## 12) Testes e qualidade

Suite de testes cobre:
- controllers (`Promotor`, `Fornecedor`, `Movimento`, `Dashboard`, `ConfiguracaoEmpresa`)
- seguranca/autorizacao (`SecurityAuthorizationTest`, `ObservabilitySecurityTest`)
- concorrencia de movimento (`MovimentoPromotorConcorrenciaTest`)
- persistencia/auditoria (`AuditoriaPersistenceTest`)
- service de encerramento automatico

Comandos uteis:
```powershell
.\mvnw.cmd -q test
.\scripts\smoke_test.ps1 -BaseUrl "http://localhost:8080"
.\scripts\homolog_readiness_check.ps1 -BaseUrl "http://localhost:8080" -RunSmoke
```

## 13) Fluxos ponta a ponta (resumo)

Entrada:
1. auth valida usuario e perfil
2. controller recebe request
3. service valida status do promotor e regras de entrada
4. persistencia do movimento
5. retorno DTO

Saida:
1. valida entrada em aberto
2. valida `liberadoPor`
3. registra saida e auditoria
4. painel/operacao refletem novo estado no refresh

Senha temporaria:
1. admin/gestor reseta senha
2. usuario entra com senha temporaria
3. filtro bloqueia rotas ate `POST /auth/alterar-senha`
4. apos troca, sessao libera uso normal

## 14) Estado atual de maturidade

Ja consolidado:
- backend de dominio completo para operacao web atual;
- frontend `promocontrol` integrado aos principais fluxos;
- seguranca por perfil e trilha de auditoria;
- migracoes versionadas;
- testes automatizados e scripts de readiness/smoke.

Proxima etapa estrategica:
- planejamento e implementacao do mobile com base nos contratos ja estabilizados.
