/**
 * Recharts & Lucide Integration
 * Utilitários para gráficos avançados e ícones profissionais
 */

// ============================================
// LUCIDE ICONS - Biblioteca de ícones
// ============================================

const LucideIcons = {
    // Dashboard
    dashboard: 'LayoutDashboard',
    home: 'Home',
    activity: 'Activity',
    
    // Navigation
    menu: 'Menu',
    search: 'Search',
    bell: 'Bell',
    user: 'User',
    settings: 'Settings',
    logout: 'LogOut',
    
    // Entities
    building: 'Building2',
    users: 'Users',
    fileText: 'FileText',
    calendar: 'Calendar',
    
    // Actions
    add: 'Plus',
    edit: 'Edit2',
    delete: 'Trash2',
    save: 'Save',
    download: 'Download',
    upload: 'Upload',
    refresh: 'RefreshCw',
    copy: 'Copy',
    share: 'Share2',
    
    // Status
    check: 'Check',
    x: 'X',
    alert: 'AlertCircle',
    info: 'Info',
    warning: 'AlertTriangle',
    
    // Finance
    dollar: 'DollarSign',
    creditCard: 'CreditCard',
    trending: 'TrendingUp',
    barChart: 'BarChart3',
    pieChart: 'PieChart',
    
    // Utils
    arrow: 'ArrowRight',
    chevron: 'ChevronRight',
    eye: 'Eye',
    eyeOff: 'EyeOff',
    lock: 'Lock',
    unlock: 'Unlock',
    mail: 'Mail',
    phone: 'Phone'
};

function createLucideIcon(iconName, size = 24, color = 'currentColor', strokeWidth = 2) {
    if (!window.lucide) {
        console.warn('Lucide não carregou');
        return document.createTextNode('');
    }

    try {
        const iconClass = LucideIcons[iconName] || iconName;
        return lucide.createIcons()[iconClass] || 
               `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle></svg>`;
    } catch (e) {
        console.warn(`Ícone ${iconName} não encontrado`);
        return document.createTextNode('');
    }
}

function replaceMaterialIconsWithLucide() {
    if (!window.lucide) {
        console.warn('Lucide não carregado para substituição de ícones');
        return;
    }

    // Substituir todos os ícones Material Symbols por Lucide
    const iconMap = {
        'dashboard': 'LayoutDashboard',
        'apartment': 'Building2',
        'group': 'Users',
        'payments': 'CreditCard',
        'analytics': 'BarChart3',
        'settings': 'Settings',
        'dark_mode': 'Moon',
        'logout': 'LogOut',
        'add': 'Plus',
        'edit': 'Edit2',
        'delete': 'Trash2',
        'visibility': 'Eye',
        'notifications': 'Bell',
        'search': 'Search',
        'refresh': 'RefreshCw',
        'save': 'Save',
        'person_add': 'UserPlus',
        'close': 'X',
        'arrow_back': 'ArrowLeft',
        'arrow_outward': 'ExternalLink',
        'verified_user': 'CheckCircle',
        'trending_up': 'TrendingUp',
        'trending_down': 'TrendingDown',
        'warning': 'AlertTriangle',
        'info': 'Info',
        'calendar_month': 'Calendar',
        'event_upcoming': 'Clock',
        'supervisor_account': 'UserCheck',
        'task_alt': 'CheckSquare',
        'picture_as_pdf': 'FileText',
        'table_chart': 'Table2',
        'account_circle': 'Circle',
        'more_vert': 'MoreVertical',
        'more_horiz': 'MoreHorizontal',
        'expand': 'Expand',
        'collapse': 'Minimize2',
        'upload': 'Upload',
        'download': 'Download'
    };

    // Criar inline SVGs para ícones Lucide
    const lucideSVGs = {
        'LayoutDashboard': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
        'Building2': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21v-4a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v4"></path><rect x="3" y="21" width="18" height="3"></rect><path d="M9 7h1m4 0h1M9 4h1m4 0h1"></path></svg>',
        'Users': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        'CreditCard': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
        'BarChart3': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><rect x="7" y="10" width="3" height="11"></rect><rect x="14" y="5" width="3" height="16"></rect></svg>',
        'Settings': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path></svg>',
        'Bell': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
        'Plus': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
        'Edit2': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
        'Trash2': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
        'Search': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
        'Eye': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
        'X': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        'RefreshCw': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path></svg>',
        'LogOut': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
        'Save': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>',
        'TrendingUp': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'
    };

    // Substituir Material Symbols por Lucide
    document.querySelectorAll('.material-symbols-outlined').forEach(el => {
        const iconName = el.textContent.trim();
        const lucideName = iconMap[iconName];
        
        if (lucideName && lucideSVGs[lucideName]) {
            el.innerHTML = lucideSVGs[lucideName];
            el.classList.remove('material-symbols-outlined');
            el.classList.add('lucide-icon');
            el.style.display = 'inline-flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
        }
    });

    console.log('✓ Ícones substituídos para Lucide');
}

