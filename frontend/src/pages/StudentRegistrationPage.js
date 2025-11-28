import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CameraAlt, PersonAdd } from '@mui/icons-material';
import axios from 'axios';

function StudentRegistrationPage() {
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [classesList, setClassesList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);

  const handleCaptureImage = async () => {
    if (!name || !registrationNumber) {
      setMessage('Preencha nome e matrícula antes de capturar a face.');
      setMessageType('warning');
      return;
    }
    setLoading(true);
    setMessage('Capturando imagem do ESP32...');
    setMessageType('info');
    
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/capture-face`);
      setCapturedImage(res.data.image);
      setMessage('Imagem capturada! Confira abaixo e clique em Cadastrar.');
      setMessageType('success');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erro ao capturar imagem.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Carrega lista de turmas (se houver token, o axios já será configurado pelo AuthProvider)
  React.useEffect(() => {
    let mounted = true;
    const loadClasses = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/classes`);
        if (!mounted) return;
        setClassesList(res.data || []);
        if (res.data && res.data.length > 0) {
          const hasDefault = res.data.find((c) => c.id === 1);
          setSelectedClassId(hasDefault ? 1 : res.data[0].id);
        }
      } catch (err) {
        console.warn('Não foi possível carregar turmas:', err.message);
      }
    };

    loadClasses();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !registrationNumber || !capturedImage) {
      setMessage('Capture a face antes de cadastrar.');
      setMessageType('warning');
      return;
    }
    setLoading(true);
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/students`, {
        name,
        registrationNumber,
        faceEncoding: capturedImage,
        classId: selectedClassId
      });
      setMessage('Aluno cadastrado com sucesso!');
      setMessageType('success');
      setName('');
      setRegistrationNumber('');
      setCapturedImage(null);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erro ao cadastrar aluno.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Cadastro de Aluno
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Capture a face do aluno usando o ESP32-CAM
      </Typography>

      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nome Completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Número de Matrícula"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            required
            margin="normal"
            disabled={loading}
          />

          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel id="select-class-label">Turma</InputLabel>
            <Select
              labelId="select-class-label"
              value={selectedClassId}
              label="Turma"
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classesList.length === 0 && (
                <MenuItem value={1}>Turma Padrão</MenuItem>
              )}
              {classesList.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} {c.academic_period ? `(${c.academic_period})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <CameraAlt />}
            onClick={handleCaptureImage}
            disabled={loading}
            sx={{ mt: 2, py: 1.5 }}
          >
            {loading ? 'Capturando...' : 'Capturar Face (ESP32)'}
          </Button>

          {capturedImage && (
            <Card sx={{ mt: 3 }}>
              <CardMedia
                component="img"
                image={`data:image/jpeg;base64,${capturedImage}`}
                alt="Face capturada"
                sx={{ maxHeight: 400, objectFit: 'contain' }}
              />
            </Card>
          )}

          {message && (
            <Alert severity={messageType} sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            startIcon={<PersonAdd />}
            disabled={loading || !capturedImage}
            sx={{ mt: 3, py: 1.5 }}
          >
            Cadastrar Aluno
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default StudentRegistrationPage;
