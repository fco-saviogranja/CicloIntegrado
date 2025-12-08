# Dashboard Administrativo - Documentação

## 📊 Visão Geral

O Dashboard Administrativo é a interface central de gerenciamento do sistema Ciclo Integrado para o proprietário (admin_master). Oferece visibilidade completa sobre todos os municípios cadastrados, usuários, receita, e licenças.

## 🎯 Funcionalidades Principais

### 1. **Dashboard Overview**
- Total de municípios ativos
- Total de usuários no sistema
- Receita mensal e anual
- Licenças vencendo nos próximos 30 dias
- Gráficos de tendência de receita
- Distribuição de planos (Standard, Profissional, Premium)

### 2. **Gestão de Municípios**
- Visualizar lista de todos os municípios
- Criar novos municípios
- Editar dados do município
- Deletar município
- Acompanhar licenças vencendo
- Visualizar estatísticas por município

### 3. **Gestão de Usuários por Role**
- **4 Roles Hierárquicos:**
  1. `admin_master` - Proprietário do sistema (você)
  2. `admin_municipio` - Administrador do município
  3. `gestor_contrato` - Gestor de contratos
  4. `fiscal_contrato` - Fiscal de contratos

- Criar usuários com roles específicos
- Editar perfil de usuários
- Resetar senhas
- Deletar usuários
- Visualizar estatísticas por role

### 4. **Faturamento e Receita**
- Receita total anual
- Receita por município
- Receita por plano
- Previsão mensal

### 5. **Relatórios**
- Licenças vencendo em breve
- Uso de recursos por município
- Estatísticas de usuários por role

## 🔑 Hierarquia de Roles

```
Admin Master (Proprietário)
├── Acesso total ao sistema
├── Visualizar todos os municípios
├── Gerenciar usuários de todos os níveis
└── Acessar dashboard de receita

├─ Município 1
│  ├── Admin Municipio
│  │   ├── Gerencia usuários do município
│  │   ├── Acessa contratos do município
│  │   └── Gera relatórios municipais
│  │
│  ├── Gestor de Contrato (múltiplos)
│  │   ├── Cria e edita contratos
│  │   └── Acompanha execução
│  │
│  └── Fiscal de Contrato (múltiplos)
│      ├── Valida contratos
│      └── Gera relatórios de fiscalização
│
└─ Município 2 (mesmo padrão...)
```

## 📍 Localização da Página

**Arquivo:** `pages/admin-dashboard.html`

**Acesso:**
```
http://localhost:8888/pages/admin-dashboard.html
```

## 🔌 Endpoints da API

### Autenticação

```http
POST /auth/login
Content-Type: application/json

{
  "email": "seu-email@ciclo-integrado.com",
  "password": "sua-senha"
}

Response:
{
  "token": "jwt-token-aqui",
  "user": {
    "id": "user-id",
    "email": "seu-email@ciclo-integrado.com",
    "role": "admin_master",
    "name": "Seu Nome"
  }
}
```

### Municípios (Admin Master Only)

#### Listar todos os municípios
```http
GET /admin/municipalities
Authorization: Bearer {token}

Response:
{
  "total": 5,
  "municipalities": [
    {
      "id": "sao-paulo",
      "municipio_id": "sao-paulo",
      "municipio_nome": "Prefeitura de São Paulo",
      "license_type": "premium",
      "license_expires": "2025-12-31T00:00:00.000Z",
      "max_users": 100,
      "max_contracts": 500,
      "status": "active",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Criar município
```http
POST /admin/municipalities
Authorization: Bearer {token}
Content-Type: application/json

{
  "municipio_id": "novo-municipio",
  "municipio_nome": "Prefeitura de Nova Cidade",
  "estado": "SP",
  "cep": "12345-678",
  "admin_email": "admin@novaciidade.gov.br",
  "admin_name": "Admin Name",
  "license_type": "profissional",
  "license_expires": "2025-12-31T00:00:00.000Z",
  "max_users": 50,
  "max_contracts": 500
}

Response:
{
  "message": "Município criado com sucesso",
  "municipio": { ... },
  "admin_email": "admin@novaciidade.gov.br",
  "temporary_password": "Mudar123!",
  "warning": "Admin deve mudar a senha na primeira vez que fazer login"
}
```

#### Obter detalhes do município
```http
GET /admin/municipalities/{municipio_id}
Authorization: Bearer {token}

Response:
{
  "municipio": { ... },
  "statistics": {
    "users": 42,
    "contracts": 156,
    "usage_percent": 84
  }
}
```

#### Atualizar município
```http
PUT /admin/municipalities/{municipio_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "license_type": "premium",
  "max_users": 150
}

Response:
{
  "message": "Município atualizado com sucesso",
  "municipio_id": "sao-paulo"
}
```

#### Deletar município
```http
DELETE /admin/municipalities/{municipio_id}
Authorization: Bearer {token}

Response: 204 No Content
```

### Usuários (Admin Master Only)

#### Listar usuários com filtros
```http
GET /admin/users?role=admin_municipio&municipio_id=sao-paulo&status=active
Authorization: Bearer {token}

Response:
{
  "total": 3,
  "usuarios": [
    {
      "id": "user-id",
      "email": "admin@municipio.gov.br",
      "name": "Admin Municipal",
      "role": "admin_municipio",
      "municipio_id": "sao-paulo",
      "municipio_nome": "Prefeitura de São Paulo",
      "status": "active",
      "created_at": "2024-01-15T10:00:00.000Z",
      "last_login": "2024-01-20T14:30:00.000Z"
    }
  ]
}
```

#### Criar usuário
```http
POST /admin/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "novo-usuario@municipio.gov.br",
  "password": "SenhaForte123!",
  "name": "Nome do Usuário",
  "role": "gestor_contrato",
  "municipio_id": "sao-paulo",
  "municipio_nome": "Prefeitura de São Paulo",
  "phone": "(11) 9999-9999",
  "cpf": "123.456.789-00"
}

Response:
{
  "message": "Usuário criado com sucesso",
  "user_id": "doc-id",
  "usuario": { ... }
}
```

#### Obter detalhes do usuário
```http
GET /admin/users/{user_id}
Authorization: Bearer {token}

Response:
{
  "usuario": { ... }
}
```

#### Atualizar usuário
```http
PUT /admin/users/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Novo Nome",
  "role": "admin_municipio",
  "status": "active"
}

Response:
{
  "message": "Usuário atualizado com sucesso",
  "user_id": "user-id"
}
```

#### Deletar usuário
```http
DELETE /admin/users/{user_id}
Authorization: Bearer {token}

Response: 204 No Content
```

#### Estatísticas de usuários por role
```http
GET /admin/users/statistics
Authorization: Bearer {token}

Response:
{
  "statistics": {
    "admin_master": 1,
    "admin_municipio": 5,
    "gestor_contrato": 23,
    "fiscal_contrato": 18,
    "total": 47
  }
}
```

### Receita (Admin Master Only)

#### Obter dados de receita
```http
GET /admin/revenue?period=12months
Authorization: Bearer {token}

Response:
{
  "revenue": {
    "total_annual": 200000,
    "monthly_average": 16666.67,
    "by_municipality": {
      "Prefeitura de São Paulo": 30000,
      "Prefeitura do Rio de Janeiro": 15000,
      "Prefeitura de Brasília": 15000,
      "Prefeitura de Salvador": 5000,
      "Prefeitura de Fortaleza": 30000
    },
    "by_plan": {
      "standard": 10000,
      "profissional": 60000,
      "premium": 130000
    },
    "timestamp": "2024-01-20T14:35:00.000Z"
  }
}
```

### Relatórios (Admin Master Only)

#### Licenças vencendo em breve
```http
GET /admin/reports/expiring-licenses?days=30
Authorization: Bearer {token}

Response:
{
  "expiring_licenses": [
    {
      "municipio_id": "brasilia",
      "municipio_nome": "Prefeitura de Brasília",
      "license_type": "profissional",
      "expires_at": "2025-03-10T00:00:00.000Z",
      "days_until_expiry": 48
    },
    {
      "municipio_id": "rio-janeiro",
      "municipio_nome": "Prefeitura do Rio de Janeiro",
      "license_type": "profissional",
      "expires_at": "2025-06-15T00:00:00.000Z",
      "days_until_expiry": 146
    }
  ],
  "total_expiring": 2,
  "period_days": 30
}
```

#### Estatísticas por município
```http
GET /admin/reports/municipality-stats
Authorization: Bearer {token}

