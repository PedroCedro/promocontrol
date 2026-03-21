# Execucao e Ambiente

## Requisitos

- Java 21
- Maven Wrapper (ja incluso no projeto)

## Perfis

- `dev`
- `homolog`
- `prod`

Perfil padrao atual:

```text
prod
```

## Subir a aplicacao

Linux/macOS:

```bash
./mvnw spring-boot:run
```

Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Com perfil especifico:

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=homolog
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=prod
```

## Endpoints locais uteis

- Aplicacao: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Front web: `http://localhost:8080/promocontrol/index.html`
- Health: `http://localhost:8080/actuator/health`
- Info: `http://localhost:8080/actuator/info`

## Variaveis de ambiente

Seguranca:

```text
APP_SECURITY_USER_USERNAME
APP_SECURITY_USER_PASSWORD
APP_SECURITY_VIEWER_USERNAME
APP_SECURITY_VIEWER_PASSWORD
APP_SECURITY_GESTOR_USERNAME
APP_SECURITY_GESTOR_PASSWORD
APP_SECURITY_ADMIN_USERNAME
APP_SECURITY_ADMIN_PASSWORD
```

CORS:

```text
APP_CORS_ALLOWED_ORIGINS
```

Correlacao:

```text
APP_CORRELATION_HEADER
```

Encerramento automatico:

```text
APP_MOVIMENTO_ENCERRAMENTO_AUTOMATICO_CRON
```

Banco `prod`:

```text
APP_DB_URL
APP_DB_USERNAME
APP_DB_PASSWORD
```

Banco `homolog`:

```text
APP_HOMOLOG_DB_URL
APP_HOMOLOG_DB_USERNAME
APP_HOMOLOG_DB_PASSWORD
APP_DB_FILE_PATH
```

Migracao da base cadastral H2 para PostgreSQL:

```text
docs/migracao-cadastro-h2-para-postgres.md
scripts/migrate_catalog_to_postgres.ps1
```

## Banco e migracoes

Migracoes Flyway:

```text
src/main/resources/db/migration
```

A aplicacao executa as migracoes automaticamente na inicializacao.

## Validacao local

Testes:

```powershell
.\mvnw.cmd -q test
```

Smoke test:

```powershell
.\scripts\smoke_test.ps1 -BaseUrl "http://localhost:8080"
```

Checklist de homolog:

```powershell
.\scripts\homolog_readiness_check.ps1 -BaseUrl "http://localhost:8080" -RunSmoke
```
