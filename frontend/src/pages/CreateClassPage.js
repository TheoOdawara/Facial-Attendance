import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CreateClassPage() {
  const [name, setName] = useState('');
  const [academicPeriod, setAcademicPeriod] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/classes`,
        {
          name,
          academic_period: academicPeriod,
          description,
        },
        { headers }
      );
      setSuccess(true);
      setTimeout(() => {
        navigate('/classes');
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Erro ao criar turma. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={480} mx="auto" mt={6} p={3} boxShadow={3} borderRadius={2} bgcolor="#fff">
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Adicionar Turma
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nome da Turma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Período Acadêmico"
          value={academicPeriod}
          onChange={(e) => setAcademicPeriod(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>Turma criada com sucesso!</Alert>}
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Adicionar Turma'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}