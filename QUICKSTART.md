# 🚀 Quick Start - Ciclo Integrado

Guia rápido para começar com o projeto!

## ⚡ Início em 5 Minutos

### 1. Clone ou navegue até o projeto
```bash
cd "C:\Users\Francisco\Documents\Ciclo Integrado\CicloIntegrado"
```

### 2. Inicie um servidor local
```bash
# Opção A: Python (mais fácil)
python -m http.server 8888 --directory pages

# Opção B: VSCode Live Server
# Clique direito em login.html > Open with Live Server

# Opção C: Node.js
npm run dev
```

### 3. Abra no navegador
```
http://localhost:8888/login.html
```

## 📖 Leitura Rápida

1. **Começando**: Veja [README.md](README.md)
2. **Estrutura**: Veja [RESUME.md](RESUME.md)
3. **Testando**: Veja [TESTING.md](TESTING.md)
4. **Contribuindo**: Veja [CONTRIBUTING.md](CONTRIBUTING.md)

## 🎯 O Que Você Vai Ver

✅ 10 páginas HTML funcionais  
✅ Logo do Ciclo Integrado integrada  
✅ Design responsivo e moderno  
✅ Tema claro/escuro automático  
✅ Footer padrão em todas as páginas  

## 📂 Estrutura Básica

```
CicloIntegrado/
├── pages/              # 10 páginas HTML
├── css/               # Estilos globais
├── js/                # JavaScript reutilizável
├── assets/            # Logo e imagens
├── components/        # Componentes reutilizáveis
└── docs/              # Documentação
```

## 🔑 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `pages/login.html` | Tela de autenticação |
| `pages/dashboard.html` | Painel principal |
| `css/styles.css` | Estilos globais |
| `js/main.js` | Funções JavaScript |

## 🎨 Customizar

### Mudar cores principais
Edite em `css/styles.css`:
```css
:root {
  --primary: #137fec;  /* Azul principal */
}
```

### Adicionar nova página
1. Crie `pages/nova-pagina.html`
2. Copie estrutura de `login.html`
3. Inclua referências:
```html
<link href="./css/styles.css" rel="stylesheet"/>
<script src="./js/main.js"></script>
```

## 🚢 Deploy no GCP

```bash
# Configurar
gcloud init
gcloud config set project ciclo-integrado

# Deploy
npm run deploy
```

Seu app estará em: `https://ciclo-integrado.appspot.com`

## 💡 Dicas

- Use `./assets/images/logo_ciclo_integrado.png` em qualquer página
- Dark mode ativa automaticamente baseado no sistema
- Footer está em todas as páginas automaticamente
- Sempre use `./css/styles.css` para estilos

## ❌ Problemas?

### Logo não aparece
```bash
# Verifique se o arquivo existe
ls assets/images/logo_ciclo_integrado.png
```

### CSS não carrega
```bash
# Verifique se a pasta css existe
ls css/styles.css
```

### Porta já em uso
```bash
# Use outra porta
python -m http.server 9999 --directory pages
```

## ✨ Próximos Passos

1. [ ] Explorar as 10 páginas
2. [ ] Customizar com suas cores
3. [ ] Adicionar backend API
4. [ ] Fazer deploy no GCP
5. [ ] Compartilhar feedback

## 🆘 Ajuda

- **README.md** - Documentação completa
- **API.md** - Especificação de endpoints
- **CONTRIBUTING.md** - Como contribuir
- **TESTING.md** - Como testar

## 🎉 Bem-vindo!

Você está pronto para começar! 🚀

Qualquer dúvida, consulte a documentação ou crie uma issue no GitHub.

---

**Desenvolvido por**: Francisco Saviogranja  
**Data**: 7 de dezembro de 2025
