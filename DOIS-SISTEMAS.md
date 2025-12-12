# 🎯 Ciclo Integrado - Dois Sistemas Integrados

## Sistema de Login Unificado

O Ciclo Integrado possui **um único login**, mas que direciona para **dois sistemas diferentes** baseado no role do usuário:

```
                    LOGIN.HTML
                   (Página Única)
                        ↓
            ┌───────────────────────┐
            │  Verificar Role       │
            └───────────┬───────────┘
                        ↓
        ┌───────────────────────────────┐
        │                               │
    ✓ admin_master             ✓ admin_municipio
        │                       │ gestor_contrato
        │                       │ fiscal_contrato
        ↓                       ↓
   ADMIN MASTER          CICLO INTEGRADO
   DASHBOARD               DASHBOARD
                          (Sistema Municipal)
```

---

## 1️⃣ **ADMIN MASTER DASHBOARD**

**Para:** Proprietário do Sistema  
**Email:** `admin@ciclointegrado.online`  
**Senha:** `Platao3914#Mouse`  
**Role:** `admin_master`  
**URL após login:** `/pages/admin-dashboard.html`

### Funcionalidades:
- 📊 Visão geral de todos os municípios
- 💰 Gerenciamento de faturamento e licenças
- 👥 Gerenciamento de adminuserss dos municípios
- 📈 Relatórios de uso do sistema
- 🔐 Configurações de segurança globais

---

## 2️⃣ **CICLO INTEGRADO - SISTEMA MUNICIPAL**

**Para:** Usuários dos Municípios  
**Exemplos de Emails:**
- `controleinterno@jardim.ce.gov.br`
- `gestor@municipio.gov.br`
- `fiscal@municipio.gov.br`

**Roles Disponíveis:**
- `admin_municipio` - Gerenciador do município
- `gestor_contrato` - Gestor de contratos
- `fiscal_contrato` - Fiscal de contratos

**URL após login:** `/pages/ciclo-dashboard.html`

### Funcionalidades:
- 📑 Gestão de contratos do município
- 📊 Dashboard com estatísticas
- 👥 Gerenciamento de usuários locais
- 📧 Notificações e alertas
- 📄 Geração de relatórios
- 📝 Cadastro de novos contratos
- 🔍 Detalhes e histórico de contratos

---

## 🔀 Fluxo de Login

### Passo 1: Acesso à Página de Login
```
URL: https://ciclointegrado.online/login.html
```

### Passo 2: Insira Credenciais
```json
{
  "email": "seu-email@dominio.com.br",
  "password": "sua-senha"
}
```

### Passo 3: Sistema Valida no Backend
```javascript
POST /auth/login
{
  "email": "...",
  "password": "..."
}
```

### Passo 4: Backend Retorna Role do Usuário
```json
{
  "success": true,
  "token": "...",
  "user": {
    "id": "...",
    "email": "...",
    "role": "admin_master" // ou "admin_municipio", "gestor_contrato", etc
  }
}
```

### Passo 5: Frontend Redireciona
```javascript
if (user.role === 'admin_master') {
  window.location.href = '/pages/admin-dashboard.html';
} else {
  window.location.href = '/pages/ciclo-dashboard.html';
}
```

---

## 📋 Tabela de Usuários

| Email | Senha | Role | Sistema | Status |
|-------|-------|------|---------|--------|
| `admin@ciclointegrado.online` | `Platao3914#Mouse` | `admin_master` | Admin Dashboard | ✅ Ativo |
| `controleinterno@jardim.ce.gov.br` | `Platao3914#Mouse` | `admin_municipio` | Ciclo Integrado | ✅ Ativo |

---

## 🔐 Segurança

### Token JWT
- **Duração:** 24 horas
- **Armazenamento:** localStorage (chave: `token`)
- **Validação:** Incluso em cada requisição no header `Authorization: Bearer <token>`

### Proteção de Rotas
- Sem token = redirecionado para login
- Token expirado = redirecionado para login
- Role inválido = acesso negado

---

## 🚀 Próximos Passos

1. ✅ Teste admin_master:
   ```
   Email: admin@ciclointegrado.online
   Senha: Platao3914#Mouse
   ```

2. ✅ Teste usuário municipal:
   ```
   Email: controleinterno@jardim.ce.gov.br
   Senha: Platao3914#Mouse
   ```

3. ⚠️ **IMPORTANTE:** Alterar as senhas padrão em produção!

---

## 📞 Troubleshooting

### "Senha incorreta"
- Verifique se a senha está digitada corretamente
- Certifique-se de usar Caps Lock

### "Usuário não encontrado"
- Email não existe no Firestore
- Verifique o email cadastrado

### Login bem-sucedido mas não redireciona
- Limpar cache do navegador (Ctrl+Shift+Delete)
- Verificar console (F12) para erros
- Verifiar se o arquivo HTML da página de destino existe

---

## 📝 Notas de Desenvolvimento

- Sistema usa **Firebase Authentication** no backend
- Token JWT assinado com secret no backend
- Dois sistemas HTML separados mas mesmo login
- Redirecionamento automático baseado em role
