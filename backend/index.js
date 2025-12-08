/**
 * Ciclo Integrado - Backend API
 * Google Cloud Functions
 * Runtime: Node.js 20
 */

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('firebase-admin/storage');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Inicializar Express
const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8888',
    'http://localhost:3000',
    'https://ciclo-integrado.firebaseapp.com',
    'https://ciclo-integrado.web.app',
    'https://ciclo-integrado.appspot.com',
    'https://ciclointegrado.online'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Inicializar Firebase Admin SDK
// Resolve the Firebase project ID across Cloud Functions and local environments.
const resolveProjectId = () => {
  if (process.env.GCP_PROJECT_ID) return process.env.GCP_PROJECT_ID;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GCP_PROJECT) return process.env.GCP_PROJECT;
  if (process.env.FIREBASE_CONFIG) {
    try {
      const parsedConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      if (parsedConfig && parsedConfig.projectId) {
        return parsedConfig.projectId;
      }
    } catch (configError) {
      console.error('Erro ao analisar FIREBASE_CONFIG:', configError);
    }
  }
  return 'scenic-lane-480423-t5';
};

const projectId = resolveProjectId();
const defaultBucketName = process.env.STORAGE_BUCKET
  || process.env.FIREBASE_STORAGE_BUCKET
  || `${projectId}.appspot.com`;

if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
    storageBucket: defaultBucketName,
  });
}

const db = admin.firestore();
db.settings({
  ignoreUndefinedProperties: true,
  databaseId: '(default)'
});
const auth = admin.auth();
const storage = admin.storage();
// Ensure uploads target the expected default bucket when running on Cloud Functions.
const bucket = storage.bucket(admin.app().options.storageBucket || defaultBucketName);

// ============================================
// AUDITORIA
// ============================================

const AUDIT_COLLECTION = 'audit_logs';
const AUDIT_SENSITIVE_FIELDS = ['password', 'senha', 'token', 'access_token', 'refresh_token', 'secret'];

function sanitizeAuditValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeAuditValue(item));
  }

  if (typeof value === 'object') {
    const result = {};
    Object.keys(value).forEach(key => {
      if (AUDIT_SENSITIVE_FIELDS.includes(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = sanitizeAuditValue(value[key]);
      }
    });
    return result;
  }

  return value;
}

async function logAuditEvent({ entityType, entityId, action, performedBy, performedById, performedByRole, before, after, metadata }) {
  try {
    const entry = {
      entity_type: entityType,
      entity_id: entityId || null,
      action,
      performed_by: performedBy || null,
      performed_by_id: performedById || null,
      performed_by_role: performedByRole || null,
      before: before ? sanitizeAuditValue(before) : null,
      after: after ? sanitizeAuditValue(after) : null,
      metadata: metadata ? sanitizeAuditValue(metadata) : null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection(AUDIT_COLLECTION).add(entry);
  } catch (auditError) {
    console.error('Audit log error:', auditError);
  }
}

// ============================================
// PERFIL E ARMAZENAMENTO
// ============================================

function parseImageDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return null;
  }

  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error('UNSUPPORTED_IMAGE_TYPE');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const sizeInMb = buffer.length / (1024 * 1024);
  if (Number.isNaN(sizeInMb) || sizeInMb <= 0) {
    return null;
  }

  if (sizeInMb > 4) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  let extension = 'png';
  if (mimeType === 'image/jpeg') extension = 'jpg';
  if (mimeType === 'image/webp') extension = 'webp';
  if (mimeType === 'image/png') extension = 'png';

  return {
    mimeType,
    buffer,
    extension
  };
}

async function deleteStorageFileByUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') {
    return;
  }

  try {
    const publicPrefix = `https://storage.googleapis.com/${bucket.name}/`;
    if (fileUrl.startsWith(publicPrefix)) {
      const filePath = fileUrl.substring(publicPrefix.length);
      if (filePath) {
        await bucket.file(filePath).delete({ ignoreNotFound: true });
      }
    }
  } catch (deleteError) {
    console.error('Erro ao remover arquivo antigo do Storage:', deleteError);
  }
}

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

// Teste de acesso ao Firestore
app.get('/test-firestore', async (req, res) => {
  try {
    console.log('Testando acesso ao Firestore...');
    const usersRef = db.collection('users');
    console.log('Collection ref criada');
    
    const snapshot = await usersRef.limit(5).get();
    console.log('Snapshot obtido, size:', snapshot.size);
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({
      success: true,
      message: 'Firestore acessível',
      totalUsers: snapshot.size,
      users: users.map(u => ({ id: u.id, email: u.email, role: u.role }))
    });
  } catch (error) {
    console.error('Erro ao testar Firestore:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// ============================================
// ROTAS - AUTENTICAÇÃO
// ============================================

/**
 * GET /auth/municipalities
 * Lista municípios disponíveis para seleção no login
 */
app.get('/auth/municipalities', async (req, res) => {
  try {
    const snapshot = await db.collection('municipalities').get();

    const municipalities = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        municipio_id: doc.id,
        nome: data.nome || data.municipio_nome || data.cidade || doc.id,
        estado: (data.estado || '').toUpperCase(),
        license_type: data.license_type || data.plano || 'standard',
        status: data.status || 'ativo'
      };
    }).sort((a, b) => {
      const stateCompare = a.estado.localeCompare(b.estado, 'pt-BR');
      if (stateCompare !== 0) return stateCompare;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });

    const states = Array.from(new Set(
      municipalities
        .map(item => item.estado)
        .filter(estado => !!estado)
    )).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    res.json({
      municipalities,
      states
    });
  } catch (error) {
    console.error('Erro ao listar municípios públicos:', error);
    res.status(500).json({
      error: {
        code: 'PUBLIC_MUNICIPALITIES_ERROR',
        message: 'Erro ao carregar municípios disponíveis'
      }
    });
  }
});

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
    console.log('Buscando usuário com email:', email);
    const usersRef = db.collection('users');
    console.log('Users ref criada');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    console.log('Snapshot retornado, empty:', snapshot.empty, 'size:', snapshot.size);

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

    // Validar senha usando bcrypt
    console.log('Comparando senhas...');
    console.log('Password fornecida:', password);
    console.log('Password hash:', userData.password);
    const passwordMatch = await bcrypt.compare(password, userData.password);
    console.log('Password match result:', passwordMatch);
    
    if (!passwordMatch) {
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
        municipio_id: userData.municipio_id,
        photo_url: userData.photo_url || null
      },
      process.env.JWT_SECRET || 'seu-secret-aqui',
      { expiresIn: '24h' }
    );

    // Atualizar último acesso
    await usersRef.doc(userId).update({
      last_login: new Date().toISOString()
    });

    console.log('Login bem-sucedido para:', userData.email);
    res.json({
      success: true,
      token,
      user: {
        id: userId,
        name: userData.nome || userData.name,
        email: userData.email,
        role: userData.role,
        photo_url: userData.photo_url || null
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
    const [municipiosSnapshot, usersSnapshot] = await Promise.all([
      db.collection('municipalities').get(),
      db.collection('users').get()
    ]);

    const usuariosPorMunicipio = {};
    const usuariosAtivosPorMunicipio = {};

    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const municipioId = data.municipio_id;

      if (!municipioId) {
        return;
      }

      usuariosPorMunicipio[municipioId] = (usuariosPorMunicipio[municipioId] || 0) + 1;

      const status = (data.status || 'active').toString().toLowerCase();
      if (status === 'active' || status === 'ativo') {
        usuariosAtivosPorMunicipio[municipioId] = (usuariosAtivosPorMunicipio[municipioId] || 0) + 1;
      }
    });

    const municipalities = municipiosSnapshot.docs.map(doc => {
      const data = doc.data();
      const municipioId = doc.id;
      const totalUsuarios = usuariosPorMunicipio[municipioId]
        || data.usuarios_atuais
        || data.current_users
        || 0;
      const usuariosAtivos = usuariosAtivosPorMunicipio[municipioId]
        || data.usuarios_ativos
        || data.active_users
        || 0;

      return {
        id: municipioId,
        ...data,
        usuarios_atuais: totalUsuarios,
        usuarios_ativos: usuariosAtivos,
        current_users: totalUsuarios,
        active_users: usuariosAtivos
      };
    });

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
      nome,
      cidade,
      estado,
      cep,
      plano,
      license_type,
      license_expires,
      data_vencimento_licenca,
      max_users,
      max_usuarios,
      max_contracts,
      status,
      admin_email,
      admin_name,
      contato_nome,
      contato_email,
      contato_telefone,
      observacoes,
      documentos
    } = req.body;

    const id = municipio_id || (nome || cidade || '').toLowerCase();
    const nomeMunicipio = municipio_nome || nome || cidade;

    if (!id || !nomeMunicipio) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Campos obrigatórios: municipio_id ou nome do município'
        }
      });
    }

    const licenseType = (license_type || plano || 'standard').toLowerCase();
    const licenseExpires = license_expires || data_vencimento_licenca
      ? new Date(data_vencimento_licenca || license_expires).toISOString()
      : new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const municipio = {
      municipio_id: id,
      municipio_nome: nomeMunicipio,
      estado: estado || '',
      cep: cep || '',
      license_type: licenseType,
      license_expires: licenseExpires,
      max_users: max_users || max_usuarios || 20,
      max_contracts: max_contracts || 500,
      status: status || 'active',
      created_at: new Date().toISOString(),
      created_by: req.user.email,
      updated_at: new Date().toISOString(),
      updated_by: req.user.email,
      contato_nome: contato_nome || '',
      contato_email: contato_email || '',
      contato_telefone: contato_telefone || '',
      observacoes: observacoes || '',
      documentos: Array.isArray(documentos) ? documentos : (documentos ? [documentos].flat() : [])
    };

    await db.collection('municipalities').doc(id).set(municipio);

    // Criar usuário admin somente se informações estiverem presentes
    if (admin_email) {
      const adminUser = {
        email: admin_email,
        password: 'Mudar123!',
        name: admin_name || 'Admin Municipal',
        role: 'admin',
        municipio_id: id,
        municipio_nome: nomeMunicipio,
        status: 'active',
        created_at: new Date().toISOString(),
        created_by: req.user.email,
        last_login: null,
        photo_url: ''
      };

      const adminUserRef = await db.collection('users').add(adminUser);

      await logAuditEvent({
        entityType: 'user',
        entityId: adminUserRef.id,
        action: 'create',
        performedBy: req.user.email,
        performedById: req.user.id,
        performedByRole: req.user.role,
        after: adminUser,
        metadata: {
          auto_generated: true,
          municipio_id: id
        }
      });
    }

    await logAuditEvent({
      entityType: 'municipality',
      entityId: id,
      action: 'create',
      performedBy: req.user.email,
      performedById: req.user.id,
      performedByRole: req.user.role,
      after: municipio,
      metadata: {
        created_via: 'admin_panel',
        auto_admin_created: Boolean(admin_email)
      }
    });

    res.status(201).json({
      message: 'Município criado com sucesso',
      municipio
    });
  } catch (error) {
    console.error('Erro ao criar município:', error);
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
    const docRef = db.collection('municipalities').doc(municipio_id);
    const beforeSnapshot = await docRef.get();
    const beforeData = beforeSnapshot.exists ? beforeSnapshot.data() : null;

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
      updated_by: req.user.email
    };

    if (updateData.documentos && !Array.isArray(updateData.documentos)) {
      updateData.documentos = [updateData.documentos];
    }

    await docRef.update(updateData);

    const afterSnapshot = await docRef.get();
    const afterData = afterSnapshot.exists ? afterSnapshot.data() : null;

    await logAuditEvent({
      entityType: 'municipality',
      entityId: municipio_id,
      action: 'update',
      performedBy: req.user.email,
      performedById: req.user.id,
      performedByRole: req.user.role,
      before: beforeData,
      after: afterData,
      metadata: {
        updated_fields: Object.keys(req.body || {})
      }
    });

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
 * DELETE /admin/municipalities/:municipio_id
 * Deletar município (apenas proprietário)
 */
