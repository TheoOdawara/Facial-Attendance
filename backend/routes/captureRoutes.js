const express = require('express');
const mqttClient = require('../services/mqttClient');
const esp32Routes = require('./esp32Routes'); // HTTP fallback
const router = express.Router();

/**
 * @route POST /api/capture-face
 * @description Aciona ESP32 para capturar imagem e aguarda retorno
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    console.log('→ Solicitação de captura recebida');
    const captureRequestTime = Date.now();
    mqttClient.requestCapture();
    console.log('→ Comando CAPTURE enviado ao ESP32 via MQTT');
    
    // Aguarda até 60 segundos pela imagem (rede com AP Isolation é mais lenta)
    let attempts = 0;
    const maxAttempts = 120; // 60 segundos (120 x 500ms)
    
    const checkImage = setInterval(() => {
      // Verifica MQTT primeiro
      let image = mqttClient.getLastCapturedImage(captureRequestTime);
      
      // Fallback: verifica HTTP
      if (!image) {
        image = esp32Routes.getLastCapturedImage(captureRequestTime);
      }
      
      if (image) {
        clearInterval(checkImage);
        const elapsedTime = ((Date.now() - captureRequestTime) / 1000).toFixed(2);
        console.log(`✓ Imagem recebida em ${elapsedTime}s (${image.length} bytes), enviando ao frontend`);
        const base64Image = image.toString('base64');
        return res.json({ image: base64Image });
      }
      attempts++;
      
      // Log de progresso a cada 10 segundos
      if (attempts % 20 === 0) {
        console.log(`⏳ Aguardando imagem... (${attempts/2}s de ${maxAttempts/2}s)`);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(checkImage);
        console.log(`✗ Timeout após ${maxAttempts/2}s aguardando imagem do ESP32`);
        return res.status(408).json({ error: 'Timeout ao aguardar imagem do ESP32. Verifique se ESP32 está conectado e respondendo.' });
      }
    }, 500);
  } catch (err) {
    console.error('❌ Erro na captura:', err);
    res.status(500).json({ error: 'Erro ao capturar imagem' });
  }
});

module.exports = router;