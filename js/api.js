/**
 * Ciclo Integrado - Módulo de API e Autenticação
 * Gerencia todas as chamadas ao backend e autenticação JWT
 */

const API = {
  baseURL: 'https://us-central1-scenic-lane-480423-t5.cloudfunctions.net/cicloIntegradoAPI',
  
  // ============================================
  // AUTENTICAÇÃO
  // ============================================
  
  /**
   * Faz login e salva o token JWT
   */
  async login(email, password, municipio_id = null) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, municipio_id })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer login');
      }
      
      const data = await response.json();
      
      // Salvar token e dados do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Faz logout e limpa dados locais
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
  },
  
  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Obtém os dados do usuário logado
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  /**
   * Verifica se o usuário é Admin Master
   */
  isAdminMaster() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin_master';
  },
  
  // ============================================
  // REQUISIÇÕES AUTENTICADAS
  // ============================================
  
  /**
   * Faz uma requisição autenticada à API
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token && !options.skipAuth) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });
      
      // Se não autorizado, redirecionar para login
      if (response.status === 401) {
        this.logout();
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Erro HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },
  
  // ============================================
  // DASHBOARD
  // ============================================
  
  /**
   * Obtém dados resumidos do dashboard
   */
  async getDashboard() {
    return this.request('/admin/dashboard');
  },
  
  // ============================================
  // MUNICÍPIOS
  // ============================================
  
  /**
   * Lista todos os municípios
   */
  async getMunicipios() {
    return this.request('/admin/municipalities');
  },
  
  /**
   * Obtém detalhes de um município
   */
  async getMunicipio(id) {
    return this.request(`/admin/municipalities/${id}`);
  },
  
  /**
   * Cria um novo município
   */
  async createMunicipio(data) {
    return this.request('/admin/municipalities', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * Atualiza um município
   */
  async updateMunicipio(id, data) {
    return this.request(`/admin/municipalities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * Deleta um município
   */
  async deleteMunicipio(id) {
    return this.request(`/admin/municipalities/${id}`, {
      method: 'DELETE'
    });
  },
  
  // ============================================
  // USUÁRIOS
  // ============================================
  
  /**
   * Lista todos os usuários (com filtros opcionais)
   */
  async getUsuarios(filters = {}) {
    const params = new URLSearchParams(filters);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/admin/users${query}`);
  },
  
  /**
   * Obtém detalhes de um usuário
   */
  async getUsuario(id) {
    return this.request(`/admin/users/${id}`);
  },
  
  /**
   * Cria um novo usuário
   */
  async createUsuario(data) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * Atualiza um usuário
   */
  async updateUsuario(id, data) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * Deleta um usuário
   */
  async deleteUsuario(id) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Obtém estatísticas de usuários
   */
  async getUsuariosStats() {
    return this.request('/admin/users/statistics');
  },
  
  // ============================================
  // RECEITA E RELATÓRIOS
  // ============================================
  
  /**
   * Obtém dados de receita
   */
  async getReceita() {
    return this.request('/admin/revenue');
  },
  
  /**
   * Obtém licenças expirando
   */
  async getLicencasExpirando(dias = 30) {
    return this.request(`/admin/reports/expiring-licenses?dias=${dias}`);
  },
  
  /**
   * Obtém estatísticas dos municípios
   */
  async getMunicipiosStats() {
    return this.request('/admin/reports/municipality-stats');
  },
  
  // ============================================
  // CONTRATOS
  // ============================================
  
  /**
   * Lista contratos (com filtros opcionais)
   */
  async getContratos(filters = {}) {
    const params = new URLSearchParams(filters);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/contracts${query}`);
  },
  
  /**
   * Obtém detalhes de um contrato
   */
  async getContrato(id) {
    return this.request(`/contracts/${id}`);
  },
  
  /**
   * Cria um novo contrato
   */
  async createContrato(data) {
    return this.request('/contracts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * Atualiza um contrato
   */
  async updateContrato(id, data) {
    return this.request(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * Deleta um contrato
   */
  async deleteContrato(id) {
    return this.request(`/contracts/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// HELPERS DE UI
// ============================================

/**
 * Mostra uma mensagem de sucesso
 */
function showSuccess(message) {
  // Implementar com toast/notification library ou alert simples
  alert(`✅ ${message}`);
}

/**
 * Mostra uma mensagem de erro
 */
function showError(message) {
  // Implementar com toast/notification library ou alert simples
  alert(`❌ ${message}`);
}

/**
 * Mostra loading spinner
 */
function showLoading(show = true) {
  const loader = document.getElementById('loading-spinner');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Protege uma página - redireciona para login se não autenticado
 */
function requireAuth() {
  if (!API.isAuthenticated()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

/**
 * Protege uma página - requer Admin Master
 */
function requireAdminMaster() {
  if (!requireAuth()) return false;
  
  if (!API.isAdminMaster()) {
    alert('⛔ Acesso negado. Esta página é apenas para Admin Master.');
    window.location.href = '/pages/dashboard.html';
    return false;
  }
  return true;
}

/**
 * Formata data ISO para exibição
 */
function formatDate(isoDate) {
  if (!isoDate) return '-';
  const date = isoDate && typeof isoDate === 'object' && 'seconds' in isoDate
    ? new Date(isoDate.seconds * 1000)
    : new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata valor monetário
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Calcula dias restantes até uma data
 */
function getDaysUntil(isoDate) {
  if (!isoDate) return null;
  const now = new Date();
  const target = isoDate && typeof isoDate === 'object' && 'seconds' in isoDate
    ? new Date(isoDate.seconds * 1000)
    : new Date(isoDate);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
