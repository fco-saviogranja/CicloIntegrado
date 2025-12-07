# 🚀 GUIA DEPLOY - Backend Online no Google Cloud

## Visão Geral

Você tem tudo pronto para fazer deploy no Google Cloud Functions. Este guia mostra passo-a-passo como colocar seu backend online.

---

## 📋 Pré-requisitos

### 1. Conta Google Cloud
- ✅ Projeto criado (ciclo-integrado)
- ✅ Billing ativado
- ✅ Firebase Firestore configurado

### 2. Ferramentas Instaladas
```bash
# Instalar Google Cloud SDK
# Windows: https://cloud.google.com/sdk/docs/install-gcloud-sdk

# Verificar instalação
gcloud --version
gcloud auth list

# Instalar Firebase CLI
npm install -g firebase-tools

# Verificar instalação
firebase --version
```

### 3. Autenticação
```bash
# Login na sua conta Google
gcloud auth login

# Selecionar projeto
gcloud config set project ciclo-integrado

# Verificar configuração
gcloud config list
```

---

## 🔧 Preparar Backend para Deploy

### 1. Verificar Estrutura do Projeto

```
backend/
├── index.js          (seu código Express)
├── package.json      (dependências)
└── .env.example      (variáveis de ambiente)
```

### 2. Criar `backend/.gcloudignore`

```
node_modules/
.git/
.gitignore
README.md
*.local
.env.local
```

### 3. Atualizar `backend/package.json`

```json
{
  "name": "ciclo-integrado-api",
  "version": "1.0.0",
  "description": "Backend API - Ciclo Integrado",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "deploy": "gcloud functions deploy cicloIntegradoAPI --runtime nodejs20 --trigger-http --allow-unauthenticated"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "firebase-admin": "^12.0.0",
    "jsonwebtoken": "^9.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": "20"
  }
}
```

### 4. Atualizar `backend/index.js` para Cloud Functions

No topo do arquivo, adicione:

```javascript
/**
 * Ciclo Integrado - Backend API
 * Google Cloud Functions - Node.js 20
 */

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// Inicializar Express
const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://seu-dominio.com',  // Adicione seu domínio aqui
    'https://ciclo-integrado.web.app',  // Firebase Hosting
    'https://ciclo-integrado.firebaseapp.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCP_PROJECT_ID || 'ciclo-integrado',
  });
}

const db = admin.firestore();
const auth = admin.auth();

// ... resto do seu código ...

// Exportar para Cloud Functions
exports.cicloIntegradoAPI = functions.https.onRequest(app);

// Para desenvolvimento local, também exportar app
module.exports = app;
```

### 5. Criar `backend/.env.prod` (Produção)

```
# Google Cloud
GCP_PROJECT_ID=ciclo-integrado
NODE_ENV=production

# JWT
JWT_SECRET=sua-chave-secreta-muito-segura-aqui-123456789

# URLs
FRONTEND_URL=https://seu-dominio.com
API_BASE_URL=https://seu-regiao-cicloIntegradoAPI-xxxxx.cloudfunctions.net
```

---

## 🚀 Opção 1: Deploy via Google Cloud Functions (Recomendado)

### Passo 1: Criar Função na Console Cloud

```bash
# Ou use a Console: https://console.cloud.google.com/functions
gcloud functions create cicloIntegradoAPI \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --source ./backend \
  --entry-point cicloIntegradoAPI \
  --memory 256MB \
  --timeout 60
```

### Passo 2: Configurar Variáveis de Ambiente

```bash
gcloud functions deploy cicloIntegradoAPI \
  --set-env-vars GCP_PROJECT_ID=ciclo-integrado,JWT_SECRET=sua-chave-secreta
```

### Passo 3: Obter URL da Função

```bash
gcloud functions describe cicloIntegradoAPI --gen2
```

**Você receberá uma URL como:**
```
https://regiao-projeto.cloudfunctions.net/cicloIntegradoAPI
```

### Passo 4: Testar Função

