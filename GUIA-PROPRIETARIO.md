# 👑 GUIA DO PROPRIETÁRIO - CICLO INTEGRADO

## Bem-vindo! Você é o Dono do Sistema

Este guia é especificamente para você, o **Proprietário do Ciclo Integrado**. Aqui você aprenderá como gerenciar múltiplos municípios, cobrar por licenças e manter controle total do sistema.

---

## 🔐 SUA CONTA (Admin Master)

### Criando sua Conta Inicial

**IMPORTANTE:** Você precisa criar sua conta Admin Master manualmente no Firestore. Siga os passos:

#### Passo 1: Acesse o Firestore Console
```
URL: https://console.firebase.google.com
Project: ciclo-integrado
```

#### Passo 2: Vá para a coleção `users`

#### Passo 3: Crie um novo documento com:

```json
{
  "email": "seu-email@ciclo-integrado.com",
  "password": "Sua-Senha-Super-Segura123!",
  "name": "Seu Nome - Proprietário",
  "role": "admin_master",
  "municipio_id": "SISTEMA",
  "municipio_nome": "Sistema Central",
  "status": "active",
  "created_at": "2024-12-07T00:00:00Z",
  "last_login": null,
  "permissions": [
    "manage_municipalities",
    "manage_admins",
    "manage_billing",
    "view_all_data",
    "manage_system"
  ]
}
```

#### Passo 4: Faça Login

```
URL: http://localhost:8888/login.html
Email: seu-email@ciclo-integrado.com
Senha: Sua-Senha-Super-Segura123!
```

---

## 💼 SUAS PRINCIPAIS TAREFAS

### 1️⃣ Criar Conta para Novo Município

**Quando um município compra sua licença:**

#### Via API (Recomendado)

```bash
# Primeiro, faça login para obter seu token
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@ciclo-integrado.com",
    "password": "Sua-Senha-Super-Segura123!"
  }'

# Você receberá um token. Use para criar o município:

curl -X POST http://localhost:8080/admin/municipalities \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "municipio_id": "sao-paulo",
    "municipio_nome": "Prefeitura de São Paulo",
    "estado": "SP",
    "cep": "01310-100",
    "admin_email": "admin@sao-paulo.ciclo-integrado.com",
    "admin_name": "João Silva",
    "license_type": "premium",
    "license_expires": "2025-12-31",
    "max_users": 100,
    "max_contracts": 5000
  }'
```

**Resposta:**
```json
{
  "message": "Município criado com sucesso",
  "municipio": {
    "municipio_id": "sao-paulo",
    "municipio_nome": "Prefeitura de São Paulo",
    "license_type": "premium",
    "status": "active"
  },
  "admin_email": "admin@sao-paulo.ciclo-integrado.com",
  "temporary_password": "Mudar123!",
  "warning": "Admin deve mudar a senha na primeira vez que fazer login"
}
```

**Você então envia para o município:**
```
Email: admin@sao-paulo.ciclo-integrado.com
Senha temporária: Mudar123!
URL: http://localhost:8888/login.html (ou seu domínio em produção)
```

---

### 2️⃣ Ver Dashboard com Todos os Dados

**Como verificar tudo que está acontecendo:**

```bash
curl -X GET http://localhost:8080/admin/dashboard \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Você verá:**
```json
{
  "dashboard": {
    "summary": {
      "total_municipalities": 15,
      "active_municipalities": 14,
      "total_users": 2547,
      "total_contracts": 45892,
      "licenses_expiring_soon": 2
    },
    "timestamp": "2024-12-07T10:30:00Z"
  }
}
```

---

### 3️⃣ Ver Todos os Municípios

```bash
curl -X GET http://localhost:8080/admin/municipalities \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:**
```json
{
  "total": 15,
  "municipalities": [
    {
      "id": "sao-paulo",
      "municipio_nome": "Prefeitura de São Paulo",
      "status": "active",
      "license_type": "premium",
      "license_expires": "2025-12-31",
      "max_users": 100,
      "max_contracts": 5000
    },
    {
      "id": "rio-janeiro",
      "municipio_nome": "Prefeitura do Rio de Janeiro",
      "status": "active",
      "license_type": "profissional",
      "license_expires": "2025-06-30",
      "max_users": 50,
      "max_contracts": 2000
    },
    ...
  ]
}
```

---

### 4️⃣ Ver Detalhes de Um Município

