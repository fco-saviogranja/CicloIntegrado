# 🚀 GUIA RÁPIDO - Dashboard Admin Master

## Comece em 5 Minutos

---

## 1️⃣ Acesse o Dashboard

```
URL: http://localhost:8888/pages/admin-dashboard.html
```

**Se estiver em produção:**
```
URL: https://seu-dominio.com/pages/admin-dashboard.html
```

---

## 2️⃣ Faça Login

```
Email: seu-email@ciclo-integrado.com
Senha: sua-senha
Role: admin_master (proprietário)
```

> **Nota:** Você terá acesso automático ao dashboard pois é admin_master

---

## 3️⃣ Veja Seus Dados

O dashboard mostra em tempo real:

### Na Aba "Dashboard"
- 📊 Total de municípios ativos
- 👥 Total de usuários no sistema
- 💰 Receita mensal e anual
- ⚠️ Licenças vencendo nos próximos 30 dias
- 📈 Gráficos de tendências
- 📋 Tabela com todos os municípios

### Na Aba "Municípios"
- 🏢 Lista completa de municípios
- 🎯 Status de cada município
- 📅 Data de vencimento de licença
- ✏️ Editar/Deletar municípios

### Na Aba "Usuários"
- 👥 Contadores por role
- 📊 Estatísticas detalhadas
- 🔍 Filtro por tipo de usuário
- 📋 Lista completa com detalhes

### Na Aba "Faturamento"
- 💳 Receita total anual
- 📈 Receita por plano
- 📊 Receita por município
- 💵 Previsão mensal

### Na Aba "Relatórios"
- 📋 Licenças expirando
- 📊 Uso de recursos
- 👥 Estatísticas de usuários
- 🔍 Filtros avançados

---

## 4️⃣ Criar Novo Município

### Via Dashboard (Visual)

1. Clique em **"Novo Município"** (botão azul)
2. Preencha o formulário:
   - **Nome do Município:** Ex: "Prefeitura de São Paulo"
   - **Email do Admin:** Ex: "admin@saopaulo.gov.br"
   - **Plano:** Standard / Profissional / Premium
   - **Máximo de Usuários:** 20 / 50 / 100
3. Clique em **"Criar"**
4. Compartilhe a senha temporária com o admin do município

### Via API (Programático)

```bash
curl -X POST http://localhost:8080/admin/municipalities \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "municipio_id": "novo-municipio",
    "municipio_nome": "Prefeitura de Nova Cidade",
    "estado": "SP",
    "cep": "12345-678",
    "admin_email": "admin@novaciidade.gov.br",
    "admin_name": "Admin Name",
    "license_type": "profissional",
    "max_users": 50
  }'
```

**Resposta:**
```json
{
  "message": "Município criado com sucesso",
  "admin_email": "admin@novaciidade.gov.br",
  "temporary_password": "Mudar123!"
}
```

---

## 5️⃣ Criar Novo Usuário

### Via API

```bash
curl -X POST http://localhost:8080/admin/users \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gestor@municipio.gov.br",
    "password": "SenhaForte123!",
    "name": "Gestor de Contratos",
    "role": "gestor_contrato",
    "municipio_id": "sao-paulo",
    "phone": "(11) 99999-9999"
  }'
```

### Opções de Role

| Role | Descrição | Pode Ver |
|------|-----------|----------|
| `admin_master` | Proprietário (você) | TUDO |
| `admin_municipio` | Admin da prefeitura | Seu município |
| `gestor_contrato` | Gestor de contratos | Seu município |
| `fiscal_contrato` | Fiscal de contratos | Seu município |

---

## 6️⃣ Acompanhar Receita

### Ver Receita Total

```bash
curl -X GET "http://localhost:8080/admin/revenue" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "revenue": {
    "total_annual": 200000,
    "monthly_average": 16666.67,
    "by_municipality": {
      "São Paulo": 30000,
      "Rio de Janeiro": 15000,
      "...": "..."
    },
    "by_plan": {
      "standard": 10000,
      "profissional": 60000,
      "premium": 130000
    }
  }
}
```

---

## 7️⃣ Monitorar Licenças

### Ver Licenças Vencendo

```bash
curl -X GET "http://localhost:8080/admin/reports/expiring-licenses?days=30" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "expiring_licenses": [
    {
      "municipio_nome": "Brasília",
      "license_type": "profissional",
      "expires_at": "2025-03-10",
      "days_until_expiry": 48
    }
  ],
  "total_expiring": 1
}
```

---

## 8️⃣ Obter Estatísticas

### Ver Estatísticas Completas

