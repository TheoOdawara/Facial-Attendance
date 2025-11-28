const express = require('express');
const db = require('../services/dbService');
const { authMiddleware } = require('../middlewares/authMiddleware');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

// Diagnostic: confirm module load
console.log('Loaded studentRoutes module (clean)');
router.use((req, res, next) => {
  console.log(`studentRoutes: ${req.method} ${req.path}`);
  next();
});

// URL da API Python (pega do .env ou usa padrão)
const FACE_API_URL = process.env.PYTHON_FACE_API_URL || 'http://faceapi:5000';

/**
 * GET / - Lista alunos (opcionalmente filtra por classId e active)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { classId, active } = req.query;
    let sql = `
      SELECT s.id, s.name, s.registration_number, s.class_id, s.active, s.created_at, c.name as class_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (classId) { sql += ` AND s.class_id = $${idx++}`; params.push(classId); }
    if (active !== undefined) { sql += ` AND s.active = $${idx++}`; params.push(active === 'true'); }
    else { sql += ' AND s.active = TRUE'; }
    sql += ' ORDER BY s.created_at DESC';
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar alunos:', err);
    res.status(500).json({ error: 'Erro ao listar alunos.' });
  }
});

/**
 * POST / - Registra um novo aluno (espera name, registrationNumber, faceEncoding, classId opt)
 */
router.post('/', authMiddleware, async (req, res) => {
  console.log('📝 Tentativa de cadastro recebida');
  const { name, registrationNumber, faceEncoding, classId } = req.body;

  if (!name || !registrationNumber || !faceEncoding) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  // 1) Tenta registrar temporariamente no Python para validar face
  const tempId = 'temp_' + Date.now();
  try {
    await axios.post(`${FACE_API_URL}/register`, { student_id: tempId, name, image: faceEncoding });
    console.log('✓ Face válida detectada pelo Python');
  } catch (faceErr) {
    console.error('❌ Erro no Reconhecimento Facial:', faceErr.response?.data || faceErr.message);
    const msgErro = faceErr.response?.data?.error || 'Rosto não detectado. Tente melhorar a iluminação ou chegar mais perto.';
    return res.status(400).json({ error: msgErro });
  }

  // 2) Salva no DB (hash do encoding apenas)
  const encodingHash = crypto.createHash('md5').update(faceEncoding).digest('hex');
  const finalClassId = classId || 1;
  const sql = 'INSERT INTO students (name, registration_number, face_encoding, class_id) VALUES ($1, $2, $3, $4) RETURNING *';
  let student;
  try {
    const result = await db.query(sql, [name, registrationNumber, encodingHash, finalClassId]);
    student = result.rows[0];
  } catch (dbErr) {
    // limpa temp no Python
    await axios.post(`${FACE_API_URL}/remove-temp`, { temp_id: tempId }).catch(() => {});
    if (dbErr.code === '23505') return res.status(409).json({ error: 'Matrícula já cadastrada.' });
    console.error('Erro ao inserir aluno no DB:', dbErr);
    return res.status(500).json({ error: 'Erro ao salvar aluno.' });
  }

  // 3) Atualiza o registro no Python com o ID real
  try {
    await axios.post(`${FACE_API_URL}/register`, { student_id: student.id, name: student.name, image: faceEncoding });
    await axios.post(`${FACE_API_URL}/remove-temp`, { temp_id: tempId }).catch(() => {});
    console.log(`✓ Aluno ${student.name} (ID: ${student.id}) cadastrado com sucesso!`);
  } catch (updateErr) {
    console.error('⚠️ Erro não-crítico ao atualizar ID no Python:', updateErr.message);
    // não reverte o DB; retorna sucesso parcial
  }

  return res.status(201).json(student);
});

/**
 * GET /:id - retorna aluno
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT s.id, s.name, s.registration_number, s.class_id, s.active, s.created_at, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = $1`;
    const result = await db.query(sql, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aluno não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar aluno:', err);
    res.status(500).json({ error: 'Erro ao buscar aluno.' });
  }
});

/**
 * PUT /:id - atualiza aluno
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, registration_number, class_id, active } = req.body;
    const sql = `
      UPDATE students
      SET name = COALESCE($1, name), registration_number = COALESCE($2, registration_number), class_id = COALESCE($3, class_id), active = COALESCE($4, active), updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 RETURNING *
    `;
    const result = await db.query(sql, [name, registration_number, class_id, active, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aluno não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar aluno:', err);
    res.status(500).json({ error: 'Erro ao atualizar aluno.' });
  }
});

/**
 * DELETE /:id - soft delete
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('UPDATE students SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aluno não encontrado.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao remover aluno:', err);
    res.status(500).json({ error: 'Erro ao remover aluno.' });
  }
});

module.exports = router;
