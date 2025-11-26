import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AttendanceListPage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance`);
      setAttendance(res.data);
    } catch (err) {
      console.error('Erro ao carregar presenças:', err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAttendance = attendance.filter(a => {
    if (filter === 'recognized') return a.recognized;
    if (filter === 'unrecognized') return !a.recognized;
    return true;
  });

  const stats = {
    total: attendance.length,
    recognized: attendance.filter(a => a.recognized).length,
    unrecognized: attendance.filter(a => !a.recognized).length
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="card">
            <div className="loading">
              <div className="loading-spinner">⏳</div>
              <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>Carregando registros...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <h2>📊 Relatório de Presenças</h2>
            <p className="subtitle">
              Histórico completo de todas as tentativas de reconhecimento facial e presenças registradas
            </p>
          </div>

          {/* Estatísticas */}
          <div className="stats-bar">
            <div className="stat">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total de Registros</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ 
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {stats.recognized}
              </div>
              <div className="stat-label">Reconhecidos ✅</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ 
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {stats.unrecognized}
              </div>
              <div className="stat-label">Não Reconhecidos ❌</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="filter-buttons">
            <button
              onClick={() => setFilter('all')}
              className={`filter-btn ${filter === 'all' ? 'btn-primary active' : 'btn-secondary'}`}
            >
              📋 Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilter('recognized')}
              className={`filter-btn ${filter === 'recognized' ? 'btn-primary active' : 'btn-secondary'}`}
            >
              ✅ Reconhecidos ({stats.recognized})
            </button>
            <button
              onClick={() => setFilter('unrecognized')}
              className={`filter-btn ${filter === 'unrecognized' ? 'btn-primary active' : 'btn-secondary'}`}
            >
              ❌ Não Reconhecidos ({stats.unrecognized})
            </button>
          </div>

          {/* Tabela ou Estado Vazio */}
          {filteredAttendance.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">
                {attendance.length === 0 
                  ? 'Nenhum registro encontrado'
                  : 'Nenhum registro para este filtro'
                }
              </div>
              <div className="empty-description">
                {attendance.length === 0
                  ? 'As presenças marcadas aparecerão aqui automaticamente após o primeiro registro'
                  : 'Tente selecionar outro filtro para visualizar diferentes registros'
                }
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>👤 Nome</th>
                    <th>📋 Matrícula</th>
                    <th>📅 Data e Hora</th>
                    <th>🎯 Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((a, index) => (
                    <tr key={a.id || index}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {a.name || 'Não identificado'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {a.registration_number || '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(a.timestamp)}
                      </td>
                      <td>
                        <span className={`badge ${a.recognized ? 'success' : 'error'}`}>
                          {a.recognized ? '✅ Reconhecido' : '❌ Não Reconhecido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Info */}
          {filteredAttendance.length > 0 && (
            <div style={{
              marginTop: '2rem',
              padding: '1.25rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              border: '1px solid var(--gray-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📊</span>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)',
                  fontWeight: 600
                }}>
                  Exibindo {filteredAttendance.length} de {attendance.length} registros
                </span>
              </div>
              <button 
                onClick={fetchAttendance}
                className="btn-secondary"
                style={{
                  width: 'auto',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem'
                }}
              >
                🔄 Atualizar Lista
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceListPage;