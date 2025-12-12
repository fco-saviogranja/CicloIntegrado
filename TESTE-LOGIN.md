# 🧪 Guia de Teste - Login Ciclo Integrado

## ⚠️ IMPORTANTE: Limpar Cache do Navegador

Se você vir a mensagem "Senha incorreta" mesmo com a senha correta, **limpe o cache do navegador**:

### No Chrome/Edge:
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Todos os períodos"
3. Marque:
   - ☑️ Cookies e outros dados de sites
   - ☑️ Arquivos em cache
4. Clique em "Limpar dados"
5. Recarregue a página (Ctrl+R ou F5)

### No Firefox:
1. Pressione `Ctrl + Shift + Delete`
2. Clique em "Limpar agora"
3. Recarregue a página (Ctrl+R ou F5)

### No Safari:
1. Menu → Histórico → Limpar histórico
2. Selecione "todo o histórico"
3. Clique em "Limpar histórico"
4. Recarregue a página (Cmd+R)

---

## 📝 Credenciais de Teste

### 1️⃣ Admin Master (Proprietário do Sistema)

```
🔗 URL: https://scenic-lane-480423-t5.web.app/login.html
   ou
   https://ciclointegrado.online/login.html

📧 Email:    admin@ciclointegrado.online
🔐 Senha:    Platao3914#Mouse
```

**Após login:** Será redirecionado para `/pages/admin-dashboard.html`

---

### 2️⃣ Usuário Municipal (Prefeitura de Jardim)

```
🔗 URL: https://scenic-lane-480423-t5.web.app/login.html
   ou
   https://ciclointegrado.online/login.html

📧 Email:    controleinterno@jardim.ce.gov.br
🔐 Senha:    @Gustavo25
```

**Após login:** Será redirecionado para `/pages/ciclo-dashboard.html`

---

## ✅ Checklist de Teste

Após fazer login com cada usuário, verifique:

- [ ] Login aceita a senha correta
- [ ] Token JWT é gerado (visível em F12 → Application → localStorage → `token`)
- [ ] Redirecionamento ocorre automaticamente
- [ ] Página de dashboard carrega sem erros
- [ ] Header mostra nome do usuário
- [ ] Botão de logout funciona
- [ ] Console não mostra erros JavaScript (F12)

---

## 🔍 Troubleshooting

### "Senha incorreta"
1. ✓ Limpar cache do navegador (veja acima)
2. ✓ Verificar se Caps Lock está desativado
3. ✓ Copiar/colar a senha de uma fonte confiável
4. ✓ Tentar incognito/anonimato (Ctrl+Shift+N)

### "Usuário não encontrado"
1. ✓ Verificar o email digitado
2. ✓ Copiar/colar o email correto

### "Token expirado"
1. ✓ Fazer login novamente (duração: 24 horas)
2. ✓ Verificar data/hora do computador

### Página não carrega após login
1. ✓ Abrir F12 (Developer Tools) → Console
2. ✓ Procurar por erros em vermelho
3. ✓ Recarregar a página (Ctrl+R)

---

## 📊 Fluxo de Login Esperado

```
1. Abre https://ciclointegrado.online/login.html
   ↓
2. Insere email e senha
   ↓
3. Clica "Entrar"
   ↓
4. Backend valida credenciais
   ↓
5. Token JWT retornado
   ↓
6. Frontend armazena token em localStorage
   ↓
7. Verifica role do usuário
   ↓
   ├─ admin_master → Redireciona para /pages/admin-dashboard.html
   └─ admin_municipio → Redireciona para /pages/ciclo-dashboard.html
   ↓
8. Dashboard carrega e exibe dados
```

---

## 🔐 Informações Técnicas

- **Backend:** Google Cloud Functions (Node.js 20)
- **Database:** Firestore (Firebase)
- **Autenticação:** JWT (JSON Web Token)
- **Token Duration:** 24 horas
- **Storage:** localStorage (browser)
- **API Endpoint:** `https://us-central1-scenic-lane-480423-t5.cloudfunctions.net/cicloIntegradoAPI/auth/login`

---

## 📞 Suporte

Se o problema persistir após limpar o cache:

1. Abra o console (F12)
2. Copie os erros que aparecem
3. Verifique a aba "Network" para ver a resposta da API
4. Verifique a URL correta do site (deve incluir `/login.html`)

---

**Última atualização:** 12 de dezembro de 2025  
**Status:** ✅ Sistema pronto para produção