```bash
# Health check
curl https://regiao-projeto.cloudfunctions.net/cicloIntegradoAPI/health

# Fazer login
curl -X POST https://regiao-projeto.cloudfunctions.net/cicloIntegradoAPI/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@ciclo-integrado.com","password":"senha"}'
```

---

## 🚀 Opção 2: Deploy via Firebase Hosting + Cloud Functions

### Passo 1: Inicializar Firebase

```bash
firebase init hosting
firebase init functions

# Selecionar:
# - Hosting: Sim
# - Functions: Sim
# - Language: JavaScript
```

### Passo 2: Estrutura Resultante

```
.
├── functions/
│   ├── index.js
│   └── package.json
├── public/
│   └── (arquivos frontend)
└── firebase.json
```

### Passo 3: Mover Backend

```bash
# Copiar seu backend para functions/index.js
cp backend/index.js functions/index.js

# Atualizar dependencies
cd functions
npm install express cors firebase-admin jsonwebtoken
```

### Passo 4: Configurar `firebase.json`

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "cicloIntegradoAPI"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

### Passo 5: Deploy

```bash
firebase deploy
```

---

## 🔄 Atualizar Frontend para Usar Backend Online

### Arquivo: `js/main.js` (ou novo arquivo `js/api.js`)

```javascript
// Configurar URL do Backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://seu-regiao-cicloIntegradoAPI-xxxxx.cloudfunctions.net'
  : 'http://localhost:8080';

// Função para fazer requisições
async function apiRequest(method, endpoint, data = null) {
  const token = localStorage.getItem('token');
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (data && ['POST', 'PUT'].includes(method)) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na API:', error);
    throw error;
  }
}

// Exemplo: Login
async function login(email, password) {
  try {
    const response = await apiRequest('POST', '/auth/login', {
      email,
      password
    });
    
    // Salvar token
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

// Exemplo: Listar usuários
async function getUsers(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiRequest('GET', `/admin/users?${params}`);
}

// Exemplo: Criar município
async function createMunicipio(municipioData) {
  return apiRequest('POST', '/admin/municipalities', municipioData);
}

// Exportar
window.API = {
  login,
  getUsers,
  createMunicipio,
  apiRequest
};
```

### Atualizar `pages/admin-dashboard.html`

```html
<!-- Adicionar no <head> -->
<script src="../js/api.js"></script>

<!-- Atualizar funções para usar API -->
<script>
  // Carregar dados de verdade da API
  async function loadDashboard() {
    try {
      // Obter dados do dashboard
      const response = await API.apiRequest('GET', '/admin/dashboard');
      
      // Atualizar métricas
      document.getElementById('total-municipios').textContent = 
        response.dashboard.summary.total_municipalities;
      
      // ... mais atualizações
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      alert('Erro ao carregar dados. Verifique sua conexão.');
    }
  }

  // Chamar ao carregar página
  document.addEventListener('DOMContentLoaded', loadDashboard);
</script>
```

---

## 🔐 Segurança para Produção

### 1. Variáveis de Ambiente Sensíveis

```bash
# Nunca commit .env.prod com segredos reais!
# Usar Google Secret Manager

gcloud secrets create jwt-secret --data-file=- <<< "sua-chave-super-secreta"

# Referenciar em Cloud Functions
gcloud functions deploy cicloIntegradoAPI \
  --set-env-vars JWT_SECRET=projects/ciclo-integrado/secrets/jwt-secret/versions/latest
```

### 2. Adicionar Autenticação no Firestore

```javascript
// Em backend/index.js - validar token antes de acessar dados
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Usar em endpoints sensíveis
app.get('/admin/users', authenticateToken, isAdminMaster, async (req, res) => {
  // ... seu código
});
```

### 3. Habilitar HTTPS Obrigatório

```bash
# Google Cloud Functions automaticamente usa HTTPS
# Redirecionar HTTP para HTTPS no código

app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(307, 'https://' + req.header('host') + req.url);
  }
  next();
});
```

---

