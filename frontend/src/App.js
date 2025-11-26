import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import StudentRegistrationPage from './pages/StudentRegistrationPage';
import AttendanceListPage from './pages/AttendanceListPage';
import MarkAttendancePage from './pages/MarkAttendancePage';

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  const navItems = [
    { path: '/', label: '👤 Cadastro de Aluno', icon: '👤' },
    { path: '/mark-attendance', label: '✅ Marcar Presença', icon: '✅' },
    { path: '/attendance', label: '📊 Consulta de Presenças', icon: '📊' }
  ];
  
  return (
    <nav>
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginRight: 'auto',
          paddingRight: '2rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-yellow) 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            🎓
          </div>
          <div>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-yellow) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              Facial Attendance
            </div>
            <div style={{
              fontSize: '0.6875rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '2px'
            }}>
              Sistema de Presença
            </div>
          </div>
        </div>
        
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path} 
            className={isActive(item.path) ? 'active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<StudentRegistrationPage />} />
        <Route path="/mark-attendance" element={<MarkAttendancePage />} />
        <Route path="/attendance" element={<AttendanceListPage />} />
      </Routes>
    </Router>
  );
}

export default App;