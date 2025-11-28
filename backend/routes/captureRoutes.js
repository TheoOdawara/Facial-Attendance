const express = require('express');
const mqttClient = require('../services/mqttClient');
const captureEvents = require('../services/captureEvents');
const router = express.Router();

/**
 * @route POST /api/capture-face
 * @description Aciona ESP32 para capturar imagem e aguarda retorno
 * @access Public
 */
router.post('/', async (req, res) => {
  // Limpa qualquer ouvinte antigo que tenha ficado "pendurado"
  captureEvents.removeAllListeners('image_received');

  try {
    console.log('→ Nova solicitação de captura iniciada...');
    
    // Marca o tempo exato que PEDIMOS a foto
    const requestStartTime = Date.now();
    
    // Envia comando
    mqttClient.requestCapture();

    // 2) Aguarda a imagem via evento (sem polling)
    const imageBuffer = await new Promise((resolve, reject) => {
      // Timeout de segurança (20s)
      const timeout = setTimeout(() => {
        captureEvents.removeListener('image_received', onImageReceived);
        reject(new Error('Timeout: ESP32 demorou muito para responder.'));
      }, 25000); // 25 segundos (dê tempo ao ESP32 para fazer o "Flush")

      // Handler que resolve a promise quando a imagem chega
      const onImageReceived = (buffer) => {
        clearTimeout(timeout);
        captureEvents.removeListener('image_received', onImageReceived);
        resolve(buffer);
      };

      // Escuta o evento uma única vez
      captureEvents.once('image_received', onImageReceived);
    });

    console.log(`✓ Imagem processada e retornando ao front.`);
    const base64Image = imageBuffer.toString('base64');
    return res.json({ image: base64Image });
  } catch (err) {
    console.error('❌ Erro:', err.message);
    res.status(408).json({ error: 'O dispositivo não respondeu a tempo. Tente novamente.' });
  }
});

module.exports = router;