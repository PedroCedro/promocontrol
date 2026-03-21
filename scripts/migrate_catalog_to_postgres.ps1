param(
    [string]$H2DatabasePath = ".\data\promocontrol-homolog",
    [string]$H2User = "sa",
    [string]$H2Password = "",
    [string]$PostgresJdbcUrl = $env:APP_DB_URL,
    [string]$PostgresUser = $env:APP_DB_USERNAME,
    [string]$PostgresPassword = $env:APP_DB_PASSWORD,
    [string]$Workspace = ".\build\catalog-migration",
    [switch]$SkipEmpresaContratante,
    [switch]$KeepWorkspace
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[catalog-migration] $Message"
}

function Get-RequiredCommand {
    param([string]$Name)
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        throw "Comando obrigatorio nao encontrado: $Name"
    }
    return $command.Source
}

function Get-H2JarPath {
    $basePath = Join-Path $env:USERPROFILE ".m2\repository\com\h2database\h2"
    $jar = Get-ChildItem -Path $basePath -Recurse -Filter "h2-*.jar" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $jar) {
        throw "Nao foi possivel localizar o driver H2 no Maven local: $basePath"
    }
    return $jar.FullName
}

function Convert-ToAbsolutePath {
    param([string]$PathValue)
    return (Resolve-Path -Path $PathValue).Path
}

function Get-H2JdbcUrl {
    param([string]$DatabasePath)
    if ($DatabasePath.StartsWith("jdbc:h2:")) {
        return $DatabasePath
    }

    $absolutePath = Convert-ToAbsolutePath $DatabasePath
    $normalizedPath = $absolutePath -replace "\\", "/"
    return "jdbc:h2:file:$normalizedPath;MODE=PostgreSQL;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1"
}

function Convert-PostgresJdbcUrl {
    param([string]$JdbcUrl)

    if ([string]::IsNullOrWhiteSpace($JdbcUrl)) {
        throw "APP_DB_URL nao informado. Defina a URL JDBC do PostgreSQL."
    }

    if (-not $JdbcUrl.StartsWith("jdbc:postgresql://")) {
        throw "URL JDBC invalida para PostgreSQL: $JdbcUrl"
    }

    $withoutJdbc = $JdbcUrl.Substring("jdbc:".Length)
    $uri = [System.Uri]$withoutJdbc
    $database = $uri.AbsolutePath.TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($database)) {
        throw "Nao foi possivel identificar o nome do banco em APP_DB_URL."
    }

    return @{
        Host = $uri.Host
        Port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
        Database = $database
    }
}

function Invoke-H2Sql {
    param(
        [string]$JarPath,
        [string]$JdbcUrl,
        [string]$User,
        [string]$Password,
        [string]$Sql
    )

    & java "-cp" $JarPath "org.h2.tools.Shell" "-url" $JdbcUrl "-user" $User "-password" $Password "-sql" $Sql
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao executar SQL no H2."
    }
}

