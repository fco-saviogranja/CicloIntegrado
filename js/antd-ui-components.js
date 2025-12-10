/**
 * Ant Design UI Components - Ilustrações e Motion
 * Componentes visuais e animações com Ant Design
 */

// Aguardar Ant Design carregado
function waitForAntDUI(callback, maxAttempts = 50) {
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (window.antd && window.antd.Empty && window.antd.Result && window.antd.Skeleton) {
            clearInterval(checkInterval);
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Ant Design UI components não carregaram a tempo');
        }
    }, 100);
}

// ============================================
// EMPTY STATES COM ILUSTRAÇÕES
// ============================================

function createEmptyState(container, type = 'empty', message = '', action = null) {
    if (!window.antd || !window.antd.Empty) {
        console.warn('Ant Design Empty não disponível');
        return;
    }

    const emptyEl = document.createElement('div');
    emptyEl.style.cssText = `
        padding: 48px 32px;
        text-align: center;
        background: transparent;
    `;

    const descriptions = {
        empty: 'Nenhum dado disponível',
        nodata: 'Nenhum registro encontrado',
        nomessages: 'Sem mensagens',
        nocontacts: 'Nenhum contato adicionado',
        search: 'Nenhum resultado encontrado',
        error: 'Algo deu errado',
        network: 'Erro de conexão'
    };

    const svgIcons = {
        empty: `
            <svg viewBox="0 0 184 152" style="width: 100%; max-width: 200px; margin-bottom: 24px;">
                <g fill="none" fillRule="evenodd">
                    <g transform="translate(24 31.67)">
                        <ellipse fillOpacity=".8" fill="#F5F5F5" cx="67.797" cy="106.89" rx="67.797" ry="12.668"/>
                        <path d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674c-.735.741-.64 2.05.097 2.701.338.282.78.441 1.249.441h10.154v60.441c0 5.105 4.418 9.246 9.854 9.246h54.842c5.436 0 9.854-4.14 9.854-9.246V72.816h10.154c.469 0 .911-.159 1.249-.441.738-.651.833-1.96.097-2.701zM54.3 54.4V35.92h15.472v18.48H54.3zM155.92 86.5c0 .52-.424.94-.942.94H144.4V199.064c0 5.105-4.418 9.246-9.854 9.246H79.663c-5.436 0-9.854-4.14-9.854-9.246V87.44H12.02c-.519 0-.942-.42-.942-.94v-21.6c0-.52.423-.94.942-.94h21.08v-60.441C33.142 4.14 37.56 0 42.996 0h54.842c5.436 0 9.854 4.14 9.854 9.246v60.441h21.08c.519 0 .942.42.942.94v21.6z" fill="#BFBFBF" fillRule="nonzero"/>
                    </g>
                </g>
            </svg>
        `,
        search: `
            <svg viewBox="0 0 184 152" style="width: 100%; max-width: 200px; margin-bottom: 24px;">
                <g fill="none" fillRule="evenodd">
                    <g transform="translate(24 31.67)">
                        <ellipse fillOpacity=".8" fill="#F5F5F5" cx="67.797" cy="106.89" rx="67.797" ry="12.668"/>
                        <path d="M85.915 72.778a28.778 28.778 0 1 0-57.556 0 28.778 28.778 0 0 0 57.556 0z" fill="#E5E5E5"/>
                        <path d="M104.72 88.066l17.22 17.22" stroke="#BFBFBF" strokeWidth="3" strokeLinecap="round"/>
                    </g>
                </g>
            </svg>
        `,
        error: `
            <svg viewBox="0 0 184 152" style="width: 100%; max-width: 200px; margin-bottom: 24px;">
                <g fill="none" fillRule="evenodd">
                    <g transform="translate(24 31.67)">
                        <ellipse fillOpacity=".8" fill="#F5F5F5" cx="67.797" cy="106.89" rx="67.797" ry="12.668"/>
                        <circle fill="#FFEBEE" cx="67.797" cy="45.676" r="45.676"/>
                        <text x="67.797" y="60" textAnchor="middle" fill="#F57C00" fontSize="32" fontWeight="bold">!</text>
                    </g>
                </g>
            </svg>
        `,
        network: `
            <svg viewBox="0 0 184 152" style="width: 100%; max-width: 200px; margin-bottom: 24px;">
                <g fill="none" fillRule="evenodd">
                    <g transform="translate(24 31.67)">
                        <ellipse fillOpacity=".8" fill="#F5F5F5" cx="67.797" cy="106.89" rx="67.797" ry="12.668"/>
                        <circle fill="#E3F2FD" cx="67.797" cy="45.676" r="45.676"/>
                        <text x="67.797" y="60" textAnchor="middle" fill="#1976D2" fontSize="28" fontWeight="bold">⚡</text>
                    </g>
                </g>
            </svg>
        `
    };

    emptyEl.innerHTML = `
        <div style="animation: fadeInUp 0.5s ease-in-out;">
            ${svgIcons[type] || svgIcons.empty}
            <p style="color: #8c8c8c; font-size: 14px; margin: 16px 0 0 0;">
                ${message || descriptions[type] || descriptions.empty}
            </p>
            ${action ? `<div style="margin-top: 16px;">${action}</div>` : ''}
        </div>
        <style>
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;

    if (typeof container === 'string') {
        const el = document.getElementById(container);
        if (el) el.innerHTML = emptyEl.innerHTML;
    } else if (container && container.innerHTML !== undefined) {
        container.innerHTML = emptyEl.innerHTML;
    }

    return emptyEl;
}

// ============================================
// RESULT STATES (SUCESSO/ERRO/INFO)
// ============================================

function showResultState(container, status = 'success', title = '', subtitle = '', action = null) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (!container) {
        console.warn('Container não encontrado para result state');
        return;
    }

    const statusIcons = {
        success: { emoji: '✓', color: '#52c41a', bgColor: '#f6ffed' },
        error: { emoji: '✕', color: '#ff4d4f', bgColor: '#fff1f0' },
        info: { emoji: 'ℹ', color: '#1890ff', bgColor: '#e6f7ff' },
        warning: { emoji: '⚠', color: '#faad14', bgColor: '#fffbe6' },
        processing: { emoji: '⟳', color: '#1890ff', bgColor: '#e6f7ff' }
    };

    const config = statusIcons[status] || statusIcons.info;
    const isProcessing = status === 'processing';

    const resultEl = document.createElement('div');
    resultEl.style.cssText = `
        padding: 48px 32px;
        text-align: center;
        background: ${config.bgColor};
        border-radius: 8px;
        animation: slideInUp 0.4s ease-out;
    `;

    const iconSize = 72;
    const iconStyle = isProcessing ? 'animation: spin 2s linear infinite;' : '';

    resultEl.innerHTML = `
        <div style="margin-bottom: 24px;">
            <div style="
                width: ${iconSize}px;
                height: ${iconSize}px;
                margin: 0 auto 16px;
                border-radius: 50%;
                background: ${config.color};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 36px;
                font-weight: bold;
                ${iconStyle}
            ">
                ${config.emoji}
            </div>
            <h2 style="color: #262626; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                ${title}
            </h2>
            <p style="color: #8c8c8c; font-size: 14px; margin: 0;">
                ${subtitle}
            </p>
        </div>
        ${action ? `<div style="margin-top: 24px;">${action}</div>` : ''}
        <style>
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
        </style>
    `;

    container.innerHTML = '';
    container.appendChild(resultEl);

    return resultEl;
}

// ============================================
// SKELETON LOADING COM ANIMAÇÃO
// ============================================

function createSkeletonLoader(container, rows = 3, type = 'list') {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (!container) return;

    const skeletonEl = document.createElement('div');
    let skeletonHTML = '';

    if (type === 'list') {
        for (let i = 0; i < rows; i++) {
            skeletonHTML += `
                <div style="
                    margin-bottom: 16px;
                    padding: 16px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #f0f0f0;
                ">
                    <div style="display: flex; gap: 16px;">
                        <div style="
                            width: 60px;
                            height: 60px;
                            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                            background-size: 200% 100%;
                            border-radius: 4px;
                            animation: shimmer 1.5s infinite;
                        "></div>
                        <div style="flex: 1;">
                            <div style="
                                height: 16px;
                                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                                background-size: 200% 100%;
                                border-radius: 4px;
                                margin-bottom: 12px;
                                animation: shimmer 1.5s infinite;
                                width: 80%;
                            "></div>
                            <div style="
                                height: 12px;
                                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                                background-size: 200% 100%;
                                border-radius: 4px;
                                width: 60%;
                                animation: shimmer 1.5s infinite;
                            "></div>
                        </div>
                    </div>
                </div>
            `;
        }
    } else if (type === 'card') {
        skeletonHTML = `
            <div style="
                padding: 24px;
                background: white;
                border-radius: 8px;
                border: 1px solid #f0f0f0;
            ">
                <div style="
                    width: 100%;
                    height: 200px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    border-radius: 4px;
                    margin-bottom: 16px;
                    animation: shimmer 1.5s infinite;
                "></div>
                <div style="
                    height: 20px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    border-radius: 4px;
                    margin-bottom: 12px;
                    animation: shimmer 1.5s infinite;
                    width: 70%;
                "></div>
                <div style="
                    height: 16px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    border-radius: 4px;
                    width: 90%;
                    animation: shimmer 1.5s infinite;
                "></div>
            </div>
        `;
    } else if (type === 'table') {
        skeletonHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                ${Array(rows).fill(0).map(() => `
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 16px;">
                            <div style="
                                height: 16px;
                                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                                background-size: 200% 100%;
                                border-radius: 4px;
                                animation: shimmer 1.5s infinite;
                                width: 80%;
                            "></div>
                        </td>
                        <td style="padding: 16px;">
                            <div style="
                                height: 16px;
                                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                                background-size: 200% 100%;
                                border-radius: 4px;
                                animation: shimmer 1.5s infinite;
                                width: 60%;
                            "></div>
                        </td>
                    </tr>
                `).join('')}
            </table>
        `;
    }

    skeletonEl.innerHTML = skeletonHTML + `
        <style>
            @keyframes shimmer {
                0% {
                    background-position: -200% 0;
                }
                100% {
                    background-position: calc(200% + 200px) 0;
                }
            }
        </style>
    `;

    container.innerHTML = '';
    container.appendChild(skeletonEl);

    return skeletonEl;
}

