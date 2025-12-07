# Documentação da API - Ciclo Integrado

## Base URL

```
https://api.ciclo-integrado.com/v1
```

## Autenticação

Todas as requisições devem incluir o token JWT no header:

```
Authorization: Bearer {token}
```

## Endpoints

### Autenticação

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@municipio.gov",
  "password": "senha",
  "municipio_id": "mun_123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "name": "João Silva",
    "email": "joao@municipio.gov",
    "role": "admin"
  },
  "expires_in": 3600
}
```

### Contratos

#### Listar Contratos
```
GET /contratos?page=1&limit=20&status=ativo

Response:
{
  "data": [
    {
      "id": "ct_123",
      "numero": "MUN-2024-0345",
      "fornecedor": "Urban Solutions Inc.",
      "valor": 150000.00,
      "data_inicio": "2024-01-15",
      "data_vencimento": "2024-12-31",
      "status": "ativo",
      "secretaria": "Obras Públicas"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1234,
    "pages": 62
  }
}
```

#### Criar Contrato
```
POST /contratos
Content-Type: application/json

{
  "numero": "MUN-2025-0001",
  "fornecedor_id": "forn_123",
  "valor": 250000.00,
  "data_inicio": "2025-01-01",
  "data_vencimento": "2025-12-31",
  "secretaria_id": "sec_123",
  "descricao": "Descrição do contrato"
}

Response:
{
  "id": "ct_124",
  "numero": "MUN-2025-0001",
  "status": "rascunho",
  "created_at": "2025-01-07T10:30:00Z"
}
```

#### Obter Contrato
```
GET /contratos/{id}

Response:
{
  "id": "ct_123",
  "numero": "MUN-2024-0345",
  "fornecedor": {...},
  "valor": 150000.00,
  "data_inicio": "2024-01-15",
  "data_vencimento": "2024-12-31",
  "status": "ativo",
  "descricao": "...",
  "arquivos": [...],
  "historico": [...]
}
```

#### Atualizar Contrato
```
PUT /contratos/{id}
Content-Type: application/json

{
  "status": "renovado",
  "data_vencimento": "2026-12-31"
}

Response: 200 OK
```

#### Deletar Contrato
```
DELETE /contratos/{id}

Response: 204 No Content
```

### Usuários

#### Listar Usuários
```
GET /usuarios?page=1&limit=20

Response:
{
  "data": [
    {
      "id": "user_123",
      "name": "João Silva",
      "email": "joao@municipio.gov",
      "role": "admin",
      "status": "ativo",
      "last_login": "2025-01-07T09:15:00Z"
    }
  ],
  "pagination": {...}
}
```

#### Criar Usuário
```
POST /usuarios
Content-Type: application/json

{
  "name": "Maria Santos",
  "email": "maria@municipio.gov",
  "role": "analista",
  "municipio_id": "mun_123"
}

Response:
{
  "id": "user_124",
  "name": "Maria Santos",
  "email": "maria@municipio.gov",
  "role": "analista",
  "status": "ativo",
  "created_at": "2025-01-07T10:30:00Z"
}
```

### Notificações

#### Obter Notificações
```
GET /notificacoes?read=false

Response:
{
  "data": [
    {
      "id": "notif_123",
      "titulo": "Contrato próximo ao vencimento",
      "mensagem": "MUN-2024-0345 vence em 7 dias",
      "tipo": "aviso",
      "lido": false,
      "created_at": "2025-01-07T08:00:00Z"
    }
  ]
}
```

#### Marcar Notificação como Lida
```
PUT /notificacoes/{id}/lido

Response: 200 OK
```

### Relatórios

#### Gerar Relatório
```
POST /relatorios
Content-Type: application/json

{
  "tipo": "contratos_por_secretaria",
  "data_inicio": "2025-01-01",
  "data_fim": "2025-12-31",
  "formato": "pdf"
}

Response:
{
  "id": "rel_123",
  "url_download": "https://...",
  "status": "pronto",
  "created_at": "2025-01-07T10:30:00Z"
}
```

## Status Codes

| Código | Significado |
|--------|-------------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado |
| 204 | No Content - Sucesso sem conteúdo |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro do servidor |

## Erros

### Formato de Erro
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Email é obrigatório",
    "details": [
      {
        "field": "email",
        "message": "Campo obrigatório"
      }
    ]
  }
}
```

## Rate Limiting

Limite: 100 requisições por minuto por usuário

Headers de resposta:
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 99`
- `X-RateLimit-Reset: 1234567890`

## Paginação

Todos os endpoints que retornam listas suportam paginação:

```
GET /contratos?page=1&limit=20&sort=-created_at&search=termo
```

Parâmetros:
- `page`: Número da página (padrão: 1)
- `limit`: Registros por página (padrão: 20, máximo: 100)
- `sort`: Campo para ordenação (prefixo `-` para descendente)
- `search`: Termo de busca

## Webhooks (Futuro)

```
POST https://seu-dominio.com/webhooks/ciclo-integrado

Tipos:
- contract.created
- contract.updated
- contract.expired
- user.invited
- notification.sent
```

## Exemplos de Implementação

### JavaScript / Fetch API

```javascript
// Login
const response = await fetch('https://api.ciclo-integrado.com/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@municipio.gov',
    password: 'senha'
  })
});

const { token } = await response.json();

// Requisição autenticada
fetch('https://api.ciclo-integrado.com/v1/contratos', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Changelog

### v1.0.0
- Endpoints iniciais de autenticação
- CRUD de contratos
- Gestão de usuários
- Sistema de notificações

---

**Última atualização**: 7 de dezembro de 2025
