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
let notificationsState = {
    items: [],
    isOpen: false
};

// Funções auxiliares para persistência de notificações
function loadNotificationsFromStorage() {
    try {
        const stored = localStorage.getItem('notifications');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.error('Erro ao carregar notificações:', e);
        return null;
    }
}

function saveNotificationsToStorage(items) {
    try {
        localStorage.setItem('notifications', JSON.stringify(items));
    } catch (e) {
        console.error('Erro ao salvar notificações:', e);
    }
}

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
let couponsData = [];
let couponsLoadError = null;
let billingMunicipioSelected = '';
let billingFormIsLoading = false;
let billingMunicipioData = null;
let municipioPendingDelete = null;
let usuarioBeingEdited = null;
let usuarioPendingDelete = null;
let auditLogs = [];
let auditFilters = {
    entity: 'all',
    action: 'all',
    performedBy: ''
};
let auditNextCursor = null;
let auditIsLoading = false;
let auditHasMore = false;
let auditInitialized = false;
const auditSensitiveKeys = ['password', 'senha', 'token', 'access_token', 'refresh_token', 'secret'];

let reportsInitialized = false;
const reportsState = {
    expiring: {
        data: [],
        isLoading: false,
        rangeDays: 30
    },
    capacity: {
        data: [],
        isLoading: false
    },
    needsRefresh: true,
    lastLoadedAt: null
};

const reportsFilters = {
    plan: 'all',
    status: 'all',
    estado: 'all',
    onlyCritical: false
};

let currentUser = API.getCurrentUser();
const profileState = {
    data: null,
    photoPreview: '',
    photoToUpload: null,
    isUploading: false,
    removePhoto: false
};

const editUserPhotoState = {
    usuarioId: null,
    originalUrl: '',
    preview: '',
    photoToUpload: null,
    removePhoto: false
};

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
        subtitle: 'Acompanhe receitas, planos e projeções financeiras'
    },
    relatorios: {
        title: 'Relatórios',
        subtitle: 'Módulo em desenvolvimento'
    },
    configuracoes: {
        title: 'Configurações',
        subtitle: 'Resumo de infraestrutura e auditoria'
    },
    'configuracoes-perfil': {
        title: 'Configurações',
        subtitle: 'Personalize o seu perfil de administrador'
    }
};

function switchSection(section) {
    const targetSection = sectionMetadata[section] ? section : 'dashboard';
    const navActiveSection = targetSection.startsWith('configuracoes') ? 'configuracoes' : targetSection;

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
        if (navTarget === navActiveSection) {
            item.classList.add('bg-primary/10', 'text-primary');
            item.classList.remove('text-text-secondary', 'dark:text-gray-400');
        } else {
            item.classList.remove('bg-primary/10', 'text-primary');
            item.classList.add('text-text-secondary', 'dark:text-gray-400');
        }
    });

    if (targetSection === 'configuracoes' && !auditInitialized) {
        auditInitialized = true;
        loadAuditLogs(true).catch(error => console.error('Erro ao carregar auditoria:', error));
    }

    if (targetSection === 'relatorios') {
        setupReportsControls();
        if (reportsState.needsRefresh || !reportsInitialized) {
            loadReportsData({ force: true }).catch(error => console.error('Erro ao carregar relatórios:', error));
        } else {
            updateReportsOverview();
            renderExpiringLicenses();
            renderCapacityTable();
        }
    }
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

        let couponsError = null;
        const [dashboard, municipios, receita, usuarios, cupons] = await Promise.all([
            API.getDashboard().catch(() => ({
                total_municipios: 0,
                municipios_ativos: 0,
                total_usuarios: 0,
                usuarios_ativos: 0,
                receita_mensal: 0,
                receita_anual: 0,
                contratos_totais: 0,
                contratos_ativos: 0,
                planos: {}
            })),
            API.getMunicipios().catch(() => ({
                municipalities: [],
                total: 0
            })),
            API.getReceita().catch(() => ({
                receita_mensal_total: 0,
                receita_anual_projetada: 0,
                ticket_medio_municipio: 0,
                municipios_ativos: 0,
                planos: {},
                historico: []
            })),
            API.getUsuarios().catch(() => ({ usuarios: [] })),
            API.getCupons().catch(error => {
                couponsError = error;
                return { coupons: [] };
            })
        ]);

        dashboardData = dashboard;

        const municipiosList = municipios?.municipalities
            || municipios?.municipios
            || municipios?.data
            || municipios;
        municipiosData = Array.isArray(municipiosList)
            ? municipiosList.map(normalizeMunicipioRecord).filter(Boolean)
            : [];
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

        filteredMunicipios = [...municipiosData];
        filteredUsuarios = [...usuariosData];

        const couponsRaw = Array.isArray(cupons?.coupons)
            ? cupons.coupons
            : Array.isArray(cupons?.data)
                ? cupons.data
                : Array.isArray(cupons)
                    ? cupons
                    : [];

        couponsData = couponsRaw
            .map(normalizeCoupon)
            .filter(Boolean)
            .sort((a, b) => {
                const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return timeB - timeA;
            });
        couponsLoadError = couponsError;
        if (couponsError) {
            console.error('Erro ao carregar cupons:', couponsError);
        }

        updateDashboardStats(dashboard);
        applyMunicipioFilters();
        populateUserMunicipioSelects();
        syncUsuarioFilterControls();
        applyUsuarioFilters();
        populateBillingMunicipioSelect();
        populateCouponMunicipioSelect();
        renderCouponsList();

        receitaData = receita;
        updateRevenueChart(receitaData);
        renderFaturamentoOverview(receitaData);
        updateConfigSummary();
        reportsState.needsRefresh = true;
        if (isReportsSectionVisible()) {
            loadReportsData({ force: true, silent: true }).catch(() => {});
        }
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

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return value.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatSignedCurrency(value) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return formatCurrency(0);
    }
    if (value === 0) {
        return formatCurrency(0);
    }
    return value > 0
        ? `+${formatCurrency(value)}`
        : formatCurrency(value);
}

function formatPercent(value, options = {}) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '0%';
    }

    const { fractionDigits = 1, sign = true } = options;
    const absolute = Math.abs(value);
    const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
    }).format(absolute);

    if (!sign) {
        return `${formatted}%`;
    }

    if (value > 0) {
        return `+${formatted}%`;
    }

    if (value < 0) {
        return `-${formatted}%`;
    }

    return `${formatted}%`;
}

function resolveHistoricoLabel(item, index) {
    if (!item || typeof item !== 'object') {
        return `Período ${index + 1}`;
    }

    const directLabel = item.mes
        || item.label
        || item.periodo
        || item.referencia
        || item.mes_referencia
        || item.period;
    if (directLabel) {
        return directLabel;
    }

    const monthIndexRaw = item.mes_numero ?? item.mes_indice ?? item.month_index;
    const yearRaw = item.ano ?? item.year;
    const monthIndex = monthIndexRaw !== undefined ? parseInt(monthIndexRaw, 10) : NaN;
    const year = yearRaw !== undefined ? parseInt(yearRaw, 10) : NaN;
    if (!Number.isNaN(monthIndex) && !Number.isNaN(year)) {
        const date = new Date(year, Math.max(0, monthIndex - 1), 1);
        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        }
    }

    const rawDate = item.data
        ?? item.data_referencia
        ?? (item.timestamp && typeof item.timestamp === 'object' && 'seconds' in item.timestamp ? new Date(item.timestamp.seconds * 1000) : item.timestamp)
        ?? item.reference_date;
    if (rawDate) {
        const date = rawDate instanceof Date
            ? rawDate
            : new Date(typeof rawDate === 'object' && 'seconds' in rawDate ? rawDate.seconds * 1000 : rawDate);
        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        }
    }

    return `Período ${index + 1}`;
}

function getMunicipioName(mun) {
    return mun.nome || mun.municipio_nome || mun.cidade || mun.municipio_id || '';
}

function getMunicipioPlanoValue(mun) {
    if (!mun || typeof mun !== 'object') {
        return 'pending';
    }

    const billing = mun.billing || {};
    const planRaw = billing.plan_type || mun.plano || mun.license_type || '';
    const normalizedPlan = normalizeValue(planRaw);

    if (normalizedPlan) {
        return normalizedPlan;
    }

    const billingStatus = normalizeValue(mun.billing_status || billing.status || '');
    if (billingStatus === 'active' && !normalizedPlan) {
        return 'custom';
    }
    if (billingStatus) {
        return billingStatus;
    }

    return 'pending';
}

function normalizeMunicipioRecord(rawMunicipio) {
    if (!rawMunicipio || typeof rawMunicipio !== 'object') {
        return null;
    }

    const normalized = { ...rawMunicipio };
    const billingRaw = normalized.billing && typeof normalized.billing === 'object'
        ? { ...normalized.billing }
        : {};

    const municipioId = normalized.municipio_id || normalized.id;
    if (municipioId && !normalized.municipio_id) {
        normalized.municipio_id = municipioId;
    }
    if (municipioId && !normalized.id) {
        normalized.id = municipioId;
    }

    const planCandidates = [
        billingRaw.plan_type,
        normalized.license_type,
        normalized.plano,
        normalized.licenseType
    ];
    const rawPlan = planCandidates.find(value => normalizeValue(value)) || '';
    const normalizedPlan = normalizeValue(rawPlan) || '';

    const billingStatusCandidate = normalized.billing_status
        || billingRaw.status
        || normalized.status;
    const normalizedBillingStatus = normalizeValue(billingStatusCandidate) || 'pending';

    const licenseCandidate = normalized.license_expires
        || normalized.data_vencimento_licenca
        || billingRaw.contract_end
        || billingRaw.license_expires;

    const maxUsersCandidate = normalized.max_usuarios
        ?? normalized.max_users
        ?? billingRaw.max_users;

    const monthlyValueCandidate = normalizeNullableNumber(billingRaw.monthly_value);
    const effectiveValueCandidate = normalizeNullableNumber(billingRaw.effective_monthly_value);

    if (normalizedPlan) {
        billingRaw.plan_type = normalizedPlan;
        normalized.license_type = normalizedPlan;
    } else if (!normalized.license_type) {
        normalized.license_type = 'pending';
    }

    if (!billingRaw.status || billingRaw.status !== normalizedBillingStatus) {
        billingRaw.status = normalizedBillingStatus;
    }
    normalized.billing_status = normalizedBillingStatus;

    if (!normalized.status) {
        if (normalizedBillingStatus === 'inactive') {
            normalized.status = 'inactive';
        } else if (normalizedBillingStatus === 'pending') {
            normalized.status = 'pending';
        } else {
            normalized.status = 'active';
        }
    }

    if (licenseCandidate) {
        billingRaw.contract_end = licenseCandidate;
        normalized.license_expires = licenseCandidate;
        normalized.data_vencimento_licenca = licenseCandidate;
    }

    if (Number.isFinite(Number(maxUsersCandidate)) && Number(maxUsersCandidate) > 0) {
        const maxUsersValue = Number(maxUsersCandidate);
        billingRaw.max_users = maxUsersValue;
        normalized.max_users = maxUsersValue;
        normalized.max_usuarios = maxUsersValue;
    }

    if (monthlyValueCandidate !== null) {
        billingRaw.monthly_value = monthlyValueCandidate;
    }

    if (effectiveValueCandidate !== null) {
        billingRaw.effective_monthly_value = effectiveValueCandidate;
    }

    if (!billingRaw.updated_at && normalized.updated_at) {
        billingRaw.updated_at = normalized.updated_at;
    }

    normalized.billing = billingRaw;

    return normalized;
}

function synchronizeMunicipioCache(updatedMunicipio) {
    if (!updatedMunicipio) {
        return;
    }

    const normalized = normalizeMunicipioRecord(updatedMunicipio) || updatedMunicipio;
    const municipioId = normalized.municipio_id || normalized.id;
    if (!municipioId) {
        return;
    }

    municipiosData = municipiosData.map(item => {
        const itemId = item?.municipio_id || item?.id;
        if (itemId !== municipioId) {
            return item;
        }
        return { ...item, ...normalized, billing: { ...(item.billing || {}), ...(normalized.billing || {}) } };
    });

    filteredMunicipios = filteredMunicipios.map(item => {
        const itemId = item?.municipio_id || item?.id;
        if (itemId !== municipioId) {
            return item;
        }
        return { ...item, ...normalized, billing: { ...(item.billing || {}), ...(normalized.billing || {}) } };
    });
}

