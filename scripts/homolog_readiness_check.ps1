param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$ViewerName = "viewer",
    [string]$ViewerPassword = "viewer123",
    [string]$OperatorName = "user",
    [string]$OperatorPassword = "user123",
    [string]$AdminName = "admin",
    [string]$AdminPassword = "admin123",
    [switch]$RunSmoke
)

$ErrorActionPreference = "Stop"

function New-BasicAuthHeader {
    param(
        [string]$Username,
        [string]$Password
    )
    $token = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("${Username}:${Password}"))
    return @{ Authorization = "Basic $token" }
}

function Assert-StatusCode {
    param(
        [int]$Actual,
        [int]$Expected,
        [string]$Context
    )
    if ($Actual -ne $Expected) {
        throw "$Context falhou. Esperado=$Expected, Atual=$Actual"
    }
}

Write-Host "1) Health/info sem autenticacao..."
$healthResponse = Invoke-WebRequest -Method Get -Uri "$BaseUrl/actuator/health"
Assert-StatusCode -Actual $healthResponse.StatusCode -Expected 200 -Context "Health"

$infoResponse = Invoke-WebRequest -Method Get -Uri "$BaseUrl/actuator/info"
Assert-StatusCode -Actual $infoResponse.StatusCode -Expected 200 -Context "Info"

Write-Host "2) Correlation id deve voltar no response..."
$corrResponseHeaders = $null
try {
    $corrResponse = Invoke-WebRequest -Method Get -Uri "$BaseUrl/promotores" -Headers @{ "X-Correlation-Id" = "homolog-check-123" }
    $corrResponseHeaders = $corrResponse.Headers
} catch {
    $corrResponseHeaders = $_.Exception.Response.Headers
}
if ($corrResponseHeaders["X-Correlation-Id"] -ne "homolog-check-123") {
    throw "Correlation id nao foi propagado corretamente."
}

$viewerHeaders = New-BasicAuthHeader -Username $ViewerName -Password $ViewerPassword
$operatorHeaders = New-BasicAuthHeader -Username $OperatorName -Password $OperatorPassword
$adminHeaders = New-BasicAuthHeader -Username $AdminName -Password $AdminPassword

Write-Host "3) Permissoes de leitura (VIEWER)..."
$viewerGet = Invoke-WebRequest -Method Get -Uri "$BaseUrl/promotores" -Headers $viewerHeaders
Assert-StatusCode -Actual $viewerGet.StatusCode -Expected 200 -Context "Viewer GET /promotores"

Write-Host "4) Permissoes de operacao (VIEWER nao pode escrever)..."
$forbidden = $null
try {
    $viewerWriteHeaders = @{}
    $viewerHeaders.GetEnumerator() | ForEach-Object { $viewerWriteHeaders[$_.Key] = $_.Value }
    $viewerWriteHeaders["Content-Type"] = "application/json"
    Invoke-WebRequest -Method Post -Uri "$BaseUrl/fornecedores" -Headers $viewerWriteHeaders -Body '{"nome":"Teste Forbidden","ativo":true}' | Out-Null
    throw "Viewer conseguiu escrever e isso nao era esperado."
} catch {
    $forbidden = $_.Exception.Response.StatusCode.value__
}
Assert-StatusCode -Actual $forbidden -Expected 403 -Context "Viewer POST /fornecedores"

Write-Host "5) Operador e admin autenticam..."
$opGet = Invoke-WebRequest -Method Get -Uri "$BaseUrl/fornecedores" -Headers $operatorHeaders
Assert-StatusCode -Actual $opGet.StatusCode -Expected 200 -Context "Operator GET /fornecedores"
$adminGet = Invoke-WebRequest -Method Get -Uri "$BaseUrl/dashboard/planilha-principal" -Headers $adminHeaders
Assert-StatusCode -Actual $adminGet.StatusCode -Expected 200 -Context "Admin GET /dashboard/planilha-principal"

Write-Host "6) Endpoint de cumprimento por fornecedor..."
$cumprimento = Invoke-WebRequest -Method Get -Uri "$BaseUrl/dashboard/cumprimento-fornecedores" -Headers $operatorHeaders
Assert-StatusCode -Actual $cumprimento.StatusCode -Expected 200 -Context "GET /dashboard/cumprimento-fornecedores"

if ($RunSmoke) {
    Write-Host "7) Rodando smoke test completo..."
    .\scripts\smoke_test.ps1 -BaseUrl $BaseUrl -UserName $OperatorName -UserPassword $OperatorPassword -AdminName $AdminName -AdminPassword $AdminPassword
}

Write-Host "Checklist de prontidao de homologacao concluido com sucesso."
