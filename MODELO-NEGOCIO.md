# 💼 MODELO DE NEGÓCIO - CICLO INTEGRADO

## 👑 Você como Proprietário do Sistema

Você é o **Admin Master (Proprietário)** do Ciclo Integrado. Abaixo estão suas credenciais, permissões e como o modelo funciona.

---

## 🔐 SUAS CREDENCIAIS (Admin Master)

### Email Padrão (Recomendado)
```
Email: admin@ciclo-integrado.com
Senha: Sua-Senha-Segura-Aqui (Você escolhe)
Municipio: SISTEMA (proprietário do sistema geral)
Role: admin_master
```

### Configuração Inicial

**Você deve criar sua conta no Firestore com:**

```json
{
  "email": "admin@ciclo-integrado.com",
  "password": "sua-senha-super-segura",
  "name": "Proprietário - Ciclo Integrado",
  "role": "admin_master",
  "municipio_id": "SISTEMA",
  "municipio_nome": "Sistema Central",
  "created_at": "2024-12-07T00:00:00Z",
  "permissions": [
    "manage_municipalities",
    "manage_admins",
    "manage_users",
    "view_analytics",
    "manage_billing",
    "manage_system"
  ],
  "status": "active"
}
```

---

## 📊 HIERARQUIA DE PERMISSÕES

```
┌─────────────────────────────────────────────────────┐
│         VOCÊ (Admin Master)                          │
├─────────────────────────────────────────────────────┤
│ • Proprietário do sistema                           │
│ • Acesso total a TODOS os municípios                │
│ • Gerencia admins municipais                        │
│ • Gerencia vendas/assinaturas                       │
│ • Vê analytics globais                              │
│ • Cria licenças para municípios                     │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│    Admin Municipal (Prefeito/Gestor)                │
├─────────────────────────────────────────────────────┤
│ • Comprou licença de 1 município                    │
│ • Acesso só aos dados do seu município              │
│ • Gerencia usuários municipais                      │
│ • Vê analytics do município                         │
│ • NÃO pode ver dados de outros municípios           │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│    Usuários Comuns (Servidores)                     │
├─────────────────────────────────────────────────────┤
│ • Acesso limitado a contratos                       │
│ • Podem visualizar/editar conforme permissão        │
│ • Não acessam dados de outros municípios            │
└─────────────────────────────────────────────────────┘
```

---

## 🛒 MODELO DE VENDA

### Como Funciona

1. **Você (Proprietário)** gerencia o sistema central
2. **Municípios** compram licenças individuais de você
3. **Cada município** recebe credenciais do admin dele
4. **Você** continua tendo acesso a tudo como proprietário

### Processo de Venda

```
1. Município X entra em contato
   └─ Quer usar Ciclo Integrado

2. Você cria uma licença para ele
   └─ Gera credenciais de admin
   └─ Configura período de assinatura
   └─ Define limites (usuários, contratos, etc)

3. Você fornece as credenciais
   └─ Email: admin@municipio-x.ciclo-integrado.com
   └─ Senha: (temporária, deve mudar no primeiro login)

4. Admin do município faz login
   └─ Só vê dados do seu município
   └─ Gerencia usuários municipais
   └─ Usa o sistema normalmente

5. Você monitora via Admin Master
   └─ Vê analytics de TODOS os municípios
   └─ Gerencia faturas e assinaturas
   └─ Suporta municipios quando necessário
```

---

## 🔑 CRIANDO CREDENCIAIS PARA MUNICÍPIOS

### Passo 1: Criar Admin Municipal

Como Admin Master, você executa:

```bash
curl -X POST http://localhost:8080/admin/create-municipality-admin \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "municipio_id": "municipio-x",
    "municipio_nome": "Prefeitura de São Paulo",
    "admin_email": "admin@municipio-x.ciclo-integrado.com",
    "admin_name": "João Silva (Gestor)",
    "temporary_password": "SenhaTemporaria123!",
    "license_type": "premium",
    "license_expires": "2025-12-31",
    "max_users": 50,
    "max_contracts": 1000
  }'
```

