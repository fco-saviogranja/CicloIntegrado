# Guia de Contribuição - Ciclo Integrado

Obrigado por querer contribuir para o Ciclo Integrado! Este documento fornece diretrizes e instruções para contribuir ao projeto.

## 📋 Código de Conduta

Todos os contribuidores devem seguir nosso código de conduta baseado em respeito e inclusão.

## 🚀 Como Começar

### Pré-requisitos

- Git instalado
- Node.js 16+ (para dependências do projeto)
- Um navegador moderno
- Conta GitHub

### Setup Local

```bash
# Clone o repositório
git clone https://github.com/fco-saviogranja/CicloIntegrado.git
cd CicloIntegrado

# Crie uma branch para sua feature
git checkout -b feature/sua-feature

# Instale as dependências (opcional)
npm install

# Inicie um servidor local
npm run dev
```

## 🔄 Fluxo de Trabalho

### 1. Criar uma Issue

Antes de começar a desenvolver, crie uma issue descrevendo:
- O que você quer fazer
- Por que é importante
- Como você planeja implementar

### 2. Desenvolver

```bash
# Crie uma branch descritiva
git checkout -b feature/adicionar-validacao-email
# ou
git checkout -b fix/corrigir-navegacao-mobile
```

### 3. Commit

Siga o padrão Conventional Commits:

```bash
git commit -m "feat: adicionar validação de email no login"
git commit -m "fix: corrigir layout responsivo do dashboard"
git commit -m "docs: atualizar documentação da API"
git commit -m "style: formatar código com prettier"
git commit -m "refactor: reorganizar estrutura de componentes"
git commit -m "test: adicionar testes para login"
```

**Prefixos válidos:**
- `feat:` Novo recurso
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Reestruturação
- `perf:` Melhoria de performance
- `test:` Testes

### 4. Push e Pull Request

```bash
git push origin feature/sua-feature
```

Vá para o GitHub e crie um Pull Request com:
- Título descritivo
- Descrição clara do que foi mudado
- Referência à issue relacionada (ex: Fixes #123)
- Screenshots se aplicável (para mudanças visuais)

## 🎨 Padrões de Código

### HTML
- Use semântica HTML5 apropriada
- IDs e classes em kebab-case
- Indentação de 2 espaços
- Sempre feche tags

```html
<div class="card">
  <h2 class="card-title">Título</h2>
  <p class="card-description">Descrição</p>
</div>
```

### CSS
- Use classes em kebab-case
- Agrupe propriedades logicamente
- Use variáveis CSS quando possível
- Mobile-first approach

```css
.btn {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-base);
}

.btn:hover {
  background-color: var(--primary);
}

@media (max-width: 640px) {
  .btn {
    padding: var(--spacing-sm);
  }
}
```

### JavaScript
- Use camelCase para variáveis e funções
- Use const/let em vez de var
- Use arrow functions quando apropriado
- Adicione comentários para lógica complexa

```javascript
// Bom
const handleFormSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  // ...
};

// Ruim
var handleFormSubmit = function(event) {
  // ...
};
```

## 🧪 Testando Mudanças

### Verificação Manual

1. Teste em diferentes navegadores (Chrome, Firefox, Safari, Edge)
2. Teste em diferentes tamanhos de tela (desktop, tablet, mobile)
3. Teste o modo escuro
4. Verifique acessibilidade (Tab navigation, screen readers)

### Performance

```javascript
// Use as DevTools do navegador para:
// 1. Verificar Network
// 2. Analisar Performance
// 3. Verificar Console para erros
// 4. Testar Lighthouse
```

## 📝 Documentação

### Adicionar Documentação

1. **Para novas features**: Atualize o README.md
2. **Para endpoints**: Atualize API.md
3. **Para componentes**: Adicione exemplos no comentário do código

```javascript
/**
 * Valida um formulário
 * @param {HTMLFormElement} form - Elemento do formulário
 * @returns {boolean} True se válido, false caso contrário
 * 
 * @example
 * const form = document.querySelector('form');
 * if (validateForm(form)) {
 *   form.submit();
 * }
 */
function validateForm(form) {
  // ...
}
```

## 🔍 Checklist antes de submeter PR

- [ ] Meu código segue os padrões do projeto
- [ ] Adicionei/atualizei documentação
- [ ] Testei em múltiplos navegadores
- [ ] Testei responsividade
- [ ] Sem erros no console
- [ ] Commits com mensagens claras
- [ ] Sem conflitos com a branch main

## 🐛 Reportando Bugs

### Ao abrir uma issue de bug, inclua:

1. **Descrição clara**: O que aconteceu?
2. **Passos para reproduzir**:
   - 1. Clique em...
   - 2. Preencha com...
   - 3. Observe...

3. **Comportamento esperado**: O que deveria acontecer?
4. **Comportamento atual**: O que acontece?
5. **Screenshots/vídeos**: Se aplicável
6. **Ambiente**:
   - SO: Windows/Mac/Linux
   - Navegador: Chrome/Firefox/Safari
   - Versão: ...

## 💡 Sugestões de Features

Descreva claramente:
- O problema que resolve
- Caso de uso
- Como você imaginaria implementar
- Screenshots de referências (se houver)

## 🏆 Processo de Revisão

1. Pelo menos 1 revisor verificará seu PR
2. Mudanças podem ser solicitadas
3. Após aprovação, seu PR será mesclado
4. Você receberá crédito na CHANGELOG

## 📚 Recursos Úteis

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

## 🤝 Precisa de Ajuda?

- Abra uma **discussion** no GitHub
- Crie uma **issue** com sua pergunta
- Contate o mantendor: francisco@example.com

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a MIT License.

## 🎉 Obrigado!

Suas contribuições tornam o Ciclo Integrado melhor para todos!

---

**Última atualização**: 7 de dezembro de 2025
