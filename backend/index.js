/**
 * Ciclo Integrado - Backend API
 * Google Cloud Functions
 * Runtime: Node.js 20
 */

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// Inicializar Express
const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8888',
    'http://localhost:3000',
    'https://ciclo-integrado.appspot.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCP_PROJECT_ID || 'ciclo-integrado',
  });
}

const db = admin.firestore();
const auth = admin.auth();

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Middleware para autenticação via JWT
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'NO_TOKEN',
        message: 'Token não fornecido'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu-secret-aqui');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token inválido'
      }
    });
  }
};

// ============================================
// ROTAS - HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ciclo-integrado-api',
    version: '1.0.0'
  });
});

// ============================================
// ROTAS - AUTENTICAÇÃO
// ============================================

/**
 * POST /auth/login
 * Login de usuário
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password, municipio_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email e senha são obrigatórios'
        }
      });
    }

    // Buscar usuário no Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        }
      });
    }

    const userData = snapshot.docs[0].data();
    const userId = snapshot.docs[0].id;

    // Validar senha (em produção, use bcrypt)
    if (userData.password !== password) {
      return res.status(401).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Senha incorreta'
        }
      });
    }

    // Gerar JWT
    const token = jwt.sign(
      {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        municipio_id: userData.municipio_id
      },
      process.env.JWT_SECRET || 'seu-secret-aqui',
      { expiresIn: '24h' }
    );

    // Atualizar último acesso
    await usersRef.doc(userId).update({
      last_login: new Date().toISOString()
    });

    res.json({
      token,
      user: {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role
      },
      expires_in: 86400 // 24 horas em segundos
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: {
        code: 'LOGIN_ERROR',
        message: 'Erro ao fazer login'
      }
    });
  }
});

/**
 * POST /auth/signup
 * Registrar novo usuário
 */
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name, municipio_id } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email, senha e nome são obrigatórios'
        }
      });
    }

    // Verificar se usuário já existe
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (!snapshot.empty) {
      return res.status(400).json({
        error: {
          code: 'USER_EXISTS',
          message: 'Usuário com este email já existe'
        }
      });
    }

    // Criar usuário
    const newUser = {
      email,
      password, // Em produção, fazer hash com bcrypt
      name,
      municipio_id: municipio_id || '',
      role: 'user',
      status: 'ativo',
      created_at: new Date().toISOString(),
      last_login: null
    };

    const docRef = await usersRef.add(newUser);

    res.status(201).json({
      id: docRef.id,
      email: newUser.email,
      name: newUser.name,
      message: 'Usuário criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      error: {
        code: 'SIGNUP_ERROR',
        message: 'Erro ao criar usuário'
      }
    });
  }
});

// ============================================
// ROTAS - CONTRATOS
// ============================================

/**
 * GET /contratos
 * Listar contratos (com paginação e filtros)
 */
app.get('/contratos', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, municipio_id } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = db.collection('contratos');

    // Aplicar filtros
    if (status) {
      query = query.where('status', '==', status);
    }

    if (municipio_id) {
      query = query.where('municipio_id', '==', municipio_id);
    }

    // Contar total
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    // Buscar página
    const snapshot = await query
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limitNum)
      .get();

    const contratos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      data: contratos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    res.status(500).json({
      error: {
        code: 'LIST_ERROR',
        message: 'Erro ao listar contratos'
      }
    });
  }
});

/**
 * POST /contratos
 * Criar novo contrato
 */
app.post('/contratos', authenticateToken, async (req, res) => {
  try {
    const { numero, fornecedor_id, valor, data_inicio, data_vencimento, secretaria_id, descricao } = req.body;

    if (!numero || !valor) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Número e valor são obrigatórios'
        }
      });
    }

    const newContrato = {
      numero,
      fornecedor_id: fornecedor_id || '',
      valor: parseFloat(valor),
      data_inicio: data_inicio || new Date().toISOString(),
      data_vencimento,
      secretaria_id: secretaria_id || '',
      descricao: descricao || '',
      status: 'rascunho',
      municipio_id: req.user.municipio_id,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await db.collection('contratos').add(newContrato);

    res.status(201).json({
      id: docRef.id,
      ...newContrato,
      message: 'Contrato criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    res.status(500).json({
      error: {
        code: 'CREATE_ERROR',
        message: 'Erro ao criar contrato'
      }
    });
  }
});

