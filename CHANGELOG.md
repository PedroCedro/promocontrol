# Changelog

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
