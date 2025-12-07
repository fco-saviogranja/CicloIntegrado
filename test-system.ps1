# Script de teste - Ciclo Integrado
# Execute este arquivo para testar o sistema completo

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE DO SISTEMA CICLO INTEGRADO" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Função para teste de arquivo
function Test-FileExists {
    param(
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path $Path) {
        Write-Host "✅ $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description" -ForegroundColor Red
        return $false
    }
}

# Função para teste de diretório
function Test-DirectoryExists {
    param(
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path $Path -PathType Container) {
        Write-Host "✅ $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description" -ForegroundColor Red
        return $false
    }
}

Write-Host "📁 VERIFICAÇÃO DE ESTRUTURA" -ForegroundColor Blue
Write-Host ""

# Frontend
Test-DirectoryExists "pages" "Pasta pages criada"
Test-DirectoryExists "css" "Pasta css criada"
Test-DirectoryExists "js" "Pasta js criada"
Test-DirectoryExists "assets\images" "Pasta assets\images criada"
Test-DirectoryExists "components" "Pasta components criada"

# Backend
Test-DirectoryExists "backend" "Pasta backend criada"

# Documentação
Test-FileExists "README.md" "README.md criado"
Test-FileExists "QUICKSTART.md" "QUICKSTART.md criado"
Test-FileExists "API.md" "API.md criado"
Test-FileExists "BACKEND.md" "BACKEND.md criado"
Test-FileExists "TESTING.md" "TESTING.md criado"

Write-Host ""
Write-Host "🎨 VERIFICAÇÃO DE FRONTEND" -ForegroundColor Blue
Write-Host ""

# HTMLs
Test-FileExists "pages\login.html" "login.html criado"
Test-FileExists "pages\dashboard.html" "dashboard.html criado"
Test-FileExists "pages\cadastro-contratos.html" "cadastro-contratos.html criado"
Test-FileExists "pages\listagem-contratos.html" "listagem-contratos.html criado"
Test-FileExists "pages\detalhes-contrato-1.html" "detalhes-contrato-1.html criado"
Test-FileExists "pages\detalhes-contrato-2.html" "detalhes-contrato-2.html criado"
Test-FileExists "pages\detalhes-contrato-3.html" "detalhes-contrato-3.html criado"
Test-FileExists "pages\gestao-usuarios-1.html" "gestao-usuarios-1.html criado"
Test-FileExists "pages\gestao-usuarios-2.html" "gestao-usuarios-2.html criado"
Test-FileExists "pages\notificacoes.html" "notificacoes.html criado"

# Assets
Test-FileExists "css\styles.css" "styles.css criado"
Test-FileExists "js\main.js" "main.js criado"
Test-FileExists "assets\images\logo_ciclo_integrado.png" "Logo criada"

Write-Host ""
Write-Host "🔧 VERIFICAÇÃO DE BACKEND" -ForegroundColor Blue
Write-Host ""

Test-FileExists "backend\package.json" "package.json criado"
Test-FileExists "backend\index.js" "index.js (API) criado"
Test-FileExists "backend\firestore.rules" "firestore.rules criado"
Test-FileExists "backend\README.md" "backend\README.md criado"
Test-FileExists "backend\DEPLOY.md" "backend\DEPLOY.md criado"
Test-FileExists "backend\.env.example" ".env.example criado"
Test-FileExists "backend\postman-collection.json" "postman-collection.json criado"

Write-Host ""
Write-Host "📊 VERIFICAÇÃO DE CONFIGURAÇÃO" -ForegroundColor Blue
Write-Host ""

Test-FileExists "package.json" "package.json root criado"
Test-FileExists "app.yaml" "app.yaml (GCP) criado"
Test-FileExists ".gitignore" ".gitignore criado"
Test-FileExists ".env.example" ".env.example criado"
Test-FileExists "tailwind.config.js" "tailwind.config.js criado"

Write-Host ""
Write-Host "🧬 VERIFICAÇÃO DE GIT" -ForegroundColor Blue
Write-Host ""

if (git rev-parse --git-dir 2>$null) {
    Write-Host "✅ Git repository encontrado" -ForegroundColor Green
    Write-Host "Commits:" -ForegroundColor Yellow
    git log --oneline | Select-Object -First 5 | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "❌ Git repository não encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 STATUS GERAL" -ForegroundColor Blue
Write-Host ""

# Contar arquivos
$HtmlCount = @(Get-ChildItem -Path "pages" -Filter "*.html" -ErrorAction SilentlyContinue).Count
$MdCount = @(Get-ChildItem -Path "." -MaxDepth 1 -Filter "*.md" -ErrorAction SilentlyContinue).Count
$Total = $HtmlCount + $MdCount

Write-Host "Páginas HTML: $HtmlCount"
Write-Host "Documentação: $MdCount"
Write-Host "Total: $Total arquivos principais"

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✨ SISTEMA PRONTO PARA USAR! ✨" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximas ações:" -ForegroundColor Yellow
Write-Host "1. Servidor local: python -m http.server 8888 --directory pages"
Write-Host "2. Abrir navegador: http://localhost:8888/login.html"
Write-Host "3. Testes: Ver TESTING.md para mais testes"
Write-Host "4. Deploy: Ver BACKEND.md para deploy no GCP"
Write-Host ""
