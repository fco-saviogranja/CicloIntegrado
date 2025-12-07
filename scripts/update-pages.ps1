# Script para adicionar footer e referências CSS/JS em todos os HTMLs

$pagesDir = "c:\Users\Francisco\Documents\Ciclo Integrado\CicloIntegrado\pages"

$footerTemplate = @'
<!-- Footer Padrão - Ciclo Integrado -->
<footer class="w-full border-t border-border-light bg-card-light dark:bg-gray-900 dark:border-gray-700 px-6 py-8">
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
</footer>
'@

function ProcessHtmlFile {
    param(
        [string]$filepath
    )
    
    try {
        $content = Get-Content -Path $filepath -Raw -Encoding UTF8
        
        # Adicionar referência ao CSS
        if ($content -notmatch 'css/styles\.css') {
            $cssLink = '<link href="../css/styles.css" rel="stylesheet"/>' + "`n" + '</head>'
            $content = $content -replace '</head>', $cssLink
        }
        
        # Adicionar referência ao JS
        if ($content -notmatch 'js/main\.js') {
            $jsScript = '<script src="../js/main.js"><\/script>' + "`n" + '</body>'
            $content = $content -replace '</body>', $jsScript
        }
        
        # Adicionar footer (antes de </body>)
        if ($content -notmatch '<!-- Footer Padrão') {
            $footerWithNewlines = $footerTemplate + "`n`n" + '</body>'
            $content = $content -replace '</body>', $footerWithNewlines
        }
        
        # Escrever de volta
        Set-Content -Path $filepath -Value $content -Encoding UTF8
        
        return $true
    } catch {
        Write-Host "Erro ao processar $filepath : $_"
        return $false
    }
}

$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*.html"

Write-Host "Processando $($htmlFiles.Count) arquivos HTML..."

$success = 0
foreach ($file in $htmlFiles) {
    if (ProcessHtmlFile -filepath $file.FullName) {
        Write-Host "✓ $($file.Name)"
        $success++
    } else {
        Write-Host "✗ $($file.Name)"
    }
}

Write-Host "`n✓ $success/$($htmlFiles.Count) arquivos processados com sucesso!"