/**
 * GET /contratos/:id
 * Obter contrato específico
 */
app.get('/contratos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('contratos').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Contrato não encontrado'
        }
      });
    }

    res.json({
      id: doc.id,
      ...doc.data()
    });

  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    res.status(500).json({
      error: {
        code: 'GET_ERROR',
        message: 'Erro ao buscar contrato'
      }
    });
  }
});

/**
 * PUT /contratos/:id
 * Atualizar contrato
 */
app.put('/contratos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Adicionar timestamp de atualização
    updateData.updated_at = new Date().toISOString();

    await db.collection('contratos').doc(id).update(updateData);

    res.json({
      id,
      message: 'Contrato atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Erro ao atualizar contrato'
      }
    });
  }
});

/**
 * DELETE /contratos/:id
 * Deletar contrato
 */
app.delete('/contratos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('contratos').doc(id).delete();

    res.status(204).send();

  } catch (error) {
    console.error('Erro ao deletar contrato:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Erro ao deletar contrato'
      }
    });
  }
});

// ============================================
// ROTAS - USUÁRIOS
// ============================================

/**
 * GET /usuarios
 * Listar usuários (apenas admin)
 */
app.get('/usuarios', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Sem permissão'
        }
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const snapshot = await db.collection('users')
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limitNum)
      .get();

    const usuarios = snapshot.docs.map(doc => {
      const data = doc.data();
      // Não retornar senha
      delete data.password;
      return {
        id: doc.id,
        ...data
      };
    });

    res.json({
      data: usuarios
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: {
        code: 'LIST_ERROR',
        message: 'Erro ao listar usuários'
      }
    });
  }
});

// ============================================
// ROTAS - STATUS
// ============================================

/**
 * GET /status
 * Status da API
 */
