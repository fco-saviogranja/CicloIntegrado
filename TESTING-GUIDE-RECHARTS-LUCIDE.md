# 🚀 Guia de Testes - Recharts + Lucide Integration

## ✅ Testes a Realizar

### 1. **Verificação Visual dos Ícones**
- [ ] Abrir `pages/admin-dashboard.html` em navegador
- [ ] Verificar que **todos os ícones são SVGs** (não há Material Symbols Font)
- [ ] Confirmar cores dos ícones:
  - [ ] Navbar: Ícones cinzas/brancos conforme estado
  - [ ] Cards: Ícones em cores gradiente (azul, verde, roxo, âmbar)
  - [ ] Header: Notificações e profile icon em cores corretas
  - [ ] Tabelas: Ícones de ação (edit, visibility, delete) em cores apropriadas

### 2. **Dark Mode**
- [ ] Clicar em "Modo Escuro" (botão no sidebar)
- [ ] Verificar que SVGs ficam visíveis em dark mode
- [ ] Cores dos ícones devem estar legíveis
- [ ] Backgrounds devem contrastar bem com os ícones

### 3. **Responsividade**
- [ ] Testar em desktop (1920x1080)
- [ ] Testar em tablet (768x1024)
- [ ] Testar em mobile (375x667)
- [ ] Verificar que ícones não distorcem
- [ ] Verificar que SVGs escalam corretamente

### 4. **Performance**
- [ ] Abrir DevTools → Network
- [ ] Verificar que **não há requisição** de `fonts.googleapis.com` ou CDN de Material Symbols
- [ ] Verificar tempo de carregamento (deverá ser mais rápido)
- [ ] Verificar tamanho da página (deverá ser menor)

### 5. **Recharts** (Quando integrado com dados)
- [ ] Criar contêiner HTML com id `chart-line`
- [ ] Executar:
  ```javascript
  window.Recharts.createRechartsLineChart({
    containerId: 'chart-line',
    data: [{name: 'Jan', value: 100}, {name: 'Fev', value: 150}],
    line: 'value'
  });
  ```
- [ ] Verificar que gráfico aparece com animação suave
- [ ] Testar hover nos dados

### 6. **Compatibilidade de Navegadores**
- [ ] Chrome/Chromium ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### 7. **DevTools Check**
```javascript
// Executar no console
console.log('Recharts disponível:', typeof window.recharts);
console.log('Lucide disponível:', typeof window.lucide);
console.log('Helper disponível:', typeof window.LucideHelper);

// Verificar SVGs inline
console.log('SVGs na página:', document.querySelectorAll('svg').length);
```

---

## 📝 Bugs Conhecidos / Itens a Verificar

- [ ] SVGs com `stroke="currentColor"` herdam cores corretamente
- [ ] Animações CSS (como `animate-spin`) funcionam em SVGs
- [ ] Dark mode: Verificar que `dark:text-gray-300` funciona em SVGs
- [ ] Print: Verificar se SVGs imprimem corretamente (impressão de páginas)

---

## 🔧 Como Adicionar Novos Ícones Lucide

### Opção 1: Substituição em Massa
```bash
# Adicionar mapeamento em scripts/replace-icons.js
const replacements = {
    'novo_icone': '<svg xmlns="..." stroke="currentColor">...</svg>',
    ...
};

# Executar script
node scripts/replace-icons.js
```

### Opção 2: Manual Inline
```html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <!-- Paths do ícone Lucide -->
</svg>
```

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Depois | Status |
|---------|-------|--------|--------|
| **Ícones em SVG** | 0% | 100% | ✅ |
| **Requisições HTTP** | +1 (font) | 0 | ✅ |
| **Bundle CSS** | +50KB | -50KB | ✅ |
| **Performance Score** | ? | > 90 | ⏳ |
| **Dark Mode Funcional** | ✅ | ✅ | ⏳ |
| **Mobile Responsivo** | ✅ | ✅ | ⏳ |

---

## 🎯 Exemplos de Uso Recharts

### LineChart
```html
<div id="chart-container"></div>

<script>
  const data = [
    { name: 'Janeiro', revenue: 4000, users: 2400 },
    { name: 'Fevereiro', revenue: 3000, users: 1398 },
  ];
  
  window.Recharts.createRechartsLineChart({
    containerId: 'chart-container',
    data: data,
    line: 'revenue'
  });
</script>
```

### BarChart
```html
<div id="chart-container"></div>

<script>
  const data = [
    { name: 'Seg', vendas: 100, lucro: 50 },
    { name: 'Ter', vendas: 150, lucro: 80 },
  ];
  
  window.Recharts.createRechartsBarChart({
    containerId: 'chart-container',
    data: data,
    bars: ['vendas', 'lucro']
  });
</script>
```

### PieChart
```html
<div id="chart-container"></div>

<script>
  const data = [
    { name: 'Ativo', value: 300 },
    { name: 'Inativo', value: 100 },
  ];
  
  window.Recharts.createRechartsPieChart({
    containerId: 'chart-container',
    data: data
  });
</script>
```

---

## 📋 Checklist Final

- [ ] Todos os ícones aparecem como SVG
- [ ] Dark mode funciona
- [ ] Responsividade OK
- [ ] Performance melhorou
- [ ] Sem erros no console
- [ ] Recharts carrega CDN com sucesso
- [ ] Documentação completa
- [ ] Ready for production

---

## 🆘 Troubleshooting

### Ícones não aparecem
```javascript
// Verificar se SVG existe
console.log(document.querySelectorAll('svg').length);

// Verificar se há erro no console
// Se nenhum SVG: Reexecutar scripts de substituição
```

### Cores dos ícones erradas
```css
/* Verificar que parent tem cor definida */
.icon-container {
  color: #YOUR_COLOR;
}

/* SVG deve ter stroke="currentColor" */
<svg stroke="currentColor">...</svg>
```

### Dark mode não funciona
```css
/* Adicionar classe dark ao SVG */
<svg class="dark:stroke-gray-300">...</svg>

/* Verificar que html tem class="dark" quando em dark mode */
```

### Recharts não carrega
```javascript
// Verificar CDN
console.log(typeof window.recharts); // Deve ser "object"

// Se undefined, verificar se CDN está no HTML
```

---

## 📞 Contato para Suporte

Se encontrar problemas:
1. Verificar console do navegador (F12)
2. Checar arquivo `MIGRATION-RECHARTS-LUCIDE.md`
3. Revisar código em `js/recharts-lucide.js`
4. Consultar documentação em https://recharts.org/

---

**Última atualização:** 2025-01-15
**Status:** 🟢 Pronto para Testes
