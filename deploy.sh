#!/bin/bash
# Script de Deploy - Ciclo Integrado
# Este script faz o deploy da aplicação para o Google Cloud Platform

set -e

echo "🚀 Iniciando deploy da aplicação Ciclo Integrado..."

# Cores para saída
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se GCloud CLI está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK não encontrado. Instale em: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar se está autenticado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Não autenticado no GCloud. Execute: gcloud auth login"
    exit 1
fi

# Definir projeto
PROJECT_ID="ciclo-integrado"
echo -e "${BLUE}📦 Configurando projeto: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Instalar dependências (opcional)
# npm install

# Build (se necessário)
# npm run build

# Deploy
echo -e "${BLUE}🌐 Fazendo deploy para App Engine...${NC}"
gcloud app deploy app.yaml --quiet

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}📍 Aplicação disponível em: https://$PROJECT_ID.appspot.com${NC}"
