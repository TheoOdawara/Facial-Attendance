import React, { useState } from 'react';
import axios from 'axios';

function StudentRegistrationPage() {
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCaptureImage = async () => {
    if (!name || !registrationNumber) {
      setMessage('Preencha nome e matrícula antes de capturar a face.');
      return;
    }
    setLoading(true);
    setMessage('Capturando imagem do ESP32...');
    try {
      // Chama endpoint que aciona ESP32 via MQTT e retorna imagem
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/capture-face`);
      setCapturedImage(res.data.image); // Base64 ou URL da imagem
      setMessage('Imagem capturada! Confira abaixo e clique em Cadastrar.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erro ao capturar imagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !registrationNumber || !capturedImage) {
      setMessage('Capture a face antes de cadastrar.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/students`, {
        name,
        registrationNumber,
        faceEncoding: capturedImage
      });
      setMessage('Aluno cadastrado com sucesso!');
      setName('');
      setRegistrationNumber('');
      setCapturedImage(null);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erro ao cadastrar aluno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', background: 'white', padding: 32, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <h2 style={{ marginBottom: 24, color: '#333' }}>Cadastro de Aluno</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome:</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
        </div>
        <div>
          <label>Matrícula:</label>
          <input type="text" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} required disabled={loading} />
        </div>
        <button type="button" onClick={handleCaptureImage} disabled={loading}>
          {loading ? 'Capturando...' : 'Capturar Face (ESP32)'}
        </button>
        {capturedImage && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>Pré-visualização:</p>
            <img src={`data:image/jpeg;base64,${capturedImage}`} alt="Face capturada" style={{ maxWidth: '100%', borderRadius: 8, border: '2px solid #667eea' }} />
          </div>
        )}
        <button type="submit" disabled={loading || !capturedImage} style={{ marginTop: 16 }}>
          Cadastrar Aluno
        </button>
      </form>
      {message && <p style={{ marginTop: 16, color: message.includes('sucesso') ? 'green' : 'red', fontWeight: 600 }}>{message}</p>}
    </div>
  );
}

export default StudentRegistrationPage;
