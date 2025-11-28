import React, { useState } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Chip,
} from '@mui/material';
import { CheckCircle, CameraAlt } from '@mui/icons-material';
import axios from 'axios';

function MarkAttendancePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [capturedImage, setCapturedImage] = useState(null);
  const [recognitionResult, setRecognitionResult] = useState(null);

  const handleMarkAttendance = async () => {
    setLoading(true);
    setMessage('Capturando imagem do ESP32 para reconhecimento...');
    setMessageType('info');
    setCapturedImage(null);
    setRecognitionResult(null);
    
    try {
      const captureRes = await axios.post(`${process.env.REACT_APP_API_URL}/capture-face`);
      setCapturedImage(captureRes.data.image);
      setMessage('🔍 Imagem capturada! Processando reconhecimento facial...');
      setMessageType('info');
      
      const attendanceRes = await axios.post(`${process.env.REACT_APP_API_URL}/attendance`, 
        { image: captureRes.data.image },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      setRecognitionResult(attendanceRes.data);
      setMessage('Presença registrada com sucesso!');
      setMessageType('success');
    } catch (err) {
      const errorMsg = err.response?.data?.error || '❌ Erro ao processar presença';
      setMessage(errorMsg);
      setMessageType('error');
      setRecognitionResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Marcar Presença
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Capture a face do aluno usando o ESP32-CAM para registrar presença automaticamente
      </Typography>

      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CameraAlt />}
          onClick={handleMarkAttendance}
          disabled={loading}
          sx={{ py: 2, mb: 3 }}
        >
          {loading ? 'Processando...' : 'Marcar Presença'}
        </Button>

        {message && (
          <Alert severity={messageType} sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {capturedImage && (
          <Card sx={{ mb: 3 }}>
            <CardMedia
              component="img"
              image={`data:image/jpeg;base64,${capturedImage}`}
              alt="Face capturada"
              sx={{ maxHeight: 400, objectFit: 'contain' }}
            />
          </Card>
        )}

        {recognitionResult && recognitionResult.attendance && (
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CheckCircle />
                <Typography variant="h6" fontWeight="bold">
                  Presença Registrada
                </Typography>
              </Box>
              <Typography variant="body1" gutterBottom>
                <strong>Aluno:</strong> {recognitionResult.recognition?.student_name || 'N/A'}
              </Typography>
              <Chip
                label={`Confiança: ${(recognitionResult.recognition?.confidence * 100 || 0).toFixed(1)}%`}
                color="success"
                size="small"
              />
            </CardContent>
          </Card>
        )}
      </Paper>
    </Box>
  );
}

export default MarkAttendancePage;