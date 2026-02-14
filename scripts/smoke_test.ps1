param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$UserName = "user",
    [string]$UserPassword = "user123",
    [string]$AdminName = "admin",
    [string]$AdminPassword = "admin123"
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

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        [object]$Body = $null
    )

    $params = @{
        Method      = $Method
        Uri         = $Url
        Headers     = $Headers
        ContentType = "application/json"
    }

    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }

    return Invoke-RestMethod @params
}

Write-Host "1) Health check..."
$health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/actuator/health"
if ($health.status -ne "UP") {
    throw "Health check falhou: status=$($health.status)"
}

$userHeaders = New-BasicAuthHeader -Username $UserName -Password $UserPassword
$adminHeaders = New-BasicAuthHeader -Username $AdminName -Password $AdminPassword

Write-Host "2) Criando promotor..."
$novoPromotor = @{
    nome     = "Smoke Test Promotor"
    telefone = "11999999999"
    empresaId = 1001
    status   = "ATIVO"
    fotoPath = ""
}
$promotor = Invoke-Api -Method Post -Url "$BaseUrl/promotores" -Headers $userHeaders -Body $novoPromotor
if (-not $promotor.id) {
    throw "Falha ao criar promotor: id ausente."
}

Write-Host "3) Registrando entrada..."
$entradaBody = @{
    promotorId  = $promotor.id
    responsavel = "SmokeUser"
    observacao  = "Entrada de smoke test"
}
$entrada = Invoke-Api -Method Post -Url "$BaseUrl/movimentos/entrada" -Headers $userHeaders -Body $entradaBody
if ($entrada.tipo -ne "ENTRADA") {
    throw "Falha na entrada: tipo retornado '$($entrada.tipo)'."
}

Write-Host "4) Registrando saida..."
$saidaBody = @{
    promotorId  = $promotor.id
    responsavel = "SmokeUser"
    observacao  = "Saida de smoke test"
}
$saida = Invoke-Api -Method Post -Url "$BaseUrl/movimentos/saida" -Headers $userHeaders -Body $saidaBody
if ($saida.tipo -ne "SAIDA") {
    throw "Falha na saida: tipo retornado '$($saida.tipo)'."
}

Write-Host "5) Verificando ajuste de horario com admin..."
$ajusteBody = @{
    novaDataHora = (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss")
    motivo       = "Smoke test de ajuste"
}
$ajuste = Invoke-Api -Method Patch -Url "$BaseUrl/movimentos/$($entrada.id)/ajuste-horario" -Headers $adminHeaders -Body $ajusteBody
if (-not $ajuste.ajustadoPor) {
    throw "Falha no ajuste de horario: campo ajustadoPor ausente."
}

Write-Host "6) Listando movimentos..."
$movimentos = Invoke-Api -Method Get -Url "$BaseUrl/movimentos" -Headers $userHeaders
if ($movimentos.Count -lt 2) {
    throw "Quantidade inesperada de movimentos: $($movimentos.Count)."
}

Write-Host "Smoke test concluido com sucesso."