function formatPlanoLabel(value) {
    const normalized = normalizeValue(value);
    if (!normalized) {
        return 'Pendente';
    }

    const labels = {
        pending: 'Pendente',
        pendente: 'Pendente',
        draft: 'Rascunho',
        suspended: 'Suspenso',
        paused: 'Pausado',
        inactive: 'Inativo',
        custom: 'Personalizado',
        active: 'Ativo',
        standard: 'Standard',
        professional: 'Profissional',
        profissional: 'Profissional',
        premium: 'Premium',
        basic: 'Básico',
        basico: 'Básico'
    };

    if (labels[normalized]) {
        return labels[normalized];
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeCouponDate(value) {
    if (!value && value !== 0) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }

    if (typeof value === 'object' && value && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000).toISOString();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeCouponNumber(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCouponInteger(value) {
    const parsed = normalizeCouponNumber(value);
    if (!Number.isFinite(parsed)) {
        return null;
    }
    const floored = Math.floor(parsed);
    return Number.isFinite(floored) ? floored : null;
}

function normalizeCoupon(coupon) {
    if (!coupon || typeof coupon !== 'object') {
        return null;
    }

    const normalized = { ...coupon };

    normalized.id = coupon.id || coupon.coupon_id || coupon.code || null;
    normalized.code = (coupon.code || '').toString().trim().toUpperCase();
    normalized.description = coupon.description || coupon.descricao || '';

    const typeRaw = (coupon.discount_type || coupon.discountType || '').toString().toLowerCase();
    normalized.discount_type = ['fixed', 'valor', 'value', 'amount'].includes(typeRaw) ? 'fixed' : 'percentage';

    const baseValue = normalizeCouponNumber(coupon.discount_value ?? coupon.value);
    const percentageValue = normalizeCouponNumber(coupon.percent_off);
    const amountValue = normalizeCouponNumber(coupon.amount_off);

    if (normalized.discount_type === 'fixed') {
        normalized.amount_off = amountValue ?? baseValue ?? 0;
        normalized.discount_value = normalized.amount_off;
        normalized.percent_off = null;
    } else {
        normalized.percent_off = percentageValue ?? baseValue ?? 0;
        normalized.discount_value = normalized.percent_off;
        normalized.amount_off = null;
    }

    normalized.municipio_id = coupon.municipio_id || coupon.municipioId || null;
    normalized.municipio_nome = coupon.municipio_nome || coupon.municipioNome || null;
    normalized.scope = coupon.scope || (normalized.municipio_id ? 'municipality' : 'global');

    normalized.valid_from = normalizeCouponDate(coupon.valid_from || coupon.validFrom);
    normalized.valid_until = normalizeCouponDate(coupon.valid_until || coupon.validUntil);
    normalized.created_at = normalizeCouponDate(coupon.created_at || coupon.createdAt);
    normalized.updated_at = normalizeCouponDate(coupon.updated_at || coupon.updatedAt);

    normalized.usage_count = normalizeCouponInteger(coupon.usage_count) || 0;
    const maxUses = normalizeCouponInteger(coupon.max_uses);
    normalized.max_uses = Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null;

    const baseStatus = (coupon.status || 'active').toString().toLowerCase();
    const explicitCurrent = (coupon.current_status || coupon.currentStatus || '').toString().toLowerCase();

    let currentStatus = explicitCurrent || baseStatus;
    if (!explicitCurrent || explicitCurrent === '') {
        if (baseStatus === 'inactive') {
            currentStatus = 'inactive';
        } else {
            const now = Date.now();
            const fromTime = normalized.valid_from ? new Date(normalized.valid_from).getTime() : null;
            const untilTime = normalized.valid_until ? new Date(normalized.valid_until).getTime() : null;
            if (fromTime && fromTime > now) {
                currentStatus = 'scheduled';
            } else if (untilTime && untilTime < now) {
                currentStatus = 'expired';
            } else {
                currentStatus = 'active';
            }
        }
    }

    normalized.status = baseStatus;
    normalized.current_status = currentStatus;

    return normalized;
}

function formatStatusLabel(value) {
    const normalized = normalizeValue(value);
    if (!normalized) {
        return '-';
    }

    const labels = {
        ativo: 'Ativo',
        active: 'Ativo',
        inativo: 'Inativo',
        inactive: 'Inativo',
        pendente: 'Pendente',
        pending: 'Pendente',
        paused: 'Pausado',
        suspenso: 'Suspenso',
        suspended: 'Suspenso',
        draft: 'Rascunho'
    };

    if (labels[normalized]) {
        return labels[normalized];
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatDaysLabel(days) {
    const value = Number(days);
    if (!Number.isFinite(value)) {
        return '-';
    }
    if (value === 0) {
        return 'Hoje';
    }
    if (value === 1) {
        return '1 dia';
    }
    if (value === -1) {
        return '1 dia atrás';
    }
    if (value < 0) {
        return `${Math.abs(value)} dias atrás`;
    }
    return `${value} dias`;
}

function normalizeExpiringLicense(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const municipioId = item.municipio_id || item.id || '';
    const municipioNome = item.municipio_nome
        || item.nome
        || item.cidade
        || municipioId;
    const licenseType = normalizeValue(item.license_type || item.plan_type || item.plano || '') || '';
    const expiresRaw = item.expires_at
        || item.license_expires
        || item.expiresAt
        || item.licenseExpires;
    const expiresAt = normalizeCouponDate(expiresRaw);
    const daysRaw = Number(item.days_until_expiry ?? item.daysUntilExpiry ?? item.days_remaining ?? null);
    const daysUntilExpiry = Number.isFinite(daysRaw) ? daysRaw : null;

    return {
        municipio_id: municipioId,
        municipio_nome: municipioNome,
        license_type: licenseType,
        expires_at: expiresAt,
        days_until_expiry: daysUntilExpiry,
        raw: { ...item }
    };
}

function normalizeMunicipalityReportStat(stat) {
    if (!stat || typeof stat !== 'object') {
        return null;
    }

    const municipioId = stat.municipio_id || stat.id || '';
    const municipioNome = stat.municipio_nome
        || stat.nome
        || stat.cidade
        || municipioId;
    const licenseType = normalizeValue(stat.license_type || stat.plan_type || stat.plano || '') || '';
    const status = normalizeValue(stat.status || stat.municipio_status || stat.billing_status || '') || '';

    const currentUsers = Number(stat.users?.current ?? stat.current_users ?? stat.usuarios ?? 0);
    const maxUsersRaw = stat.users?.max
        ?? stat.max_users
        ?? stat.max_usuarios
        ?? stat.capacidade_usuarios
        ?? null;
    const maxUsersNumber = Number(maxUsersRaw);
    const hasUsersLimit = Number.isFinite(maxUsersNumber) && maxUsersNumber > 0;
    const userUsageRaw = Number(stat.users?.usage_percent ?? stat.users?.ocupacao_percentual ?? null);
    const usagePercentUsers = Number.isFinite(userUsageRaw)
        ? Math.max(0, Math.min(100, userUsageRaw))
        : (hasUsersLimit ? Math.max(0, Math.min(100, Math.round((currentUsers / maxUsersNumber) * 100))) : null);

    const currentContracts = Number(stat.contracts?.current ?? stat.current_contracts ?? stat.contratos ?? 0);
    const maxContractsRaw = stat.contracts?.max
        ?? stat.max_contracts
        ?? stat.max_contratos
        ?? null;
    const maxContractsNumber = Number(maxContractsRaw);
    const hasContractsLimit = Number.isFinite(maxContractsNumber) && maxContractsNumber > 0;
    const contractsUsageRaw = Number(stat.contracts?.usage_percent ?? null);
    const usagePercentContracts = Number.isFinite(contractsUsageRaw)
        ? Math.max(0, Math.min(100, contractsUsageRaw))
        : (hasContractsLimit ? Math.max(0, Math.min(100, Math.round((currentContracts / maxContractsNumber) * 100))) : null);

    const licenseExpiresRaw = stat.license_expires
        || stat.data_vencimento_licenca
        || stat.contract_end
        || stat.expires_at
        || null;
    const licenseExpires = normalizeCouponDate(licenseExpiresRaw);

    return {
        municipio_id: municipioId,
        municipio_nome: municipioNome,
        license_type: licenseType,
        status,
        license_expires: licenseExpires,
        users: {
            current: Number.isFinite(currentUsers) && currentUsers >= 0 ? currentUsers : 0,
            max: hasUsersLimit ? maxUsersNumber : null,
            usage_percent: usagePercentUsers
        },
        contracts: {
            current: Number.isFinite(currentContracts) && currentContracts >= 0 ? currentContracts : 0,
            max: hasContractsLimit ? maxContractsNumber : null,
            usage_percent: usagePercentContracts
        },
        raw: { ...stat }
    };
}

function resolveCouponTargetName(coupon) {
    if (!coupon) {
        return 'Todos os municípios';
    }

    const municipioId = coupon.municipio_id || coupon.municipioId || null;
    if (!municipioId) {
        return 'Todos os municípios';
    }

    const municipio = municipiosData.find(item => (item.municipio_id || item.id) === municipioId);
    if (municipio) {
        return getMunicipioName(municipio);
    }

    return coupon.municipio_nome || municipioId;
}

function formatCouponDiscount(coupon) {
    if (!coupon) {
        return formatCurrency(0);
    }

    if ((coupon.discount_type || '').toLowerCase() === 'fixed') {
        const value = normalizeCouponNumber(coupon.amount_off ?? coupon.discount_value) || 0;
        return formatCurrency(value);
    }

    const value = normalizeCouponNumber(coupon.percent_off ?? coupon.discount_value) || 0;
    return `${new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value)}%`;
}

function resolveCouponValidity(coupon) {
    const start = normalizeCouponDate(coupon?.valid_from);
    const end = normalizeCouponDate(coupon?.valid_until);

    if (start && end) {
        return `De ${formatDate(start)} até ${formatDate(end)}`;
    }
    if (end) {
        return `Até ${formatDate(end)}`;
    }
    if (start) {
        return `A partir de ${formatDate(start)}`;
    }
    return 'Aplicação imediata';
}

function populateCouponMunicipioSelect() {
    const select = document.getElementById('coupon-municipio-id');
    if (!select) {
        return;
    }

    const currentValue = select.value;
    const options = ['<option value="">Todos os municípios</option>'];
    const sortedMunicipios = [...municipiosData].sort((a, b) => {
        const nameA = getMunicipioName(a).toLowerCase();
        const nameB = getMunicipioName(b).toLowerCase();
        return nameA.localeCompare(nameB);
    });

    sortedMunicipios.forEach(municipio => {
        const id = municipio.municipio_id || municipio.id;
        if (!id) {
            return;
        }
        const name = getMunicipioName(municipio) || id;
        options.push(`<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`);
    });

    select.innerHTML = options.join('');

    if (currentValue && Array.from(select.options).some(option => option.value === currentValue)) {
        select.value = currentValue;
    } else {
        select.value = '';
    }
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
        const planoValue = getMunicipioPlanoValue(mun);
        const planoLabel = formatPlanoLabel(planoValue);
        const planoBadgeStyles = {
            pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
            pendente: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
            suspended: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
            paused: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
            inactive: 'bg-gray-200 dark:bg-gray-800 text-text-secondary dark:text-gray-300',
            custom: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
            premium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
            profissional: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
            professional: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
            standard: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
            basico: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
            basic: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300'
        };
        const planoBadgeClass = planoBadgeStyles[planoValue] || 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
        const maxUsuarios = mun.max_usuarios ?? mun.max_users ?? 0;
        const usuariosAtuais = mun.usuarios_atuais ?? mun.current_users ?? 0;
        const usagePercent = maxUsuarios > 0 ? Math.round((usuariosAtuais / maxUsuarios) * 100) : 0;
        const licencaVencimento = mun.data_vencimento_licenca || mun.license_expires;
        const diasRestantes = getDaysUntil(licencaVencimento);
        const statusRaw = (mun.status || 'ativo').toString().toLowerCase();
        const statusColor = diasRestantes === null
            ? 'gray'
            : diasRestantes > 30
                ? 'green'
                : diasRestantes > 0
                    ? 'amber'
                    : 'red';
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
                    <span class="px-3 py-1 text-xs font-medium rounded-full ${planoBadgeClass}">${planoLabel}</span>
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
                    <p class="text-xs text-${statusColor}-600 dark:text-${statusColor}-400">${diasRestantes !== null ? diasRestantes + ' dias' : 'Não configurado'}</p>
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

function normalizeRoleKey(role) {
    const raw = normalizeValue(role).replace(/-/g, ' ');
    if (!raw) {
        return '';
    }

    const roleMap = {
        'admin master': 'admin_master',
        'admin_master': 'admin_master',
        'adminmunicipal': 'admin_municipio',
        'admin municipal': 'admin_municipio',
        'admin_municipal': 'admin_municipio',
        'administrador municipal': 'admin_municipio',
        'gestor de contrato': 'gestor_contrato',
        'gestor contrato': 'gestor_contrato',
        'gestor_contrato': 'gestor_contrato',
        'fiscal de contrato': 'fiscal_contrato',
        'fiscal contrato': 'fiscal_contrato',
        'fiscal_contrato': 'fiscal_contrato'
    };

    const compacted = raw.replace(/\s+/g, '');
    if (roleMap[raw]) {
        return roleMap[raw];
    }
    if (roleMap[compacted]) {
        return roleMap[compacted];
    }

    return raw.replace(/\s+/g, '_');
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

function formatDate(value) {
    if (!value) return '';
    const date = typeof value === 'object' && value.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR');
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
    updateUsuariosSummary(filteredUsuarios);
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
        const photoUrl = usuario.photo_url || '';
        const safePhotoUrl = photoUrl ? escapeHtml(photoUrl) : '';
        const safeName = escapeHtml(nome);
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
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary/10 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border border-primary/20 dark:border-blue-500/30">
                            ${photoUrl
                                ? `<img src="${safePhotoUrl}" alt="${safeName}" class="w-full h-full object-cover" />`
                                : '<span class="material-symbols-outlined text-2xl text-primary dark:text-blue-300">account_circle</span>'}
                        </div>
                        <div class="flex flex-col">
                            <span class="font-medium">${nome}</span>
                            <span class="text-sm text-text-secondary dark:text-gray-400">${email}</span>
                            ${auditText ? `<span class="text-xs text-text-secondary/80 dark:text-gray-500 mt-1">${auditText}</span>` : ''}
                        </div>
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

function updateUsuariosSummary(filteredList = null) {
    const totalEl = document.getElementById('user-summary-total');
    if (!totalEl) {
        return;
    }

    const users = Array.isArray(usuariosData) ? usuariosData : [];
    const totalFromDashboard = typeof dashboardData?.total_usuarios === 'number'
        ? dashboardData.total_usuarios
        : null;
    const total = totalFromDashboard ?? users.length;

    let active = 0;
    let inactive = 0;

    const roleCounts = {
        admin_master: 0,
        admin_municipio: 0,
        gestor_contrato: 0,
        fiscal_contrato: 0
    };

    const roleActiveCounts = {
        admin_master: 0,
        admin_municipio: 0,
        gestor_contrato: 0,
        fiscal_contrato: 0
    };

    const statusStats = dashboardData?.usuarios_por_status || {};
    const activeDashboard = statusStats.ativo ?? statusStats.active;
    const inactiveDashboard = statusStats.inativo ?? statusStats.inactive;

    if (typeof activeDashboard === 'number' || typeof inactiveDashboard === 'number') {
        active = typeof activeDashboard === 'number' ? activeDashboard : active;
        inactive = typeof inactiveDashboard === 'number' ? inactiveDashboard : inactive;
    }

    users.forEach(usuario => {
        const status = normalizeUserStatus(usuario.status);
        if (typeof activeDashboard !== 'number' && typeof inactiveDashboard !== 'number') {
            if (status === 'inactive') {
                inactive += 1;
            } else {
                active += 1;
            }
        }

        const roleKey = normalizeRoleKey(usuario.role);
        if (Object.prototype.hasOwnProperty.call(roleCounts, roleKey)) {
            roleCounts[roleKey] += 1;
            if (status !== 'inactive') {
                roleActiveCounts[roleKey] += 1;
            }
        }
    });

    totalEl.textContent = total;

    const statusEl = document.getElementById('user-summary-status');
    if (statusEl) {
        statusEl.textContent = `Ativos: ${active} • Inativos: ${inactive}`;
    }

    const filteredCount = Array.isArray(filteredList) ? filteredList.length : total;
    const filteredEl = document.getElementById('user-summary-filtered');
    if (filteredEl) {
        filteredEl.textContent = `Filtrados: ${filteredCount}`;
    }

    const progressEl = document.getElementById('user-summary-total-progress');
    if (progressEl) {
        const percent = total > 0 ? Math.round((active / total) * 100) : 0;
        progressEl.style.width = `${percent}%`;
    }

    const roleIdMap = {
        admin_master: 'admin-master',
        admin_municipio: 'admin-municipio',
        gestor_contrato: 'gestor-contrato',
        fiscal_contrato: 'fiscal-contrato'
    };

    const roleStats = dashboardData?.usuarios_por_perfil || {};
    Object.entries(roleStats).forEach(([role, count]) => {
        const roleKey = normalizeRoleKey(role);
        if (Object.prototype.hasOwnProperty.call(roleCounts, roleKey)) {
            roleCounts[roleKey] = count;
        }
    });

    Object.keys(roleIdMap).forEach(role => {
        const idSuffix = roleIdMap[role];
        const count = roleCounts[role] || 0;
        const activeCount = roleActiveCounts[role] || 0;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;

        const countEl = document.getElementById(`user-summary-role-${idSuffix}`);
        if (countEl) {
            countEl.textContent = count;
        }

        const shareEl = document.getElementById(`user-summary-role-${idSuffix}-share`);
        if (shareEl) {
            shareEl.textContent = `Ativos: ${activeCount} • ${percent}% do total`;
        }

        const roleProgress = document.getElementById(`user-summary-role-${idSuffix}-progress`);
        if (roleProgress) {
            roleProgress.style.width = `${percent}%`;
        }
    });
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
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" style="--progress-start: ${largura}%; --progress-end: 100%;">
                    <div class="chart-bar h-full rounded-full" style="width: ${largura}%; background: linear-gradient(90deg, #ff5a2e 0%, #fe8222 50%, #fd931d 100%);"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderFaturamentoOverview(receita) {
    const monthlyEl = document.getElementById('faturamento-mensal-total');
    const monthlyVariationEl = document.getElementById('faturamento-mensal-variacao');
    const annualEl = document.getElementById('faturamento-anual-projetada');
    const ticketEl = document.getElementById('faturamento-ticket-medio');
    const municipiosEl = document.getElementById('faturamento-municipios-ativos');
    const historyEl = document.getElementById('faturamento-historico-list');
    const planosEl = document.getElementById('faturamento-planos-list');
    const projectionsEl = document.getElementById('faturamento-projecoes');
    const alertsEl = document.getElementById('faturamento-alertas');

    if (!monthlyEl && !annualEl && !ticketEl && !municipiosEl && !historyEl && !planosEl && !projectionsEl && !alertsEl) {
        return;
    }

    if (!receita) {
        if (monthlyEl) monthlyEl.textContent = formatCurrency(0);
        if (monthlyVariationEl) {
            monthlyVariationEl.textContent = 'Dados financeiros indisponíveis';
            monthlyVariationEl.classList.remove('text-green-600', 'dark:text-green-400', 'text-amber-600', 'dark:text-amber-400');
            monthlyVariationEl.classList.add('text-text-secondary', 'dark:text-gray-400');
        }
        if (annualEl) annualEl.textContent = formatCurrency(0);
        if (ticketEl) ticketEl.textContent = formatCurrency(0);
        if (municipiosEl) municipiosEl.textContent = '0 municípios ativos';
        if (historyEl) historyEl.innerHTML = '<p class="text-sm text-text-secondary dark:text-gray-400">Nenhum dado financeiro disponível.</p>';
        if (planosEl) planosEl.innerHTML = '<p class="text-sm text-text-secondary dark:text-gray-400">Nenhuma informação de planos registrada.</p>';
        if (projectionsEl) projectionsEl.innerHTML = '<p class="text-sm text-text-secondary dark:text-gray-400">Projeções disponíveis após registrar pelo menos dois meses de receita.</p>';
        if (alertsEl) alertsEl.innerHTML = '<div class="rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-4 text-sm text-text-secondary dark:text-gray-400">Os alertas financeiros serão exibidos assim que houver dados suficientes.</div>';
        return;
    }

    const historicoRaw = Array.isArray(receita.historico) ? receita.historico.filter(item => item && typeof item === 'object') : [];
    const historico = historicoRaw.map(item => ({ ...item }));
    const lastEntry = historico.length > 0 ? historico[historico.length - 1] : null;
    const previousEntry = historico.length > 1 ? historico[historico.length - 2] : null;

    const receitaAtual = lastEntry?.receita_mensal
        ?? receita?.receita_mensal_total
        ?? receita?.receita_mensal
        ?? 0;
    const receitaAnterior = previousEntry?.receita_mensal ?? null;

    const ticketAtual = lastEntry?.ticket_medio
        ?? lastEntry?.ticket_medio_municipio
        ?? receita?.ticket_medio_municipio
        ?? receita?.ticket_medio
        ?? 0;
    const ticketAnterior = previousEntry?.ticket_medio
        ?? previousEntry?.ticket_medio_municipio
        ?? null;

    const municipiosAtivos = receita?.municipios_ativos
        ?? lastEntry?.municipios_ativos
        ?? lastEntry?.ativos
        ?? 0;

    if (monthlyEl) monthlyEl.textContent = formatCurrency(receitaAtual);
    if (annualEl) {
        const anual = receita?.receita_anual_projetada ?? receitaAtual * 12;
        annualEl.textContent = formatCurrency(anual);
    }
    if (ticketEl) ticketEl.textContent = formatCurrency(ticketAtual);
    if (municipiosEl) {
        const label = municipiosAtivos === 1 ? 'município ativo' : 'municípios ativos';
        municipiosEl.textContent = `${municipiosAtivos || 0} ${label}`;
    }

    if (monthlyVariationEl) {
        monthlyVariationEl.classList.remove('text-green-600', 'dark:text-green-400', 'text-amber-600', 'dark:text-amber-400');
        monthlyVariationEl.classList.add('text-text-secondary', 'dark:text-gray-400');

        if (receitaAnterior === null || receitaAnterior === undefined) {
            monthlyVariationEl.textContent = 'Sem histórico anterior';
        } else if (receitaAnterior === 0 && receitaAtual === 0) {
            monthlyVariationEl.textContent = 'Sem variação em relação ao mês anterior';
        } else if (receitaAnterior === 0) {
            monthlyVariationEl.textContent = 'Primeiro mês registrado';
        } else {
            const diferenca = receitaAtual - receitaAnterior;
            const variacaoPercent = (diferenca / receitaAnterior) * 100;
            monthlyVariationEl.textContent = `${formatSignedCurrency(diferenca)} (${formatPercent(variacaoPercent)}) vs mês anterior`;
            monthlyVariationEl.classList.remove('text-text-secondary', 'dark:text-gray-400');
            if (diferenca > 0) {
                monthlyVariationEl.classList.add('text-green-600', 'dark:text-green-400');
            } else if (diferenca < 0) {
                monthlyVariationEl.classList.add('text-amber-600', 'dark:text-amber-400');
            } else {
                monthlyVariationEl.classList.add('text-text-secondary', 'dark:text-gray-400');
            }
        }
    }

    if (historyEl) {
        if (!historico.length) {
            historyEl.innerHTML = '<p class="text-sm text-text-secondary dark:text-gray-400">Nenhum histórico de faturamento foi registrado ainda.</p>';
        } else {
            const historyItems = historico.map((item, index) => {
                const label = escapeHtml(resolveHistoricoLabel(item, index));
                const receitaMensal = item.receita_mensal ?? 0;
                const anterior = index > 0 ? (historico[index - 1].receita_mensal ?? 0) : null;
                const diferenca = anterior !== null ? receitaMensal - anterior : null;
                const percentual = anterior && anterior !== 0 ? (diferenca / anterior) * 100 : null;
                const novos = item.novos_municipios
                    ?? item.novos
                    ?? item.new_municipalities
                    ?? item.municipios_novos
                    ?? 0;
                const cancelamentos = item.cancelamentos
                    ?? item.churn
                    ?? item.municipios_cancelados
                    ?? item.cancelled_municipalities
                    ?? 0;

                const badges = [];
                if (diferenca !== null) {
                    if (anterior === 0 && receitaMensal > 0) {
                        badges.push('<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Nova receita</span>');
                    } else if (anterior === 0 && receitaMensal === 0) {
                        badges.push('<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-text-secondary dark:bg-gray-800 dark:text-gray-300">Sem variação</span>');
                    } else if (anterior) {
                        const trendClass = diferenca > 0
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : diferenca < 0
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-gray-100 text-text-secondary dark:bg-gray-800 dark:text-gray-300';
                        const trendIcon = diferenca > 0 ? '▲' : diferenca < 0 ? '▼' : '▬';
                        const labelText = percentual !== null ? formatPercent(percentual) : 'Sem variação';
                        badges.push(`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${trendClass}">${trendIcon} ${labelText}</span>`);
                    }
                }

                if (novos > 0) {
                    badges.push(`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">+${novos} novos</span>`);
                }

                if (cancelamentos > 0) {
                    badges.push(`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">-${cancelamentos} cancel.</span>`);
                }

                return `
                    <div class="flex flex-col gap-3 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900/40 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p class="text-sm text-text-secondary dark:text-gray-400">${label}</p>
                            <p class="text-lg font-semibold text-text-primary dark:text-gray-100">${formatCurrency(receitaMensal)}</p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            ${badges.join('') || ''}
                        </div>
                    </div>
                `;
            }).join('');

            historyEl.innerHTML = historyItems;
        }
    }

    const planos = receita?.planos && typeof receita.planos === 'object' ? receita.planos : {};
    const planoEntries = Object.entries(planos).filter(([, value]) => value && typeof value === 'object');
    const totalReceitaPlanos = planoEntries.reduce((sum, [, plan]) => sum + (plan.receita_mensal || 0), 0);
    const totalMunicipiosPlanos = planoEntries.reduce((sum, [, plan]) => sum + (plan.ativos ?? plan.quantidade ?? 0), 0);

    if (planosEl) {
        if (!planoEntries.length) {
            planosEl.innerHTML = '<p class="text-sm text-text-secondary dark:text-gray-400">Nenhuma informação de planos registrada.</p>';
        } else {
            const visualConfig = {
                premium: { bullet: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-300' },
                profissional: { bullet: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-300' },
                professional: { bullet: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-300' },
                standard: { bullet: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
                basico: { bullet: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' }
            };

            const planoHtml = planoEntries.map(([key, plan]) => {
                const label = formatPlanoLabel(key);
                const receitaPlano = plan.receita_mensal ?? 0;
                const ativosPlano = plan.ativos ?? plan.quantidade ?? 0;
                const shareBase = totalReceitaPlanos > 0
                    ? receitaPlano / totalReceitaPlanos
                    : totalMunicipiosPlanos > 0
                        ? ativosPlano / totalMunicipiosPlanos
                        : 0;
                const sharePercent = shareBase * 100;
                const visuals = visualConfig[key] || { bullet: 'bg-slate-400', text: 'text-text-secondary dark:text-gray-300' };
                const ativosLabel = ativosPlano === 1 ? 'município ativo' : 'municípios ativos';

                return `
                    <div class="flex items-start justify-between gap-4 rounded-xl border border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/40 p-4">
                        <div class="flex items-start gap-3">
                            <span class="mt-1 inline-flex h-3 w-3 rounded-full ${visuals.bullet}"></span>
                            <div>
                                <p class="font-medium text-text-primary dark:text-gray-100">${escapeHtml(label)}</p>
                                <p class="text-sm text-text-secondary dark:text-gray-400">Receita: ${formatCurrency(receitaPlano)}</p>
                                <p class="text-xs text-text-secondary dark:text-gray-500 mt-1">${ativosPlano || 0} ${ativosLabel}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-lg font-semibold ${visuals.text}">${formatPercent(sharePercent, { fractionDigits: 1, sign: false })}</p>
                            <p class="text-xs text-text-secondary dark:text-gray-400">da base atual</p>
                        </div>
                    </div>
                `;
            }).join('');

            planosEl.innerHTML = planoHtml;
        }
    }

    if (projectionsEl) {
        const growthRates = [];
        historico.forEach((item, index) => {
            if (index === 0) return;
            const atual = item.receita_mensal ?? 0;
            const anterior = historico[index - 1].receita_mensal ?? 0;
            if (anterior > 0) {
                growthRates.push((atual - anterior) / anterior);
            }
        });

        const recentes = growthRates.slice(-3);
        const averageGrowth = recentes.length > 0
            ? recentes.reduce((sum, value) => sum + value, 0) / recentes.length
            : null;

        if (averageGrowth === null || !Number.isFinite(averageGrowth) || historico.length < 2 || receitaAtual <= 0) {
            projectionsEl.innerHTML = '<p class="text-sm text-text-secondary dark:text-gray-400">Projeções disponíveis após registrar pelo menos dois meses de receita.</p>';
        } else {
            const labels = ['Próximo mês', 'Em 2 meses', 'Em 3 meses'];
            const projectionCards = labels.map((label, index) => {
                const fator = Math.pow(1 + averageGrowth, index + 1);
                const valorProjetado = Math.max(0, receitaAtual * fator);
                const diferenca = valorProjetado - receitaAtual;
                const trendClass = diferenca > 0
                    ? 'text-green-600 dark:text-green-400'
                    : diferenca < 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-text-secondary dark:text-gray-400';

                return `
                    <div class="flex items-center justify-between rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-900/40 px-4 py-3">
                        <div>
                            <p class="text-sm text-text-secondary dark:text-gray-400">${label}</p>
                            <p class="text-base font-semibold text-text-primary dark:text-gray-100">${formatCurrency(valorProjetado)}</p>
                        </div>
                        <span class="text-sm font-medium ${trendClass}">${formatSignedCurrency(diferenca)}</span>
                    </div>
                `;
            }).join('');

            const mediaClass = averageGrowth >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400';

            projectionsEl.innerHTML = `
                <p class="text-xs text-text-secondary dark:text-gray-400">Variação média recente: <span class="font-semibold ${mediaClass}">${formatPercent(averageGrowth * 100)}</span></p>
                <div class="mt-3 space-y-3">${projectionCards}</div>
            `;
        }
    }

    if (alertsEl) {
        const alerts = [];

        if (receitaAnterior !== null && receitaAnterior !== undefined && receitaAnterior !== 0) {
            const diferenca = receitaAtual - receitaAnterior;
            const variacaoPercentual = (diferenca / receitaAnterior) * 100;
            if (diferenca > 0) {
                alerts.push({
                    type: 'positive',
                    text: `Receita cresceu ${formatPercent(variacaoPercentual)} em relação ao mês anterior.`
                });
            } else if (diferenca < 0) {
                alerts.push({
                    type: 'warning',
                    text: `Receita caiu ${formatPercent(variacaoPercentual)} em relação ao mês anterior. Analise municípios com risco de churn.`
                });
            } else {
                alerts.push({
                    type: 'neutral',
                    text: 'Receita estável em relação ao mês anterior.'
                });
            }
        }

        if (ticketAnterior !== null && ticketAnterior !== undefined && ticketAnterior !== 0) {
            const variacaoTicket = ticketAtual - ticketAnterior;
            if (variacaoTicket !== 0) {
                alerts.push({
                    type: variacaoTicket > 0 ? 'positive' : 'warning',
                    text: `Ticket médio ${variacaoTicket > 0 ? 'subiu' : 'caiu'} ${formatSignedCurrency(variacaoTicket)} frente ao mês anterior.`
                });
            }
        }

        if (planoEntries.length) {
            const planShares = planoEntries.map(([key, plan]) => {
                const receitaPlano = plan.receita_mensal ?? 0;
                const ativosPlano = plan.ativos ?? plan.quantidade ?? 0;
                const shareBase = totalReceitaPlanos > 0
                    ? receitaPlano / totalReceitaPlanos
                    : totalMunicipiosPlanos > 0
                        ? ativosPlano / totalMunicipiosPlanos
                        : 0;
                return {
                    key,
                    label: formatPlanoLabel(key),
                    share: shareBase
                };
            }).sort((a, b) => b.share - a.share);

            if (planShares.length) {
                const lider = planShares[0];
                if (lider.share >= 0.6) {
                    alerts.push({
                        type: 'warning',
                        text: `${lider.label} representa ${formatPercent(lider.share * 100, { sign: false })} da receita recorrente. Avalie estratégias de diversificação.`
                    });
                } else if (lider.share >= 0.4) {
                    alerts.push({
                        type: 'positive',
                        text: `${lider.label} segue como principal fonte de receita (${formatPercent(lider.share * 100, { sign: false })}).`
                    });
                }
            }
        }

        if (!alerts.length) {
            alertsEl.innerHTML = '<div class="rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-900/40 p-4 text-sm text-text-secondary dark:text-gray-400">Nenhum alerta financeiro no momento.</div>';
        } else {
            const classMap = {
                positive: 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700/40 dark:text-green-300',
                warning: 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-300',
                neutral: 'bg-gray-50 border border-border-light text-text-secondary dark:bg-gray-800/40 dark:border-border-dark dark:text-gray-300'
            };

            alertsEl.innerHTML = alerts.map(alert => {
                const classes = classMap[alert.type] || classMap.neutral;
                return `<div class="rounded-lg p-4 text-sm font-medium ${classes}">${escapeHtml(alert.text)}</div>`;
            }).join('');
        }
    }
}

// ============================================
// GESTÃO DE FATURAMENTO
// ============================================

function setBillingFormDisabled(disabled) {
    const form = document.getElementById('billing-config-form');
    if (!form) return;
    const elements = form.querySelectorAll('input, select, textarea, button[type="submit"]');
    elements.forEach(element => {
        if (element.id === 'billing-municipio-select' || element.id === 'billing-refresh') {
            return;
        }
        element.disabled = disabled;
    });
}

function resetBillingSummary() {
    const summaryPlan = document.getElementById('billing-summary-plan');
    const summaryStatus = document.getElementById('billing-summary-status');
    const summaryLicense = document.getElementById('billing-summary-license');
    const summaryEffective = document.getElementById('billing-summary-effective');
    const summaryCoupon = document.getElementById('billing-summary-coupon');
    const summaryUpdated = document.getElementById('billing-summary-updated');

    if (summaryPlan) summaryPlan.textContent = 'Plano: não definido';
    if (summaryStatus) summaryStatus.textContent = 'Status do faturamento: pendente';
    if (summaryLicense) summaryLicense.textContent = 'Licença válida até: não configurada';
    if (summaryEffective) summaryEffective.textContent = 'Valor efetivo registrado: R$ 0,00';
    if (summaryCoupon) summaryCoupon.textContent = 'Cupom aplicado: nenhum';
    if (summaryUpdated) summaryUpdated.textContent = 'Última atualização: -';
}

function populateBillingMunicipioSelect() {
    const select = document.getElementById('billing-municipio-select');
    if (!select) return;

    const previousValue = billingMunicipioSelected || select.value;
    const options = ['<option value="">Selecione o município</option>'];

    const sortedMunicipios = [...municipiosData].sort((a, b) => {
        const nameA = getMunicipioName(a).toLowerCase();
        const nameB = getMunicipioName(b).toLowerCase();
        return nameA.localeCompare(nameB);
    });

    sortedMunicipios.forEach(municipio => {
        const id = municipio.municipio_id || municipio.id;
        if (!id) return;
        const label = getMunicipioName(municipio) || id;
        options.push(`<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`);
    });

    select.innerHTML = options.join('');
    select.disabled = sortedMunicipios.length === 0;

    const hasPrevious = previousValue && options.some(option => option.includes(`value="${previousValue}"`));

    if (hasPrevious) {
        select.value = previousValue;
        billingMunicipioSelected = previousValue;
        if (billingMunicipioData && (billingMunicipioData.municipio_id || billingMunicipioData.id) === previousValue) {
            fillBillingForm(billingMunicipioData);
        } else {
            loadBillingForMunicipio(previousValue, { skipLoader: true });
        }
    } else {
        select.value = '';
        billingMunicipioSelected = '';
        billingMunicipioData = null;
        resetBillingSummary();
        setBillingFormDisabled(true);
    }

}

function fillBillingForm(municipio) {
    const planSelect = document.getElementById('billing-plan-type');
    const statusSelect = document.getElementById('billing-status');
    const maxUsersInput = document.getElementById('billing-max-users');
    const licenseInput = document.getElementById('billing-license-expires');
    const monthlyInput = document.getElementById('billing-monthly-value');
    const paymentDayInput = document.getElementById('billing-payment-day');
    const installmentsInput = document.getElementById('billing-installments');
    const notesInput = document.getElementById('billing-notes');

    if (!municipio || !planSelect || !statusSelect) {
        resetBillingSummary();
        return;
    }

    const billing = municipio.billing || {};
    let planValue = normalizeValue(billing.plan_type || municipio.license_type || '');
    const planMap = {
        professional: 'profissional'
    };
    if (planMap[planValue]) {
        planValue = planMap[planValue];
    }
    planSelect.value = planValue || '';

    const billingStatus = normalizeValue(billing.status || municipio.billing_status || municipio.status || 'pending');
    if (statusSelect.querySelector(`option[value="${billingStatus}"]`)) {
        statusSelect.value = billingStatus;
    } else {
        statusSelect.value = 'pending';
    }

    if (maxUsersInput) {
        const maxUsers = municipio.max_usuarios ?? municipio.max_users ?? billing.max_users ?? '';
        maxUsersInput.value = Number.isFinite(Number(maxUsers)) && Number(maxUsers) > 0 ? Number(maxUsers) : '';
    }

    if (licenseInput) {
        const licenseValue = billing.contract_end || municipio.license_expires || municipio.data_vencimento_licenca || '';
        licenseInput.value = formatInputDate(licenseValue);
    }

    if (monthlyInput) {
        const monthlyValue = Number(billing.monthly_value ?? municipio.custom_monthly_value ?? '');
        monthlyInput.value = Number.isFinite(monthlyValue) && monthlyValue > 0 ? monthlyValue : '';
    }

    if (paymentDayInput) {
        const paymentDay = billing.payment_day ?? '';
        paymentDayInput.value = Number.isFinite(Number(paymentDay)) && Number(paymentDay) > 0 ? Number(paymentDay) : '';
    }

    if (installmentsInput) {
        const installments = billing.installments ?? '';
        installmentsInput.value = Number.isFinite(Number(installments)) && Number(installments) > 0 ? Number(installments) : '';
    }

    if (notesInput) {
        notesInput.value = billing.notes || '';
    }

    const summaryPlan = document.getElementById('billing-summary-plan');
    if (summaryPlan) {
        summaryPlan.textContent = `Plano: ${formatPlanoLabel(planValue)}`;
    }

    const summaryStatus = document.getElementById('billing-summary-status');
    if (summaryStatus) {
        summaryStatus.textContent = `Status do faturamento: ${formatPlanoLabel(billingStatus)}`;
    }

    const licenseDate = billing.contract_end || municipio.license_expires || municipio.data_vencimento_licenca;
    const summaryLicense = document.getElementById('billing-summary-license');
    if (summaryLicense) {
        const licenseLabel = licenseDate ? formatDate(licenseDate) : 'não configurada';
        summaryLicense.textContent = `Licença válida até: ${licenseLabel}`;
    }

    const effectiveValue = billing.effective_monthly_value ?? billing.monthly_value ?? municipio.custom_monthly_value ?? 0;
    const summaryEffective = document.getElementById('billing-summary-effective');
    if (summaryEffective) {
        summaryEffective.textContent = `Valor efetivo registrado: ${formatCurrency(effectiveValue || 0)}`;
    }

    const summaryCoupon = document.getElementById('billing-summary-coupon');
    if (summaryCoupon) {
        const couponCode = billing.coupon_code || billing.couponCode || '';
        if (couponCode) {
            const discountTypeRaw = normalizeValue(
                billing.coupon_discount_type
                || billing.couponDiscountType
                || billing.coupon?.discount_type
            );
            const discountValueRaw = billing.coupon_discount_value
                ?? billing.couponDiscountValue
                ?? billing.coupon?.discount_value
                ?? billing.coupon_percent
                ?? billing.couponPercent
                ?? billing.coupon?.percent_off
                ?? billing.coupon_amount
                ?? billing.coupon?.amount_off;

            let discountLabel = '';
            if (discountTypeRaw === 'percentage' || discountTypeRaw === 'percentual' || discountTypeRaw === 'percent') {
                const percentValue = normalizeNullableNumber(discountValueRaw);
                if (percentValue !== null) {
                    discountLabel = `${percentValue}%`;
                }
            } else if (discountTypeRaw === 'fixed' || discountTypeRaw === 'valor' || discountTypeRaw === 'amount' || discountTypeRaw === 'value') {
                const amountValue = normalizeNullableNumber(discountValueRaw);
                if (amountValue !== null) {
                    discountLabel = formatCurrency(amountValue);
                }
            }

            const couponValidUntil = billing.coupon_valid_until
                || billing.couponValidUntil
                || billing.coupon?.valid_until
                || billing.coupon?.validUntil;
            const details = [];
            if (discountLabel) {
                details.push(discountLabel);
            }
            if (couponValidUntil) {
                details.push(`até ${formatDate(couponValidUntil)}`);
            }
            const detailsLabel = details.length ? ` (${details.join(' • ')})` : '';
            summaryCoupon.textContent = `Cupom aplicado: ${couponCode}${detailsLabel}`;
        } else {
            summaryCoupon.textContent = 'Cupom aplicado: nenhum';
        }
    }

    const summaryUpdated = document.getElementById('billing-summary-updated');
    if (summaryUpdated) {
        summaryUpdated.textContent = `Última atualização: ${formatDate(billing.updated_at || municipio.updated_at)}`;
    }

    setBillingFormDisabled(false);
}

async function loadBillingForMunicipio(municipioId, options = {}) {
    if (!municipioId) {
        resetBillingSummary();
        setBillingFormDisabled(true);
        billingMunicipioData = null;
        return;
    }

    try {
        billingFormIsLoading = true;
        setBillingFormDisabled(true);
        if (!options.skipLoader) {
            showLoading(true);
        }
        const details = await loadMunicipioDetails(municipioId);
        billingMunicipioData = details;
        fillBillingForm(details);
    } catch (error) {
        console.error('Erro ao carregar dados de faturamento do município:', error);
        showError('Não foi possível carregar o faturamento deste município.');
        billingMunicipioData = null;
        resetBillingSummary();
    } finally {
        billingFormIsLoading = false;
        setBillingFormDisabled(!billingMunicipioData);
        showLoading(false);
    }
}

function normalizeNullableNumber(value, { integer = false } = {}) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return null;
    }
    return integer ? Math.round(parsed) : parsed;
}

function collectBillingValidationErrors({
    planType,
    billingStatus,
    monthlyValue,
    monthlyRaw,
    licenseRawValue,
    existingBilling,
    municipioContext,
    maxUsers,
    maxUsersRaw,
    paymentDay,
    paymentDayRaw,
    installments,
    installmentsRaw
}) {
    const errors = [];
    const normalizedStatus = normalizeValue(billingStatus) || 'pending';
    const municipioBase = municipioContext || {};
    const baseBilling = municipioBase.billing || {};
    const effectivePlan = normalizeValue(planType)
        || normalizeValue(existingBilling.plan_type)
        || normalizeValue(baseBilling.plan_type)
        || normalizeValue(municipioBase.license_type)
        || normalizeValue(municipioBase.plano);

    const effectiveMonthly = monthlyRaw === ''
        ? normalizeNullableNumber(
            existingBilling.monthly_value
            ?? baseBilling.monthly_value
            ?? municipioBase.custom_monthly_value
            ?? municipioBase.monthly_value
        )
        : monthlyValue;

    const effectiveLicense = licenseRawValue
        ? licenseRawValue
        : (
            existingBilling.contract_end
            || baseBilling.contract_end
            || municipioBase.license_expires
            || municipioBase.data_vencimento_licenca
        );

    const effectivePaymentDay = paymentDayRaw === ''
        ? normalizeNullableNumber(
            existingBilling.payment_day
            ?? baseBilling.payment_day,
            { integer: true }
        )
        : paymentDay;

    const effectiveInstallments = installmentsRaw === ''
        ? normalizeNullableNumber(
            existingBilling.installments
            ?? baseBilling.installments,
            { integer: true }
        )
        : installments;

    const statusRequiringPlan = ['active', 'paused', 'suspended'];

    if (monthlyRaw !== '' && monthlyValue === null) {
        errors.push('Valor mensal inválido.');
    }

    if (maxUsersRaw !== '' && maxUsers === null) {
        errors.push('Limite máximo de usuários inválido.');
    }

    if (paymentDayRaw !== '' && paymentDay === null) {
        errors.push('Dia de pagamento inválido.');
    }

    if (installmentsRaw !== '' && installments === null) {
        errors.push('Número de parcelas inválido.');
    }

    if (licenseRawValue) {
        const licenseTest = new Date(licenseRawValue);
        if (Number.isNaN(licenseTest.getTime())) {
            errors.push('Informe uma data de licença válida.');
        }
    }

    if (statusRequiringPlan.includes(normalizedStatus) && !effectivePlan) {
        errors.push('Selecione um plano antes de ativar ou pausar o faturamento.');
    }

    if (normalizedStatus === 'active') {
        const hasMonthlyInput = monthlyRaw !== '' || effectiveMonthly !== null;
        if (hasMonthlyInput) {
            if (effectiveMonthly !== null && Number.isNaN(Number(effectiveMonthly))) {
                errors.push('Informe um valor mensal válido para faturamento ativo.');
            } else if (effectiveMonthly !== null && Number(effectiveMonthly) < 0) {
                errors.push('O valor mensal não pode ser negativo quando o faturamento está ativo.');
            }
        }
        if (!effectiveLicense) {
            errors.push('Defina a data de vencimento da licença para faturamento ativo.');
        }
    }

    if (monthlyRaw !== '' && monthlyValue !== null && Number(monthlyValue) < 0) {
        errors.push('O valor mensal não pode ser negativo.');
    }

    if (maxUsers !== null && Number(maxUsers) <= 0) {
        errors.push('Limite máximo de usuários deve ser maior que zero.');
    }

    if (paymentDayRaw !== '' || (effectivePaymentDay !== null && effectivePaymentDay !== undefined)) {
        const paymentDayValue = paymentDayRaw !== '' ? paymentDay : effectivePaymentDay;
        if (paymentDayValue !== null && paymentDayValue !== undefined && (paymentDayValue < 1 || paymentDayValue > 31)) {
            errors.push('O dia de pagamento deve estar entre 1 e 31.');
        }
    }

    if (installmentsRaw !== '' || (effectiveInstallments !== null && effectiveInstallments !== undefined)) {
        const installmentsValue = installmentsRaw !== '' ? installments : effectiveInstallments;
        if (installmentsValue !== null && installmentsValue !== undefined && installmentsValue < 1) {
            errors.push('O número de parcelas deve ser pelo menos 1.');
        }
    }

    return errors;
}

async function submitBillingConfig(event) {
    event.preventDefault();

    if (!billingMunicipioSelected) {
        showError('Selecione um município antes de salvar.');
        return;
    }

    if (billingFormIsLoading) {
        showError('Aguarde o carregamento dos dados antes de salvar.');
        return;
    }

    const planSelect = document.getElementById('billing-plan-type');
    const statusSelect = document.getElementById('billing-status');
    const maxUsersInput = document.getElementById('billing-max-users');
    const licenseInput = document.getElementById('billing-license-expires');
    const monthlyInput = document.getElementById('billing-monthly-value');
    const paymentDayInput = document.getElementById('billing-payment-day');
    const installmentsInput = document.getElementById('billing-installments');
    const notesInput = document.getElementById('billing-notes');

    const planType = normalizeValue(planSelect?.value || '') || null;
    const billingStatus = normalizeValue(statusSelect?.value || 'pending') || 'pending';
    const maxUsers = normalizeNullableNumber(maxUsersInput?.value, { integer: true });
    const licenseRawValue = licenseInput ? licenseInput.value : '';
    const monthlyValue = normalizeNullableNumber(monthlyInput?.value);
    const paymentDay = normalizeNullableNumber(paymentDayInput?.value, { integer: true });
    const installments = normalizeNullableNumber(installmentsInput?.value, { integer: true });
    const notes = notesInput?.value?.trim() || '';

    const existingBilling = { ...(billingMunicipioData?.billing || {}) };
    const monthlyRaw = monthlyInput?.value ?? '';
    const paymentDayRaw = paymentDayInput?.value ?? '';
    const installmentsRaw = installmentsInput?.value ?? '';
    const maxUsersRaw = maxUsersInput?.value ?? '';

    const validationErrors = collectBillingValidationErrors({
        planType,
        billingStatus,
        monthlyValue,
        monthlyRaw,
        licenseRawValue,
        existingBilling,
        municipioContext: billingMunicipioData,
        maxUsers,
        maxUsersRaw,
        paymentDay,
        paymentDayRaw,
        installments,
        installmentsRaw
    });

    if (validationErrors.length) {
        showError(validationErrors[0]);
        return;
    }

    const licenseIso = licenseRawValue ? new Date(licenseRawValue).toISOString() : null;
    const municipioStatus = billingStatus === 'inactive'
        ? 'inactive'
        : (billingStatus === 'pending' ? 'pending' : 'active');
    const nowIso = new Date().toISOString();

    const resolvedMonthlyValue = monthlyRaw === ''
        ? null
        : (monthlyValue ?? existingBilling.monthly_value ?? null);
    const resolvedEffectiveValue = monthlyRaw === ''
        ? null
        : (monthlyValue ?? existingBilling.effective_monthly_value ?? existingBilling.monthly_value ?? null);
    const resolvedPaymentDay = paymentDayRaw === ''
        ? null
        : (paymentDay ?? existingBilling.payment_day ?? null);
    const resolvedInstallments = installmentsRaw === ''
        ? null
        : (installments ?? existingBilling.installments ?? null);

    const billingPayload = {
        ...existingBilling,
        status: billingStatus,
        plan_type: planType,
        monthly_value: resolvedMonthlyValue,
        effective_monthly_value: resolvedEffectiveValue,
        installments: resolvedInstallments,
        payment_day: resolvedPaymentDay,
        contract_end: licenseRawValue === '' ? null : (licenseIso ?? existingBilling.contract_end ?? null),
        notes,
        updated_at: nowIso,
        updated_by: currentUser?.email || null
    };

    billingPayload.coupon_code = existingBilling.coupon_code || null;
    billingPayload.coupon_discount_type = existingBilling.coupon_discount_type || null;
    billingPayload.coupon_discount_value = existingBilling.coupon_discount_value || null;
    billingPayload.coupon_valid_until = existingBilling.coupon_valid_until || null;
    billingPayload.coupon_applied_at = existingBilling.coupon_applied_at || null;

    const payload = {
        license_type: planType || billingMunicipioData?.license_type || 'pending',
        billing_status: billingStatus,
        status: municipioStatus,
        billing: billingPayload
    };

    if (maxUsers !== null) {
        payload.max_usuarios = maxUsers;
        payload.max_users = maxUsers;
    }

    if (licenseIso) {
        payload.license_expires = licenseIso;
        payload.data_vencimento_licenca = licenseIso;
    } else {
        payload.license_expires = null;
        payload.data_vencimento_licenca = null;
    }

    try {
        billingFormIsLoading = true;
        setBillingFormDisabled(true);
        showLoading(true);
        await API.updateMunicipio(billingMunicipioSelected, payload);
        showSuccess('Configurações de faturamento atualizadas com sucesso!');
        await loadDashboardData();
        await loadBillingForMunicipio(billingMunicipioSelected, { skipLoader: true });
    } catch (error) {
        console.error('Erro ao atualizar faturamento do município:', error);
        showError(error?.message || 'Falha ao salvar configuração de faturamento.');
    } finally {
        billingFormIsLoading = false;
        setBillingFormDisabled(false);
        showLoading(false);
    }
}

function handleBillingMunicipioChange(event) {
    const municipioId = event.target.value;
    billingMunicipioSelected = municipioId;
    if (!municipioId) {
        resetBillingSummary();
        setBillingFormDisabled(true);
        billingMunicipioData = null;
        return;
    }
    loadBillingForMunicipio(municipioId, { skipLoader: false });
}

async function refreshBillingData() {
    if (!billingMunicipioSelected) {
        showError('Selecione um município para atualizar.');
        return;
    }
    await loadBillingForMunicipio(billingMunicipioSelected, { skipLoader: false });
}

// ============================================
// RELATÓRIOS
// ============================================

function isReportsSectionVisible() {
    const section = document.getElementById('section-relatorios');
    return section ? !section.classList.contains('hidden') : false;
}

function setReportExpiringLoading(isLoading) {
    reportsState.expiring.isLoading = isLoading;
    const loader = document.getElementById('reports-expiring-loading');
    if (loader) {
        loader.classList.toggle('hidden', !isLoading);
    }
    const refreshBtn = document.getElementById('reports-expiry-refresh');
    if (refreshBtn) {
        refreshBtn.disabled = isLoading;
        refreshBtn.textContent = isLoading ? 'Atualizando...' : 'Atualizar';
    }
    const rangeSelect = document.getElementById('reports-expiry-range');
    if (rangeSelect) {
        rangeSelect.disabled = isLoading;
    }
}

function setReportCapacityLoading(isLoading) {
    reportsState.capacity.isLoading = isLoading;
    const loader = document.getElementById('reports-capacity-loading');
    if (loader) {
        loader.classList.toggle('hidden', !isLoading);
    }
    const refreshBtn = document.getElementById('reports-capacity-refresh');
    if (refreshBtn) {
        refreshBtn.disabled = isLoading;
        refreshBtn.textContent = isLoading ? 'Atualizando...' : 'Atualizar';
    }
}

function updateReportsOverview() {
    const expiringCount = reportsState.expiring.data.length;
    const expiringCountEl = document.getElementById('reports-expiring-total');
    if (expiringCountEl) {
        expiringCountEl.textContent = String(expiringCount);
    }

    const rangeLabelEl = document.getElementById('reports-expiring-range-label');
    if (rangeLabelEl) {
        rangeLabelEl.textContent = `Monitorando próximos ${reportsState.expiring.rangeDays} dias`;
    }

    const orderedExpirations = [...reportsState.expiring.data]
        .filter(item => item && Number.isFinite(item.days_until_expiry))
        .sort((a, b) => a.days_until_expiry - b.days_until_expiry);
    const nextExpiration = orderedExpirations[0];

    const nextValueEl = document.getElementById('reports-next-expiration-value');
    const nextMunicipioEl = document.getElementById('reports-next-expiration-municipio');

    if (nextExpiration) {
        if (nextValueEl) {
            nextValueEl.textContent = formatDaysLabel(nextExpiration.days_until_expiry);
        }
        if (nextMunicipioEl) {
            const details = [];
            if (nextExpiration.expires_at) {
                details.push(formatDate(nextExpiration.expires_at));
            }
            if (nextExpiration.municipio_nome) {
                details.push(nextExpiration.municipio_nome);
            }
            nextMunicipioEl.textContent = details.length
                ? details.join(' • ')
                : 'Licença próxima do vencimento';
        }
    } else {
        if (nextValueEl) nextValueEl.textContent = '-';
        if (nextMunicipioEl) nextMunicipioEl.textContent = 'Nenhuma licença vencendo no período monitorado.';
    }

    const criticalUsage = reportsState.capacity.data.filter(item => {
        const percent = Number(item?.users?.usage_percent);
        return Number.isFinite(percent) && percent >= 90;
    });

    const criticalCountEl = document.getElementById('reports-critical-count');
    if (criticalCountEl) {
        criticalCountEl.textContent = String(criticalUsage.length);
    }

    const criticalSummaryEl = document.getElementById('reports-critical-summary');
    if (criticalSummaryEl) {
        criticalSummaryEl.textContent = 'Ocupação ≥ 90% do limite contratado';
    }

    const totalMonitoredEl = document.getElementById('reports-total-monitored');
    if (totalMonitoredEl) {
        totalMonitoredEl.textContent = String(reportsState.capacity.data.length);
    }

    const totalMonitoredSubtitleEl = document.getElementById('reports-total-monitored-subtitle');
    if (totalMonitoredSubtitleEl) {
        if (reportsState.lastLoadedAt) {
            totalMonitoredSubtitleEl.textContent = `Atualizado ${formatDateTime(reportsState.lastLoadedAt)}`;
        } else {
            totalMonitoredSubtitleEl.textContent = 'Dados consolidados dos municípios';
        }
    }

    const usageValues = reportsState.capacity.data
        .map(item => Number(item?.users?.usage_percent))
        .filter(value => Number.isFinite(value));
    const averageUsage = usageValues.length
        ? Math.round(usageValues.reduce((total, value) => total + value, 0) / usageValues.length)
        : null;

    const averageUsageEl = document.getElementById('reports-average-usage');
    if (averageUsageEl) {
        averageUsageEl.textContent = averageUsage !== null ? `${averageUsage}%` : '-';
    }

    const averageUsageSubtitleEl = document.getElementById('reports-average-usage-subtitle');
    if (averageUsageSubtitleEl) {
        averageUsageSubtitleEl.textContent = usageValues.length
            ? 'Média de ocupação dos limites de usuários'
            : 'Sem limites de usuários configurados';
    }

    // Renderizar gráficos após atualizar dados
    renderReportsCharts();
    populateEstadoFilter();
}

function renderExpiringLicenses() {
    const tableBody = document.getElementById('reports-expiring-table');
    const emptyState = document.getElementById('reports-expiring-empty');
    const summaryEl = document.getElementById('reports-expiring-summary');

    if (!tableBody || !emptyState) {
        return;
    }

    const items = [...reportsState.expiring.data]
        .map(normalizeExpiringLicense)
        .filter(Boolean)
        .sort((a, b) => {
            const daysA = Number.isFinite(a.days_until_expiry) ? a.days_until_expiry : Infinity;
            const daysB = Number.isFinite(b.days_until_expiry) ? b.days_until_expiry : Infinity;
            return daysA - daysB;
        });

    if (!items.length) {
        tableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (summaryEl) {
            summaryEl.textContent = 'Nenhuma licença vence no período monitorado.';
        }
        return;
    }

    emptyState.classList.add('hidden');
    if (summaryEl) {
        summaryEl.textContent = `${items.length} licença(s) vencem em até ${reportsState.expiring.rangeDays} dias.`;
    }

    const rows = items.map(item => {
        const municipioId = escapeHtml(item.municipio_id || '-');
        const municipioNome = escapeHtml(item.municipio_nome || municipioId);
        const planLabel = escapeHtml(formatPlanoLabel(item.license_type));
        const planClassMap = {
            premium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            profissional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            standard: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            pending: 'bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
            pendente: 'bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300'
        };
        const planClass = planClassMap[normalizeValue(item.license_type)]
            || 'bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';

        const daysValue = Number(item.days_until_expiry);
        let daysClass = 'text-text-secondary dark:text-gray-400';
        if (Number.isFinite(daysValue)) {
            if (daysValue < 0) {
                daysClass = 'text-rose-600 font-semibold dark:text-rose-400';
            } else if (daysValue <= 7) {
                daysClass = 'text-amber-600 font-semibold dark:text-amber-400';
            } else {
                daysClass = 'text-emerald-600 font-semibold dark:text-emerald-400';
            }
        }

        const expiresLabel = item.expires_at ? formatDate(item.expires_at) : 'Sem data';

        return `
            <tr class="border-b border-border-light/60 dark:border-border-dark/60">
                <td class="px-6 py-4 align-top">
                    <p class="font-medium">${municipioNome}</p>
                    <p class="text-xs text-text-secondary dark:text-gray-400">ID: ${municipioId}</p>
                </td>
                <td class="px-6 py-4 align-top">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${planClass}">${planLabel}</span>
                </td>
                <td class="px-6 py-4 align-top">
                    <p class="text-sm">${expiresLabel}</p>
                </td>
                <td class="px-6 py-4 align-top">
                    <span class="text-sm ${daysClass}">${formatDaysLabel(item.days_until_expiry)}</span>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

function renderCapacityTable() {
    const tableBody = document.getElementById('reports-capacity-table');
    const emptyState = document.getElementById('reports-capacity-empty');
    const summaryEl = document.getElementById('reports-capacity-summary');

    if (!tableBody || !emptyState) {
        return;
    }

    let items = [...reportsState.capacity.data].map(normalizeMunicipalityReportStat).filter(Boolean);

    if (reportsFilters.plan !== 'all') {
        items = items.filter(item => normalizeValue(item.license_type) === reportsFilters.plan);
    }

    if (reportsFilters.status !== 'all') {
        items = items.filter(item => {
            const normalizedStatus = normalizeValue(item.status || 'pending');
            switch (reportsFilters.status) {
                case 'ativo':
                    return normalizedStatus === 'ativo' || normalizedStatus === 'active';
                case 'inativo':
                    return normalizedStatus === 'inativo' || normalizedStatus === 'inactive';
                case 'pendente':
                    return normalizedStatus === 'pendente' || normalizedStatus === 'pending';
                default:
                    return normalizedStatus === reportsFilters.status;
            }
        });
    }

    if (reportsFilters.onlyCritical) {
        items = items.filter(item => {
            const percent = Number(item?.users?.usage_percent);
            return Number.isFinite(percent) && percent >= 90;
        });
    }

    items.sort((a, b) => {
        const usageA = Number(a?.users?.usage_percent);
        const usageB = Number(b?.users?.usage_percent);
        const valueA = Number.isFinite(usageA) ? usageA : -1;
        const valueB = Number.isFinite(usageB) ? usageB : -1;
        return valueB - valueA;
    });

    if (!items.length) {
        tableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (summaryEl) {
            summaryEl.textContent = 'Nenhum município atende aos filtros selecionados.';
        }
        return;
    }

    emptyState.classList.add('hidden');
    if (summaryEl) {
        summaryEl.textContent = `${items.length} município(s) listados conforme os filtros atuais.`;
    }

    const rows = items.map(item => {
        const municipioId = escapeHtml(item.municipio_id || '-');
        const municipioNome = escapeHtml(item.municipio_nome || municipioId);

        const planLabel = escapeHtml(formatPlanoLabel(item.license_type));
        const planClassMap = {
            premium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            profissional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            standard: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            pending: 'bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
            pendente: 'bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300'
        };
        const planClass = planClassMap[normalizeValue(item.license_type)]
            || 'bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';

        const currentUsers = Number(item?.users?.current) || 0;
        const maxUsers = Number.isFinite(item?.users?.max) && item.users.max !== null ? item.users.max : null;
        const usagePercent = Number(item?.users?.usage_percent);
        const usageDisplay = Number.isFinite(usagePercent) ? `${usagePercent}%` : 'Sem dado';
        const usageBarWidth = Number.isFinite(usagePercent) ? Math.min(100, Math.max(0, usagePercent)) : 0;

        let usageColor = 'bg-primary';
        if (Number.isFinite(usagePercent)) {
            if (usagePercent >= 100) {
                usageColor = 'bg-rose-500';
            } else if (usagePercent >= 90) {
                usageColor = 'bg-amber-500';
            } else {
                usageColor = 'bg-emerald-500';
            }
        } else {
            usageColor = 'bg-gray-400 dark:bg-gray-600';
        }

        let usageTextClass = 'text-text-secondary dark:text-gray-400';
        if (Number.isFinite(usagePercent)) {
            if (usagePercent >= 100) {
                usageTextClass = 'text-rose-600 font-semibold dark:text-rose-400';
            } else if (usagePercent >= 90) {
                usageTextClass = 'text-amber-600 font-semibold dark:text-amber-400';
            } else {
                usageTextClass = 'text-emerald-600 font-semibold dark:text-emerald-400';
            }
        }

        const statusNormalized = normalizeValue(item.status || 'pending');
        const statusLabel = escapeHtml(formatStatusLabel(statusNormalized));
        const statusClassMap = {
            ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            inativo: 'bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
            inactive: 'bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
            pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            suspenso: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        };
        const statusClass = statusClassMap[statusNormalized]
            || 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';

        const licenseLabel = item.license_expires ? formatDate(item.license_expires) : 'Não configurada';

        return `
            <tr class="border-b border-border-light/60 dark:border-border-dark/60">
                <td class="px-6 py-4 align-top">
                    <p class="font-medium">${municipioNome}</p>
                    <p class="text-xs text-text-secondary dark:text-gray-400">ID: ${municipioId}</p>
                </td>
                <td class="px-6 py-4 align-top">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${planClass}">${planLabel}</span>
                </td>
                <td class="px-6 py-4 align-top">
                    <div class="flex items-center justify-between text-sm">
                        <span>${currentUsers}${maxUsers !== null ? ` / ${maxUsers}` : ''}</span>
                        <span class="${usageTextClass}">${usageDisplay}</span>
                    </div>
                    <div class="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div class="h-2 rounded-full ${usageColor}" style="width: ${usageBarWidth}%;"></div>
                    </div>
                </td>
                <td class="px-6 py-4 align-top">
                    <p class="text-sm">${licenseLabel}</p>
                </td>
                <td class="px-6 py-4 align-top">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">${statusLabel}</span>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

async function loadExpiringLicenses(rangeDays, options = {}) {
    const { force = false, silent = false } = options;
    const targetRange = parseInt(rangeDays, 10) || 30;
    const shouldFetch = force
        || reportsState.expiring.rangeDays !== targetRange
        || !reportsState.expiring.data.length;

    reportsState.expiring.rangeDays = targetRange;

    const rangeSelect = document.getElementById('reports-expiry-range');
    if (rangeSelect && rangeSelect.value !== String(targetRange)) {
        rangeSelect.value = String(targetRange);
    }

    if (!shouldFetch) {
        renderExpiringLicenses();
        updateReportsOverview();
        return;
    }

    setReportExpiringLoading(true);

    try {
        const response = await API.getLicencasExpirando(targetRange);
        const list = Array.isArray(response?.expiring_licenses) ? response.expiring_licenses : [];
        reportsState.expiring.data = list.map(normalizeExpiringLicense).filter(Boolean);
        const backendRange = Number(response?.period_days);
        if (Number.isFinite(backendRange) && backendRange > 0) {
            reportsState.expiring.rangeDays = backendRange;
        }
    } catch (error) {
        console.error('Erro ao carregar licenças a vencer:', error);
        if (!silent) {
            showError(error?.message || 'Erro ao carregar licenças a vencer.');
        }
        throw error;
    } finally {
        setReportExpiringLoading(false);
        renderExpiringLicenses();
        updateReportsOverview();
    }
}

async function loadCapacityStats(options = {}) {
    const { force = false, silent = false } = options;
    const shouldFetch = force || !reportsState.capacity.data.length || reportsState.needsRefresh;

    if (!shouldFetch) {
        renderCapacityTable();
        updateReportsOverview();
        return;
    }

    setReportCapacityLoading(true);

    try {
        const response = await API.getMunicipiosStats();
        const list = Array.isArray(response?.municipalities_stats) ? response.municipalities_stats : [];
        reportsState.capacity.data = list.map(normalizeMunicipalityReportStat).filter(Boolean);
    } catch (error) {
        console.error('Erro ao carregar estatísticas dos municípios:', error);
        if (!silent) {
            showError(error?.message || 'Erro ao carregar estatísticas dos municípios.');
        }
        throw error;
    } finally {
        setReportCapacityLoading(false);
        renderCapacityTable();
        updateReportsOverview();
    }
}

async function loadReportsData(options = {}) {
    const { force = false, silent = false } = options;
    try {
        await Promise.all([
            loadExpiringLicenses(reportsState.expiring.rangeDays, { force, silent }),
            loadCapacityStats({ force, silent })
        ]);
        reportsState.lastLoadedAt = new Date();
        reportsState.needsRefresh = false;
        reportsInitialized = true;
    } catch (error) {
        reportsState.needsRefresh = true;
        console.error('Erro ao carregar relatórios consolidados:', error);
        if (!silent) {
            // Erros específicos já foram tratados individualmente.
        }
    }
}

function setupReportsControls() {
    const rangeSelect = document.getElementById('reports-expiry-range');
    if (rangeSelect && !rangeSelect.dataset.bound) {
        rangeSelect.value = String(reportsState.expiring.rangeDays);
        rangeSelect.addEventListener('change', event => {
            const value = parseInt(event.target.value, 10) || reportsState.expiring.rangeDays;
            loadExpiringLicenses(value, { force: true }).catch(() => {});
        });
        rangeSelect.dataset.bound = 'true';
    }

    const expiryRefreshBtn = document.getElementById('reports-expiry-refresh');
    if (expiryRefreshBtn && !expiryRefreshBtn.dataset.bound) {
        expiryRefreshBtn.addEventListener('click', () => {
            loadExpiringLicenses(reportsState.expiring.rangeDays, { force: true }).catch(() => {});
        });
        expiryRefreshBtn.dataset.bound = 'true';
    }

    const planSelect = document.getElementById('reports-capacity-plan');
    if (planSelect && !planSelect.dataset.bound) {
        planSelect.value = reportsFilters.plan;
        planSelect.addEventListener('change', event => {
            reportsFilters.plan = event.target.value || 'all';
            renderCapacityTable();
        });
        planSelect.dataset.bound = 'true';
    }

    const statusSelect = document.getElementById('reports-capacity-status');
    if (statusSelect && !statusSelect.dataset.bound) {
        statusSelect.value = reportsFilters.status;
        statusSelect.addEventListener('change', event => {
            reportsFilters.status = event.target.value || 'all';
            renderCapacityTable();
        });
        statusSelect.dataset.bound = 'true';
    }

    const estadoSelect = document.getElementById('reports-capacity-estado');
    if (estadoSelect && !estadoSelect.dataset.bound) {
        estadoSelect.value = reportsFilters.estado || 'all';
        estadoSelect.addEventListener('change', event => {
            reportsFilters.estado = event.target.value || 'all';
            renderCapacityTable();
        });
        estadoSelect.dataset.bound = 'true';
    }

    const criticalCheckbox = document.getElementById('reports-capacity-only-critical');
    if (criticalCheckbox && !criticalCheckbox.dataset.bound) {
        criticalCheckbox.checked = reportsFilters.onlyCritical;
        criticalCheckbox.addEventListener('change', event => {
            reportsFilters.onlyCritical = event.target.checked;
            renderCapacityTable();
        });
        criticalCheckbox.dataset.bound = 'true';
    }

    const capacityRefreshBtn = document.getElementById('reports-capacity-refresh');
    if (capacityRefreshBtn && !capacityRefreshBtn.dataset.bound) {
        capacityRefreshBtn.addEventListener('click', () => {
            loadCapacityStats({ force: true }).catch(() => {});
        });
        capacityRefreshBtn.dataset.bound = 'true';
    }

    // Botões de exportação
    const expiryPdfBtn = document.getElementById('reports-expiry-export-pdf');
    if (expiryPdfBtn && !expiryPdfBtn.dataset.bound) {
        expiryPdfBtn.addEventListener('click', exportExpiringToPDF);
        expiryPdfBtn.dataset.bound = 'true';
    }

    const expiryCsvBtn = document.getElementById('reports-expiry-export-csv');
    if (expiryCsvBtn && !expiryCsvBtn.dataset.bound) {
        expiryCsvBtn.addEventListener('click', exportExpiringToCSV);
        expiryCsvBtn.dataset.bound = 'true';
    }

    const capacityPdfBtn = document.getElementById('reports-capacity-export-pdf');
    if (capacityPdfBtn && !capacityPdfBtn.dataset.bound) {
        capacityPdfBtn.addEventListener('click', exportCapacityToPDF);
        capacityPdfBtn.dataset.bound = 'true';
    }

    const capacityCsvBtn = document.getElementById('reports-capacity-export-csv');
    if (capacityCsvBtn && !capacityCsvBtn.dataset.bound) {
        capacityCsvBtn.addEventListener('click', exportCapacityToCSV);
        capacityCsvBtn.dataset.bound = 'true';
    }
}

// ============================================
// CRUD DE MUNICÍPIOS
// ============================================

function renderCouponsList() {
    const listEl = document.getElementById('coupons-list');
    const emptyStateEl = document.getElementById('coupons-empty-state');
    const summaryEl = document.getElementById('coupons-summary');

    if (!listEl || !emptyStateEl) {
        return;
    }

    const coupons = Array.isArray(couponsData)
        ? [...couponsData].map(normalizeCoupon).filter(Boolean)
        : [];

    couponsData = coupons;

    if (!coupons.length) {
        listEl.innerHTML = '';
        emptyStateEl.classList.remove('hidden');
        if (summaryEl) {
            summaryEl.textContent = couponsLoadError
                ? 'Não foi possível carregar os cupons. Atualize a página ou refaça o login.'
                : 'Nenhum cupom cadastrado no momento.';
        }
        return;
    }

    emptyStateEl.classList.add('hidden');
    couponsLoadError = null;

    const sortedCoupons = [...coupons].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
    });

    const statusStyles = {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        expired: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
        inactive: 'bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300'
    };

    const statusLabels = {
        active: 'Ativo',
        scheduled: 'Agendado',
        expired: 'Expirado',
        inactive: 'Inativo'
    };

    const cardsHtml = sortedCoupons.map(coupon => {
        const statusKey = (coupon.current_status || coupon.status || 'active').toLowerCase();
        const statusClass = statusStyles[statusKey] || statusStyles.active;
        const statusLabel = statusLabels[statusKey] || 'Ativo';
        const discountLabel = formatCouponDiscount(coupon);
        const targetLabel = resolveCouponTargetName(coupon);
        const validityLabel = resolveCouponValidity(coupon);
        const usageCount = coupon.usage_count || 0;
        const usageLabel = coupon.max_uses
            ? `${usageCount} de ${coupon.max_uses}`
            : usageCount === 0
                ? 'Uso ilimitado'
                : `${usageCount} usos (ilimitado)`;
        const createdAt = coupon.created_at ? formatDate(coupon.created_at) : '-';
        const createdBy = coupon.created_by || coupon.criado_por || '';
        const createdByHtml = createdBy
            ? `<span>Por ${escapeHtml(createdBy)}</span>`
            : '';

        return `
            <div class="rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900/40 p-4 space-y-4 shadow-sm">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-text-secondary/70 dark:text-gray-500">${escapeHtml(coupon.code || '')}</p>
                        <p class="text-base font-semibold text-text-primary dark:text-gray-100">${escapeHtml(coupon.description || 'Sem descrição')}</p>
                    </div>
                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${statusClass}">${statusLabel}</span>
                </div>
                <div class="grid gap-3 md:grid-cols-4 text-sm text-text-secondary dark:text-gray-400">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-text-secondary/70 dark:text-gray-500">Desconto</p>
                        <p class="font-medium text-text-primary dark:text-gray-100">${escapeHtml(discountLabel)}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase tracking-wide text-text-secondary/70 dark:text-gray-500">Abrangência</p>
                        <p class="font-medium text-text-primary dark:text-gray-100">${escapeHtml(targetLabel)}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase tracking-wide text-text-secondary/70 dark:text-gray-500">Validade</p>
                        <p class="font-medium text-text-primary dark:text-gray-100">${escapeHtml(validityLabel)}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase tracking-wide text-text-secondary/70 dark:text-gray-500">Usos</p>
                        <p class="font-medium text-text-primary dark:text-gray-100">${escapeHtml(usageLabel)}</p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center justify-between text-xs text-text-secondary/80 dark:text-gray-400 gap-2">
                    <span>Criado em ${escapeHtml(createdAt)}</span>
                    ${createdByHtml}
                </div>
            </div>
        `;
    }).join('');

    listEl.innerHTML = cardsHtml;

    if (summaryEl) {
        const total = sortedCoupons.length;
        summaryEl.textContent = total === 1
            ? '1 cupom disponível'
            : `${total} cupons disponíveis`;
    }
}

async function fetchCouponsAndRender(options = {}) {
    const { skipLoader = false } = options;

    try {
        if (!skipLoader) {
            showLoading(true);
        }

        const response = await API.getCupons();
        const rawList = Array.isArray(response?.coupons)
            ? response.coupons
            : Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response)
                    ? response
                    : [];

        couponsData = rawList
            .map(normalizeCoupon)
            .filter(Boolean);

        renderCouponsList();
    } catch (error) {
        console.error('Erro ao carregar cupons:', error);
        if (!skipLoader) {
            showError(error?.message || 'Erro ao carregar cupons de desconto.');
        }
    } finally {
        if (!skipLoader) {
            showLoading(false);
        }
    }
}

function resetCouponForm() {
    const form = document.getElementById('coupon-create-form');
    if (form) {
        form.reset();
    }

    const typeSelect = document.getElementById('coupon-discount-type');
    if (typeSelect) {
        typeSelect.value = 'percentage';
    }

    updateCouponDiscountInputs();
}

function openCouponModal() {
    resetCouponForm();
    populateCouponMunicipioSelect();

    showModalWithAnimation('couponModal');

    const codeInput = document.getElementById('coupon-code');
    if (codeInput) {
        codeInput.focus();
        codeInput.select();
    }
}

function closeCouponModal() {
    hideModalWithAnimation('couponModal', resetCouponForm);
}

function updateCouponDiscountInputs() {
    const typeSelect = document.getElementById('coupon-discount-type');
    const valueInput = document.getElementById('coupon-value');
    const valueLabel = document.getElementById('coupon-value-label');

    if (!typeSelect || !valueInput || !valueLabel) {
        return;
    }

    const type = (typeSelect.value || 'percentage').toLowerCase();
    if (type === 'fixed') {
        valueLabel.textContent = 'Valor de desconto (R$)';
        valueInput.min = '1';
        valueInput.max = '';
        valueInput.step = '0.01';
        valueInput.placeholder = 'Ex: 250';
    } else {
        valueLabel.textContent = 'Percentual de desconto (%)';
        valueInput.min = '1';
        valueInput.max = '100';
        valueInput.step = '1';
        valueInput.placeholder = 'Ex: 15';
    }
}

async function handleCouponSubmit(event) {
    event.preventDefault();

    const form = event.target;
    if (!form) {
        return;
    }

    const formData = new FormData(form);
    const code = (formData.get('code') || '').toString().trim().toUpperCase();

    if (!code || code.length < 3) {
        showError('Informe um código com pelo menos 3 caracteres.');
        return;
    }

    const description = (formData.get('description') || '').toString().trim();
    const discountType = (formData.get('discount_type') || 'percentage').toLowerCase();
    const rawValue = formData.get('discount_value') || formData.get('value');
    const discountValue = Number(rawValue);

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
        showError('Informe um valor de desconto válido.');
        return;
    }

    if (discountType === 'percentage' && discountValue > 100) {
        showError('O percentual máximo de desconto é 100%.');
        return;
    }

    const municipioRaw = formData.get('municipio_id') || '';
    const municipioId = municipioRaw && municipioRaw !== 'all' ? municipioRaw : null;

    const limitRaw = formData.get('max_uses') || '';
    let maxUses = null;
    if (limitRaw) {
        maxUses = parseInt(limitRaw, 10);
        if (!Number.isFinite(maxUses) || maxUses <= 0) {
            showError('O limite de usos deve ser um número inteiro positivo.');
            return;
        }
    }

    const validFromRaw = formData.get('valid_from') || '';
    const validUntilRaw = formData.get('valid_until') || '';

    if (validFromRaw && validUntilRaw) {
        const fromDate = new Date(`${validFromRaw}T00:00:00`);
        const untilDate = new Date(`${validUntilRaw}T23:59:59`);
        if (fromDate > untilDate) {
            showError('A data final deve ser posterior à data inicial.');
            return;
        }
    }

    const payload = {
        code,
        description,
        discount_type: discountType,
        discount_value: Number(discountValue.toFixed(2))
    };

    if (municipioId) {
        payload.municipio_id = municipioId;
    }
    if (validFromRaw) {
        payload.valid_from = validFromRaw;
    }
    if (validUntilRaw) {
        payload.valid_until = validUntilRaw;
    }
    if (maxUses) {
        payload.max_uses = maxUses;
    }

    try {
        showLoading(true);
        const response = await API.createCupom(payload);

        const createdCoupon = response?.coupon
            ? normalizeCoupon(response.coupon)
            : normalizeCoupon(response);

        if (createdCoupon) {
            couponsData = [createdCoupon, ...couponsData.filter(coupon => coupon.id !== createdCoupon.id)];
            renderCouponsList();
        } else {
            await fetchCouponsAndRender({ skipLoader: true });
        }

        showSuccess('Cupom criado com sucesso!');
        closeCouponModal();
    } catch (error) {
        console.error('Erro ao criar cupom:', error);
        showError(error?.message || 'Erro ao criar cupom.');
    } finally {
        showLoading(false);
    }
}

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
        license_type: 'pending',
        max_usuarios: 0,
        data_vencimento_licenca: null,
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
            const municipio = normalizeMunicipioRecord({
                ...cached,
                ...response.municipio
            }) || {
                ...cached,
                ...response.municipio
            };
            const municipioId = municipio.municipio_id || municipio.id || '';
            let computedUsers = 0;
            usuariosData.forEach(user => {
                const userMunicipio = user.municipio_id || user.municipioId || '';
                if (userMunicipio === municipioId) {
                    computedUsers += 1;
                }
            });

            const enriched = {
                ...municipio,
                statistics: {
                    ...(cached?.statistics || {}),
                    ...(response.statistics || {}),
                    users: usuariosData.length > 0
                        ? computedUsers
                        : (response.statistics?.users
                            ?? cached?.statistics?.users
                            ?? computedUsers)
                }
            };
            synchronizeMunicipioCache(enriched);
            return enriched;
        }
    } catch (error) {
        console.warn('Falha ao buscar detalhes completos do município:', error);
    }

    if (cached) {
        const normalizedCached = normalizeMunicipioRecord(cached) || cached;
        synchronizeMunicipioCache(normalizedCached);
        const municipioId = normalizedCached.municipio_id || normalizedCached.id || '';
        let computedUsers = 0;
        usuariosData.forEach(user => {
            const userMunicipio = user.municipio_id || user.municipioId || '';
            if (userMunicipio === municipioId) {
                computedUsers += 1;
            }
        });
        return {
            ...normalizedCached,
            statistics: {
                ...(normalizedCached.statistics || {}),
                users: usuariosData.length > 0
                    ? computedUsers
                    : (normalizedCached.statistics?.users ?? computedUsers)
            }
        };
    }

    return null;
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
    const municipioId = mun.municipio_id || mun.id || '';
    const maxUsuarios = mun.max_usuarios ?? mun.max_users ?? 0;
    const usuariosAtuaisCalculated = usuariosData.filter(user => {
        const userMunicipio = user.municipio_id || user.municipioId || '';
        return userMunicipio === municipioId;
    }).length;
    const usuariosAtuais = usuariosData.length > 0
        ? usuariosAtuaisCalculated
        : mun.usuarios_atuais ?? mun.current_users ?? mun.statistics?.users ?? 0;
    const licencaDate = mun.data_vencimento_licenca || mun.license_expires;

    if (nomeEl) nomeEl.textContent = nome;
    if (estadoEl) estadoEl.textContent = mun.estado || '-';
    if (planoEl) planoEl.textContent = formatPlanoLabel(getMunicipioPlanoValue(mun));
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

    const planLabelEl = document.getElementById('edit-municipio-plano-label');
    if (planLabelEl) {
        planLabelEl.textContent = formatPlanoLabel(getMunicipioPlanoValue(mun));
    }

    const billingStatusEl = document.getElementById('edit-municipio-billing-status');
    if (billingStatusEl) {
        const billingStatus = normalizeValue(mun.billing_status || mun.billing?.status || 'pending');
        billingStatusEl.textContent = formatPlanoLabel(billingStatus || 'pending');
    }

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
    const contactName = formData.get('contato_nome') || '';
    const contactEmail = formData.get('contato_email') || '';
    const contactPhone = formData.get('contato_telefone') || '';
    const observacoes = formData.get('observacoes') || '';
    const documentos = (formData.get('documentos') || '')
        .split(/[\n,;]+/)
        .map(item => item.trim())
        .filter(Boolean);

    const payload = {
        nome: formData.get('nome'),
        municipio_nome: formData.get('nome'),
        estado: formData.get('estado'),
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
    resetEditUserPhotoState(usuario.id, usuario.photo_url || '');

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

        let updatedPhotoUrl = editUserPhotoState.originalUrl || '';

        if (editUserPhotoState.photoToUpload) {
            // Enviar data URL completo (API valida e extrai mime/base64)
            const uploadResponse = await API.uploadUserPhoto(usuarioId, editUserPhotoState.photoToUpload);
            updatedPhotoUrl = uploadResponse?.photo_url || updatedPhotoUrl;
        } else if (editUserPhotoState.removePhoto) {
            const deleteResponse = await API.deleteUserPhoto(usuarioId);
            updatedPhotoUrl = typeof deleteResponse?.photo_url === 'string' ? deleteResponse.photo_url : '';
        }

        editUserPhotoState.originalUrl = updatedPhotoUrl;
        editUserPhotoState.photoToUpload = null;
        editUserPhotoState.removePhoto = false;

        showSuccess('Usuário atualizado com sucesso!');
        closeEditUserModal();
        await loadDashboardData();

        if (currentUser && currentUser.id === usuarioId) {
            setCurrentUserState({
                id: usuarioId,
                name: payload.name,
                phone: payload.phone,
                cpf: payload.cpf,
                role: payload.role,
                status: payload.status,
                municipio_id: payload.municipio_id,
                municipio_nome: payload.municipio_nome,
                photo_url: updatedPhotoUrl
            });
        }
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showError(`Erro ao atualizar usuário: ${error.message}`);
    } finally {
        showLoading(false);
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

function showModalWithAnimation(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    const panel = modal.querySelector('.modal-panel');
    if (panel) {
        panel.classList.remove('modal-exit');
        void panel.offsetWidth;
        panel.classList.add('modal-enter');
        setTimeout(() => panel.classList.remove('modal-enter'), 200);
    }
}

function hideModalWithAnimation(modalId, afterHide) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const panel = modal.querySelector('.modal-panel');
    if (panel) {
        panel.classList.remove('modal-enter');
        panel.classList.add('modal-exit');
        setTimeout(() => {
            panel.classList.remove('modal-exit');
            modal.classList.add('hidden');
            if (afterHide) afterHide();
        }, 180);
    } else {
        modal.classList.add('hidden');
        if (afterHide) afterHide();
    }
}

function openCreateModal() {
    showModalWithAnimation('createModal');
}

function closeCreateModal() {
    hideModalWithAnimation('createModal');
}

function openViewModal() {
    showModalWithAnimation('viewMunicipioModal');
}

function closeViewModal() {
    hideModalWithAnimation('viewMunicipioModal');
}

function openEditModal() {
    showModalWithAnimation('editMunicipioModal');
}

function closeEditModal() {
    hideModalWithAnimation('editMunicipioModal', () => {
        const form = document.getElementById('editMunicipioForm');
        if (form) {
            form.reset();
            delete form.dataset.municipioId;
        }
        municipioBeingEdited = null;
    });
}

function openDeleteModal() {
    showModalWithAnimation('deleteMunicipioModal');
}

function closeDeleteModal() {
    hideModalWithAnimation('deleteMunicipioModal', () => {
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
    });
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
    showModalWithAnimation('createUserModal');
    const form = document.getElementById('createUserForm');
    if (form) updateUserMunicipioVisibility(form);
}

function closeCreateUserModal() {
    const form = document.getElementById('createUserForm');
    hideModalWithAnimation('createUserModal', () => {
        if (form) {
            form.reset();
            updateUserMunicipioVisibility(form);
        }
    });
}

function openEditUserModal() {
    populateUserMunicipioSelects();
    showModalWithAnimation('editUserModal');
    const form = document.getElementById('editUserForm');
    if (form) updateUserMunicipioVisibility(form);
}

function closeEditUserModal() {
    const form = document.getElementById('editUserForm');
    hideModalWithAnimation('editUserModal', () => {
        if (form) {
            form.reset();
            delete form.dataset.usuarioId;
            updateUserMunicipioVisibility(form);
        }
        usuarioBeingEdited = null;
        resetEditUserPhotoState(null, '');
        const auditEl = document.getElementById('edit-user-audit');
        if (auditEl) auditEl.textContent = '';
    });
}

function openDeleteUsuarioModal() {
    showModalWithAnimation('deleteUsuarioModal');
}

function closeDeleteUsuarioModal() {
    hideModalWithAnimation('deleteUsuarioModal', () => {
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
    });
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
// CONFIGURAÇÕES E AUDITORIA
// ============================================

function updateConfigSummary() {
    const userNameEl = document.getElementById('config-current-user-name');
    const userEmailEl = document.getElementById('config-current-user-email');
    const userRoleEl = document.getElementById('config-current-user-role');
    const backendUrlEl = document.getElementById('config-backend-url');
    const lastSyncEl = document.getElementById('config-last-sync');
    const totalMunicipiosEl = document.getElementById('config-total-municipios');
    const totalUsuariosEl = document.getElementById('config-total-usuarios');
    const totalContratosEl = document.getElementById('config-total-contratos');
    const themeStatusEl = document.getElementById('config-theme-status');

    if (userNameEl) userNameEl.textContent = currentUser?.name || currentUser?.email || '-';
    if (userEmailEl) userEmailEl.textContent = currentUser?.email || '-';
    if (userRoleEl) userRoleEl.textContent = formatUserRole(currentUser?.role) || '-';
    if (backendUrlEl) backendUrlEl.textContent = API.baseURL || '-';

    const lastSyncValue = dashboardData?.updated_at ? formatDateTime(dashboardData.updated_at) : '';
    if (lastSyncEl) lastSyncEl.textContent = lastSyncValue || 'Ainda não sincronizado nesta sessão';

    if (totalMunicipiosEl) {
        const totalMun = typeof dashboardData?.total_municipios === 'number'
            ? dashboardData.total_municipios
            : municipiosTotalCount;
        totalMunicipiosEl.textContent = totalMun ?? 0;
    }

    if (totalUsuariosEl) {
        const totalUser = typeof dashboardData?.total_usuarios === 'number'
            ? dashboardData.total_usuarios
            : usuariosTotalCount;
        totalUsuariosEl.textContent = totalUser ?? 0;
    }

    if (totalContratosEl) {
        const totalContratos = typeof dashboardData?.contratos_totais === 'number'
            ? dashboardData.contratos_totais
            : dashboardData?.contratos_total
                ?? 0;
        totalContratosEl.textContent = totalContratos;
    }

    if (themeStatusEl) {
        themeStatusEl.textContent = document.documentElement.classList.contains('dark') ? 'Escuro' : 'Claro';
    }
}

function refreshHeaderUser() {
    const headerName = document.getElementById('header-user-name');
    const headerEmail = document.getElementById('header-user-email');
    const avatarImg = document.getElementById('header-user-avatar');
    const avatarIcon = document.getElementById('header-user-icon');

    if (headerName) {
        headerName.textContent = currentUser?.name || currentUser?.email || 'Admin Master';
    }

    if (headerEmail) {
        headerEmail.textContent = currentUser?.email || '-';
    }

    if (avatarImg) {
        const photoUrl = currentUser?.photo_url;
        if (photoUrl) {
            avatarImg.src = photoUrl;
            avatarImg.classList.remove('hidden');
            if (avatarIcon) avatarIcon.classList.add('hidden');
        } else {
            avatarImg.src = '';
            avatarImg.classList.add('hidden');
            if (avatarIcon) avatarIcon.classList.remove('hidden');
        }
    }
}

// ============================================
// NOTIFICAÇÕES (TOP BAR)
// ============================================

function seedNotifications() {
    // Dados simulados; substituir por fetch futuro.
    return [
        {
            id: 'n1',
            title: 'Novo contrato publicado',
            description: 'Contrato XPTO foi disponibilizado.',
            time: 'Agora',
            tone: 'info',
            read: false
        },
        {
            id: 'n2',
            title: 'Usuário criado',
            description: 'Maria Fernanda (Admin Municipal) foi adicionada.',
            time: 'Há 10 min',
            tone: 'success',
            read: false
        },
        {
            id: 'n3',
            title: 'Licença expira em 7 dias',
            description: 'Município de Cascavel precisa renovar o plano.',
            time: 'Hoje',
            tone: 'warning',
            read: true
        }
    ];
}

function renderNotifications() {
    const listEl = document.getElementById('notifications-list');
    const emptyEl = document.getElementById('notifications-empty');
    const badgeEl = document.getElementById('notifications-badge');

    if (!listEl || !emptyEl || !badgeEl) return;

    const unreadCount = notificationsState.items.filter(n => !n.read).length;

    if (unreadCount > 0) {
        badgeEl.textContent = unreadCount > 9 ? '9+' : unreadCount.toString();
        badgeEl.classList.remove('hidden');
    } else {
        badgeEl.textContent = '';
        badgeEl.classList.add('hidden');
    }

    if (!notificationsState.items.length) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');

    const toneColors = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        danger: 'bg-red-500'
    };

    listEl.innerHTML = notificationsState.items.map(notification => {
        const dotColor = toneColors[notification.tone] || 'bg-blue-500';
        const readClass = notification.read ? 'opacity-70' : '';
        return `
            <button class="w-full text-left px-4 py-3 notification-item ${readClass}" data-notification-id="${notification.id}">
                <div class="flex items-start gap-3">
                    <span class="notification-dot ${dotColor}"></span>
                    <div class="flex-1">
                        <p class="text-sm font-semibold">${notification.title}</p>
                        <p class="text-xs text-text-secondary dark:text-gray-400 mt-0.5">${notification.description}</p>
                        <p class="text-[11px] text-text-secondary dark:text-gray-500 mt-1">${notification.time}</p>
                    </div>
                </div>
            </button>
        `;
    }).join('');
}

function toggleNotificationsPanel(forceState) {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;

    const shouldOpen = typeof forceState === 'boolean' ? forceState : !notificationsState.isOpen;
    notificationsState.isOpen = shouldOpen;

    if (shouldOpen) {
        panel.classList.remove('hidden');
        panel.classList.remove('opacity-0');
    } else {
        panel.classList.add('hidden');
    }
}

function markNotificationRead(id) {
    notificationsState.items = notificationsState.items.map(item => item.id === id ? { ...item, read: true } : item);
    saveNotificationsToStorage(notificationsState.items);
    renderNotifications();
}

function markAllNotificationsRead() {
    notificationsState.items = notificationsState.items.map(item => ({ ...item, read: true }));
    saveNotificationsToStorage(notificationsState.items);
    renderNotifications();
}

function setupNotifications() {
    // Tentar carregar notificações armazenadas; se não houver, usar seed padrão
    const stored = loadNotificationsFromStorage();
    if (stored && stored.length > 0) {
        notificationsState.items = stored;
    } else {
        notificationsState.items = seedNotifications();
        saveNotificationsToStorage(notificationsState.items);
    }
    renderNotifications();

    const button = document.getElementById('notifications-button');
    const panel = document.getElementById('notifications-panel');
    const listEl = document.getElementById('notifications-list');
    const markAllBtn = document.getElementById('notifications-mark-all');

    if (button) {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleNotificationsPanel();
        });
    }

    if (markAllBtn) {
        markAllBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            markAllNotificationsRead();
        });
    }

    if (listEl) {
        listEl.addEventListener('click', (event) => {
            const item = event.target.closest('[data-notification-id]');
            if (!item) return;
            const id = item.dataset.notificationId;
            markNotificationRead(id);
        });
    }

    document.addEventListener('click', (event) => {
        if (!notificationsState.isOpen) return;
        const target = event.target;
        const isButton = target.closest && target.closest('#notifications-button');
        const isPanel = target.closest && target.closest('#notifications-panel');
        if (!isButton && !isPanel) {
            toggleNotificationsPanel(false);
        }
    });
}

function setCurrentUserState(partialUser) {
    if (!partialUser) {
        return;
    }

    currentUser = {
        ...(currentUser || {}),
        ...partialUser
    };

    if (!currentUser.id && partialUser.id) {
        currentUser.id = partialUser.id;
    }

    API.setCurrentUser(currentUser);
    updateConfigSummary();
    refreshHeaderUser();
}

function updateProfilePhotoActions() {
    const removeBtn = document.getElementById('profile-photo-remove-btn');
    if (!removeBtn) return;

    const label = removeBtn.querySelector('.profile-remove-label');
    const icon = removeBtn.querySelector('.material-symbols-outlined');

    const hasStoredPhoto = Boolean(profileState.data?.photo_url);
    const hasNewPhoto = Boolean(profileState.photoToUpload);
    const removalPending = profileState.removePhoto && hasStoredPhoto && !hasNewPhoto;

    const shouldShow = hasStoredPhoto || hasNewPhoto || removalPending;
    removeBtn.classList.toggle('hidden', !shouldShow);

    if (!shouldShow) {
        return;
    }

    if (hasNewPhoto) {
        if (icon) icon.textContent = 'close';
        if (label) label.textContent = 'Descartar imagem selecionada';
    } else if (removalPending) {
        if (icon) icon.textContent = 'undo';
        if (label) label.textContent = 'Desfazer remoção';
    } else {
        if (icon) icon.textContent = 'delete';
        if (label) label.textContent = 'Remover foto atual';
    }
}

function setProfilePhotoPreview(url) {
    const previewImg = document.getElementById('profile-photo-preview');
    const placeholder = document.getElementById('profile-photo-placeholder');

    profileState.photoPreview = url || '';

    if (previewImg && placeholder) {
        if (url) {
            previewImg.src = url;
            previewImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            previewImg.src = '';
            previewImg.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    }

    updateProfilePhotoActions();
}

function toggleProfilePhotoLoading(isLoading) {
    profileState.isUploading = Boolean(isLoading);
    const overlay = document.getElementById('profile-photo-loading');
    const uploadBtn = document.getElementById('profile-photo-upload-btn');
    const removeBtn = document.getElementById('profile-photo-remove-btn');
    if (overlay) overlay.classList.toggle('hidden', !isLoading);
    if (uploadBtn) uploadBtn.disabled = isLoading;
    if (removeBtn) removeBtn.disabled = isLoading;
}

function setProfileSavingState(isSaving) {
    const saveBtn = document.getElementById('profile-save-btn');
    if (!saveBtn) return;

    saveBtn.disabled = isSaving;
    saveBtn.classList.toggle('opacity-70', isSaving);

    const icon = saveBtn.querySelector('.material-symbols-outlined');
    if (icon) {
        icon.textContent = isSaving ? 'hourglass_top' : 'save';
    }

    const label = saveBtn.querySelector('.profile-save-label');
    if (label) {
        label.textContent = isSaving ? 'Salvando...' : 'Salvar alterações';
    }
}

async function loadProfileSettings() {
    const form = document.getElementById('profile-settings-form');
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const cpfInput = document.getElementById('profile-cpf');
    const photoInput = document.getElementById('profile-photo-input');

    if (!form || !nameInput || !emailInput || !phoneInput || !cpfInput) {
        return;
    }

    if (!currentUser || !currentUser.id) {
        showError('Usuário autenticado não encontrado. Faça login novamente.');
        return;
    }

    try {
        showLoading(true);
        const response = await API.getUsuario(currentUser.id);
        const usuario = response?.usuario || {};

        const normalized = {
            id: usuario.id || currentUser.id,
            name: usuario.name || usuario.nome || currentUser.name || '',
            email: usuario.email || currentUser.email || '',
            phone: usuario.phone || '',
            cpf: usuario.cpf || '',
            role: usuario.role || currentUser.role || 'admin_master',
            photo_url: usuario.photo_url || ''
        };

        profileState.data = normalized;
        profileState.photoToUpload = null;
        profileState.removePhoto = false;

        nameInput.value = normalized.name || '';
        emailInput.value = normalized.email || '';
        phoneInput.value = normalized.phone || '';
        cpfInput.value = normalized.cpf || '';

        if (photoInput) {
            photoInput.value = '';
        }

        setProfilePhotoPreview(normalized.photo_url || '');
    } catch (error) {
        const message = error?.message || 'Erro ao carregar dados do perfil.';
        showError(message);
    } finally {
        showLoading(false);
    }
}

function openProfileSettings() {
    switchSection('configuracoes-perfil');
    loadProfileSettings();
}

function resetProfileFormToCurrent() {
    if (profileState.data) {
        setProfilePhotoPreview(profileState.data.photo_url || '');
    }
    profileState.photoToUpload = null;
    profileState.removePhoto = false;
    const photoInput = document.getElementById('profile-photo-input');
    if (photoInput) {
        photoInput.value = '';
    }
    if (profileState.data) {
        const nameInput = document.getElementById('profile-name');
        const phoneInput = document.getElementById('profile-phone');
        const cpfInput = document.getElementById('profile-cpf');
        const emailInput = document.getElementById('profile-email');
        if (nameInput) nameInput.value = profileState.data.name || '';
        if (phoneInput) phoneInput.value = profileState.data.phone || '';
        if (cpfInput) cpfInput.value = profileState.data.cpf || '';
        if (emailInput) emailInput.value = profileState.data.email || '';
    }
}

function handleProfilePhotoSelection(event) {
    const file = event?.target?.files && event.target.files[0];
    if (!file) {
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showError('Formato de imagem não suportado. Utilize JPG, PNG ou WEBP.');
        event.target.value = '';
        return;
    }

    // Limit to ~3MB to avoid hitting backend 5MB JSON body cap once base64-encoded.
    if (file.size > 3 * 1024 * 1024) {
        showError('A imagem deve ter até 3MB.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        profileState.photoToUpload = reader.result;
        profileState.removePhoto = false;
        setProfilePhotoPreview(profileState.photoToUpload);
    };
    reader.onerror = () => {
        showError('Não foi possível ler o arquivo selecionado.');
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

function handleProfilePhotoRemove() {
    const photoInput = document.getElementById('profile-photo-input');
    if (photoInput) {
        photoInput.value = '';
    }

    const hasNewPhoto = Boolean(profileState.photoToUpload);
    const hasStoredPhoto = Boolean(profileState.data?.photo_url);

    if (hasNewPhoto) {
        profileState.photoToUpload = null;
        setProfilePhotoPreview(profileState.data?.photo_url || '');
        profileState.removePhoto = false;
        return;
    }

    if (profileState.removePhoto && hasStoredPhoto) {
        profileState.removePhoto = false;
        setProfilePhotoPreview(profileState.data.photo_url);
        return;
    }

    if (hasStoredPhoto) {
        profileState.removePhoto = true;
        setProfilePhotoPreview('');
        return;
    }

    profileState.photoToUpload = null;
    profileState.removePhoto = false;
    setProfilePhotoPreview('');
}

function resetEditUserPhotoState(usuarioId, currentUrl) {
    editUserPhotoState.usuarioId = usuarioId || null;
    editUserPhotoState.originalUrl = currentUrl || '';
    editUserPhotoState.preview = currentUrl || '';
    editUserPhotoState.photoToUpload = null;
    editUserPhotoState.removePhoto = false;
    setEditUserPhotoPreview(currentUrl || '');
    const input = document.getElementById('edit-user-photo-input');
    if (input) {
        input.value = '';
    }
}

function setEditUserPhotoPreview(url) {
    const previewImg = document.getElementById('edit-user-photo-preview');
    const placeholder = document.getElementById('edit-user-photo-placeholder');
    const removeBtn = document.getElementById('edit-user-photo-remove-btn');

    editUserPhotoState.preview = url || '';

    if (previewImg && placeholder) {
        if (url) {
            previewImg.src = url;
            previewImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            previewImg.src = '';
            previewImg.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    }

    if (removeBtn) {
        const hasPhoto = Boolean(url) || Boolean(editUserPhotoState.originalUrl);
        removeBtn.disabled = !hasPhoto;
        removeBtn.classList.toggle('opacity-50', !hasPhoto);
    }
}

function handleEditUserPhotoSelection(event) {
    const file = event?.target?.files && event.target.files[0];
    if (!file) {
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showError('Formato de imagem não suportado. Utilize JPG, PNG ou WEBP.');
        event.target.value = '';
        return;
    }

    // Limit to ~3MB to avoid hitting backend 5MB JSON body cap once base64-encoded.
    if (file.size > 3 * 1024 * 1024) {
        showError('A imagem deve ter até 3MB.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        editUserPhotoState.photoToUpload = reader.result;
        editUserPhotoState.removePhoto = false;
        setEditUserPhotoPreview(editUserPhotoState.photoToUpload);
    };
    reader.onerror = () => {
        showError('Não foi possível ler o arquivo selecionado.');
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

function handleEditUserPhotoRemove() {
    const fileInput = document.getElementById('edit-user-photo-input');
    if (fileInput) {
        fileInput.value = '';
    }

    const hasNewPhoto = Boolean(editUserPhotoState.photoToUpload);
    const hasStoredPhoto = Boolean(editUserPhotoState.originalUrl);

    if (hasNewPhoto) {
        editUserPhotoState.photoToUpload = null;
        editUserPhotoState.removePhoto = false;
        setEditUserPhotoPreview(editUserPhotoState.originalUrl || '');
        return;
    }

    if (editUserPhotoState.removePhoto && hasStoredPhoto) {
        editUserPhotoState.removePhoto = false;
        setEditUserPhotoPreview(editUserPhotoState.originalUrl);
        return;
    }

    if (hasStoredPhoto) {
        editUserPhotoState.removePhoto = true;
        setEditUserPhotoPreview('');
        return;
    }

    editUserPhotoState.photoToUpload = null;
    editUserPhotoState.removePhoto = false;
    setEditUserPhotoPreview('');
}

async function handleProfileFormSubmit(event) {
    event.preventDefault();

    if (!profileState.data || !profileState.data.id) {
        showError('Não foi possível identificar o usuário logado.');
        return;
    }

    const nameInput = document.getElementById('profile-name');
    const phoneInput = document.getElementById('profile-phone');
    const cpfInput = document.getElementById('profile-cpf');

    if (!nameInput || !phoneInput || !cpfInput) {
        showError('Formulário inválido. Tente novamente.');
        return;
    }

    const trimmedName = nameInput.value.trim();
    if (!trimmedName) {
        showError('Informe o nome completo.');
        return;
    }

    const updates = {};
    if (trimmedName !== (profileState.data.name || '')) {
        updates.name = trimmedName;
    }

    const trimmedPhone = phoneInput.value.trim();
    if (trimmedPhone !== (profileState.data.phone || '')) {
        updates.phone = trimmedPhone;
    }

    const trimmedCpf = cpfInput.value.trim();
    if (trimmedCpf !== (profileState.data.cpf || '')) {
        updates.cpf = trimmedCpf;
    }

    let newPhotoUrl = profileState.data.photo_url || '';

    try {
        setProfileSavingState(true);

        if (profileState.photoToUpload) {
            toggleProfilePhotoLoading(true);
            const uploadResponse = await API.uploadUserPhoto(profileState.data.id, profileState.photoToUpload);
            newPhotoUrl = uploadResponse?.photo_url || '';
            profileState.photoToUpload = null;
            profileState.removePhoto = false;
            profileState.data.photo_url = newPhotoUrl;
        } else if (profileState.removePhoto && profileState.data.photo_url) {
            toggleProfilePhotoLoading(true);
            await API.deleteUserPhoto(profileState.data.id);
            newPhotoUrl = '';
            profileState.data.photo_url = '';
            profileState.removePhoto = false;
        }

        toggleProfilePhotoLoading(false);

        if (Object.keys(updates).length > 0) {
            await API.updateUsuario(profileState.data.id, updates);
            profileState.data = {
                ...profileState.data,
                ...updates
            };
        }

        profileState.data = {
            ...profileState.data,
            name: trimmedName,
            phone: trimmedPhone,
            cpf: trimmedCpf,
            photo_url: newPhotoUrl
        };

        setCurrentUserState({
            id: profileState.data.id,
            name: profileState.data.name || trimmedName,
            email: profileState.data.email || currentUser?.email,
            role: profileState.data.role || currentUser?.role,
            photo_url: newPhotoUrl
        });

        setProfilePhotoPreview(newPhotoUrl);

        showSuccess('Perfil atualizado com sucesso!');
        profileState.photoToUpload = null;
    } catch (error) {
        toggleProfilePhotoLoading(false);
        const message = error?.message || 'Erro ao salvar mudanças do perfil.';
        showError(message);
    } finally {
        setProfileSavingState(false);
    }
}

function formatAuditEntity(entity) {
    const map = {
        municipality: 'Município',
        user: 'Usuário'
    };
    return map[entity] || (entity ? entity : 'Entidade desconhecida');
}

function formatAuditAction(action) {
    const map = {
        create: 'Criação',
        update: 'Atualização',
        delete: 'Exclusão',
        reset_password: 'Reset de senha'
    };
    return map[action] || (action ? action : 'Ação desconhecida');
}

function formatAuditValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch (error) {
            return '[objeto]';
        }
    }
    return value.toString();
}

function summarizeAuditChanges(log) {
    if (!log) return '';
    const before = log.before || {};
    const after = log.after || {};
    const keys = new Set([
        ...Object.keys(before || {}),
        ...Object.keys(after || {})
    ]);

    const changed = [];
    keys.forEach(key => {
        const beforeVal = formatAuditValue(before[key]);
        const afterVal = formatAuditValue(after[key]);
        if (beforeVal !== afterVal) {
            changed.push(key);
        }
    });

    if (changed.length === 0) {
        if (log.action === 'create') return 'Registro criado';
        if (log.action === 'delete') return 'Registro removido';
        if (log.action === 'reset_password') return 'Senha redefinida';
        return 'Atualização sem campos modificados detectados';
    }

    return `Campos alterados: ${changed.slice(0, 4).join(', ')}${changed.length > 4 ? ` +${changed.length - 4}` : ''}`;
}

function summarizeAuditMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
        return '';
    }

    const entries = Object.entries(metadata)
        .filter(([key]) => !auditSensitiveKeys.includes(key))
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${formatAuditValue(value)}`);

    return entries.join(' • ');
}

function renderAuditLogs() {
    const tbody = document.getElementById('audit-logs-table');
    const emptyMessage = document.getElementById('audit-empty-message');
    const loadMoreBtn = document.getElementById('audit-load-more');

    if (!tbody) return;

    if (!Array.isArray(auditLogs) || auditLogs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-text-secondary dark:text-gray-400">
                    Nenhum registro de auditoria encontrado para os filtros atuais.
                </td>
            </tr>
        `;
        if (emptyMessage) emptyMessage.classList.remove('hidden');
    } else {
        const rows = auditLogs.map(log => {
            const actionLabel = escapeHtml(formatAuditAction(log.action));
            const entityLabel = escapeHtml(formatAuditEntity(log.entity_type));
            const entityId = log.entity_id ? ` • ID: ${escapeHtml(log.entity_id)}` : '';
            const actorName = escapeHtml(log.performed_by || '-');
            const actorRole = escapeHtml(formatUserRole(log.performed_by_role) || '-');
            const createdAt = escapeHtml(formatDateTime(log.created_at) || '-');
            const changeSummary = escapeHtml(summarizeAuditChanges(log));
            const metadataSummary = summarizeAuditMetadata(log.metadata);

            const metadataHtml = metadataSummary
                ? `<p class="text-xs text-text-secondary/80 dark:text-gray-500 mt-1">${escapeHtml(metadataSummary)}</p>`
                : '';

            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td class="px-6 py-4 align-top">
                        <p class="font-medium">${actionLabel}</p>
                        <p class="text-xs text-text-secondary dark:text-gray-400">${entityLabel}${entityId}</p>
                    </td>
                    <td class="px-6 py-4 align-top">
                        <p class="font-medium">${actorName}</p>
                        <p class="text-xs text-text-secondary dark:text-gray-400">${actorRole}</p>
                    </td>
                    <td class="px-6 py-4 align-top whitespace-nowrap">${createdAt}</td>
                    <td class="px-6 py-4 align-top" colspan="2">
                        <p class="text-sm">${changeSummary}</p>
                        ${metadataHtml}
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
        if (emptyMessage) emptyMessage.classList.add('hidden');
    }

    if (loadMoreBtn) {
        if (auditHasMore) {
            loadMoreBtn.classList.remove('hidden');
            loadMoreBtn.disabled = auditIsLoading;
            loadMoreBtn.textContent = auditIsLoading ? 'Carregando...' : 'Carregar mais';
        } else {
            loadMoreBtn.classList.add('hidden');
        }
    }

    updateAuditSummaryInfo();
}

function setAuditLoadingState(isLoading) {
    auditIsLoading = isLoading;
    const indicator = document.getElementById('audit-loading-indicator');
    const loadMoreBtn = document.getElementById('audit-load-more');

    if (indicator) {
        indicator.classList.toggle('hidden', !isLoading);
    }

    if (loadMoreBtn && auditHasMore) {
        loadMoreBtn.disabled = isLoading;
        loadMoreBtn.textContent = isLoading ? 'Carregando...' : 'Carregar mais';
    }
}

function updateAuditSummaryInfo() {
    const totalEl = document.getElementById('config-audit-total');
    const lastUpdateEl = document.getElementById('config-audit-last-update');

    if (totalEl) totalEl.textContent = auditLogs.length;

    if (lastUpdateEl) {
        if (auditLogs.length === 0) {
            lastUpdateEl.textContent = 'Ainda sem registros coletados';
        } else {
            lastUpdateEl.textContent = formatDateTime(auditLogs[0].created_at) || '-';
        }
    }
}

async function loadAuditLogs(reset = false) {
    if (auditIsLoading) return;

    if (reset) {
        auditNextCursor = null;
        auditHasMore = false;
        auditLogs = [];
        renderAuditLogs();
    }

    setAuditLoadingState(true);

    try {
        const params = {
            limit: 25,
            entity_type: auditFilters.entity,
            action: auditFilters.action
        };

        if (auditFilters.performedBy) {
            params.performed_by = auditFilters.performedBy;
        }

        if (!reset && auditNextCursor) {
            params.cursor = auditNextCursor;
        }

        const response = await API.getAuditLogs(params);
        const logs = Array.isArray(response?.logs) ? response.logs : [];

        auditHasMore = Boolean(response?.next_cursor);
        auditNextCursor = response?.next_cursor || null;
        auditLogs = reset ? logs : [...auditLogs, ...logs];

        renderAuditLogs();
    } catch (error) {
        console.error('Erro ao carregar logs de auditoria:', error);
        showError(error?.message || 'Erro ao carregar logs de auditoria');
    } finally {
        setAuditLoadingState(false);
    }
}

function resetAuditFilters() {
    auditFilters = {
        entity: 'all',
        action: 'all',
        performedBy: ''
    };

    const entitySelect = document.getElementById('audit-filter-entity');
    const actionSelect = document.getElementById('audit-filter-action');
    const performedInput = document.getElementById('audit-filter-performed');

    if (entitySelect) entitySelect.value = 'all';
    if (actionSelect) actionSelect.value = 'all';
    if (performedInput) performedInput.value = '';

    loadAuditLogs(true);
}

function syncConfigThemeToggle() {
    const btn = document.getElementById('config-theme-toggle');
    const themeStatusEl = document.getElementById('config-theme-status');
    const isDark = document.documentElement.classList.contains('dark');

    if (btn) {
        btn.textContent = isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro';
    }

    if (themeStatusEl) {
        themeStatusEl.textContent = isDark ? 'Escuro' : 'Claro';
    }
}

// ============================================
// TEMA
// ============================================

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    syncConfigThemeToggle();
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
    document.addEventListener('click', event => {
        const navLink = event.target.closest('[data-section-target]');
        if (!navLink) {
            return;
        }

        event.preventDefault();
        const target = navLink.dataset.sectionTarget
            || (navLink.getAttribute('href') || '#dashboard').replace('#', '')
            || 'dashboard';
        switchSection(target);
    });

    setupReportsControls();

    const profileOpenBtn = document.getElementById('config-profile-open');
    if (profileOpenBtn) {
        profileOpenBtn.addEventListener('click', () => {
            openProfileSettings();
        });
    }

    const profileBackBtn = document.getElementById('config-profile-back');
    if (profileBackBtn) {
        profileBackBtn.addEventListener('click', () => {
            switchSection('configuracoes');
        });
    }

    const profileCancelBtn = document.getElementById('profile-cancel-btn');
    if (profileCancelBtn) {
        profileCancelBtn.addEventListener('click', () => {
            resetProfileFormToCurrent();
        });
    }

    const profileForm = document.getElementById('profile-settings-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileFormSubmit);
    }

    setupNotifications();

    const profilePhotoUploadBtn = document.getElementById('profile-photo-upload-btn');
    const profilePhotoInput = document.getElementById('profile-photo-input');
    if (profilePhotoUploadBtn && profilePhotoInput) {
        profilePhotoUploadBtn.addEventListener('click', () => {
            profilePhotoInput.click();
        });
    }

    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', handleProfilePhotoSelection);
    }

    const profilePhotoRemoveBtn = document.getElementById('profile-photo-remove-btn');
    if (profilePhotoRemoveBtn) {
        profilePhotoRemoveBtn.addEventListener('click', handleProfilePhotoRemove);
    }

    const editUserPhotoUploadBtn = document.getElementById('edit-user-photo-upload-btn');
    const editUserPhotoInput = document.getElementById('edit-user-photo-input');
    if (editUserPhotoUploadBtn && editUserPhotoInput) {
        editUserPhotoUploadBtn.addEventListener('click', () => {
            editUserPhotoInput.click();
        });
    }

    if (editUserPhotoInput) {
        editUserPhotoInput.addEventListener('change', handleEditUserPhotoSelection);
    }

    const editUserPhotoRemoveBtn = document.getElementById('edit-user-photo-remove-btn');
    if (editUserPhotoRemoveBtn) {
        editUserPhotoRemoveBtn.addEventListener('click', handleEditUserPhotoRemove);
    }
    
    // Conectar form de criar município
    const createForm = document.querySelector('#createModal form');
    if (createForm) {
        createForm.addEventListener('submit', createMunicipioSubmit);
    }

    const couponOpenBtn = document.getElementById('coupon-create-open');
    if (couponOpenBtn) {
        couponOpenBtn.addEventListener('click', () => {
            openCouponModal();
        });
    }

    const couponCloseBtn = document.getElementById('coupon-close-btn');
    if (couponCloseBtn) {
        couponCloseBtn.addEventListener('click', () => {
            closeCouponModal();
        });
    }

    const couponCancelBtn = document.getElementById('coupon-cancel-btn');
    if (couponCancelBtn) {
        couponCancelBtn.addEventListener('click', event => {
            event.preventDefault();
            closeCouponModal();
        });
    }

    const couponForm = document.getElementById('coupon-create-form');
    if (couponForm) {
        couponForm.addEventListener('submit', handleCouponSubmit);
    }

    const couponTypeSelect = document.getElementById('coupon-discount-type');
    if (couponTypeSelect) {
        couponTypeSelect.addEventListener('change', updateCouponDiscountInputs);
    }

    const couponCodeInput = document.getElementById('coupon-code');
    if (couponCodeInput) {
        couponCodeInput.addEventListener('input', event => {
            event.target.value = event.target.value.toUpperCase();
        });
    }

    const editForm = document.getElementById('editMunicipioForm');
    if (editForm) {
        editForm.addEventListener('submit', updateMunicipioSubmit);
    }

    const billingForm = document.getElementById('billing-config-form');
    if (billingForm) {
        billingForm.addEventListener('submit', submitBillingConfig);
    }

    const billingSelect = document.getElementById('billing-municipio-select');
    if (billingSelect) {
        billingSelect.addEventListener('change', handleBillingMunicipioChange);
    }

    const billingRefreshBtn = document.getElementById('billing-refresh');
    if (billingRefreshBtn) {
        billingRefreshBtn.addEventListener('click', event => {
            event.preventDefault();
            refreshBillingData();
        });
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

    const auditEntitySelect = document.getElementById('audit-filter-entity');
    if (auditEntitySelect) {
        auditEntitySelect.addEventListener('change', event => {
            auditFilters.entity = event.target.value;
            loadAuditLogs(true);
        });
    }

    const auditActionSelect = document.getElementById('audit-filter-action');
    if (auditActionSelect) {
        auditActionSelect.addEventListener('change', event => {
            auditFilters.action = event.target.value;
            loadAuditLogs(true);
        });
    }

    const auditPerformedInput = document.getElementById('audit-filter-performed');
    if (auditPerformedInput) {
        auditPerformedInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                auditFilters.performedBy = event.target.value.trim();
                loadAuditLogs(true);
            }
        });
    }

    const auditApplyBtn = document.getElementById('audit-filter-apply');
    if (auditApplyBtn) {
        auditApplyBtn.addEventListener('click', () => {
            const performedInput = document.getElementById('audit-filter-performed');
            auditFilters.performedBy = performedInput ? performedInput.value.trim() : '';
            loadAuditLogs(true);
        });
    }

    const auditClearBtn = document.getElementById('audit-filter-clear');
    if (auditClearBtn) {
        auditClearBtn.addEventListener('click', () => {
            resetAuditFilters();
        });
    }

    const auditLoadMoreBtn = document.getElementById('audit-load-more');
    if (auditLoadMoreBtn) {
        auditLoadMoreBtn.addEventListener('click', () => {
            loadAuditLogs(false);
        });
    }

    const faturamentoDetailsBtn = document.getElementById('open-faturamento-details');
    if (faturamentoDetailsBtn) {
        faturamentoDetailsBtn.addEventListener('click', () => {
            switchSection('faturamento');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    syncMunicipioFilterControls();
    syncUsuarioFilterControls();
    syncConfigThemeToggle();
    refreshHeaderUser();
    updateConfigSummary();

    resetBillingSummary();
    setBillingFormDisabled(true);

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

// ============================================
// GRÁFICOS E EXPORTAÇÃO (Melhorias 1 e 2)
// ============================================

let reportsPlanChart = null;
let reportsCapacityChart = null;

function renderReportsCharts() {
    renderPlanDistributionChart();
    renderCapacityDistributionChart();
}

function disposeCharts() {
    if (reportsPlanChart) {
        reportsPlanChart.dispose();
        reportsPlanChart = null;
    }
    if (reportsCapacityChart) {
        reportsCapacityChart.dispose();
        reportsCapacityChart = null;
    }
}

function renderPlanDistributionChart() {
    const container = document.getElementById('reports-plan-chart');
    if (!container) return;

    // Agregar por plano
    const planCounts = {};
    reportsState.capacity.data.forEach(item => {
        const plan = item?.plan || 'pending';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    const planMap = { 
        premium: 'Premium', 
        profissional: 'Profissional', 
        standard: 'Standard', 
        pending: 'Pendente' 
    };

    const colorMap = {
        premium: '#ff5a2e',       // primária
        profissional: '#fe8222',  // médio
        standard: '#fd931d',      // claro
        pending: '#9ca3af'        // neutro
    };

    const chartData = Object.keys(planCounts).map(key => ({
        name: planMap[key] || key,
        value: planCounts[key],
        itemStyle: {
            color: colorMap[key] || '#94a3b8'
        }
    }));

    if (reportsPlanChart) {
        reportsPlanChart.dispose();
    }

    reportsPlanChart = echarts.init(container);

    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderWidth: 0,
            textStyle: {
                color: '#fff',
                fontSize: 13
            },
            formatter: (params) => {
                const total = chartData.reduce((sum, item) => sum + item.value, 0);
                const percent = ((params.value / total) * 100).toFixed(1);
                return `<strong>${params.name}</strong><br/>${params.value} municípios (${percent}%)`;
            }
        },
        legend: {
            bottom: '5%',
            left: 'center',
            itemGap: 20,
            textStyle: {
                fontSize: 13,
                fontWeight: 500
            }
        },
        series: [{
            type: 'pie',
            radius: ['45%', '75%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            itemStyle: {
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 3
            },
            label: {
                show: true,
                position: 'outside',
                formatter: '{b}\n{d}%',
                fontSize: 12,
                fontWeight: 600
            },
            emphasis: {
                scale: true,
                scaleSize: 15,
                itemStyle: {
                    shadowBlur: 20,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold'
                }
            },
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: (idx) => idx * 100,
            data: chartData
        }]
    };

    reportsPlanChart.setOption(option);

    // Responsividade
    window.addEventListener('resize', () => {
        if (reportsPlanChart) reportsPlanChart.resize();
    });
}

function renderCapacityDistributionChart() {
    const container = document.getElementById('reports-capacity-chart');
    if (!container) return;

    // Agregar por faixa de ocupação
    const ranges = { '0-50%': 0, '50-75%': 0, '75-90%': 0, '90-100%': 0, '100%+': 0 };
    reportsState.capacity.data.forEach(item => {
        const percent = Number(item?.users?.usage_percent);
        if (!Number.isFinite(percent)) return;
        if (percent < 50) ranges['0-50%']++;
        else if (percent < 75) ranges['50-75%']++;
        else if (percent < 90) ranges['75-90%']++;
        else if (percent < 100) ranges['90-100%']++;
        else ranges['100%+']++;
    });

    const labels = Object.keys(ranges);
    const values = Object.values(ranges);
    const total = values.reduce((a, b) => a + b, 0);

    if (reportsCapacityChart) {
        reportsCapacityChart.dispose();
    }

    reportsCapacityChart = echarts.init(container);

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
                shadowStyle: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderWidth: 0,
            textStyle: {
                color: '#fff',
                fontSize: 13
            },
            formatter: (params) => {
                const param = params[0];
                const percent = total > 0 ? ((param.value / total) * 100).toFixed(1) : 0;
                return `<strong>Faixa: ${param.name}</strong><br/>${param.value} municípios (${percent}%)`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '8%',
            top: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: labels,
            axisLine: {
                lineStyle: { color: '#e5e7eb' }
            },
            axisLabel: {
                color: '#6b7280',
                fontSize: 12,
                fontWeight: 500
            }
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#6b7280',
                fontSize: 12
            },
            splitLine: {
                lineStyle: {
                    color: '#f3f4f6',
                    type: 'dashed'
                }
            }
        },
        series: [{
            type: 'bar',
            data: values,
            barWidth: '60%',
            itemStyle: {
                borderRadius: [8, 8, 0, 0],
                color: (params) => {
                    const colors = [
                        new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#fd931d' },
                            { offset: 1, color: '#fe8222' }
                        ]),
                        new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#fe8222' },
                            { offset: 1, color: '#ff5a2e' }
                        ]),
                        new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#ff5a2e' },
                            { offset: 1, color: '#e84d23' }
                        ]),
                        new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#fe8222' },
                            { offset: 1, color: '#b45309' }
                        ]),
                        new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#ff5a2e' },
                            { offset: 1, color: '#7f1d1d' }
                        ])
                    ];
                    return colors[params.dataIndex] || '#94a3b8';
                }
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.3)'
                }
            },
            label: {
                show: true,
                position: 'top',
                color: '#374151',
                fontWeight: 600,
                fontSize: 12
            },
            animationDelay: (idx) => idx * 150,
            animationEasing: 'elasticOut'
        }]
    };

    reportsCapacityChart.setOption(option);

    // Responsividade
    window.addEventListener('resize', () => {
        if (reportsCapacityChart) reportsCapacityChart.resize();
    });
}

function exportExpiringToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório: Licenças com Vencimento Próximo', 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    doc.text(`Período monitorado: ${reportsState.expiring.rangeDays} dias`, 14, 34);

    const tableData = reportsState.expiring.data.map(item => [
        item.municipio_nome || '-',
        item.plan_label || '-',
        item.expires_at ? formatDate(item.expires_at) : '-',
        `${item.days_until_expiry || 0} dias`
    ]);

    doc.autoTable({
        head: [['Município', 'Plano', 'Vencimento', 'Dias restantes']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [19, 127, 236] }
    });

    doc.save(`licencas-vencimento-${Date.now()}.pdf`);
}

function exportExpiringToCSV() {
    const headers = ['Município', 'Plano', 'Vencimento', 'Dias restantes'];
    const rows = reportsState.expiring.data.map(item => [
        item.municipio_nome || '-',
        item.plan_label || '-',
        item.expires_at ? formatDate(item.expires_at) : '-',
        `${item.days_until_expiry || 0}`
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `licencas-vencimento-${Date.now()}.csv`;
    link.click();
}

function exportCapacityToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório: Capacidade dos Municípios', 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    const tableData = getFilteredCapacityData().map(item => [
        item.municipio_nome || '-',
        item.plan_label || '-',
        `${item.users?.current || 0} / ${item.users?.max || 'Ilimitado'}`,
        `${item.users?.usage_percent || 0}%`,
        formatStatusLabel(item.status || 'pending')
    ]);

    doc.autoTable({
        head: [['Município', 'Plano', 'Usuários', 'Ocupação', 'Status']],
        body: tableData,
        startY: 34,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [19, 127, 236] }
    });

    doc.save(`capacidade-municipios-${Date.now()}.pdf`);
}

