/**
 * Ciclo Integrado - Módulo de API e Autenticação
 * Gerencia todas as chamadas ao backend e autenticação JWT
 */

const API = {
  // Updated to point to the latest deployed Cloud Function (cicloIntegradoAPI)
  baseURL: 'https://us-central1-scenic-lane-480423-t5.cloudfunctions.net/cicloIntegradoAPI',
  
  // ============================================
  // AUTENTICAÇÃO
  // ============================================
  
  /**
   * Faz login e salva o token JWT
   */
  async login(email, password, municipio_id = null) {
    try {
      console.log('Iniciando login para:', email);
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, municipio_id })
      });
      
      console.log('Resposta recebida com status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Erro ao fazer login';
        try {
          const errorData = await response.json();
          console.log('Dados de erro do servidor:', errorData);
          
          // Extrair mensagem de forma mais robusta
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.message) {
            errorMessage = typeof errorData.message === 'string' 
              ? errorData.message 
              : JSON.stringify(errorData.message);
          } else if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' 
              ? errorData.error 
              : JSON.stringify(errorData.error);
          } else {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          console.log('Erro ao parsear resposta de erro:', parseError);
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Dados de sucesso recebidos:', { token: data.token ? 'presente' : 'ausente', user: data.user ? 'presente' : 'ausente' });
      
      // Verificar se a resposta tem a estrutura esperada
      if (!data.token || !data.user) {
        throw new Error('Resposta do servidor inválida: token ou usuário não encontrado');
      }
      
      console.log('Login bem-sucedido para usuário:', data.user.email, 'com role:', data.user.role);
      
      // Salvar token e dados do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Login error completo:', error);
      throw error;
    }
  },

  /**
   * Lista municípios disponíveis para seleção no login
   */
  async getPublicMunicipios(params = {}) {
    const query = new URLSearchParams();
    if (params.estado) {
      query.set('estado', params.estado);
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/auth/municipalities${suffix}`, { skipAuth: true });
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
   * Atualiza a cópia local do usuário autenticado
   */
  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem('user');
      return;
    }
    localStorage.setItem('user', JSON.stringify(user));
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
    
    const method = (options.method || 'GET').toUpperCase();
    const headers = {
      ...options.headers
    };

    if (!headers['Content-Type'] && method !== 'GET' && method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
    }
    
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
        const detailedMessage = error.message
          || error.error?.message
          || error.error?.detail
          || error.error?.description
          || error.errorMessage
          || error.detail
          || error.description
          || `Erro HTTP: ${response.status}`;
        const normalizedError = detailedMessage.toString();
        throw new Error(normalizedError);
      }
      
      const rawText = await response.text();

      if (!rawText) {
        return null;
      }

      try {
        return JSON.parse(rawText);
      } catch (parseError) {
        return rawText;
      }
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
    const response = await this.request('/admin/municipalities');
    if (Array.isArray(response)) {
      return {
        municipalities: response,
        total: response.length
      };
    }
    if (response && typeof response === 'object') {
      if (Array.isArray(response.municipalities)) {
        return response;
      }
      if (Array.isArray(response.municipios)) {
        return {
          municipalities: response.municipios,
          total: typeof response.total === 'number' ? response.total : response.municipios.length
        };
      }
      if (Array.isArray(response.data)) {
        return {
          municipalities: response.data,
          total: typeof response.total === 'number' ? response.total : response.data.length
        };
      }
    }
    return {
      municipalities: [],
      total: 0
    };
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
   * Faz upload da foto de perfil do usuário logado
   */
  async uploadUserPhoto(id, imageBase64) {
    return this.request(`/admin/users/${id}/photo`, {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 })
    });
  },

  /**
   * Remove a foto de perfil do usuário logado
   */
  async deleteUserPhoto(id) {
    return this.request(`/admin/users/${id}/photo`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Obtém estatísticas de usuários
   */
  async getUsuariosStats() {
    return this.request('/admin/users/statistics');
  },

  /**
   * Obtém logs de auditoria
   */
  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.set(key, value);
      }
    });

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/admin/audit-logs${suffix}`);
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

  // ============================================
  // CUPONS
  // ============================================

  /**
   * Lista cupons de desconto cadastrados
   */
  async getCupons(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      if (typeof value === 'string' && (value.trim() === '' || value === 'all')) {
        return;
      }
      params.set(key, value);
    });

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/admin/coupons${suffix}`);
  },

  /**
   * Cria um novo cupom de desconto
   */
  async createCupom(data) {
    return this.request('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
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
