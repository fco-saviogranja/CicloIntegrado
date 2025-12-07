# 🧪 Guia de Testes - Ciclo Integrado

## Como Testar o Projeto Localmente

### Opção 1: Python HTTP Server (Recomendado)

```bash
cd "C:\Users\Francisco\Documents\Ciclo Integrado\CicloIntegrado"
python -m http.server 8888 --directory pages
```

Acesse: `http://localhost:8888/login.html`

### Opção 2: Live Server (VSCode)

1. Instale a extensão "Live Server"
2. Clique direito em qualquer HTML
3. Selecione "Open with Live Server"

### Opção 3: Node.js

```bash
npm install -g http-server
cd "C:\Users\Francisco\Documents\Ciclo Integrado\CicloIntegrado\pages"
http-server
```

## ✅ Checklist de Testes

### Estrutura
- [ ] Pasta `assets/images` contém `logo_ciclo_integrado.png`
- [ ] Pasta `pages` contém 10 HTMLs
- [ ] Pasta `css` contém `styles.css`
- [ ] Pasta `js` contém `main.js`

### Páginas
- [ ] `login.html` carrega corretamente
- [ ] `dashboard.html` carrega corretamente
- [ ] Todas as 10 páginas carregam sem erros

### Logo
- [ ] Logo aparece na tela de login (lado esquerdo)
- [ ] Logo aparece no formulário de login
- [ ] Logo aparece no rodapé de todas as páginas

### CSS
- [ ] Estilos básicos aplicados
- [ ] Tema claro/escuro funciona
- [ ] Layout responsivo (testar em mobile)

### JavaScript
- [ ] Console sem erros
- [ ] Botão toggle de senha funciona (se houver)
- [ ] Dark mode toggle funciona

### Responsividade
- [ ] Desktop (1920x1080) ✅
- [ ] Tablet (768x1024) ✅
- [ ] Mobile (375x667) ✅

### Navegadores
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Safari (se Mac) ✅
- [ ] Edge ✅

## 🐛 Verificar Erros

Abra as DevTools (F12) e verifique:

1. **Console**: Nenhum erro em vermelho
2. **Network**: Todos os arquivos carregaram (200 OK)
3. **Elements**: HTML estrutura correta
4. **Lighthouse**: Score elevado

## 📱 Testes Mobile

Use as DevTools do navegador:
1. Pressione F12
2. Clique no ícone "Toggle device toolbar" (Ctrl+Shift+M)
3. Selecione diferentes dispositivos

## 🔗 URLs de Teste

```
http://localhost:8888/login.html
http://localhost:8888/dashboard.html
http://localhost:8888/cadastro-contratos.html
http://localhost:8888/listagem-contratos.html
http://localhost:8888/detalhes-contrato-1.html
http://localhost:8888/detalhes-contrato-2.html
http://localhost:8888/detalhes-contrato-3.html
http://localhost:8888/gestao-usuarios-1.html
http://localhost:8888/gestao-usuarios-2.html
http://localhost:8888/notificacoes.html
```

## 🎨 Testes Visuais

### Elementos esperados em cada página:

**Login:**
- Logo em alta resolução
- Campos de email/usuário
- Campo de senha com toggle
- Botão "Entrar"
- Links de "Esqueci minha senha"
- Footer com logo

**Dashboard:**
- Sidebar com navegação
- Header com notificações
- Cards com métricas
- Gráficos
- Tabela de contratos
- Footer

**Outras páginas:**
- Estrutura consistente
- Logo no footer
- Tema aplicado corretamente

## 🚀 Performance

Use Lighthouse para testar:

1. Abra DevTools (F12)
2. Vá para "Lighthouse"
3. Gere relatório
4. Verifique:
   - Performance > 90
   - Acessibilidade > 90
   - Best Practices > 90
   - SEO > 90

## ♿ Acessibilidade

Teste com:

1. **Teclado**: Tab through todos os elementos
2. **Screen Reader**: NVDA (Windows) ou VoiceOver (Mac)
3. **Cores**: Verificar contraste com WCAG
4. **Focus**: Indicadores visíveis

## 🌙 Teste de Tema Escuro

1. Abra página
2. Abra DevTools
3. Execute no console:
```javascript
document.documentElement.classList.add('dark')
```
4. Verifique se o tema escuro se aplica corretamente

## 🔗 Verificar Links

1. Teste hover states
2. Teste active states
3. Teste visited states
4. Verifique se todos os links funcionam

## 📊 Testes de Formulário

```javascript
// Testar validação no console:
const form = document.querySelector('form');
console.log(form);
form.submit(); // Deve validar
```

## 🐛 Debug Comum

### "Logo não aparece"
- Verifique se arquivo existe em: `assets/images/logo_ciclo_integrado.png`
- Verifique caminho: `./assets/images/logo_ciclo_integrado.png`

### "CSS não carrega"
- Verifique se arquivo existe em: `css/styles.css`
- Verifique link: `<link href="./css/styles.css" rel="stylesheet"/>`

### "JavaScript não funciona"
- Verifique se arquivo existe em: `js/main.js`
- Verifique script tag: `<script src="./js/main.js"></script>`

### "Erros de CORS"
- Normal em localhost, será resolvido em produção com headers corretos

## ✨ Próximos Passos

Após validar tudo:

1. [ ] Commit e push no GitHub
2. [ ] Criar backend API
3. [ ] Integrar autenticação real
4. [ ] Deploy no GCP
5. [ ] Configurar domínio

---

**Dúvidas?** Consulte README.md ou CONTRIBUTING.md
