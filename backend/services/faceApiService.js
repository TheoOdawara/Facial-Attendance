/**
 * Serviço para integração com a API REST Python de reconhecimento facial.
 * Faz requisições HTTP para o serviço Flask/OpenCV.
 * @module services/faceApiService
 */
const axios = require('axios');

const FACE_API_URL = process.env.PYTHON_FACE_API_URL || 'http://localhost:5000/recognize';

/**
 * Envia uma imagem para a API Python e retorna o resultado do reconhecimento facial.
 * @param {Buffer|string} imageBuffer - Imagem em buffer (binário) ou base64.
 * @returns {Promise<object>} Resultado do reconhecimento facial.
 */
async function recognizeFace(imageBuffer) {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer, 'photo.jpg');

    const response = await axios.post(FACE_API_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao chamar a API de reconhecimento facial:', error.message);
    throw new Error('Erro no reconhecimento facial');
  }
}

module.exports = {
  recognizeFace
};
