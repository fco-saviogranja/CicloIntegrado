#!/usr/bin/env python3
"""
Script para adicionar footer e referências CSS/JS em todos os arquivos HTML
"""

import os
import re
from pathlib import Path

# Caminho para a pasta pages
PAGES_DIR = Path(__file__).parent.parent / "pages"

# Template do footer
FOOTER_TEMPLATE = '''<!-- Footer Padrão - Ciclo Integrado -->
<footer class="w-full border-t border-border-light bg-card-light dark:bg-gray-900 dark:border-gray-700 px-6 py-8 mt-auto">
  <div class="max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <!-- Logo e Descrição -->
      <div class="flex items-center gap-3">
        <img 
          alt="Logo Ciclo Integrado" 
          class="h-10 object-contain" 
          src="../assets/images/logo_ciclo_integrado.png"
        />
        <div class="flex flex-col">
          <p class="text-sm font-semibold text-text-primary dark:text-gray-100">Ciclo Integrado</p>
          <p class="text-xs text-text-secondary dark:text-gray-400">Gestão de Contratos Municipais</p>
        </div>
      </div>

      <!-- Links e Informações -->
      <div class="flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <nav class="flex gap-4 md:gap-6 text-sm">
          <a 
            href="#" 
            class="text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200"
          >
            Sobre
          </a>
          <a 
            href="#" 
            class="text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200"
          >
            Documentação
          </a>
          <a 
            href="#" 
            class="text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200"
          >
            Suporte
          </a>
          <a 
            href="#" 
            class="text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200"
          >
            Privacidade
          </a>
        </nav>

        <!-- Copyright -->
        <p class="text-xs text-text-secondary dark:text-gray-400 md:border-l md:border-border-light md:dark:border-gray-700 md:pl-6">
          © 2025 Ciclo Integrado. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </div>
</footer>'''

def add_css_reference(html_content):
    """Adiciona referência ao CSS global se não existir"""
    if 'css/styles.css' not in html_content:
        # Encontrar a tag </head>
        pattern = r'</head>'
        css_link = '<link href="../css/styles.css" rel="stylesheet"/>\n</head>'
        html_content = re.sub(pattern, css_link, html_content)
    return html_content

def add_js_reference(html_content):
    """Adiciona referência ao JS principal se não existir"""
    if 'js/main.js' not in html_content:
        # Encontrar a tag </body>
        pattern = r'</body>'
        js_script = '<script src="../js/main.js"><\/script>\n</body>'
        html_content = re.sub(pattern, js_script, html_content)
    return html_content

def add_footer(html_content):
    """Adiciona footer antes da tag </body>"""
    if '<!-- Footer Padrão' not in html_content:
        # Se já tiver copyright footer no final, substitui por footer padrão
        html_content = re.sub(
            r'<footer[^>]*>.*?</footer>\s*',
            FOOTER_TEMPLATE + '\n',
            html_content,
            flags=re.DOTALL
        )
        # Se não tiver footer, adiciona antes de </body>
        if '<!-- Footer Padrão' not in html_content:
            pattern = r'\s*</body>'
            html_content = re.sub(pattern, f'\n\n{FOOTER_TEMPLATE}\n\n</body>', html_content)
    return html_content

def process_html_file(filepath):
    """Processa um arquivo HTML adicionando CSS, JS e Footer"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Adicionar referências
        content = add_css_reference(content)
        content = add_js_reference(content)
        content = add_footer(content)
        
        # Escrever de volta
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"Erro ao processar {filepath}: {e}")
        return False

def main():
    """Processa todos os arquivos HTML na pasta pages"""
    if not PAGES_DIR.exists():
        print(f"Pasta {PAGES_DIR} não encontrada!")
        return
    
    html_files = list(PAGES_DIR.glob("*.html"))
    
    if not html_files:
        print(f"Nenhum arquivo HTML encontrado em {PAGES_DIR}")
        return
    
    print(f"Processando {len(html_files)} arquivos HTML...")
    
    success = 0
    for filepath in html_files:
        if process_html_file(filepath):
            print(f"✓ {filepath.name}")
            success += 1
        else:
            print(f"✗ {filepath.name}")
    
    print(f"\n✓ {success}/{len(html_files)} arquivos processados com sucesso!")

if __name__ == "__main__":
    main()
