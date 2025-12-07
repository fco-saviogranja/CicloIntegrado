# 🎯 GUIA PRÁTICO - COMEÇAR A USAR AGORA

## ✨ Bem-vindo ao Ciclo Integrado!

Seu sistema está **100% pronto**. Abaixo está o guia passo a passo para começar:

---

## 📍 PASSO 1: TESTAR O FRONTEND (5 minutos)

### Opção A: Python (Recomendado)
```bash
# Abra um terminal PowerShell e execute:
cd "C:\Users\Francisco\Documents\Ciclo Integrado\CicloIntegrado"
python dev-server.py
```

**O que vai acontecer:**
- ✅ Um servidor iniciará na porta 8888
- ✅ Seu navegador abrirá automaticamente em http://localhost:8888/login.html
- ✅ Você verá a tela de login com a logo

### Opção B: Node.js (HTTP Server)
```bash
# Se tiver Node.js instalado:
npm install -g http-server
http-server pages -p 8888
```

### Opção C: VS Code Live Server
1. Clique em `pages/login.html`
2. Clique direito e selecione "Open with Live Server"
3. Pronto! Teste em tempo real

---

## 🧪 PASSO 2: TESTAR AS PÁGINAS

Com o servidor rodando, teste estas URLs:

| Página | URL | Descrição |
|--------|-----|-----------|
| Login | http://localhost:8888/login.html | Autenticação |
| Dashboard | http://localhost:8888/dashboard.html | Painel principal |
| Cadastro | http://localhost:8888/cadastro-contratos.html | Novo contrato |
| Listagem | http://localhost:8888/listagem-contratos.html | Ver contratos |
| Notificações | http://localhost:8888/notificacoes.html | Avisos |
| Usuários | http://localhost:8888/gestao-usuarios-1.html | Gerenciar usuários |

### Funcionalidades para testar:

- 🌙 **Dark Mode**: Clique no ícone de lua no canto superior
- 👁️ **Mostrar Senha**: Clique no ícone de olho nas senhas
- 📱 **Responsividade**: Redimensione o navegador (F12)
- 🎨 **Estilos**: Veja CSS em `css/styles.css` (560+ linhas)
- ⚙️ **JavaScript**: Veja lógica em `js/main.js` (260+ linhas)

---

## 🔧 PASSO 3: CONFIGURAR BACKEND (Opcional - para integração)

### Instalar dependências:
```bash
cd backend
npm install
```

### Rodar localmente:
```bash
npm run dev
```

**O backend estará em:** http://localhost:8080

### Endpoints disponíveis:
```
POST   http://localhost:8080/auth/login
POST   http://localhost:8080/auth/signup
GET    http://localhost:8080/contratos
POST   http://localhost:8080/contratos
GET    http://localhost:8080/health
```

---

## 🌐 PASSO 4: FAZER DEPLOY NO GCP (Para produção)

