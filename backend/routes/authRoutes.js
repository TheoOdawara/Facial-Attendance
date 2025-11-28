const express = require('express');
const db = require('../services/dbService');
const authService = require('../services/authService');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const Joi = require('joi');
const router = express.Router();

// =============================================================================
// SCHEMAS DE VALIDAÇÃO JOI
// =============================================================================
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('professor', 'admin').default('professor')
});

// =============================================================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// =============================================================================

/**
 * @route POST /api/auth/login
 * @description Autentica professor e retorna token JWT.
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    // Validação de input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { email, password } = value;
    
    // Busca professor no banco
    const sql = 'SELECT id, name, email, password_hash, role, active FROM professors WHERE email = $1';
    const result = await db.query(sql, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    
    const professor = result.rows[0];
    
    // Verifica se professor está ativo
    if (!professor.active) {
      return res.status(403).json({ error: 'Conta desativada. Contate o administrador.' });
    }
    
    // Compara senha
    const isPasswordValid = await authService.comparePassword(password, professor.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    
    // Gera token JWT
    const token = authService.generateToken(professor);
    
    console.log(`✓ Login bem-sucedido: ${professor.email} (role: ${professor.role})`);
    
    res.json({
      success: true,
      token,
      professor: {
        id: professor.id,
        name: professor.name,
        email: professor.email,
        role: professor.role
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
});

// =============================================================================
// ROTAS PROTEGIDAS (REQUEREM AUTENTICAÇÃO)
// =============================================================================

/**
 * @route POST /api/auth/register
 * @description Registra novo professor (apenas admin pode criar).
 * @access Private (Admin only)
 */
router.post('/register', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Validação de input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { name, email, password, role } = value;
    
    // Verifica se email já existe
    const checkSql = 'SELECT id FROM professors WHERE email = $1';
    const checkResult = await db.query(checkSql, [email]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }
    
    // Hash da senha
    const passwordHash = await authService.hashPassword(password);
    
    // Insere novo professor
    const insertSql = `
      INSERT INTO professors (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, active, created_at
    `;
    const insertResult = await db.query(insertSql, [name, email, passwordHash, role]);
    
    console.log(`✓ Novo professor registrado: ${email} (role: ${role}) por admin: ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      professor: insertResult.rows[0]
    });
  } catch (err) {
    console.error('Erro ao registrar professor:', err);
    res.status(500).json({ error: 'Erro ao registrar professor.' });
  }
});

/**
 * @route GET /api/auth/me
 * @description Retorna dados do professor autenticado.
 * @access Private
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const sql = 'SELECT id, name, email, role, active, created_at FROM professors WHERE id = $1';
    const result = await db.query(sql, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professor não encontrado.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar dados do professor:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do professor.' });
  }
});

/**
 * @route PUT /api/auth/change-password
 * @description Altera senha do professor autenticado.
 * @access Private
 */
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword e newPassword são obrigatórios.' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres.' });
    }
    
    // Busca senha atual do banco
    const sql = 'SELECT password_hash FROM professors WHERE id = $1';
    const result = await db.query(sql, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professor não encontrado.' });
    }
    
    const currentHash = result.rows[0].password_hash;
    
    // Verifica senha atual
    const isCurrentValid = await authService.comparePassword(currentPassword, currentHash);
    
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }
    
    // Gera novo hash
    const newHash = await authService.hashPassword(newPassword);
    
    // Atualiza senha no banco
    const updateSql = 'UPDATE professors SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await db.query(updateSql, [newHash, req.user.id]);
    
    console.log(`✓ Senha alterada para: ${req.user.email}`);
    
    res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

module.exports = router;
