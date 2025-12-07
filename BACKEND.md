# 🚀 Backend Setup Guide - Ciclo Integrado

## Visão Geral

O backend do Ciclo Integrado foi criado usando:

- **Google Cloud Functions** - Computação serverless
- **Firestore** - Banco de dados NoSQL em tempo real
- **Express.js** - Framework HTTP
- **Firebase Admin SDK** - Integração com Google Cloud

## 📁 Estrutura Backend

```
backend/
├── index.js                    # API principal
├── package.json               # Dependências
├── .env.example              # Variáveis de ambiente
├── README.md                 # Documentação completa
├── DEPLOY.md                 # Guia de deploy
├── firestore.rules          # Regras de segurança
└── postman-collection.json  # Testes
```

## ⚡ Endpoints Disponíveis

### 🔐 Autenticação

```
POST   /auth/login          # Fazer login
POST   /auth/signup         # Criar novo usuário
```

### 📋 Contratos

```
GET    /contratos           # Listar (com paginação)
POST   /contratos           # Criar novo
GET    /contratos/:id       # Obter detalhes
PUT    /contratos/:id       # Atualizar
DELETE /contratos/:id       # Deletar
```

### 👥 Usuários

```
GET    /usuarios            # Listar (apenas admin)
```

### ✅ Utilitários

```
GET    /health              # Health check
GET    /status              # Status da API
```

## 🚀 Quick Start Deploy

### 1. Verificar Pré-requisitos

```bash
# Verificar gcloud instalado
gcloud --version

# Verificar Node.js
node --version  # Deve ser 20+

# Fazer login no GCP
gcloud auth login
```

### 2. Criar Projeto GCP

```bash
# Criar projeto
gcloud projects create ciclo-integrado

# Definir como padrão
gcloud config set project ciclo-integrado

# Habilitar APIs
gcloud services enable \
  cloudfunctions.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 3. Configurar Firestore

```bash
# Criar banco de dados Firestore
gcloud firestore databases create --location us-central1

# Aplicar security rules
gcloud firestore rules deploy backend/firestore.rules
```

### 4. Deploy da API

```bash
# Navegar para backend
cd backend

# Deploy
npm run deploy

# Ou deploy manual
gcloud functions deploy ciclo-integrado \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --source . \
  --entry-point api
```

### 5. Testar API

```bash
# Health check
curl https://us-central1-ciclo-integrado.cloudfunctions.net/health

# Status
curl https://us-central1-ciclo-integrado.cloudfunctions.net/status
```

## 🔐 Segurança Implementada

✅ **Autenticação JWT** - Tokens com expiração 24h  
✅ **Firestore Rules** - Validação de permissões  
✅ **CORS** - Configurado para domínios autorizados  
✅ **Validação de entrada** - Em todos os endpoints  
✅ **Hash de senha** - Pronto para bcrypt  
✅ **Environment variables** - Chaves não versionadas  

## 📊 Estrutura de Dados

### Collection: `users`
```javascript
{
  email: "string",
  name: "string",
  password: "string (será hash)",
  role: "admin | user",
  municipio_id: "string",
  status: "ativo | inativo",
  created_at: "timestamp",
  last_login: "timestamp"
}
```

### Collection: `contratos`
```javascript
{
  numero: "string",
  fornecedor_id: "string",
  valor: "number",
  data_inicio: "timestamp",
  data_vencimento: "timestamp",
  secretaria_id: "string",
  status: "rascunho | ativo | renovado | vencido",
  municipio_id: "string",
  created_by: "string",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

## 🧪 Testar Endpoints

### Com Postman

1. Importar `backend/postman-collection.json` no Postman
2. Definir variável `base_url` = sua URL do GCP
3. Executar requests

### Com cURL

```bash
# Signup
curl -X POST https://seu-api.cloudfunctions.net/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "municipio_id": "mun_123"
  }'

# Login
curl -X POST https://seu-api.cloudfunctions.net/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'

# Criar contrato (com token)
curl -X POST https://seu-api.cloudfunctions.net/contratos \
  -H "Authorization: Bearer seu-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "MUN-2025-0001",
    "valor": 250000
  }'
```

## 🔌 Integração Frontend

### Configurar API URL

No frontend, edite o ambiente para:

```javascript
const API_URL = 'https://us-central1-ciclo-integrado.cloudfunctions.net';

// Login
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@municipio.gov',
    password: 'senha'
  })
});

const { token } = await response.json();
localStorage.setItem('token', token);

// Usar em requisições subsequentes
fetch(`${API_URL}/contratos`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📈 Monitoramento

### Ver Logs

```bash
gcloud functions logs read ciclo-integrado --limit 100 --follow
```

### Métricas

Google Cloud Console > Cloud Functions > ciclo-integrado > Métricas

## 🔄 Próximos Passos

1. **Implementar Hash de Senha**
   ```bash
   npm install bcryptjs
   ```

2. **Adicionar Email de Notificação**
   ```bash
   npm install sendgrid
   ```

3. **Implementar Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

4. **Adicionar Testes Automatizados**
   ```bash
   npm install --save-dev jest @testing-library/node
   ```

5. **Setup CI/CD**
   - Criar `.github/workflows/deploy.yml`
   - Configurar GitHub Actions

## 📚 Documentação Completa

- **`backend/README.md`** - Documentação detalhada
- **`backend/DEPLOY.md`** - Guia completo de deploy
- **`API.md`** - Especificação de endpoints

## 🆘 Troubleshooting

### "Erro ao fazer deploy"

```bash
# Verificar autenticação
gcloud auth list

# Re-autenticar
gcloud auth login

# Verificar projeto
gcloud config list project
```

### "Firestore não conecta"

```bash
# Criar banco de dados
gcloud firestore databases create --location us-central1

# Verificar rules
gcloud firestore rules describe
```

### "CORS error no frontend"

Adicione seu domínio em `index.js`:

```javascript
const ALLOWED_ORIGINS = [
  'http://localhost:8888',
  'https://seu-dominio.com'
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
```

## ✨ Status do Backend

- ✅ API completa
- ✅ Autenticação implementada
- ✅ CRUD de contratos
- ✅ Firestore configurado
- ✅ Deploy ready
- ⏳ Testes automatizados (próximo)
- ⏳ Email notifications (próximo)
- ⏳ Analytics (próximo)

## 🎯 Checklist Antes de Produção

- [ ] JWT_SECRET configurado
- [ ] CORS domains configurado
- [ ] Firestore Rules publicadas
- [ ] Backups automáticos habilitados
- [ ] Monitoramento ativo
- [ ] Logs habilitados
- [ ] Rate limiting ativo
- [ ] HTTPS obrigatório
- [ ] Testes passing
- [ ] Documentação atualizada

## 🔗 Links Úteis

- [Google Cloud Console](https://console.cloud.google.com)
- [Cloud Functions Docs](https://cloud.google.com/functions/docs)
- [Firestore Docs](https://cloud.google.com/firestore/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## 📞 Suporte

- Documentação: `backend/README.md`
- Deploy: `backend/DEPLOY.md`
- API Spec: `/API.md`

---

**Backend criado**: 7 de dezembro de 2025  
**Status**: Pronto para deploy ✨
