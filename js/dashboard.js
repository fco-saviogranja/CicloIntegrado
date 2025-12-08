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
        municipiosData = municipios.municipios || municipios || [];
        
        // Atualizar UI
        updateDashboardStats(dashboard);
        updateMunicipiosTable(Array.isArray(municipiosData) ? municipiosData : []);
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

/**
 * Atualiza a tabela de municípios
 */
function updateMunicipiosTable(municipios) {
    const tbody = document.getElementById('municipios-table');
    if (!tbody) return;
    
    if (!Array.isArray(municipios) || municipios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-text-secondary dark:text-gray-400">
                    <div class="flex flex-col items-center gap-4">
                        <span class="material-symbols-outlined text-5xl opacity-50">location_city</span>
                        <p>Nenhum município cadastrado ainda.</p>
                        <button onclick="openCreateModal()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                            Cadastrar Primeiro Município
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = municipios.map(mun => {
        const diasRestantes = getDaysUntil(mun.data_vencimento_licenca);
        const statusColor = diasRestantes > 30 ? 'green' : diasRestantes > 0 ? 'amber' : 'red';
        const usagePercent = mun.max_usuarios > 0 ? Math.round(((mun.usuarios_atuais || 0) / mun.max_usuarios) * 100) : 0;
        const planoLabel = mun.plano ? mun.plano.charAt(0).toUpperCase() + mun.plano.slice(1) : 'Standard';
        
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">location_city</span>
                        </div>
                        <div>
                            <p class="font-medium">${mun.nome || 'Sem nome'}</p>
                            <p class="text-sm text-text-secondary dark:text-gray-400">${mun.cidade || ''} ${mun.estado ? '- ' + mun.estado : ''}</p>
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
                        <span class="text-sm font-medium">${mun.usuarios_atuais || 0}/${mun.max_usuarios || 0}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <p class="text-sm">${formatDate(mun.data_vencimento_licenca)}</p>
                    <p class="text-xs text-${statusColor}-600 dark:text-${statusColor}-400">${diasRestantes !== null ? diasRestantes + ' dias' : '-'}</p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium bg-${statusColor}-100 dark:bg-${statusColor}-900/30 text-${statusColor}-600 dark:text-${statusColor}-400 rounded-full flex items-center gap-1 w-fit">
                        <span class="w-1.5 h-1.5 bg-${statusColor}-500 rounded-full"></span>
                        ${(mun.status === 'ativo' || !mun.status) ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                        <button onclick="editMunicipio('${mun.municipio_id}')" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Editar">
                            <span class="material-symbols-outlined text-lg text-text-secondary dark:text-gray-400">edit</span>
                        </button>
                        <button onclick="viewMunicipio('${mun.municipio_id}')" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Ver detalhes">
                            <span class="material-symbols-outlined text-lg text-text-secondary dark:text-gray-400">visibility</span>
                        </button>
                        <button onclick="deleteMunicipio('${mun.municipio_id}')" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir">
                            <span class="material-symbols-outlined text-lg text-red-600 dark:text-red-400">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Atualizar contagem
    const countEl = document.querySelector('.p-4.border-t p.text-sm');
    if (countEl) {
        countEl.textContent = `Mostrando ${municipios.length} de ${municipios.length} municípios`;
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
    }
}

/**
 * Editar município
 */
async function editMunicipio(id) {
    alert(`Editar município ${id} - Em desenvolvimento`)
    // TODO: Implementar modal de edição
}

/**
 * Ver detalhes do município
 */
async function viewMunicipio(id) {
    alert(`Ver detalhes de ${id} - Em desenvolvimento`);
    // TODO: Implementar modal de visualização
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

// ============================================
// MODAL
// ============================================

function openCreateModal() {
    document.getElementById('createModal').classList.remove('hidden');
}

function closeCreateModal() {
    document.getElementById('createModal').classList.add('hidden');
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
