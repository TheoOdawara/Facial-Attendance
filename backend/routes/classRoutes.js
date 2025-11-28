const express = require('express');
const db = require('../services/dbService');
const { authMiddleware } = require('../middlewares/authMiddleware');
const Joi = require('joi');
const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// =============================================================================
// SCHEMAS DE VALIDAÇÃO
// =============================================================================
const createClassSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  academic_period: Joi.string().max(50).optional(),
  description: Joi.string().max(500).optional()
});

// =============================================================================
// ROTAS DE TURMAS
// =============================================================================

/**
 * @route GET /api/classes
 * @description Lista todas as turmas do sistema.
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        c.academic_period, 
        c.description,
        c.active,
        c.created_at,
        p.id as professor_id,
        p.name as professor_name,
        COUNT(s.id) as student_count
      FROM classes c
      JOIN professors p ON c.professor_id = p.id
      LEFT JOIN students s ON s.class_id = c.id AND s.active = TRUE
      WHERE c.active = TRUE
      GROUP BY c.id, p.id, p.name
      ORDER BY c.created_at DESC
    `;
    
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar turmas:', err);
    res.status(500).json({ error: 'Erro ao listar turmas.' });
  }
});

/**
 * @route GET /api/classes/:id
 * @description Retorna detalhes de uma turma específica.
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        c.*,
        p.name as professor_name,
        p.email as professor_email
      FROM classes c
      JOIN professors p ON c.professor_id = p.id
      WHERE c.id = $1 AND c.active = TRUE
    `;
    
    const result = await db.query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar turma:', err);
    res.status(500).json({ error: 'Erro ao buscar turma.' });
  }
});

/**
 * @route POST /api/classes
 * @description Cria nova turma vinculada ao professor autenticado.
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const { error, value } = createClassSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { name, academic_period, description } = value;
    
    const sql = `
      INSERT INTO classes (name, professor_id, academic_period, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await db.query(sql, [name, req.user.id, academic_period, description]);
    
    console.log(`✓ Nova turma criada: ${name} por professor: ${req.user.name}`);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar turma:', err);
    res.status(500).json({ error: 'Erro ao criar turma.' });
  }
});

/**
 * @route PUT /api/classes/:id
 * @description Atualiza dados de uma turma.
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, academic_period, description, active } = req.body;
    
    // Verifica se turma existe
    const checkSql = 'SELECT id FROM classes WHERE id = $1';
    const checkResult = await db.query(checkSql, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada.' });
    }
    
    const updateSql = `
      UPDATE classes
      SET 
        name = COALESCE($1, name),
        academic_period = COALESCE($2, academic_period),
        description = COALESCE($3, description),
        active = COALESCE($4, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await db.query(updateSql, [name, academic_period, description, active, id]);
    
    console.log(`✓ Turma atualizada: ${id} por professor: ${req.user.name}`);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar turma:', err);
    res.status(500).json({ error: 'Erro ao atualizar turma.' });
  }
});

/**
 * @route DELETE /api/classes/:id
 * @description Remove turma (soft delete).
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = 'UPDATE classes SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id';
    const result = await db.query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada.' });
    }
    
    console.log(`✓ Turma removida: ${id} por professor: ${req.user.name}`);
    
    res.json({ success: true, message: 'Turma removida com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover turma:', err);
    res.status(500).json({ error: 'Erro ao remover turma.' });
  }
});

/**
 * @route GET /api/classes/:id/students
 * @description Lista alunos de uma turma específica.
 * @access Private
 */
router.get('/:id/students', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        s.id, 
        s.name, 
        s.registration_number, 
        s.created_at,
        s.active,
        COUNT(a.id) as attendance_count
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id
      WHERE s.class_id = $1 AND s.active = TRUE
      GROUP BY s.id
      ORDER BY s.name ASC
    `;
    
    const result = await db.query(sql, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar alunos da turma:', err);
    res.status(500).json({ error: 'Erro ao listar alunos da turma.' });
  }
});

/**
 * @route GET /api/classes/:id/attendance
 * @description Lista presenças de uma turma com filtros opcionais.
 * @access Private
 */
router.get('/:id/attendance', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, studentId } = req.query;
    
    let sql = `
      SELECT 
        a.id,
        a.timestamp,
        a.recognized,
        s.id as student_id,
        s.name as student_name,
        s.registration_number
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE s.class_id = $1
    `;
    
    const params = [id];
    let paramIndex = 2;
    
    // Filtro por data inicial
    if (startDate) {
      sql += ` AND a.timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    // Filtro por data final
    if (endDate) {
      sql += ` AND a.timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // Filtro por aluno específico
    if (studentId) {
      sql += ` AND s.id = $${paramIndex}`;
      params.push(studentId);
      paramIndex++;
    }
    
    sql += ' ORDER BY a.timestamp DESC';
    
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar presenças da turma:', err);
    res.status(500).json({ error: 'Erro ao listar presenças da turma.' });
  }
});

module.exports = router;
