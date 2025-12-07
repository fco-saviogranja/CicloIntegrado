#!/usr/bin/env pwsh
<#
.SYNOPSIS
Script automático para fazer deploy do backend no Google Cloud Functions
.DESCRIPTION
Prepara e faz deploy do backend com um comando
.EXAMPLE
.\deploy-backend.ps1
#>

Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  DEPLOY AUTOMÁTICO - Backend para Google Cloud        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n"

# Cores
$success = "Green"
$warning = "Yellow"
$error = "Red"
$info = "Cyan"

# 1. Verificar pré-requisitos
Write-Host "1️⃣  Verificando Pré-requisitos..." -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# Verificar Google Cloud SDK
$gcloud = gcloud --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Google Cloud SDK instalado" -ForegroundColor $success
} else {
    Write-Host "   ❌ Google Cloud SDK NÃO instalado" -ForegroundColor $error
    Write-Host "      Download: https://cloud.google.com/sdk/docs/install-gcloud-sdk`n" -ForegroundColor $warning
    exit 1
}

# Verificar autenticação
$auth = gcloud auth list 2>&1
if ($auth -match "ACTIVE") {
    Write-Host "   ✅ Autenticado no Google Cloud" -ForegroundColor $success
} else {
    Write-Host "   ❌ Não está autenticado" -ForegroundColor $error
    Write-Host "      Execute: gcloud auth login`n" -ForegroundColor $warning
    exit 1
}

# Verificar projeto
$project = gcloud config get-value project 2>&1
Write-Host "   ✅ Projeto: $project" -ForegroundColor $success

# Verificar Node.js
$node = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Node.js instalado: $node" -ForegroundColor $success
} else {
    Write-Host "   ❌ Node.js NÃO instalado" -ForegroundColor $error
    exit 1
}

Write-Host "`n"

# 2. Preparar código
Write-Host "2️⃣  Preparando Código..." -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# Ir para pasta backend
$backendPath = ".\backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "   ❌ Pasta backend/ não encontrada" -ForegroundColor $error
    exit 1
}

Write-Host "   ✅ Pasta backend/ encontrada" -ForegroundColor $success

# Verificar package.json
if (Test-Path "$backendPath\package.json") {
    Write-Host "   ✅ package.json encontrado" -ForegroundColor $success
} else {
    Write-Host "   ❌ package.json não encontrado" -ForegroundColor $error
    exit 1
}

# Verificar index.js
if (Test-Path "$backendPath\index.js") {
    Write-Host "   ✅ index.js encontrado" -ForegroundColor $success
} else {
    Write-Host "   ❌ index.js não encontrado" -ForegroundColor $error
    exit 1
}

Write-Host "`n"

# 3. Fazer Deploy
Write-Host "3️⃣  Iniciando Deploy..." -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

Write-Host "   Isso pode levar 2-3 minutos..." -ForegroundColor $warning
Write-Host "   Por favor, aguarde...`n" -ForegroundColor $warning

cd $backendPath

# Deploy
gcloud functions deploy cicloIntegradoAPI `
  --runtime nodejs20 `
  --trigger-http `
  --allow-unauthenticated `
  --memory 256MB `
  --timeout 60 `
  --source .

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n   ✅ Deploy realizado com sucesso!" -ForegroundColor $success
} else {
    Write-Host "`n   ❌ Erro durante o deploy" -ForegroundColor $error
    exit 1
}

cd ..

Write-Host "`n"

# 4. Obter URL da função
Write-Host "4️⃣  Obtendo URL da Função..." -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

$functionDetails = gcloud functions describe cicloIntegradoAPI --format=json | ConvertFrom-Json
$functionUrl = $functionDetails.httpsTrigger.url

Write-Host "   🌐 URL do Backend:" -ForegroundColor $info
Write-Host "   $functionUrl`n" -ForegroundColor $warning

# 5. Testar função
Write-Host "5️⃣  Testando Função..." -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

Write-Host "   Testando endpoint /health..." -ForegroundColor $info

try {
    $response = Invoke-WebRequest -Uri "$functionUrl/health" -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Teste bem-sucedido!" -ForegroundColor $success
    Write-Host "   Response: $($json.status)`n" -ForegroundColor $success
} catch {
    Write-Host "   ⚠️  Não consegui testar agora (pode estar iniciando)" -ForegroundColor $warning
    Write-Host "   Tente em alguns segundos: $functionUrl/health`n" -ForegroundColor $warning
}

# 6. Instruções finais
Write-Host "`n"
Write-Host "6️⃣  Próximos Passos..." -ForegroundColor $info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

Write-Host "   1. Copie a URL acima e salve em um lugar seguro" -ForegroundColor $info
Write-Host "`n   2. Atualize seu frontend com a nova URL:" -ForegroundColor $info
Write-Host "      Arquivo: js/main.js" -ForegroundColor $info
Write-Host "      Mude: const API_BASE_URL = 'http://localhost:8080'" -ForegroundColor $info
Write-Host "      Para: const API_BASE_URL = '$functionUrl'" -ForegroundColor $warning
Write-Host "`n   3. Teste com Postman:" -ForegroundColor $info
Write-Host "      Importe: backend/postman-admin-master.json" -ForegroundColor $info
Write-Host "      Mude base_url para: $functionUrl" -ForegroundColor $warning
Write-Host "`n   4. Veja logs em tempo real:" -ForegroundColor $info
Write-Host "      gcloud functions logs read cicloIntegradoAPI --follow" -ForegroundColor $warning

Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor $success
Write-Host "║  ✅ DEPLOY CONCLUÍDO COM SUCESSO!                     ║" -ForegroundColor $success
Write-Host "║                                                        ║" -ForegroundColor $success
Write-Host "║  Seu backend está online e funcionando!               ║" -ForegroundColor $success
Write-Host "║  Não depende mais do seu computador local! 🚀          ║" -ForegroundColor $success
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor $success

Write-Host "`n"

# Salvar URL em arquivo
$configFile = ".\BACKEND-URL.txt"
@"
# Backend URL - Ciclo Integrado

URL: $functionUrl

Atualizar em: js/main.js
Linha: const API_BASE_URL = '...'

Data de Deploy: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
"@ | Set-Content $configFile

Write-Host "   💾 URL salva em: BACKEND-URL.txt" -ForegroundColor $success
Write-Host "`n"
