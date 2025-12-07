/**
 * Ciclo Integrado - Configuração da API
 * 
 * Para desenvolvimento local: use http://localhost:8080
 * Para produção: use a URL do Google Cloud Functions
 */

const API_CONFIG = {
  // URL base da API (PRODUÇÃO - Google Cloud Functions)
  BASE_URL: 'https://us-central1-scenic-lane-480423-t5.cloudfunctions.net/cicloIntegradoAPI',
  
  // Para voltar ao desenvolvimento local, descomente a linha abaixo:
  // BASE_URL: 'http://localhost:8080',
  
  // Timeout padrão para requisições (ms)
  TIMEOUT: 30000,
  
  // Headers padrão
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Helper para fazer requisições à API
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: API_CONFIG.HEADERS,
    ...options
  };
  
  // Adicionar token JWT se existir
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Exportar para uso global
window.API_CONFIG = API_CONFIG;
window.apiRequest = apiRequest;