function New-ExportStatement {
    param(
        [string]$OutputFile,
        [string]$SelectStatement
    )

    $normalizedFile = $OutputFile -replace "\\", "/"
    $escapedFile = $normalizedFile.Replace("'", "''")
    $escapedSelect = $SelectStatement.Replace("'", "''")
    return "CALL CSVWRITE('$escapedFile', '$escapedSelect', 'charset=UTF-8');"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$psqlPath = Get-RequiredCommand "psql"
$h2JarPath = Get-H2JarPath

if ([string]::IsNullOrWhiteSpace($PostgresUser)) {
    throw "APP_DB_USERNAME nao informado."
}

if ([string]::IsNullOrWhiteSpace($PostgresPassword)) {
    throw "APP_DB_PASSWORD nao informado."
}

$postgres = Convert-PostgresJdbcUrl $PostgresJdbcUrl
$h2JdbcUrl = Get-H2JdbcUrl $H2DatabasePath

$workspacePath = Join-Path $repoRoot $Workspace
if (Test-Path $workspacePath) {
    Remove-Item -Recurse -Force $workspacePath
}
New-Item -ItemType Directory -Path $workspacePath | Out-Null

$tables = @(
    @{
        Name = "fornecedor"
        File = Join-Path $workspacePath "fornecedor.csv"
        Select = "SELECT id, codigo, nome, ativo, created_at, updated_at, created_by, updated_by FROM fornecedor ORDER BY id"
        CopyColumns = "id, codigo, nome, ativo, created_at, updated_at, created_by, updated_by"
    },
    @{
        Name = "promotor"
        File = Join-Path $workspacePath "promotor.csv"
        Select = "SELECT id, codigo, version, nome, telefone, fornecedor_id, status, foto_path, created_at, updated_at, created_by, updated_by FROM promotor ORDER BY codigo NULLS LAST, nome, id"
        CopyColumns = "id, codigo, version, nome, telefone, fornecedor_id, status, foto_path, created_at, updated_at, created_by, updated_by"
    },
    @{
        Name = "usuario"
        File = Join-Path $workspacePath "usuario.csv"
        Select = "SELECT id, codigo, username, senha_hash, perfil, precisa_trocar_senha, ativo, acessa_web, acessa_mobile, fornecedor_id, created_at, updated_at, created_by, updated_by FROM usuario ORDER BY codigo NULLS LAST, username, id"
        CopyColumns = "id, codigo, username, senha_hash, perfil, precisa_trocar_senha, ativo, acessa_web, acessa_mobile, fornecedor_id, created_at, updated_at, created_by, updated_by"
    },
    @{
        Name = "configuracao_empresa"
        File = Join-Path $workspacePath "configuracao_empresa.csv"
        Select = "SELECT id, empresa_id, encerramento_automatico_habilitado, horario_encerramento_automatico, texto_observacao_encerramento_automatico, permitir_multiplas_entradas_no_dia, exigir_foto_na_entrada, created_at, updated_at, created_by, updated_by FROM configuracao_empresa ORDER BY id"
        CopyColumns = "id, empresa_id, encerramento_automatico_habilitado, horario_encerramento_automatico, texto_observacao_encerramento_automatico, permitir_multiplas_entradas_no_dia, exigir_foto_na_entrada, created_at, updated_at, created_by, updated_by"
    }
)

if (-not $SkipEmpresaContratante) {
    $tables += @{
        Name = "empresa_contratante"
        File = Join-Path $workspacePath "empresa_contratante.csv"
        Select = "SELECT id, codigo, nome, cnpj, email, telefone, uf, ativo, fornecedor_id, created_at, updated_at, created_by, updated_by FROM empresa_contratante ORDER BY id"
        CopyColumns = "id, codigo, nome, cnpj, email, telefone, uf, ativo, fornecedor_id, created_at, updated_at, created_by, updated_by"
    }
}

Write-Step "Exportando base cadastral do H2 em $h2JdbcUrl"
foreach ($table in $tables) {
    $sql = New-ExportStatement -OutputFile $table.File -SelectStatement $table.Select
    Invoke-H2Sql -JarPath $h2JarPath -JdbcUrl $h2JdbcUrl -User $H2User -Password $H2Password -Sql $sql | Out-Null
    Write-Step "Tabela exportada: $($table.Name)"
}

$importScriptPath = Join-Path $workspacePath "import_catalog.sql"
$copyCommands = foreach ($table in $tables) {
    $copyPath = ($table.File -replace "\\", "/").Replace("'", "''")
    "\copy $($table.Name) ($($table.CopyColumns)) FROM '$copyPath' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')"
}

$sequenceCommands = @(
    "SELECT setval(pg_get_serial_sequence('fornecedor', 'id'), COALESCE((SELECT MAX(id) FROM fornecedor), 1), true);",
    "SELECT setval(pg_get_serial_sequence('configuracao_empresa', 'id'), COALESCE((SELECT MAX(id) FROM configuracao_empresa), 1), true);"
)

if (-not $SkipEmpresaContratante) {
    $sequenceCommands += "SELECT setval(pg_get_serial_sequence('empresa_contratante', 'id'), COALESCE((SELECT MAX(id) FROM empresa_contratante), 1), true);"
}

$truncateTables = @("configuracao_empresa", "empresa_contratante", "usuario", "promotor", "fornecedor")
if ($SkipEmpresaContratante) {
    $truncateTables = @("configuracao_empresa", "usuario", "promotor", "fornecedor")
}

$importScript = @(
    "\set ON_ERROR_STOP on",
    "BEGIN;",
    "TRUNCATE TABLE $($truncateTables -join ', ') RESTART IDENTITY CASCADE;",
    $copyCommands,
    $sequenceCommands,
    "COMMIT;",
    "SELECT 'fornecedor' AS tabela, COUNT(*) AS total FROM fornecedor;",
    "SELECT 'promotor' AS tabela, COUNT(*) AS total FROM promotor;",
    "SELECT 'usuario' AS tabela, COUNT(*) AS total FROM usuario;",
    "SELECT 'configuracao_empresa' AS tabela, COUNT(*) AS total FROM configuracao_empresa;"
)

if (-not $SkipEmpresaContratante) {
    $importScript += "SELECT 'empresa_contratante' AS tabela, COUNT(*) AS total FROM empresa_contratante;"
}

Set-Content -Path $importScriptPath -Value ($importScript -join [Environment]::NewLine)

$env:PGPASSWORD = $PostgresPassword
try {
    Write-Step "Importando cadastro no PostgreSQL $($postgres.Host):$($postgres.Port)/$($postgres.Database)"
    & $psqlPath -h $postgres.Host -p $postgres.Port -U $PostgresUser -d $postgres.Database -f $importScriptPath
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao importar os dados no PostgreSQL."
    }

    Write-Step "Migracao concluida com sucesso."
    Write-Step "Arquivos gerados em: $workspacePath"
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    if (-not $KeepWorkspace -and (Test-Path $workspacePath)) {
        Remove-Item -Recurse -Force $workspacePath
    }
}
