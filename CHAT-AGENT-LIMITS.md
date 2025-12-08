# 🤖 Limites do Modo Agent do Chat

## 📋 Visão Geral

Este documento define os limites e boas práticas para implementação de um modo agent (assistente AI) no sistema Ciclo Integrado.

---

## ⚠️ Limites Recomendados

### 1. Rate Limiting (Limitação de Taxa)

#### Por Usuário
```
- Requisições por minuto: 10
- Requisições por hora: 100
- Requisições por dia: 500
```

#### Por Município
```
- Requisições por hora: 500
- Requisições por dia: 5.000
- Tokens por mês: 1.000.000
```

#### Por Plano
| Plano | Req/dia | Tokens/mês | Contexto |
|-------|---------|------------|----------|
| Básico | 100 | 100.000 | 4k tokens |
| Profissional | 500 | 500.000 | 8k tokens |
| Enterprise | 2.000 | 2.000.000 | 16k tokens |

---

## 🔧 Implementação Técnica

### 1. Rate Limiter no Backend

```javascript
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Rate limiter para chat agent
const chatAgentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requisições por minuto
  message: {
    error: 'Limite de requisições excedido para o chat agent',
    limite: 10,
    periodo: '1 minuto',
    retry_after: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Identificar usuário por token JWT
  keyGenerator: (req) => {
    return req.user?.uid || req.ip;
  }
});

module.exports = { chatAgentLimiter };
```

### 2. Controle de Tokens

```javascript
// backend/services/tokenCounter.js
const { encoding_for_model } = require('tiktoken');

class TokenCounter {
  constructor(model = 'gpt-3.5-turbo') {
    this.encoding = encoding_for_model(model);
    this.maxTokensPerRequest = 4000;
    this.maxTokensPerMonth = {
      basico: 100000,
      profissional: 500000,
      enterprise: 2000000
    };
  }

  // Contar tokens de uma mensagem
  countTokens(text) {
    return this.encoding.encode(text).length;
  }

  // Verificar se usuário excedeu limite mensal
  async checkMonthlyLimit(userId, municipioId) {
    const db = admin.firestore();
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Buscar uso do mês
    const usageDoc = await db
      .collection('chat_usage')
      .doc(`${municipioId}_${now.getFullYear()}_${now.getMonth() + 1}`)
      .get();

    if (!usageDoc.exists) {
      return { allowed: true, used: 0 };
    }

    const usage = usageDoc.data();
    const municipioDoc = await db.collection('municipios').doc(municipioId).get();
    const plano = municipioDoc.data().plano || 'basico';
    const limit = this.maxTokensPerMonth[plano];

    return {
      allowed: usage.total_tokens < limit,
      used: usage.total_tokens,
      limit: limit,
      remaining: limit - usage.total_tokens
    };
  }

  // Registrar uso de tokens
  async recordUsage(userId, municipioId, tokensUsed) {
    const db = admin.firestore();
    const now = new Date();
    const monthKey = `${municipioId}_${now.getFullYear()}_${now.getMonth() + 1}`;

    await db.collection('chat_usage').doc(monthKey).set({
      municipio_id: municipioId,
      mes: now.getMonth() + 1,
      ano: now.getFullYear(),
      total_tokens: admin.firestore.FieldValue.increment(tokensUsed),
      ultima_atualizacao: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Registrar uso por usuário
    await db.collection('chat_usage').doc(monthKey).collection('usuarios').doc(userId).set({
      user_id: userId,
      tokens_usados: admin.firestore.FieldValue.increment(tokensUsed),
      ultima_requisicao: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

module.exports = TokenCounter;
```

### 3. Endpoint do Chat Agent

```javascript
// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const { chatAgentLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/auth');
const TokenCounter = require('../services/tokenCounter');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const tokenCounter = new TokenCounter();

// POST /api/chat - Enviar mensagem para o agent
router.post('/', authenticateToken, chatAgentLimiter, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.uid;
    const municipioId = req.user.municipio_id;

    // Validar mensagem
    if (!message || message.length < 1) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Mensagem muito longa (max 1000 caracteres)' });
    }

    // Verificar limite mensal de tokens
    const limitCheck = await tokenCounter.checkMonthlyLimit(userId, municipioId);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: 'Limite mensal de tokens excedido',
        limite: limitCheck.limit,
        usado: limitCheck.used,
        plano: req.user.plano || 'basico'
      });
    }

    // Contar tokens da mensagem
    const inputTokens = tokenCounter.countTokens(message);

    // Criar contexto do sistema
    const systemPrompt = `Você é um assistente do sistema Ciclo Integrado, 