### Passo 2: Enviar Credenciais para o Município

Você envia para o município:

```
═══════════════════════════════════════════════════════
       CREDENCIAIS - CICLO INTEGRADO
═══════════════════════════════════════════════════════

Bem-vindo ao Ciclo Integrado!

📧 Email: admin@municipio-x.ciclo-integrado.com
🔐 Senha (temporária): SenhaTemporaria123!

🌐 URL de acesso: https://ciclo-integrado.com
   ou http://localhost:8888/login.html (desenvolvimento)

⚠️  IMPORTANTE:
   • Esta senha é temporária
   • Você DEVE mudar na primeira vez que entrar
   • Nunca compartilhe suas credenciais

📞 Suporte: suporte@ciclo-integrado.com

═══════════════════════════════════════════════════════
```

---

## 👨‍💼 SEUS ACESSOS COMO PROPRIETÁRIO

### Dashboard Administrativo

Quando você faz login com suas credenciais, você vê:

```
┌─────────────────────────────────────────────────────┐
│            PAINEL ADMINISTRATIVO                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 ANALYTICS GLOBAIS                              │
│  ├─ Total de municípios: 15                        │
│  ├─ Usuários ativos: 2.547                         │
│  ├─ Contratos totais: 45.892                       │
│  ├─ Receita mensal: R$ 125.000,00                  │
│  └─ Taxa de uso: 78%                               │
│                                                     │
│  🏛️  MUNICÍPIOS GERENCIADOS                         │
│  ├─ Prefeitura de São Paulo (Ativo)                │
│  ├─ Prefeitura do Rio (Ativo)                      │
│  ├─ Prefeitura de Brasília (Teste)                 │
│  ├─ Prefeitura de Salvador (Vencido)               │
│  └─ ... +11 mais                                    │
│                                                     │
│  💰 FATURAMENTO                                     │
│  ├─ Assinaturas ativas: 15                         │
│  ├─ Receita deste mês: R$ 125.000,00               │
│  ├─ Pendente de cobrança: R$ 15.000,00             │
│  └─ Total anual: R$ 1.500.000,00                   │
│                                                     │
│  🔧 GERENCIAMENTO                                   │
│  ├─ [+] Novo Município                             │
│  ├─ [⚙️] Gerenciar Licenças                         │
│  ├─ [👥] Gerenciar Admins                          │
│  ├─ [📊] Ver Analytics Detalhadas                  │
│  └─ [🔒] Configurações de Segurança                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 O QUE VOCÊ PODE FAZER

### ✅ Como Admin Master, Você Pode:

```
📋 Gerenciamento de Municípios
├─ ✅ Criar novos municípios
├─ ✅ Ver todos os municípios
├─ ✅ Editar dados municipais
├─ ✅ Desativar municípios
└─ ✅ Ver histórico completo

👥 Gerenciamento de Usuários
├─ ✅ Criar admins municipais
├─ ✅ Ver todos os usuários do sistema
├─ ✅ Resetar senhas de usuários
├─ ✅ Desativar usuários
└─ ✅ Ver logs de acesso

📊 Visualização de Dados
├─ ✅ Ver contratos de TODOS os municípios
├─ ✅ Ver analytics globais
├─ ✅ Gerar relatórios
├─ ✅ Exportar dados em CSV/PDF
└─ ✅ Ver uso de recursos

💰 Gerenciamento Financeiro
├─ ✅ Gerenciar assinaturas
├─ ✅ Emitir faturas
├─ ✅ Acompanhar pagamentos
├─ ✅ Cancelar licenças
└─ ✅ Gerar relatórios financeiros

🔐 Segurança
├─ ✅ Gerenciar permissões
├─ ✅ Ver logs de segurança
├─ ✅ Gerenciar tokens
├─ ✅ Configurar 2FA
└─ ✅ Fazer backup de dados

