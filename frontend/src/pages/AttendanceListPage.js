import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AttendanceListPage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance`);
        setAttendance(res.data);
      } catch (err) {
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', background: 'white', padding: 32, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <h2 style={{ marginBottom: 24, color: '#333' }}>Presenças Registradas</h2>
      {loading ? <p>Carregando...</p> : (
        attendance.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Nenhuma presença registrada ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Data/Hora</th>
                <th>Reconhecido</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(a => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.registration_number}</td>
                  <td>{new Date(a.timestamp).toLocaleString()}</td>
                  <td>{a.recognized ? '✅ Sim' : '❌ Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

export default AttendanceListPage;
