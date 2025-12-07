# Ciclo Integrado 🔄

Plataforma de Gestão de Contratos Municipais desenvolvida com foco em eficiência, transparência e integração de processos contratuais.

## 📋 Características

- **Dashboard Intuitivo**: Visualização completa de contratos com métricas em tempo real
- **Gestão de Contratos**: Cadastro, edição e monitoramento de contratos municipais
- **Análise de Dados**: Relatórios e gráficos para melhor tomada de decisão
- **Gestão de Usuários**: Controle de acesso e permissões por função
- **Notificações**: Sistema de alertas para vencimentos e ações pendentes
- **Design Responsivo**: Interface otimizada para desktop, tablet e mobile
- **Suporte a Tema Escuro**: Modo noturno para melhor experiência do usuário

## 🚀 Estrutura do Projeto

```
CicloIntegrado/
├── assets/
│   └── images/
│       └── logo_ciclo_integrado.png
├── css/
│   └── styles.css                 # Estilos globais e componentes
├── js/
│   └── main.js                    # Funções JavaScript principais
├── pages/
│   ├── login.html                 # Tela de login
│   ├── dashboard.html             # Painel principal
│   ├── cadastro-contratos.html    # Novo contrato
│   ├── listagem-contratos.html    # Lista de contratos
│   ├── detalhes-contrato-1.html   # Detalhes contrato 1
│   ├── detalhes-contrato-2.html   # Detalhes contrato 2
│   ├── detalhes-contrato-3.html   # Detalhes contrato 3
│   ├── gestao-usuarios-1.html     # Gestão usuários 1
│   ├── gestao-usuarios-2.html     # Gestão usuários 2
│   └── notificacoes.html          # Painel de notificações
├── components/
│   └── footer.html                # Componente rodapé padrão
├── package.json
├── README.md
└── .gitignore
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework CSS**: Tailwind CSS
- **Ícones**: Material Symbols Outlined
- **Fontes**: Public Sans (Google Fonts)
- **Backend**: Google Cloud Platform (em desenvolvimento)
- **Versionamento**: Git & GitHub

## 📖 Como Usar

### Desenvolvimento Local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/fco-saviogranja/CicloIntegrado.git
   cd CicloIntegrado
   ```

2. **Instale as dependências** (opcional)
   ```bash
   npm install
   ```

3. **Inicie um servidor local**
   ```bash
   npm run dev
   # ou use qualquer servidor HTTP local
   # python -m http.server 8000
   # live-server
   ```

4. **Abra no navegador**
   ```
   http://localhost:5500/pages/login.html
   ```

### Navegação das Páginas

| Página | URL | Descrição |
|--------|-----|-----------|
| Login | `pages/login.html` | Autenticação de usuários |
| Dashboard | `pages/dashboard.html` | Painel principal com métricas |
| Cadastro de Contratos | `pages/cadastro-contratos.html` | Formulário de novo contrato |
| Listagem de Contratos | `pages/listagem-contratos.html` | Lista com filtros |
| Detalhes do Contrato | `pages/detalhes-contrato-*.html` | Informações detalhadas |
| Gestão de Usuários | `pages/gestao-usuarios-*.html` | Administração de usuários |
| Notificações | `pages/notificacoes.html` | Central de alertas |

## 🎨 Customização

### Cores Principais

```css
--primary: #137fec          /* Azul principal */
--background-light: #f6f7f8 /* Fundo claro */
--background-dark: #101922  /* Fundo escuro */
```

### Adicionar Novas Páginas

1. Crie um novo arquivo `pages/minha-pagina.html`
2. Copie o template de uma página existente
3. Inclua as referências obrigatórias:
   ```html
   <link href="./css/styles.css" rel="stylesheet"/>
   <script src="./js/main.js"></script>
   ```
4. Adicione o footer antes do `</body>`

## 🔐 Segurança

- Implementar validação no backend (em desenvolvimento)
- Usar HTTPS em produção
- Implementar autenticação com tokens
- Validar todas as entradas do usuário
- CORS configurado corretamente

## 📱 Responsividade

O projeto é totalmente responsivo e otimizado para:
- ✅ Desktop (1280px+)
- ✅ Tablet (768px - 1279px)
- ✅ Mobile (até 767px)

## 🌙 Modo Escuro

O tema escuro é aplicado automaticamente baseado em:
1. Preferência armazenada no localStorage
2. Preferência do sistema operacional (prefers-color-scheme)

## 🚢 Deploy

### Google Cloud Platform

```bash
# Configurar GCP
gcloud config set project ciclo-integrado

# Deploy
npm run deploy
```

### Variáveis de Ambiente

Criar arquivo `.env` (não versionado):
```
API_URL=https://seu-backend.com
APP_ENV=production
```

## 📚 Documentação de Componentes

### Botões
```html
<button class="btn btn-primary">Botão Primário</button>
<button class="btn btn-secondary">Botão Secundário</button>
<button class="btn btn-sm">Botão Pequeno</button>
```

### Cards
```html
<div class="card">
  <h3>Título do Card</h3>
  <p>Conteúdo aqui</p>
</div>
```

### Badges
```html
<span class="badge badge-success">Sucesso</span>
<span class="badge badge-warning">Aviso</span>
<span class="badge badge-danger">Erro</span>
```

## 🔄 Fluxo de Trabalho Git

```bash
# Criar uma nova branch
git checkout -b feature/minha-feature

# Fazer commits
git commit -m "feat: descrição da mudança"

# Push
git push origin feature/minha-feature

# Criar Pull Request no GitHub
```

## 🐛 Problemas Conhecidos

- [ ] Implementar integração com backend
- [ ] Adicionar testes automatizados
- [ ] Otimizar carregamento de imagens
- [ ] Implementar PWA

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## 📧 Contato

- **Desenvolvedor**: Francisco Saviogranja
- **Email**: francisco@example.com
- **GitHub**: [@fco-saviogranja](https://github.com/fco-saviogranja)

## 🙏 Agradecimentos

- Tailwind CSS pela excelente framework CSS
- Google Fonts pelas fontes Public Sans
- Material Design pelos ícones

---

**Última atualização**: 7 de dezembro de 2025
