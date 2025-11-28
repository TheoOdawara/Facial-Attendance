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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      console.log('✅ Turma carregada:', classResponse.data);
      setClassData(classResponse.data);

      // Carrega alunos da turma
      const studentsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/classes/${id}/students`
      );
      console.log('✅ Alunos carregados:', studentsResponse.data);
      setStudents(studentsResponse.data);

      // Carrega presenças da turma
      const attendanceResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/classes/${id}/attendance`
      );
      console.log('✅ Presenças carregadas:', attendanceResponse.data);
      setAttendance(attendanceResponse.data);
    } catch (err) {
      console.error('❌ Erro ao carregar dados da turma:', err);
      console.error('❌ Detalhes:', err.response?.data || err.message);
      setError('Erro ao carregar dados da turma.');
    } finally {
      setLoading(false);
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

      {/* Alunos da turma */}
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
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.registration_number}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={student.attendance_count || 0}
                        color="primary"
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Histórico de presenças */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Histórico de Presenças
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {attendance.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            Nenhuma presença registrada ainda
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Aluno</strong></TableCell>
                  <TableCell><strong>Matrícula</strong></TableCell>
                  <TableCell><strong>Data/Hora</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.slice(0, 20).map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>{record.student_name}</TableCell>
                    <TableCell>{record.registration_number}</TableCell>
                    <TableCell>
                      {format(
                        new Date(record.timestamp),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={record.recognized ? 'Presente' : 'Ausente'}
                        color={record.recognized ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {attendance.length > 20 && (
          <Box textAlign="center" mt={2}>
            <Typography variant="caption" color="text.secondary">
              Mostrando 20 de {attendance.length} registros
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
