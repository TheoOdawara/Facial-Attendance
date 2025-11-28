const express = require('express');
const db = require('../services/dbService');
const faceApi = require('../services/faceApiService');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();
const multer = require('multer');
const upload = multer();

/**
 * @route POST /api/attendance
 * @description Registra presença a partir de uma imagem, usando reconhecimento facial.
 * @access Public (para permitir ESP32 enviar sem token)
 * @param {object} req - O objeto da requisição Express.
 * @param {file} req.file - Imagem enviada (campo 'image') ou
 * @param {string} req.body.image - Imagem em base64
 * @param {object} res - O objeto da resposta Express.
 */
router.post('/', upload.single('image'), async (req, res) => {
  let imageBuffer;
  
  // Aceita tanto file upload quanto base64 no body
  if (req.file) {
    imageBuffer = req.file.buffer;
  } else if (req.body.image) {
    imageBuffer = Buffer.from(req.body.image, 'base64');
  } else {
    return res.status(400).json({ error: 'Imagem não enviada.' });
  }
  
  try {
    console.log('🔍 Processando reconhecimento facial...');
    
    // Chama a API Python para reconhecimento facial REAL
    const axios = require('axios');
    const faceApiResponse = await axios.post('http://faceapi:5000/recognize', {
      image: imageBuffer.toString('base64')
    });
    
    const recognitionResult = faceApiResponse.data;
    console.log('Resultado do reconhecimento:', recognitionResult);
    
    if (!recognitionResult.recognized) {
      return res.status(404).json({ 
        error: 'Face não reconhecida no sistema.',
        message: recognitionResult.message 
      });
    }
    
    // Registra presença
    const sql = 'INSERT INTO attendance (student_id, recognized) VALUES ($1, $2) RETURNING *';
    const params = [recognitionResult.student_id, true];
    const dbResult = await db.query(sql, params);
    
    console.log('✅ Presença registrada para:', recognitionResult.student_name);
    
    res.status(201).json({ 
      attendance: dbResult.rows[0], 
      recognition: recognitionResult
    });
  } catch (err) {
    console.error('❌ Erro ao registrar presença:', err.message);
    res.status(500).json({ error: 'Erro ao registrar presença: ' + err.message });
  }
});

/**
 * @route GET /api/attendance
 * @description Lista registros de presença, incluindo dados do aluno.
 * @access Private (requer autenticação)
 * @param {object} req - O objeto da requisição Express.
 * @param {object} res - O objeto da resposta Express.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { classId, studentId, startDate, endDate } = req.query;
    
    let sql = `
      SELECT 
        a.id, 
        a.timestamp, 
        a.recognized, 
        s.id as student_id, 
        s.name, 
        s.registration_number,
        s.class_id,
        c.name as class_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
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
    
    // Filtro por aluno
    if (studentId) {
      sql += ` AND s.id = $${paramIndex}`;
      params.push(studentId);
      paramIndex++;
    }
    
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
    
    sql += ' ORDER BY a.timestamp DESC';
    
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao consultar presenças.' });
  }
});

module.exports = router;