## 📊 Monitoramento e Logs

### Ver Logs da Função

```bash
# Logs em tempo real
gcloud functions logs read cicloIntegradoAPI --limit 50 --follow

# Ou na Console: https://console.cloud.google.com/functions
```

### Configurar Alertas

Na Console Cloud:
1. Ir para Cloud Functions
2. Selecionar cicloIntegradoAPI
3. Aba "Logs"
4. Configurar alertas para erros

---

## 🔄 Atualizar e Redeploy

### Deploy de Atualizações

```bash
# Opção 1: Via gcloud
gcloud functions deploy cicloIntegradoAPI \
  --source ./backend \
  --runtime nodejs20

# Opção 2: Via Firebase
firebase deploy --only functions

# Verificar status
gcloud functions describe cicloIntegradoAPI
```

### Versioning

```bash
# Cloud Functions mantém histórico de versões
# Para rollback:
gcloud functions deploy cicloIntegradoAPI \
  --source ./backend@v1  # Especificar versão anterior
```

---

## 💡 Resumo de URLs Finais

### Antes (Local)
```
Frontend:  http://localhost:8080
Backend:   http://localhost:8080 (mesmo servidor)
```

### Depois (Produção)
```
Frontend:  https://seu-dominio.com (ou Firebase Hosting)
Backend:   https://regiao-cicloIntegradoAPI-xxxxx.cloudfunctions.net
```

### Configuração no Frontend

```javascript
// Arquivo: js/config.js (criar novo)

const CONFIG = {
  production: {
    API_URL: 'https://regiao-cicloIntegradoAPI-xxxxx.cloudfunctions.net'
  },
  development: {
    API_URL: 'http://localhost:8080'
  }
};

const API_URL = window.location.hostname === 'localhost' 
  ? CONFIG.development.API_URL 
  : CONFIG.production.API_URL;
```

---

## ✅ Checklist de Deployment

- [ ] Dependências no `package.json` atualizadas
- [ ] Código preparado para Cloud Functions
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado com URLs de produção
- [ ] Frontend atualizado com URLs corretas
- [ ] Testes locais funcionando
- [ ] Firebase Project criado e configurado
- [ ] Billing habilitado
- [ ] Deploy realizado
- [ ] Testes em produção
- [ ] Logs monitorados
- [ ] Alertas configurados

---

## 🆘 Troubleshooting

### Erro: "Permission denied"
```bash
# Verificar permissões
gcloud auth list
gcloud config set project ciclo-integrado
gcloud auth application-default login
```

### Erro: "Function not found"
```bash
# Verificar se função existe
gcloud functions list

# Se não existir, criar:
gcloud functions create cicloIntegradoAPI --runtime nodejs20 --trigger-http
```

### Erro: "CORS error"
```javascript
// Adicionar seu domínio no backend
cors({
  origin: [
    'https://seu-dominio.com',
    'https://seu-dominio.firebaseapp.com'
  ]
})
```

### Função lenta
```bash
# Aumentar memória (padrão 256MB)
gcloud functions deploy cicloIntegradoAPI --memory 512MB

# Aumentar timeout (padrão 60s)
gcloud functions deploy cicloIntegradoAPI --timeout 120
```

---

## 📚 Próximas Etapas

1. ✅ Deploy do Backend
2. 📱 Deploy do Frontend (Firebase Hosting)
3. 🔐 Configurar Domínio Customizado
4. 📊 Configurar Monitoring
5. 🔄 CI/CD com GitHub Actions

---

## 🎯 Depois do Deploy

Você terá:
- ✅ Backend rodando 24/7 sem precisar de computador local
- ✅ Auto-scaling automático
- ✅ Redundância e backup automáticos
- ✅ HTTPS e segurança garantidos
- ✅ Logs e monitoramento
- ✅ Integração com Firestore
- ✅ Pronto para clientes reais

---

**Seu negócio SaaS agora está online! 🚀**

Próximo passo: Fazer o primeiro login de um cliente de teste na plataforma online.

