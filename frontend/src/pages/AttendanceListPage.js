import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function AttendanceListPage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance`);
        setAttendance(res.data);
      } catch (err) {
        console.error('Erro ao carregar presenças:', err);
        setError('Erro ao carregar presenças');
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Presenças Registradas
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Histórico completo de presenças do sistema
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Aluno</strong></TableCell>
              <TableCell><strong>Matrícula</strong></TableCell>
              <TableCell><strong>Turma</strong></TableCell>
              <TableCell><strong>Data/Hora</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Nenhuma presença registrada ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              attendance.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{record.name}</TableCell>
                  <TableCell>{record.registration_number}</TableCell>
                  <TableCell>{record.class_name || 'N/A'}</TableCell>
                  <TableCell>
                    {format(new Date(record.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={record.recognized ? <CheckCircle /> : <Cancel />}
                      label={record.recognized ? 'Reconhecido' : 'Não reconhecido'}
                      color={record.recognized ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AttendanceListPage;