const express = require('express');
const db = require('../services/dbService');
const faceApi = require('../services/faceApiService');
const router = express.Router();
const multer = require('multer');
const upload = multer();

/**
 * @route POST /api/attendance
 * @description Registra presença a partir de uma imagem, usando reconhecimento facial.
 * @access Public
 * @param {object} req - O objeto da requisição Express.
 * @param {file} req.file - Imagem enviada (campo 'image') ou
 * @param {string} req.body.image - Imagem em base64
 * @param {object} res - O objeto da resposta Express.
 */
router.post('/attendance', upload.single('image'), async (req, res) => {
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
 * @access Public
 * @param {object} req - O objeto da requisição Express.
 * @param {object} res - O objeto da resposta Express.
 */
router.get('/attendance', async (req, res) => {
  try {
    const sql = `
      SELECT a.id, a.timestamp, a.recognized, s.id as student_id, s.name, s.registration_number
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      ORDER BY a.timestamp DESC
    `;
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao consultar presenças.' });
  }
});

module.exports = router;