```bash
curl -X GET http://localhost:8080/admin/municipalities/sao-paulo \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:**
```json
{
  "municipio": {
    "municipio_id": "sao-paulo",
    "municipio_nome": "Prefeitura de São Paulo",
    "status": "active",
    "license_expires": "2025-12-31",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "statistics": {
    "users": 85,
    "contracts": 4250,
    "usage_percent": 85
  }
}
```

**Interpret:**
- 85 usuários de 100 máximos = 85% de uso
- Se chegar a 100%, você pode cobrar mais ou aumentar o plano

---

### 5️⃣ Atualizar um Município

**Exemplo: Renovar licença ou mudar limite de usuários**

```bash
curl -X PUT http://localhost:8080/admin/municipalities/sao-paulo \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "license_expires": "2026-12-31",
    "max_users": 150,
    "max_contracts": 7500
  }'
```

---

### 6️⃣ Resetar Senha de Usuário

**Se algum usuário perder a senha:**

```bash
curl -X POST http://localhost:8080/admin/reset-password/USER_ID \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "new_password": "NovaSenh@Temp123!"
  }'
```

---

## 📋 FLUXO COMPLETO: DO CONTATO À VENDA

### Passo a Passo Real

```
1. MUNICÍPIO ENTRA EM CONTATO
   └─ "Queremos usar Ciclo Integrado"

2. VOCÊ DEFINE PREÇO E PLANO
   ├─ Tipo: Premium, Profissional ou Standard
   ├─ Usuários máximos: 20, 50, 100, etc
   ├─ Contratos máximos: 500, 2000, 5000, etc
   ├─ Preço: R$ 5.000 a R$ 30.000 / ano
   └─ Período: 1 ano (renovável)

3. VOCÊ EMITE CONTRATO E RECEBE PAGAMENTO
   └─ Via PIX, transferência, boleto, etc

4. VOCÊ CRIA A CONTA DO MUNICÍPIO
   ├─ Acessa: http://localhost:8080/admin/municipalities
   ├─ Cria novo município
   ├─ Define limite de usuários
   ├─ Configura data de expiração
   └─ Cria admin municipal automático

5. VOCÊ ENVIA CREDENCIAIS
   ├─ Email: admin@municipio.ciclo-integrado.com
   ├─ Senha: (temporária)
   ├─ URL: seu-dominio.com/login.html
   └─ Aviso: "Mude a senha na primeira vez"

6. MUNICÍPIO FAZ LOGIN
   ├─ Entra com credenciais que você enviou
   ├─ Sistema obriga mudar a senha
   ├─ Admin cria usuários para seu município
   ├─ Usuários começam a usar o sistema
   └─ Dados ficam isolados do outro município

7. VOCÊ MONITORA E SUPORTA
   ├─ Vê dashboard global
   ├─ Acompanha uso de cada município
   ├─ Se precisa aumentar, cobra mais
   ├─ Fornece suporte técnico
   └─ Gerencia renovação de licenças

8. RENOVAÇÃO ANUAL
   ├─ Você avisa 30 dias antes
   ├─ Município renova ou cancela
   ├─ Você atualiza a data de expiração
   └─ Continua fornecendo serviço
```

---

## 💰 ESTRUTURA DE GANHOS

### Exemplo com 15 Municípios

```
MUNICÍPIO              PLANO           USUARIOS  PREÇO/ANO    STATUS
─────────────────────────────────────────────────────────────────
São Paulo             Premium         100       R$ 30.000    ✅ Ativo
Rio de Janeiro        Profissional    50        R$ 15.000    ✅ Ativo
Brasília              Profissional    40        R$ 15.000    ✅ Ativo
Salvador              Standard        20        R$ 5.000     ✅ Ativo
Fortaleza             Premium         80        R$ 30.000    ✅ Ativo
Belo Horizonte        Profissional    35        R$ 15.000    ✅ Ativo
Curitiba              Standard        15        R$ 5.000     ✅ Ativo
Manaus                Standard        18        R$ 5.000     ✅ Ativo
Recife                Profissional    45        R$ 15.000    ✅ Ativo
Porto Alegre          Premium         90        R$ 30.000    ✅ Ativo
Goiânia               Standard        22        R$ 5.000     ✅ Ativo
Belém                 Standard        20        R$ 5.000     ✅ Ativo
Guarulhos             Profissional    30        R$ 15.000    ✅ Ativo
Campinas              Standard        18        R$ 5.000     ✅ Ativo
Duque de Caxias       Standard        20        R$ 5.000     ✅ Ativo