🛠️ Sistema
├─ ✅ Gerenciar configurações globais
├─ ✅ Gerenciar plugins/extensões
├─ ✅ Configurar integrações
├─ ✅ Ver status do sistema
└─ ✅ Gerenciar atualizações
```

### ❌ O Que Admins Municipais NÃO Podem Fazer:

```
❌ Ver dados de outros municípios
❌ Gerenciar outros municípios
❌ Acessar dados financeiros globais
❌ Criar novos admins (exceto seus usuários)
❌ Gerenciar licenças/assinaturas
❌ Ver analytics globais
❌ Acessar logs de sistema
```

---

## 📱 FLUXO DE LOGIN

### 1. Você (Proprietário) faz login:
```
Email: admin@ciclo-integrado.com
Senha: Sua-Senha-Aqui
  ↓
Sistema reconhece role: "admin_master"
  ↓
Você vê dashboard com TODOS os dados
  ↓
Acesso total ao sistema
```

### 2. Admin Municipal faz login:
```
Email: admin@municipio-x.ciclo-integrado.com
Senha: Sua-Senha-Aqui
  ↓
Sistema reconhece role: "admin" e municipio_id: "municipio-x"
  ↓
Admin vê dashboard com apenas dados de "municipio-x"
  ↓
Acesso limitado ao seu município
```

### 3. Usuário Comum faz login:
```
Email: servidor@municipio-x.ciclo-integrado.com
Senha: Sua-Senha-Aqui
  ↓
Sistema reconhece role: "user" e municipio_id: "municipio-x"
  ↓
Usuário vê apenas contratos atribuídos a ele
  ↓
Acesso muito limitado
```

---

## 🔐 IMPLEMENTAÇÃO NO CÓDIGO

### Verificação de Permissão (Backend)

```javascript
// Middleware para verificar se é Admin Master
const isAdminMaster = (req, res, next) => {
  if (req.user.role !== 'admin_master') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas proprietário do sistema.'
    });
  }
  next();
};

// Middleware para verificar se é Admin de um município
const isAdminMunicipio = (req, res, next) => {
  const municipioId = req.params.municipio_id;
  
  if (req.user.role === 'admin_master') {
    // Admin Master pode acessar tudo
    next();
  } else if (req.user.role === 'admin' && req.user.municipio_id === municipioId) {
    // Admin só pode acessar seu próprio município
    next();
  } else {
    return res.status(403).json({
      error: 'Acesso negado ao município'
    });
  }
};

// Uso nas rotas
app.get('/admin/municipalities', isAdminMaster, async (req, res) => {
  // Você acessa TODOS os municípios
});

app.get('/municipios/:municipio_id/contratos', isAdminMunicipio, async (req, res) => {
  // Você (admin_master) vê TODOS
  // Admin municipal vê só o seu
});
```

---

## 💳 MODELO DE PREÇO SUGERIDO

### Opção A: Por Licença Anual

```
┌──────────────────────────────────────────────────┐
│ PLANO PADRÃO                                     │
├──────────────────────────────────────────────────┤
│ Custo: R$ 5.000,00 / ano por município          │
│ Usuários: Até 20                                │
│ Contratos: Até 500                              │
│ Suporte: Email                                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ PLANO PROFISSIONAL                               │
├──────────────────────────────────────────────────┤
│ Custo: R$ 15.000,00 / ano por município         │
│ Usuários: Até 100                               │
│ Contratos: Até 5.000                            │
│ Suporte: Chat + Email                           │
│ Relatórios: Sim                                 │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ PLANO PREMIUM                                    │
├──────────────────────────────────────────────────┤
│ Custo: R$ 30.000,00 / ano por município         │
│ Usuários: Ilimitado                             │
│ Contratos: Ilimitado                            │
│ Suporte: Telefone + Chat + Email + On-site     │
│ Relatórios: Avançado + BI                       │
│ Integrações: Sim                                │
│ SLA: 99.5%                                      │
└──────────────────────────────────────────────────┘
```

### Opção B: Por Número de Usuários

```
R$ 500,00 / usuário / ano

