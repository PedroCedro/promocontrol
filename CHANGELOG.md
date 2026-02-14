# Changelog

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
