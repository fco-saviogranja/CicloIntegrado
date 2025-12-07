# 🚀 DEPLOY PASSO-A-PASSO - Backend Online em 10 Minutos

## Você vai fazer isso agora:
1. ✅ Preparar código
2. ✅ Deploy no Google Cloud
3. ✅ Atualizar Frontend
4. ✅ Testar

---

## ⚠️ PRÉ-REQUISITOS (5 minutos)

### Instalar Google Cloud CLI

**Windows:**
1. Download: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe
2. Execute o instalador
3. Abra PowerShell e verifique:
```bash
gcloud --version
```

### Login na sua conta Google

```bash
gcloud auth login
```

Vai abrir browser para você fazer login. Faça login com a conta que criou o projeto ciclo-integrado.

### Selecionar Projeto

```bash
gcloud config set project ciclo-integrado
```

---

## 🔧 PASSO 1: Preparar Código (2 minutos)

### 1. Verificar seu `backend/package.json`

Abra em VS Code e certifique-se que tem isso:

```json
{
  "name": "ciclo-integrado-api",
  "version": "1.0.0",
  "engines": {
    "node": "20"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "firebase-admin": "^12.0.0",
    "jsonwebtoken": "^9.1.0"
  }
}
```

Se não tiver tudo isso, atualize!

### 2. Verificar seu `backend/index.js`

Certifique-se que tem isso no FINAL do arquivo:

```javascript
// Exportar para Google Cloud Functions
module.exports = app;
```

Se estiver usando `app.listen()`, remova essa parte:

```javascript
// ❌ REMOVA ISSO:
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando em porta ${PORT}`);
});

// ✅ DEIXE ISSO:
module.exports = app;
```

---

## 🚀 PASSO 2: Deploy no Google Cloud (3 minutos)

### No PowerShell, execute:

```powershell
cd "C:\Users\Francisco\Documents\Ciclo Integrado\CicloIntegrado\backend"

# Deploy da função (tudo em uma linha)
gcloud functions deploy cicloIntegradoAPI --runtime nodejs20 --trigger-http --allow-unauthenticated --memory 256MB --timeout 60 --source . --entry-point cicloIntegradoAPI
```

**⚠️ IMPORTANTE:** No PowerShell não use `\` para quebrar linhas (isso é para bash). Use tudo em uma linha ou use `` ` `` (backtick) se precisar quebrar.

**Vai aparecer:**
```
API [cloudfunctions.googleapis.com] not enabled on project...
Do you want to enable the API? (y/N)  
```

Digite `y` e pressione Enter.

Espere 2-3 minutos para fazer o deploy...

### Quando terminar, você verá:
```
status: ACTIVE
url: https://us-central1-scenic-lane-480423-t5.cloudfunctions.net/cicloIntegradoAPI
```

**✅ URL do seu backend:**
```
https://us-central1-scenic-lane-480423-t5.cloudfunctions.net/cicloIntegradoAPI
```

**Anote essa URL!** Você vai precisar.

---

## ✅ PASSO 3: Testar se Funcionou (1 minuto)

### Teste a função:

```powershell
# Health check
curl https://us-central1-scenic-lane-480423-t5.cloudfunctions.net/cicloIntegradoAPI/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-07T20:50:00.970Z",
  "service": "ciclo-integrado-api",
  "version": "1.0.0"
}
```

✅ Se viu isso, significa que seu backend está online! 🎉

---

## 📱 PASSO 4: Atualizar Frontend (2 minutos)

### ✅ Já está configurado!

O frontend já foi atualizado automaticamente para usar a URL online:

Arquivo: `js/config.js`
```javascript
const API_CONFIG = {
  BASE_URL: 'https://us-central1-scenic-lane-480423-t5.cloudfunctions.net/cicloIntegradoAPI'
};
```

**Se quiser voltar para desenvolvimento local no futuro:**
1. Abra `js/config.js`
2. Mude `BASE_URL` para `http://localhost:8080`
3. Salve o arquivo

---

## 🧪 PASSO 5: Testar Tudo (2 minutos)

### Abra o Dashboard no navegador:

```
http://localhost:8080/admin-dashboard.html
```

### Clique em "Novo Município"

Se aparecer a modal de criar município, significa que agora o frontend está conectado ao backend online!

### Teste a API com Postman:

1. Abra Postman
2. Importe `backend/postman-admin-master.json`
3. Mude a variável `base_url` de `http://localhost:8080` para:
```
https://us-central1-scenic-lane-480423-t5.cloudfunctions.net/cicloIntegradoAPI
```
4. Teste um endpoint, exemplo: `GET /health`

✅ Se funcionar, seu backend está 100% online! 🚀

---

## 📊 Ver Logs (Para Debug)

Se algo der errado, veja os logs:

```bash
# Logs em tempo real
gcloud functions logs read cicloIntegradoAPI --limit 50 --follow
```

---

## 💰 Custo (Não se preocupe)

Google Cloud Functions:
- ✅ **Primeiros 2 milhões de invocações/mês = GRÁTIS**
- ✅ Seu projeto vai usar muito menos no início
- ✅ Somente paga depois que fica popular

**Seu custo inicial: R$ 0**

---

## 🎯 Pronto!

Agora você tem:
- ✅ Backend rodando online (sem computador local)
- ✅ Frontend conectado ao backend online
- ✅ Dados salvos no Firestore (também online)
- ✅ Tudo 24/7 sem parar

**Você não depende mais do seu computador!** 🎉

---

## 🔄 Proxima Vez que Precisar Atualizar

Se mudar o código do backend:

```powershell
cd "C:\Users\Francisco\Documents\Ciclo Integrado\CicloIntegrado\backend"
gcloud functions deploy cicloIntegradoAPI --runtime nodejs20 --trigger-http --allow-unauthenticated --source . --entry-point cicloIntegradoAPI
```

Pronto! A função já está atualizada em ~2 minutos.

---

## 🆘 Erros Comuns

### Erro: "Permission denied"
```bash
gcloud auth login
# Faça login novamente
```

### Erro: "Function already exists"
```bash
# Atualizar ao invés de criar
gcloud functions deploy cicloIntegradoAPI --runtime nodejs20 --trigger-http --source .
```

### Erro: "CORS error"
- Abra o arquivo backend/index.js
- Procure por `cors({`
- Adicione sua URL do frontend:
```javascript
cors({
  origin: [
    'http://localhost:8080',
    'https://seu-dominio.com'  // Adicione aqui
  ]
})
```
- Deploy novamente

---

## 📞 Próximos Passos

1. **Seu próprio domínio** (opcional)
   - Comprar domínio (ex: ciclointegrado.com.br)
   - Apontar para Google Cloud

2. **Frontend Online** (recomendado)
   - Deploy no Firebase Hosting
   - URL: https://seu-projeto.firebaseapp.com

3. **Variáveis Secretas** (segurança)
   - Usar Google Secret Manager
   - Nunca colocar senhas no código

---

**Seu SaaS agora está ONLINE! 🚀**

Você conseguiu! Parabéns! 🎊

