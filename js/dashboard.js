/**
 * Ciclo Integrado - Dashboard Administrativo
 * Lógica de integração com a API
 */

// ============================================
// PROTEÇÃO E INICIALIZAÇÃO
// ============================================

// Verificar autenticação ao carregar
if (!requireAdminMaster()) {
    // Redireciona automaticamente se não for Admin Master
    throw new Error('Acesso negado');
}

// Variáveis globais
let dashboardData = null;
let municipiosData = [];
let usuariosData = [];
let filteredMunicipios = [];
let filteredUsuarios = [];
const municipioFilters = {
    search: '',
    plano: 'all',
    status: 'all',
    sort: 'name-asc'
};
const usuarioFilters = {
    search: '',
    role: 'all',
    status: 'all',
    municipio: 'all'
};
let municipioBeingEdited = null;
let usuariosTotalCount = 0;
let municipiosTotalCount = 0;
let receitaData = null;
let municipioPendingDelete = null;
let usuarioBeingEdited = null;
let usuarioPendingDelete = null;

const currentUser = API.getCurrentUser();

const sectionMetadata = {
    dashboard: {
        title: 'Dashboard Administrativo',
        subtitle: 'Visão geral da plataforma'
    },
    municipios: {
        title: 'Municípios',
        subtitle: 'Gerencie cadastros, licenças e contatos municipais'
    },
    usuarios: {
        title: 'Usuários',
        subtitle: 'Controle contas, permissões e acessos vinculados'
    },
    faturamento: {
        title: 'Faturamento',
        subtitle: 'Módulo em desenvolvimento'
    },
    relatorios: {
        title: 'Relatórios',
        subtitle: 'Módulo em desenvolvimento'
    },
    configuracoes: {
        title: 'Configurações',
        subtitle: 'Módulo em desenvolvimento'
    }
};

function switchSection(section) {
    const targetSection = sectionMetadata[section] ? section : 'dashboard';

    Object.keys(sectionMetadata).forEach(key => {
        const container = document.getElementById(`section-${key}`);
        if (!container) return;
        if (key === targetSection) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    });

    const headerTitle = document.querySelector('header h2');
    const headerSubtitle = document.querySelector('header p');
    if (headerTitle) headerTitle.textContent = sectionMetadata[targetSection].title;
    if (headerSubtitle) headerSubtitle.textContent = sectionMetadata[targetSection].subtitle;

    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href') || '#dashboard';
        const navTarget = href.replace('#', '') || 'dashboard';
        if (navTarget === targetSection) {
            item.classList.add('bg-primary/10', 'text-primary');
            item.classList.remove('text-text-secondary', 'dark:text-gray-400');
        } else {
            item.classList.remove('bg-primary/10', 'text-primary');
            item.classList.add('text-text-secondary', 'dark:text-gray-400');
        }
    });
}

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

/**
 * Carrega todos os dados do dashboard
 */
async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Carregar dados em paralelo
        const [dashboard, municipios, receita, usuarios] = await Promise.all([
            API.getDashboard().catch(() => ({
                total_municipios: 0,
                municipios_ativos: 0,
                total_usuarios: 0,
                usuarios_ativos: 0,
                contratos_totais: 0,
                contratos_ativos: 0,
                receita_mensal: 0,
                receita_anual: 0,
                licencas_vencendo_30_dias: 0
            })),
            API.getMunicipios().catch(err => ({ municipios: [] })),
            API.getReceita().catch(() => ({
                receita_mensal_total: 0,
                receita_anual_projetada: 0,
                ticket_medio_municipio: 0,
                municipios_ativos: 0,
                planos: {}
            })),
            API.getUsuarios().catch(() => ({ usuarios: [] }))
        ]);
        
        dashboardData = dashboard;

        const municipiosList = municipios?.municipalities
            || municipios?.municipios
            || municipios?.data
            || municipios;
        municipiosData = Array.isArray(municipiosList) ? municipiosList : [];
        municipiosTotalCount = typeof municipios?.total === 'number'
            ? municipios.total
            : municipiosData.length;

        const usuariosList = usuarios?.usuarios
            || usuarios?.data
            || usuarios;
        usuariosData = Array.isArray(usuariosList) ? usuariosList : [];
        usuariosTotalCount = typeof usuarios?.total === 'number'
            ? usuarios.total
            : usuariosData.length;
        
        // Atualizar UI
        updateDashboardStats(dashboard);
        applyMunicipioFilters();
        populateUserMunicipioSelects();
        syncUsuarioFilterControls();
        applyUsuarioFilters();
        receitaData = receita;
        updateRevenueChart(receitaData);
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showError(`Erro ao carregar dados: ${error.message}`);
        console.error('Dashboard load error:', error);
    }
}

/**
 * Atualiza as métricas principais
 */
function updateDashboardStats(data) {
    try {
        const totalMunicipios = data.total_municipios || 0;
        const municipiosAtivos = data.municipios_ativos || 0;
        const totalUsuarios = data.total_usuarios || 0;
        const usuariosAtivos = data.usuarios_ativos || 0;
        const receitaMensal = data.receita_mensal || 0;
        const receitaAnual = data.receita_anual || receitaMensal * 12;
        const totalContratos = data.contratos_totais || data.contratos_total || 0;
        const contratosAtivos = data.contratos_ativos || 0;

        const munCard = document.getElementById('stat-municipios-total');
        if (munCard) munCard.textContent = totalMunicipios;
        const munSubtitle = document.getElementById('stat-municipios-ativos');
        if (munSubtitle) munSubtitle.textContent = `Municípios ativos: ${municipiosAtivos}`;

        const userCard = document.getElementById('stat-usuarios-total');
        if (userCard) userCard.textContent = totalUsuarios;
        const userSubtitle = document.getElementById('stat-usuarios-ativos');
        if (userSubtitle) userSubtitle.textContent = `Usuários ativos: ${usuariosAtivos}`;

        const revCard = document.getElementById('stat-receita-mensal');
        if (revCard) revCard.textContent = formatCurrency(receitaMensal);
        const revSubtitle = document.getElementById('stat-receita-anual');
        if (revSubtitle) revSubtitle.textContent = `Projeção anual: ${formatCurrency(receitaAnual)}`;

        const contrCard = document.getElementById('stat-contratos-total');
        if (contrCard) contrCard.textContent = totalContratos;
        const contrSubtitle = document.getElementById('stat-contratos-ativos');
        if (contrSubtitle) contrSubtitle.textContent = `Ativos: ${contratosAtivos}`;

        const planos = data.planos || {};
        const planConfigs = [
            { key: 'premium', countId: 'plan-premium-count', summaryId: 'plan-premium-summary' },
            { key: 'profissional', countId: 'plan-profissional-count', summaryId: 'plan-profissional-summary' },
            { key: 'standard', countId: 'plan-standard-count', summaryId: 'plan-standard-summary' }
        ];

        planConfigs.forEach(config => {
            const planData = planos[config.key] || { quantidade: 0, ativos: 0, receita_mensal: 0 };
            const countEl = document.getElementById(config.countId);
            if (countEl) {
                countEl.textContent = planData.quantidade || 0;
            }
            const summaryEl = document.getElementById(config.summaryId);
            if (summaryEl) {
                const ativosLabel = planData.ativos ? `${planData.ativos} ativos • ` : '';
                summaryEl.textContent = `${ativosLabel}Receita mensal: ${formatCurrency(planData.receita_mensal || 0)}`;
            }
        });
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// ============================================
// FILTROS E ORDENAÇÃO DE MUNICÍPIOS
// ============================================

function normalizeValue(value) {
    return value ? value.toString().trim().toLowerCase() : '';
}

function getMunicipioName(mun) {
    return mun.nome || mun.municipio_nome || mun.cidade || mun.municipio_id || '';
}

function getMunicipioPlanoValue(mun) {
    return normalizeValue(mun.plano || mun.license_type || '');
}

function formatPlanoLabel(value) {
    const normalized = normalizeValue(value);
    if (!normalized) return 'Standard';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getMunicipioStatusValue(mun) {
    const status = normalizeValue(mun.status || 'ativo');
    if (status === 'active') return 'ativo';
    if (status === 'inactive') return 'inativo';
    return status || 'ativo';
}

function getMunicipioLicenseDate(mun) {
    const value = mun.data_vencimento_licenca || mun.license_expires;
    if (!value) return null;
    if (typeof value === 'object' && value.seconds) {
        return new Date(value.seconds * 1000);
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function sortMunicipios(list) {
    const sortOption = municipioFilters.sort;
    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

    return list.sort((a, b) => {
        const nameA = getMunicipioName(a);
        const nameB = getMunicipioName(b);
        const dateA = getMunicipioLicenseDate(a);
        const dateB = getMunicipioLicenseDate(b);

        switch (sortOption) {
            case 'name-desc':
                return collator.compare(nameB, nameA);
            case 'license-asc':
                return (dateA ? dateA.getTime() : Infinity) - (dateB ? dateB.getTime() : Infinity);
            case 'license-desc':
                return (dateB ? dateB.getTime() : -Infinity) - (dateA ? dateA.getTime() : -Infinity);
            default:
                return collator.compare(nameA, nameB);
        }
    });
}

function applyMunicipioFilters() {
    let list = Array.isArray(municipiosData) ? [...municipiosData] : [];
    const searchTerm = normalizeValue(municipioFilters.search);

    if (searchTerm) {
        list = list.filter(mun => {
            const searchable = [
                getMunicipioName(mun),
                mun.estado,
                mun.cidade,
                mun.municipio_id,
                mun.cep,
                mun.license_type
            ].map(value => normalizeValue(value)).join(' ');
            return searchable.includes(searchTerm);
        });
    }

    if (municipioFilters.plano !== 'all') {
        list = list.filter(mun => getMunicipioPlanoValue(mun) === municipioFilters.plano);
    }

    if (municipioFilters.status !== 'all') {
        list = list.filter(mun => getMunicipioStatusValue(mun) === municipioFilters.status);
    }

    list = sortMunicipios(list);
    filteredMunicipios = list;
    updateMunicipiosTable(filteredMunicipios, municipiosTotalCount);
}

function syncMunicipioFilterControls() {
    const searchInput = document.getElementById('municipio-search');
    if (searchInput && searchInput.value !== municipioFilters.search) {
        searchInput.value = municipioFilters.search;
    }

    const planoSelect = document.getElementById('municipio-filter-plano');
    if (planoSelect && planoSelect.value !== municipioFilters.plano) {
        planoSelect.value = municipioFilters.plano;
    }

    const statusSelect = document.getElementById('municipio-filter-status');
    if (statusSelect && statusSelect.value !== municipioFilters.status) {
        statusSelect.value = municipioFilters.status;
    }

    const sortSelect = document.getElementById('municipio-sort');
    if (sortSelect && sortSelect.value !== municipioFilters.sort) {
        sortSelect.value = municipioFilters.sort;
    }
}

function resetMunicipioFilters() {
    municipioFilters.search = '';
    municipioFilters.plano = 'all';
    municipioFilters.status = 'all';
    municipioFilters.sort = 'name-asc';
    syncMunicipioFilterControls();
    applyMunicipioFilters();
}

/**
 * Atualiza a tabela de municípios
 */
function updateMunicipiosTable(municipios, total = null) {
    const tbody = document.getElementById('municipios-table');
    if (!tbody) return;
    
    const totalCount = typeof total === 'number' ? total : municipios.length;
    const hasRegisteredMunicipios = totalCount > 0;

    if (!Array.isArray(municipios) || municipios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-text-secondary dark:text-gray-400">
                    <div class="flex flex-col items-center gap-4">
                        <span class="material-symbols-outlined text-5xl opacity-50">location_city</span>
                        <p>${hasRegisteredMunicipios ? 'Nenhum município encontrado com os filtros aplicados.' : 'Nenhum município cadastrado ainda.'}</p>
                        ${hasRegisteredMunicipios
                            ? `<button onclick="resetMunicipioFilters()" class="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Limpar filtros
                               </button>`
                            : `<button onclick="openCreateModal()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                                    Cadastrar Primeiro Município
                               </button>`}
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = municipios.map(mun => {
        const municipioId = mun.municipio_id || mun.id || '';
        const nomeMunicipio = mun.nome || mun.municipio_nome || mun.cidade || 'Sem nome';
        const cidade = mun.cidade || mun.municipio_nome || '';
        const estado = mun.estado ? `- ${mun.estado}` : '';
        const planoLabel = formatPlanoLabel(mun.plano || mun.license_type || 'standard');
        const maxUsuarios = mun.max_usuarios ?? mun.max_users ?? 0;
        const usuariosAtuais = mun.usuarios_atuais ?? mun.current_users ?? 0;
        const usagePercent = maxUsuarios > 0 ? Math.round((usuariosAtuais / maxUsuarios) * 100) : 0;
        const licencaVencimento = mun.data_vencimento_licenca || mun.license_expires;
        const diasRestantes = getDaysUntil(licencaVencimento);
        const statusRaw = (mun.status || 'ativo').toString().toLowerCase();
        const statusColor = diasRestantes > 30 ? 'green' : diasRestantes > 0 ? 'amber' : 'red';
        const statusText = statusRaw === 'inactive' || statusRaw === 'inativo' ? 'Inativo' : 'Ativo';
        
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">location_city</span>
                        </div>
                        <div>
                            <p class="font-medium">${nomeMunicipio}</p>
                            <p class="text-sm text-text-secondary dark:text-gray-400">${cidade} ${estado}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">${planoLabel}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full bg-green-500 rounded-full" style="width: ${usagePercent}%"></div>
                        </div>
                        <span class="text-sm font-medium">${usuariosAtuais}/${maxUsuarios}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <p class="text-sm">${formatDate(licencaVencimento)}</p>
                    <p class="text-xs text-${statusColor}-600 dark:text-${statusColor}-400">${diasRestantes !== null ? diasRestantes + ' dias' : '-'}</p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium bg-${statusColor}-100 dark:bg-${statusColor}-900/30 text-${statusColor}-600 dark:text-${statusColor}-400 rounded-full flex items-center gap-1 w-fit">
                        <span class="w-1.5 h-1.5 bg-${statusColor}-500 rounded-full"></span>
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                        <button onclick="editMunicipio('${municipioId}')" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Editar">
                            <span class="material-symbols-outlined text-lg text-text-secondary dark:text-gray-400">edit</span>
                        </button>
                        <button onclick="viewMunicipio('${municipioId}')" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Ver detalhes">
                            <span class="material-symbols-outlined text-lg text-text-secondary dark:text-gray-400">visibility</span>
                        </button>
                        <button onclick="deleteMunicipio('${municipioId}')" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir">
                            <span class="material-symbols-outlined text-lg text-red-600 dark:text-red-400">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Atualizar contagem
    const countEl = document.querySelector('.municipios-footer-count');
    if (countEl) {
        countEl.textContent = `Mostrando ${municipios.length} de ${totalCount} municípios`;
    }

    const paginator = document.querySelector('.municipios-footer-pagination');
    if (paginator) {
        if (totalCount <= municipios.length) {
            paginator.classList.add('hidden');
        } else {
            paginator.classList.remove('hidden');
        }
    }
}

// ============================================
// FILTROS E LISTAGEM DE USUÁRIOS
// ============================================

function normalizeUserStatus(status) {
    const normalized = normalizeValue(status || 'active');
    if (['inactive', 'inativo', 'desativado', 'disabled'].includes(normalized)) {
        return 'inactive';
    }
    return 'active';
}

function formatUserRole(role) {
    const labels = {
        admin_master: 'Admin Master',
        admin_municipio: 'Admin Municipal',
        gestor_contrato: 'Gestor de Contrato',
        fiscal_contrato: 'Fiscal de Contrato'
    };
    return labels[role] || (role ? role.replace(/_/g, ' ') : '-');
}

function formatUserStatusLabel(status) {
    return status === 'inactive' ? 'Inativo' : 'Ativo';
}

function getUserStatusBadgeClasses(status) {
    return status === 'inactive'
        ? 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
        : 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300';
}

function getMunicipioDisplayNameById(municipioId) {
    if (!municipioId) return '-';
    const municipio = municipiosData.find(m => (m.municipio_id || m.id) === municipioId);
    if (!municipio) return '-';
    return getMunicipioName(municipio) || municipio.municipio_nome || municipio.nome || '-';
}

function formatDateTime(value) {
    if (!value) return '';
    const date = typeof value === 'object' && value.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
}

function applyUsuarioFilters() {
    let list = Array.isArray(usuariosData) ? [...usuariosData] : [];
    const searchTerm = normalizeValue(usuarioFilters.search);

    if (searchTerm) {
        list = list.filter(usuario => {
            const searchable = [
                usuario.name,
                usuario.email,
                usuario.cpf,
                usuario.role,
                usuario.municipio_nome,
                usuario.phone
            ].map(value => normalizeValue(value)).join(' ');
            return searchable.includes(searchTerm);
        });
    }

    if (usuarioFilters.role !== 'all') {
        list = list.filter(usuario => normalizeValue(usuario.role) === usuarioFilters.role);
    }

    if (usuarioFilters.status !== 'all') {
        list = list.filter(usuario => normalizeUserStatus(usuario.status) === usuarioFilters.status);
    }

    if (usuarioFilters.municipio !== 'all') {
        list = list.filter(usuario => {
            const usuarioMunicipioId = usuario.municipio_id || usuario.municipioId || usuario.municipio;
            return usuarioMunicipioId === usuarioFilters.municipio;
        });
    }

    filteredUsuarios = list;
    updateUsuariosTable(filteredUsuarios, usuariosTotalCount);
}

function syncUsuarioFilterControls() {
    const searchInput = document.getElementById('usuario-search');
    if (searchInput && searchInput.value !== usuarioFilters.search) {
        searchInput.value = usuarioFilters.search;
    }

    const roleSelect = document.getElementById('usuario-filter-role');
    if (roleSelect && roleSelect.value !== usuarioFilters.role) {
        roleSelect.value = usuarioFilters.role;
    }

    const statusSelect = document.getElementById('usuario-filter-status');
    if (statusSelect && statusSelect.value !== usuarioFilters.status) {
        statusSelect.value = usuarioFilters.status;
    }

    const municipioSelect = document.getElementById('usuario-filter-municipio');
    if (municipioSelect && municipioSelect.value !== usuarioFilters.municipio) {
        municipioSelect.value = usuarioFilters.municipio;
    }
}

function resetUsuarioFilters() {
    usuarioFilters.search = '';
    usuarioFilters.role = 'all';
    usuarioFilters.status = 'all';
    usuarioFilters.municipio = 'all';
    syncUsuarioFilterControls();
    applyUsuarioFilters();
}

function updateUsuariosTable(usuarios, total = null) {
    const tbody = document.getElementById('usuarios-table');
    if (!tbody) return;

    const totalCount = typeof total === 'number' ? total : usuarios.length;
    const hasRegisteredUsuarios = totalCount > 0;

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-text-secondary dark:text-gray-400">
                    <div class="flex flex-col items-center gap-4">
                        <span class="material-symbols-outlined text-5xl opacity-50">group</span>
                        <p>${hasRegisteredUsuarios ? 'Nenhum usuário encontrado com os filtros aplicados.' : 'Nenhum usuário cadastrado ainda.'}</p>
                        ${hasRegisteredUsuarios
                            ? `<button onclick="resetUsuarioFilters()" class="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Limpar filtros
                               </button>`
                            : `<button onclick="openCreateUserModal()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                                    Cadastrar primeiro usuário
                               </button>`}
                    </div>
                </td>
            </tr>
        `;
        const footerCount = document.querySelector('.usuarios-footer-count');
        if (footerCount) {
            footerCount.textContent = `Mostrando 0 de ${totalCount} usuários`;
        }
        const paginator = document.querySelector('.usuarios-footer-pagination');
        if (paginator) paginator.classList.add('hidden');
        return;
    }

    const rows = usuarios.map(usuario => {
        const usuarioId = usuario.id;
        const nome = usuario.name || 'Usuário sem nome';
        const email = usuario.email || '-';
        const role = formatUserRole(usuario.role);
        const status = normalizeUserStatus(usuario.status);
        const municipioNome = usuario.municipio_nome
            || getMunicipioDisplayNameById(usuario.municipio_id || usuario.municipioId)
            || '-';
        const createdAt = formatDateTime(usuario.created_at);
        const lastLogin = formatDateTime(usuario.last_login);
        const statusClasses = getUserStatusBadgeClasses(status);
        const statusLabel = formatUserStatusLabel(status);
        const isSelf = currentUser && (currentUser.id === usuarioId || currentUser.email === email);
        const auditLines = [];
        if (createdAt) auditLines.push(`Criado em ${createdAt}`);
        if (lastLogin) auditLines.push(`Último acesso ${lastLogin}`);
        const auditText = auditLines.join(' • ');

        const actionButtons = `
            <div class="flex items-center justify-end gap-2">
                <button onclick="editUsuario('${usuarioId}')" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Editar">
                    <span class="material-symbols-outlined text-lg text-text-secondary dark:text-gray-400">edit</span>
                </button>
                ${isSelf ? '' : `
                    <button onclick="deleteUsuario('${usuarioId}')" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir">
                        <span class="material-symbols-outlined text-lg text-red-600 dark:text-red-400">delete</span>
                    </button>`}
            </div>
        `;

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex flex-col">
                        <span class="font-medium">${nome}</span>
                        <span class="text-sm text-text-secondary dark:text-gray-400">${email}</span>
                        ${auditText ? `<span class="text-xs text-text-secondary/80 dark:text-gray-500 mt-1">${auditText}</span>` : ''}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">${role}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm">${municipioNome}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="${statusClasses}">${statusLabel}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                    ${actionButtons}
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;

    const footerCount = document.querySelector('.usuarios-footer-count');
    if (footerCount) {
        footerCount.textContent = `Mostrando ${usuarios.length} de ${totalCount} usuários`;
    }

    const paginator = document.querySelector('.usuarios-footer-pagination');
    if (paginator) {
        if (totalCount <= usuarios.length) {
            paginator.classList.add('hidden');
        } else {
            paginator.classList.remove('hidden');
        }
    }
}

function populateUserMunicipioSelects() {
    const selects = document.querySelectorAll('.user-municipio-select');
    if (!selects.length) return;

    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
    const sortedMunicipios = [...municipiosData].sort((a, b) => (
        collator.compare(getMunicipioName(a), getMunicipioName(b))
    ));

    selects.forEach(select => {
        const currentValue = select.value;
        const placeholder = select.dataset.placeholder || 'Selecione o município';
        select.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = placeholder;
        select.appendChild(defaultOption);

        sortedMunicipios.forEach(municipio => {
            const option = document.createElement('option');
            const id = municipio.municipio_id || municipio.id;
            option.value = id;
            option.textContent = getMunicipioName(municipio);
            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    });

    const filterSelect = document.getElementById('usuario-filter-municipio');
    if (filterSelect) {
        const previousValue = filterSelect.value;
        filterSelect.innerHTML = '';
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Todos os municípios';
        filterSelect.appendChild(allOption);

        sortedMunicipios.forEach(municipio => {
            const option = document.createElement('option');
            const id = municipio.municipio_id || municipio.id;
            option.value = id;
            option.textContent = getMunicipioName(municipio);
            filterSelect.appendChild(option);
        });

        if (previousValue && previousValue !== 'all') {
            const exists = sortedMunicipios.some(m => (m.municipio_id || m.id) === previousValue);
            filterSelect.value = exists ? previousValue : 'all';
        } else {
            filterSelect.value = 'all';
        }

        usuarioFilters.municipio = filterSelect.value;
    }
}

/**
 * Atualiza o gráfico de receita
 */
function updateRevenueChart(receita) {
    const container = document.getElementById('revenue-history');
    if (!container) return;

    if (!receita || !Array.isArray(receita.historico) || receita.historico.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-text-secondary dark:text-gray-400">
                Nenhum dado de receita disponível ainda.
            </div>
        `;
        return;
    }

    const maxReceita = Math.max(...receita.historico.map(item => item.receita_mensal || 0), 0);

    container.innerHTML = receita.historico.map(item => {
        const receitaValor = item.receita_mensal || 0;
        const percentual = maxReceita > 0 ? Math.round((receitaValor / maxReceita) * 100) : 0;
        const largura = Math.max(percentual, receitaValor > 0 ? 12 : 0);
        const label = item.mes || '';

        return `
            <div>
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-text-secondary dark:text-gray-400">${label}</span>
                    <span class="font-medium">${formatCurrency(receitaValor)}</span>
                </div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="chart-bar h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style="width: ${largura}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// CRUD DE MUNICÍPIOS
// ============================================

/**
 * Criar novo município
 */
async function createMunicipioSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const municipioId = formData.get('nome')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    const data = {
        municipio_id: municipioId,
        nome: formData.get('nome'),
        cidade: formData.get('nome'),
        estado: formData.get('estado'),
        plano: formData.get('plano') || 'standard',
        max_usuarios: parseInt(formData.get('max_usuarios')) || 20,
        data_vencimento_licenca: formData.get('data_vencimento') || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        usuarios_atuais: 0,
        contato_nome: formData.get('contato_nome') || '',
        contato_email: formData.get('contato_email') || '',
        contato_telefone: formData.get('contato_telefone') || '',
        observacoes: formData.get('observacoes') || '',
        documentos: (formData.get('documentos') || '')
            .split(/[\n,;]+/)
            .map(item => item.trim())
            .filter(Boolean)
    };
    
    try {
        showLoading(true);
        await API.createMunicipio(data);
        showLoading(false);
        showSuccess('Município criado com sucesso!');
        closeCreateModal();
        form.reset();
        await loadDashboardData(); // Recarregar dados
    } catch (error) {
        showLoading(false);
        showError(`Erro ao criar município: ${error.message}`);
        console.error('Erro ao criar município:', error);
    }
}

/**
 * Editar município
 */
async function editMunicipio(id) {
    try {
        showLoading(true);
        const municipio = await loadMunicipioDetails(id);
        showLoading(false);

        if (!municipio) {
            showError('Município não encontrado.');
            return;
        }

        municipioBeingEdited = municipio;
        populateEditMunicipioForm(municipio);
        openEditModal();
    } catch (error) {
        showLoading(false);
        console.error('Erro ao carregar município para edição:', error);
        showError('Não foi possível carregar os dados do município.');
    }
}

/**
 * Ver detalhes do município
 */
async function viewMunicipio(id) {
    try {
        showLoading(true);
        const municipio = await loadMunicipioDetails(id);
        showLoading(false);

        if (!municipio) {
            showError('Município não encontrado.');
            return;
        }

        populateViewMunicipioModal(municipio);
        openViewModal();
    } catch (error) {
        showLoading(false);
        console.error('Erro ao visualizar município:', error);
        showError('Não foi possível carregar os dados do município.');
    }
}

/**
 * Deletar município
 */
async function deleteMunicipio(id) {
    const municipio = municipiosData.find(m => (m.municipio_id || m.id) === id)
        || filteredMunicipios.find(m => (m.municipio_id || m.id) === id);

    if (!municipio) {
        showError('Não foi possível identificar o município selecionado.');
        return;
    }

    municipioPendingDelete = municipio;

    const messageEl = document.getElementById('deleteMunicipioMessage');
    if (messageEl) {
        const nomeMunicipio = getMunicipioName(municipio) || id;
        messageEl.textContent = `Tem certeza que deseja excluir ${nomeMunicipio}? Esta ação não pode ser desfeita.`;
    }

    openDeleteModal();
}

async function loadMunicipioDetails(id) {
    const cached = municipiosData.find(m => (m.municipio_id || m.id) === id)
        || filteredMunicipios.find(m => (m.municipio_id || m.id) === id);

    try {
        const response = await API.getMunicipio(id);
        if (response && response.municipio) {
            return {
                ...cached,
                ...response.municipio,
                statistics: response.statistics || cached?.statistics
            };
        }
    } catch (error) {
        console.warn('Falha ao buscar detalhes completos do município:', error);
    }

    return cached || null;
}

function populateViewMunicipioModal(mun) {
    const nomeEl = document.getElementById('view-municipio-nome');
    const estadoEl = document.getElementById('view-municipio-estado');
    const planoEl = document.getElementById('view-municipio-plano');
    const usuariosEl = document.getElementById('view-municipio-usuarios');
    const licencaEl = document.getElementById('view-municipio-licenca');
    const statusEl = document.getElementById('view-municipio-status');
    const createdAtEl = document.getElementById('view-municipio-created-at');
    const createdByEl = document.getElementById('view-municipio-created-by');
    const updatedAtEl = document.getElementById('view-municipio-updated-at');
    const updatedByEl = document.getElementById('view-municipio-updated-by');
    const contatoEl = document.getElementById('view-municipio-contato');
    const telefoneEl = document.getElementById('view-municipio-telefone');
    const documentosEl = document.getElementById('view-municipio-documentos');
    const observacoesEl = document.getElementById('view-municipio-observacoes');
    const contactEmail = mun.contato_email || '';
    const contactName = mun.contato_nome || '';
    const documentosList = Array.isArray(mun.documentos)
        ? mun.documentos
        : (mun.documentos ? [mun.documentos] : []);

    const nome = getMunicipioName(mun);
    const status = getMunicipioStatusValue(mun);
    const maxUsuarios = mun.max_usuarios ?? mun.max_users ?? 0;
    const usuariosAtuais = mun.usuarios_atuais ?? mun.current_users ?? mun.statistics?.users ?? 0;
    const licencaDate = mun.data_vencimento_licenca || mun.license_expires;

    if (nomeEl) nomeEl.textContent = nome;
    if (estadoEl) estadoEl.textContent = mun.estado || '-';
    if (planoEl) planoEl.textContent = formatPlanoLabel(mun.plano || mun.license_type);
    if (usuariosEl) usuariosEl.textContent = `${usuariosAtuais}/${maxUsuarios}`;
    if (licencaEl) licencaEl.textContent = formatDate(licencaDate);
    if (statusEl) statusEl.textContent = status === 'inativo' ? 'Inativo' : 'Ativo';
    if (createdAtEl) createdAtEl.textContent = formatDate(mun.created_at);
    if (createdByEl) createdByEl.textContent = mun.created_by || '-';
    if (updatedAtEl) updatedAtEl.textContent = formatDate(mun.updated_at) || '-';
    if (updatedByEl) updatedByEl.textContent = mun.updated_by || '-';
    if (contatoEl) {
        contatoEl.innerHTML = '';
        const hasName = !!contactName;
        const hasEmail = !!contactEmail;

        if (hasName) {
            contatoEl.appendChild(document.createTextNode(contactName));
        }

        if (hasName && hasEmail) {
            contatoEl.appendChild(document.createTextNode(' · '));
        }

        if (hasEmail) {
            const link = document.createElement('a');
            link.href = `mailto:${contactEmail}`;
            link.textContent = contactEmail;
            link.className = 'text-primary hover:underline';
            contatoEl.appendChild(link);
        }

        if (!hasName && !hasEmail) {
            contatoEl.textContent = '-';
        }
    }
    if (telefoneEl) telefoneEl.textContent = mun.contato_telefone || '-';
    if (observacoesEl) {
        const obs = mun.observacoes ? mun.observacoes.trim() : '';
        observacoesEl.textContent = obs || 'Nenhuma observação registrada.';
    }
    if (documentosEl) {
        documentosEl.innerHTML = '';
        if (documentosList.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'text-text-secondary dark:text-gray-500';
            emptyItem.textContent = 'Nenhum documento cadastrado.';
            documentosEl.appendChild(emptyItem);
        } else {
            documentosList.forEach((doc, index) => {
                const li = document.createElement('li');
                let url = '';
                let label = '';

                if (typeof doc === 'string') {
                    url = doc.trim();
                    label = doc.trim() || `Documento ${index + 1}`;
                } else if (doc) {
                    url = (doc.url || doc.link || '').trim();
                    label = doc.label || doc.descricao || doc.nome || `Documento ${index + 1}`;
                }

                if (!label) {
                    label = `Documento ${index + 1}`;
                }

                if (url) {
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    link.rel = 'noopener';
                    link.className = 'text-primary hover:underline';
                    link.textContent = label;
                    li.appendChild(link);
                } else {
                    li.className = 'text-text-secondary dark:text-gray-400';
                    li.textContent = label;
                }

                documentosEl.appendChild(li);
            });
        }
    }
}

function populateEditMunicipioForm(mun) {
    const form = document.getElementById('editMunicipioForm');
    if (!form) return;

    const municipioId = mun.municipio_id || mun.id;
    form.dataset.municipioId = municipioId;

    form.querySelector('[name="nome"]').value = getMunicipioName(mun);
    form.querySelector('[name="estado"]').value = mun.estado || '';
    form.querySelector('[name="plano"]').value = getMunicipioPlanoValue(mun) || 'standard';
    form.querySelector('[name="max_usuarios"]').value = mun.max_usuarios ?? mun.max_users ?? 0;
    form.querySelector('[name="data_vencimento"]').value = formatInputDate(mun.data_vencimento_licenca || mun.license_expires);
    form.querySelector('[name="status"]').value = getMunicipioStatusValue(mun);

    const usuariosAtuais = form.querySelector('[name="usuarios_atuais"]');
    if (usuariosAtuais) {
        usuariosAtuais.value = mun.usuarios_atuais ?? mun.current_users ?? mun.statistics?.users ?? 0;
    }

    const contatoNome = form.querySelector('[name="contato_nome"]');
    if (contatoNome) contatoNome.value = mun.contato_nome || '';

    const contatoEmail = form.querySelector('[name="contato_email"]');
    if (contatoEmail) contatoEmail.value = mun.contato_email || '';

    const contatoTelefone = form.querySelector('[name="contato_telefone"]');
    if (contatoTelefone) contatoTelefone.value = mun.contato_telefone || '';

    const observacoes = form.querySelector('[name="observacoes"]');
    if (observacoes) observacoes.value = mun.observacoes || '';

    const documentos = form.querySelector('[name="documentos"]');
    if (documentos) {
        const documentosList = Array.isArray(mun.documentos)
            ? mun.documentos
            : (mun.documentos ? [mun.documentos] : []);
        documentos.value = documentosList
            .map(item => (typeof item === 'string' ? item : item?.url || ''))
            .filter(Boolean)
            .join(', ');
    }
}

function formatInputDate(dateValue) {
    if (!dateValue) return '';
    const date = typeof dateValue === 'object' && dateValue.seconds
        ? new Date(dateValue.seconds * 1000)
        : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

async function updateMunicipioSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const municipioId = form.dataset.municipioId;

    if (!municipioId) {
        showError('Município não identificado para edição.');
        return;
    }

    const formData = new FormData(form);
    const maxUsuarios = parseInt(formData.get('max_usuarios'), 10) || 0;
    const dataVencimento = formData.get('data_vencimento');
    const plano = formData.get('plano') || 'standard';
    const status = formData.get('status') || 'ativo';
    const contactName = formData.get('contato_nome') || '';
    const contactEmail = formData.get('contato_email') || '';
    const contactPhone = formData.get('contato_telefone') || '';
    const observacoes = formData.get('observacoes') || '';
    const documentos = (formData.get('documentos') || '')
        .split(/[\n,;]+/)
        .map(item => item.trim())
        .filter(Boolean);
    const statusForApi = status === 'inativo' ? 'inactive' : 'active';

    const payload = {
        nome: formData.get('nome'),
        municipio_nome: formData.get('nome'),
        estado: formData.get('estado'),
        plano,
        license_type: plano,
        max_usuarios: maxUsuarios,
        max_users: maxUsuarios,
        data_vencimento_licenca: dataVencimento,
        license_expires: dataVencimento,
        status: statusForApi,
        contato_nome: contactName,
        contato_email: contactEmail,
        contato_telefone: contactPhone,
        observacoes,
        documentos,
        usuarios_atuais: parseInt(formData.get('usuarios_atuais'), 10) || 0
    };

    try {
        showLoading(true);
        await API.updateMunicipio(municipioId, payload);
        showLoading(false);
        showSuccess('Município atualizado com sucesso!');
        closeEditModal();
        await loadDashboardData();
    } catch (error) {
        showLoading(false);
        console.error('Erro ao atualizar município:', error);
        showError(`Erro ao atualizar município: ${error.message}`);
    }
}


// ============================================
// CRUD DE USUÁRIOS
// ============================================

async function createUsuarioSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const role = formData.get('role') || 'admin_municipio';
    const municipioId = formData.get('municipio_id') || '';
    const municipio = municipiosData.find(m => (m.municipio_id || m.id) === municipioId);

    if (role !== 'admin_master' && !municipioId) {
        showError('Selecione um município para este perfil de usuário.');
        return;
    }

    const payload = {
        name: formData.get('name')?.trim(),
        email: formData.get('email')?.trim(),
        password: formData.get('password') || '',
        role,
        phone: formData.get('phone')?.trim() || '',
        cpf: formData.get('cpf')?.replace(/[^0-9]/g, '') || ''
    };

    if (role !== 'admin_master') {
        payload.municipio_id = municipioId;
        payload.municipio_nome = municipio ? getMunicipioName(municipio) : '';
    }

    try {
        showLoading(true);
        await API.createUsuario(payload);
        showLoading(false);
        showSuccess('Usuário criado com sucesso!');
        closeCreateUserModal();
        await loadDashboardData();
    } catch (error) {
        showLoading(false);
        console.error('Erro ao criar usuário:', error);
        showError(`Erro ao criar usuário: ${error.message}`);
    }
}

async function editUsuario(id) {
    try {
        showLoading(true);
        const usuario = await loadUsuarioDetails(id);
        showLoading(false);

        if (!usuario) {
            showError('Usuário não encontrado.');
            return;
        }

        usuarioBeingEdited = usuario;
        populateUserMunicipioSelects();
        populateEditUsuarioForm(usuario);
        openEditUserModal();
    } catch (error) {
        showLoading(false);
        console.error('Erro ao carregar usuário para edição:', error);
        showError('Não foi possível carregar os dados do usuário.');
    }
}

async function loadUsuarioDetails(id) {
    const cached = usuariosData.find(usuario => usuario.id === id);

    try {
        const response = await API.getUsuario(id);
        if (response && response.usuario) {
            return {
                ...cached,
                ...response.usuario
            };
        }
    } catch (error) {
        console.warn('Falha ao buscar detalhes completos do usuário:', error);
    }

    return cached || null;
}

function populateEditUsuarioForm(usuario) {
    const form = document.getElementById('editUserForm');
    if (!form) return;

    form.dataset.usuarioId = usuario.id;

    const nameField = form.querySelector('[name="name"]');
    if (nameField) nameField.value = usuario.name || '';

    const emailField = form.querySelector('[name="email"]');
    if (emailField) emailField.value = usuario.email || '';

    const phoneField = form.querySelector('[name="phone"]');
    if (phoneField) phoneField.value = usuario.phone || '';

    const cpfField = form.querySelector('[name="cpf"]');
    if (cpfField) cpfField.value = usuario.cpf || '';

    const roleField = form.querySelector('[name="role"]');
    if (roleField) roleField.value = usuario.role || 'admin_municipio';

    const statusField = form.querySelector('[name="status"]');
    if (statusField) statusField.value = normalizeUserStatus(usuario.status);

    const municipioSelect = form.querySelector('[name="municipio_id"]');
    if (municipioSelect) {
        const municipioId = usuario.municipio_id || usuario.municipioId || '';
        municipioSelect.value = municipioId || '';
    }

    updateUserMunicipioVisibility(form);

    const auditEl = document.getElementById('edit-user-audit');
    if (auditEl) {
        const createdAt = formatDateTime(usuario.created_at);
        const createdBy = usuario.created_by || '';
        const updatedAt = formatDateTime(usuario.updated_at);
        const updatedBy = usuario.updated_by || '';
        const parts = [];
        if (createdAt) parts.push(`Criado em ${createdAt}${createdBy ? ` por ${createdBy}` : ''}`);
        if (updatedAt) parts.push(`Atualizado em ${updatedAt}${updatedBy ? ` por ${updatedBy}` : ''}`);
        auditEl.textContent = parts.join(' • ');
    }
}

async function updateUsuarioSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const usuarioId = form.dataset.usuarioId;

    if (!usuarioId) {
        showError('Usuário não identificado para edição.');
        return;
    }

    const formData = new FormData(form);
    const role = formData.get('role') || 'admin_municipio';
    const status = formData.get('status') || 'active';
    const municipioId = formData.get('municipio_id') || '';
    const municipio = municipiosData.find(m => (m.municipio_id || m.id) === municipioId);

    const payload = {
        name: formData.get('name')?.trim() || '',
        phone: formData.get('phone')?.trim() || '',
        cpf: formData.get('cpf')?.replace(/[^0-9]/g, '') || '',
        role,
        status: normalizeUserStatus(status)
    };

    if (role === 'admin_master') {
        payload.municipio_id = null;
        payload.municipio_nome = null;
    } else {
        payload.municipio_id = municipioId || null;
        payload.municipio_nome = municipio ? getMunicipioName(municipio) : '';
    }

    try {
        showLoading(true);
        await API.updateUsuario(usuarioId, payload);
        showLoading(false);
        showSuccess('Usuário atualizado com sucesso!');
        closeEditUserModal();
        await loadDashboardData();
    } catch (error) {
        showLoading(false);
        console.error('Erro ao atualizar usuário:', error);
        showError(`Erro ao atualizar usuário: ${error.message}`);
    }
}

function deleteUsuario(id) {
    const usuario = usuariosData.find(item => item.id === id);

    if (!usuario) {
        showError('Não foi possível identificar o usuário selecionado.');
        return;
    }

    const isSelf = currentUser && (currentUser.id === id || currentUser.email === usuario.email);
    if (isSelf) {
        showError('Você não pode excluir o próprio usuário.');
        return;
    }

    usuarioPendingDelete = usuario;

    const messageEl = document.getElementById('deleteUsuarioMessage');
    if (messageEl) {
        const nome = usuario.name || usuario.email || id;
        messageEl.textContent = `Confirma a exclusão de ${nome}? Esta ação é permanente.`;
    }

    openDeleteUsuarioModal();
}


// ============================================
// MODAL
// ============================================

function openCreateModal() {
    document.getElementById('createModal').classList.remove('hidden');
}

function closeCreateModal() {
    document.getElementById('createModal').classList.add('hidden');
}

function openViewModal() {
    const modal = document.getElementById('viewMunicipioModal');
    if (modal) modal.classList.remove('hidden');
}

function closeViewModal() {
    const modal = document.getElementById('viewMunicipioModal');
    if (modal) modal.classList.add('hidden');
}

function openEditModal() {
    const modal = document.getElementById('editMunicipioModal');
    if (modal) modal.classList.remove('hidden');
}

function closeEditModal() {
    const modal = document.getElementById('editMunicipioModal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('editMunicipioForm');
    if (form) {
        form.reset();
        delete form.dataset.municipioId;
    }
    municipioBeingEdited = null;
}

function openDeleteModal() {
    const modal = document.getElementById('deleteMunicipioModal');
    if (modal) modal.classList.remove('hidden');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteMunicipioModal');
    if (modal) modal.classList.add('hidden');
    const messageEl = document.getElementById('deleteMunicipioMessage');
    if (messageEl) {
        messageEl.textContent = 'Tem certeza que deseja excluir este município? Esta ação não pode ser desfeita.';
    }
    municipioPendingDelete = null;
    const confirmBtn = document.getElementById('confirmDeleteMunicipioBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Excluir';
    }
}

async function confirmDeleteMunicipio() {
    if (!municipioPendingDelete) {
        showError('Seleção de município não encontrada.');
        return;
    }

    const municipioId = municipioPendingDelete.municipio_id || municipioPendingDelete.id;
    const confirmBtn = document.getElementById('confirmDeleteMunicipioBtn');

    try {
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Excluindo...';
        }

        showLoading(true);
        await API.deleteMunicipio(municipioId);
        showLoading(false);

        closeDeleteModal();
        showSuccess('Município deletado com sucesso!');
        await loadDashboardData();
    } catch (error) {
        showLoading(false);
        const message = error?.message || 'Erro ao deletar município.';
        showError(message);
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Excluir';
        }
    }
}

function openCreateUserModal() {
    populateUserMunicipioSelects();
    const modal = document.getElementById('createUserModal');
    if (modal) modal.classList.remove('hidden');
    const form = document.getElementById('createUserForm');
    if (form) updateUserMunicipioVisibility(form);
}

function closeCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('createUserForm');
    if (form) {
        form.reset();
        updateUserMunicipioVisibility(form);
    }
}

function openEditUserModal() {
    populateUserMunicipioSelects();
    const modal = document.getElementById('editUserModal');
    if (modal) modal.classList.remove('hidden');
    const form = document.getElementById('editUserForm');
    if (form) updateUserMunicipioVisibility(form);
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('editUserForm');
    if (form) {
        form.reset();
        delete form.dataset.usuarioId;
        updateUserMunicipioVisibility(form);
    }
    usuarioBeingEdited = null;
    const auditEl = document.getElementById('edit-user-audit');
    if (auditEl) auditEl.textContent = '';
}

function openDeleteUsuarioModal() {
    const modal = document.getElementById('deleteUsuarioModal');
    if (modal) modal.classList.remove('hidden');
}

function closeDeleteUsuarioModal() {
    const modal = document.getElementById('deleteUsuarioModal');
    if (modal) modal.classList.add('hidden');
    const messageEl = document.getElementById('deleteUsuarioMessage');
    if (messageEl) {
        messageEl.textContent = 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.';
    }
    usuarioPendingDelete = null;
    const confirmBtn = document.getElementById('confirmDeleteUsuarioBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Excluir';
    }
}

function updateUserMunicipioVisibility(form) {
    if (!form) return;
    const roleField = form.querySelector('[name="role"]');
    const municipioField = form.querySelector('[data-usuario-municipio-field]');
    if (!roleField || !municipioField) return;

    const role = roleField.value;
    if (role === 'admin_master') {
        municipioField.classList.add('hidden');
        const select = municipioField.querySelector('select');
        if (select) select.value = '';
    } else {
        municipioField.classList.remove('hidden');
    }
}

async function confirmDeleteUsuario() {
    if (!usuarioPendingDelete) {
        showError('Seleção de usuário não encontrada.');
        return;
    }

    const usuarioId = usuarioPendingDelete.id;
    const confirmBtn = document.getElementById('confirmDeleteUsuarioBtn');

    try {
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Excluindo...';
        }

        showLoading(true);
        await API.deleteUsuario(usuarioId);
        showLoading(false);

        closeDeleteUsuarioModal();
        showSuccess('Usuário deletado com sucesso!');
        await loadDashboardData();
    } catch (error) {
        showLoading(false);
        const message = error?.message || 'Erro ao deletar usuário.';
        showError(message);
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Excluir';
        }
    }
}

// ============================================
// TEMA
// ============================================

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize theme
if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
}

// ============================================
// NAVEGAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', event => {
            event.preventDefault();
            const target = (item.getAttribute('href') || '#dashboard').replace('#', '') || 'dashboard';
            switchSection(target);
        });
    });
    
    // Conectar form de criar município
    const createForm = document.querySelector('#createModal form');
    if (createForm) {
        createForm.addEventListener('submit', createMunicipioSubmit);
    }

    const editForm = document.getElementById('editMunicipioForm');
    if (editForm) {
        editForm.addEventListener('submit', updateMunicipioSubmit);
    }

    const confirmDeleteBtn = document.getElementById('confirmDeleteMunicipioBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteMunicipio);
    }

    const searchInput = document.getElementById('municipio-search');
    if (searchInput) {
        searchInput.addEventListener('input', event => {
            municipioFilters.search = event.target.value;
            applyMunicipioFilters();
        });
    }

    const planoSelect = document.getElementById('municipio-filter-plano');
    if (planoSelect) {
        planoSelect.addEventListener('change', event => {
            municipioFilters.plano = event.target.value;
            applyMunicipioFilters();
        });
    }

    const statusSelect = document.getElementById('municipio-filter-status');
    if (statusSelect) {
        statusSelect.addEventListener('change', event => {
            municipioFilters.status = event.target.value;
            applyMunicipioFilters();
        });
    }

    const sortSelect = document.getElementById('municipio-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', event => {
            municipioFilters.sort = event.target.value;
            applyMunicipioFilters();
        });
    }

    const userSearchInput = document.getElementById('usuario-search');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', event => {
            usuarioFilters.search = event.target.value;
            applyUsuarioFilters();
        });
    }

    const userRoleSelect = document.getElementById('usuario-filter-role');
    if (userRoleSelect) {
        userRoleSelect.addEventListener('change', event => {
            usuarioFilters.role = event.target.value;
            applyUsuarioFilters();
        });
    }

    const userStatusSelect = document.getElementById('usuario-filter-status');
    if (userStatusSelect) {
        userStatusSelect.addEventListener('change', event => {
            usuarioFilters.status = event.target.value;
            applyUsuarioFilters();
        });
    }

    const userMunicipioSelect = document.getElementById('usuario-filter-municipio');
    if (userMunicipioSelect) {
        userMunicipioSelect.addEventListener('change', event => {
            usuarioFilters.municipio = event.target.value;
            applyUsuarioFilters();
        });
    }

    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', createUsuarioSubmit);
        updateUserMunicipioVisibility(createUserForm);
    }

    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', updateUsuarioSubmit);
        updateUserMunicipioVisibility(editUserForm);
    }

    const confirmDeleteUsuarioBtn = document.getElementById('confirmDeleteUsuarioBtn');
    if (confirmDeleteUsuarioBtn) {
        confirmDeleteUsuarioBtn.addEventListener('click', confirmDeleteUsuario);
    }

    document.querySelectorAll('[data-user-role-select]').forEach(select => {
        select.addEventListener('change', () => {
            const form = select.closest('form');
            updateUserMunicipioVisibility(form);
        });
    });

    syncMunicipioFilterControls();
    syncUsuarioFilterControls();

    switchSection('dashboard');
    
    // Carregar dados do dashboard
    loadDashboardData();
    
    // Animar barras
    setTimeout(() => {
        document.querySelectorAll('.chart-bar').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 500);
});

// Logout
function logout() {
    if (confirm('Deseja realmente sair?')) {
        API.logout();
    }
}
