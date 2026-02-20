# Changelog

## v0.5.6.0 - 2026-02-20

### Added
- Migration `V5__add_usuario_table.sql` com tabela de usuarios persistidos no banco.
- Entidade `Usuario` e `UsuarioRepository` para gestao de autenticacao com persistencia.

### Changed
- `AuthUserService` migrado de armazenamento em memoria para banco de dados.
- Usuarios padrao (`viewer`, `user`, `admin`) passam a ser inicializados automaticamente no banco quando ausentes.
- Operacoes de criar usuario, reset de senha e troca obrigatoria agora persistem entre reinicios da aplicacao.

## v0.5.5.0 - 2026-02-20

### Added
- Migration `V4__add_codigo_numerico_fornecedor_promotor.sql` com codigo numerico sequencial para `FORNECEDOR` e `PROMOTOR`.
- Exposicao de `codigo` nos contratos de resposta de fornecedor/promotor.

### Changed
- Geracao automatica de codigo sequencial no cadastro de fornecedor/promotor.
- Front-temp atualizado para exibir codigo numerico (`001`, `002`, ...) no lugar de identificadores tecnicos nas telas operacionais.
- Ajustes de UX no perfil: acao discreta de remover foto com confirmacao e visibilidade de `Meu Perfil` restrita a `ADMIN`.

## v0.5.4.1 - 2026-02-20

### Changed
- Ajuste de nomenclatura de perfil na sidebar do front-temp (somente exibicao):
  - `VIEWER` -> `Padrão`
  - `OPERATOR` -> `Prevenção`
  - `ADMIN` mantido como `ADMIN`

## v0.5.4.0 - 2026-02-20

### Added
- Aba `Operação` no front-temp para registro direto de `Entrada` e `Saida`.
- Tabela `Acompanhamento do Dia` na aba Operação com dados de usuario/liberacao e detalhe expansivel (`+`).
- Detalhe expansivel no `Painel` com observacoes de entrada/saida por linha.

### Changed
- Navegacao lateral refinada com botao `Sair` no rodape.
- Ajustes de UX na sidebar e cards de perfil/menu.
- Painel com novas colunas (`Usuário Entrada`, `Usuário Saída`, `Liberação`) e ordenacao cronologica de leitura.
- Grade visivel (linhas e colunas) nas tabelas de Painel e Operação.
- Formulario de Operação reorganizado para fluxo primeiro por promotor ativo e fornecedor somente leitura.
- Campos de cadastro (Fornecedor/Promotor) ajustados para uso de placeholder em vez de valores fixos.
- Front-temp passou a ocultar o fornecedor tecnico `Fornecedor nao informado` nas listas/combos.

## v0.5.3.0 - 2026-02-19

### Added
- Gestao administrativa de usuarios:
  - `GET /auth/admin/usuarios`
  - `POST /auth/admin/usuarios`
- Front-temp com aba de `Usuarios` para cadastro/listagem por `ADMIN`.
- Perfil lateral (`Meu Perfil`) com avatar local, dados basicos e navegação para tela de edicao.
- Auto-refresh do front ao detectar novos movimentos no backend (polling silencioso).

### Changed
- Correcao de ciclo de beans de seguranca com extracao do `PasswordEncoder` para `CryptoConfig`.
- Dashboard do front refinado para visual de planilha (foco em linhas/colunas essenciais e secoes recolgiveis).
- Navegacao lateral reorganizada para reduzir ruido visual e melhorar ergonomia operacional.

## v0.5.2.0 - 2026-02-19

### Added
- Endpoints de autenticacao de sessao e senha:
  - `GET /auth/sessao`
  - `POST /auth/alterar-senha`
  - `POST /auth/admin/resetar-senha` (somente `ADMIN`)
- Fluxo de reset de senha por admin com retorno de senha temporaria exibida somente na resposta do reset.
- Front-temp com tela de login dedicada, troca obrigatoria de senha temporaria e card admin para reset de senha de usuario.

### Changed
- Seguranca migrada para servico interno de usuarios com suporte a senha temporaria e flag de troca obrigatoria.
- Inclusao de filtro de seguranca para bloquear uso da API enquanto o usuario estiver com senha temporaria ativa, permitindo apenas sessao e alteracao de senha.

## v0.5.1.0 - 2026-02-18

### Added
- Endpoint de cumprimento por fornecedor: `GET /dashboard/cumprimento-fornecedores`.
- Indicadores minimos de cumprimento (previstas x realizadas) com alerta de desvio por percentual minimo.
- Teste de controller para o contrato de cumprimento do dashboard.
- Teste de autorizacao para validar separacao de permissoes de leitura vs operacao.
- Script de checklist de prontidao em homolog: `scripts/homolog_readiness_check.ps1`.

### Changed
- Seguranca revisada para perfis `VIEWER`, `OPERATOR` e `ADMIN`.
- Perfis `homolog` e `prod` passaram a exigir credenciais de `viewer` e CORS por variavel de ambiente.
- Front-temp atualizado com tabela de cumprimento por fornecedor.
- Versao exposta em `actuator/info` alinhada para `v0.5.1.0`.

## v0.5.0.0 - 2026-02-18

### Added
- Dominio de `Fornecedor` com entidade, repositorio, service e CRUD HTTP (`/fornecedores`).
- Migration `V2__fornecedor_e_relacao_promotor.sql` para normalizar `Promotor` com `fornecedor_id`.
- Endpoint agregador de dashboard estilo planilha: `GET /dashboard/planilha-principal` com:
  - cards do dia (`emLojaAgora`, `entradasHoje`, `saidasHoje`, `ajustesHoje`);
  - linhas da planilha principal com promotor/fornecedor/entrada/saida/liberacao.
- Campo `liberadoPor` no movimento de saida com migration `V3__add_liberado_por_movimento_saida.sql`.
- Testes de controller para `Fornecedor` e `Dashboard`.

### Changed
- Contrato de `Promotor` migrado de `empresaId` para `fornecedorId`.
- Regras de saida exigindo `liberadoPor`.
- Front temporario atualizado para fluxo de fornecedor e visualizacao da planilha principal.
- Smoke test atualizado para o novo contrato.
- Versao exposta em `actuator/info` alinhada para `v0.5.0.0`.

## v0.4.1 - 2026-02-17

### Added
- Testes de controller para `Promotor` cobrindo:
  - criacao com sucesso;
  - validacao de payload invalido;
  - listagem autenticada;
  - bloqueio sem autenticacao (`401`).
- Novos cenarios em `MovimentoPromotorControllerTest` para:
  - sucesso de ajuste de horario por `ADMIN` com validacao da trilha de auditoria;
  - contrato de resposta da listagem `GET /movimentos`.

### Changed
- Versao exposta em `actuator/info` alinhada para `v0.4.1`.
- README atualizado com referencia da versao `v0.4.1` e foco da entrega em cobertura de testes.

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