Exemplo:
- Município com 30 usuários = R$ 15.000,00 / ano
- Município com 50 usuários = R$ 25.000,00 / ano
```

---

## 📊 ACOMPANHAMENTO COMO PROPRIETÁRIO

### Dashboard que Você Terá Acesso

```
Ciclo Integrado - Painel do Proprietário

Visão Geral
  📈 Receita Total: R$ 125.000,00 (este mês)
  👥 Total de Usuários: 2.547
  📋 Total de Contratos: 45.892
  🏛️  Municípios Ativos: 15 de 16

Municípios
  ┌─ São Paulo (Premium)
  │  └─ Usuários: 350 | Contratos: 8.500 | Status: ✅ Ativo
  ├─ Rio de Janeiro (Profissional)
  │  └─ Usuários: 120 | Contratos: 2.500 | Status: ✅ Ativo
  ├─ Brasília (Teste)
  │  └─ Usuários: 5 | Contratos: 10 | Status: ⏰ Expira em 7 dias
  └─ ... +12 mais

Faturamento
  Recebido este mês: R$ 125.000,00
  Pendente: R$ 15.000,00
  Cancelado: 0
  Total anual: R$ 1.500.000,00

Suporte
  Tickets abertos: 3
  Ticket mais antigo: 2 horas
  Tempo médio de resposta: 4 horas
```

---

## 🚀 PRÓXIMAS ETAPAS

### Para Implementar Isso:

1. **Criar sua conta Admin Master**
   ```bash
   # No Firestore, crie um documento em users/
   {
     "email": "seu-email@ciclo-integrado.com",
     "password": "sua-senha-segura",
     "role": "admin_master",
     "municipio_id": "SISTEMA"
   }
   ```

2. **Criar endpoints para gerenciar municípios**
   - POST /admin/municipalities (criar)
   - GET /admin/municipalities (listar todos)
   - PUT /admin/municipalities/:id (editar)
   - DELETE /admin/municipalities/:id (deletar)

3. **Criar dashboard Administrativo**
   - Página de analytics global
   - Página de gerenciamento de municípios
   - Página de faturamento
   - Página de suporte

4. **Integrar sistema de billing**
   - Stripe ou similares para pagamentos
   - Gerar faturas automaticamente
   - Controlar vencimento de licenças

5. **Implementar filtros de acesso**
   - Admin Master vê tudo
   - Admin municipal vê só seu município
   - Usuário comum vê só seus contratos

---

## 📞 SUPORTE PARA MUNICÍPIOS

### Você Fornecerá:

- ✅ Email de suporte
- ✅ Portal de ajuda
- ✅ Documentação
- ✅ Vídeos tutorial
- ✅ Chat de suporte (você gerencia)
- ✅ SLA garantido

---

## 💡 MODELO ESCALÁVEL

Este modelo permite você:

✅ Vender para múltiplos municípios
✅ Manter dados isolados por município
✅ Cobrar por município
✅ Ter controle total do sistema
✅ Escalar sem limites
✅ Fornecer suporte centralizado
✅ Gerar relatórios consolidados
✅ Manter segurança e privacidade

---

## 🎯 RESUMO

**Você é o Proprietário que:**
- ✅ Controla TUDO
- ✅ Vê dados de TODOS os municípios
- ✅ Gerencia admins municipais
- ✅ Recebe pagamentos
- ✅ Fornece suporte
- ✅ Escala o negócio

**Municípios compram e recebem:**
- ✅ Credenciais de admin
- ✅ Acesso isolado ao seu município
- ✅ Suporte técnico
- ✅ Atualizações do sistema
- ✅ Relatórios de seu município

**Todos ganham!** 💰

---

**Ciclo Integrado - Modelo de Negócio v1.0**
Desenvolvido para escalabilidade e rentabilidade
