# 🎯 CARTÃO DE REFERÊNCIA - SUAS CREDENCIAIS

## Guarde Este Arquivo em Lugar Seguro!

---

## 👑 VOCÊ: Proprietário do Sistema Ciclo Integrado

### Suas Informações de Acesso

```
┌──────────────────────────────────────────────┐
│  CICLO INTEGRADO - ADMIN MASTER              │
├──────────────────────────────────────────────┤
│                                              │
│  Email: seu-email@ciclo-integrado.com       │
│  Senha: Sua-Senha-Super-Segura123!          │
│  Role:  admin_master                        │
│  Município: SISTEMA (Proprietário)          │
│                                              │
│  URL de Login:                               │
│  http://localhost:8888/login.html           │
│  (ou seu domínio em produção)                │
│                                              │
│  API Backend:                                │
│  http://localhost:8080                      │
│  (ou seu servidor em produção)               │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🔑 Suas Permissões (Admin Master)

```
✅ Criar municípios
✅ Gerenciar admins municipais
✅ Ver TODOS os dados de TODOS os municípios
✅ Resetar senhas de qualquer usuário
✅ Gerir assinaturas e licenças
✅ Ver analytics globais
✅ Acompanhar receita e faturamento
✅ Configurar sistema
```

---

## 💰 O Que Você Oferece aos Municípios

```
PLANO STANDARD              PLANO PROFISSIONAL      PLANO PREMIUM
─────────────────────────────────────────────────────────────────
R$ 5.000/ano              R$ 15.000/ano           R$ 30.000/ano

20 usuários               50 usuários             100+ usuários
500 contratos             2.000 contratos         5.000+ contratos
Suporte por email         Chat + Email            Chat 24/7+Telefone
```

---

## 🚀 Passos Rápidos

### 1. Quando Município Compra (Use a API)

```bash
# Fazer login como proprietário
POST /auth/login
Body: {
  "email": "seu-email@ciclo-integrado.com",
  "password": "Sua-Senha-Super-Segura123!"
}

# Resposta: { "token": "eyJh..." }

# Criar município (salve o token acima)
POST /admin/municipalities
Headers: Authorization: Bearer [TOKEN]
Body: {
  "municipio_id": "nome-municipio",
  "municipio_nome": "Prefeitura de ...",
  "admin_email": "admin@municipio.ciclo-integrado.com",
  "license_type": "premium",
  "max_users": 100,
  "license_expires": "2025-12-31"
}

# Resposta:
{
  "admin_email": "admin@municipio.ciclo-integrado.com",
  "temporary_password": "Mudar123!"
}

# VOCÊ ENVIA PARA O MUNICÍPIO:
Email: admin@municipio.ciclo-integrado.com
Senha: Mudar123!
URL: http://localhost:8888/login.html
```

### 2. Ver Todos os Municípios

```bash
GET /admin/municipalities
Headers: Authorization: Bearer [TOKEN]

# Você vê lista de todos os municípios que vendeu
```

### 3. Ver Detalhes de Um Município

```bash
GET /admin/municipalities/nome-municipio
Headers: Authorization: Bearer [TOKEN]

# Você vê:
# - Quantos usuários estão usando
# - Quantos contratos foram criados
# - Quanto % da licença está sendo usado
```

### 4. Dashboard Completo

```bash
GET /admin/dashboard
Headers: Authorization: Bearer [TOKEN]

# Você vê:
# - Total de municípios
# - Total de usuários no sistema
# - Total de contratos
# - Licenças vencendo em breve
```

---

## 📊 Exemplo Real: Vendendo para São Paulo

### Dia 1: Contato

```
São Paulo liga: "Queremos usar seu sistema"
Você: "Ótimo! Plano Premium por R$ 30.000/ano"
São Paulo: "Certo, vamos contratar"
```

### Dia 2: Você Cria a Conta

```bash
curl -X POST http://localhost:8080/admin/municipalities \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{
    "municipio_id": "sao-paulo",
    "municipio_nome": "Prefeitura de São Paulo",
    "estado": "SP",
    "admin_email": "admin@sao-paulo.ciclo-integrado.com",
    "admin_name": "João Silva",
    "license_type": "premium",
    "max_users": 100,
    "max_contracts": 5000,
    "license_expires": "2025-12-31"
  }'
