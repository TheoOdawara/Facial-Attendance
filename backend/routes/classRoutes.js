const express = require('express');
const db = require('../services/dbService');
const { authMiddleware } = require('../middlewares/authMiddleware');
const Joi = require('joi');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Validação de payload de criação/atualização
const createClassSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  academic_period: Joi.string().max(50).allow(null, '').optional(),
  description: Joi.string().max(500).allow(null, '').optional()
});

// GET /api/classes/:id/stats - estatísticas detalhadas da turma
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) return res.status(400).json({ error: 'ID da turma inválido.' });

    // Total de alunos ativos
    const studentSql = 'SELECT COUNT(*) as total FROM students WHERE class_id = $1 AND active = TRUE';
    const studentResult = await db.query(studentSql, [idNum]);
    const totalStudents = parseInt(studentResult.rows[0].total);

    // Total de presenças registradas
    const attendanceSql = 'SELECT COUNT(*) as total FROM attendance WHERE student_id IN (SELECT id FROM students WHERE class_id = $1 AND active = TRUE)';
    const attendanceResult = await db.query(attendanceSql, [idNum]);
    const attendanceTotal = parseInt(attendanceResult.rows[0].total);

    // Total de dias de aula (datas distintas de presença)
    const daysSql = 'SELECT COUNT(DISTINCT DATE(timestamp)) as total_days FROM attendance WHERE student_id IN (SELECT id FROM students WHERE class_id = $1 AND active = TRUE)';
    const daysResult = await db.query(daysSql, [idNum]);
    const totalDays = parseInt(daysResult.rows[0].total_days);

    // Total de faltas
    const possiblePresences = totalStudents * totalDays;
    const totalAbsences = possiblePresences - attendanceTotal;

    // Taxa de presença geral (%)
    const attendanceRate = possiblePresences > 0
      ? ((attendanceTotal / possiblePresences) * 100).toFixed(1)
      : 0;

    // Alunos presentes hoje
    const presentTodaySql = `
      SELECT DISTINCT s.id, s.name
      FROM students s
      JOIN attendance a ON a.student_id = s.id
      WHERE s.class_id = $1 AND s.active = TRUE AND DATE(a.timestamp) = CURRENT_DATE
    `;
    const presentTodayResult = await db.query(presentTodaySql, [idNum]);
    const presentToday = presentTodayResult.rows.map(r => ({ id: r.id, name: r.name }));

    // Alunos faltantes hoje
    const absentTodaySql = `
      SELECT s.id, s.name
      FROM students s
      WHERE s.class_id = $1 AND s.active = TRUE AND s.id NOT IN (
        SELECT DISTINCT a.student_id FROM attendance a WHERE DATE(a.timestamp) = CURRENT_DATE
      )
    `;
    const absentTodayResult = await db.query(absentTodaySql, [idNum]);
    const absentToday = absentTodayResult.rows.map(r => ({ id: r.id, name: r.name }));

    res.json({
      totalStudents,
      attendanceTotal,
      totalDays,
      totalAbsences,
      attendanceRate: parseFloat(attendanceRate),
      presentToday,
      absentToday
    });
  } catch (err) {
    console.error('Erro ao buscar estatísticas da turma:', err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas da turma.' });
  }
});

// GET /api/classes - lista todas as turmas ativas
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
      WHERE c.active = TRUE AND c.professor_id = $1
      GROUP BY c.id, p.id, p.name
      ORDER BY c.created_at DESC
    `;

    const result = await db.query(sql, [req.user.id]);
    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar turmas:', err);
    return res.status(500).json({ error: 'Erro ao listar turmas.' });
  }
});

// GET /api/classes/:id - detalhes da turma (id numérico)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) return res.status(400).json({ error: 'ID da turma inválido.' });

    const sql = `
      SELECT 
        c.*,
        p.name as professor_name,
        p.email as professor_email
      FROM classes c
      JOIN professors p ON c.professor_id = p.id
      WHERE c.id = $1 AND c.active = TRUE
    `;

    const result = await db.query(sql, [idNum]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar turma:', err);
    return res.status(500).json({ error: 'Erro ao buscar turma.' });
  }
});

// POST /api/classes - cria nova turma (vinculada ao professor autenticado)
router.post('/', async (req, res) => {
  try {
    const { error, value } = createClassSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, academic_period, description } = value;
    const sql = `
      INSERT INTO classes (name, professor_id, academic_period, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await db.query(sql, [name, req.user.id, academic_period || null, description || null]);
    console.log(`✓ Nova turma criada: ${name} por professor: ${req.user.name}`);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar turma:', err);
    return res.status(500).json({ error: 'Erro ao criar turma.' });
  }
});

// PUT /api/classes/:id - atualiza turma
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) return res.status(400).json({ error: 'ID da turma inválido.' });

    const { name, academic_period, description, active } = req.body;

    const checkSql = 'SELECT id FROM classes WHERE id = $1';
    const checkResult = await db.query(checkSql, [idNum]);
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });

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

    const result = await db.query(updateSql, [name, academic_period, description, active, idNum]);
    console.log(`✓ Turma atualizada: ${idNum} por professor: ${req.user.name}`);
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar turma:', err);
    return res.status(500).json({ error: 'Erro ao atualizar turma.' });
  }
});

// DELETE /api/classes/:id - soft delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) return res.status(400).json({ error: 'ID da turma inválido.' });

    const sql = 'UPDATE classes SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id';
    const result = await db.query(sql, [idNum]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Turma não encontrada.' });

    console.log(`✓ Turma removida: ${idNum} por professor: ${req.user.name}`);
    return res.json({ success: true, message: 'Turma removida com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover turma:', err);
    return res.status(500).json({ error: 'Erro ao remover turma.' });
  }
});

// GET /api/classes/:id/students - lista alunos da turma
router.get('/:id/students', async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) return res.status(400).json({ error: 'ID da turma inválido.' });

    // Verifica se a turma pertence ao professor logado
    const checkClassSql = 'SELECT id FROM classes WHERE id = $1 AND professor_id = $2 AND active = TRUE';
    const checkClassResult = await db.query(checkClassSql, [idNum, req.user.id]);
    if (checkClassResult.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada.' });
    }

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

    const result = await db.query(sql, [idNum]);
    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar alunos da turma:', err);
    return res.status(500).json({ error: 'Erro ao listar alunos da turma.' });
  }
});

// GET /api/classes/:id/attendance - lista presenças da turma com filtros
router.get('/:id/attendance', async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) return res.status(400).json({ error: 'ID da turma inválido.' });

    // Verifica se a turma pertence ao professor logado
    const checkClassSql = 'SELECT id FROM classes WHERE id = $1 AND professor_id = $2 AND active = TRUE';
    const checkClassResult = await db.query(checkClassSql, [idNum, req.user.id]);
    if (checkClassResult.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada.' });
    }

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

    const params = [idNum];
    let paramIndex = 2;

    if (startDate) {
      sql += ` AND a.timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND a.timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (studentId) {
      const studentIdNum = parseInt(studentId, 10);
      if (!Number.isNaN(studentIdNum)) {
        sql += ` AND s.id = $${paramIndex}`;
        params.push(studentIdNum);
        paramIndex++;
      }
    }

    sql += ' ORDER BY a.timestamp DESC';

    const result = await db.query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar presenças da turma:', err);
    return res.status(500).json({ error: 'Erro ao consultar presenças.' });
  }
});

module.exports = router;

