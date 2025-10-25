import React, { useState } from 'react';
import axios from 'axios';

function MarkAttendancePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [recognitionResult, setRecognitionResult] = useState(null);

  const handleMarkAttendance = async () => {
    setLoading(true);
    setMessage('Capturando imagem do ESP32 para reconhecimento...');
    setCapturedImage(null);
    setRecognitionResult(null);
    
    try {
      // Captura imagem do ESP32
      const captureRes = await axios.post(`${process.env.REACT_APP_API_URL}/capture-face`);
      setCapturedImage(captureRes.data.image);
      setMessage('Imagem capturada! Reconhecendo face...');
      
      // Envia para reconhecimento e registro de presença
      const attendanceRes = await axios.post(`${process.env.REACT_APP_API_URL}/attendance`, 
        { image: captureRes.data.image },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      setRecognitionResult(attendanceRes.data);
      setMessage('Presença registrada com sucesso!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro ao marcar presença';
      setMessage(errorMsg);
      setRecognitionResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: 'white', padding: 32, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <h2 style={{ marginBottom: 24, color: '#333' }}>Marcar Presença</h2>
      
      <p style={{ marginBottom: 24, color: '#666' }}>
        Clique no botão abaixo para capturar sua face e registrar presença automaticamente.
      </p>
      
      <button 
        onClick={handleMarkAttendance} 
        disabled={loading}
        style={{ 
          width: '100%',
          padding: '16px',
          fontSize: '1.1rem',
          background: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          transition: 'background 0.3s'
        }}
      >
        {loading ? 'Processando...' : '📸 Marcar Presença'}
      </button>

      {capturedImage && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>Imagem Capturada:</p>
          <img 
            src={`data:image/jpeg;base64,${capturedImage}`} 
            alt="Face capturada" 
            style={{ maxWidth: '100%', borderRadius: 8, border: '2px solid #667eea' }} 
          />
        </div>
      )}

      {recognitionResult && (
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: recognitionResult.attendance ? '#d4edda' : '#f8d7da',
          border: `1px solid ${recognitionResult.attendance ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: 8,
          color: '#333'
        }}>
          <h3 style={{ marginBottom: 8 }}>
            {recognitionResult.attendance ? '✅ Presença Registrada' : '❌ Não Reconhecido'}
          </h3>
          {recognitionResult.attendance && recognitionResult.recognition && (
            <div>
              <p><strong>Aluno:</strong> {recognitionResult.recognition.student_name || 'N/A'}</p>
              <p><strong>Confiança:</strong> {recognitionResult.recognition.confidence || 'N/A'}</p>
            </div>
          )}
        </div>
      )}

      {message && (
        <p style={{ 
          marginTop: 16, 
          color: message.includes('sucesso') ? 'green' : message.includes('Erro') ? 'red' : '#667eea',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default MarkAttendancePage;