app.delete('/admin/municipalities/:municipio_id', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const { municipio_id } = req.params;

    // Verificar se existem usuários associados
    const usersSnapshot = await db.collection('users')
      .where('municipio_id', '==', municipio_id)
      .get();

    if (!usersSnapshot.empty) {
      return res.status(400).json({
        error: {
          code: 'HAS_USERS',
          message: 'Não é possível deletar um município que possui usuários. Primeiro delete os usuários.'
        }
      });
    }

    const docRef = db.collection('municipalities').doc(municipio_id);
    const municipioSnapshot = await docRef.get();
    const municipioData = municipioSnapshot.exists ? municipioSnapshot.data() : null;

    await docRef.delete();

    await logAuditEvent({
      entityType: 'municipality',
      entityId: municipio_id,
      action: 'delete',
      performedBy: req.user.email,
      performedById: req.user.id,
      performedByRole: req.user.role,
      before: municipioData,
      after: null
    });

    res.status(200).json({
      success: true,
      message: 'Município deletado com sucesso',
      municipio_id
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Erro ao deletar município'
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
    const [municipiosSnapshot, usersSnapshot, contratosSnapshot] = await Promise.all([
      db.collection('municipalities').get(),
      db.collection('users').get(),
      db.collection('contratos').get()
    ]);

    const planPrices = {
      standard: 500,
      profissional: 1250,
      premium: 2500
    };

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const municipiosDetalhes = [];
    const planosResumo = {
      standard: { quantidade: 0, ativos: 0, receitaMensal: 0 },
      profissional: { quantidade: 0, ativos: 0, receitaMensal: 0 },
      premium: { quantidade: 0, ativos: 0, receitaMensal: 0 }
    };
    const municipiosPorEstado = {};

    let municipiosAtivos = 0;
    let licencasExpirandoEm30Dias = 0;
    let receitaMensal = 0;

    municipiosSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const municipioId = doc.id;
      const nome = data.nome || data.municipio_nome || data.cidade || municipioId;
      const estado = (data.estado || '').toUpperCase();
      const plano = (data.license_type || data.plano || 'standard').toLowerCase();
      const status = (data.status || 'ativo').toString().toLowerCase();
      const isActive = status === 'ativo' || status === 'active';
      const price = planPrices[plano] || 0;
      const createdAt = data.created_at ? new Date(data.created_at) : null;
      const licenseExpires = data.license_expires || data.data_vencimento_licenca || null;
      const licenseExpiresDate = licenseExpires ? new Date(licenseExpires) : null;

      if (estado) {
        municipiosPorEstado[estado] = (municipiosPorEstado[estado] || 0) + 1;
      }

      if (planosResumo[plano]) {
        planosResumo[plano].quantidade += 1;
        if (isActive) {
          planosResumo[plano].ativos += 1;
          planosResumo[plano].receitaMensal += price;
        }
      }

      if (isActive) {
        municipiosAtivos += 1;
        receitaMensal += price;
      }

      let diasParaVencer = null;
      if (licenseExpiresDate && !Number.isNaN(licenseExpiresDate.getTime())) {
        const diff = Math.ceil((licenseExpiresDate - now) / (1000 * 60 * 60 * 24));
        diasParaVencer = diff;
        if (diff > 0 && diff <= 30) {
          licencasExpirandoEm30Dias += 1;
        }
      }

      municipiosDetalhes.push({
        municipio_id: municipioId,
        nome,
        estado,
        plano,
        status: isActive ? 'ativo' : 'inativo',
        receita_mensal: isActive ? price : 0,
        license_expires: licenseExpiresDate ? licenseExpiresDate.toISOString() : null,
        dias_para_vencer: diasParaVencer,
        created_at: createdAt ? createdAt.toISOString() : null
      });
    });

    const totalMunicipios = municipiosSnapshot.size;
    const totalUsuarios = usersSnapshot.size;
    const totalContratos = contratosSnapshot.size;

    let usuariosAtivos = 0;
    const usuariosPorPerfil = {};
    const usuariosPorStatus = { ativo: 0, inativo: 0 };

    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = (data.status || 'ativo').toString().toLowerCase();
      const role = (data.role || 'desconhecido').toString().toLowerCase();

      usuariosPorPerfil[role] = (usuariosPorPerfil[role] || 0) + 1;

      if (status === 'ativo' || status === 'active') {
        usuariosAtivos += 1;
        usuariosPorStatus.ativo += 1;
      } else {
        usuariosPorStatus.inativo += 1;
      }
    });

    let contratosAtivos = 0;
    let contratosValorTotal = 0;

    contratosSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = (data.status || 'rascunho').toString().toLowerCase();
      const valor = parseFloat(data.valor || data.valor_total || 0) || 0;

      contratosValorTotal += valor;
      if (status === 'ativo' || status === 'active' || status === 'vigente') {
        contratosAtivos += 1;
      }
    });

    const topMunicipiosPorReceita = [...municipiosDetalhes]
      .filter(item => item.receita_mensal > 0)
      .sort((a, b) => b.receita_mensal - a.receita_mensal)
      .slice(0, 5);

    const licencasVencendoLista = municipiosDetalhes
      .filter(item => typeof item.dias_para_vencer === 'number' && item.dias_para_vencer > 0 && item.dias_para_vencer <= 30)
      .sort((a, b) => a.dias_para_vencer - b.dias_para_vencer)
      .slice(0, 10);

    const municipiosRecentes = [...municipiosDetalhes]
      .filter(item => item.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    const planosDetalhados = Object.keys(planosResumo).reduce((acc, plano) => {
      const resumo = planosResumo[plano];
      acc[plano] = {
        quantidade: resumo.quantidade,
        ativos: resumo.ativos,
        receita_mensal: Number(resumo.receitaMensal.toFixed(2)),
        receita_anual: Number((resumo.receitaMensal * 12).toFixed(2))
      };
      return acc;
    }, {});

    res.json({
      total_municipios: totalMunicipios,
      municipios_ativos: municipiosAtivos,
      total_usuarios: totalUsuarios,
      usuarios_ativos: usuariosAtivos,
      contratos_totais: totalContratos,
      contratos_ativos: contratosAtivos,
      contratos_valor_total: Number(contratosValorTotal.toFixed(2)),
      receita_mensal: Number(receitaMensal.toFixed(2)),
      receita_anual: Number((receitaMensal * 12).toFixed(2)),
      licencas_vencendo_30_dias: licencasExpirandoEm30Dias,
      planos: planosDetalhados,
      municipios_por_estado: municipiosPorEstado,
      usuarios_por_perfil: usuariosPorPerfil,
      usuarios_por_status: usuariosPorStatus,
      top_municipios_por_receita: topMunicipiosPorReceita,
      licencas_vencendo: licencasVencendoLista,
      municipios_recentes: municipiosRecentes,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
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

    const docRef = db.collection('users').doc(user_id);
    const beforeSnapshot = await docRef.get();
    const beforeData = beforeSnapshot.exists ? beforeSnapshot.data() : null;

    await docRef.update({
      password: new_password,
      password_reset_at: new Date().toISOString(),
      password_reset_by: req.user.email
    });

    const afterSnapshot = await docRef.get();
    const afterData = afterSnapshot.exists ? afterSnapshot.data() : null;

    await logAuditEvent({
      entityType: 'user',
      entityId: user_id,
      action: 'reset_password',
      performedBy: req.user.email,
      performedById: req.user.id,
      performedByRole: req.user.role,
      before: beforeData,
      after: afterData,
      metadata: {
        reset_password: true
      }
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
// ROTAS - GERENCIAMENTO DE USUÁRIOS (ADMIN MASTER)
// ============================================

/**
 * GET /admin/users
 * Listar todos os usuários com filtros (apenas proprietário)
 */
app.get('/admin/users', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const { role, municipio_id, status } = req.query;
    let query = db.collection('users');

    if (role) {
      query = query.where('role', '==', role);
    }
    if (municipio_id) {
      query = query.where('municipio_id', '==', municipio_id);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('created_at', 'desc').get();

    const usuarios = snapshot.docs.map(doc => {
      const data = doc.data();
      delete data.password;
      return {
        id: doc.id,
        ...data
      };
    });

    res.json({
      total: usuarios.length,
      usuarios: usuarios
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'LIST_ERROR',
        message: 'Erro ao listar usuários'
      }
    });
  }
});

/**
 * POST /admin/users
 * Criar novo usuário com role específico (apenas proprietário)
 */
app.post('/admin/users', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role,
      municipio_id,
      municipio_nome,
      phone,
      cpf,
      photo_url
    } = req.body;

    // Validações
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Campos obrigatórios: email, password, name, role'
        }
      });
    }

    // Validar role
    const validRoles = ['admin_master', 'admin_municipio', 'gestor_contrato', 'fiscal_contrato'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ROLE',
          message: `Role inválida. Roles válidos: ${validRoles.join(', ')}`
        }
      });
    }

    // Se não é admin_master, municipio_id é obrigatório
    if (role !== 'admin_master' && !municipio_id) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'municipio_id é obrigatório para usuários não-master'
        }
      });
    }

    // Verificar se email já existe
    const existingUser = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email já cadastrado no sistema'
        }
      });
    }

    const novoUsuario = {
      email,
      password,
      name,
      role,
      municipio_id: role === 'admin_master' ? null : municipio_id,
      municipio_nome: role === 'admin_master' ? null : municipio_nome,
      phone: phone || '',
      cpf: cpf || '',
      photo_url: photo_url ? photo_url.trim() : '',
      status: 'active',
      created_at: new Date().toISOString(),
      created_by: req.user.email,
      last_login: null
    };

    const docRef = await db.collection('users').add(novoUsuario);

    await logAuditEvent({
      entityType: 'user',
      entityId: docRef.id,
      action: 'create',
      performedBy: req.user.email,
      performedById: req.user.id,
      performedByRole: req.user.role,
      after: novoUsuario,
      metadata: {
        municipio_id: novoUsuario.municipio_id || null
      }
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user_id: docRef.id,
      usuario: {
        id: docRef.id,
        ...novoUsuario
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'CREATION_ERROR',
        message: 'Erro ao criar usuário'
      }
    });
  }
});

