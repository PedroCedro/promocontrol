# Migracao de Cadastro H2 para PostgreSQL

Este roteiro migra apenas a base cadastral atual do H2 para o banco `prod` em PostgreSQL.

Escopo migrado:

- `FORNECEDOR`
- `PROMOTOR`
- `USUARIO`
- `CONFIGURACAO_EMPRESA`
- `EMPRESA_CONTRATANTE`

Fica fora do escopo:

- `MOVIMENTO_PROMOTOR`
- historico operacional antigo

## Pre-requisitos

- PostgreSQL criado e acessivel
- schema do `prod` criado pelo Flyway
- `psql` disponivel no terminal
- H2 atual acessivel em `data/promocontrol-homolog`

## Ordem recomendada

1. Fazer backup do H2 atual:

```powershell
Copy-Item .\data\promocontrol-homolog.mv.db .\data\promocontrol-homolog.mv.db.bak
```

2. Criar o banco PostgreSQL e definir as variaveis de ambiente do `prod`:

```powershell
$env:APP_DB_URL="jdbc:postgresql://HOST:5432/promocontrol"
$env:APP_DB_USERNAME="admin"
$env:APP_DB_PASSWORD="admin@admin123"
```

3. Subir a aplicacao uma vez em `prod` para o Flyway criar a estrutura:

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=prod
```

4. Parar a aplicacao.

5. Executar a migracao cadastral:

```powershell
.\scripts\migrate_catalog_to_postgres.ps1
```

## Observacoes

- A importacao faz `TRUNCATE ... RESTART IDENTITY` apenas nas tabelas cadastrais do escopo.
- A rotina preserva os `IDs` atuais para manter relacionamentos entre fornecedor, promotor, usuario e configuracao.
- O script gera CSVs temporarios em `build/catalog-migration` e limpa essa pasta ao final por padrao.
- Se quiser manter os arquivos gerados para auditoria, use:

```powershell
.\scripts\migrate_catalog_to_postgres.ps1 -KeepWorkspace
```

- Se quiser ignorar `EMPRESA_CONTRATANTE`, use:

```powershell
.\scripts\migrate_catalog_to_postgres.ps1 -SkipEmpresaContratante
```