Response:
{
  "municipalities_stats": [
    {
      "municipio_id": "sao-paulo",
      "municipio_nome": "Prefeitura de São Paulo",
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
      },
      "license_expires": "2025-12-31T00:00:00.000Z",
      "status": "active"
    }
  ],
  "total_municipalities": 5
}
```

## 🎨 Componentes da Interface

### Sidebar Navigation
- Dashboard
- Municípios
- Usuários
- Faturamento
- Relatórios
- Configurações

### Métricas Principais
- **Total Municípios**: Card azul com ícone de prédio
- **Total Usuários**: Card verde com ícone de grupo
- **Receita Mensal**: Card amarelo com ícone de tendência
- **Licenças Vencendo**: Card vermelho com ícone de aviso

### Gráficos
- Receita (Últimos 12 Meses) - Gráfico de linha/área
- Distribuição por Plano - Gráfico de barras horizontal

### Tabelas
- Tabela de Municípios
- Tabela de Licenças Vencendo
- Tabela de Usuários

### Modais
- Criar Novo Município
- Editar Município
- Deletar Município (confirmação)
- Criar Novo Usuário
- Editar Usuário

## 🔐 Permissões

### Admin Master (Você)
- ✅ Visualizar todos os dados
- ✅ Criar/Editar/Deletar municípios
- ✅ Criar/Editar/Deletar usuários de qualquer role
- ✅ Resetar senhas
- ✅ Visualizar relatórios completos
- ✅ Acessar faturamento

### Admin Municipio
- ✅ Gerenciar usuários do próprio município
- ✅ Visualizar contratos do município
- ✅ Gerar relatórios municipais
- ❌ Acessar dados de outros municípios
- ❌ Gerenciar faturamento

### Gestor de Contrato
- ✅ Criar e editar contratos
- ✅ Visualizar contratos do município
- ❌ Deletar contratos (apenas admin)
- ❌ Gerenciar usuários

### Fiscal de Contrato
- ✅ Visualizar contratos
- ✅ Adicionar observações
- ✅ Gerar relatórios de fiscalização
- ❌ Editar contratos

## 🚀 Como Usar

### 1. Acessar o Dashboard
1. Faça login com suas credenciais de admin_master
2. Você será redirecionado para o dashboard automaticamente

### 2. Criar Novo Município
1. Clique em "Novo Município"
2. Preencha os dados:
   - Nome do Município
   - Email do Administrador
   - Plano (Standard/Profissional/Premium)
   - Máximo de Usuários
3. Clique em "Criar"
4. Compartilhe a senha temporária com o administrador do município

### 3. Gerenciar Usuários
1. Acesse a aba "Usuários"
2. Clique em "Novo Usuário" ou edite um existente
3. Selecione o role apropriado
4. Especifique o município (se não for admin_master)

### 4. Acompanhar Receita
1. Acesse a aba "Faturamento"
2. Visualize gráficos de receita
3. Exporte dados para análise

### 5. Acompanhar Licenças
1. No dashboard principal, veja a seção "Licenças Vencendo"
2. Clique em "Renovar" para processar renovação
3. Configure alertas automáticos (em desenvolvimento)

## 📊 Preços dos Planos

| Plano | Preço Anual | Usuários Max | Contratos Max |
|-------|-------------|--------------|---------------|
| Standard | R$ 5.000 | 20 | 500 |
| Profissional | R$ 15.000 | 50 | 500 |
| Premium | R$ 30.000 | 100 | 500 |

## 🔧 Desenvolvimento Futuro

- [ ] Gráficos interativos com Chart.js
- [ ] Exportar relatórios em PDF
- [ ] Webhooks para eventos de licença
- [ ] Integração com sistemas de pagamento
- [ ] Dashboard em tempo real com WebSockets
- [ ] Autenticação 2FA
- [ ] Auditoria completa de ações
- [ ] Backup automático de dados
- [ ] API de integração para terceiros

## 📝 Notas Importantes

1. **Senha Temporária**: Quando você cria um novo município, uma senha temporária é gerada. Compartilhe com o administrador do município via canal seguro.

2. **Data de Expiração**: As licenças são anuais. Configure lembretes para renovação com antecedência.

3. **Limite de Usuários**: Cada município tem um limite de usuários baseado no plano contratado.

4. **Segurança**: Todos os acessos são registrados em auditoria. Nunca compartilhe sua credencial de admin_master.

5. **Backup**: Os dados são automaticamente sincronizados com Google Firestore e têm backup diário.

## 📞 Suporte

Para questões técnicas ou relatórios de bugs:
1. Consulte a documentação em CONTRIBUTING.md
2. Verifique os logs do sistema em STATUS-FINAL.txt
3. Execute testes com test-system.ps1

---

**Versão:** 1.0.0  
**Último Update:** Janeiro 2024  
**Proprietário:** Ciclo Integrado SaaS
