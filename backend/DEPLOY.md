# Deploy Configuration - Ciclo Integrado Backend
# Comandos e configurações para deploy no Google Cloud Platform

## 🚀 Setup Inicial

```bash
# 1. Criar projeto GCP
gcloud projects create ciclo-integrado

# 2. Definir projeto padrão
gcloud config set project ciclo-integrado

# 3. Habilitar APIs necessárias
gcloud services enable cloudfunctions.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  storage-component.googleapis.com \
  secretmanager.googleapis.com

# 4. Autenticar
gcloud auth login
```

## 📦 Deploy da API

### Deploy rápido

```bash
cd backend
npm install
npm run deploy
```

### Deploy com variáveis de ambiente

```bash
gcloud functions deploy ciclo-integrado \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --memory 512MB \
  --timeout 60 \
  --entry-point api \
  --set-env-vars JWT_SECRET=sua-chave-super-secreta \
  --set-env-vars GCP_PROJECT_ID=ciclo-integrado \
  --set-env-vars NODE_ENV=production
```

### Deploy com Service Account

```bash
# Criar service account
gcloud iam service-accounts create ciclo-backend

# Atribuir permissões
gcloud projects add-iam-policy-binding ciclo-integrado \
  --member=serviceAccount:ciclo-backend@ciclo-integrado.iam.gserviceaccount.com \
  --role=roles/editor

# Criar chave
gcloud iam service-accounts keys create key.json \
  --iam-account=ciclo-backend@ciclo-integrado.iam.gserviceaccount.com

# Deploy com service account
gcloud functions deploy ciclo-integrado \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --service-account=ciclo-backend@ciclo-integrado.iam.gserviceaccount.com
```

## 🔐 Gerenciar Secrets

### Usar Secret Manager

```bash
# Criar secret
gcloud secrets create jwt-secret --data-file=- <<< "sua-chave-secreta"

# Dar permissão ao Cloud Functions
gcloud secrets add-iam-policy-binding jwt-secret \
  --member=serviceAccount:ciclo-integrado@appspot.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Reference no código
const secret = await client.accessSecretVersion({
  name: `projects/ciclo-integrado/secrets/jwt-secret/versions/latest`
});
```

## 🗄️ Configurar Firestore

### Criar banco de dados

```bash
gcloud firestore databases create --location us-central1
```

### Importar dados iniciais

```bash
# Backup
gcloud firestore export gs://ciclo-backup/backup-2025-01-07

# Restore
gcloud firestore import gs://ciclo-backup/backup-2025-01-07
```

### Aplicar security rules

```bash
gcloud firestore rules deploy firestore.rules
```

## 📊 Monitoramento

### Ver logs em tempo real

```bash
gcloud functions logs read ciclo-integrado --limit 100 --follow
```

### Filtrar logs

```bash
# Apenas erros
gcloud functions logs read ciclo-integrado --limit 100 | grep ERROR

# Apenas uma função
gcloud functions logs read ciclo-integrado --limit 100
```

### Criar alerta de erro

```bash
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Erros da API Ciclo" \
  --condition-display-name="Taxa de erro > 5%" \
  --condition-threshold-value=5
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Criar arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Auth GCP
        uses: google-github-actions/auth@v0
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v0
      
      - name: Deploy
        run: |
          cd backend
          npm install
          gcloud functions deploy ciclo-integrado \
            --runtime nodejs20 \
            --trigger-http \
            --region us-central1 \
            --source . \
            --entry-point api
```

## 🌐 Domínio Customizado

```bash
# Usar Cloud Run com domínio customizado
gcloud run deploy ciclo-api \
  --source . \
  --region us-central1

# Mapear domínio
gcloud beta run domain-mappings create \
  --service ciclo-api \
  --domain api.ciclo-integrado.com
```

## 💾 Backup Automático

```bash
# Criar bucket
gsutil mb gs://ciclo-backups

# Scheduler para backup diário
gcloud scheduler jobs create app-engine daily-backup \
  --schedule="0 2 * * *" \
  --http-method=POST \
  --uri="https://us-central1-ciclo-integrado.cloudfunctions.net/backup"
```

## 🎯 Auto Scaling

```bash
# Configurar max instances
gcloud functions deploy ciclo-integrado \
  --max-instances=100 \
  --memory=512MB
```

## 📈 Performance

### Load Testing

```bash
# Usar Apache Bench
ab -n 1000 -c 10 https://ciclo-integrado.appspot.com/health

# Ou usar Google Cloud Load Testing
gcloud compute instances create load-tester \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud
```

## 🗑️ Limpar Recursos

```bash
# Deletar função
gcloud functions delete ciclo-integrado --region us-central1

# Deletar banco de dados
gcloud firestore databases delete --database=(default)

# Deletar bucket
gsutil -m rm -r gs://ciclo-backups

# Deletar projeto (cuidado!)
gcloud projects delete ciclo-integrado
```

## ✅ Checklist de Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Firestore Rules publicadas
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] CORS configurado
- [ ] Rate limiting ativo
- [ ] Logs habilitados
- [ ] Alertas configurados
- [ ] Health check respondendo
- [ ] Testes passando

## 🔗 Dashboard

URL da sua API após deploy:
```
https://us-central1-ciclo-integrado.cloudfunctions.net/
```

Monitor em:
```
https://console.cloud.google.com/functions
```

---

**Última atualização**: 7 de dezembro de 2025