### Pré-requisitos:
- Ter conta Google Cloud
- `gcloud CLI` instalado (https://cloud.google.com/sdk/docs/install-sdk)

### Deploy:
```bash
# Autenticar
gcloud auth login

# Deploy
cd backend
gcloud functions deploy ciclo-integrado \
  --runtime nodejs20 \
  --trigger-http \
  --region us-central1
```

**Detalhes completos em:** `backend/DEPLOY.md`

---

## 📋 ESTRUTURA DO PROJETO

```
CicloIntegrado/
├── pages/                      # 🎨 Frontend HTML (10 arquivos)
│   ├── login.html              # ✅ Com logo integrada
│   ├── dashboard.html          # ✅ Pronto
│   ├── cadastro-contratos.html # ✅ Pronto
│   └── ... (7 mais)
│
├── css/
│   └── styles.css              # ✅ 560+ linhas (Tailwind + Custom)
│
├── js/
│   └── main.js                 # ✅ 260+ linhas (Funcionalidades)
│
├── assets/images/
│   └── logo_ciclo_integrado.png # ✅ Logo integrada
│
├── backend/                     # 🔧 Backend Express
│   ├── index.js                # ✅ 552 linhas (API completa)
│   ├── firestore.rules         # ✅ Segurança Firestore
│   ├── package.json            # ✅ Dependências Node.js
│   └── postman-collection.json # ✅ Testes API
│
└── Documentação/               # 📚 Guias completos
    ├── README.md               # ✅ Visão geral
    ├── QUICKSTART.md           # ✅ Início rápido
    ├── API.md                  # ✅ Endpoints
    ├── BACKEND.md              # ✅ Setup backend
    ├── TESTING.md              # ✅ Testes
    └── ... (mais 5)
```

---

## 🎓 ENTENDER O CÓDIGO

### Frontend (HTML + CSS + JS)

**login.html** - Exemplo de integração:
```html
<!-- CSS -->
<link href="../css/styles.css" rel="stylesheet"/>

<!-- Tailwind CDN -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Seu JS -->
<script src="../js/main.js"></script>
```

**styles.css** - Exemplo de estilos:
```css
/* Variáveis */
:root {
  --primary: #137fec;
  --background-light: #f6f7f8;
  --background-dark: #101922;
}

/* Componentes */
.btn-primary { ... }
.card { ... }
.form-input { ... }

/* Utilities */
.container { max-width: 1200px; }
.flex-center { display: flex; align-items: center; }
```

**main.js** - Exemplo de funcionalidade:
```javascript
// Dark mode
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Password visibility
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// Validação de formulário
function validateForm(formId) {
  // Validações básicas
  return true;
}
```

### Backend (Node.js + Express)

**index.js** - Exemplo de endpoint:
```javascript
// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuário no Firestore
    const userDoc = await db.collection('users').doc(email).get();
    
    // Gerar JWT
    const token = jwt.sign({ uid: userDoc.id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });
    
    res.json({ token, user: userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar contratos
app.get('/contratos', authenticateToken, async (req, res) => {
  try {
    const contratos = await db.collection('contratos')
      .where('userId', '==', req.user.uid)
      .get();
    
    res.json(contratos.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🔍 VERIFICAR TUDO ESTÁ OK

Execute o teste:
```bash
# PowerShell
.\test-system.ps1

# Bash/Linux
bash test-system.sh
```

**Resultado esperado:**
```
✅ Pasta pages criada
✅ Pasta css criada
✅ Pasta js criada
✅ assets/images criada
✅ 10 páginas HTML criadas
✅ styles.css criado
✅ main.js criado
✅ Logo criada
✅ Backend pronto
✅ Git versionado
... (mais 20+ verificações)

================================
✨ SISTEMA PRONTO PARA USAR! ✨
================================
```

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### O servidor não inicia?
```bash
# Verifique se a porta 8888 está disponível
netstat -ano | findstr :8888

# Se estiver ocupada, use outra porta:
python -m http.server 9999 --directory pages
```

### A logo não aparece?
- ✅ Verificado: `assets/images/logo_ciclo_integrado.png` existe
- ✅ Verificado: Caminho em `pages/login.html` está correto
- Dica: Limpe cache do navegador (Ctrl+Shift+Delete)

### Dark mode não funciona?
- Verifique se `main.js` está sendo carregado
- Abra DevTools (F12) e veja Console para erros

### Backend não conecta?
```bash
# Verifique se está rodando
npm run dev

# Veja logs
npm run logs
```

---

## 📞 SUPORTE

Se tiver dúvidas:

1. **Leia a documentação:**
   - `README.md` - Visão geral
   - `QUICKSTART.md` - Guia rápido
   - `BACKEND.md` - Backend específico

2. **Veja os comentários no código**
   - Cada arquivo tem comentários explicativos

3. **Teste com Postman**
   - Importe: `backend/postman-collection.json`
   - Já tem todos os endpoints configurados

---

## ✅ CHECKLIST FINAL

Antes de considerar pronto, verifique:

- [ ] Frontend carrega em http://localhost:8888/login.html
- [ ] Logo aparece no login e no footer
- [ ] Dark mode funciona (clique na lua)
- [ ] Páginas estão responsivas (F12 → mobile view)
- [ ] CSS está sendo aplicado (veja estilos no DevTools)
- [ ] JavaScript funciona (veja Console)
- [ ] Backend instala sem erros (npm install)
- [ ] Firestore rules foram revisadas
- [ ] GCloud CLI está instalado (gcloud --version)
- [ ] Git está versionando (git log)

---

## 🎉 PARABÉNS!

Você tem um **sistema completo** pronto para:

- ✅ **Desenvolvimento local** (frontend + backend)
- ✅ **Testes** (Postman collection incluída)
- ✅ **Deploy em produção** (Google Cloud Functions)
- ✅ **Manutenção** (Git + documentação completa)

**Próximo passo:** Customize para suas necessidades!

---

**Sistema Ciclo Integrado v1.0** 🚀
Desenvolvido com ❤️ para gerenciamento de contratos
