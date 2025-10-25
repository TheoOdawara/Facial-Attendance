const express = require('express');
const db = require('../services/dbService');
const router = express.Router();

/**
 * @route POST /api/students
 * @description Registra um novo aluno no sistema.
 * @access Public
 * @param {object} req - O objeto da requisição Express.
 * @param {string} req.body.name - O nome do aluno.
 * @param {string} req.body.registrationNumber - O número de matrícula.
 * @param {string} req.body.faceEncoding - A representação codificada da face (ex: Base64).
 * @param {object} res - O objeto da resposta Express.
 */
router.post('/students', async (req, res) => {
  const { name, registrationNumber, faceEncoding } = req.body;

  if (!name || !registrationNumber || !faceEncoding) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    // PRIMEIRO registra a face no sistema Python para obter encoding único
    console.log(`📸 Registrando face para: ${name}`);
    const axios = require('axios');
    
    let studentId;
    try {
      // Registra no Python ANTES de salvar no banco
      const faceResponse = await axios.post('http://faceapi:5000/register', {
        student_id: 'temp_' + Date.now(), // ID temporário
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
    
    const sql = 'INSERT INTO students (name, registration_number, face_encoding) VALUES ($1, $2, $3) RETURNING *';
    const params = [name, registrationNumber, encodingHash];

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
    } catch (updateErr) {
      console.error('⚠️ Erro ao atualizar ID no sistema de reconhecimento:', updateErr.message);
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

module.exports = router;
