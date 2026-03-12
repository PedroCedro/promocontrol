param(
    [string]$SourceDir = "src/main/resources/static/promocontrol",
    [string]$TargetDir = "mobile/web"
)

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root $SourceDir
$targetPath = Join-Path $root $TargetDir

if (-not (Test-Path $sourcePath)) {
    throw "Origem não encontrada: $sourcePath"
}

New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
Get-ChildItem -Path $targetPath -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $sourcePath "*") -Destination $targetPath -Recurse -Force

Write-Output "Web assets sincronizados em: $targetPath"
