const mqtt = require('mqtt');
require('dotenv').config();

const MQTT_HOST = process.env.MQTT_HOST || 'mqtt';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

let capturedImageBuffer = null;
let lastCaptureTimestamp = 0;

/**
 * Cliente MQTT para comunicação com ESP32
 * @type {mqtt.MqttClient}
 */
const client = mqtt.connect(`mqtt://${MQTT_HOST}:${MQTT_PORT}`, {
  username: MQTT_USER,
  password: MQTT_PASSWORD,
  properties: {
    maximumPacketSize: 131072 // 128KB
  }
});

client.on('connect', () => {
  console.log('MQTT conectado');
  client.subscribe('facial/attendance/image', (err) => {
    if (err) console.error('Erro ao subscrever tópico:', err);
  });
});

client.on('message', (topic, message) => {
  if (topic === 'facial/attendance/image') {
    capturedImageBuffer = message;
    lastCaptureTimestamp = Date.now();
    console.log('✓ Imagem recebida do ESP32, tamanho:', message.length, 'bytes');
  }
});

client.on('error', (err) => {
  console.error('Erro MQTT:', err);
});

/**
 * Publica comando para ESP32 capturar imagem
 */
function requestCapture() {
  // Limpa imagem antiga e reseta timestamp ANTES de solicitar nova captura
  capturedImageBuffer = null;
  lastCaptureTimestamp = 0;
  console.log('→ Publicando comando CAPTURE no tópico facial/attendance/capture');
  client.publish('facial/attendance/capture', 'CAPTURE');
}

/**
 * Retorna a última imagem capturada apenas se for recente
 * @param {number} captureRequestTime - Timestamp de quando foi solicitada a captura
 * @returns {Buffer|null}
 */
function getLastCapturedImage(captureRequestTime) {
  // Só retorna se a imagem foi recebida DEPOIS da solicitação
  if (capturedImageBuffer && lastCaptureTimestamp > captureRequestTime) {
    return capturedImageBuffer;
  }
  return null;
}

module.exports = {
  requestCapture,
  getLastCapturedImage
};