/**
 * GET /admin/users/:user_id
 * Obter detalhes de um usuário (apenas proprietário)
 */
app.get('/admin/users/:user_id', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const { user_id } = req.params;
    const doc = await db.collection('users').doc(user_id).get();

    if (!doc.exists) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado'
        }
      });
    }

    const data = doc.data();
    delete data.password;

    res.json({
      usuario: {
        id: doc.id,
        ...data
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Erro ao buscar usuário'
      }
    });
  }
});

/**
 * PUT /admin/users/:user_id
 * Atualizar usuário (apenas proprietário)
 */
app.put('/admin/users/:user_id', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      name,
      phone,
      cpf,
      role,
      municipio_id,
      municipio_nome,
      status,
      photo_url
    } = req.body;

    const docRef = db.collection('users').doc(user_id);
    const beforeSnapshot = await docRef.get();
    const beforeData = beforeSnapshot.exists ? beforeSnapshot.data() : null;

    const updateData = {};
    const validRoles = ['admin_master', 'admin_municipio', 'gestor_contrato', 'fiscal_contrato'];

    app.post('/admin/users/:user_id/photo', authenticateToken, isAdminMaster, async (req, res) => {
      try {
        const { user_id } = req.params;
        const { image_base64 } = req.body || {};

        if (!user_id) {
          return res.status(400).json({
            error: {
              code: 'MISSING_USER_ID',
              message: 'Usuário inválido para upload de foto'
            }
          });
        }

        if (req.user?.id !== user_id) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'Você só pode atualizar a sua própria foto de perfil'
            }
          });
        }

        const parsedImage = parseImageDataUrl(image_base64);
        if (!parsedImage) {
          return res.status(400).json({
            error: {
              code: 'INVALID_IMAGE',
              message: 'Formato de imagem inválido'
            }
          });
        }

        const userRef = db.collection('users').doc(user_id);
        const beforeSnapshot = await userRef.get();

        if (!beforeSnapshot.exists) {
          return res.status(404).json({
            error: {
              code: 'NOT_FOUND',
              message: 'Usuário não encontrado'
            }
          });
        }

        const beforeData = beforeSnapshot.data();

        const uniqueId = crypto.randomUUID();
        const filePath = `profile_photos/${user_id}/${uniqueId}.${parsedImage.extension}`;
        const file = bucket.file(filePath);

        await file.save(parsedImage.buffer, {
          metadata: {
            contentType: parsedImage.mimeType,
            cacheControl: 'public,max-age=3600'
          }
        });

        await file.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        await userRef.update({
          photo_url: publicUrl,
          updated_at: new Date().toISOString(),
          updated_by: req.user.email
        });

        if (beforeData?.photo_url && beforeData.photo_url !== publicUrl) {
          await deleteStorageFileByUrl(beforeData.photo_url);
        }

        const afterSnapshot = await userRef.get();
        const afterData = afterSnapshot.data();

        await logAuditEvent({
          entityType: 'user',
          entityId: user_id,
          action: 'update',
          performedBy: req.user.email,
          performedById: req.user.id,
          performedByRole: req.user.role,
          before: beforeData,
          after: afterData,
          metadata: {
            updated_fields: ['photo_url']
          }
        });

        res.json({
          message: 'Foto de perfil atualizada com sucesso',
          photo_url: publicUrl
        });
      } catch (error) {
        if (error && error.message === 'IMAGE_TOO_LARGE') {
          return res.status(413).json({
            error: {
              code: 'IMAGE_TOO_LARGE',
              message: 'Imagem excede o limite de 4MB'
            }
          });
        }

        if (error && error.message === 'UNSUPPORTED_IMAGE_TYPE') {
          return res.status(415).json({
            error: {
              code: 'UNSUPPORTED_IMAGE_TYPE',
              message: 'Formato de imagem não suportado. Utilize JPG, PNG ou WEBP.'
            }
          });
        }

        console.error('Erro ao atualizar foto de perfil:', error);
        res.status(500).json({
          error: {
            code: 'PHOTO_UPLOAD_ERROR',
            message: 'Erro ao atualizar foto de perfil'
          }
        });
      }
    });

    app.delete('/admin/users/:user_id/photo', authenticateToken, isAdminMaster, async (req, res) => {
      try {
        const { user_id } = req.params;

        if (!user_id) {
          return res.status(400).json({
            error: {
              code: 'MISSING_USER_ID',
              message: 'Usuário inválido para remoção de foto'
            }
          });
        }

        if (req.user?.id !== user_id) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'Você só pode remover a sua própria foto de perfil'
            }
          });
        }

        const userRef = db.collection('users').doc(user_id);
        const beforeSnapshot = await userRef.get();

        if (!beforeSnapshot.exists) {
          return res.status(404).json({
            error: {
              code: 'NOT_FOUND',
              message: 'Usuário não encontrado'
            }
          });
        }

        const beforeData = beforeSnapshot.data();

        if (beforeData?.photo_url) {
          await deleteStorageFileByUrl(beforeData.photo_url);
        }

        await userRef.update({
          photo_url: '',
          updated_at: new Date().toISOString(),
          updated_by: req.user.email
        });

        const afterSnapshot = await userRef.get();
        const afterData = afterSnapshot.data();

        await logAuditEvent({
          entityType: 'user',
          entityId: user_id,
          action: 'update',
          performedBy: req.user.email,
          performedById: req.user.id,
          performedByRole: req.user.role,
          before: beforeData,
          after: afterData,
          metadata: {
            updated_fields: ['photo_url']
          }
        });

        res.json({
          message: 'Foto de perfil removida com sucesso'
        });
      } catch (error) {
        console.error('Erro ao remover foto de perfil:', error);
        res.status(500).json({
          error: {
            code: 'PHOTO_DELETE_ERROR',
            message: 'Erro ao remover foto de perfil'
          }
        });
      }
    });
    const statusNormalized = typeof status === 'string' ? status.toLowerCase() : undefined;

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      updateData.name = name || '';
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'phone')) {
      updateData.phone = phone || '';
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'cpf')) {
      updateData.cpf = cpf || '';
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'role')) {
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_ROLE',
            message: `Role inválida. Roles válidos: ${validRoles.join(', ')}`
          }
        });
      }
      updateData.role = role;
    }

    if (
      Object.prototype.hasOwnProperty.call(req.body, 'municipio_id') ||
      Object.prototype.hasOwnProperty.call(req.body, 'municipio_nome')
    ) {
      if (role === 'admin_master' || updateData.role === 'admin_master') {
        updateData.municipio_id = null;
        updateData.municipio_nome = null;
      } else {
        updateData.municipio_id = municipio_id || null;
        updateData.municipio_nome = municipio_nome || null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
      updateData.status = statusNormalized || 'active';
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'photo_url')) {
      updateData.photo_url = photo_url ? photo_url.trim() : '';
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_CHANGES',
          message: 'Nenhum campo válido informado para atualização'
        }
      });
    }

    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = req.user.email;

    await docRef.update(updateData);

    const afterSnapshot = await docRef.get();
    const afterData = afterSnapshot.exists ? afterSnapshot.data() : null;

    const updatedFields = Object.keys(updateData).filter(field => !['updated_at', 'updated_by'].includes(field));

    await logAuditEvent({
      entityType: 'user',
      entityId: user_id,
      action: 'update',
      performedBy: req.user.email,
      performedById: req.user.id,
      performedByRole: req.user.role,
      before: beforeData,
      after: afterData,
      metadata: {
        updated_fields: updatedFields,
        municipio_id: afterData?.municipio_id || null
      }
    });

    res.json({
      message: 'Usuário atualizado com sucesso',
      user_id: user_id
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Erro ao atualizar usuário'
      }
    });
  }
});

/**
 * DELETE /admin/users/:user_id
 * Deletar usuário (apenas proprietário)
 */
app.delete('/admin/users/:user_id', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const { user_id } = req.params;

    const docRef = db.collection('users').doc(user_id);
    const userDoc = await docRef.get();
    if (userDoc.exists && userDoc.data().email === req.user.email) {
      return res.status(400).json({
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'Você não pode deletar a si mesmo'
        }
      });
    }

    const beforeData = userDoc.exists ? userDoc.data() : null;

    await docRef.delete();

    await logAuditEvent({
      entityType: 'user',
      entityId: user_id,
      action: 'delete',
      performedBy: req.user.email,
      performedById: req.user.id,
      performedByRole: req.user.role,
      before: beforeData,
      after: null
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Erro ao deletar usuário'
      }
    });
  }
});

/**
 * GET /admin/users/statistics
 * Estatísticas de usuários por role (apenas proprietário)
 */
app.get('/admin/users/statistics', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();

    const stats = {
      admin_master: 0,
      admin_municipio: 0,
      gestor_contrato: 0,
      fiscal_contrato: 0,
      total: snapshot.size
    };

    snapshot.docs.forEach(doc => {
      const role = doc.data().role;
      if (stats.hasOwnProperty(role)) {
        stats[role]++;
      }
    });

    res.json({
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'STATS_ERROR',
        message: 'Erro ao obter estatísticas'
      }
    });
  }
});