app.get('/status', async (req, res) => {
  try {
    const status = {
      api: 'ok',
      firebase: 'ok',
      timestamp: new Date().toISOString()
    };

    res.json(status);

  } catch (error) {
    res.status(500).json({
      api: 'error',
      message: error.message
    });
  }
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

/**
 * 404 - Não encontrado
 */
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Rota ${req.method} ${req.path} não encontrada`
    }
  });
});

/**
 * Erro global
 */
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    }
  });
});

// ============================================
// MIDDLEWARE - Admin Master Check
// ============================================

/**
 * Middleware para verificar se é Admin Master (Proprietário)
 */
const isAdminMaster = async (req, res, next) => {
  if (req.user.role !== 'admin_master') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Acesso negado. Apenas proprietário do sistema.'
      }
    });
  }
  next();
};

// ============================================
// ROTAS - ADMIN MASTER (PROPRIETÁRIO)
// ============================================

/**
 * GET /admin/municipalities
 * Listar todos os municípios (apenas proprietário)
 */
app.get('/admin/municipalities', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const municipiosRef = db.collection('municipalities');
    const snapshot = await municipiosRef.get();

    const municipalities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      total: municipalities.length,
      municipalities
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Erro ao buscar municípios'
      }
    });
  }
});

/**
 * POST /admin/municipalities
 * Criar novo município (apenas proprietário)
 */
app.post('/admin/municipalities', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const {
      municipio_id,
      municipio_nome,
      estado,
      cep,
      admin_email,
      admin_name,
      license_type,
      license_expires,
      max_users,
      max_contracts
    } = req.body;

    if (!municipio_id || !municipio_nome || !admin_email) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Campos obrigatórios: municipio_id, municipio_nome, admin_email'
        }
      });
    }

    // Criar documento do município
    const municipio = {
      municipio_id,
      municipio_nome,
      estado: estado || '',
      cep: cep || '',
      license_type: license_type || 'standard',
      license_expires: license_expires || new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      max_users: max_users || 20,
      max_contracts: max_contracts || 500,
      status: 'active',
      created_at: new Date().toISOString(),
      created_by: req.user.email
    };

    await db.collection('municipalities').doc(municipio_id).set(municipio);

    // Criar admin do município
    const adminUser = {
      email: admin_email,
      password: 'Mudar123!', // IMPORTANTE: Admin deve mudar na primeira vez
      name: admin_name || 'Admin',
      role: 'admin',
      municipio_id,
      municipio_nome,
      status: 'active',
      created_at: new Date().toISOString(),
      created_by: req.user.email,
      last_login: null
    };

    await db.collection('users').add(adminUser);

    res.status(201).json({
      message: 'Município criado com sucesso',
      municipio: municipio,
      admin_email: admin_email,
      temporary_password: 'Mudar123!',
      warning: 'Admin deve mudar a senha na primeira vez que fazer login'
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'CREATION_ERROR',
        message: 'Erro ao criar município'
      }
    });
  }
});

/**
 * GET /admin/municipalities/:municipio_id
 * Obter detalhes de um município (apenas proprietário)
 */
app.get('/admin/municipalities/:municipio_id', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const { municipio_id } = req.params;
    const doc = await db.collection('municipalities').doc(municipio_id).get();

    if (!doc.exists) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Município não encontrado'
        }
      });
    }

    // Obter estatísticas do município
    const usersSnapshot = await db.collection('users')
      .where('municipio_id', '==', municipio_id)
      .get();

    const contratosSnapshot = await db.collection('contratos')
      .where('municipio_id', '==', municipio_id)
      .get();

    res.json({
      municipio: {
        id: doc.id,
        ...doc.data()
      },
      statistics: {
        users: usersSnapshot.size,
        contracts: contratosSnapshot.size,
        usage_percent: Math.round((usersSnapshot.size / doc.data().max_users) * 100)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Erro ao buscar município'
      }
    });
  }
});

/**
 * PUT /admin/municipalities/:municipio_id
 * Atualizar município (apenas proprietário)
 */
app.put('/admin/municipalities/:municipio_id', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const { municipio_id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
      updated_by: req.user.email
    };

    await db.collection('municipalities').doc(municipio_id).update(updateData);

    res.json({
      message: 'Município atualizado com sucesso',
      municipio_id: municipio_id
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Erro ao atualizar município'
      }
    });
  }
});

/**
 * GET /admin/dashboard
 * Dashboard completo para proprietário
 */
app.get('/admin/dashboard', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    // Total de municípios
    const municipiosSnapshot = await db.collection('municipalities').get();
    const totalMunicipios = municipiosSnapshot.size;

    // Total de usuários
    const usersSnapshot = await db.collection('users').get();
    const totalUsuarios = usersSnapshot.size;

    // Total de contratos
    const contratosSnapshot = await db.collection('contratos').get();
    const totalContratos = contratosSnapshot.size;

    // Municípios ativos
    const municipiosAtivos = municipiosSnapshot.docs.filter(doc => doc.data().status === 'active').length;

    // Licenças vencendo em 30 dias
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const licencasVencendo = municipiosSnapshot.docs.filter(doc => {
      const expireDate = new Date(doc.data().license_expires);
      return expireDate <= in30Days && expireDate > now;
    }).length;

    res.json({
      dashboard: {
        summary: {
          total_municipalities: totalMunicipios,
          active_municipalities: municipiosAtivos,
          total_users: totalUsuarios,
          total_contracts: totalContratos,
          licenses_expiring_soon: licencasVencendo
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DASHBOARD_ERROR',
        message: 'Erro ao carregar dashboard'
      }
    });
  }
});

/**
 * POST /admin/reset-password/:user_id
 * Resetar senha de um usuário (apenas proprietário)
 */
app.post('/admin/reset-password/:user_id', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Nova senha é obrigatória'
        }
      });
    }

    await db.collection('users').doc(user_id).update({
      password: new_password,
      password_reset_at: new Date().toISOString(),
      password_reset_by: req.user.email
    });

    res.json({
      message: 'Senha resetada com sucesso',
      user_id: user_id
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Erro ao resetar senha'
      }
    });
  }
});

// ============================================
// EXPORTAR
// ============================================

module.exports = app;
