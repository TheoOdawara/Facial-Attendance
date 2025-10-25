import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StudentRegistrationPage from './pages/StudentRegistrationPage';
import AttendanceListPage from './pages/AttendanceListPage';
import MarkAttendancePage from './pages/MarkAttendancePage';

function App() {
  return (
    <Router>
      <nav style={{ padding: 16, background: '#f5f5f5' }}>
        <Link to="/" style={{ marginRight: 16 }}>Cadastro de Aluno</Link>
        <Link to="/mark-attendance" style={{ marginRight: 16 }}>Marcar Presença</Link>
        <Link to="/attendance">Consulta de Presenças</Link>
      </nav>
      <Routes>
        <Route path="/" element={<StudentRegistrationPage />} />
        <Route path="/mark-attendance" element={<MarkAttendancePage />} />
        <Route path="/attendance" element={<AttendanceListPage />} />
      </Routes>
    </Router>
  );
}

export default App;
