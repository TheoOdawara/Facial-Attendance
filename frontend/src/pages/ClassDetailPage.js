import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Group, School, CalendarToday } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    try {
      console.log('🔍 Carregando detalhes da turma:', id);

      // Carrega dados da turma
      const classResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/classes/${id}`
      );
      setClassData(classResponse.data);

      // Carrega alunos da turma
      const studentsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/classes/${id}/students`
      );
      setStudents(studentsResponse.data);

      // Carrega presenças da turma
      const attendanceResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/classes/${id}/attendance`
      );
  setAttendance(attendanceResponse.data);

      // Carrega estatísticas detalhadas da turma
      const statsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/classes/${id}/stats`
      );
      setStats(statsResponse.data);
    } catch (err) {
      console.error('❌ Erro ao carregar dados da turma:', err);
      setError('Erro ao carregar dados da turma.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => setDeleteDialogOpen(true);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${process.env.REACT_APP_API_URL}/classes/${id}`, { headers });
      setDeleteDialogOpen(false);
      navigate('/classes');
    } catch (err) {
      console.error('Erro ao remover turma:', err, err.response?.data || err.message);
      setError('Erro ao remover turma');
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/classes')}>
          Voltar para Turmas
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/classes')}
          variant="outlined"
        >
          Voltar
        </Button>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {classData?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {classData?.description || 'Sem descrição'}
          </Typography>
        </Box>
      </Box>

      {/* Métricas detalhadas da turma */}
      {stats && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Taxa de Presença</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {stats.attendanceRate}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Total de Faltas</Typography>
                  <Typography variant="h5" fontWeight="bold" color="error">
                    {stats.totalAbsences}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Presentes Hoje</Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {stats.presentToday.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Faltantes Hoje</Typography>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {stats.absentToday.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

        </>
      )}

      {/* Informações da turma */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <School sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Período
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {classData?.academic_period || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <Box sx={{ p: 2 }}>
              <Button color="error" variant="outlined" onClick={confirmDelete}>Remover Turma</Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Group sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total de Alunos
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {students.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CalendarToday sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total de Presenças
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {attendance.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alunos da turma com presenças, faltas e status de hoje */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Alunos da Turma
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {students.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            Nenhum aluno cadastrado nesta turma
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nome</strong></TableCell>
                  <TableCell><strong>Matrícula</strong></TableCell>
                  <TableCell align="center"><strong>Presenças</strong></TableCell>
                  <TableCell align="center"><strong>Faltas</strong></TableCell>
                  <TableCell align="center"><strong>Status Hoje</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => {
                  // Cálculo de faltas
                  const totalDays = stats?.totalDays || 0;
                  const presencas = student.attendance_count || 0;
                  const faltas = totalDays - presencas;
                  // Status de hoje
                  const presenteHoje = stats?.presentToday.some(a => a.id === student.id);
                  const faltanteHoje = stats?.absentToday.some(a => a.id === student.id);
                  let statusHoje = '-';
                  if (presenteHoje) statusHoje = 'Presente';
                  else if (faltanteHoje) statusHoje = 'Faltante';
                  return (
                    <TableRow key={student.id} hover>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.registration_number}</TableCell>
                      <TableCell align="center">
                        <Chip label={presencas} color="primary" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={faltas >= 0 ? faltas : 0} color="error" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={statusHoje}
                          color={statusHoje === 'Presente' ? 'success' : statusHoje === 'Faltante' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={student.active ? 'Ativo' : 'Inativo'}
                          color={student.active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Histórico de presenças removido. Será exibido apenas na página de detalhes do aluno. */}
    </Box>
  );
}
