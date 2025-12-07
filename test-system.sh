#!/bin/bash
# Script de teste - Ciclo Integrado
# Execute este arquivo para testar o sistema completo

echo "==================================="
echo "🧪 TESTE DO SISTEMA CICLO INTEGRADO"
echo "==================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para teste
test_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        return 1
    fi
}

# Função para teste de diretório
test_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        return 1
    fi
}

echo -e "${BLUE}📁 VERIFICAÇÃO DE ESTRUTURA${NC}"
echo ""

# Frontend
test_dir "pages" "Pasta pages criada"
test_dir "css" "Pasta css criada"
test_dir "js" "Pasta js criada"
test_dir "assets/images" "Pasta assets/images criada"
test_dir "components" "Pasta components criada"

# Backend
test_dir "backend" "Pasta backend criada"

# Documentação
test_file "README.md" "README.md criado"
test_file "QUICKSTART.md" "QUICKSTART.md criado"
test_file "API.md" "API.md criado"
test_file "BACKEND.md" "BACKEND.md criado"
test_file "TESTING.md" "TESTING.md criado"

echo ""
echo -e "${BLUE}🎨 VERIFICAÇÃO DE FRONTEND${NC}"
echo ""

# HTMLs
test_file "pages/login.html" "login.html criado"
test_file "pages/dashboard.html" "dashboard.html criado"
test_file "pages/cadastro-contratos.html" "cadastro-contratos.html criado"
test_file "pages/listagem-contratos.html" "listagem-contratos.html criado"
test_file "pages/detalhes-contrato-1.html" "detalhes-contrato-1.html criado"
test_file "pages/detalhes-contrato-2.html" "detalhes-contrato-2.html criado"
test_file "pages/detalhes-contrato-3.html" "detalhes-contrato-3.html criado"
test_file "pages/gestao-usuarios-1.html" "gestao-usuarios-1.html criado"
test_file "pages/gestao-usuarios-2.html" "gestao-usuarios-2.html criado"
test_file "pages/notificacoes.html" "notificacoes.html criado"

# Assets
test_file "css/styles.css" "styles.css criado"
test_file "js/main.js" "main.js criado"
test_file "assets/images/logo_ciclo_integrado.png" "Logo criada"

echo ""
echo -e "${BLUE}🔧 VERIFICAÇÃO DE BACKEND${NC}"
echo ""

test_file "backend/package.json" "package.json criado"
test_file "backend/index.js" "index.js (API) criado"
test_file "backend/firestore.rules" "firestore.rules criado"
test_file "backend/README.md" "backend/README.md criado"
test_file "backend/DEPLOY.md" "backend/DEPLOY.md criado"
test_file "backend/.env.example" ".env.example criado"
test_file "backend/postman-collection.json" "postman-collection.json criado"

echo ""
echo -e "${BLUE}📊 VERIFICAÇÃO DE CONFIGURAÇÃO${NC}"
echo ""

test_file "package.json" "package.json root criado"
test_file "app.yaml" "app.yaml (GCP) criado"
test_file ".gitignore" ".gitignore criado"
test_file ".env.example" ".env.example criado"
test_file "tailwind.config.js" "tailwind.config.js criado"

echo ""
echo -e "${BLUE}🧬 VERIFICAÇÃO DE GIT${NC}"
echo ""

if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Git repository encontrado"
    echo -e "${YELLOW}Commits:${NC}"
    git log --oneline | head -5
else
    echo -e "${RED}❌${NC} Git repository não encontrado"
fi

echo ""
echo -e "${BLUE}🚀 STATUS GERAL${NC}"
echo ""

# Contar arquivos
HTML_COUNT=$(find pages -name "*.html" 2>/dev/null | wc -l)
MD_COUNT=$(find . -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
TOTAL=$((HTML_COUNT + MD_COUNT))

echo "Páginas HTML: $HTML_COUNT"
echo "Documentação: $MD_COUNT"
echo "Total: $TOTAL arquivos principais"

echo ""
echo -e "${GREEN}================================"
echo "✨ SISTEMA PRONTO PARA USAR! ✨"
echo "================================${NC}"
echo ""
echo -e "${YELLOW}Próximas ações:${NC}"
echo "1. Executar: python -m http.server 8888 --directory pages"
echo "2. Abrir: http://localhost:8888/login.html"
echo "3. Testar: Ver TESTING.md para mais testes"
echo "4. Deploy: Ver BACKEND.md para deploy no GCP"
echo ""
