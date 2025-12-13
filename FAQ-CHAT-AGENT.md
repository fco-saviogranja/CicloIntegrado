# ❓ FAQ - Chat Agent (Modo Agent)

## Pergunta: O modo agent do chat tem limite?

### ✅ Resposta Direta: **SIM, o modo agent tem limites.**

---

## 🎯 Limites Definidos

### 1. **Limites de Taxa (Rate Limiting)**

Por usuário:
- ✅ **10 requisições por minuto**
- ✅ **100 requisições por hora**

Por município (depende do plano):
- ✅ **500-2.000 requisições por dia**
- ✅ **100.000-2.000.000 tokens por mês**

### 2. **Limites por Plano de Assinatura**

| Plano | Requisições/dia | Tokens/mês | Tamanho do Contexto |
|-------|----------------|------------|---------------------|
| **Básico** | 100 | 100.000 | 4.000 tokens |
| **Profissional** | 500 | 500.000 | 8.000 tokens |
| **Enterprise** | 2.000 | 2.000.000 | 16.000 tokens |

### 3. **Limites Técnicos**

- ✅ **Máximo de 1.000 caracteres** por mensagem
- ✅ **Máximo de 500 tokens** por resposta do agent
- ✅ **Máximo de 5 mensagens** mantidas no contexto
- ✅ **Timeout de 30 segundos** por requisição

---

## 🚨 O que acontece ao atingir o limite?

### Limite de Taxa (Rate Limit)
Quando você atinge **10 requisições por minuto**:

```json
{
  "error": "Limite de requisições excedido para o chat agent",
  "limite": 10,
  "periodo": "1 minuto",
  "retry_after": 60
}
```

**Status HTTP**: `429 Too Many Requests`

### Limite Mensal de Tokens
Quando você atinge **100% do seu limite mensal**:

```json
{
  "error": "Limite mensal de tokens excedido",
  "limite": 100000,
  "usado": 100000,
  "plano": "basico"
}
```

**Status HTTP**: `429 Too Many Requests`

**Solução**: 
- Aguardar o próximo mês
- Fazer upgrade do plano

---

## 📊 Como saber meu uso atual?

### Via API
```bash
GET /api/chat/usage
Authorization: Bearer {seu_token}
```

**Resposta:**
```json
{
  "plano": "profissional",
  "limite_mensal": 500000,
  "tokens_usados": 12450,
  "tokens_restantes": 487550,
  "percentual_usado": "2.49%"
}
```

### Via Dashboard
No dashboard do sistema, você verá:
- 🟢 **Verde**: 0-70% do limite usado
- 🟡 **Amarelo**: 71-90% do limite usado
- 🔴 **Vermelho**: 91-100% do limite usado

---

## ⚠️ Alertas Automáticos

O sistema envia alertas quando você atinge:

### 80% do Limite
```
⚠️ Aviso: Limite do Chat Agent Próximo
Você já usou 80% do seu limite mensal de tokens.
Considere fazer upgrade do seu plano.
```

### 100% do Limite
```
❌ Erro: Limite do Chat Agent Excedido
Seu limite mensal de tokens foi excedido. 
Faça upgrade do seu plano para continuar usando o chat agent.
```

---

## 💰 Custos por Plano

### Plano Básico - R$ 50/mês
- 100.000 tokens/mês
- 100 requisições/dia
- Contexto de 4k tokens

### Plano Profissional - R$ 150/mês
- 500.000 tokens/mês
- 500 requisições/dia
- Contexto de 8k tokens

### Plano Enterprise - R$ 500/mês
- 2.000.000 tokens/mês
- 2.000 requisições/dia
- Contexto de 16k tokens
- Suporte prioritário

---

## 🔧 Como Otimizar o Uso

### 1. Use Perguntas Diretas
❌ **Errado:**
> "Oi, tudo bem? Eu gostaria de saber como faço para cadastrar um novo contrato no sistema, por favor me explique passo a passo todo o processo detalhadamente."

✅ **Correto:**
> "Como cadastrar contrato?"

**Economia**: ~80 tokens

### 2. Aproveite o FAQ
Perguntas frequentes são respondidas **sem consumir tokens**:
- "Como cadastrar contrato?"
- "Esqueci minha senha"
- "Como renovar licença?"

### 3. Limite o Contexto
Evite conversas muito longas. O sistema mantém apenas as últimas 5 mensagens.

### 4. Use Cache
Perguntas repetidas são servidas do cache (não consomem tokens).

---

## 🛠️ Para Desenvolvedores

### Como Implementar os Limites

Veja a documentação completa em:
📖 **[CHAT-AGENT-LIMITS.md](CHAT-AGENT-LIMITS.md)**

Inclui:
- ✅ Código de implementação completo
- ✅ Middleware de rate limiting
- ✅ Contador de tokens
- ✅ Sistema de alertas
- ✅ Logs de auditoria
- ✅ Interface do usuário

### Dependências Necessárias
```bash
npm install express-rate-limit tiktoken openai validator redis
```

---

## 📈 Como Aumentar Meus Limites?

### Opção 1: Upgrade de Plano
Entre em contato com o administrador do sistema:
```
admin@ciclo-integrado.com
```

### Opção 2: Compra Adicional de Tokens
Pacotes extras disponíveis:
- 100k tokens extras: R$ 30
- 500k tokens extras: R$ 120
- 1M tokens extras: R$ 200

### Opção 3: Plano Enterprise Customizado
Para necessidades específicas, solicite um plano personalizado.

---

## 🔍 Perguntas Relacionadas

### O cache conta para o limite?
**Não.** Respostas vindas do cache **não consomem tokens**.

### Mensagens de erro contam?
**Não.** Apenas respostas bem-sucedidas do agent consomem tokens.

### O limite é compartilhado por todos os usuários do município?
**Sim.** O limite mensal de tokens é por município, mas o rate limiting é por usuário.

### Posso ver o histórico de uso?
**Sim.** Acesse o dashboard do administrador para ver:
- Tokens usados por dia/mês
- Usuários mais ativos
- Horários de pico
- Tipos de perguntas mais comuns

---

## 📞 Suporte

Dúvidas sobre limites do chat agent?

- 📧 **Email**: suporte@ciclo-integrado.com
- 📱 **Telefone**: (11) 9999-9999
- 💬 **Chat**: Segunda a Sexta, 9h às 18h
- 📖 **Documentação**: [CHAT-AGENT-LIMITS.md](CHAT-AGENT-LIMITS.md)

---

## ✅ Resumo Executivo

| Item | Limite |
|------|--------|
| Requisições por minuto | 10 |
| Requisições por dia | 100-2000 (depende do plano) |
| Tokens por mês | 100k-2M (depende do plano) |
| Caracteres por mensagem | 1.000 |
| Tokens por resposta | 500 |
| Timeout | 30 segundos |

**Recomendação**: Comece com o plano Básico e faça upgrade conforme necessário.

---

**Última atualização**: 8 de dezembro de 2025
**Versão**: 1.0
