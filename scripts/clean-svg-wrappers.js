#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../pages/admin-dashboard.html');
console.log('📄 Carregando arquivo:', file);

let content = fs.readFileSync(file, 'utf8');

// Remover <span class="material-symbols-outlined">SVG</span> → SVG (com suporte a whitespace)
const pattern = /<span\s+class="material-symbols-outlined"[^>]*>\s*(<svg[\s\S]*?<\/svg>)\s*<\/span>/g;

const matches = content.match(pattern);
if (matches) {
    console.log(`✓ Encontrados ${matches.length} wrappers de <span>`);
    content = content.replace(pattern, '$1');
    console.log(`✓ ${matches.length} wrappers removidos`);
} else {
    console.log('⚠️ Nenhum wrapper de <span> encontrado');
}

fs.writeFileSync(file, content, 'utf8');

console.log(`\n✅ Concluído!`);
console.log(`📁 Arquivo: ${file}`);
