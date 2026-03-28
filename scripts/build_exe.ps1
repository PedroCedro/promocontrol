param(
    [string]$AppVersion,
    [switch]$SkipTests,
    [switch]$CleanDist
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$targetDir = Join-Path $projectRoot "target"
$inputDir = Join-Path $projectRoot "dist\jpackage-input"
$releaseDir = Join-Path $projectRoot "dist\release"
$mavenRepoDir = Join-Path $projectRoot "build\m2\repository"
$mainPropertiesPath = Join-Path $projectRoot "src\main\resources\application.properties"
$iconScriptPath = Join-Path $projectRoot "scripts\generate_windows_icon.py"
$iconPath = Join-Path $projectRoot "assets\release\promocontrol.ico"
$jarSource = Join-Path $targetDir "promocontrol-0.0.1-SNAPSHOT.jar"
$jarInput = Join-Path $inputDir "promocontrol.jar"

if ($CleanDist -and (Test-Path $releaseDir)) {
    Remove-Item -LiteralPath $releaseDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $inputDir | Out-Null
New-Item -ItemType Directory -Force -Path $mavenRepoDir | Out-Null

if (-not $AppVersion) {
    if (-not (Test-Path $mainPropertiesPath)) {
        throw "Arquivo de propriedades principal nao encontrado em $mainPropertiesPath"
    }

    $versionLine = Select-String -Path $mainPropertiesPath -Pattern '^info\.app\.version=' | Select-Object -First 1
    if (-not $versionLine) {
        throw "Propriedade info.app.version nao encontrada em $mainPropertiesPath"
    }

    $rawVersion = ($versionLine.Line -replace '^info\.app\.version=', '').Trim()
    $AppVersion = ($rawVersion -replace '^[^0-9]+', '')

    if (-not $AppVersion) {
        throw "Nao foi possivel converter a versao '$rawVersion' para um formato numerico aceito pelo jpackage."
    }
}

$mavenArgs = @("clean", "package", "-Dmaven.repo.local=$mavenRepoDir")
if ($SkipTests) {
    $mavenArgs += "-DskipTests"
}

Write-Host "Gerando jar Maven..."
& (Join-Path $projectRoot "mvnw.cmd") @mavenArgs
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao gerar o jar com Maven."
}

if (-not (Test-Path $jarSource)) {
    throw "Jar nao encontrado em $jarSource"
}

Copy-Item -LiteralPath $jarSource -Destination $jarInput -Force

Write-Host "Gerando icone Windows..."
& python $iconScriptPath
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $iconPath)) {
    throw "Falha ao gerar o icone Windows."
}

Write-Host "Empacotando app-image com jpackage..."
& jpackage `
    --type app-image `
    --name PromoControl `
    --app-version $AppVersion `
    --input $inputDir `
    --main-jar "promocontrol.jar" `
    --dest $releaseDir `
    --icon $iconPath `
    --java-options "-Dpromocontrol.launcher.enabled=true" `
    --java-options "-Dspring.profiles.active=prod" `
    --java-options "-Dfile.encoding=UTF-8" `
    --vendor "InfoCedro Software"

if ($LASTEXITCODE -ne 0) {
    throw "Falha ao gerar o executavel com jpackage."
}

$exePath = Join-Path $releaseDir "PromoControl\PromoControl.exe"
Write-Host ""
Write-Host "Executavel gerado em:"
Write-Host $exePath