especializado em gestão de contratos municipais. 
Ajude o usuário com informações sobre contratos, prazos e documentação.`;

    // Chamar OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    const outputTokens = tokenCounter.countTokens(response);
    const totalTokens = inputTokens + outputTokens;

    // Registrar uso
    await tokenCounter.recordUsage(userId, municipioId, totalTokens);

    // Retornar resposta
    res.json({
      resposta: response,
      tokens_usados: totalTokens,
      limite_restante: limitCheck.remaining - totalTokens,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no chat agent:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
});

// GET /api/chat/usage - Verificar uso de tokens
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const municipioId = req.user.municipio_id;

    const limitCheck = await tokenCounter.checkMonthlyLimit(userId, municipioId);

    res.json({
      plano: req.user.plano || 'basico',
      limite_mensal: limitCheck.limit,
      tokens_usados: limitCheck.used,
      tokens_restantes: limitCheck.remaining,
      percentual_usado: ((limitCheck.used / limitCheck.limit) * 100).toFixed(2) + '%'
    });
  } catch (error) {
    console.error('Erro ao buscar uso:', error);
    res.status(500).json({ error: 'Erro ao buscar informações de uso' });
  }
});

module.exports = router;
```

---

## 📊 Monitoramento

### 1. Dashboard de Uso

Adicionar ao `admin-dashboard.html`:

```html
<!-- Card de Uso do Chat Agent -->
<div class="card">
  <div class="card-header">
    <h3>🤖 Uso do Chat Agent</h3>
  </div>
  <div class="card-body">
    <div class="metric">
      <span>Tokens Usados (Mês)</span>
      <strong id="tokens-usados">0</strong>
    </div>
    <div class="metric">
      <span>Limite Mensal</span>
      <strong id="tokens-limite">0</strong>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" id="tokens-progress"></div>
    </div>
  </div>
</div>
```

### 2. Logs de Auditoria

```javascript
// Registrar todas as interações
async function logChatInteraction(userId, municipioId, message, response, tokens) {
  const db = admin.firestore();
  
  await db.collection('chat_logs').add({
    user_id: userId,
    municipio_id: municipioId,
    mensagem_usuario: message.substring(0, 100), // Primeiros 100 chars
    resposta_tamanho: response.length,
    tokens_usados: tokens,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ip: req.ip,
    user_agent: req.get('user-agent')
  });
}
```

---

## 🔒 Segurança

### 1. Sanitização de Entrada

```javascript
const validator = require('validator');

function sanitizeMessage(message) {
  // Remover scripts
  let clean = validator.escape(message);
  
  // Limitar tamanho
  clean = clean.substring(0, 1000);
  
  // Remover caracteres especiais perigosos
  clean = clean.replace(/[<>\"\']/g, '');
  
  return clean;
}
```

### 2. Filtro de Conteúdo Sensível

```javascript
const sensitivePatterns = [
  /senha/gi,
  /password/gi,
  /token/gi,
  /api[_\s]?key/gi,
  /secret/gi
];

function containsSensitiveData(message) {
  return sensitivePatterns.some(pattern => pattern.test(message));
}

// No endpoint
if (containsSensitiveData(message)) {
  return res.status(400).json({
    error: 'Mensagem contém dados sensíveis. Não compartilhe senhas ou tokens.'
  });
}
```

---

## 💰 Custos Estimados

### OpenAI GPT-3.5-turbo

| Plano | Tokens/mês | Custo Estimado |
|-------|------------|----------------|
| Básico | 100.000 | $0.15 USD |
| Profissional | 500.000 | $0.75 USD |
| Enterprise | 2.000.000 | $3.00 USD |

*Preços baseados em $0.0015 por 1K tokens (média input + output)*

### Recomendações de Margem
- Cobrar 3-5x o custo do token
- Exemplo: Plano Profissional = R$ 15/mês (500k tokens)

---

## 🚨 Alertas e Notificações

### 1. Alerta de Limite Próximo

```javascript
// Enviar alerta quando atingir 80% do limite
async function checkAndAlert(municipioId, usage, limit) {
  const percentage = (usage / limit) * 100;
  
  if (percentage >= 80 && percentage < 100) {
    await sendAlert(municipioId, {
      tipo: 'chat_agent_limite',
      titulo: 'Limite do Chat Agent Próximo',
      mensagem: `Você já usou ${percentage.toFixed(0)}% do seu limite mensal de tokens.`,
      nivel: 'warning'
    });
  }
  
  if (percentage >= 100) {
    await sendAlert(municipioId, {
      tipo: 'chat_agent_excedido',
      titulo: 'Limite do Chat Agent Excedido',
      mensagem: 'Seu limite mensal de tokens foi excedido. Upgrade seu plano para continuar usando o chat agent.',
      nivel: 'error'
    });
  }
}
```