/**
 * GET /admin/audit-logs
 * Lista registros de auditoria (apenas proprietário)
 */
app.get('/admin/audit-logs', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const {
      entity_type,
      action,
      performed_by,
      limit = 50,
      cursor
    } = req.query;

    const limitNum = Number.parseInt(limit, 10) > 0 ? Math.min(Number.parseInt(limit, 10), 100) : 50;
    const fetchLimit = Math.min(Math.max(limitNum * 3, limitNum + 20), 300);

    let query = db.collection(AUDIT_COLLECTION)
      .orderBy('created_at', 'desc');

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        query = query.startAfter(admin.firestore.Timestamp.fromDate(cursorDate));
      }
    }

    const snapshot = await query.limit(fetchLimit + 1).get();

    const rawLogs = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.created_at && data.created_at.toDate ? data.created_at.toDate().toISOString() : null;

      return {
        id: doc.id,
        entity_type: data.entity_type || null,
        entity_id: data.entity_id || null,
        action: data.action || null,
        performed_by: data.performed_by || null,
        performed_by_id: data.performed_by_id || null,
        performed_by_role: data.performed_by_role || null,
        before: data.before || null,
        after: data.after || null,
        metadata: data.metadata || null,
        created_at: createdAt
      };
    });

    const filteredLogs = rawLogs.filter(log => {
      if (entity_type && log.entity_type !== entity_type) return false;
      if (action && log.action !== action) return false;
      if (performed_by && log.performed_by !== performed_by) return false;
      return true;
    });

    const logs = filteredLogs.slice(0, limitNum);

    let nextCursor = null;
    if (logs.length === limitNum) {
      nextCursor = logs[logs.length - 1]?.created_at || null;
    }

    if (!nextCursor && snapshot.docs.length > fetchLimit) {
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const lastCreated = lastDoc && lastDoc.get('created_at');
      if (lastCreated && lastCreated.toDate) {
        nextCursor = lastCreated.toDate().toISOString();
      }
    }

    res.json({
      logs,
      next_cursor: nextCursor
    });
  } catch (error) {
    console.error('Erro ao listar logs de auditoria:', error);
    res.status(500).json({
      error: {
        code: 'AUDIT_LIST_ERROR',
        message: 'Erro ao carregar logs de auditoria'
      }
    });
  }
});

// ============================================
// ROTAS - RELATÓRIOS E FATURAMENTO
// ============================================

/**
 * GET /admin/revenue
 * Obter dados de receita (apenas proprietário)
 */
app.get('/admin/revenue', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const municipiosSnapshot = await db.collection('municipalities').get();

    const planPrices = {
      standard: 500,
      profissional: 1250,
      premium: 2500
    };

    const planLabels = {
      standard: 'Standard',
      profissional: 'Profissional',
      premium: 'Premium'
    };

    const municipiosReceita = [];
    const planosResumo = {
      standard: { quantidade: 0, receitaMensal: 0 },
      profissional: { quantidade: 0, receitaMensal: 0 },
      premium: { quantidade: 0, receitaMensal: 0 }
    };

    let receitaMensalTotal = 0;
    let municipiosAtivos = 0;

    municipiosSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const municipioId = doc.id;
      const nome = data.nome || data.municipio_nome || data.cidade || municipioId;
      const estado = (data.estado || '').toUpperCase();
      const plano = (data.license_type || data.plano || 'standard').toLowerCase();
      const status = (data.status || 'ativo').toString().toLowerCase();
      const isActive = status === 'ativo' || status === 'active';
      const price = planPrices[plano] || 0;

      if (planosResumo[plano]) {
        planosResumo[plano].quantidade += 1;
        if (isActive) {
          planosResumo[plano].receitaMensal += price;
        }
      }

      if (isActive) {
        municipiosAtivos += 1;
        receitaMensalTotal += price;
      }

      municipiosReceita.push({
        municipio_id: municipioId,
        nome,
        estado,
        plano,
        plano_label: planLabels[plano] || plano,
        status: isActive ? 'ativo' : 'inativo',
        receita_mensal: isActive ? price : 0,
        receita_anual: isActive ? price * 12 : 0
      });
    });

    const historicoMensal = Array.from({ length: 6 }).map((_, index) => {
      const dataRef = new Date();
      dataRef.setMonth(dataRef.getMonth() - (5 - index));
      const label = dataRef.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      return {
        mes: label,
        receita_mensal: Number(receitaMensalTotal.toFixed(2))
      };
    });

    const planosDetalhados = Object.keys(planosResumo).reduce((acc, plano) => {
      const resumo = planosResumo[plano];
      acc[plano] = {
        quantidade: resumo.quantidade,
        receita_mensal: Number(resumo.receitaMensal.toFixed(2)),
        receita_anual: Number((resumo.receitaMensal * 12).toFixed(2))
      };
      return acc;
    }, {});

    const ticketMedio = municipiosAtivos > 0 ? receitaMensalTotal / municipiosAtivos : 0;

    res.json({
      receita_mensal_total: Number(receitaMensalTotal.toFixed(2)),
      receita_anual_projetada: Number((receitaMensalTotal * 12).toFixed(2)),
      ticket_medio_municipio: Number(ticketMedio.toFixed(2)),
      municipios_ativos: municipiosAtivos,
      planos: planosDetalhados,
      municipios: municipiosReceita.sort((a, b) => b.receita_mensal - a.receita_mensal),
      historico: historicoMensal,
      atualizado_em: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter dados de receita:', error);
    res.status(500).json({
      error: {
        code: 'REVENUE_ERROR',
        message: 'Erro ao obter dados de receita'
      }
    });
  }
});

/**
 * GET /admin/reports/expiring-licenses
 * Obter licenças que vão vencer (apenas proprietário)
 */
app.get('/admin/reports/expiring-licenses', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const municipiosSnapshot = await db.collection('municipalities').get();
    
    const now = new Date();
    const futureDate = new Date(now.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);

    const expiringLicenses = [];

    municipiosSnapshot.docs.forEach(doc => {
      const municipio = doc.data();
      const expireDate = new Date(municipio.license_expires);
      
      if (expireDate <= futureDate && expireDate > now) {
        const daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
        expiringLicenses.push({
          municipio_id: doc.id,
          municipio_nome: municipio.municipio_nome,
          license_type: municipio.license_type,
          expires_at: municipio.license_expires,
          days_until_expiry: daysUntilExpire
        });
      }
    });

    expiringLicenses.sort((a, b) => a.days_until_expiry - b.days_until_expiry);

    res.json({
      expiring_licenses: expiringLicenses,
      total_expiring: expiringLicenses.length,
      period_days: parseInt(days)
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'REPORT_ERROR',
        message: 'Erro ao obter relatório de licenças'
      }
    });
  }
});

/**
 * GET /admin/reports/municipality-stats
 * Estatísticas por município (apenas proprietário)
 */
app.get('/admin/reports/municipality-stats', authenticateToken, isAdminMaster, async (req, res) => {
  try {
    const municipiosSnapshot = await db.collection('municipalities').get();
    
    const stats = [];

    for (const muniDoc of municipiosSnapshot.docs) {
      const municipio = muniDoc.data();
      
      // Contar usuários
      const usersSnapshot = await db.collection('users')
        .where('municipio_id', '==', muniDoc.id)
        .get();
      
      // Contar contratos
      const contratosSnapshot = await db.collection('contratos')
        .where('municipio_id', '==', muniDoc.id)
        .get();

      stats.push({
        municipio_id: muniDoc.id,
        municipio_nome: municipio.municipio_nome,
        license_type: municipio.license_type,
        users: {
          current: usersSnapshot.size,
          max: municipio.max_users,
          usage_percent: Math.round((usersSnapshot.size / municipio.max_users) * 100)
        },
        contracts: {
          current: contratosSnapshot.size,
          max: municipio.max_contracts,
          usage_percent: Math.round((contratosSnapshot.size / municipio.max_contracts) * 100)
        },
        license_expires: municipio.license_expires,
        status: municipio.status
      });
    }

    res.json({
      municipalities_stats: stats,
      total_municipalities: stats.length
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'REPORT_ERROR',
        message: 'Erro ao obter estatísticas por município'
      }
    });
  }
});

// ============================================
// TRATAMENTO DE ERROS (DEVE FICAR AO FINAL)
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Rota ${req.method} ${req.path} não encontrada`
    }
  });
});

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
// EXPORTAR
// ============================================

// Para Cloud Functions
exports.cicloIntegradoAPI = app;

// Para desenvolvimento local
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}
