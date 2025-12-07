# Backend - Ciclo Integrado

API Backend usando Google Cloud Functions e Firestore.

## 🏗️ Arquitetura

```
Google Cloud Platform
├── Cloud Functions (API)
│   └── Node.js 20
├── Firestore (Banco de Dados)
│   ├── Contratos
│   ├── Usuários
│   ├── Fornecedores
│   └── Notificações
└── Cloud Storage (Uploads)
```

## 📋 Requisitos

- Node.js 20+
- Conta Google Cloud Platform
- `gcloud` CLI instalado
- `firebase-tools` instalado

## 🚀 Instalação

### 1. Configurar GCP Project

```bash
# Criar novo projeto
gcloud projects create ciclo-integrado

# Definir como projeto padrão
gcloud config set project ciclo-integrado

# Habilitar APIs necessárias
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
```

### 2. Configurar Firestore

```bash
# Criar banco de dados Firestore
gcloud firestore databases create --location us-central1
```

### 3. Copiar configurações

```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 4. Instalar dependências

```bash
npm install
```

## 💻 Desenvolvimento Local

### Usar Functions Framework

```bash
npm run dev
```

Servidor rodará em `http://localhost:3000`

### Testar Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Login (será necessário criar usuário primeiro)
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }'
```

## 🚢 Deploy no Google Cloud

### Deploy da API

```bash
npm run deploy
```

### Ver Logs

```bash
npm run logs

# Ou
gcloud functions logs read ciclo-integrado --limit 50
```

### Configurar Variáveis de Ambiente

```bash
gcloud functions deploy ciclo-integrado \
  --set-env-vars JWT_SECRET=sua-chave-secreta \
  --set-env-vars GCP_PROJECT_ID=ciclo-integrado
```

## 📚 Estrutura de Dados

### Usuários (Collection: `users`)

```json
{
  "email": "usuario@municipio.gov",
  "name": "João Silva",
  "password": "hash-do-bcrypt",
  "role": "admin",
  "municipio_id": "mun_123",
  "status": "ativo",
  "created_at": "2025-01-07T10:00:00Z",
  "last_login": "2025-01-07T15:30:00Z"
}
```

### Contratos (Collection: `contratos`)

```json
{
  "numero": "MUN-2025-0001",
  "fornecedor_id": "forn_123",
  "valor": 250000.00,
  "data_inicio": "2025-01-01T00:00:00Z",
  "data_vencimento": "2025-12-31T23:59:59Z",
  "secretaria_id": "sec_123",
  "status": "ativo",
  "municipio_id": "mun_123",
  "created_by": "user_123",
  "created_at": "2025-01-07T10:00:00Z",
  "updated_at": "2025-01-07T10:00:00Z",
  "descricao": "Descrição do contrato"
}
```

### Fornecedores (Collection: `fornecedores`)

```json
{
  "nome": "Urban Solutions Inc.",
  "cnpj": "12.345.678/0001-90",
  "email": "contact@urbansolutions.com",
  "telefone": "(11) 98765-4321",
  "endereco": "Rua Exemplo, 123",
  "status": "ativo",
  "created_at": "2025-01-07T10:00:00Z"
}
```

### Notificações (Collection: `notificacoes/{userId}`)

```json
{
  "titulo": "Contrato próximo ao vencimento",
  "mensagem": "MUN-2025-0001 vence em 7 dias",
  "tipo": "aviso",
  "contrato_id": "ct_123",
  "lido": false,
  "created_at": "2025-01-07T10:00:00Z"
}
```

## 🔐 Segurança

### Firestore Rules

1. Copiar conteúdo de `firestore.rules`
2. Ir para: Google Cloud Console > Firestore > Rules
3. Cole e publique

### JWT

- Usar `HS256` para assinatura
- Secret key: Mínimo 32 caracteres
- Expiração: 24 horas

### Boas práticas

- [ ] Nunca commitar `.env` com chaves reais
- [ ] Usar variáveis de ambiente em produção
- [ ] Validar entrada em todo endpoint
- [ ] Usar HTTPS
- [ ] Rate limiting implementado
- [ ] Logs de auditoria habilitados

## 🧪 Testes

### Testar com cURL

```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "municipio_id": "mun_123"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "municipio_id": "mun_123"
  }'

# Criar contrato (com token)
curl -X POST http://localhost:3000/contratos \
  -H "Authorization: Bearer seu-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "MUN-2025-0001",
    "valor": 250000,
    "data_inicio": "2025-01-01",
    "data_vencimento": "2025-12-31"
  }'
```

### Testar com Postman

1. Importar colection: `postman-collection.json`
2. Definir variáveis de ambiente
3. Executar testes

## 📊 Monitoramento

### Cloud Monitoring

```bash
# Ver métricas
gcloud monitoring dashboards create --config-from-file=monitoring.json
```

### Logs

```bash
# Ver erros
gcloud functions logs read ciclo-integrado --limit 100

# Filtrar por severidade
gcloud functions logs read ciclo-integrado --limit 100 | grep ERROR
```

## 🐛 Troubleshooting

### "Erro ao conectar com Firestore"

```bash
# Verificar autenticação
gcloud auth list

# Re-autenticar
gcloud auth login
```

### "Permissão negada ao fazer deploy"

```bash
# Criar conta de serviço
gcloud iam service-accounts create ciclo-backend \
  --display-name="Ciclo Integrado Backend"

# Atribuir papel
gcloud projects add-iam-policy-binding ciclo-integrado \
  --member=serviceAccount:ciclo-backend@ciclo-integrado.iam.gserviceaccount.com \
  --role=roles/editor
```

## 📖 Documentação Completa

- [Google Cloud Functions](https://cloud.google.com/functions/docs)
- [Firestore](https://cloud.google.com/firestore/docs)
- [Express.js](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## 🔗 Links Úteis

- [Google Cloud Console](https://console.cloud.google.com)
- [Firebase Console](https://console.firebase.google.com)
- [Documentação da API](/API.md)

## 📝 Variáveis de Ambiente

Veja `.env.example` para lista completa.

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](/CONTRIBUTING.md)

## 📞 Suporte

- Email: support@ciclo-integrado.com
- Issues: GitHub

---

**Última atualização**: 7 de dezembro de 2025