function exportCapacityToCSV() {
    const headers = ['Município', 'Plano', 'Usuários Atual', 'Usuários Máx', 'Ocupação %', 'Status'];
    const rows = getFilteredCapacityData().map(item => [
        item.municipio_nome || '-',
        item.plan_label || '-',
        `${item.users?.current || 0}`,
        `${item.users?.max || 'Ilimitado'}`,
        `${item.users?.usage_percent || 0}`,
        formatStatusLabel(item.status || 'pending')
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `capacidade-municipios-${Date.now()}.csv`;
    link.click();
}

function getFilteredCapacityData() {
    let filtered = [...reportsState.capacity.data];

    const plan = reportsFilters.plan;
    if (plan && plan !== 'all') {
        filtered = filtered.filter(item => item.plan === plan);
    }

    const status = reportsFilters.status;
    if (status && status !== 'all') {
        filtered = filtered.filter(item => item.status === status);
    }

    const estado = reportsFilters.estado;
    if (estado && estado !== 'all') {
        filtered = filtered.filter(item => item.estado === estado);
    }

    if (reportsFilters.onlyCritical) {
        filtered = filtered.filter(item => {
            const percent = Number(item?.users?.usage_percent);
            return Number.isFinite(percent) && percent >= 90;
        });
    }

    return filtered;
}

function populateEstadoFilter() {
    const select = document.getElementById('reports-capacity-estado');
    if (!select) return;

    const estados = new Set();
    reportsState.capacity.data.forEach(item => {
        if (item.estado) estados.add(item.estado);
    });

    const sorted = Array.from(estados).sort();
    const options = ['<option value="all">Todos os estados</option>'];
    sorted.forEach(estado => {
        options.push(`<option value="${escapeHtml(estado)}">${escapeHtml(estado)}</option>`);
    });

    select.innerHTML = options.join('');
}
