import React, { useState } from 'react';
import axios from 'axios';

function StudentRegistrationPage() {
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
  };

  const handleCaptureImage = async () => {
    if (!name || !registrationNumber) {
      showMessage('⚠️ Preencha nome e matrícula antes de capturar a face.', 'error');
      return;
    }
    setLoading(true);
    showMessage('📸 Capturando imagem do ESP32...', 'info');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/capture-face`);
      setCapturedImage(res.data.image);
      showMessage('✅ Imagem capturada com sucesso! Confira abaixo e clique em Cadastrar.', 'success');
    } catch (err) {
      showMessage(err.response?.data?.error || '❌ Erro ao capturar imagem.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !registrationNumber || !capturedImage) {
      showMessage('⚠️ Capture a face antes de cadastrar.', 'error');
      return;
    }
    setLoading(true);
    showMessage('💾 Cadastrando aluno...', 'info');
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/students`, {
        name,
        registrationNumber,
        faceEncoding: capturedImage
      });
      showMessage('🎉 Aluno cadastrado com sucesso!', 'success');
      setName('');
      setRegistrationNumber('');
      setCapturedImage(null);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      showMessage(err.response?.data?.error || '❌ Erro ao cadastrar aluno.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <h2>👤 Cadastro de Aluno</h2>
            <p className="subtitle">
              Registre um novo aluno no sistema com reconhecimento facial avançado
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome Completo</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Digite o nome completo do aluno"
                required 
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Número de Matrícula</label>
              <input 
                type="text" 
                value={registrationNumber} 
                onChange={e => setRegistrationNumber(e.target.value)} 
                placeholder="Digite a matrícula (ex: 2024001)"
                required 
                disabled={loading}
              />
            </div>
            
            <button 
              type="button" 
              onClick={handleCaptureImage} 
              disabled={loading || !name || !registrationNumber}
              className="btn-secondary btn-icon"
            >
              {loading ? '⏳ Capturando...' : '📸 Capturar Face via ESP32'}
            </button>
            
            {capturedImage && (
              <div className="image-preview">
                <label style={{ marginTop: 0 }}>✨ Prévia da Imagem Capturada</label>
                <div className="image-preview-container">
                  <img 
                    src={`data:image/jpeg;base64,${capturedImage}`} 
                    alt="Face capturada" 
                  />
                </div>
                <p style={{ 
                  marginTop: '1rem', 
                  textAlign: 'center', 
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  A imagem está ótima? Clique em cadastrar para finalizar! 🎯
                </p>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading || !capturedImage} 
              className="btn-primary btn-icon"
              style={{ marginTop: capturedImage ? '1.5rem' : '1rem' }}
            >
              {loading ? '⏳ Cadastrando...' : '💾 Cadastrar Aluno'}
            </button>
          </form>
          
          {message && (
            <div 
              className={`badge ${messageType}`}
              style={{ 
                marginTop: '1.5rem', 
                width: '100%', 
                justifyContent: 'center',
                padding: '1rem 1.5rem',
                fontSize: '0.9375rem'
              }}
            >
              {message}
            </div>
          )}

          {/* Info Card */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'var(--primary-blue-50)',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--primary-blue-100)',
            display: 'flex',
            alignItems: 'start',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>💡</span>
            <div>
              <p style={{ 
                margin: 0, 
                color: 'var(--primary-blue-dark)',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                Dicas para melhor captura:
              </p>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '1.25rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                lineHeight: 1.7
              }}>
                <li>Posicione-se de frente para a câmera</li>
                <li>Certifique-se de que há boa iluminação</li>
                <li>Mantenha uma expressão neutra</li>
                <li>Evite acessórios que cubram o rosto</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentRegistrationPage;