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
const municipioFilters = {
    search: '',
    plano: 'all',
    status: 'all',
    sort: 'name-asc'
};
let municipioBeingEdited = null;
let municipiosTotalCount = 0;

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
        const [dashboard, municipios, receita] = await Promise.all([
            API.getDashboard().catch(err => ({ total_municipios: 0, total_usuarios: 0, contratos_ativos: 0, receita_mensal: 0 })),
            API.getMunicipios().catch(err => ({ municipios: [] })),
            API.getReceita().catch(err => ({}))
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
        
        // Atualizar UI
        updateDashboardStats(dashboard);
        applyMunicipioFilters();
        updateRevenueChart(receita);
        
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
        // Total de Municípios
        const munCard = document.querySelector('.stat-card:nth-child(1) h3');
        if (munCard) munCard.textContent = data.total_municipios || 0;
        
        // Total de Usuários
        const userCard = document.querySelector('.stat-card:nth-child(2) h3');
        if (userCard) userCard.textContent = data.total_usuarios || 0;
        
        // Receita Mensal
        const receitaMensal = data.receita_mensal || 0;
        const revCard = document.querySelector('.stat-card:nth-child(3) h3');
        if (revCard) revCard.textContent = formatCurrency(receitaMensal);
        
        // Contratos Ativos
        const contrCard = document.querySelector('.stat-card:nth-child(4) h3');
        if (contrCard) contrCard.textContent = data.contratos_ativos || 0;
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

/**
 * Atualiza o gráfico de receita
 */
function updateRevenueChart(receita) {
    // Implementar quando adicionar Chart.js
    console.log('Receita:', receita);
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
        status: 'ativo',
        usuarios_atuais: 0
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
    if (!confirm('Tem certeza que deseja deletar este município? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        showLoading(true);
        await API.deleteMunicipio(id);
        showLoading(false);
        showSuccess('Município deletado com sucesso!');
        await loadDashboardData(); // Recarregar dados
    } catch (error) {
        showLoading(false);
        showError(`Erro ao deletar município: ${error.message}`);
    }
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
        status
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
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => {
                i.classList.remove('bg-primary/10', 'text-primary');
                i.classList.add('text-text-secondary', 'dark:text-gray-400');
            });
            this.classList.add('bg-primary/10', 'text-primary');
            this.classList.remove('text-text-secondary', 'dark:text-gray-400');
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

    syncMunicipioFilterControls();
    
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
