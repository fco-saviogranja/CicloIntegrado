/**
 * Ciclo Integrado - Integração Lottie Web
 * Adiciona animações Lottie ao dashboard
 */

// Animações Lottie disponíveis (URLs públicas)
// Mantido para futura reutilização; atualmente desativado no layout
const LOTTIE_ANIMATIONS = {
    // Loading/Spinner
    loading: 'https://assets9.lottiefiles.com/packages/lf20_usmfx6bp.json',
    success: 'https://assets9.lottiefiles.com/packages/lf20_jbrw3hcz.json',
    error: 'https://assets9.lottiefiles.com/packages/lf20_qp1q7mct.json',
    
    // Ícones animados
    chart: 'https://assets9.lottiefiles.com/packages/lf20_tlvbhzga.json',
    users: 'https://assets9.lottiefiles.com/packages/lf20_wd1udlcz.json',
    building: 'https://assets9.lottiefiles.com/packages/lf20_dyoqef4s.json',
    money: 'https://assets9.lottiefiles.com/packages/lf20_tutvdkg0.json',
    
    // Estados
    empty: 'https://assets9.lottiefiles.com/packages/lf20_qh5z2fdq.json',
    nodata: 'https://assets9.lottiefiles.com/packages/lf20_jtbfg2nb.json'
};

/**
 * Inicializa animação Lottie em um elemento
 * @param {string} containerId - ID do elemento container
 * @param {string} animationName - Nome da animação de LOTTIE_ANIMATIONS
 * @param {object} options - Opções extras (loop, autoplay, etc)
 */
function initLottieAnimation(containerId, animationName, options = {}) {
    const container = document.getElementById(containerId);
    
    if (!container || !LOTTIE_ANIMATIONS[animationName]) {
        console.warn(`Lottie: Container "${containerId}" ou animação "${animationName}" não encontrado`);
        return null;
    }
    
    const defaultOptions = {
        container: container,
        renderer: 'svg',
        loop: options.loop !== false, // true por padrão
        autoplay: options.autoplay !== false, // true por padrão
        path: LOTTIE_ANIMATIONS[animationName],
        ...options
    };
    
    return lottie.loadAnimation(defaultOptions);
}

/**
 * Inicia loading com animação Lottie
 */
function showLottieLoading(containerId = 'loading-spinner') {
    const spinner = document.getElementById(containerId);
    if (spinner) {
        spinner.style.display = 'flex';
        // Tentar carregar animação Lottie
        if (window.lottie) {
            initLottieAnimation(containerId, 'loading', {
                loop: true,
                autoplay: true
            });
        }
    }
}

/**
 * Para o loading
 */
function hideLottieLoading(containerId = 'loading-spinner') {
    const spinner = document.getElementById(containerId);
    if (spinner) {
        spinner.style.display = 'none';
    }
}

/**
 * Mostra animação de sucesso com notificação
 */
function showLottieSuccess(message = 'Sucesso!', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3';
    
    const animContainer = document.createElement('div');
    animContainer.id = `lottie-success-${Date.now()}`;
    animContainer.style.width = '40px';
    animContainer.style.height = '40px';
    animContainer.style.flexShrink = '0';
    
    notification.appendChild(animContainer);
    notification.appendChild(document.createTextNode(message));
    
    document.body.appendChild(notification);
    
    if (window.lottie) {
        initLottieAnimation(animContainer.id, 'success', {
            loop: false,
            autoplay: true
        });
    }
    
    // Remover após duração
    setTimeout(() => {
        notification.remove();
    }, duration);
}

/**
 * Mostra animação de erro com notificação
 */
function showLottieError(message = 'Erro!', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3';
    
    const animContainer = document.createElement('div');
    animContainer.id = `lottie-error-${Date.now()}`;
    animContainer.style.width = '40px';
    animContainer.style.height = '40px';
    animContainer.style.flexShrink = '0';
    
    notification.appendChild(animContainer);
    notification.appendChild(document.createTextNode(message));
    
    document.body.appendChild(notification);
    
    if (window.lottie) {
        initLottieAnimation(animContainer.id, 'error', {
            loop: false,
            autoplay: true
        });
    }
    
    // Remover após duração
    setTimeout(() => {
        notification.remove();
    }, duration);
}

/**
 * Carrega animações para os cards de estatísticas
 */
function initStatCardAnimations() {
    const animations = [
        { container: 'lottie-municipios', name: 'building' },
        { container: 'lottie-usuarios', name: 'users' },
        { container: 'lottie-receita', name: 'money' },
        { container: 'lottie-contratos', name: 'chart' }
    ];
    
    animations.forEach(anim => {
        const container = document.getElementById(anim.container);
        if (container && window.lottie) {
            if (container.dataset.lottieAttached === 'true') return;
            initLottieAnimation(anim.container, anim.name, {
                loop: true,
                autoplay: true,
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid slice'
                }
            });
            container.dataset.lottieAttached = 'true';
        }
    });
}

/**
 * Carrega animações decorativas nas seções de gráficos
 */
function initSectionAnimations() {
    const sections = [
        { container: 'lottie-revenue', name: 'chart' },
        { container: 'lottie-plano', name: 'building' }
    ];
    
    sections.forEach(anim => {
        const container = document.getElementById(anim.container);
        if (container && window.lottie) {
            if (container.dataset.lottieAttached === 'true') return;
            initLottieAnimation(anim.container, anim.name, {
                loop: true,
                autoplay: true,
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid slice'
                }
            });
            container.dataset.lottieAttached = 'true';
        }
    });
}

/**
 * Inicializar Lottie quando o documento estiver pronto
 */
function initLottieIntegration() {
    if (!window.lottie) {
        console.warn('Lottie Web não foi carregado');
        return;
    }
    
    console.log('✓ Lottie Web integrado com sucesso');
    
    // Inicializar animações dos cards quando estiverem visíveis
    setTimeout(initStatCardAnimations, 500);
    // Inicializar animações das seções principais
    setTimeout(initSectionAnimations, 600);
}

// Executar quando o documento estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLottieIntegration);
} else {
    initLottieIntegration();
}

// Exportar funções globais
window.Lottie = {
    init: initLottieAnimation,
    showLoading: showLottieLoading,
    hideLoading: hideLottieLoading,
    showSuccess: showLottieSuccess,
    showError: showLottieError,
    initStatCards: initStatCardAnimations,
    initSections: initSectionAnimations,
    initLottieIntegration
};
