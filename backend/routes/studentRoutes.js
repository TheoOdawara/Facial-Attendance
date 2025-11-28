const express = require('express');
const db = require('../services/dbService');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * @route GET /api/students
 * @description Lista todos os alunos cadastrados.
 * @access Private (requer autenticação)
 */
router.get('/students', authMiddleware, async (req, res) => {
  try {
    const { classId, active } = req.query;
    
    let sql = `
      SELECT 
        s.id, 
        s.name, 
        s.registration_number, 
        s.class_id,
        s.active,
        s.created_at,
        c.name as class_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Filtro por turma
    if (classId) {
      sql += ` AND s.class_id = $${paramIndex}`;
      params.push(classId);
      paramIndex++;
    }
    
    // Filtro por status ativo
    if (active !== undefined) {
      sql += ` AND s.active = $${paramIndex}`;
      params.push(active === 'true');
      paramIndex++;
    } else {
      // Por padrão, lista apenas ativos
      sql += ' AND s.active = TRUE';
    }
    
    sql += ' ORDER BY s.created_at DESC';
    
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar alunos:', err);
    res.status(500).json({ error: 'Erro ao listar alunos.' });
  }
});

/**
 * @route POST /api/students
 * @description Registra um novo aluno no sistema.
 * @access Private (requer autenticação)
 * @param {object} req - O objeto da requisição Express.
 * @param {string} req.body.name - O nome do aluno.
 * @param {string} req.body.registrationNumber - O número de matrícula.
 * @param {string} req.body.faceEncoding - A representação codificada da face (ex: Base64).
 * @param {number} req.body.classId - ID da turma (opcional, usa turma padrão se não fornecido).
 * @param {object} res - O objeto da resposta Express.
 */
router.post('/students', authMiddleware, async (req, res) => {

  console.log('Recebido em /api/students:', req.body);
  const { name, registrationNumber, faceEncoding, classId } = req.body;

  if (!name || !registrationNumber || !faceEncoding) {
    console.error('❌ Cadastro inválido:', { name, registrationNumber, faceEncoding });
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    // PRIMEIRO registra a face no sistema Python para obter encoding único
    console.log(`📸 Registrando face para: ${name}`);
    const axios = require('axios');
    
    // Gera ID temporário único
    const tempId = 'temp_' + Date.now();
    
    try {
      // Registra no Python ANTES de salvar no banco
      const faceResponse = await axios.post('http://faceapi:5000/register', {
        student_id: tempId,
        name: name,
        image: faceEncoding
      });
      
      if (!faceResponse.data.success) {
        return res.status(400).json({ error: faceResponse.data.error || 'Erro ao processar face' });
      }
      
      console.log(`✓ Face processada com sucesso para: ${name}`);
    } catch (faceErr) {
      console.error('❌ Erro ao processar face:', faceErr.response?.data || faceErr.message);
      return res.status(400).json({ 
        error: faceErr.response?.data?.error || 'Erro ao processar face. Certifique-se de que há uma face visível na imagem.' 
      });
    }
    
    // Agora salva no banco com um hash da imagem como face_encoding
    const crypto = require('crypto');
    const encodingHash = crypto.createHash('md5').update(faceEncoding).digest('hex');
    
    // Se classId não fornecido, usa turma padrão (id=1)
    const finalClassId = classId || 1;
    
    const sql = 'INSERT INTO students (name, registration_number, face_encoding, class_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const params = [name, registrationNumber, encodingHash, finalClassId];

    const result = await db.query(sql, params);
    const student = result.rows[0];
    
    // Atualiza o registro no Python com o ID real do aluno
    try {
      await axios.post('http://faceapi:5000/register', {
        student_id: student.id,
        name: student.name,
        image: faceEncoding
      });
      console.log(`✓ Face registrada no sistema de reconhecimento com ID: ${student.id}`);

      // Remove encoding temporário usando o mesmo ID gerado anteriormente
      await axios.post('http://faceapi:5000/remove-temp', {
        temp_id: tempId
      });
      console.log(`✓ Encoding temporário ${tempId} removido do sistema de reconhecimento`);
    } catch (updateErr) {
      console.error('⚠️ Erro ao atualizar ID ou remover temp no sistema de reconhecimento:', updateErr.message);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Aluno já cadastrado.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar aluno.' });
  }
});

/**
 * @route GET /api/students/:id
 * @description Retorna dados de um aluno específico.
 * @access Private
 */
router.get('/students/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        s.id, 
        s.name, 
        s.registration_number, 
        s.class_id,
        s.active,
        s.created_at,
        c.name as class_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `;
    
    const result = await db.query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar aluno:', err);
    res.status(500).json({ error: 'Erro ao buscar aluno.' });
  }
});

/**
 * @route PUT /api/students/:id
 * @description Atualiza dados de um aluno (sem alterar face).
 * @access Private
 */
router.put('/students/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, registration_number, class_id, active } = req.body;
    
    const sql = `
      UPDATE students
      SET 
        name = COALESCE($1, name),
        registration_number = COALESCE($2, registration_number),
        class_id = COALESCE($3, class_id),
        active = COALESCE($4, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await db.query(sql, [name, registration_number, class_id, active, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }
    
    console.log(`✓ Aluno atualizado: ${id} por: ${req.user.name}`);
    
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Matrícula já cadastrada para outro aluno.' });
    }
    console.error('Erro ao atualizar aluno:', err);
    res.status(500).json({ error: 'Erro ao atualizar aluno.' });
  }
});

/**
 * @route DELETE /api/students/:id
 * @description Remove aluno (soft delete).
 * @access Private
 */
router.delete('/students/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = 'UPDATE students SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name';
    const result = await db.query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }
    
    console.log(`✓ Aluno removido: ${result.rows[0].name} (id: ${id}) por: ${req.user.name}`);
    
    res.json({ success: true, message: 'Aluno removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover aluno:', err);
    res.status(500).json({ error: 'Erro ao remover aluno.' });
  }
});

module.exports = router;