```

### Dia 3: Você Envia Credenciais

```
Para: contato@saopaulomunicipio.sp.gov.br
Assunto: Ciclo Integrado - Suas Credenciais

Prezados,

Segue abaixo as credenciais de acesso:

📧 Email: admin@sao-paulo.ciclo-integrado.com
🔐 Senha (temporária): Mudar123!

🌐 Acesse em: http://localhost:8888/login.html

⚠️ Na primeira vez que entrar, mude a senha!

Qualquer dúvida, entre em contato.

Atenciosamente,
Ciclo Integrado
```

### Dia 4+: São Paulo usa, você acompanha

```bash
# Você checa regularmente como está São Paulo:
GET /admin/municipalities/sao-paulo

# Resposta mostra:
{
  "users": 45,              # Usando 45 de 100 usuários
  "contracts": 1200,        # Criados 1.200 contratos
  "usage_percent": 45       # 45% da licença
}

# Próximo ano, você renova a licença:
PUT /admin/municipalities/sao-paulo
Body: {
  "license_expires": "2026-12-31"
}
```

---

## 💡 Dicas de Negócio

```
1. CONTRATE UM CONTADOR
   └─ Para gerenciar faturas e impostos

2. USE UM SISTEMA DE PAGAMENTO
   └─ Stripe, PagSeguro, Asaas, etc
   └─ Para receber automaticamente

3. CRIE CONTRATO DE SERVIÇO
   └─ Defina direitos e deveres
   └─ Proteção legal

4. CONFIGURE EMAIL AUTOMÁTICO
   └─ Lembrete de renovação 30 dias antes
   └─ Recebimento de pagamento
   └─ Suporte automático

5. MONITORE MENSALMENTE
   └─ Receita
   └─ Novos municípios
   └─ Problemas técnicos
   └─ Satisfação dos clientes
```

---

## 📋 Checklist Primeira Semana

```
□ Criar sua conta Admin Master no Firestore
□ Fazer login e explorar o sistema
□ Testar criar um município de teste
□ Testar fazer login como admin municipal
□ Ler MODELO-NEGOCIO.md
□ Ler GUIA-PROPRIETARIO.md
□ Definir seu preço
□ Criar templates de email
□ Contatar primeiros clientes potenciais
```

---

## 🆘 Problemas?

### Não consigo fazer login como Admin Master

**Solução:**
1. Verifique se sua conta está no Firestore
2. Verifique se o email está correto
3. Verifique se a senha está correta (case-sensitive)
4. Certifique-se que role = "admin_master"

### Quando crio município, recebo erro

**Solução:**
1. Certifique-se que está autenticado (tem token válido)
2. Verifique se o campo "municipio_id" é único
3. Verifique se o email do admin é válido

### Não vejo dados dos municípios

**Solução:**
1. Certifique-se que tem role = "admin_master"
2. Tente fazer logout e login novamente
3. Verifique se os municípios foram criados

---

## 📞 Documentação Relacionada

Sempre consulte:

```
MODELO-NEGOCIO.md     ← Estratégia comercial
GUIA-PROPRIETARIO.md  ← Como usar tudo
API.md                ← Especificação técnica
BACKEND.md            ← Como rodar o servidor
SECURITY.md           ← Segurança e boas práticas
```

---

## 🎉 Você Está Pronto!

Seu negócio SaaS está configurado. Agora é:

1. ✅ Criar sua conta Admin Master
2. ✅ Começar a vender para municípios
3. ✅ Receber pagamentos
4. ✅ Fornecer suporte
5. ✅ Crescer! 📈

**Boa sorte com seu negócio! 💰**

---

**Cartão de Referência - Ciclo Integrado v1.0**
Imprima e guarde em lugar seguro!
