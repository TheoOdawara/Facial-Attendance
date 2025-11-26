import React, { useState } from 'react';
import axios from 'axios';

function MarkAttendancePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [recognitionResult, setRecognitionResult] = useState(null);

  const handleMarkAttendance = async () => {
    setLoading(true);
    setMessage('📸 Capturando imagem do ESP32...');
    setMessageType('info');
    setCapturedImage(null);
    setRecognitionResult(null);
    
    try {
      // Captura a imagem
      const captureRes = await axios.post(`${process.env.REACT_APP_API_URL}/capture-face`);
      setCapturedImage(captureRes.data.image);
      setMessage('🔍 Imagem capturada! Processando reconhecimento facial...');
      setMessageType('info');
      
      // Processa o reconhecimento
      const attendanceRes = await axios.post(`${process.env.REACT_APP_API_URL}/attendance`, 
        { image: captureRes.data.image },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      setRecognitionResult(attendanceRes.data);
      setMessage('');
      setMessageType('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || '❌ Erro ao processar presença';
      setMessage(errorMsg);
      setMessageType('error');
      setRecognitionResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <h2>✅ Marcar Presença</h2>
            <p className="subtitle">
              Sistema de registro automático de presença por reconhecimento facial em tempo real
            </p>
          </div>
          
          {/* Botão Principal */}
          <button 
            onClick={handleMarkAttendance} 
            disabled={loading}
            className="btn-primary btn-icon"
            style={{ 
              padding: '1.25rem',
              fontSize: '1.125rem',
            }}
          >
            {loading ? '⏳ Processando reconhecimento...' : '📸 Capturar e Reconhecer Face'}
          </button>

          {/* Mensagem de Status */}
          {message && !recognitionResult && (
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

          {/* Imagem Capturada */}
          {capturedImage && (
            <div className="image-preview">
              <label style={{ marginTop: 0 }}>📷 Imagem Capturada</label>
              <div className="image-preview-container">
                <img 
                  src={`data:image/jpeg;base64,${capturedImage}`} 
                  alt="Face capturada" 
                />
              </div>
            </div>
          )}

          {/* Resultado do Reconhecimento */}
          {recognitionResult && (
            <div className={`status-card ${recognitionResult.attendance ? 'success' : 'error'}`}>
              <div className="status-header">
                <span className="status-icon">
                  {recognitionResult.attendance ? '✅' : '❌'}
                </span>
                <h3 className="status-title">
                  {recognitionResult.attendance ? 'Presença Registrada com Sucesso!' : 'Face Não Reconhecida'}
                </h3>
              </div>
              
              {/* Detalhes do Reconhecimento - Sucesso */}
              {recognitionResult.attendance && recognitionResult.recognition && (
                <div className="status-details">
                  <div className="status-detail">
                    <strong>👤 Nome do Aluno:</strong> {recognitionResult.recognition.student_name || 'N/A'}
                  </div>
                  <div className="status-detail">
                    <strong>🎯 Nível de Confiança:</strong> {recognitionResult.recognition.confidence || 'N/A'}
                  </div>
                  <div className="status-detail">
                    <strong>📋 Matrícula:</strong> {recognitionResult.recognition.registration_number || 'N/A'}
                  </div>
                  <div className="status-detail">
                    <strong>🕐 Horário do Registro:</strong> {new Date().toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
              )}
              
              {/* Mensagem de Erro - Não Reconhecido */}
              {!recognitionResult.attendance && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    marginBottom: '1rem'
                  }}>
                    O rosto não foi reconhecido no sistema. Por favor, verifique se:
                  </p>
                  <ul style={{ 
                    marginTop: '0.75rem',
                    marginBottom: 0,
                    paddingLeft: '1.5rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.7
                  }}>
                    <li>O aluno está cadastrado no sistema</li>
                    <li>A iluminação está adequada</li>
                    <li>O rosto está claramente visível e de frente</li>
                    <li>Não há obstáculos cobrindo o rosto</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Card de Instruções */}
          {!recognitionResult && !loading && (
            <div style={{
              marginTop: '2rem',
              padding: '1.75rem',
              background: 'linear-gradient(135deg, var(--primary-blue-50) 0%, var(--accent-yellow-50) 100%)',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--primary-blue-100)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📋</span>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  Como Funciona o Sistema
                </h3>
              </div>
              <div style={{
                display: 'grid',
                gap: '1rem',
                fontSize: '0.9375rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                  <span style={{ 
                    fontWeight: 800, 
                    color: 'var(--primary-blue)',
                    fontSize: '1.125rem',
                    minWidth: '24px'
                  }}>1.</span>
                  <span>Clique no botão <strong>"Capturar e Reconhecer Face"</strong> para iniciar o processo</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                  <span style={{ 
                    fontWeight: 800, 
                    color: 'var(--primary-blue)',
                    fontSize: '1.125rem',
                    minWidth: '24px'
                  }}>2.</span>
                  <span>O sistema captura automaticamente a imagem do ESP32-CAM</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                  <span style={{ 
                    fontWeight: 800, 
                    color: 'var(--primary-blue)',
                    fontSize: '1.125rem',
                    minWidth: '24px'
                  }}>3.</span>
                  <span>A inteligência artificial processa e compara com os rostos cadastrados</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                  <span style={{ 
                    fontWeight: 800, 
                    color: 'var(--primary-blue)',
                    fontSize: '1.125rem',
                    minWidth: '24px'
                  }}>4.</span>
                  <span>Se reconhecido, a presença é <strong>automaticamente registrada</strong> no banco de dados</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                  <span style={{ 
                    fontWeight: 800, 
                    color: 'var(--primary-blue)',
                    fontSize: '1.125rem',
                    minWidth: '24px'
                  }}>5.</span>
                  <span>Consulte todos os registros na página <strong>"Consulta de Presenças"</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Dicas de Boas Práticas */}
          {!recognitionResult && !loading && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: 'var(--accent-yellow-50)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--accent-yellow)',
              display: 'flex',
              alignItems: 'start',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
              <div>
                <p style={{ 
                  margin: 0, 
                  color: 'var(--accent-yellow-dark)',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  fontSize: '0.9375rem'
                }}>
                  Dicas para Melhor Reconhecimento:
                </p>
                <ul style={{ 
                  margin: 0, 
                  paddingLeft: '1.25rem',
                  color: 'var(--gray-700)',
                  fontSize: '0.875rem',
                  lineHeight: 1.7
                }}>
                  <li>Posicione-se de frente para a câmera ESP32</li>
                  <li>Mantenha o rosto bem iluminado e visível</li>
                  <li>Evite usar óculos escuros ou acessórios que cubram o rosto</li>
                  <li>Mantenha uma distância adequada da câmera (30-50cm)</li>
                  <li>Aguarde o processamento completo antes de se mover</li>
                </ul>
              </div>
            </div>
          )}

          {/* Botão para Tentar Novamente */}
          {recognitionResult && !recognitionResult.attendance && (
            <button 
              onClick={handleMarkAttendance}
              className="btn-secondary btn-icon"
              style={{ marginTop: '1.5rem' }}
            >
              🔄 Tentar Novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarkAttendancePage;