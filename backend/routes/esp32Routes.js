const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configura multer para receber imagem em memória
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Cache para última imagem capturada (usado pelo captureRoutes)
let lastCapturedImage = null;
let lastCaptureTimestamp = 0;

/**
 * @route POST /api/esp32/upload-image
 * @description Recebe imagem do ESP32 via HTTP (bypass MQTT)
 * @access Public (ESP32)
 */
router.post('/upload-image', (req, res, next) => {
  console.log('🔍 Requisição recebida:', {
    method: req.method,
    path: req.path,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    body: typeof req.body,
    hasFile: !!req.file
  });
  next();
}, upload.single('image'), (req, res) => {
  try {
    console.log('📦 Após multer:', {
      hasFile: !!req.file,
      body: Object.keys(req.body),
      file: req.file ? { name: req.file.fieldname, size: req.file.size } : null
    });
    
    if (!req.file) {
      console.log('❌ Nenhuma imagem recebida');
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    console.log(`✅ Imagem recebida do ESP32 via HTTP: ${req.file.size} bytes`);
    
    // Armazena imagem no cache
    lastCapturedImage = req.file.buffer;
    lastCaptureTimestamp = Date.now();
    
    res.json({ 
      success: true, 
      size: req.file.size,
      timestamp: lastCaptureTimestamp
    });
  } catch (err) {
    console.error('❌ Erro ao receber imagem:', err);
    res.status(500).json({ error: 'Erro ao processar imagem' });
  }
});

/**
 * Retorna última imagem capturada (chamado por captureRoutes)
 */
function getLastCapturedImage(captureRequestTime) {
  if (lastCapturedImage && lastCaptureTimestamp > captureRequestTime) {
    return lastCapturedImage;
  }
  return null;
}

module.exports = {
  router,
  getLastCapturedImage
};
