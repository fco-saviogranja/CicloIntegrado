/**
 * Ciclo Integrado - User Header Module
 * Carrega e atualiza informações do usuário no header de todas as páginas
 */

function initUserHeader() {
    const user = API.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Atualizar informações do município
    updateMunicipioInfo(user);

    // Atualizar informações do usuário no header
    updateUserInfo(user);

    // Configurar dropdown do usuário
    setupUserDropdown();

    // Configurar menu de configurações (apenas admin)
    setupConfigMenu(user);

    // Configurar menu mobile
    setupMobileMenu();
}

function updateMunicipioInfo(user) {
    const municipioLogoEl = document.getElementById('municipio-logo');
    const municipioNomeEl = document.getElementById('municipio-nome');
    
    if (!municipioLogoEl || !municipioNomeEl) return;

    const municipioNome = user.municipio_nome || user.municipio || '';
    
    if (municipioNome) {
        const iniciais = municipioNome
            .split(' ')
            .map(palavra => palavra[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        
        municipioLogoEl.textContent = iniciais;
        municipioNomeEl.textContent = municipioNome;
    } else {
        municipioLogoEl.textContent = 'CI';
        municipioNomeEl.textContent = 'Ciclo Integrado';
    }
}

function updateUserInfo(user) {
    const userName = user.nome || user.name || user.email || '';
    const secretaria = user.secretaria_sigla || user.secretaria_nome || user.secretaria || '';
    
    const roleMap = {
        'admin_municipal': 'Administrador Municipal',
        'admin_municipio': 'Administrador Municipal',
        'gestor': 'Gestor de Contratos',
        'fiscal': 'Fiscal de Contratos',
        'admin_master': 'Admin Master'
    };
    
    const roleText = roleMap[user.role] || user.role || 'Usuário';
    const roleFull = secretaria ? `${roleText} (${secretaria})` : roleText;

    // Iniciais do usuário
    const initials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || '?';

    // Atualizar elementos do header
    const userInitialsEl = document.getElementById('userInitials');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userPhotoEl = document.getElementById('userPhoto');
    const userPhotoPlaceholderEl = document.getElementById('userPhotoPlaceholder');

    if (userInitialsEl) userInitialsEl.textContent = initials;
    if (userNameEl) userNameEl.textContent = userName;
    if (userRoleEl) userRoleEl.textContent = roleFull;

    // Foto do usuário
    const fotoUrl = user.foto_url || user.photo_url || '';
    if (fotoUrl && userPhotoEl && userPhotoPlaceholderEl) {
        userPhotoEl.src = fotoUrl;
        userPhotoEl.style.display = 'block';
        userPhotoPlaceholderEl.style.display = 'none';
    } else if (userPhotoEl && userPhotoPlaceholderEl) {
        userPhotoEl.style.display = 'none';
        userPhotoPlaceholderEl.style.display = 'flex';
    }

    // Atualizar dropdown
    const dropdownUserNameEl = document.getElementById('dropdownUserName');
    const dropdownUserRoleEl = document.getElementById('dropdownUserRole');
    if (dropdownUserNameEl) dropdownUserNameEl.textContent = userName;
    if (dropdownUserRoleEl) dropdownUserRoleEl.textContent = roleFull;
}

function setupUserDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    
    if (!userMenuBtn || !userMenuDropdown) return;

    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        userMenuDropdown.classList.add('hidden');
    });
}

function setupConfigMenu(user) {
    const menuConfigEl = document.getElementById('menu-configuracoes');
    if (!menuConfigEl) return;

    const isAdminMunicipal = user.role === 'admin_municipal' || user.role === 'admin_municipio';
    const isAdminMaster = user.role === 'admin_master';

    if (isAdminMunicipal || isAdminMaster) {
        menuConfigEl.style.display = 'flex';
    }
}

function setupMobileMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (!menuBtn || !sidebar || !overlay) return;

    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-hidden');
        overlay.classList.toggle('hidden');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.add('sidebar-hidden');
        overlay.classList.add('hidden');
    });
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        API.logout();
        window.location.href = 'login.html';
    }
}

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserHeader);
} else {
    initUserHeader();
}