---

## 📝 Variáveis de Ambiente

Adicionar ao `.env`:

```bash
# Chat Agent Configuration
OPENAI_API_KEY=sk-...
CHAT_RATE_LIMIT_WINDOW=60000    # 1 minuto em ms
CHAT_RATE_LIMIT_MAX=10          # Max requisições por janela
CHAT_MAX_TOKENS_PER_REQUEST=500
CHAT_MODEL=gpt-3.5-turbo

# Limites por Plano (tokens/mês)
CHAT_LIMIT_BASICO=100000
CHAT_LIMIT_PROFISSIONAL=500000
CHAT_LIMIT_ENTERPRISE=2000000
```

---

## 🎯 Boas Práticas

### 1. Cache de Respostas
```javascript
// Usar Redis para cachear perguntas frequentes
const redis = require('redis');
const client = redis.createClient();

async function getCachedResponse(messageHash) {
  return await client.get(`chat:${messageHash}`);
}

async function cacheResponse(messageHash, response) {
  await client.setex(`chat:${messageHash}`, 3600, response); // 1 hora
}
```

### 2. Respostas Pré-programadas
```javascript
const FAQ = {
  'como cadastrar contrato': 'Para cadastrar um novo contrato...',
  'esqueci minha senha': 'Clique em "Esqueci minha senha" na tela de login...',
  'como renovar licença': 'Entre em contato com o administrador...'
};

// Verificar FAQ antes de chamar API
const faqResponse = FAQ[message.toLowerCase()];
if (faqResponse) {
  return res.json({ resposta: faqResponse, from_faq: true, tokens_usados: 0 });
}
```

### 3. Contexto Limitado
```javascript
// Limitar histórico de conversação
const MAX_HISTORY = 5; // Últimas 5 mensagens

function limitHistory(messages) {
  return messages.slice(-MAX_HISTORY);
}
```

---

## 📱 Interface do Usuário

### Exemplo de Componente Chat

```html
<!-- pages/chat-agent.html -->
<div class="chat-container">
  <div class="chat-header">
    <h3>🤖 Assistente Ciclo Integrado</h3>
    <div class="usage-indicator">
      <span id="tokens-remaining">0</span> tokens restantes
    </div>
  </div>
  
  <div class="chat-messages" id="chat-messages">
    <!-- Mensagens aqui -->
  </div>
  
  <div class="chat-input">
    <input 
      type="text" 
      id="message-input" 
      placeholder="Digite sua mensagem..."
      maxlength="1000"
    />
    <button onclick="sendMessage()">Enviar</button>
  </div>
  
  <div class="chat-disclaimer">
    ⚠️ Este é um assistente AI. Sempre verifique informações importantes.
  </div>
</div>

<script>
async function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Mostrar mensagem do usuário
  addMessage('user', message);
  input.value = '';
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ message })
    });
    
    if (response.status === 429) {
      const data = await response.json();
      addMessage('system', `⚠️ ${data.error}. Você usou ${data.usado} de ${data.limite} tokens.`);
      return;
    }
    
    const data = await response.json();
    
    // Mostrar resposta do agent
    addMessage('agent', data.resposta);
    
    // Atualizar contador de tokens
    document.getElementById('tokens-remaining').textContent = data.limite_restante;
    
  } catch (error) {
    addMessage('system', '❌ Erro ao enviar mensagem. Tente novamente.');
  }
}

function addMessage(type, content) {
  const messagesDiv = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = content;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
</script>
```

---

## ✅ Checklist de Implementação

- [ ] Instalar dependências (`express-rate-limit`, `tiktoken`, `openai`)
- [ ] Configurar variáveis de ambiente
- [ ] Criar middleware de rate limiting
- [ ] Implementar contador de tokens
- [ ] Criar endpoint `/api/chat`
- [ ] Implementar logging de auditoria
- [ ] Adicionar dashboard de monitoramento
- [ ] Criar tela de chat para usuários
- [ ] Configurar alertas de limite
- [ ] Testar com diferentes planos
- [ ] Documentar API no `API.md`
- [ ] Adicionar testes automatizados

---

## 🔗 Referências

- [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Tiktoken](https://github.com/openai/tiktoken)
- [Best Practices for Production](https://platform.openai.com/docs/guides/production-best-practices)

---

**Última atualização**: 8 de dezembro de 2025
**Versão**: 1.0
