# Changelog

## v0.4.0 - 2026-02-14

### Added
- Front temporario de validacao em `src/main/resources/static/front-temp` com `html+css+js`.
- Fluxos operacionais no front-temp para:
  - criar promotor;
  - registrar entrada/saida;
  - ajustar horario com admin;
  - listar e filtrar promotores/movimentos.

### Changed
- Security passou a liberar apenas `"/front-temp/**"` sem autenticacao para rascunho visual.
- README atualizado com referencia da versao `v0.4.0`.

## v0.3.6 - 2026-02-14

### Added
- Pipeline CI com GitHub Actions para executar testes em `push` e `pull_request`.
- Script de smoke test (`scripts/smoke_test.ps1`) para validar fluxos essenciais da API.

### Changed
- README com checklist "Pronto Para Front" e instrucoes de execucao do smoke test.

## v0.3.5 - 2026-02-14

### Added
- Observabilidade com Spring Boot Actuator (`/actuator/health` e `/actuator/info`).
- Filtro de correlacao de requisicoes com cabecalho `X-Correlation-Id`.
- Testes de seguranca/observabilidade para health e correlacao.

### Changed
- Security liberando endpoints operacionais de health/info sem autenticacao.
- Padrao de log com identificador de correlacao.

## v0.3.4 - 2026-02-14

### Added
- Perfis de ambiente separados (`dev`, `homolog`, `prod`) com arquivos dedicados.
- Configuracao de CORS por variavel de ambiente (`APP_CORS_ALLOWED_ORIGINS`).

### Changed
- Configuracao base centralizada em `application.properties` com `spring.profiles.default=dev`.
- README atualizado com execucao por perfil e variaveis de banco para homolog/prod.

## v0.3.3 - 2026-02-14

### Added
- Flyway integrado ao projeto para migracoes versionadas de schema.
- Migration inicial `V1__init_schema.sql` com estrutura base das tabelas de promotores e movimentos.

### Changed
- Hibernate alterado para `ddl-auto=validate` para garantir aderencia ao schema versionado.
- README atualizado com fluxo de migracoes em `src/main/resources/db/migration`.

## v0.3.2 - 2026-02-14

### Added
- Swagger UI e OpenAPI com esquema de seguranca Basic Auth.

### Changed
- Documentacao dos endpoints de promotores e movimentos com operacoes, respostas e erros.
- Liberacao de rotas de documentacao (`/v3/api-docs/**`, `/swagger-ui/**`) na configuracao de seguranca.

## v0.3.1 - 2026-02-14

### Added
- Auditoria transversal com Spring Data Auditing (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`).
- Lock otimista em `Promotor` com `@Version`.
- Teste de concorrencia para garantir que nao ocorre dupla entrada no endpoint `/movimentos/entrada`.

### Changed
- Controllers passaram a expor DTOs de resposta em vez de entidades JPA.
- Camada de aplicacao com transacoes explicitas (`@Transactional`).
- Excecoes de negocio padronizadas com hierarquia dedicada e mapeamento central no handler.
- Tratamento de conflito otimista com resposta `409 Conflict`.