TOTAL MENSAL: R$ 10.416,67
TOTAL ANUAL:  R$ 125.000,00

LUCRO ESTIMADO (com 70% de margem): R$ 87.500,00 / ano
```

---

## 📊 ACOMPANHAMENTO MENSAL

### Checklist que Você Deve Fazer Todo Mês

```
□ Verificar dashboard
  └─ Quantos municípios ativos?
  └─ Quantos usuários no total?
  └─ Quantos contratos?

□ Checar licenças vencendo
  └─ Quais vencerão nos próximos 30 dias?
  └─ Contatar antes do vencimento

□ Revisar uso de recursos
  └─ Algum município está perto do limite?
  └─ Sugerir upgrade?

□ Gerar relatórios
  └─ Receita do mês
  └─ Uso por município
  └─ Contatos de suporte

□ Planejar crescimento
  └─ Quantos novos municípios quer?
  └─ Quanto precisa investir em marketing?
  └─ Melhorias no sistema?
```

---

## 🔐 SEGURANÇA IMPORTANTE

### Sempre Faça Isso:

✅ **Nunca compartilhe seu token**
```bash
# ❌ ERRADO - Nunca faça isto!
curl ... -H "Authorization: Bearer Sua_Senha_Real"

# ✅ CERTO - Use variáveis de ambiente
export AUTH_TOKEN="seu-token"
curl ... -H "Authorization: Bearer $AUTH_TOKEN"
```

✅ **Mude sua senha regularmente**
```bash
# Você pode criar um endpoint para isto (adicionar depois)
POST /admin/change-password
  Body: { current_password, new_password }
```

✅ **Faça backup dos dados**
```bash
# Firestore faz automaticamente, mas você pode exportar:
# Console Firebase → Dados → Importação/Exportação
```

✅ **Use HTTPS em produção**
```bash
# Nunca use HTTP em produção
# Sempre use HTTPS para proteger senhas e tokens
```

---

## 📞 SUPORTE PARA MUNICÍPIOS

### Você Pode Oferecer:

```
PLANO STANDARD        PLANO PROFISSIONAL    PLANO PREMIUM
─────────────────────────────────────────────────────────
Email               Email                 Email
                    Chat (horário)        Chat 24/7
                                          Telefone
                                          Suporte on-site

Resposta: 48h       Resposta: 24h         Resposta: 4h

Sem SLA             SLA 95%               SLA 99.5%
```

---

## 🚀 PRÓXIMOS PASSOS

### Para Começar Agora:

```
1. Crie sua conta Admin Master no Firestore
   └─ Use dados da seção "SUA CONTA" acima

2. Faça login na aplicação
   └─ http://localhost:8888/login.html

3. Crie primeiro município de teste
   └─ Via API ou Firestore

4. Teste o fluxo completo
   └─ Crie município
   └─ Veja dashboard
   └─ Busque os dados

5. Customize para seu negócio
   └─ Mude os preços
   └─ Mude os limites
   └─ Mude a forma de cobrança
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

Leia também:
- `MODELO-NEGOCIO.md` - Estratégia e modelo de preços
- `API.md` - Especificação técnica dos endpoints
- `BACKEND.md` - Como rodar o backend
- `SECURITY.md` - Políticas de segurança

---

## 💡 DICAS ÚTEIS

### Usar cURL com Postman

Se acha cURL complicado, use Postman:

1. Baixe Postman: https://www.postman.com/downloads/
2. Importe: `backend/postman-collection.json`
3. Configure variáveis (token, municipio_id, etc)
4. Execute requests visualmente

### Automatizar com Scripts

Você pode criar scripts Python/Node para:
- Enviar lembrete de renovação
- Gerar faturas automáticas
- Backup de dados
- Relatórios mensais

---

## ✨ PARABÉNS!

Você agora tem um **negócio SaaS completamente pronto** para:

✅ Vender para múltiplos municípios
✅ Manter dados isolados
✅ Cobrar por subscription
✅ Escalar sem limite
✅ Ter controle total

**Bom negócio! 💰**

---

**Ciclo Integrado - Guia do Proprietário v1.0**
Seu sistema de gestão de contratos escalável