// ============================================
// CARD COM MOTION
// ============================================

function createMotionCard(container, options = {}) {
    const {
        title = 'Título',
        subtitle = '',
        icon = '📊',
        color = '#1890ff',
        value = '-',
        trend = null,
        action = null,
        onClick = null
    } = options;

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (!container) return;

    const cardEl = document.createElement('div');
    cardEl.style.cssText = `
        padding: 24px;
        background: white;
        border-radius: 8px;
        border: 1px solid #f0f0f0;
        cursor: ${onClick ? 'pointer' : 'default'};
        transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        animation: cardEntry 0.5s ease-out;
    `;

    if (onClick) {
        cardEl.addEventListener('mouseenter', () => {
            cardEl.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            cardEl.style.transform = 'translateY(-4px)';
        });

        cardEl.addEventListener('mouseleave', () => {
            cardEl.style.boxShadow = 'none';
            cardEl.style.transform = 'translateY(0)';
        });

        cardEl.addEventListener('click', onClick);
    }

    const trendHTML = trend ? `
        <span style="
            font-size: 12px;
            font-weight: 600;
            color: ${trend > 0 ? '#52c41a' : trend < 0 ? '#ff4d4f' : '#8c8c8c'};
            margin-left: 8px;
        ">
            ${trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} ${Math.abs(trend)}%
        </span>
    ` : '';

    cardEl.innerHTML = `
        <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 16px;">
            <div style="font-size: 28px;">${icon}</div>
            <div style="flex: 1; margin-left: 12px;">
                <p style="color: #8c8c8c; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">
                    ${title}
                </p>
                <h3 style="color: #262626; font-size: 24px; font-weight: 600; margin: 0;">
                    ${value}
                </h3>
                ${subtitle ? `<p style="color: #8c8c8c; font-size: 12px; margin: 4px 0 0 0;">${subtitle}</p>` : ''}
            </div>
        </div>
        ${trendHTML}
        ${action ? `<div style="margin-top: 16px;">${action}</div>` : ''}
        <style>
            @keyframes cardEntry {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;

    container.innerHTML = '';
    container.appendChild(cardEl);

    return cardEl;
}

// ============================================
// PROGRESS ANIMATION
// ============================================

function createAnimatedProgress(container, percentage = 0, options = {}) {
    const {
        color = '#1890ff',
        label = '',
        showPercent = true,
        animated = true,
        size = 'medium'
    } = options;

    if (typeof container === 'string') {
        container = document.getElementById(container);
    }

    if (!container) return;

    const sizeConfig = {
        small: { height: 4, fontSize: 12 },
        medium: { height: 8, fontSize: 14 },
        large: { height: 12, fontSize: 16 }
    };

    const config = sizeConfig[size] || sizeConfig.medium;

    const progressEl = document.createElement('div');
    progressEl.style.cssText = `
        margin: 16px 0;
    `;

    progressEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="color: #8c8c8c; font-size: ${config.fontSize}px; font-weight: 500;">
                ${label}
            </span>
            ${showPercent ? `<span style="color: ${color}; font-size: ${config.fontSize}px; font-weight: 600;">${percentage}%</span>` : ''}
        </div>
        <div style="
            width: 100%;
            height: ${config.height}px;
            background: #f0f0f0;
            border-radius: 999px;
            overflow: hidden;
            position: relative;
        ">
            <div style="
                width: 0%;
                height: 100%;
                background: ${color};
                border-radius: 999px;
                ${animated ? 'animation: progressGrow 0.8s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;' : ''}
                position: relative;
            " class="progress-bar" data-target="${percentage}">
                ${animated && percentage > 20 ? `
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        bottom: 0;
                        right: 0;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                        animation: shimmerProgress 1.5s infinite;
                    "></div>
                ` : ''}
            </div>
        </div>
        <style>
            @keyframes progressGrow {
                from { width: 0%; }
                to { width: ${percentage}%; }
            }
            @keyframes shimmerProgress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        </style>
    `;

    container.innerHTML = '';
    container.appendChild(progressEl);

    return progressEl;
}