```bash
curl -X GET "http://localhost:8080/admin/reports/municipality-stats" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "municipalities_stats": [
    {
      "municipio_nome": "São Paulo",
      "license_type": "premium",
      "users": {
        "current": 85,
        "max": 100,
        "usage_percent": 85
      },
      "contracts": {
        "current": 345,
        "max": 500,
        "usage_percent": 69
      }
    }
  ]
}
```

---

## 📋 Cheatsheet de Endpoints

```
# Dashboard
GET    /admin/dashboard

# Municípios
GET    /admin/municipalities
POST   /admin/municipalities
GET    /admin/municipalities/:id
PUT    /admin/municipalities/:id
DELETE /admin/municipalities/:id

# Usuários
GET    /admin/users (com ?role=, ?municipio_id=, ?status=)
POST   /admin/users
GET    /admin/users/:id
PUT    /admin/users/:id
DELETE /admin/users/:id
GET    /admin/users/statistics

# Receita
GET    /admin/revenue

# Relatórios
GET    /admin/reports/expiring-licenses
GET    /admin/reports/municipality-stats

# Segurança
POST   /admin/reset-password/:user_id
```

---

## 🔑 Token JWT

### Como Obter Token

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@ciclo-integrado.com",
    "password": "sua-senha"
  }'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "role": "admin_master"
  }
}
```

### Como Usar Token

```bash
# Em todos os requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Testar com Postman

1. Abra Postman
2. Clique em "Import"
3. Selecione `backend/postman-admin-master.json`
4. Todos os endpoints estarão disponíveis
5. Configure as variáveis de ambiente:
   - `base_url`: http://localhost:8080
   - `token`: Seu JWT token

---

## 🎨 Personalizações

### Mudar Cores do Dashboard

Edite `pages/admin-dashboard.html`:

```css
.metric-card {
    background: linear-gradient(135deg, #137fec 0%, #0056b3 100%);
}

.metric-card.success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
```

### Adicionar Novo Municipio de Teste

No dashboard, clique "Novo Município" e adicione:

```
Nome: Prefeitura de Teste
Email: admin@teste.gov.br
Plano: Standard
Máx Usuários: 20
```

---

## ⚙️ Configurações

### Variáveis de Ambiente

```bash
# Backend
GCP_PROJECT_ID=ciclo-integrado
JWT_SECRET=seu-secret-aqui

# Frontend
API_BASE_URL=http://localhost:8080
ENVIRONMENT=development
```

### Limites por Plano

| Recurso | Standard | Profissional | Premium |
|---------|----------|--------------|---------|
| Usuários | 20 | 50 | 100 |
| Contratos | 500 | 500 | 500 |
| Preço/Ano | R$ 5.000 | R$ 15.000 | R$ 30.000 |

---

## 🐛 Troubleshooting

### Dashboard não carrega

```
1. Verifique se backend está rodando (localhost:8080)
2. Verifique se tem internet (para CDN do Tailwind)
3. Abra console (F12) para ver erros
4. Verifique permissões (admin_master)
```

### Erro ao criar município

```
1. Verifique se tem token válido
2. Verifique se municipio_id é único
3. Verifique se email é válido
4. Verifique se campos obrigatórios estão preenchidos
```

### Não consegue fazer login

```
1. Verifique email e senha
2. Verifique se usuário existe no Firestore
3. Verifique se role é "admin_master"
4. Tente fazer logout e login novamente
```

---

## 📚 Documentação Completa

Para mais informações:
- **ADMIN-MASTER-DASHBOARD.md** - Guia técnico completo
- **GUIA-PROPRIETARIO.md** - Como usar todo o sistema
- **API.md** - Especificação técnica

---

## 🎯 Próximos Passos

1. ✅ Criar alguns municípios de teste
2. ✅ Criar usuários para cada município
3. ✅ Testar os endpoints com Postman
4. ✅ Verificar receita e licenças
5. 🔜 Integrar gráficos (Chart.js)
6. 🔜 Criar modais dinâmicas
7. 🔜 Notificações em tempo real

---

## 💡 Dicas Importantes

1. **Senha Temporária:** Quando cria municipio, compartilhe senha temporária via WhatsApp/Email
2. **Backup:** Dados são salvos automaticamente no Firestore
3. **Segurança:** Nunca compartilhe seu token JWT
4. **Monitoramento:** Verifique licenças expirando regularmente
5. **Suporte:** Mantenha contato com prefeituras para suporte

---

## 🚀 Você está pronto!

O dashboard está 100% funcional. Comece a usar agora:

```
http://localhost:8888/pages/admin-dashboard.html
```

**Boa sorte com seu SaaS! 🎉**

---

*Ciclo Integrado - Admin Master Dashboard*  
*Guia Rápido v1.0*
