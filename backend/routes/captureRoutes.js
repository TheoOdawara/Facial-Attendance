const express = require('express');
const mqttClient = require('../services/mqttClient');
const router = express.Router();

/**
 * @route POST /api/capture-face
 * @description Aciona ESP32 para capturar imagem e aguarda retorno
 * @access Public
 */
router.post('/capture-face', async (req, res) => {
  try {
    console.log('→ Solicitação de captura recebida');
    const captureRequestTime = Date.now();
    mqttClient.requestCapture();
    console.log('→ Comando CAPTURE enviado ao ESP32');
    
    // Aguarda até 45 segundos pela imagem (aumentado para imagens grandes)
    let attempts = 0;
    const maxAttempts = 90; // 45 segundos (90 x 500ms)
    
    const checkImage = setInterval(() => {
      const image = mqttClient.getLastCapturedImage(captureRequestTime);
      if (image) {
        clearInterval(checkImage);
        console.log('✓ Imagem recebida, enviando ao frontend');
        const base64Image = image.toString('base64');
        return res.json({ image: base64Image });
      }
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(checkImage);
        console.log('✗ Timeout ao aguardar imagem do ESP32');
        return res.status(408).json({ error: 'Timeout ao aguardar imagem do ESP32' });
      }
    }, 500);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao capturar imagem' });
  }
});

module.exports = router;