// ============================================
// FLOATING ACTION BUTTON
// ============================================

function createFloatingButton(options = {}) {
    const {
        icon = '+',
        label = 'Ação',
        color = '#1890ff',
        position = 'bottom-right',
        onClick = null,
        mini = false
    } = options;

    const positions = {
        'bottom-right': { bottom: '24px', right: '24px' },
        'bottom-left': { bottom: '24px', left: '24px' },
        'top-right': { top: '24px', right: '24px' },
        'top-left': { top: '24px', left: '24px' }
    };

    const posStyle = positions[position] || positions['bottom-right'];
    const size = mini ? 40 : 56;
    const fontSize = mini ? 16 : 24;

    const fabEl = document.createElement('button');
    fabEl.style.cssText = `
        position: fixed;
        ${Object.entries(posStyle).map(([k, v]) => `${k}: ${v}`).join(';')};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        color: white;
        border: none;
        font-size: ${fontSize}px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        animation: fabPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    fabEl.innerHTML = icon;
    fabEl.title = label;

    fabEl.addEventListener('mouseenter', () => {
        fabEl.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25)';
        fabEl.style.transform = 'scale(1.1)';
    });

    fabEl.addEventListener('mouseleave', () => {
        fabEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        fabEl.style.transform = 'scale(1)';
    });

    if (onClick) {
        fabEl.addEventListener('click', onClick);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fabPop {
            0% {
                transform: scale(0) rotate(45deg);
                opacity: 0;
            }
            70% {
                transform: scale(1.15);
            }
            100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(fabEl);

    return fabEl;
}

// ============================================
// NOTIFICATION TOAST COM MOTION
// ============================================

function showMotionToast(message, type = 'info', duration = 3000) {
    const types = {
        success: { icon: '✓', color: '#52c41a', bgColor: '#f6ffed' },
        error: { icon: '✕', color: '#ff4d4f', bgColor: '#fff1f0' },
        info: { icon: 'ℹ', color: '#1890ff', bgColor: '#e6f7ff' },
        warning: { icon: '⚠', color: '#faad14', bgColor: '#fffbe6' }
    };

    const config = types[type] || types.info;

    const toastEl = document.createElement('div');
    toastEl.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 12px 16px;
        background: ${config.bgColor};
        border: 1px solid ${config.color};
        border-radius: 8px;
        color: ${config.color};
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        animation: toastIn 0.3s ease-out;
    `;

    toastEl.innerHTML = `
        <span style="font-weight: 600; font-size: 16px;">${config.icon}</span>
        <span>${message}</span>
        <style>
            @keyframes toastIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes toastOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        </style>
    `;

    document.body.appendChild(toastEl);

    setTimeout(() => {
        toastEl.style.animation = 'toastOut 0.3s ease-out forwards';
        setTimeout(() => toastEl.remove(), 300);
    }, duration);

    return toastEl;
}

// ============================================
// INICIALIZAÇÃO
// ============================================

waitForAntDUI(() => {
    console.log('✓ Ant Design UI Components carregados com sucesso');
    window.AntDUI = {
        createEmptyState,
        showResultState,
        createSkeletonLoader,
        createMotionCard,
        createAnimatedProgress,
        createFloatingButton,
        showMotionToast
    };
});
