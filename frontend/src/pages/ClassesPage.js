import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Group, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      console.log('🔍 Carregando turmas...');
      console.log('📡 API URL:', process.env.REACT_APP_API_URL);
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/classes`);
      console.log('✅ Turmas carregadas:', response.data);
      setClasses(response.data);
    } catch (err) {
      console.error('❌ Erro ao carregar turmas:', err);
      console.error('❌ Detalhes:', err.response?.data || err.message);
      setError('Erro ao carregar turmas');
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Turmas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie suas turmas e alunos
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/classes/new')}
        >
          Nova Turma
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {classes.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma turma cadastrada
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/classes/new')}
            sx={{ mt: 2 }}
          >
            Criar Primeira Turma
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {classes.map((classItem) => (
            <Grid item xs={12} sm={6} md={4} key={classItem.id}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {classItem.name}
                    </Typography>
                    <Chip
                      label={classItem.academic_period || 'N/A'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {classItem.description || 'Sem descrição'}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Group fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {classItem.student_count} aluno(s)
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block">
                    Professor: {classItem.professor_name}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(`/classes/${classItem.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
