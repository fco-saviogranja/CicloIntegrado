#!/usr/bin/env python3
"""
🚀 CICLO INTEGRADO - Servidor Local de Desenvolvimento
Execute este arquivo para iniciar o servidor de desenvolvimento local
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

PORT = 8888
PAGES_DIR = Path(__file__).parent / "pages"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PAGES_DIR), **kwargs)
    
    def log_message(self, format, *args):
        # Log customizado com cores
        timestamp = self.log_date_time_string()
        print(f"[{timestamp}] {format % args}")

def print_banner():
    banner = """
╔════════════════════════════════════════════════════╗
║                                                    ║
║     🚀 CICLO INTEGRADO - SERVIDOR LOCAL 🚀        ║
║                                                    ║
╚════════════════════════════════════════════════════╝

📊 CONFIGURAÇÃO:
  • Host:     localhost
  • Porta:    {port}
  • Pasta:    {pages_dir}

🌐 URLs:
  ✓ Home:      http://localhost:{port}/login.html
  ✓ Dashboard: http://localhost:{port}/dashboard.html
  ✓ API Docs:  Veja backend/postman-collection.json

⌨️  COMANDOS:
  • Parar:     Pressione Ctrl+C
  • Logs:      Aparecerão nesta janela
  • Reload:    F5 no navegador

📝 PRÓXIMOS PASSOS:
  1. O navegador abrirá automaticamente
  2. Teste as páginas localmente
  3. Para backend, execute: cd backend && npm run dev
  4. Para deploy, veja: backend/DEPLOY.md

💡 DICA: Mantenha esta janela aberta enquanto desenvolve

""".format(port=PORT, pages_dir=PAGES_DIR)
    print(banner)

def main():
    print_banner()
    
    # Verificar se pasta existe
    if not PAGES_DIR.exists():
        print(f"❌ ERRO: Pasta 'pages' não encontrada em {PAGES_DIR}")
        sys.exit(1)
    
    # Criar e iniciar servidor
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"✅ Servidor iniciado com sucesso!")
            print(f"📍 http://localhost:{PORT}/login.html")
            print("")
            
            # Abrir navegador
            try:
                webbrowser.open(f"http://localhost:{PORT}/login.html")
                print("🌐 Navegador aberto automaticamente...")
            except:
                print("💡 Abra manualmente em seu navegador")
            
            print("\n⏳ Aguardando requisições... (Ctrl+C para parar)\n")
            httpd.serve_forever()
    
    except KeyboardInterrupt:
        print("\n\n👋 Servidor parado com sucesso!")
        sys.exit(0)
    except OSError as e:
        print(f"❌ ERRO: Não foi possível iniciar o servidor")
        print(f"   Motivo: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
