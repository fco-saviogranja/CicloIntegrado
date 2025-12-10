/* ============================================
   CICLO INTEGRADO - Main JavaScript
   ============================================ */

// Toggle tema claro/escuro
function toggleDarkMode() {
    const htmlElement = document.documentElement;
    const isDarkMode = htmlElement.classList.contains('dark');
    
    if (isDarkMode) {
        htmlElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        htmlElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Inicializar tema salvo
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const htmlElement = document.documentElement;
    
    if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }
}

// Toggle visibilidade de senha
function initPasswordToggle() {
    const toggleButtons = document.querySelectorAll('[aria-label="Toggle password visibility"]');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const input = this.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon = this.querySelector('.material-symbols-outlined');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = 'visibility_off';
            } else {
                input.type = 'password';
                icon.textContent = 'visibility';
            }
        });
    });
}

// Navegação mobile
function initMobileNavigation() {
    const menuButton = document.querySelector('[aria-label="Toggle menu"]');
    const sidebar = document.querySelector('aside');
    
    if (menuButton && sidebar) {
        menuButton.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
        });
    }
}

// Animações ao carregar página
function animateOnLoad() {
    const elements = document.querySelectorAll('.animate-fade-in, .animate-slide-in');
    elements.forEach((element, index) => {
        element.style.animationDelay = `${index * 100}ms`;
    });
}

// Debounce para eventos
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validação de formulário
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('border-red-500');
            isValid = false;
        } else {
            input.classList.remove('border-red-500');
        }
    });
    
    return isValid;
}

// Inicializar na carga da página
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initPasswordToggle();
    initMobileNavigation();
    animateOnLoad();
    
    // Inicializar Lucide Icons
    if (window.LucideHelper && typeof window.LucideHelper.replaceMaterialIcons === 'function') {
        window.LucideHelper.replaceMaterialIcons();
    }
    
    // Validação de formulários
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
    });
});

// Observar mudanças de preferência de tema do sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (localStorage.getItem('theme') === null) {
        initializeTheme();
    }
});

// Exportar funções para uso global
window.cicloIntegrado = {
    toggleDarkMode,
    validateForm,
    debounce
};
