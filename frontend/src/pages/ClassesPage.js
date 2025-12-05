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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  TextField,
} from '@mui/material';
import { Add, Group, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAcademicPeriod, setNewAcademicPeriod] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

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

  const confirmDelete = (classItem) => {
    setClassToDelete(classItem);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!classToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${process.env.REACT_APP_API_URL}/classes/${classToDelete.id}`, { headers });
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      // reload list
      loadClasses();
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
          onClick={() => setCreateDialogOpen(true)}
        >
          Adicionar Turma
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {classes.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma turma cadastrada
          </Typography>
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
                  <Button
                    fullWidth
                    color="error"
                    variant="outlined"
                    sx={{ mt: 1 }}
                    onClick={() => confirmDelete(classItem)}
                  >
                    Apagar Turma
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar remoção</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja remover a turma "{classToDelete?.name}"? Isso apenas marcará a turma como inativa.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete}>Remover</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Adicionar Turma</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              label="Nome da Turma"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Período Acadêmico"
              value={newAcademicPeriod}
              onChange={e => setNewAcademicPeriod(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Descrição"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              margin="normal"
            />
            {createError && <Alert severity="error" sx={{ mt: 2 }}>{createError}</Alert>}
            {createSuccess && <Alert severity="success" sx={{ mt: 2 }}>Turma criada com sucesso!</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>Cancelar</Button>
          <Button
            onClick={async () => {
              setCreateLoading(true);
              setCreateError('');
              setCreateSuccess(false);
              try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                await axios.post(
                  `${process.env.REACT_APP_API_URL}/classes`,
                  {
                    name: newName,
                    academic_period: newAcademicPeriod,
                    description: newDescription,
                  },
                  { headers }
                );
                setCreateSuccess(true);
                setTimeout(() => {
                  setCreateDialogOpen(false);
                  setNewName('');
                  setNewAcademicPeriod('');
                  setNewDescription('');
                  loadClasses();
                }, 1200);
              } catch (err) {
                setCreateError(err.response?.data?.error || 'Erro ao criar turma. Tente novamente.');
              } finally {
                setCreateLoading(false);
              }
            }}
            variant="contained"
            color="primary"
            disabled={createLoading || !newName}
          >
            {createLoading ? <CircularProgress size={24} /> : 'Adicionar Turma'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
