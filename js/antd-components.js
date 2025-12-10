/**
 * Ant Design Components Integration
 * Utilidades para usar componentes Ant Design no sistema
 */

// Aguardar carregamento do Ant Design
function waitForAntD(callback, maxAttempts = 50) {
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (window.antd) {
            clearInterval(checkInterval);
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Ant Design não carregou a tempo');
        }
    }, 100);
}

// Inicializar Ant Design
function initializeAntD() {
    const { message, notification, Spin, Button, Space, Card, Tag, Table, Modal, Form, Input, Select, DatePicker, Checkbox, InputNumber } = window.antd;
    
    // Exportar globalmente para uso no dashboard
    window.AntD = {
        message,
        notification,
        Spin,
        Button,
        Space,
        Card,
        Tag,
        Table,
        Modal,
        Form,
        Input,
        Select,
        DatePicker,
        Checkbox,
        InputNumber
    };

    console.log('✓ Ant Design inicializado com sucesso');
}

// Criar um toast/notificação usando Ant Design
function showAntDNotification(type = 'info', title = '', message = '', duration = 4.5) {
    if (!window.AntD || !window.AntD.notification) {
        console.warn('Ant Design não disponível para notificação');
        return;
    }

    window.AntD.notification[type]({
        message: title,
        description: message,
        duration: duration,
        placement: 'topRight',
        style: {
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
    });
}

// Criar um loading com spinner Ant Design
function showAntDLoading(message = 'Carregando...') {
    const container = document.createElement('div');
    container.id = 'antd-loading-overlay';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 32px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-align: center;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
        display: inline-block;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
    `;
    spinner.innerHTML = `
        <svg viewBox="0 0 50 50" style="animation: rotate 1s linear infinite;">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#1890ff" stroke-width="4" stroke-dasharray="31.4 94.2" style="animation: dash 1.5s ease-in-out infinite;">
            </circle>
        </svg>
        <style>
            @keyframes rotate {
                to { transform: rotate(360deg); }
            }
            @keyframes dash {
                0% { stroke-dasharray: 0 94.2; }
                50% { stroke-dasharray: 47.1 47.1; }
                100% { stroke-dasharray: 94.2 0; }
            }
        </style>
    `;

    const text = document.createElement('p');
    text.style.cssText = `
        margin: 0;
        color: #262626;
        font-size: 14px;
        font-weight: 500;
    `;
    text.textContent = message;

    content.appendChild(spinner);
    content.appendChild(text);
    container.appendChild(content);
    document.body.appendChild(container);

    return container;
}

function hideAntDLoading() {
    const overlay = document.getElementById('antd-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
}

// Criar um modal com Ant Design
function showAntDModal(title = '', content = '', onOk = null, onCancel = null) {
    if (!window.AntD || !window.AntD.Modal) {
        console.warn('Ant Design Modal não disponível');
        return;
    }

    window.AntD.Modal.confirm({
        title: title,
        content: content,
        okText: 'Confirmar',
        cancelText: 'Cancelar',
        okButtonProps: { style: { background: '#1890ff' } },
        onOk: onOk || (() => {}),
        onCancel: onCancel || (() => {}),
        centered: true
    });
}

// Criar um formulário modal simples
function showAntDFormModal(title = '', fields = [], onSubmit = null) {
    if (!window.AntD) {
        console.warn('Ant Design não disponível para formulário');
        return;
    }

    const container = document.createElement('div');
    container.id = `antd-form-modal-${Date.now()}`;
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        max-width: 500px;
        width: 100%;
    `;

    const header = document.createElement('h2');
    header.style.cssText = `
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #262626;
    `;
    header.textContent = title;

    const form = document.createElement('form');
    form.style.cssText = 'margin: 16px 0;';

    // Adicionar campos
    fields.forEach(field => {
        const group = document.createElement('div');
        group.style.cssText = 'margin-bottom: 16px;';

        const label = document.createElement('label');
        label.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #262626;
        `;
        label.textContent = field.label;

        const input = document.createElement('input');
        input.type = field.type || 'text';
        input.name = field.name;
        input.placeholder = field.placeholder || '';
        input.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.3s;
            box-sizing: border-box;
        `;
        input.onFocus = (e) => {
            e.target.style.borderColor = '#1890ff';
            e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.1)';
        };
        input.onBlur = (e) => {
            e.target.style.borderColor = '#d9d9d9';
            e.target.style.boxShadow = 'none';
        };

        group.appendChild(label);
        group.appendChild(input);
        form.appendChild(group);
    });

    const footer = document.createElement('div');
    footer.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 24px;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.type = 'button';
    cancelBtn.style.cssText = `
        padding: 8px 16px;
        border: 1px solid #d9d9d9;
        background: white;
        color: #262626;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
    `;
    cancelBtn.onMouseOver = (e) => {
        e.target.style.borderColor = '#40a9ff';
        e.target.style.color = '#40a9ff';
    };
    cancelBtn.onMouseOut = (e) => {
        e.target.style.borderColor = '#d9d9d9';
        e.target.style.color = '#262626';
    };
    cancelBtn.onclick = () => {
        container.remove();
    };

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Confirmar';
    submitBtn.type = 'submit';
    submitBtn.style.cssText = `
        padding: 8px 16px;
        border: none;
        background: #1890ff;
        color: white;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
    `;
    submitBtn.onMouseOver = (e) => {
        e.target.style.background = '#40a9ff';
    };
    submitBtn.onMouseOut = (e) => {
        e.target.style.background = '#1890ff';
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const result = Object.fromEntries(data);
        if (onSubmit) onSubmit(result);
        container.remove();
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(submitBtn);
    modal.appendChild(header);
    modal.appendChild(form);
    modal.appendChild(footer);
    container.appendChild(modal);
    document.body.appendChild(container);

    // Fechar ao clicar fora
    container.onclick = (e) => {
        if (e.target === container) {
            container.remove();
        }
    };
}

// Criar um toast simples estilo Ant Design
function showAntDMessage(type = 'info', message = '', duration = 3) {
    if (!window.AntD || !window.AntD.message) {
        console.warn('Ant Design message não disponível');
        return;
    }

    window.AntD.message[type]({
        content: message,
        duration: duration
    });
}

// Inicializar quando o Ant Design estiver pronto
waitForAntD(() => {
    initializeAntD();
    console.log('✓ Componentes Ant Design carregados');
});
