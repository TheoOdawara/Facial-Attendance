import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClassesPage from './pages/ClassesPage';
import ClassDetailPage from './pages/ClassDetailPage';
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/classes" element={<ClassesPage />} />
                      <Route path="/classes/:id" element={<ClassDetailPage />} />
                      <Route path="/students" element={<AttendanceListPage />} />
                      <Route path="/register-student" element={<StudentRegistrationPage />} />
                      <Route path="/mark-attendance" element={<MarkAttendancePage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;