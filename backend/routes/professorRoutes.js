const express = require('express');
const db = require('../services/dbService');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @route GET /api/professors
 * @description Lista todos os professores (apenas admin).
 * @access Private (Admin only)
 */
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.id, 
        p.name, 
        p.email, 
        p.role, 
        p.active, 
        p.created_at,
        COUNT(DISTINCT c.id) as class_count
      FROM professors p
      LEFT JOIN classes c ON c.professor_id = p.id AND c.active = TRUE
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar professores:', err);
    res.status(500).json({ error: 'Erro ao listar professores.' });
  }
});

/**
 * @route GET /api/professors/:id
 * @description Retorna dados de um professor específico.
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        id, 
        name, 
        email, 
        role, 
        active, 
        created_at
      FROM professors 
      WHERE id = $1
    `;
    
    const result = await db.query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professor não encontrado.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar professor:', err);
    res.status(500).json({ error: 'Erro ao buscar professor.' });
  }
});

/**
 * @route GET /api/professors/:id/classes
 * @description Lista turmas de um professor específico.
 * @access Private
 */
router.get('/:id/classes', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        c.academic_period, 
        c.description,
        c.created_at,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND s.active = TRUE
      WHERE c.professor_id = $1 AND c.active = TRUE
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    
    const result = await db.query(sql, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar turmas do professor:', err);
    res.status(500).json({ error: 'Erro ao listar turmas do professor.' });
  }
});

/**
 * @route GET /api/professors/:id/stats
 * @description Retorna estatísticas do professor (total alunos, turmas, presenças hoje).
 * @access Private
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Total de turmas
    const classSql = 'SELECT COUNT(*) as total FROM classes WHERE professor_id = $1 AND active = TRUE';
    const classResult = await db.query(classSql, [id]);
    const totalClasses = parseInt(classResult.rows[0].total);
    
    // Total de alunos nas turmas do professor
    const studentSql = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.professor_id = $1 AND s.active = TRUE AND c.active = TRUE
    `;
    const studentResult = await db.query(studentSql, [id]);
    const totalStudents = parseInt(studentResult.rows[0].total);
    
    // Presenças hoje
    const attendanceSql = `
      SELECT COUNT(*) as total
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE c.professor_id = $1 
        AND DATE(a.timestamp) = CURRENT_DATE
    `;
    const attendanceResult = await db.query(attendanceSql, [id]);
    const attendanceToday = parseInt(attendanceResult.rows[0].total);
    
    // Taxa de presença hoje (%)
    const attendanceRate = totalStudents > 0 
      ? ((attendanceToday / totalStudents) * 100).toFixed(1)
      : 0;
    
    res.json({
      totalClasses,
      totalStudents,
      attendanceToday,
      attendanceRate: parseFloat(attendanceRate)
    });
  } catch (err) {
    console.error('Erro ao buscar estatísticas do professor:', err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
});

/**
 * @route PUT /api/professors/:id
 * @description Atualiza dados de um professor (apenas admin ou próprio professor).
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, active, role } = req.body;
    
    // Apenas admin pode alterar role e active
    // Professor só pode alterar próprio nome
    if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    
    if (req.user.role !== 'admin' && (role || active !== undefined)) {
      return res.status(403).json({ error: 'Apenas admin pode alterar role ou status ativo.' });
    }
    
    const updateSql = `
      UPDATE professors
      SET 
        name = COALESCE($1, name),
        active = COALESCE($2, active),
        role = COALESCE($3, role),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, email, role, active, created_at
    `;
    
    const result = await db.query(updateSql, [name, active, role, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professor não encontrado.' });
    }
    
    console.log(`✓ Professor atualizado: ${id} por: ${req.user.name}`);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar professor:', err);
    res.status(500).json({ error: 'Erro ao atualizar professor.' });
  }
});

/**
 * @route DELETE /api/professors/:id
 * @description Remove professor (soft delete, apenas admin).
 * @access Private (Admin only)
 */
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Não permite remover professor Sistema (id=1)
    if (parseInt(id) === 1) {
      return res.status(403).json({ error: 'Não é possível remover o professor Sistema.' });
    }
    
    const sql = 'UPDATE professors SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id';
    const result = await db.query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Professor não encontrado.' });
    }
    
    console.log(`✓ Professor removido: ${id} por admin: ${req.user.name}`);
    
    res.json({ success: true, message: 'Professor removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover professor:', err);
    res.status(500).json({ error: 'Erro ao remover professor.' });
  }
});

module.exports = router;