// ============================================
// RECHARTS - Gráficos avançados
// ============================================

function createRechartsLineChart(container, data = [], options = {}) {
    const {
        dataKey = 'value',
        xKey = 'name',
        color = '#1890ff',
        title = 'Gráfico de Linha'
    } = options;

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (!container) return;

    // SVG para gráfico de linha com animação
    const width = container.offsetWidth || 600;
    const height = options.height || 300;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    if (data.length < 2) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Dados insuficientes para gráfico</p>';
        return;
    }

    const maxValue = Math.max(...data.map(d => Number(d[dataKey]) || 0));
    const minValue = Math.min(...data.map(d => Number(d[dataKey]) || 0));
    const range = maxValue - minValue || 1;

    let pathData = '';
    data.forEach((point, index) => {
        const x = padding + (chartWidth * index) / (data.length - 1);
        const y = height - padding - ((Number(point[dataKey]) - minValue) / range) * chartHeight;
        pathData += (index === 0 ? 'M' : 'L') + x + ',' + y;
    });

    const chartEl = document.createElement('div');
    chartEl.style.cssText = 'position: relative; width: 100%; overflow: hidden;';
    
    chartEl.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block;">
            <!-- Grid -->
            <g stroke="#f0f0f0" stroke-width="1">
                ${[0, 1, 2, 3, 4].map(i => {
                    const y = padding + (chartHeight / 4) * i;
                    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" />`;
                }).join('')}
            </g>

            <!-- Path animado -->
            <path d="${pathData}" 
                  stroke="${color}" 
                  stroke-width="3" 
                  fill="none" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                  style="animation: lineGrow 0.8s cubic-bezier(0.645, 0.045, 0.355, 1) forwards; stroke-dasharray: 1000; stroke-dashoffset: 1000;">
            </path>

            <!-- Área preenchida -->
            <defs>
                <linearGradient id="gradient-${Date.now()}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${color};stop-opacity:0.1" />
                    <stop offset="100%" style="stop-color:${color};stop-opacity:0" />
                </linearGradient>
            </defs>

            <!-- Pontos -->
            ${data.map((point, index) => {
                const x = padding + (chartWidth * index) / (data.length - 1);
                const y = height - padding - ((Number(point[dataKey]) - minValue) / range) * chartHeight;
                return `<circle cx="${x}" cy="${y}" r="5" fill="${color}" style="animation: dotPop 0.4s ease-out ${index * 50}ms both; cursor: pointer; opacity: 0.8;" onmouseover="this.r.baseVal.value=7" onmouseout="this.r.baseVal.value=5" />`;
            }).join('')}
        </svg>
        <style>
            @keyframes lineGrow {
                to {
                    stroke-dashoffset: 0;
                }
            }
            @keyframes dotPop {
                from {
                    r: 0;
                    opacity: 0;
                }
                to {
                    r: 5;
                    opacity: 0.8;
                }
            }
        </style>
    `;

    container.innerHTML = '';
    container.appendChild(chartEl);

    return chartEl;
}

function createRechartsBarChart(container, data = [], options = {}) {
    const {
        dataKey = 'value',
        xKey = 'name',
        color = '#1890ff',
        title = 'Gráfico de Barras'
    } = options;

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (!container) return;

    const width = container.offsetWidth || 600;
    const height = options.height || 300;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    const barWidth = Math.max(20, chartWidth / data.length * 0.6);

    const maxValue = Math.max(...data.map(d => Number(d[dataKey]) || 0));

    const chartEl = document.createElement('div');
    chartEl.style.cssText = 'position: relative; width: 100%; overflow: hidden;';

    let barsSVG = '';
    data.forEach((point, index) => {
        const x = padding + (chartWidth / data.length) * index + (chartWidth / data.length - barWidth) / 2;
        const barHeight = (Number(point[dataKey]) / maxValue) * chartHeight;
        const y = height - padding - barHeight;
        const delay = index * 50;

        barsSVG += `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                  fill="${color}" 
                  style="animation: barGrow ${0.6}s cubic-bezier(0.645, 0.045, 0.355, 1) ${delay}ms both; opacity: 0.85; cursor: pointer;"
                  onmouseover="this.style.opacity='1'; this.style.filter='brightness(1.2)'"
                  onmouseout="this.style.opacity='0.85'; this.style.filter='brightness(1)'" />
        `;
    });

    chartEl.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block;">
            <!-- Grid horizontal -->
            <g stroke="#f0f0f0" stroke-width="1">
                ${[0, 1, 2, 3, 4].map(i => {
                    const y = padding + (chartHeight / 4) * i;
                    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" />`;
                }).join('')}
            </g>

            <!-- Barras -->
            ${barsSVG}

            <!-- Eixo X -->
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#d9d9d9" stroke-width="2" />
        </svg>
        <style>
            @keyframes barGrow {
                from {
                    height: 0;
                    y: ${height - padding};
                }
                to {
                    height: auto;
                    y: auto;
                }
            }
        </style>
    `;

    container.innerHTML = '';
    container.appendChild(chartEl);

    return chartEl;
}

function createRechartsPieChart(container, data = [], options = {}) {
    const {
        dataKey = 'value',
        nameKey = 'name',
        colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d'],
        title = 'Gráfico de Pizza'
    } = options;

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (!container) return;

    const width = 300;
    const height = 300;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 80;

    const total = data.reduce((sum, item) => sum + Number(item[dataKey]), 0);
    let currentAngle = -90;

    let slices = '';
    data.forEach((point, index) => {
        const sliceAngle = (Number(point[dataKey]) / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const largeArc = sliceAngle > 180 ? 1 : 0;

        const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        const color = colors[index % colors.length];
        slices += `
            <path d="${pathData}" 
                  fill="${color}" 
                  style="animation: pieSlice 0.6s ease-out ${index * 80}ms both; opacity: 0.8; cursor: pointer;"
                  onmouseover="this.style.opacity='1'; this.style.filter='brightness(1.15)'"
                  onmouseout="this.style.opacity='0.8'; this.style.filter='brightness(1)'" />
        `;

        currentAngle = endAngle;
    });

    const chartEl = document.createElement('div');
    chartEl.style.cssText = 'position: relative; width: 100%; display: flex; justify-content: center;';

    chartEl.innerHTML = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block;">
            ${slices}
        </svg>
        <style>
            @keyframes pieSlice {
                from {
                    opacity: 0;
                    transform: rotate(-180deg);
                }
                to {
                    opacity: 0.8;
                    transform: rotate(0deg);
                }
            }
        </style>
    `;

    container.innerHTML = '';
    container.appendChild(chartEl);

    return chartEl;
}

// Inicializar quando Lucide carregar
function initLucideIntegration() {
    if (window.lucide) {
        replaceMaterialIconsWithLucide();
        console.log('✓ Lucide Icons integrado com sucesso');
    }
}

// Chamar ao carregar documento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLucideIntegration);
} else {
    initLucideIntegration();
}

// Exportar para uso global
window.Recharts = {
    createLineChart: () => console.warn('Recharts não carregado'),
    createBarChart: () => console.warn('Recharts não carregado'),
    createPieChart: () => console.warn('Recharts não carregado')
};

window.LucideHelper = {
    replaceMaterialIcons: replaceMaterialIconsWithLucide,
    createIcon: createLucideIcon
};
